// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { UnderwriteVault } from "../src/UnderwriteVault.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { MockBondPool } from "./mocks/MockBondPool.sol";

contract VaultSkeletonTest is Test {
    UnderwriteVault public vault;
    MockUSDC public token;
    MockBondPool public bondPool;

    address public owner = address(0xA1);
    address public examiner = address(0xB1);
    address public guardian = address(0xC1);

    function setUp() public {
        token = new MockUSDC();
        bondPool = new MockBondPool();

        UnderwriteVault.Ceilings memory ceilings =
            UnderwriteVault.Ceilings({ perTx: 300_000_000, perWindow: 1000_000_000, t2PerTx: 2000_000_000 });

        vault = new UnderwriteVault(
            owner, examiner, guardian, address(bondPool), address(token), ceilings, 86400, 500_000_000, 300, 300
        );
    }

    function test_version() public view {
        assertEq(vault.VERSION(), "1.0.0");
    }

    function test_domain_separator_changes_with_chainid() public {
        bytes32 ds1 = vault.domainSeparator();

        // Warp chainid
        vm.chainId(84532); // Base Sepolia
        bytes32 ds2 = vault.domainSeparator();

        assertTrue(ds1 != ds2);

        vm.chainId(31337); // Back to Anvil
        bytes32 ds3 = vault.domainSeparator();
        assertEq(ds1, ds3);
    }

    function test_immutables_and_initial_state() public view {
        assertEq(address(vault.token()), address(token));
        assertEq(address(vault.bondPool()), address(bondPool));
        assertEq(vault.owner(), owner);
        assertEq(vault.examiner(), examiner);
        assertEq(vault.guardian(), guardian);
        assertEq(vault.windowSeconds(), 86400);
        assertEq(vault.reserveFloor(), 500_000_000);
        assertEq(vault.challengePeriod(), 300);
        assertEq(vault.recipientCooldown(), 300);
        assertFalse(vault.paused());
    }
}
