// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { IBondPool } from "../../src/interfaces/IBondPool.sol";

/**
 * @title MockBondPool
 * @notice Test mock with settable remaining backing, configurable lock success, and call tracking.
 */
contract MockBondPool is IBondPool {
    mapping(bytes32 => uint256) public qualRemaining;
    mapping(bytes32 => uint256) public lockedAmount;
    mapping(bytes32 => bool) public failLock;
    mapping(uint256 => bool) public claimablePayments;

    event LockCalled(bytes32 indexed qualId, uint256 amount);
    event ReleaseCalled(bytes32 indexed qualId);
    event SuspendForClaimCalled(bytes32 indexed qualId, uint256 claimId);

    error BondLockFailed();

    function setRemaining(bytes32 qualId, uint256 amount) external {
        qualRemaining[qualId] = amount;
    }

    function setFailLock(bytes32 qualId, bool shouldFail) external {
        failLock[qualId] = shouldFail;
    }

    function setIsClaimable(uint256 paymentId, bool claimable) external {
        claimablePayments[paymentId] = claimable;
    }

    function lock(bytes32 qualId, uint256 amount) external override {
        if (failLock[qualId]) {
            revert BondLockFailed();
        }
        lockedAmount[qualId] += amount;
        emit LockCalled(qualId, amount);
    }

    function remaining(bytes32 qualId) external view override returns (uint256) {
        return qualRemaining[qualId];
    }

    function release(bytes32 qualId) external override {
        lockedAmount[qualId] = 0;
        emit ReleaseCalled(qualId);
    }

    function isClaimable(uint256 paymentId) external view override returns (bool) {
        return claimablePayments[paymentId];
    }

    function suspendForClaim(bytes32 qualId, uint256 claimId) external override {
        emit SuspendForClaimCalled(qualId, claimId);
    }
}
