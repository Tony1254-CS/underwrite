// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { UnderwriteVault } from "../src/UnderwriteVault.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { MockBondPool } from "./mocks/MockBondPool.sol";
import { VaultErrors } from "../src/interfaces/VaultErrors.sol";

contract VaultPayTest is Test {
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
            300,
            300 // 300s cooldown
        );

        // Fund vault with 5000 USDC
        token.mint(address(vault), 5000_000_000);

        // Register vendor1 with 500 USDC window cap
        vm.prank(owner);
        vault.addRecipient(vendor1, 500_000_000);

        // Warp past vendor cooldown
        vm.warp(100_000);

        // Commit exam
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
            t1MaxPerTx: 180_000_000, // 180 USDC
            t1MaxPerWindow: 500_000_000, // 500 USDC
            t2MaxPerTx: 1000_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(a)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        // Set bond pool remaining
        bondPool.setRemaining(qualId, 1000_000_000);

        // Activate qualification
        vm.prank(owner);
        vault.activateQualification(a, sig);
    }

    function test_happy_path_pay() public {
        bytes32 invoiceKey = keccak256("inv1");
        bytes32 memoHash = keccak256("memo1");
        uint256 amount = 100_000_000; // 100 USDC

        uint256 vendorBalBefore = token.balanceOf(vendor1);
        uint256 vaultBalBefore = token.balanceOf(address(vault));

        vm.prank(agent1);
        uint256 paymentId = vault.pay(vendor1, amount, invoiceKey, memoHash);

        assertEq(paymentId, 1);
        assertEq(token.balanceOf(vendor1) - vendorBalBefore, amount);
        assertEq(vaultBalBefore - token.balanceOf(address(vault)), amount);
        assertEq(vault.exposure(qualId), amount);
        assertEq(uint256(vault.invoiceState(invoiceKey)), uint256(UnderwriteVault.InvoiceStatus.PAID));
    }

    function test_revert_paused() public {
        vm.prank(guardian);
        vault.pause();

        vm.prank(agent1);
        vm.expectRevert(VaultErrors.Paused.selector);
        vault.pay(vendor1, 10_000_000, keccak256("inv-p"), keccak256("memo"));
    }

    function test_revert_not_agent() public {
        vm.prank(stranger);
        vm.expectRevert(VaultErrors.NotAgent.selector);
        vault.pay(vendor1, 10_000_000, keccak256("inv-na"), keccak256("memo"));
    }

    function test_revert_no_active_qualification() public {
        // Agent was active, then revoked
        vm.prank(owner);
        vault.revokeQualification(qualId, keccak256("REVOKE"));

        vm.prank(agent1);
        vm.expectRevert(VaultErrors.NoActiveQualification.selector);
        vault.pay(vendor1, 10_000_000, keccak256("inv-no-act"), keccak256("memo"));
    }

    function test_revert_qualification_expired() public {
        vm.warp(block.timestamp + 15 days); // Past expiration

        vm.prank(agent1);
        vm.expectRevert(VaultErrors.QualificationExpired.selector);
        vault.pay(vendor1, 10_000_000, keccak256("inv-exp"), keccak256("memo"));
    }

    function test_revert_recipient_not_allowed() public {
        address unallowedVendor = address(0x999);

        vm.prank(agent1);
        vm.expectRevert(VaultErrors.RecipientNotAllowed.selector);
        vault.pay(unallowedVendor, 10_000_000, keccak256("inv-unall"), keccak256("memo"));
    }

    function test_revert_recipient_cooling_down() public {
        address newVendor = address(0x888);
        vm.prank(owner);
        vault.addRecipient(newVendor, 500_000_000);

        // Immediate payment without waiting 300s
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.RecipientCoolingDown.selector);
        vault.pay(newVendor, 10_000_000, keccak256("inv-cool"), keccak256("memo"));
    }

    function test_revert_exceeds_per_tx() public {
        // Max T1 per tx is 180 USDC
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.ExceedsPerTx.selector);
        vault.pay(vendor1, 180_000_001, keccak256("inv-tx"), keccak256("memo"));
    }

    function test_revert_exceeds_window() public {
        // Window limit is 500 USDC. Pay 180 twice, then 180 exceeds 500.
        vm.startPrank(agent1);
        vault.pay(vendor1, 180_000_000, keccak256("w1"), keccak256("m1"));
        vault.pay(vendor1, 180_000_000, keccak256("w2"), keccak256("m2"));

        vm.expectRevert(VaultErrors.ExceedsWindow.selector);
        vault.pay(vendor1, 180_000_000, keccak256("w3"), keccak256("m3"));
        vm.stopPrank();
    }

    function test_revert_exceeds_recipient_window() public {
        // Vendor cap is 500 USDC. Set agent qual window limit higher to test recipient window specifically.
        address agent2 = address(0xAA2);
        vm.prank(examiner);
        uint256 commitId2 = vault.commitExam(configHash, corpusHash);
        bytes32 qual2 = keccak256(abi.encode(configHash, commitId2));

        UnderwriteVault.QualificationAttestation memory a2 = UnderwriteVault.QualificationAttestation({
            qualId: qual2,
            vault: address(vault),
            agentKey: agent2,
            configHash: configHash,
            reportHash: keccak256("report2"),
            corpusHash: corpusHash,
            examCommitId: commitId2,
            ownerInputsHash: keccak256("inputs2"),
            t1MaxPerTx: 300_000_000,
            t1MaxPerWindow: 1000_000_000, // Higher than vendor 500 cap
            t2MaxPerTx: 1000_000_000,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes32 digest2 = keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(a2)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest2);
        bytes memory sig2 = abi.encodePacked(r, s, v);

        bondPool.setRemaining(qual2, 1000_000_000);
        vm.prank(owner);
        vault.activateQualification(a2, sig2);

        vm.startPrank(agent2);
        vault.pay(vendor1, 300_000_000, keccak256("rw1"), keccak256("m1"));

        // 300 + 250 = 550 > 500 recipient cap (qual cap 1000 is not reached)
        vm.expectRevert(VaultErrors.ExceedsRecipientWindow.selector);
        vault.pay(vendor1, 250_000_000, keccak256("rw2"), keccak256("m2"));
        vm.stopPrank();
    }

    function test_revert_duplicate_invoice() public {
        bytes32 inv = keccak256("inv-dup");
        vm.startPrank(agent1);
        vault.pay(vendor1, 50_000_000, inv, keccak256("m1"));

        vm.expectRevert(VaultErrors.DuplicateInvoice.selector);
        vault.pay(vendor1, 50_000_000, inv, keccak256("m2"));
        vm.stopPrank();
    }

    function test_revert_insufficient_backing() public {
        // BondPool has remaining 100 USDC backing
        bondPool.setRemaining(qualId, 100_000_000);

        vm.prank(agent1);
        vm.expectRevert(VaultErrors.InsufficientBacking.selector);
        vault.pay(vendor1, 150_000_000, keccak256("inv-ib"), keccak256("m"));
    }

    function test_revert_reserve_breached() public {
        // Vault has 5000 USDC, reserve floor is 500 USDC.
        // Drain vault to 550 USDC
        vm.prank(owner);
        vault.ownerTransfer(owner, 4450_000_000);

        // Attempting to pay 100 USDC leaves 450 USDC (< 500 reserve floor)
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.ReserveBreached.selector);
        vault.pay(vendor1, 100_000_000, keccak256("inv-rb"), keccak256("m"));
    }
}
