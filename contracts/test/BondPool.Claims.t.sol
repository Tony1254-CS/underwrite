// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { BondPool } from "../src/BondPool.sol";
import { BondPoolErrors } from "../src/interfaces/BondPoolErrors.sol";

contract MockVaultForClaims {
    address public owner;
    mapping(bytes32 => bool) public qualActive;
    mapping(bytes32 => uint256) public qualExpiresAt;
    mapping(uint256 => bool) public claimableMap;
    mapping(uint256 => bytes32) public paymentQual;
    mapping(uint256 => uint256) public paymentAmount;

    bytes32 public suspendedQualId;
    uint256 public suspendedClaimId;

    constructor(address _owner) {
        owner = _owner;
    }

    function setQual(bytes32 qualId, bool active, uint256 expiresAt) external {
        qualActive[qualId] = active;
        qualExpiresAt[qualId] = expiresAt;
    }

    function setPayment(uint256 paymentId, bytes32 qualId, uint256 amount, bool claimable) external {
        paymentQual[paymentId] = qualId;
        paymentAmount[paymentId] = amount;
        claimableMap[paymentId] = claimable;
    }

    function isClaimable(uint256 paymentId) external view returns (bool) {
        return claimableMap[paymentId];
    }

    function suspendForClaim(bytes32 qualId, uint256 claimId) external {
        suspendedQualId = qualId;
        suspendedClaimId = claimId;
        qualActive[qualId] = false;
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
            qualExpiresAt[qualId],
            address(0),
            qualActive[qualId],
            !qualActive[qualId],
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
        return (
            paymentQual[paymentId],
            address(0xCAFE),
            paymentAmount[paymentId],
            bytes32(0),
            bytes32(0),
            1,
            block.timestamp,
            false
        );
    }
}

contract BondPoolClaimsTest is Test, BondPoolErrors {
    BondPool public pool;
    MockUSDC public token;
    MockVaultForClaims public mockVault;

    address public underwriter = address(0x1111);
    address public adjudicator = address(0x2222);
    address public vaultOwner = address(0x3333);
    address public stranger = address(0x9999);

    uint256 public deductible = 5e6; // 5 USDC
    uint256 public perClaimCap = 500e6; // 500 USDC
    uint256 public claimGrace = 7 days; // 604800s

    bytes32 public qualId = keccak256("qual-claims-1");
    uint256 public paymentId = 42;
    uint256 public paymentAmt = 200e6;

    function setUp() public {
        token = new MockUSDC();
        pool = new BondPool(underwriter, adjudicator, address(token), deductible, perClaimCap, claimGrace);
        mockVault = new MockVaultForClaims(vaultOwner);

        vm.prank(underwriter);
        pool.setVault(address(mockVault));

        // Fund underwriter and deposit to bond pool
        token.mint(underwriter, 10_000e6);
        vm.prank(underwriter);
        token.approve(address(pool), type(uint256).max);
        vm.prank(underwriter);
        pool.deposit(2000e6);

        // Lock 500 USDC for qualId
        vm.prank(address(mockVault));
        pool.lock(qualId, 500e6);

        // Setup qualification and payment in mock vault
        mockVault.setQual(qualId, true, block.timestamp + 14 days);
        mockVault.setPayment(paymentId, qualId, paymentAmt, true);
    }

    function test_fileClaim_success_and_reverts() public {
        bytes32 evidenceHash = keccak256("evidence-1");

        // 1. Stranger cannot file claim (only vault owner)
        vm.prank(stranger);
        vm.expectRevert(NotVaultOwner.selector);
        pool.fileClaim(paymentId, 100e6, evidenceHash);

        // 2. Cannot claim more than payment amount
        vm.prank(vaultOwner);
        vm.expectRevert(LossExceedsPaymentAmount.selector);
        pool.fileClaim(paymentId, paymentAmt + 1, evidenceHash);

        // 3. Cannot claim 0 amount
        vm.prank(vaultOwner);
        vm.expectRevert(LossExceedsPaymentAmount.selector);
        pool.fileClaim(paymentId, 0, evidenceHash);

        // 4. Valid fileClaim
        vm.prank(vaultOwner);
        uint256 claimId = pool.fileClaim(paymentId, 100e6, evidenceHash);
        assertEq(claimId, 1);
        assertTrue(pool.claimedPayment(paymentId));
        assertEq(pool.openClaimsCount(qualId), 1);

        // 5. Duplicate claim on same payment reverts PaymentNotClaimable
        vm.prank(vaultOwner);
        vm.expectRevert(PaymentNotClaimable.selector);
        pool.fileClaim(paymentId, 50e6, evidenceHash);
    }

    function test_fileClaim_reverts_if_grace_expired() public {
        uint256 expiresAt = block.timestamp + 14 days;
        mockVault.setQual(qualId, false, expiresAt);

        // Warp past expiresAt + claimGrace
        vm.warp(expiresAt + claimGrace + 1);

        vm.prank(vaultOwner);
        vm.expectRevert(ClaimGraceExpired.selector);
        pool.fileClaim(paymentId, 100e6, keccak256("ev"));
    }

    function test_approveClaim_payout_and_atomic_suspend() public {
        bytes32 evidenceHash = keccak256("evidence-2");
        vm.prank(vaultOwner);
        uint256 claimId = pool.fileClaim(paymentId, 100e6, evidenceHash);

        // Stranger cannot approve
        vm.prank(stranger);
        vm.expectRevert(NotAdjudicator.selector);
        pool.approveClaim(claimId, 100e6);

        // Adjudicator approves claim with approvedLoss = 100 USDC
        // payout = min(approvedLoss - deductible, perClaimCap, remaining)
        // payout = min(100 - 5, 500, 500) = 95 USDC
        vm.prank(adjudicator);
        uint256 payout = pool.approveClaim(claimId, 100e6);

        assertEq(payout, 95e6);
        assertEq(token.balanceOf(address(mockVault)), 95e6);
        assertEq(pool.paidOut(qualId), 95e6);
        assertEq(pool.remaining(qualId), 405e6);
        assertEq(mockVault.suspendedQualId(), qualId);
        assertEq(mockVault.suspendedClaimId(), claimId);
        assertEq(pool.openClaimsCount(qualId), 0);

        // Second approve reverts ClaimAlreadyResolved
        vm.prank(adjudicator);
        vm.expectRevert(ClaimAlreadyResolved.selector);
        pool.approveClaim(claimId, 100e6);
    }

    function test_rejectClaim_lifecycle() public {
        bytes32 evidenceHash = keccak256("evidence-3");
        vm.prank(vaultOwner);
        uint256 claimId = pool.fileClaim(paymentId, 100e6, evidenceHash);

        // Stranger cannot reject
        vm.prank(stranger);
        vm.expectRevert(NotAdjudicator.selector);
        pool.rejectClaim(claimId, keccak256("fraud-not-proven"));

        // Adjudicator rejects
        vm.prank(adjudicator);
        pool.rejectClaim(claimId, keccak256("fraud-not-proven"));

        assertEq(pool.openClaimsCount(qualId), 0);
        assertEq(token.balanceOf(address(mockVault)), 0);

        // Re-reject or re-approve reverts ClaimAlreadyResolved
        vm.prank(adjudicator);
        vm.expectRevert(ClaimAlreadyResolved.selector);
        pool.rejectClaim(claimId, keccak256("fraud-not-proven"));

        vm.prank(adjudicator);
        vm.expectRevert(ClaimAlreadyResolved.selector);
        pool.approveClaim(claimId, 50e6);
    }
}
