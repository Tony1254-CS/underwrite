// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { UnderwriteVault } from "../src/UnderwriteVault.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { MockBondPool } from "./mocks/MockBondPool.sol";
import { VaultErrors } from "../src/interfaces/VaultErrors.sol";

contract VaultT2Test is Test {
    UnderwriteVault public vault;
    MockUSDC public token;
    MockBondPool public bondPool;

    address public owner = address(0xA1);
    uint256 public examinerPk = 0xB1E5;
    address public examiner;
    address public guardian = address(0xC1);
    address public agent1 = address(0xAA1);
    address public agent2 = address(0xAA2);
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
            UnderwriteVault.Ceilings({ perTx: 300_000_000, perWindow: 1000_000_000, t2PerTx: 2000_000_000 });

        vault = new UnderwriteVault(
            owner,
            examiner,
            guardian,
            address(bondPool),
            address(token),
            ceilings,
            86400,
            500_000_000, // reserve floor = 500 USDC
            300, // 300s challengePeriod
            300 // 300s recipientCooldown
        );

        // Fund vault with 5000 USDC
        token.mint(address(vault), 5000_000_000);

        // Register vendor1
        vm.prank(owner);
        vault.addRecipient(vendor1, 5000_000_000);

        // Warp past vendor cooldown
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
            t1MaxPerTx: 180_000_000,
            t1MaxPerWindow: 500_000_000,
            t2MaxPerTx: 1000_000_000, // 1000 USDC
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

    function test_happy_path_t2_lifecycle() public {
        bytes32 invoiceKey = keccak256("t2-inv-1");
        bytes32 memoHash = keccak256("t2-memo-1");
        uint256 amount = 600_000_000; // 600 USDC (exceeds T1, valid for T2)

        // Request payment
        vm.prank(agent1);
        uint256 pendingId = vault.requestPayment(vendor1, amount, invoiceKey, memoHash);
        assertEq(pendingId, 1);

        // Verify pending state
        (
            bytes32 pQualId,
            address pRecipient,
            uint256 pAmount,
            bytes32 pInvoiceKey,
            bytes32 pMemoHash,
            uint256 readyAt,
            UnderwriteVault.PendingStatus status
        ) = vault.pending(pendingId);

        assertEq(pQualId, qualId);
        assertEq(pRecipient, vendor1);
        assertEq(pAmount, amount);
        assertEq(pInvoiceKey, invoiceKey);
        assertEq(pMemoHash, memoHash);
        assertEq(readyAt, block.timestamp + 300);
        assertTrue(status == UnderwriteVault.PendingStatus.PENDING);
        assertTrue(vault.invoiceState(invoiceKey) == UnderwriteVault.InvoiceStatus.RESERVED);

        // Duplicate invoice request reverts DuplicateInvoice
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.DuplicateInvoice.selector);
        vault.requestPayment(vendor1, amount, invoiceKey, memoHash);

        // Early execution before readyAt reverts NotReady
        vm.expectRevert(VaultErrors.NotReady.selector);
        vault.executePending(pendingId);

        // Warp to readyAt
        vm.warp(readyAt);

        uint256 vendorBalBefore = token.balanceOf(vendor1);
        uint256 vaultBalBefore = token.balanceOf(address(vault));

        // Stranger executes pending payment (anyone can execute)
        vm.prank(stranger);
        uint256 paymentId = vault.executePending(pendingId);
        assertEq(paymentId, 1);

        // Verify balances & state
        assertEq(token.balanceOf(vendor1), vendorBalBefore + amount);
        assertEq(token.balanceOf(address(vault)), vaultBalBefore - amount);
        assertTrue(vault.invoiceState(invoiceKey) == UnderwriteVault.InvoiceStatus.PAID);

        (,,,,,, UnderwriteVault.PendingStatus statusAfter) = vault.pending(pendingId);
        assertTrue(statusAfter == UnderwriteVault.PendingStatus.EXECUTED);

        // Verify payment record
        (
            bytes32 rQualId,
            address rRecipient,
            uint256 rAmount,
            bytes32 rInvoiceKey,
            bytes32 rMemoHash,
            uint8 rTier,
            uint256 rTimestamp,
            bool rReconciled
        ) = vault.payments(paymentId);

        assertEq(rQualId, qualId);
        assertEq(rRecipient, vendor1);
        assertEq(rAmount, amount);
        assertEq(rInvoiceKey, invoiceKey);
        assertEq(rMemoHash, memoHash);
        assertEq(rTier, 2);
        assertEq(rTimestamp, readyAt);
        assertFalse(rReconciled);

        // Second execution reverts NotPending
        vm.expectRevert(VaultErrors.NotPending.selector);
        vault.executePending(pendingId);
    }

    function test_veto_by_owner_releases_invoiceKey() public {
        bytes32 invoiceKey = keccak256("t2-inv-veto");
        bytes32 memoHash = keccak256("t2-memo-veto");
        uint256 amount = 500_000_000;

        vm.prank(agent1);
        uint256 pendingId = vault.requestPayment(vendor1, amount, invoiceKey, memoHash);
        assertTrue(vault.invoiceState(invoiceKey) == UnderwriteVault.InvoiceStatus.RESERVED);

        // Owner vetoes
        vm.prank(owner);
        vault.veto(pendingId);

        // Invoice state is released back to NONE
        assertTrue(vault.invoiceState(invoiceKey) == UnderwriteVault.InvoiceStatus.NONE);
        (,,,,,, UnderwriteVault.PendingStatus status) = vault.pending(pendingId);
        assertTrue(status == UnderwriteVault.PendingStatus.VETOED);

        // executePending reverts Vetoed
        vm.warp(block.timestamp + 500);
        vm.expectRevert(VaultErrors.Vetoed.selector);
        vault.executePending(pendingId);

        // Double veto reverts Vetoed
        vm.prank(owner);
        vm.expectRevert(VaultErrors.Vetoed.selector);
        vault.veto(pendingId);

        // Released invoiceKey can now be used again for payment
        vm.prank(agent1);
        uint256 newPendingId = vault.requestPayment(vendor1, amount, invoiceKey, memoHash);
        assertEq(newPendingId, 2);
    }

    function test_veto_by_guardian() public {
        bytes32 invoiceKey = keccak256("t2-inv-guard");
        bytes32 memoHash = keccak256("t2-memo-guard");
        uint256 amount = 400_000_000;

        vm.prank(agent1);
        uint256 pendingId = vault.requestPayment(vendor1, amount, invoiceKey, memoHash);

        // Guardian vetoes successfully
        vm.prank(guardian);
        vault.veto(pendingId);

        (,,,,,, UnderwriteVault.PendingStatus status) = vault.pending(pendingId);
        assertTrue(status == UnderwriteVault.PendingStatus.VETOED);
    }

    function test_stranger_cannot_veto() public {
        bytes32 invoiceKey = keccak256("t2-inv-stranger");
        bytes32 memoHash = keccak256("t2-memo-stranger");
        uint256 amount = 300_000_000;

        vm.prank(agent1);
        uint256 pendingId = vault.requestPayment(vendor1, amount, invoiceKey, memoHash);

        vm.prank(stranger);
        vm.expectRevert(VaultErrors.NotGuardianOrOwner.selector);
        vault.veto(pendingId);
    }

    function test_revert_not_pending() public {
        // Uninitialized ID reverts NotPending
        vm.expectRevert(VaultErrors.NotPending.selector);
        vault.executePending(999);

        vm.prank(owner);
        vm.expectRevert(VaultErrors.NotPending.selector);
        vault.veto(999);
    }

    function test_revert_paused() public {
        bytes32 invoiceKey = keccak256("t2-inv-pause");
        bytes32 memoHash = keccak256("t2-memo-pause");
        uint256 amount = 200_000_000;

        vm.prank(agent1);
        uint256 pendingId = vault.requestPayment(vendor1, amount, invoiceKey, memoHash);

        vm.warp(block.timestamp + 300);

        // Pause vault
        vm.prank(owner);
        vault.pause();

        // Execution while paused reverts Paused
        vm.expectRevert(VaultErrors.Paused.selector);
        vault.executePending(pendingId);

        // Requesting while paused reverts Paused
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.Paused.selector);
        vault.requestPayment(vendor1, amount, keccak256("inv-pause-2"), memoHash);
    }

    function test_revert_execute_after_revoke() public {
        bytes32 invoiceKey = keccak256("t2-inv-rev");
        bytes32 memoHash = keccak256("t2-memo-rev");
        uint256 amount = 250_000_000;

        vm.prank(agent1);
        uint256 pendingId = vault.requestPayment(vendor1, amount, invoiceKey, memoHash);

        vm.warp(block.timestamp + 300);

        // Revoke qualification
        vm.prank(owner);
        vault.revokeQualification(qualId, keccak256("compromised"));

        // executePending reverts QualificationIsRevoked
        vm.expectRevert(VaultErrors.QualificationIsRevoked.selector);
        vault.executePending(pendingId);
    }

    function test_revert_execute_after_deactivate_recipient() public {
        bytes32 invoiceKey = keccak256("t2-inv-deact");
        bytes32 memoHash = keccak256("t2-memo-deact");
        uint256 amount = 300_000_000;

        vm.prank(agent1);
        uint256 pendingId = vault.requestPayment(vendor1, amount, invoiceKey, memoHash);

        vm.warp(block.timestamp + 300);

        // Deactivate vendor
        vm.prank(owner);
        vault.deactivateRecipient(vendor1);

        // executePending reverts RecipientNotAllowed
        vm.expectRevert(VaultErrors.RecipientNotAllowed.selector);
        vault.executePending(pendingId);
    }

    function test_revert_execute_after_qual_expired() public {
        bytes32 invoiceKey = keccak256("t2-inv-exp");
        bytes32 memoHash = keccak256("t2-memo-exp");
        uint256 amount = 100_000_000;

        vm.prank(agent1);
        uint256 pendingId = vault.requestPayment(vendor1, amount, invoiceKey, memoHash);

        // Warp past 14-day expiry
        vm.warp(block.timestamp + 15 days);

        vm.expectRevert(VaultErrors.QualificationExpired.selector);
        vault.executePending(pendingId);
    }

    function test_revert_execute_reserve_breached() public {
        bytes32 invoiceKey = keccak256("t2-inv-res");
        bytes32 memoHash = keccak256("t2-memo-res");
        uint256 amount = 600_000_000; // 600 USDC

        vm.prank(agent1);
        uint256 pendingId = vault.requestPayment(vendor1, amount, invoiceKey, memoHash);

        vm.warp(block.timestamp + 300);

        // Vault has 5000 USDC and 500 USDC reserve floor.
        // Drain 4200 USDC leaving 800 USDC. Paying 600 USDC leaves 200 USDC (< 500 USDC floor).
        vm.prank(owner);
        vault.ownerTransfer(stranger, 4200_000_000);

        vm.expectRevert(VaultErrors.ReserveBreached.selector);
        vault.executePending(pendingId);
    }

    function test_revert_request_t2_not_allowed() public {
        // Activate qual for agent2 with t2Allowed = false
        bytes32 configHash2 = keccak256("config2");
        bytes32 corpusHash2 = keccak256("corpus2");
        vm.prank(examiner);
        uint256 commitId2 = vault.commitExam(configHash2, corpusHash2);

        bytes32 qualId2 = keccak256(abi.encode(configHash2, commitId2));
        UnderwriteVault.QualificationAttestation memory a2 = UnderwriteVault.QualificationAttestation({
            qualId: qualId2,
            vault: address(vault),
            agentKey: agent2,
            configHash: configHash2,
            reportHash: keccak256("report2"),
            corpusHash: corpusHash2,
            examCommitId: commitId2,
            ownerInputsHash: keccak256("inputs2"),
            t1MaxPerTx: 100_000_000,
            t1MaxPerWindow: 200_000_000,
            t2MaxPerTx: 0,
            t2Allowed: false,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(a2)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        bondPool.setRemaining(qualId2, 500_000_000);

        vm.prank(owner);
        vault.activateQualification(a2, sig);

        // agent2 requests payment -> reverts T2NotAllowed
        vm.prank(agent2);
        vm.expectRevert(VaultErrors.T2NotAllowed.selector);
        vault.requestPayment(vendor1, 50_000_000, keccak256("inv-t2-false"), keccak256("memo"));
    }

    function test_revert_request_exceeds_t2_per_tx() public {
        // Qual t2MaxPerTx is 1000 USDC. Request 1001 USDC -> reverts ExceedsPerTx
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.ExceedsPerTx.selector);
        vault.requestPayment(vendor1, 1001_000_000, keccak256("inv-toolarge"), keccak256("memo"));
    }

    function test_revert_execute_if_ceilings_lowered_below_pending_amount() public {
        bytes32 invoiceKey = keccak256("t2-inv-ceil");
        bytes32 memoHash = keccak256("t2-memo-ceil");
        uint256 amount = 800_000_000; // 800 USDC (valid under 1000 USDC t2MaxPerTx)

        vm.prank(agent1);
        uint256 pendingId = vault.requestPayment(vendor1, amount, invoiceKey, memoHash);

        vm.warp(block.timestamp + 300);

        // Owner lowers ceilings.t2PerTx to 700 USDC
        vm.prank(owner);
        vault.setCeilings(
            UnderwriteVault.Ceilings({ perTx: 300_000_000, perWindow: 1000_000_000, t2PerTx: 700_000_000 })
        );

        // executePending now reverts ExceedsPerTx
        vm.expectRevert(VaultErrors.ExceedsPerTx.selector);
        vault.executePending(pendingId);
    }
}
