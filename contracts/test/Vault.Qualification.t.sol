// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { UnderwriteVault } from "../src/UnderwriteVault.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { MockBondPool } from "./mocks/MockBondPool.sol";
import { VaultErrors } from "../src/interfaces/VaultErrors.sol";

contract VaultQualificationTest is Test {
    UnderwriteVault public vault;
    MockUSDC public token;
    MockBondPool public bondPool;

    address public owner = address(0xA1);
    uint256 public examinerPk = 0xB1E5;
    address public examiner;
    address public guardian = address(0xC1);
    address public stranger = address(0xD1);

    address public agent1 = address(0xAA1);
    bytes32 public configHash1 = keccak256("config1");
    bytes32 public corpusHash1 = keccak256("corpus1");

    function setUp() public {
        examiner = vm.addr(examinerPk);
        token = new MockUSDC();
        bondPool = new MockBondPool();

        UnderwriteVault.Ceilings memory ceilings =
            UnderwriteVault.Ceilings({ perTx: 300_000_000, perWindow: 1000_000_000, t2PerTx: 2000_000_000 });

        vault = new UnderwriteVault(
            owner, examiner, guardian, address(bondPool), address(token), ceilings, 86400, 500_000_000, 300, 300
        );

        token.mint(address(vault), 5000_000_000);
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

    function test_commit_exam_and_happy_path_activate() public {
        // Examiner commits exam
        vm.prank(examiner);
        uint256 commitId = vault.commitExam(configHash1, corpusHash1);
        assertEq(commitId, 1);

        bytes32 qualId1 = keccak256(abi.encode(configHash1, commitId));
        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: qualId1,
            vault: address(vault),
            agentKey: agent1,
            configHash: configHash1,
            reportHash: keccak256("report1"),
            corpusHash: corpusHash1,
            examCommitId: commitId,
            ownerInputsHash: keccak256("inputs1"),
            t1MaxPerTx: 180_000_000,
            t1MaxPerWindow: 180_000_000,
            t2MaxPerTx: 500_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes memory sig = _signAttestation(a, examinerPk);

        vm.prank(owner);
        vault.activateQualification(a, sig);

        assertEq(vault.activeQualOf(agent1), qualId1);
        assertTrue(vault.usedAttestation(qualId1));
        assertEq(vault.ownerInputsHashOf(qualId1), a.ownerInputsHash);
        assertEq(bondPool.lockedAmount(qualId1), uint256(180_000_000));
    }

    function test_revert_wrong_vault() public {
        vm.prank(examiner);
        uint256 commitId = vault.commitExam(configHash1, corpusHash1);

        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: keccak256("qual-wrong-vault"),
            vault: address(0xDEAD),
            agentKey: agent1,
            configHash: configHash1,
            reportHash: keccak256("report1"),
            corpusHash: corpusHash1,
            examCommitId: commitId,
            ownerInputsHash: keccak256("inputs1"),
            t1MaxPerTx: 180_000_000,
            t1MaxPerWindow: 180_000_000,
            t2MaxPerTx: 500_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes memory sig = _signAttestation(a, examinerPk);

        vm.prank(owner);
        vm.expectRevert(VaultErrors.WrongVault.selector);
        vault.activateQualification(a, sig);
    }

    function test_revert_attestation_used() public {
        test_commit_exam_and_happy_path_activate();

        // Try activating exact same qualification again
        bytes32 qualId1 = keccak256(abi.encode(configHash1, uint256(1)));
        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: qualId1,
            vault: address(vault),
            agentKey: agent1,
            configHash: configHash1,
            reportHash: keccak256("report1"),
            corpusHash: corpusHash1,
            examCommitId: 1,
            ownerInputsHash: keccak256("inputs1"),
            t1MaxPerTx: 180_000_000,
            t1MaxPerWindow: 180_000_000,
            t2MaxPerTx: 500_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes memory sig = _signAttestation(a, examinerPk);

        vm.prank(owner);
        vm.expectRevert(VaultErrors.AttestationUsed.selector);
        vault.activateQualification(a, sig);
    }

    function test_revert_expired() public {
        vm.warp(100_000); // Ensure block.timestamp > 1000
        vm.prank(examiner);
        uint256 commitId = vault.commitExam(configHash1, corpusHash1);

        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: keccak256("qual-expired"),
            vault: address(vault),
            agentKey: agent1,
            configHash: configHash1,
            reportHash: keccak256("report1"),
            corpusHash: corpusHash1,
            examCommitId: commitId,
            ownerInputsHash: keccak256("inputs1"),
            t1MaxPerTx: 180_000_000,
            t1MaxPerWindow: 180_000_000,
            t2MaxPerTx: 500_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp - 100,
            expiresAt: block.timestamp - 1, // Already expired
            examiner: examiner
        });

        bytes memory sig = _signAttestation(a, examinerPk);

        vm.prank(owner);
        vm.expectRevert(VaultErrors.QualificationExpired.selector);
        vault.activateQualification(a, sig);
    }

    function test_revert_stale_exam_commit() public {
        vm.prank(examiner);
        vault.commitExam(configHash1, corpusHash1);
        vm.prank(examiner);
        uint256 commitId2 = vault.commitExam(configHash1, keccak256("corpus-v2"));

        // Attestation specifies old commitId 1
        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: keccak256("qual-stale"),
            vault: address(vault),
            agentKey: agent1,
            configHash: configHash1,
            reportHash: keccak256("report1"),
            corpusHash: corpusHash1,
            examCommitId: 1, // Stale!
            ownerInputsHash: keccak256("inputs1"),
            t1MaxPerTx: 180_000_000,
            t1MaxPerWindow: 180_000_000,
            t2MaxPerTx: 500_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes memory sig = _signAttestation(a, examinerPk);

        vm.prank(owner);
        vm.expectRevert(VaultErrors.StaleExamCommit.selector);
        vault.activateQualification(a, sig);
    }

    function test_revert_bad_signature_or_examiner_rotated() public {
        vm.prank(examiner);
        uint256 commitId = vault.commitExam(configHash1, corpusHash1);

        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: keccak256("qual-bad-sig"),
            vault: address(vault),
            agentKey: agent1,
            configHash: configHash1,
            reportHash: keccak256("report1"),
            corpusHash: corpusHash1,
            examCommitId: commitId,
            ownerInputsHash: keccak256("inputs1"),
            t1MaxPerTx: 180_000_000,
            t1MaxPerWindow: 180_000_000,
            t2MaxPerTx: 500_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        // Sign with stranger pk
        bytes memory badSig = _signAttestation(a, 0x9999);

        vm.prank(owner);
        vm.expectRevert(VaultErrors.BadSignature.selector);
        vault.activateQualification(a, badSig);

        // Valid signature, but examiner was rotated
        bytes memory goodSig = _signAttestation(a, examinerPk);
        vm.prank(owner);
        vault.setExaminer(address(0xB999));

        vm.prank(owner);
        vm.expectRevert(VaultErrors.BadSignature.selector);
        vault.activateQualification(a, goodSig);
    }

    function test_revert_bond_lock_failed() public {
        vm.prank(examiner);
        uint256 commitId = vault.commitExam(configHash1, corpusHash1);
        bytes32 qualId = keccak256("qual-lock-fail");

        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: qualId,
            vault: address(vault),
            agentKey: agent1,
            configHash: configHash1,
            reportHash: keccak256("report1"),
            corpusHash: corpusHash1,
            examCommitId: commitId,
            ownerInputsHash: keccak256("inputs1"),
            t1MaxPerTx: 180_000_000,
            t1MaxPerWindow: 180_000_000,
            t2MaxPerTx: 500_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes memory sig = _signAttestation(a, examinerPk);

        // Tell MockBondPool to fail lock for this qualId
        bondPool.setFailLock(qualId, true);

        vm.prank(owner);
        vm.expectRevert(VaultErrors.BondLockFailed.selector);
        vault.activateQualification(a, sig);
    }

    function test_effective_limits_capped_by_ceilings() public {
        vm.prank(examiner);
        uint256 commitId = vault.commitExam(configHash1, corpusHash1);
        bytes32 qualId = keccak256("qual-high-limits");

        // Attestation has higher limits than vault ceilings (300 / 1000 / 2000)
        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: qualId,
            vault: address(vault),
            agentKey: agent1,
            configHash: configHash1,
            reportHash: keccak256("report1"),
            corpusHash: corpusHash1,
            examCommitId: commitId,
            ownerInputsHash: keccak256("inputs1"),
            t1MaxPerTx: 500_000_000, // Capped to 300_000_000
            t1MaxPerWindow: 2000_000_000, // Capped to 1000_000_000
            t2MaxPerTx: 5000_000_000, // Capped to 2000_000_000
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes memory sig = _signAttestation(a, examinerPk);

        vm.prank(owner);
        vault.activateQualification(a, sig);

        UnderwriteVault.StoredQualification memory sq = vault.getQualification(qualId);
        assertEq(sq.effectiveT1MaxPerTx, 300_000_000);
        assertEq(sq.effectiveT1MaxPerWindow, 1000_000_000);
        assertEq(sq.effectiveT2MaxPerTx, 2000_000_000);
        assertEq(bondPool.lockedAmount(qualId), 1000_000_000);
    }

    function test_supersede_and_revocations() public {
        test_commit_exam_and_happy_path_activate();
        bytes32 qual1 = vault.activeQualOf(agent1);

        // Activate qual 2 for agent 1
        vm.prank(examiner);
        uint256 commitId2 = vault.commitExam(configHash1, corpusHash1);
        bytes32 qual2 = keccak256("qual2");

        UnderwriteVault.QualificationAttestation memory a2 = UnderwriteVault.QualificationAttestation({
            qualId: qual2,
            vault: address(vault),
            agentKey: agent1,
            configHash: configHash1,
            reportHash: keccak256("report2"),
            corpusHash: corpusHash1,
            examCommitId: commitId2,
            ownerInputsHash: keccak256("inputs2"),
            t1MaxPerTx: 100_000_000,
            t1MaxPerWindow: 100_000_000,
            t2MaxPerTx: 200_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes memory sig2 = _signAttestation(a2, examinerPk);
        vm.prank(owner);
        vault.activateQualification(a2, sig2);

        // Qual 1 is now superseded
        assertEq(vault.activeQualOf(agent1), qual2);
        UnderwriteVault.StoredQualification memory sq1 = vault.getQualification(qual1);
        assertFalse(sq1.active);

        // Revoke by examiner
        vm.prank(examiner);
        vault.revokeQualification(qual2, keccak256("EXAMINER_REVOKE"));
        UnderwriteVault.StoredQualification memory sq2 = vault.getQualification(qual2);
        assertFalse(sq2.active);
        assertTrue(sq2.revoked);
        assertEq(vault.activeQualOf(agent1), bytes32(0));

        // Stranger cannot revoke
        vm.prank(stranger);
        vm.expectRevert(VaultErrors.NotOwner.selector);
        vault.revokeQualification(qual1, keccak256("HACK"));
    }
}
