// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { UnderwriteVault } from "../src/UnderwriteVault.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { MockBondPool } from "./mocks/MockBondPool.sol";
import { VaultErrors } from "../src/interfaces/VaultErrors.sol";

contract VaultFuzzTest is Test {
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

    uint256 public constant T1_MAX_PER_TX = 180_000_000; // 180 USDC
    uint256 public constant T1_MAX_PER_WINDOW = 500_000_000; // 500 USDC
    uint256 public constant T2_MAX_PER_TX = 1000_000_000; // 1000 USDC
    uint256 public constant RESERVE_FLOOR = 500_000_000; // 500 USDC

    function setUp() public {
        examiner = vm.addr(examinerPk);
        token = new MockUSDC();
        bondPool = new MockBondPool();

        UnderwriteVault.Ceilings memory ceilings =
            UnderwriteVault.Ceilings({ perTx: 300_000_000, perWindow: 1000_000_000, t2PerTx: 2000_000_000 });

        vault = new UnderwriteVault(
            owner, examiner, guardian, address(bondPool), address(token), ceilings, 86400, RESERVE_FLOOR, 300, 300
        );

        token.mint(address(vault), 100_000_000_000); // 100,000 USDC

        vm.prank(owner);
        vault.addRecipient(vendor1, 100_000_000_000);

        vm.warp(100_000);

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
            t1MaxPerTx: T1_MAX_PER_TX,
            t1MaxPerWindow: T1_MAX_PER_WINDOW,
            t2MaxPerTx: T2_MAX_PER_TX,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(a)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        bondPool.setRemaining(qualId, 100_000_000_000);

        vm.prank(owner);
        vault.activateQualification(a, sig);
    }

    /// @notice INV-2: For every qual and window: sum(T1 amounts) <= effective t1MaxPerWindow
    function testFuzz_INV2_window_limit_strictly_enforced(uint256 amount1, uint256 amount2) public {
        amount1 = bound(amount1, 1, T1_MAX_PER_TX);
        amount2 = bound(amount2, 1, T1_MAX_PER_TX);

        vm.prank(agent1);
        vault.pay(vendor1, amount1, keccak256("inv-inv2-1"), keccak256("m1"));

        uint256 windowId = block.timestamp / 86400;
        assertLe(vault.qualWindowSpent(qualId, windowId), T1_MAX_PER_WINDOW);

        if (amount1 + amount2 > T1_MAX_PER_WINDOW) {
            vm.prank(agent1);
            vm.expectRevert(VaultErrors.ExceedsWindow.selector);
            vault.pay(vendor1, amount2, keccak256("inv-inv2-2"), keccak256("m2"));
        } else {
            vm.prank(agent1);
            vault.pay(vendor1, amount2, keccak256("inv-inv2-2"), keccak256("m2"));
            assertLe(vault.qualWindowSpent(qualId, windowId), T1_MAX_PER_WINDOW);
        }
    }

    /// @notice INV-3: Every T1 amount <= effective t1MaxPerTx; every T2 amount <= t2MaxPerTx
    function testFuzz_INV3_per_tx_limits(uint256 amount) public {
        amount = bound(amount, 0, 5000_000_000);

        if (amount > T1_MAX_PER_TX) {
            vm.prank(agent1);
            vm.expectRevert(VaultErrors.ExceedsPerTx.selector);
            vault.pay(vendor1, amount, keccak256(abi.encode("inv-inv3-t1", amount)), keccak256("m"));
        }

        if (amount > T2_MAX_PER_TX) {
            vm.prank(agent1);
            vm.expectRevert(VaultErrors.ExceedsPerTx.selector);
            vault.requestPayment(vendor1, amount, keccak256(abi.encode("inv-inv3-t2", amount)), keccak256("m"));
        }
    }

    /// @notice INV-5: Each invoiceKey reaches PAID at most once; RESERVED blocks reuse
    function testFuzz_INV5_invoice_single_use(bytes32 invoiceKey, uint256 amount) public {
        vm.assume(invoiceKey != bytes32(0));
        amount = bound(amount, 1, T1_MAX_PER_TX);

        vm.prank(agent1);
        vault.pay(vendor1, amount, invoiceKey, keccak256("m1"));

        assertTrue(vault.invoiceState(invoiceKey) == UnderwriteVault.InvoiceStatus.PAID);

        // Subsequent T1 call with same invoiceKey reverts DuplicateInvoice
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.DuplicateInvoice.selector);
        vault.pay(vendor1, amount, invoiceKey, keccak256("m2"));

        // Subsequent T2 call with same invoiceKey reverts DuplicateInvoice
        vm.prank(agent1);
        vm.expectRevert(VaultErrors.DuplicateInvoice.selector);
        vault.requestPayment(vendor1, amount, invoiceKey, keccak256("m3"));
    }

    /// @notice INV-6: Vault balance after any agent payment >= reserveFloor
    function testFuzz_INV6_reserve_floor_never_breached(uint256 drainAmount, uint256 paymentAmount) public {
        uint256 currentBalance = token.balanceOf(address(vault));
        // Drain vault to a controlled balance between 0 and currentBalance
        drainAmount = bound(drainAmount, 0, currentBalance);
        if (drainAmount > 0) {
            vm.prank(owner);
            vault.ownerTransfer(stranger, drainAmount);
        }

        uint256 bal = token.balanceOf(address(vault));
        paymentAmount = bound(paymentAmount, 1, T1_MAX_PER_TX);

        if (bal < paymentAmount || bal - paymentAmount < RESERVE_FLOOR) {
            vm.prank(agent1);
            vm.expectRevert(VaultErrors.ReserveBreached.selector);
            vault.pay(vendor1, paymentAmount, keccak256("inv-inv6"), keccak256("m"));
        } else {
            vm.prank(agent1);
            vault.pay(vendor1, paymentAmount, keccak256("inv-inv6"), keccak256("m"));
            assertGe(token.balanceOf(address(vault)), RESERVE_FLOOR);
        }
    }
}
