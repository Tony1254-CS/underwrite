// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { MockUSDC } from "../../src/MockUSDC.sol";
import { UnderwriteVault } from "../../src/UnderwriteVault.sol";
import { BondPool } from "../../src/BondPool.sol";
import { VaultErrors } from "../../src/interfaces/VaultErrors.sol";
import { BondPoolErrors } from "../../src/interfaces/BondPoolErrors.sol";

contract VaultBondPoolIntegrationTest is Test, VaultErrors, BondPoolErrors {
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

    bytes32 public configHash = keccak256("agent-config-1");
    bytes32 public corpusHash = keccak256("corpus-v1");

    uint256 public constant DEDUCTIBLE = 5e6; // 5 USDC
    uint256 public constant PER_CLAIM_CAP = 500e6; // 500 USDC
    uint256 public constant CLAIM_GRACE = 7 days; // 604800s

    function setUp() public {
        examiner = vm.addr(examinerPk);
        token = new MockUSDC();

        // 1. Deploy real BondPool
        bondPool = new BondPool(underwriter, adjudicator, address(token), DEDUCTIBLE, PER_CLAIM_CAP, CLAIM_GRACE);

        // 2. Deploy real UnderwriteVault referencing the real BondPool
        UnderwriteVault.Ceilings memory ceilings =
            UnderwriteVault.Ceilings({ perTx: 300e6, perWindow: 1000e6, t2PerTx: 2000e6 });

        vault = new UnderwriteVault(
            owner, examiner, guardian, address(bondPool), address(token), ceilings, 86400, 500e6, 300, 300
        );

        // 3. Underwriter binds vault in BondPool
        vm.prank(underwriter);
        bondPool.setVault(address(vault));

        // 4. Fund contracts
        token.mint(address(vault), 10_000e6);
        token.mint(underwriter, 50_000e6);

        vm.prank(underwriter);
        token.approve(address(bondPool), type(uint256).max);

        // Add recipient in vault
        vm.prank(owner);
        vault.addRecipient(recipient, 2000e6);
        vm.warp(block.timestamp + 301); // past cooldown
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

    function test_integration_lock_on_activation_and_bond_lock_failed() public {
        // Examiner commits exam
        vm.prank(examiner);
        uint256 commitId = vault.commitExam(configHash, corpusHash);
        bytes32 qualId = keccak256(abi.encode(configHash, commitId));

        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: qualId,
            vault: address(vault),
            agentKey: agent,
            configHash: configHash,
            reportHash: keccak256("report1"),
            corpusHash: corpusHash,
            examCommitId: commitId,
            ownerInputsHash: keccak256("owner1"),
            t1MaxPerTx: 200e6,
            t1MaxPerWindow: 800e6,
            t2MaxPerTx: 1000e6,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes memory sig = _signAttestation(a, examinerPk);

        // 1. Activation fails when BondPool has 0 free capital => BondLockFailed
        assertEq(bondPool.free(), 0);
        vm.prank(owner);
        vm.expectRevert(BondLockFailed.selector);
        vault.activateQualification(a, sig);

        // 2. Underwriter deposits sufficient capital to BondPool (1000 USDC)
        vm.prank(underwriter);
        bondPool.deposit(1000e6);
        assertEq(bondPool.free(), 1000e6);

        // 3. Activation succeeds with real BondPool lock
        vm.prank(owner);
        vault.activateQualification(a, sig);

        assertEq(bondPool.free(), 200e6); // 1000 - 800
        assertEq(bondPool.locked(qualId), 800e6);
        assertEq(bondPool.remaining(qualId), 800e6);
    }

    function test_integration_insufficient_backing_and_reconcile() public {
        // Setup underwriter deposit with 500 USDC
        vm.prank(underwriter);
        bondPool.deposit(500e6);

        // Examiner commits exam
        vm.prank(examiner);
        uint256 commitId = vault.commitExam(configHash, corpusHash);
        bytes32 qualId = keccak256(abi.encode(configHash, commitId));

        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: qualId,
            vault: address(vault),
            agentKey: agent,
            configHash: configHash,
            reportHash: keccak256("report1"),
            corpusHash: corpusHash,
            examCommitId: commitId,
            ownerInputsHash: keccak256("owner1"),
            t1MaxPerTx: 200e6,
            t1MaxPerWindow: 500e6,
            t2MaxPerTx: 1000e6,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes memory sig = _signAttestation(a, examinerPk);

        vm.prank(owner);
        vault.activateQualification(a, sig);
        assertEq(bondPool.remaining(qualId), 500e6);

        // Agent executes payment 1: 200 USDC
        vm.prank(agent);
        uint256 pid1 = vault.pay(recipient, 200e6, keccak256("inv-1"), keccak256("memo-1"));
        assertEq(pid1, 1);
        assertEq(vault.exposure(qualId), 200e6);

        // Agent executes payment 2: 200 USDC
        vm.prank(agent);
        uint256 pid2 = vault.pay(recipient, 200e6, keccak256("inv-2"), keccak256("memo-2"));
        assertEq(pid2, 2);
        assertEq(vault.exposure(qualId), 400e6);

        // Warp across window boundary: resets qualWindowSpent to 0, but exposure remains 400e6 (unreconciled)
        vm.warp(block.timestamp + 86401);

        // Agent attempts payment 3: 200 USDC -> window is 0 + 200 <= 500, but exposure would be 600 > 500 remaining => InsufficientBacking
        vm.prank(agent);
        vm.expectRevert(InsufficientBacking.selector);
        vault.pay(recipient, 200e6, keccak256("inv-3"), keccak256("memo-3"));

        // Owner reconciles payments up to pid2 => clears 400 USDC exposure
        vm.prank(owner);
        vault.reconcile(qualId, pid2);
        assertEq(vault.exposure(qualId), 0);

        // Now payment 3 succeeds
        vm.prank(agent);
        uint256 pid3 = vault.pay(recipient, 200e6, keccak256("inv-3"), keccak256("memo-3"));
        assertEq(pid3, 3);
        assertEq(vault.exposure(qualId), 200e6);
    }
}
