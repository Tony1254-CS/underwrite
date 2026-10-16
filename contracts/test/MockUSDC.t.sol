// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { MockBondPool } from "./mocks/MockBondPool.sol";

contract MockUSDCTest is Test {
    MockUSDC public token;
    MockBondPool public bondPool;
    address public user = address(0x1111);

    function setUp() public {
        token = new MockUSDC();
        bondPool = new MockBondPool();
    }

    function test_decimals_is_six() public view {
        assertEq(uint256(token.decimals()), uint256(6));
    }

    function test_mint_works() public {
        uint256 amount = 1_000_000_000; // 1,000 USDC
        token.mint(user, amount);
        assertEq(token.balanceOf(user), amount);
    }

    function test_mock_bond_pool_controls() public {
        bytes32 qualId = keccak256("test-qual");
        bondPool.setRemaining(qualId, 500_000_000);
        assertEq(bondPool.remaining(qualId), uint256(500_000_000));

        bondPool.lock(qualId, 100_000_000);
        assertEq(bondPool.lockedAmount(qualId), uint256(100_000_000));

        bondPool.setFailLock(qualId, true);
        vm.expectRevert(MockBondPool.BondLockFailed.selector);
        bondPool.lock(qualId, 50_000_000);
    }
}
