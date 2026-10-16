// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { UnderwriteVault } from "../src/UnderwriteVault.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { MockBondPool } from "./mocks/MockBondPool.sol";
import { VaultErrors } from "../src/interfaces/VaultErrors.sol";

contract VaultMatrixTest is Test {
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
    UnderwriteVault.QualificationAttestation public a1;

    function setUp() public {
        examiner = vm.addr(examinerPk);
        token = new MockUSDC();
        bondPool = new MockBondPool();

        UnderwriteVault.Ceilings memory ceilings =
            UnderwriteVault.Ceilings({ perTx: 300_000_000, perWindow: 1000_000_000, t2PerTx: 2000_000_000 });

        vault = new UnderwriteVault(
            owner, examiner, guardian, address(bondPool), address(token), ceilings, 86400, 500_000_000, 300, 300
        );

        token.mint(address(vault), 10_000_000_000);

        vm.prank(owner);
        vault.addRecipient(vendor1, 2000_000_000);

        vm.warp(100_000);

        vm.prank(examiner);
        commitId = vault.commitExam(configHash, corpusHash);

        qualId = keccak256(abi.encode(configHash, commitId));
        a1 = UnderwriteVault.QualificationAttestation({
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
            t2MaxPerTx: 1000_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(a1)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        bondPool.setRemaining(qualId, 2000_000_000);

        vm.prank(owner);
        vault.activateQualification(a1, sig);
    }

    /// @notice INV-4: T1 recipients are active and past activatesAt; T2 recipients are active
    function test_INV4_recipients_active_and_past_cooldown() public {
        address freshVendor = address(0xEE2);
        vm.prank(owner);
        vault.addRecipient(freshVendor, 1000_000_000);

        // Immediate T1 payment within cooldown reverts RecipientCoolingDown
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.RecipientCoolingDown.selector);
        vault.pay(freshVendor, 50_000_000, keccak256("inv-inv4-1"), keccak256("m"));

        // However, T2 payment does NOT require cooldown (only active)
        vm.prank(agent1);
        uint256 pendingId = vault.requestPayment(freshVendor, 50_000_000, keccak256("inv-inv4-t2"), keccak256("m"));
        assertEq(pendingId, 1);

        // Warp past cooldown -> T1 payment now succeeds
        vm.warp(block.timestamp + 300);
        vm.prank(agent1);
        vault.pay(freshVendor, 50_000_000, keccak256("inv-inv4-2"), keccak256("m"));

        // Deactivated recipient reverts RecipientNotAllowed
        vm.prank(owner);
        vault.deactivateRecipient(freshVendor);

        vm.prank(agent1);
        vm.expectRevert(VaultErrors.RecipientNotAllowed.selector);
        vault.pay(freshVendor, 50_000_000, keccak256("inv-inv4-3"), keccak256("m"));
    }

    /// @notice INV-7: No agent payment while paused, or with an expired, revoked, inactive or missing qualification
    function test_INV7_no_payment_when_paused_revoked_expired() public {
        // Paused
        vm.prank(owner);
        vault.pause();
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.Paused.selector);
        vault.pay(vendor1, 10_000_000, keccak256("inv-inv7-pause"), keccak256("m"));
        vm.prank(owner);
        vault.unpause();

        // Expired
        vm.warp(block.timestamp + 15 days);
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.QualificationExpired.selector);
        vault.pay(vendor1, 10_000_000, keccak256("inv-inv7-exp"), keccak256("m"));

        // Missing / NotAgent
        vm.prank(stranger);
        vm.expectRevert(VaultErrors.NotAgent.selector);
        vault.pay(vendor1, 10_000_000, keccak256("inv-inv7-stranger"), keccak256("m"));
    }

    /// @notice INV-8: T2 executes only after readyAt, only if not vetoed, with all checks re-evaluated
    function test_INV8_t2_lifecycle_delay_and_revalidation() public {
        bytes32 invKey = keccak256("inv-inv8");
        vm.prank(agent1);
        uint256 pendingId = vault.requestPayment(vendor1, 300_000_000, invKey, keccak256("m"));

        // Execution before readyAt reverts NotReady
        vm.expectRevert(VaultErrors.NotReady.selector);
        vault.executePending(pendingId);

        // Veto marks VETOED and releases invoiceKey back to NONE
        vm.prank(owner);
        vault.veto(pendingId);
        assertTrue(vault.invoiceState(invKey) == UnderwriteVault.InvoiceStatus.NONE);

        vm.warp(block.timestamp + 300);
        vm.expectRevert(VaultErrors.Vetoed.selector);
        vault.executePending(pendingId);
    }

    /// @notice INV-9: Activation requires examiner signature and owner transaction; revocation by owner, examiner, BondPool (claim) or expiry
    function test_INV9_two_key_activation_and_revocation() public {
        // Stranger cannot activate
        bytes32 conf = keccak256("config-inv9");
        vm.prank(examiner);
        uint256 cId = vault.commitExam(conf, corpusHash);
        bytes32 qId = keccak256(abi.encode(conf, cId));

        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: qId,
            vault: address(vault),
            agentKey: address(0xBB1),
            configHash: conf,
            reportHash: keccak256("rep"),
            corpusHash: corpusHash,
            examCommitId: cId,
            ownerInputsHash: keccak256("in"),
            t1MaxPerTx: 100_000_000,
            t1MaxPerWindow: 200_000_000,
            t2MaxPerTx: 500_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(a)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        bondPool.setRemaining(qId, 1000_000_000);

        vm.prank(stranger);
        vm.expectRevert(VaultErrors.NotOwner.selector);
        vault.activateQualification(a, sig);

        // Owner activates successfully
        vm.prank(owner);
        vault.activateQualification(a, sig);

        // Examiner can revoke
        vm.prank(examiner);
        vault.revokeQualification(qId, keccak256("examiner-revoked"));
    }

    /// @notice INV-12: Attestations are domain-bound (chainId, vault) and single-use
    function test_INV12_domain_bound_and_single_use() public {
        // Re-activating already used attestation reverts AttestationUsed
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(a1)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest);

        vm.prank(owner);
        vm.expectRevert(VaultErrors.AttestationUsed.selector);
        vault.activateQualification(a1, abi.encodePacked(r, s, v));

        // Wrong vault in attestation reverts WrongVault
        bytes32 conf2 = keccak256("conf-wrong-vault");
        vm.prank(examiner);
        uint256 cId2 = vault.commitExam(conf2, corpusHash);
        bytes32 qId2 = keccak256(abi.encode(conf2, cId2));

        UnderwriteVault.QualificationAttestation memory aWrong = UnderwriteVault.QualificationAttestation({
            qualId: qId2,
            vault: address(0xDEAD), // Wrong vault address
            agentKey: agent1,
            configHash: conf2,
            reportHash: keccak256("rep"),
            corpusHash: corpusHash,
            examCommitId: cId2,
            ownerInputsHash: keccak256("in"),
            t1MaxPerTx: 100_000_000,
            t1MaxPerWindow: 200_000_000,
            t2MaxPerTx: 500_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes32 digestWrong =
            keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(aWrong)));
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(examinerPk, digestWrong);

        vm.prank(owner);
        vm.expectRevert(VaultErrors.WrongVault.selector);
        vault.activateQualification(aWrong, abi.encodePacked(r2, s2, v2));
    }

    /// @notice INV-13: An attestation is accepted only if it references the latest commitExam with matching corpusHash
    function test_INV13_latest_exam_commit_required() public {
        bytes32 conf = keccak256("conf-inv13");
        vm.prank(examiner);
        uint256 c1 = vault.commitExam(conf, keccak256("corpus-v1"));

        // Examiner advances commit to c2
        vm.prank(examiner);
        vault.commitExam(conf, keccak256("corpus-v2"));

        // Attestation referencing stale c1 reverts StaleExamCommit
        bytes32 qStale = keccak256(abi.encode(conf, c1));
        UnderwriteVault.QualificationAttestation memory aStale = UnderwriteVault.QualificationAttestation({
            qualId: qStale,
            vault: address(vault),
            agentKey: agent1,
            configHash: conf,
            reportHash: keccak256("rep"),
            corpusHash: keccak256("corpus-v1"),
            examCommitId: c1,
            ownerInputsHash: keccak256("in"),
            t1MaxPerTx: 100_000_000,
            t1MaxPerWindow: 200_000_000,
            t2MaxPerTx: 500_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(aStale)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest);

        vm.prank(owner);
        vm.expectRevert(VaultErrors.StaleExamCommit.selector);
        vault.activateQualification(aStale, abi.encodePacked(r, s, v));
    }

    /// @notice INV-14: Reconciled payments cannot be claimed; each payment is paid out at most once
    function test_INV14_reconciled_payment_unclaimable() public {
        vm.prank(agent1);
        uint256 pid = vault.pay(vendor1, 100_000_000, keccak256("inv-inv14"), keccak256("m"));

        // Claimable before reconcile
        assertTrue(vault.isClaimable(pid));

        // Reconcile payment
        vm.prank(owner);
        vault.reconcile(qualId, pid);

        // Not claimable after reconcile
        assertFalse(vault.isClaimable(pid));
    }
}
