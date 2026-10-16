// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { BondPool } from "../src/BondPool.sol";
import { BondPoolErrors } from "../src/interfaces/BondPoolErrors.sol";

contract MockVaultForBondPool {
    struct QualView {
        bool active;
        uint256 expiresAt;
    }

    struct PaymentView {
        bytes32 qualId;
        uint256 amount;
    }

    mapping(bytes32 => QualView) public qualsView;
    mapping(uint256 => bool) public claimableMap;
    mapping(uint256 => PaymentView) public paymentView;

    function setQual(bytes32 qualId, bool active, uint256 expiresAt) external {
        qualsView[qualId] = QualView({ active: active, expiresAt: expiresAt });
    }

    function setClaimable(uint256 paymentId, bool claimable) external {
        claimableMap[paymentId] = claimable;
    }

    function setPayment(uint256 paymentId, bytes32 qualId, uint256 amount) external {
        paymentView[paymentId] = PaymentView({ qualId: qualId, amount: amount });
    }

    function isClaimable(uint256 paymentId) external view returns (bool) {
        return claimableMap[paymentId];
    }

    function suspendForClaim(bytes32 qualId, uint256) external {
        qualsView[qualId].active = false;
    }

    function quals(bytes32 qualId)
        external
        view
        returns (
            bytes32,
            address,
            address,
            bytes32,
            bytes32,
            bytes32,
            uint256,
            bytes32,
            uint256,
            uint256,
            uint256,
            bool,
            uint256,
            uint256,
            address,
            bool,
            bool,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        QualView memory q = qualsView[qualId];
        return (
            qualId,
            address(this),
            address(0),
            bytes32(0),
            bytes32(0),
            bytes32(0),
            1,
            bytes32(0),
            100e6,
            500e6,
            0,
            false,
            block.timestamp,
            q.expiresAt,
            address(0),
            q.active,
            !q.active,
            block.timestamp,
            100e6,
            500e6,
            0
        );
    }

    function payments(uint256 paymentId)
        external
        view
        returns (bytes32, address, uint256, bytes32, bytes32, uint8, uint256, bool)
    {
        PaymentView memory p = paymentView[paymentId];
        return (p.qualId, address(0xBEEF), p.amount, bytes32(0), bytes32(0), 1, block.timestamp, false);
    }
}

contract BondPoolCoreTest is Test, BondPoolErrors {
    BondPool public pool;
    MockUSDC public token;
    MockVaultForBondPool public mockVault;

    address public underwriter = address(0x1111);
    address public adjudicator = address(0x2222);
    address public stranger = address(0x9999);

    uint256 public deductible = 5e6; // 5 USDC
    uint256 public perClaimCap = 500e6; // 500 USDC
    uint256 public claimGrace = 7 days; // 604800s

    function setUp() public {
        token = new MockUSDC();
        pool = new BondPool(underwriter, adjudicator, address(token), deductible, perClaimCap, claimGrace);
        mockVault = new MockVaultForBondPool();

        token.mint(underwriter, 100_000e6);
        vm.prank(underwriter);
        token.approve(address(pool), type(uint256).max);
    }

    function test_setVault_once_by_underwriter() public {
        vm.prank(stranger);
        vm.expectRevert(NotUnderwriter.selector);
        pool.setVault(address(mockVault));

        vm.prank(underwriter);
        pool.setVault(address(mockVault));
        assertEq(pool.vault(), address(mockVault));
        assertTrue(pool.vaultSet());

        // Second call reverts
        vm.prank(underwriter);
        vm.expectRevert(VaultAlreadySet.selector);
        pool.setVault(address(mockVault));
    }

    function test_deposit_and_withdrawFree() public {
        vm.prank(underwriter);
        pool.deposit(1000e6);
        assertEq(pool.free(), 1000e6);
        assertEq(token.balanceOf(address(pool)), 1000e6);

        // Stranger cannot deposit or withdraw
        vm.prank(stranger);
        vm.expectRevert(NotUnderwriter.selector);
        pool.deposit(100e6);

        vm.prank(stranger);
        vm.expectRevert(NotUnderwriter.selector);
        pool.withdrawFree(100e6);

        // Underwriter withdraws partial
        vm.prank(underwriter);
        pool.withdrawFree(400e6);
        assertEq(pool.free(), 600e6);
        assertEq(token.balanceOf(address(pool)), 600e6);

        // Underwriter cannot withdraw more than free
        vm.prank(underwriter);
        vm.expectRevert(InsufficientFreeBalance.selector);
        pool.withdrawFree(700e6);
    }

    function test_lock_by_vault_only_and_bounds() public {
        vm.prank(underwriter);
        pool.setVault(address(mockVault));

        vm.prank(underwriter);
        pool.deposit(1000e6);

        bytes32 qualId = keccak256("qual-1");

        // Stranger cannot lock
        vm.prank(stranger);
        vm.expectRevert(NotVault.selector);
        pool.lock(qualId, 500e6);

        // Vault locks successfully
        vm.prank(address(mockVault));
        pool.lock(qualId, 500e6);

        assertEq(pool.free(), 500e6);
        assertEq(pool.locked(qualId), 500e6);
        assertEq(pool.remaining(qualId), 500e6);

        // Vault lock exceeds free balance
        vm.prank(address(mockVault));
        vm.expectRevert(InsufficientFreeBalance.selector);
        pool.lock(qualId, 600e6);
    }

    function test_release_rules() public {
        vm.prank(underwriter);
        pool.setVault(address(mockVault));

        vm.prank(underwriter);
        pool.deposit(1000e6);

        bytes32 qualId = keccak256("qual-2");
        uint256 expiresAt = block.timestamp + 14 days;
        mockVault.setQual(qualId, true, expiresAt);

        vm.prank(address(mockVault));
        pool.lock(qualId, 800e6);

        // 1. Release fails while active
        vm.expectRevert(QualificationStillActive.selector);
        pool.release(qualId);

        // Mark inactive but claimGrace not elapsed
        mockVault.setQual(qualId, false, expiresAt);
        vm.expectRevert(ClaimGraceNotElapsed.selector);
        pool.release(qualId);

        // Warp past expiresAt + claimGrace
        vm.warp(expiresAt + claimGrace + 1);

        // 2. Release succeeds and moves capital back to free
        pool.release(qualId);
        assertEq(pool.remaining(qualId), 0);
        assertEq(pool.free(), 1000e6);

        // 3. Second release reverts with NoLockedCapital
        vm.expectRevert(NoLockedCapital.selector);
        pool.release(qualId);
    }
}
