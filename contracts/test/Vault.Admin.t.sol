// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { UnderwriteVault } from "../src/UnderwriteVault.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { MockBondPool } from "./mocks/MockBondPool.sol";
import { VaultErrors } from "../src/interfaces/VaultErrors.sol";

contract VaultAdminTest is Test {
    UnderwriteVault public vault;
    MockUSDC public token;
    MockBondPool public bondPool;

    address public owner = address(0xA1);
    address public examiner = address(0xB1);
    address public guardian = address(0xC1);
    address public stranger = address(0xD1);

    address public vendor1 = address(0xE1);

    function setUp() public {
        token = new MockUSDC();
        bondPool = new MockBondPool();

        UnderwriteVault.Ceilings memory ceilings =
            UnderwriteVault.Ceilings({ perTx: 300_000_000, perWindow: 1000_000_000, t2PerTx: 2000_000_000 });

        vault = new UnderwriteVault(
            owner, examiner, guardian, address(bondPool), address(token), ceilings, 86400, 500_000_000, 300, 300
        );

        // Fund vault
        token.mint(address(vault), 5000_000_000);
    }

    function test_add_and_deactivate_recipient() public {
        vm.prank(owner);
        vault.addRecipient(vendor1, 500_000_000);

        (bool active, uint256 activatesAt, uint256 perWindowCap) = vault.recipients(vendor1);
        assertTrue(active);
        assertEq(activatesAt, block.timestamp + 300);
        assertEq(perWindowCap, 500_000_000);

        vm.prank(owner);
        vault.deactivateRecipient(vendor1);

        (bool activeAfter,,) = vault.recipients(vendor1);
        assertFalse(activeAfter);
    }

    function test_stranger_cannot_admin() public {
        vm.startPrank(stranger);

        vm.expectRevert(VaultErrors.NotOwner.selector);
        vault.addRecipient(vendor1, 500_000_000);

        vm.expectRevert(VaultErrors.NotOwner.selector);
        vault.deactivateRecipient(vendor1);

        vm.expectRevert(VaultErrors.NotOwner.selector);
        vault.setReserve(100_000_000);

        vm.expectRevert(VaultErrors.NotOwner.selector);
        vault.setChallengePeriod(100);

        vm.expectRevert(VaultErrors.NotOwner.selector);
        vault.setCooldown(100);

        vm.expectRevert(VaultErrors.NotOwner.selector);
        vault.setExaminer(address(0xB2));

        vm.expectRevert(VaultErrors.NotOwner.selector);
        vault.setGuardian(address(0xC2));

        vm.expectRevert(VaultErrors.NotGuardianOrOwner.selector);
        vault.pause();

        vm.expectRevert(VaultErrors.NotOwner.selector);
        vault.unpause();

        vm.expectRevert(VaultErrors.NotOwner.selector);
        vault.ownerTransfer(stranger, 100_000_000);

        vm.stopPrank();
    }

    function test_pause_and_unpause() public {
        // Guardian can pause
        vm.prank(guardian);
        vault.pause();
        assertTrue(vault.paused());

        // Guardian CANNOT unpause
        vm.prank(guardian);
        vm.expectRevert(VaultErrors.NotOwner.selector);
        vault.unpause();

        // Owner can unpause
        vm.prank(owner);
        vault.unpause();
        assertFalse(vault.paused());

        // Owner can also pause
        vm.prank(owner);
        vault.pause();
        assertTrue(vault.paused());
    }

    function test_set_ceilings_and_parameters() public {
        vm.startPrank(owner);

        UnderwriteVault.Ceilings memory newCeilings =
            UnderwriteVault.Ceilings({ perTx: 150_000_000, perWindow: 500_000_000, t2PerTx: 1000_000_000 });
        vault.setCeilings(newCeilings);
        (uint256 pTx, uint256 pWin, uint256 t2Tx) = vault.ceilings();
        assertEq(pTx, 150_000_000);
        assertEq(pWin, 500_000_000);
        assertEq(t2Tx, 1000_000_000);

        vault.setReserve(800_000_000);
        assertEq(vault.reserveFloor(), 800_000_000);

        vault.setChallengePeriod(600);
        assertEq(vault.challengePeriod(), 600);

        vault.setCooldown(600);
        assertEq(vault.recipientCooldown(), 600);

        vault.setExaminer(address(0xB2));
        assertEq(vault.examiner(), address(0xB2));

        vault.setGuardian(address(0xC2));
        assertEq(vault.guardian(), address(0xC2));

        vm.stopPrank();
    }

    function test_owner_transfer() public {
        uint256 balBefore = token.balanceOf(owner);
        vm.prank(owner);
        vault.ownerTransfer(owner, 1000_000_000);
        uint256 balAfter = token.balanceOf(owner);

        assertEq(balAfter - balBefore, 1000_000_000);
    }
}
