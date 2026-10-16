// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { UnderwriteVault } from "../../src/UnderwriteVault.sol";
import { MockUSDC } from "../../src/MockUSDC.sol";
import { MockBondPool } from "../mocks/MockBondPool.sol";

contract InvariantHandler is Test {
    UnderwriteVault public immutable vault;
    MockUSDC public immutable token;
    MockBondPool public immutable bondPool;

    bytes32 public immutable qualId;
    address public immutable agentKey;
    address public immutable owner;
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

    constructor(
        UnderwriteVault _vault,
        MockUSDC _token,
        MockBondPool _bondPool,
        bytes32 _qualId,
        address _agentKey,
        address _owner,
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
        try vault.pay(recipient, amount, invoiceKey, memoHash) returns (uint256) {
            ghost_totalT1Paid += amount;
            ghost_successfulT1Count++;
            ghost_paidInvoiceKeys.push(invoiceKey);
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
