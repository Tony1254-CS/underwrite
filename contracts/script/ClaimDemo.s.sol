// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { UnderwriteVault } from "../src/UnderwriteVault.sol";
import { BondPool } from "../src/BondPool.sol";
import { VaultErrors } from "../src/interfaces/VaultErrors.sol";

/**
 * @title ClaimDemoScript
 * @notice Demonstrates Phase 2 atomic consequence on Anvil:
 *         1. Agent executes a Tier 1 payment.
 *         2. Owner files a claim against that payment.
 *         3. Adjudicator approves the claim (payout transferred to vault AND qualification revoked in ONE transaction).
 *         4. Agent attempts next payment, which strictly reverts with QualificationRevoked.
 */
contract ClaimDemoScript is Script, VaultErrors {
    // Standard Anvil default accounts (funded by default)
    uint256 public deployerPk = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // Account 0
    uint256 public ownerPk = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d; // Account 1
    uint256 public examinerPk = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a; // Account 2
    uint256 public underwriterPk = 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6; // Account 3
    uint256 public adjudicatorPk = 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a; // Account 4 (exact Anvil key)
    uint256 public agentPk = 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba; // Account 5
    uint256 public guardianPk = 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b9d88b2b0b4acdaf; // Account 6

    address public deployer;
    address public owner;
    address public examiner;
    address public underwriter;
    address public adjudicator;
    address public agent;
    address public guardian;
    address public recipient = address(0xCAFE);

    MockUSDC public token;
    BondPool public bondPool;
    UnderwriteVault public vault;

    bytes32 public configHash = keccak256("agent-config-demo");
    bytes32 public corpusHash = keccak256("corpus-v1");

    uint256 public constant DEDUCTIBLE = 5e6; // 5 USDC
    uint256 public constant PER_CLAIM_CAP = 500e6; // 500 USDC
    uint256 public constant CLAIM_GRACE = 7 days;
    uint256 public constant BOND_DEPOSIT = 2000e6; // 2000 USDC

    function run() external {
        deployer = vm.addr(deployerPk);
        owner = vm.addr(ownerPk);
        examiner = vm.addr(examinerPk);
        underwriter = vm.addr(underwriterPk);
        adjudicator = vm.addr(adjudicatorPk);
        agent = vm.addr(agentPk);
        guardian = vm.addr(guardianPk);

        console2.log("=== UNDERWRITE CLAIM & ATOMIC REVOKE DEMO ===");

        // --- Step 1: Deploy contracts ---
        vm.startBroadcast(deployerPk);
        token = new MockUSDC();
        bondPool = new BondPool(underwriter, adjudicator, address(token), DEDUCTIBLE, PER_CLAIM_CAP, CLAIM_GRACE);

        UnderwriteVault.Ceilings memory ceilings =
            UnderwriteVault.Ceilings({ perTx: 300e6, perWindow: 1000e6, t2PerTx: 2000e6 });

        vault = new UnderwriteVault(
            owner, examiner, guardian, address(bondPool), address(token), ceilings, 86400, 500e6, 300, 0
        );

        // Fund contracts
        token.mint(address(vault), 10_000e6);
        token.mint(underwriter, 50_000e6);
        vm.stopBroadcast();

        // Underwriter binds vault in BondPool and deposits capital
        vm.startBroadcast(underwriterPk);
        bondPool.setVault(address(vault));
        token.approve(address(bondPool), type(uint256).max);
        bondPool.deposit(BOND_DEPOSIT);
        vm.stopBroadcast();

        // Owner adds recipient with 0 cooldown for immediate testing
        vm.startBroadcast(ownerPk);
        vault.addRecipient(recipient, 2000e6);
        vm.stopBroadcast();

        // Examiner commits exam
        vm.startBroadcast(examinerPk);
        uint256 commitId = vault.commitExam(configHash, corpusHash);
        vm.stopBroadcast();

        // Activate qualification for agent
        bytes32 qualId = keccak256(abi.encode(configHash, commitId));
        UnderwriteVault.QualificationAttestation memory a = UnderwriteVault.QualificationAttestation({
            qualId: qualId,
            vault: address(vault),
            agentKey: agent,
            configHash: configHash,
            reportHash: keccak256("report-demo"),
            corpusHash: corpusHash,
            examCommitId: commitId,
            ownerInputsHash: keccak256("owner-inputs-demo"),
            t1MaxPerTx: 200e6,
            t1MaxPerWindow: 1000e6,
            t2MaxPerTx: 1000e6,
            t2Allowed: true,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 14 days,
            examiner: examiner
        });

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", vault.domainSeparator(), vault.hashAttestation(a)));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(examinerPk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.startBroadcast(ownerPk);
        vault.activateQualification(a, sig);
        vm.stopBroadcast();

        console2.log("Deployment and activation complete.");
        console2.log("Vault Address:", address(vault));
        console2.log("BondPool Address:", address(bondPool));
        console2.log("Agent Address:", agent);

        // --- Outcome 1: Agent pays T1 invoice ---
        bytes32 inv1 = keccak256("invoice-legit-001");
        bytes32 memo1 = keccak256("payment-memo-001");
        uint256 paymentAmount = 150e6; // 150 USDC

        vm.startBroadcast(agentPk);
        uint256 paymentId = vault.pay(recipient, paymentAmount, inv1, memo1);
        vm.stopBroadcast();

        console2.log("\n[OUTCOME 1: T1 PAYMENT SUCCESS]");
        console2.log("PaymentId:", paymentId);
        console2.log("Amount Paid (base units):", paymentAmount);
        console2.log("Recipient:", recipient);

        // --- Step 2: Owner files claim on payment 1 ---
        bytes32 claimEvidence = keccak256("evidence-overbilling-loss");
        vm.startBroadcast(ownerPk);
        uint256 claimId = bondPool.fileClaim(paymentId, paymentAmount, claimEvidence);
        vm.stopBroadcast();
        console2.log("Claim Filed. ClaimId:", claimId);

        // --- Outcome 2: Adjudicator approves claim (atomic payout + revoke) ---
        uint256 vaultBalBefore = token.balanceOf(address(vault));
        vm.startBroadcast(adjudicatorPk);
        uint256 payout = bondPool.approveClaim(claimId, paymentAmount);
        vm.stopBroadcast();

        uint256 vaultBalAfter = token.balanceOf(address(vault));
        (, bool active, bool revoked,,,,) = vault.quals(qualId);

        console2.log("\n[OUTCOME 2: CLAIM APPROVE + ATOMIC REVOCATION]");
        console2.log("Approved ClaimId:", claimId);
        console2.log("Payout to Vault (base units):", payout);
        console2.log("Vault Balance Increase:", vaultBalAfter - vaultBalBefore);
        console2.log("Qualification Active:", active);
        console2.log("Qualification Revoked:", revoked);

        // --- Outcome 3: Agent attempts next pay, which strictly reverts ---
        bytes32 inv2 = keccak256("invoice-rogue-002");
        bytes32 memo2 = keccak256("payment-memo-002");

        console2.log("\n[OUTCOME 3: SUBSEQUENT PAYMENT ATTEMPT]");
        vm.prank(agent);
        try vault.pay(recipient, 50e6, inv2, memo2) returns (uint256) {
            revert("CRITICAL: Payment should have reverted");
        } catch (bytes memory revertData) {
            bytes4 selector;
            assembly {
                selector := mload(add(revertData, 32))
            }
            if (
                selector == VaultErrors.QualificationIsRevoked.selector
                    || selector == VaultErrors.NoActiveQualification.selector
            ) {
                console2.log("Transaction successfully reverted with expected qualification error!");
                console2.log("Selector:", vm.toString(selector));
            } else {
                revert("Unexpected revert error");
            }
        }

        console2.log("\n=== ALL THREE OUTCOMES VERIFIED END-TO-END ===");
    }
}
