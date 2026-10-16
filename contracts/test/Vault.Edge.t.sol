// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { UnderwriteVault } from "../src/UnderwriteVault.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { MockBondPool } from "./mocks/MockBondPool.sol";
import { VaultErrors } from "../src/interfaces/VaultErrors.sol";

contract VaultEdgeTest is Test {
    UnderwriteVault public vault;
    MockUSDC public token;
    MockBondPool public bondPool;

    address public owner = address(0xA1);
    uint256 public examinerPk = 0xB1E5;
    address public examiner;
    address public guardian = address(0xC1);
    address public agent1 = address(0xAA1);
    address public stranger = address(0xDD1);
    address public vendor1 = address(0xEE1);

    bytes32 public configHash = keccak256("config1");
    bytes32 public corpusHash = keccak256("corpus1");
    bytes32 public qualId;
    uint256 public commitId;

    function setUp() public {
        examiner = vm.addr(examinerPk);
        token = new MockUSDC();
        bondPool = new MockBondPool();

        UnderwriteVault.Ceilings memory ceilings =
            UnderwriteVault.Ceilings({ perTx: 300_000_000, perWindow: 1000_000_000, t2PerTx: 2000_000_000 });

        vault = new UnderwriteVault(
            owner,
            examiner,
            guardian,
            address(bondPool),
            address(token),
            ceilings,
            86400, // 1 day windows
            500_000_000, // 500 USDC reserve floor
            300, // 300s challenge period
            300 // 300s recipient cooldown
        );

        // Mint 5000 USDC to vault
        token.mint(address(vault), 5000_000_000);

        // Register vendor1 with 2000 USDC per window cap
        vm.prank(owner);
        vault.addRecipient(vendor1, 2000_000_000);

        // Warp past cooldown
        vm.warp(100_000);

        // Commit exam & activate qualification for agent1
        vm.prank(examiner);
        commitId = vault.commitExam(configHash, corpusHash);

        qualId = keccak256(abi.encode(configHash, commitId));
        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: qualId,
            vault: address(vault),
            agentKey: agent1,
            configHash: configHash,
            reportHash: keccak256("report1"),
            corpusHash: corpusHash,
            examCommitId: commitId,
            ownerInputsHash: keccak256("inputs1"),
            t1MaxPerTx: 180_000_000, // 180 USDC
            t1MaxPerWindow: 500_000_000, // 500 USDC
            t2MaxPerTx: 1000_000_000, // 1000 USDC
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(a)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        bondPool.setRemaining(qualId, 2000_000_000);

        vm.prank(owner);
        vault.activateQualification(a, sig);
    }

    // 1. Payment exactly at per-tx, window, and reserve limits
    function test_payment_exactly_at_limits() public {
        // Exactly at per-tx limit (180 USDC)
        vm.prank(agent1);
        vault.pay(vendor1, 180_000_000, keccak256("exact-tx-1"), keccak256("m"));

        // Exactly at window limit: 180 + 180 + 140 = 500 USDC
        vm.prank(agent1);
        vault.pay(vendor1, 180_000_000, keccak256("exact-tx-2"), keccak256("m"));

        vm.prank(agent1);
        vault.pay(vendor1, 140_000_000, keccak256("exact-window"), keccak256("m"));

        // Spending 1 more wei in current window reverts ExceedsWindow
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.ExceedsWindow.selector);
        vault.pay(vendor1, 1, keccak256("exceed-by-1"), keccak256("m"));

        // Exactly at reserve limit:
        // Set up fresh vault with balance 680 USDC and 500 USDC reserve floor (max spend = 180 USDC)
        UnderwriteVault.Ceilings memory c =
            UnderwriteVault.Ceilings({ perTx: 300_000_000, perWindow: 1000_000_000, t2PerTx: 2000_000_000 });
        UnderwriteVault smallVault = new UnderwriteVault(
            owner, examiner, guardian, address(bondPool), address(token), c, 86400, 500_000_000, 300, 300
        );
        token.mint(address(smallVault), 680_000_000); // 680 USDC
        vm.prank(owner);
        smallVault.addRecipient(vendor1, 2000_000_000);

        // Warp past recipient cooldown
        vm.warp(block.timestamp + 300);

        // Commit and activate on smallVault
        vm.prank(examiner);
        uint256 cId = smallVault.commitExam(configHash, corpusHash);
        bytes32 qId = keccak256(abi.encode(configHash, cId));
        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: qId,
            vault: address(smallVault),
            agentKey: agent1,
            configHash: configHash,
            reportHash: keccak256("report1"),
            corpusHash: corpusHash,
            examCommitId: cId,
            ownerInputsHash: keccak256("inputs1"),
            t1MaxPerTx: 180_000_000,
            t1MaxPerWindow: 500_000_000,
            t2MaxPerTx: 1000_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });
        bytes32 digest =
            keccak256(abi.encodePacked("\x19\x01", smallVault.domainSeparator(), smallVault.hashAttestation(a)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest);
        bondPool.setRemaining(qId, 1000_000_000);
        vm.prank(owner);
        smallVault.activateQualification(a, abi.encodePacked(r, s, v));

        // Exactly at reserve: 680 - 180 = 500 == reserveFloor -> SUCCEEDS
        vm.prank(agent1);
        smallVault.pay(vendor1, 180_000_000, keccak256("exact-reserve"), keccak256("m"));
        assertEq(token.balanceOf(address(smallVault)), 500_000_000);

        // Now any further payment breaches reserve
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.ReserveBreached.selector);
        smallVault.pay(vendor1, 1, keccak256("breach-by-1"), keccak256("m"));
    }

    // 2. Window rollover
    function test_window_rollover() public {
        // Spend full window cap in window 1
        vm.prank(agent1);
        vault.pay(vendor1, 180_000_000, keccak256("w1-1"), keccak256("m"));
        vm.prank(agent1);
        vault.pay(vendor1, 180_000_000, keccak256("w1-2"), keccak256("m"));
        vm.prank(agent1);
        vault.pay(vendor1, 140_000_000, keccak256("w1-3"), keccak256("m"));

        // Window 1 is full
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.ExceedsWindow.selector);
        vault.pay(vendor1, 10_000_000, keccak256("w1-fail"), keccak256("m"));

        // Warp to next window (86400s later)
        vm.warp(block.timestamp + 86400);

        // New window allows payments again up to cap
        vm.prank(agent1);
        vault.pay(vendor1, 180_000_000, keccak256("w2-1"), keccak256("m"));
        assertEq(vault.qualWindowSpent(qualId, block.timestamp / 86400), 180_000_000);
    }

    // 3. Two T1 payments in one block
    function test_two_T1_payments_in_one_block() public {
        uint256 currentBlock = block.number;
        uint256 currentTimestamp = block.timestamp;

        vm.prank(agent1);
        uint256 p1 = vault.pay(vendor1, 100_000_000, keccak256("block-1"), keccak256("m"));

        // Same block & timestamp
        assertEq(block.number, currentBlock);
        assertEq(block.timestamp, currentTimestamp);

        vm.prank(agent1);
        uint256 p2 = vault.pay(vendor1, 50_000_000, keccak256("block-2"), keccak256("m"));

        assertEq(p1, 1);
        assertEq(p2, 2);
        assertEq(vault.exposure(qualId), 150_000_000);
    }

    // 4. T2 after revoke / deactivate / pause
    function test_t2_after_revoke() public {
        vm.prank(agent1);
        uint256 pRev = vault.requestPayment(vendor1, 400_000_000, keccak256("inv-t2-rev"), keccak256("m"));
        vm.warp(block.timestamp + 300);
        vm.prank(owner);
        vault.revokeQualification(qualId, keccak256("revoked-test"));
        vm.expectRevert(VaultErrors.QualificationIsRevoked.selector);
        vault.executePending(pRev);
    }

    function test_t2_after_deactivate() public {
        vm.prank(agent1);
        uint256 pDeact = vault.requestPayment(vendor1, 400_000_000, keccak256("inv-t2-deact"), keccak256("m"));
        vm.warp(block.timestamp + 300);
        vm.prank(owner);
        vault.deactivateRecipient(vendor1);
        vm.expectRevert(VaultErrors.RecipientNotAllowed.selector);
        vault.executePending(pDeact);
    }

    function test_t2_after_pause() public {
        vm.prank(agent1);
        uint256 pPause = vault.requestPayment(vendor1, 400_000_000, keccak256("inv-t2-pause"), keccak256("m"));
        vm.warp(block.timestamp + 300);
        vm.prank(owner);
        vault.pause();
        vm.expectRevert(VaultErrors.Paused.selector);
        vault.executePending(pPause);
    }

    // 5. Pause during pending
    function test_pause_during_pending() public {
        vm.prank(agent1);
        uint256 pendingId = vault.requestPayment(vendor1, 350_000_000, keccak256("inv-pause-pending"), keccak256("m"));

        // Owner pauses mid-challenge period
        vm.prank(owner);
        vault.pause();

        // Time elapses past challenge period
        vm.warp(block.timestamp + 400);

        // Cannot execute while paused
        vm.expectRevert(VaultErrors.Paused.selector);
        vault.executePending(pendingId);

        // Owner unpauses
        vm.prank(owner);
        vault.unpause();

        // Now executePending succeeds cleanly
        uint256 payId = vault.executePending(pendingId);
        assertEq(payId, 1);
    }

    // 6. Owner lowers ceilings mid-window
    function test_owner_lowers_ceilings_mid_window() public {
        // Spend 150 USDC
        vm.prank(agent1);
        vault.pay(vendor1, 150_000_000, keccak256("mid-1"), keccak256("m"));

        // Owner lowers ceilings.perTx to 100 USDC and ceilings.perWindow to 200 USDC
        vm.prank(owner);
        vault.setCeilings(
            UnderwriteVault.Ceilings({ perTx: 100_000_000, perWindow: 200_000_000, t2PerTx: 1000_000_000 })
        );

        // Attempting to pay 120 USDC reverts ExceedsPerTx (lowered ceiling is 100 USDC)
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.ExceedsPerTx.selector);
        vault.pay(vendor1, 120_000_000, keccak256("mid-2"), keccak256("m"));

        // Attempting to pay 80 USDC makes window spend 150 + 80 = 230 USDC > 200 USDC ceiling -> reverts ExceedsWindow
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.ExceedsWindow.selector);
        vault.pay(vendor1, 80_000_000, keccak256("mid-3"), keccak256("m"));
    }

    // 7. Window-boundary burst bounded by exposure
    function test_window_boundary_burst_bounded_by_exposure() public {
        // Limit bond pool remaining to 700 USDC (window cap is 500 USDC)
        bondPool.setRemaining(qualId, 700_000_000);

        // Window 1: spend 500 USDC (max per window)
        vm.prank(agent1);
        vault.pay(vendor1, 180_000_000, keccak256("burst-w1-1"), keccak256("m"));
        vm.prank(agent1);
        vault.pay(vendor1, 180_000_000, keccak256("burst-w1-2"), keccak256("m"));
        vm.prank(agent1);
        vault.pay(vendor1, 140_000_000, keccak256("burst-w1-3"), keccak256("m"));
        assertEq(vault.exposure(qualId), 500_000_000);

        // Advance 1 second across window boundary
        uint256 nextWindowTime = ((block.timestamp / 86400) + 1) * 86400;
        vm.warp(nextWindowTime);

        // Window 2 has full 500 USDC window cap available.
        // However, unreconciled exposure from window 1 is already 500 USDC!
        // Paying another 180 USDC leaves exposure at 680 USDC <= 700 USDC -> succeeds
        vm.prank(agent1);
        vault.pay(vendor1, 180_000_000, keccak256("burst-w2-1"), keccak256("m"));
        assertEq(vault.exposure(qualId), 680_000_000);

        // Now attempting to pay another 50 USDC requires 730 USDC > 700 USDC bond remaining -> reverts InsufficientBacking!
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.InsufficientBacking.selector);
        vault.pay(vendor1, 50_000_000, keccak256("burst-w2-fail"), keccak256("m"));
    }

    // 8. Reconcile then pay again
    function test_reconcile_then_pay_again() public {
        bondPool.setRemaining(qualId, 250_000_000);

        // Spend 180 USDC
        vm.prank(agent1);
        uint256 pid1 = vault.pay(vendor1, 180_000_000, keccak256("rec-pay-1"), keccak256("m"));
        assertEq(vault.exposure(qualId), 180_000_000);

        // Second payment of 100 USDC would exceed 250 USDC backing
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.InsufficientBacking.selector);
        vault.pay(vendor1, 100_000_000, keccak256("rec-pay-fail"), keccak256("m"));

        // Owner reconciles payment 1
        vm.prank(owner);
        vault.reconcile(qualId, pid1);
        assertEq(vault.exposure(qualId), 0);

        // Now agent pays again successfully
        vm.prank(agent1);
        uint256 pid2 = vault.pay(vendor1, 100_000_000, keccak256("rec-pay-2"), keccak256("m"));
        assertEq(pid2, 2);
        assertEq(vault.exposure(qualId), 100_000_000);
    }

    // 9. Claim on a reconciled payment rejected
    function test_claim_on_a_reconciled_payment_rejected() public {
        vm.prank(agent1);
        uint256 pid = vault.pay(vendor1, 100_000_000, keccak256("claim-rej-1"), keccak256("m"));

        // Before reconcile, payment is claimable
        assertTrue(vault.isClaimable(pid));

        // Reconcile payment
        vm.prank(owner);
        vault.reconcile(qualId, pid);

        // Reconciled payment is no longer claimable
        assertFalse(vault.isClaimable(pid));
    }

    // 10. Attestation referencing a superseded exam commit rejected
    function test_attestation_referencing_superseded_exam_commit() public {
        bytes32 conf = keccak256("config-stale-test");
        vm.prank(examiner);
        uint256 c1 = vault.commitExam(conf, keccak256("corpus-1"));

        vm.prank(examiner);
        uint256 c2 = vault.commitExam(conf, keccak256("corpus-2"));
        assertEq(c2, c1 + 1);

        // Create an attestation referencing the OLD commitId c1
        bytes32 oldQId = keccak256(abi.encode(conf, c1));
        UnderwriteVault.QualificationAttestation memory staleAttestation = UnderwriteVault.QualificationAttestation({
            qualId: oldQId,
            vault: address(vault),
            agentKey: agent1,
            configHash: conf,
            reportHash: keccak256("report-stale"),
            corpusHash: keccak256("corpus-1"),
            examCommitId: c1, // Stale!
            ownerInputsHash: keccak256("inputs1"),
            t1MaxPerTx: 180_000_000,
            t1MaxPerWindow: 500_000_000,
            t2MaxPerTx: 1000_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes32 digest =
            keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(staleAttestation)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest);

        // Activating stale commit reverts StaleExamCommit
        vm.prank(owner);
        vm.expectRevert(VaultErrors.StaleExamCommit.selector);
        vault.activateQualification(staleAttestation, abi.encodePacked(r, s, v));
    }
}
