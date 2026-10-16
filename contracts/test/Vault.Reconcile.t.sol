// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { UnderwriteVault } from "../src/UnderwriteVault.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { MockBondPool } from "./mocks/MockBondPool.sol";
import { VaultErrors } from "../src/interfaces/VaultErrors.sol";

contract VaultReconcileTest is Test {
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

    function setUp() public {
        examiner = vm.addr(examinerPk);
        token = new MockUSDC();
        bondPool = new MockBondPool();

        UnderwriteVault.Ceilings memory ceilings =
            UnderwriteVault.Ceilings({ perTx: 300_000_000, perWindow: 2000_000_000, t2PerTx: 2000_000_000 });

        vault = new UnderwriteVault(
            owner,
            examiner,
            guardian,
            address(bondPool),
            address(token),
            ceilings,
            86400,
            500_000_000, // reserve floor = 500 USDC
            300,
            300
        );

        // Fund vault with 10,000 USDC
        token.mint(address(vault), 10000_000_000);

        // Register vendor1 with large cap
        vm.prank(owner);
        vault.addRecipient(vendor1, 10000_000_000);

        // Warp past cooldown
        vm.warp(100_000);

        // Commit exam & activate qualification for agent1
        vm.prank(examiner);
        uint256 commitId = vault.commitExam(configHash, corpusHash);

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
            t1MaxPerTx: 250_000_000, // 250 USDC
            t1MaxPerWindow: 2000_000_000,
            t2MaxPerTx: 1000_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(a)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        bondPool.setRemaining(qualId, 1000_000_000);

        vm.prank(owner);
        vault.activateQualification(a, sig);
    }

    function test_exposure_rises_on_pay_and_falls_on_reconcile() public {
        assertEq(vault.exposure(qualId), 0);

        // Payment 1: 100 USDC
        vm.prank(agent1);
        uint256 pid1 = vault.pay(vendor1, 100_000_000, keccak256("inv-1"), keccak256("m1"));
        assertEq(pid1, 1);
        assertEq(vault.exposure(qualId), 100_000_000);
        assertTrue(vault.isClaimable(pid1));

        // Payment 2: 150 USDC
        vm.prank(agent1);
        uint256 pid2 = vault.pay(vendor1, 150_000_000, keccak256("inv-2"), keccak256("m2"));
        assertEq(pid2, 2);
        assertEq(vault.exposure(qualId), 250_000_000);
        assertTrue(vault.isClaimable(pid2));

        // Reconcile up to payment 1
        vm.prank(owner);
        (uint256 count1, uint256 amt1) = vault.reconcile(qualId, pid1);
        assertEq(count1, 1);
        assertEq(amt1, 100_000_000);
        assertEq(vault.exposure(qualId), 150_000_000);

        // Payment 1 is now reconciled -> not claimable
        assertFalse(vault.isClaimable(pid1));
        // Payment 2 is still unreconciled -> claimable
        assertTrue(vault.isClaimable(pid2));

        // Reconcile up to payment 2
        vm.prank(owner);
        (uint256 count2, uint256 amt2) = vault.reconcile(qualId, pid2);
        assertEq(count2, 1);
        assertEq(amt2, 150_000_000);
        assertEq(vault.exposure(qualId), 0);

        // Payment 2 is now reconciled -> not claimable
        assertFalse(vault.isClaimable(pid2));
    }

    function test_insufficient_backing_until_owner_reconciles() public {
        // Set bond pool remaining to exactly 250 USDC
        bondPool.setRemaining(qualId, 250_000_000);

        // First payment: 150 USDC -> exposure = 150 USDC
        vm.prank(agent1);
        uint256 pid1 = vault.pay(vendor1, 150_000_000, keccak256("inv-b1"), keccak256("m1"));
        assertEq(vault.exposure(qualId), 150_000_000);

        // Second payment: 150 USDC would make exposure 300 USDC > 250 USDC -> reverts InsufficientBacking
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.InsufficientBacking.selector);
        vault.pay(vendor1, 150_000_000, keccak256("inv-b2"), keccak256("m2"));

        // Owner reconciles payment 1 -> exposure drops back to 0
        vm.prank(owner);
        vault.reconcile(qualId, pid1);
        assertEq(vault.exposure(qualId), 0);

        // Now payment 2 succeeds because exposure (0 + 150 USDC) <= 250 USDC
        vm.prank(agent1);
        uint256 pid2 = vault.pay(vendor1, 150_000_000, keccak256("inv-b2"), keccak256("m2"));
        assertEq(pid2, 2);
        assertEq(vault.exposure(qualId), 150_000_000);
    }

    function test_revert_already_reconciled() public {
        // No payments made yet -> reverts AlreadyReconciled
        vm.prank(owner);
        vm.expectRevert(VaultErrors.AlreadyReconciled.selector);
        vault.reconcile(qualId, 1);

        // Make payment 1
        vm.prank(agent1);
        vault.pay(vendor1, 50_000_000, keccak256("inv-r1"), keccak256("m1"));

        // Reconcile payment 1
        vm.prank(owner);
        vault.reconcile(qualId, 1);

        // Reconciling payment 1 again reverts AlreadyReconciled
        vm.prank(owner);
        vm.expectRevert(VaultErrors.AlreadyReconciled.selector);
        vault.reconcile(qualId, 1);
    }

    function test_stranger_cannot_reconcile() public {
        vm.prank(agent1);
        vault.pay(vendor1, 50_000_000, keccak256("inv-s1"), keccak256("m1"));

        vm.prank(stranger);
        vm.expectRevert(VaultErrors.NotOwner.selector);
        vault.reconcile(qualId, 1);
    }

    function test_tier_2_payment_not_claimable() public {
        bytes32 invKey = keccak256("t2-claimable-test");
        vm.prank(agent1);
        uint256 pendingId = vault.requestPayment(vendor1, 500_000_000, invKey, keccak256("m"));

        vm.warp(block.timestamp + 300);
        uint256 paymentId = vault.executePending(pendingId);

        // T2 payment is NEVER claimable
        assertFalse(vault.isClaimable(paymentId));
    }

    function test_claimed_payment_not_claimable_and_does_not_double_deduct() public {
        vm.prank(agent1);
        uint256 pid = vault.pay(vendor1, 100_000_000, keccak256("inv-claim-test"), keccak256("m"));
        assertEq(vault.exposure(qualId), 100_000_000);
        assertTrue(vault.isClaimable(pid));

        // Setup mock claim in bond pool
        uint256 claimId = 1;
        bondPool.setClaimRecord(claimId, qualId, pid, 100_000_000, keccak256("ev"), 1);

        // BondPool calls suspendForClaim
        vm.prank(address(bondPool));
        vault.suspendForClaim(qualId, claimId);

        // Exposure was reduced in suspendForClaim
        assertEq(vault.exposure(qualId), 0);
        // Payment is now claimed -> not claimable
        assertFalse(vault.isClaimable(pid));

        // Reconcile handles claimed payment gracefully without underflow
        vm.prank(owner);
        (uint256 count, uint256 amt) = vault.reconcile(qualId, pid);
        assertEq(count, 1);
        assertEq(amt, 100_000_000);
        assertEq(vault.exposure(qualId), 0);
    }

    function test_reconcile_batch_limit_50() public {
        // Create 55 payments of 1 USDC each
        for (uint256 i = 1; i <= 55; i++) {
            vm.prank(agent1);
            vault.pay(vendor1, 1_000_000, keccak256(abi.encode("batch-inv", i)), keccak256("m"));
        }

        assertEq(vault.exposure(qualId), 55_000_000);
        assertEq(vault.reconcileCursor(qualId), 0);

        // First reconcile call processes max 50 payments
        vm.prank(owner);
        (uint256 count1, uint256 amt1) = vault.reconcile(qualId, 55);
        assertEq(count1, 50);
        assertEq(amt1, 50_000_000);
        assertEq(vault.reconcileCursor(qualId), 50);
        assertEq(vault.exposure(qualId), 5_000_000);

        // Second reconcile call processes remaining 5 payments
        vm.prank(owner);
        (uint256 count2, uint256 amt2) = vault.reconcile(qualId, 55);
        assertEq(count2, 5);
        assertEq(amt2, 5_000_000);
        assertEq(vault.reconcileCursor(qualId), 55);
        assertEq(vault.exposure(qualId), 0);
    }
}
