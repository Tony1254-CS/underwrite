// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { UnderwriteVault } from "../src/UnderwriteVault.sol";
import { BondPool } from "../src/BondPool.sol";
import { VaultErrors } from "../src/interfaces/VaultErrors.sol";
import { BondPoolErrors } from "../src/interfaces/BondPoolErrors.sol";

contract BondPoolFuzzTest is Test, VaultErrors, BondPoolErrors {
    MockUSDC public token;
    BondPool public bondPool;
    UnderwriteVault public vault;

    address public owner = address(0xA1);
    uint256 public examinerPk = 0xB1E5;
    address public examiner;
    address public guardian = address(0xC1);
    address public underwriter = address(0xD1);
    address public adjudicator = address(0xE1);

    address public agent = address(0xF1);
    address public recipient = address(0xCAFE);

    bytes32 public configHash = keccak256("agent-config-fuzz");
    bytes32 public corpusHash = keccak256("corpus-fuzz");

    uint256 public constant DEDUCTIBLE = 5e6; // 5 USDC
    uint256 public constant PER_CLAIM_CAP = 500e6; // 500 USDC
    uint256 public constant CLAIM_GRACE = 7 days;

    function setUp() public {
        examiner = vm.addr(examinerPk);
        token = new MockUSDC();

        bondPool = new BondPool(underwriter, adjudicator, address(token), DEDUCTIBLE, PER_CLAIM_CAP, CLAIM_GRACE);

        UnderwriteVault.Ceilings memory ceilings =
            UnderwriteVault.Ceilings({ perTx: 300e6, perWindow: 1000e6, t2PerTx: 2000e6 });

        vault = new UnderwriteVault(
            owner, examiner, guardian, address(bondPool), address(token), ceilings, 86400, 500e6, 300, 300
        );

        vm.prank(underwriter);
        bondPool.setVault(address(vault));

        token.mint(address(vault), 100_000e6);
        token.mint(underwriter, 100_000e6);

        vm.startPrank(underwriter);
        token.approve(address(bondPool), type(uint256).max);
        bondPool.deposit(50_000e6);
        vm.stopPrank();

        vm.prank(owner);
        vault.addRecipient(recipient, 10_000e6);
        vm.warp(block.timestamp + 301);
    }

    function _activate(uint256 lockAmount) internal returns (bytes32 qualId) {
        vm.prank(examiner);
        uint256 commitId = vault.commitExam(configHash, corpusHash);

        qualId = keccak256(abi.encode(configHash, commitId));
        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: qualId,
            vault: address(vault),
            agentKey: agent,
            configHash: configHash,
            reportHash: keccak256("report-fuzz"),
            corpusHash: corpusHash,
            examCommitId: commitId,
            ownerInputsHash: keccak256("inputs-fuzz"),
            t1MaxPerTx: 250e6,
            t1MaxPerWindow: lockAmount,
            t2MaxPerTx: 1000e6,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(a)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.prank(owner);
        vault.activateQualification(a, sig);
    }

    /// @notice INV-11: Sum of payouts for a qual <= locked amount; at most one payout per paymentId; payout matches min caps.
    function testFuzz_INV11_payout_bounds_and_single_payout(
        uint256 lockAmount,
        uint256 payAmount,
        uint256 lossAmount,
        uint256 approvedLoss
    ) public {
        lockAmount = bound(lockAmount, 500e6, 5000e6);
        payAmount = bound(payAmount, 10e6, 250e6);

        bytes32 qualId = _activate(lockAmount);

        // Agent performs T1 pay
        vm.prank(agent);
        uint256 pid = vault.pay(recipient, payAmount, keccak256("inv-fuzz-11"), keccak256("m11"));

        lossAmount = bound(lossAmount, 1, payAmount);
        approvedLoss = bound(approvedLoss, 1, lossAmount);

        // Owner files claim
        vm.prank(owner);
        uint256 claimId = bondPool.fileClaim(pid, lossAmount, keccak256("evidence-fuzz"));

        uint256 remBefore = bondPool.remaining(qualId);
        uint256 vaultBalBefore = token.balanceOf(address(vault));

        // Adjudicator approves claim
        vm.prank(adjudicator);
        uint256 payout = bondPool.approveClaim(claimId, approvedLoss);

        // Expected payout = min(max(0, approvedLoss - DEDUCTIBLE), PER_CLAIM_CAP, remBefore)
        uint256 expectedPayout = approvedLoss > DEDUCTIBLE ? approvedLoss - DEDUCTIBLE : 0;
        if (expectedPayout > PER_CLAIM_CAP) expectedPayout = PER_CLAIM_CAP;
        if (expectedPayout > remBefore) expectedPayout = remBefore;

        assertEq(payout, expectedPayout);
        assertLe(payout, bondPool.locked(qualId));
        assertEq(bondPool.paidOut(qualId), payout);
        assertEq(token.balanceOf(address(vault)), vaultBalBefore + payout);
        assertEq(bondPool.remaining(qualId), remBefore - payout);

        // Once approved, second approval reverts
        vm.prank(adjudicator);
        vm.expectRevert(ClaimAlreadyResolved.selector);
        bondPool.approveClaim(claimId, approvedLoss);

        // Once claimed, another claim cannot be filed for this paymentId
        vm.prank(owner);
        vm.expectRevert(PaymentNotClaimable.selector);
        bondPool.fileClaim(pid, lossAmount, keccak256("evidence-dup"));
    }
}
