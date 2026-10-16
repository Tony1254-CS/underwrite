// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { UnderwriteVault } from "../../src/UnderwriteVault.sol";
import { MockUSDC } from "../../src/MockUSDC.sol";
import { BondPool } from "../../src/BondPool.sol";

contract InvariantHandler is Test {
    UnderwriteVault public immutable vault;
    MockUSDC public immutable token;
    BondPool public immutable bondPool;

    bytes32 public immutable qualId;
    address public immutable agentKey;
    address public immutable owner;
    address public immutable adjudicator;
    address public immutable vendor1;
    address public immutable vendor2;
    address public immutable unallowedRecipient;

    // Ghost variables for invariant checking
    uint256 public ghost_totalT1Paid;
    uint256 public ghost_totalT2Paid;
    uint256 public ghost_successfulT1Count;
    uint256 public ghost_successfulT2Count;

    bytes32[] public ghost_paidInvoiceKeys;
    uint256[] public ghost_windowIds;
    mapping(uint256 => bool) private seenWindows;

    uint256[] public pendingIds;
    uint256[] public t1PaymentIds;
    uint256[] public filedClaimIds;

    // Tracking for INV-11 & INV-14
    mapping(uint256 => uint256) public ghost_paymentPayoutCount; // paymentId => count of approved claim payouts
    mapping(uint256 => uint256) public ghost_paymentPayoutTotal; // paymentId => total payout amount
    uint256 public ghost_totalPayoutsForQual; // sum of all payouts for qualId

    constructor(
        UnderwriteVault _vault,
        MockUSDC _token,
        BondPool _bondPool,
        bytes32 _qualId,
        address _agentKey,
        address _owner,
        address _adjudicator,
        address _vendor1,
        address _vendor2,
        address _unallowedRecipient
    ) {
        vault = _vault;
        token = _token;
        bondPool = _bondPool;
        qualId = _qualId;
        agentKey = _agentKey;
        owner = _owner;
        adjudicator = _adjudicator;
        vendor1 = _vendor1;
        vendor2 = _vendor2;
        unallowedRecipient = _unallowedRecipient;
    }

    function getPaidInvoiceKeys() external view returns (bytes32[] memory) {
        return ghost_paidInvoiceKeys;
    }

    function getWindowIds() external view returns (uint256[] memory) {
        return ghost_windowIds;
    }

    function getT1PaymentIds() external view returns (uint256[] memory) {
        return t1PaymentIds;
    }

    function pay(uint256 recipientChoice, uint256 amount, uint256 invoiceNonce, uint256 memoNonce) external {
        address recipient = _selectRecipient(recipientChoice);
        amount = bound(amount, 0, 500_000_000); // 0 to 500 USDC
        bytes32 invoiceKey = keccak256(abi.encode("inv-fuzz", invoiceNonce));
        bytes32 memoHash = keccak256(abi.encode("memo-fuzz", memoNonce));

        uint256 windowId = block.timestamp / 86400;
        if (!seenWindows[windowId]) {
            seenWindows[windowId] = true;
            ghost_windowIds.push(windowId);
        }

        vm.prank(agentKey);
        try vault.pay(recipient, amount, invoiceKey, memoHash) returns (uint256 pid) {
            ghost_totalT1Paid += amount;
            ghost_successfulT1Count++;
            ghost_paidInvoiceKeys.push(invoiceKey);
            t1PaymentIds.push(pid);
        } catch { }
    }

    function requestPayment(uint256 recipientChoice, uint256 amount, uint256 invoiceNonce, uint256 memoNonce) external {
        address recipient = _selectRecipient(recipientChoice);
        amount = bound(amount, 0, 2000_000_000); // 0 to 2000 USDC
        bytes32 invoiceKey = keccak256(abi.encode("t2-inv-fuzz", invoiceNonce));
        bytes32 memoHash = keccak256(abi.encode("t2-memo-fuzz", memoNonce));

        vm.prank(agentKey);
        try vault.requestPayment(recipient, amount, invoiceKey, memoHash) returns (uint256 id) {
            pendingIds.push(id);
        } catch { }
    }

    function executePending(uint256 pendingIndex) external {
        if (pendingIds.length == 0) return;
        uint256 id = pendingIds[pendingIndex % pendingIds.length];

        (,, uint256 amount, bytes32 invoiceKey,,,) = vault.pending(id);

        try vault.executePending(id) returns (uint256) {
            ghost_totalT2Paid += amount;
            ghost_successfulT2Count++;
            ghost_paidInvoiceKeys.push(invoiceKey);
        } catch { }
    }

    function veto(uint256 pendingIndex) external {
        if (pendingIds.length == 0) return;
        uint256 id = pendingIds[pendingIndex % pendingIds.length];

        vm.prank(owner);
        try vault.veto(id) { } catch { }
    }

    function reconcile(uint256 upToPaymentIdSeed) external {
        uint256 nextId = vault.nextPaymentId();
        if (nextId <= 1) return;

        uint256 upToPaymentId = bound(upToPaymentIdSeed, 1, nextId - 1);

        vm.prank(owner);
        try vault.reconcile(qualId, upToPaymentId) { } catch { }
    }

    function fileClaim(uint256 paymentIndex, uint256 lossFractionSeed) external {
        if (t1PaymentIds.length == 0) return;
        uint256 pid = t1PaymentIds[paymentIndex % t1PaymentIds.length];

        (,, uint256 pAmount,,,,,) = vault.payments(pid);
        if (pAmount == 0) return;

        uint256 lossAmount = bound(lossFractionSeed, 1, pAmount);
        bytes32 evidenceHash = keccak256(abi.encode("claim-evidence", pid, lossAmount));

        vm.prank(owner);
        try bondPool.fileClaim(pid, lossAmount, evidenceHash) returns (uint256 claimId) {
            filedClaimIds.push(claimId);
        } catch { }
    }

    function approveClaim(uint256 claimIndex, uint256 lossFractionSeed) external {
        if (filedClaimIds.length == 0) return;
        uint256 claimId = filedClaimIds[claimIndex % filedClaimIds.length];

        BondPool.Claim memory c = bondPool.getClaim(claimId);
        if (c.status != BondPool.ClaimStatus.FILED) return;

        uint256 approvedLoss = bound(lossFractionSeed, 1, c.lossAmount);

        vm.prank(adjudicator);
        try bondPool.approveClaim(claimId, approvedLoss) returns (uint256 payout) {
            ghost_paymentPayoutCount[c.paymentId]++;
            ghost_paymentPayoutTotal[c.paymentId] += payout;
            ghost_totalPayoutsForQual += payout;
        } catch { }
    }

    function rejectClaim(uint256 claimIndex) external {
        if (filedClaimIds.length == 0) return;
        uint256 claimId = filedClaimIds[claimIndex % filedClaimIds.length];

        BondPool.Claim memory c = bondPool.getClaim(claimId);
        if (c.status != BondPool.ClaimStatus.FILED) return;

        vm.prank(adjudicator);
        try bondPool.rejectClaim(claimId, keccak256("rejected")) { } catch { }
    }

    function warpTime(uint256 jump) external {
        jump = bound(jump, 1, 86400 * 2); // 1s up to 2 days
        vm.warp(block.timestamp + jump);

        uint256 windowId = block.timestamp / 86400;
        if (!seenWindows[windowId]) {
            seenWindows[windowId] = true;
            ghost_windowIds.push(windowId);
        }
    }

    function _selectRecipient(uint256 choice) internal view returns (address) {
        uint256 r = choice % 3;
        if (r == 0) return vendor1;
        if (r == 1) return vendor2;
        return unallowedRecipient;
    }
}
