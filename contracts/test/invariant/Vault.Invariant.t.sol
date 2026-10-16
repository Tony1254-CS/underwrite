// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Test } from "forge-std/Test.sol";
import { UnderwriteVault } from "../../src/UnderwriteVault.sol";
import { MockUSDC } from "../../src/MockUSDC.sol";
import { MockBondPool } from "../mocks/MockBondPool.sol";
import { InvariantHandler } from "./Handler.sol";

contract VaultInvariantTest is Test {
    UnderwriteVault public vault;
    MockUSDC public token;
    MockBondPool public bondPool;
    InvariantHandler public handler;

    address public owner = address(0xA1);
    uint256 public examinerPk = 0xB1E5;
    address public examiner;
    address public guardian = address(0xC1);
    address public agent1 = address(0xAA1);
    address public vendor1 = address(0xEE1);
    address public vendor2 = address(0xEE2);
    address public unallowed = address(0xDD1);

    bytes32 public configHash = keccak256("config1");
    bytes32 public corpusHash = keccak256("corpus1");
    bytes32 public qualId;

    uint256 public constant INITIAL_VAULT_FUNDS = 50_000_000_000; // 50,000 USDC
    uint256 public constant T1_MAX_PER_TX = 180_000_000;
    uint256 public constant T1_MAX_PER_WINDOW = 500_000_000;
    uint256 public constant T2_MAX_PER_TX = 1000_000_000;
    uint256 public constant RESERVE_FLOOR = 500_000_000;

    function setUp() public {
        examiner = vm.addr(examinerPk);
        token = new MockUSDC();
        bondPool = new MockBondPool();

        UnderwriteVault.Ceilings memory ceilings =
            UnderwriteVault.Ceilings({ perTx: 300_000_000, perWindow: 1000_000_000, t2PerTx: 2000_000_000 });

        vault = new UnderwriteVault(
            owner, examiner, guardian, address(bondPool), address(token), ceilings, 86400, RESERVE_FLOOR, 300, 300
        );

        token.mint(address(vault), INITIAL_VAULT_FUNDS);

        vm.startPrank(owner);
        vault.addRecipient(vendor1, 20_000_000_000);
        vault.addRecipient(vendor2, 20_000_000_000);
        vm.stopPrank();

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
            expiresAt: block.timestamp + 365 days,
            examiner: examiner
        });

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(a)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        bondPool.setRemaining(qualId, 2000_000_000); // 2000 USDC bond backing

        vm.prank(owner);
        vault.activateQualification(a, sig);

        handler = new InvariantHandler(vault, token, bondPool, qualId, agent1, owner, vendor1, vendor2, unallowed);

        targetContract(address(handler));
    }

    /// @notice INV-1: Agent key can move tokens only through allowed pay & executePending paths.
    function invariant_INV1_agent_key_moves_tokens_only_through_allowed_paths() public view {
        // Agent key itself never holds any vault tokens
        assertEq(token.balanceOf(agent1), 0);

        // Vault balance decrease exactly matches total T1 + total T2 executed
        uint256 expectedVaultBalance = INITIAL_VAULT_FUNDS - (handler.ghost_totalT1Paid() + handler.ghost_totalT2Paid());
        assertEq(token.balanceOf(address(vault)), expectedVaultBalance);

        // Unallowed recipient never receives any funds
        assertEq(token.balanceOf(unallowed), 0);
    }

    /// @notice INV-2: For every qual and window: sum(T1 amounts) <= effective t1MaxPerWindow.
    function invariant_INV2_window_cap_never_exceeded() public view {
        uint256[] memory windowIds = handler.getWindowIds();
        for (uint256 i = 0; i < windowIds.length; i++) {
            assertLe(vault.qualWindowSpent(qualId, windowIds[i]), T1_MAX_PER_WINDOW);
        }
    }

    /// @notice INV-5: Each invoiceKey reaches PAID at most once.
    function invariant_INV5_invoices_reach_paid_at_most_once() public view {
        bytes32[] memory keys = handler.getPaidInvoiceKeys();
        for (uint256 i = 0; i < keys.length; i++) {
            assertTrue(vault.invoiceState(keys[i]) == UnderwriteVault.InvoiceStatus.PAID);
        }
    }

    /// @notice INV-10: Unreconciled T1 exposure <= bondPool.remaining(qualId) at all times.
    function invariant_INV10_exposure_bounded_by_bond_remaining() public view {
        assertLe(vault.exposure(qualId), bondPool.remaining(qualId));
    }
}
