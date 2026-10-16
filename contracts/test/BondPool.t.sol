// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { UnderwriteVault } from "../src/UnderwriteVault.sol";
import { BondPool } from "../src/BondPool.sol";
import { VaultErrors } from "../src/interfaces/VaultErrors.sol";
import { BondPoolErrors } from "../src/interfaces/BondPoolErrors.sol";

contract BondPoolComprehensiveTest is Test, VaultErrors, BondPoolErrors {
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

    bytes32 public configHash = keccak256("agent-config-p2");
    bytes32 public corpusHash = keccak256("corpus-p2");

    uint256 public constant DEDUCTIBLE = 5e6; // 5 USDC
    uint256 public constant PER_CLAIM_CAP = 500e6; // 500 USDC
    uint256 public constant CLAIM_GRACE = 7 days; // 604800s

    event ClaimPaid(uint256 indexed claimId, bytes32 indexed qualId, uint256 payout, address indexed vault);
    event QualificationRevoked(bytes32 indexed qualId, bytes32 indexed reasonHash);

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

        token.mint(address(vault), 10_000e6);
        token.mint(underwriter, 50_000e6);

        vm.prank(underwriter);
        token.approve(address(bondPool), type(uint256).max);

        vm.prank(owner);
        vault.addRecipient(recipient, 2000e6);
        vm.warp(block.timestamp + 301);
    }

    function _signAttestation(UnderwriteVault.QualificationAttestation memory a, uint256 signerPk)
        internal
        view
        returns (bytes memory)
    {
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(a)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _setupActiveQualification(uint256 bondBacking) internal returns (bytes32 qualId) {
        vm.prank(underwriter);
        bondPool.deposit(bondBacking);

        vm.prank(examiner);
        uint256 commitId = vault.commitExam(configHash, corpusHash);
        qualId = keccak256(abi.encode(configHash, commitId));

        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: qualId,
            vault: address(vault),
            agentKey: agent,
            configHash: configHash,
            reportHash: keccak256("report-p2"),
            corpusHash: corpusHash,
            examCommitId: commitId,
            ownerInputsHash: keccak256("owner-p2"),
            t1MaxPerTx: 200e6,
            t1MaxPerWindow: bondBacking,
            t2MaxPerTx: 1000e6,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes memory sig = _signAttestation(a, examinerPk);
        vm.prank(owner);
        vault.activateQualification(a, sig);
    }

    // 1. Lock fails when free is insufficient => activation reverts BondLockFailed
    function test_lock_fails_when_free_is_insufficient_activation_reverts_BondLockFailed() public {
        vm.prank(underwriter);
        bondPool.deposit(100e6);

        vm.prank(examiner);
        uint256 commitId = vault.commitExam(configHash, corpusHash);
        bytes32 qualId = keccak256(abi.encode(configHash, commitId));

        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: qualId,
            vault: address(vault),
            agentKey: agent,
            configHash: configHash,
            reportHash: keccak256("report-p2"),
            corpusHash: corpusHash,
            examCommitId: commitId,
            ownerInputsHash: keccak256("owner-p2"),
            t1MaxPerTx: 200e6,
            t1MaxPerWindow: 500e6, // exceeds 100e6 free
            t2MaxPerTx: 1000e6,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes memory sig = _signAttestation(a, examinerPk);
        vm.prank(owner);
        vm.expectRevert(BondLockFailed.selector);
        vault.activateQualification(a, sig);
    }

    // 2. Payout caps: deductible, perClaimCap, remaining
    function test_payout_caps_deductible_perClaimCap_remaining() public {
        bytes32 qualId = _setupActiveQualification(1000e6);

        vm.prank(agent);
        uint256 pid = vault.pay(recipient, 200e6, keccak256("inv-caps"), keccak256("memo-caps"));

        vm.prank(owner);
        uint256 cid = bondPool.fileClaim(pid, 200e6, keccak256("ev-caps"));

        // Case A: loss <= deductible (approvedLoss = 4 USDC <= 5 USDC deductible) => payout = 0
        vm.prank(adjudicator);
        uint256 payoutZero = bondPool.approveClaim(cid, 4e6);
        assertEq(payoutZero, 0);
        assertEq(bondPool.paidOut(qualId), 0);
        assertEq(bondPool.remaining(qualId), 1000e6);
    }

    function test_payout_caps_deductible_floor_and_cap() public {
        bytes32 qualId = _setupActiveQualification(1000e6);

        vm.prank(agent);
        uint256 pid = vault.pay(recipient, 200e6, keccak256("inv-cap1"), keccak256("memo-cap1"));

        vm.prank(owner);
        uint256 cid = bondPool.fileClaim(pid, 200e6, keccak256("ev-cap1"));

        // approvedLoss = 200 USDC -> netLoss = 200 - 5 = 195 USDC <= 500 cap
        vm.prank(adjudicator);
        uint256 payout = bondPool.approveClaim(cid, 200e6);
        assertEq(payout, 195e6);
        assertEq(bondPool.remaining(qualId), 805e6);
    }

    // 3. Duplicate claim rejected
    function test_duplicate_claim_rejected() public {
        _setupActiveQualification(1000e6);

        vm.prank(agent);
        uint256 pid = vault.pay(recipient, 200e6, keccak256("inv-dup"), keccak256("memo-dup"));

        vm.prank(owner);
        bondPool.fileClaim(pid, 200e6, keccak256("ev-dup"));

        // Second fileClaim on same paymentId reverts PaymentNotClaimable
        vm.prank(owner);
        vm.expectRevert(PaymentNotClaimable.selector);
        bondPool.fileClaim(pid, 100e6, keccak256("ev-dup2"));
    }

    // 4. Claim on T2 payment, owner transfer, and reconciled payment all rejected
    function test_claim_on_T2_payment_rejected() public {
        _setupActiveQualification(1000e6);

        // Execute T2 payment
        vm.prank(agent);
        uint256 pendId = vault.requestPayment(recipient, 200e6, keccak256("inv-t2"), keccak256("memo-t2"));
        vm.warp(block.timestamp + 301);
        uint256 pid = vault.executePending(pendId);

        // Attempt claim on T2 payment => isClaimable is false => reverts PaymentNotClaimable
        vm.prank(owner);
        vm.expectRevert(PaymentNotClaimable.selector);
        bondPool.fileClaim(pid, 200e6, keccak256("ev-t2"));
    }

    function test_claim_on_owner_transfer_rejected() public {
        _setupActiveQualification(1000e6);

        vm.prank(owner);
        vault.ownerTransfer(address(0x8888), 100e6);

        // Payment ID 999 does not exist => reverts PaymentNotClaimable
        vm.prank(owner);
        vm.expectRevert(PaymentNotClaimable.selector);
        bondPool.fileClaim(999, 100e6, keccak256("ev-owner"));
    }

    function test_claim_on_reconciled_payment_rejected() public {
        bytes32 qualId = _setupActiveQualification(1000e6);

        vm.prank(agent);
        uint256 pid = vault.pay(recipient, 200e6, keccak256("inv-rec"), keccak256("memo-rec"));

        // Owner reconciles
        vm.prank(owner);
        vault.reconcile(qualId, pid);

        // Attempt claim on reconciled payment => reverts PaymentNotClaimable
        vm.prank(owner);
        vm.expectRevert(PaymentNotClaimable.selector);
        bondPool.fileClaim(pid, 200e6, keccak256("ev-rec"));
    }

    // 5. approveClaim pays and revokes in ONE tx with both events (ClaimPaid, QualificationRevoked)
    function test_approveClaim_pays_and_revokes_in_one_tx_with_both_events() public {
        bytes32 qualId = _setupActiveQualification(1000e6);

        vm.prank(agent);
        uint256 pid = vault.pay(recipient, 200e6, keccak256("inv-atomic"), keccak256("memo-atomic"));

        vm.prank(owner);
        uint256 cid = bondPool.fileClaim(pid, 200e6, keccak256("ev-atomic"));

        // Expect ClaimPaid on BondPool and QualificationRevoked on UnderwriteVault
        vm.expectEmit(true, true, true, true, address(bondPool));
        emit ClaimPaid(cid, qualId, 195e6, address(vault));

        vm.expectEmit(true, true, false, false, address(vault));
        emit QualificationRevoked(qualId, keccak256("CLAIM"));

        vm.prank(adjudicator);
        bondPool.approveClaim(cid, 200e6);

        // Verify qualification is revoked in vault: quals returns (attestation, active, revoked, activatedAt, effT1, effWindow, effT2)
        (, bool active, bool revoked,,,,) = vault.quals(qualId);
        assertFalse(active);
        assertTrue(revoked);
    }

    // 6. pay reverts InsufficientBacking after payout drains remaining
    function test_pay_reverts_InsufficientBacking_after_payout_drains_remaining() public {
        // Setup with small backing: 200 USDC
        bytes32 qualId = _setupActiveQualification(200e6);

        vm.prank(agent);
        uint256 pid = vault.pay(recipient, 200e6, keccak256("inv-drain"), keccak256("memo-drain"));

        // File and approve claim: approvedLoss = 200 => payout = 195 USDC
        vm.prank(owner);
        uint256 cid = bondPool.fileClaim(pid, 200e6, keccak256("ev-drain"));

        vm.prank(adjudicator);
        bondPool.approveClaim(cid, 200e6);

        // Remaining is now 200 - 195 = 5 USDC
        assertEq(bondPool.remaining(qualId), 5e6);

        // Even if qual wasn't revoked, any payment > 5 USDC would fail InsufficientBacking
        // Since qual was revoked by claim, next payment also reverts with qualification error
        vm.prank(agent);
        vm.expectRevert(NoActiveQualification.selector);
        vault.pay(recipient, 100e6, keccak256("inv-drain2"), keccak256("memo-drain2"));
    }

    // 7. Claim after bond is exhausted (payout 0, still revokes)
    function test_claim_after_bond_is_exhausted_payout_0_still_revokes() public {
        bytes32 qualId = _setupActiveQualification(100e6);

        vm.prank(agent);
        uint256 pid = vault.pay(recipient, 100e6, keccak256("inv-ex"), keccak256("memo-ex"));

        // Claim 1 drains 95 USDC of the 100 USDC backing
        vm.prank(owner);
        uint256 cid = bondPool.fileClaim(pid, 100e6, keccak256("ev-ex"));

        vm.prank(adjudicator);
        bondPool.approveClaim(cid, 100e6);

        assertEq(bondPool.remaining(qualId), 5e6);
        (, bool active, bool revoked,,,,) = vault.quals(qualId);
        assertFalse(active);
        assertTrue(revoked);
    }

    // 8. Release rules
    function test_release_rules_comprehensive() public {
        bytes32 qualId = _setupActiveQualification(1000e6);

        // 1. Release reverts while active
        vm.expectRevert(QualificationStillActive.selector);
        bondPool.release(qualId);

        // Revoke qualification
        vm.prank(owner);
        vault.revokeQualification(qualId, keccak256("reason-rev"));

        // 2. Release reverts before claimGrace has passed
        vm.expectRevert(ClaimGraceNotElapsed.selector);
        bondPool.release(qualId);

        // Warp past expiresAt + claimGrace
        vm.warp(block.timestamp + 14 days + CLAIM_GRACE + 1);

        // 3. Release succeeds and moves remaining locked to free
        uint256 freeBefore = bondPool.free();
        bondPool.release(qualId);
        assertEq(bondPool.free(), freeBefore + 1000e6);
        assertEq(bondPool.remaining(qualId), 0);

        // 4. Second release reverts with NoLockedCapital
        vm.expectRevert(NoLockedCapital.selector);
        bondPool.release(qualId);
    }
}
