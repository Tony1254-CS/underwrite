// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { UnderwriteVault } from "../src/UnderwriteVault.sol";
import { BondPool } from "../src/BondPool.sol";

/**
 * @title DeployScript
 * @notice Deploys UnderwriteVault, BondPool, and MockUSDC on Anvil (or Base Sepolia).
 *         Funds the vault and bond pool, registers the 6 demo vendors, and writes deployment info.
 */
contract DeployScript is Script {
    uint256 private constant ANVIL_DEPLOYER_PK = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 private constant ANVIL_OWNER_PK = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 private constant ANVIL_EXAMINER_PK = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
    uint256 private constant ANVIL_UNDERWRITER_PK = 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6;
    uint256 private constant ANVIL_ADJUDICATOR_PK = 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a;
    uint256 private constant ANVIL_GUARDIAN_PK = 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b9d88b2b0b4acdaf;

    uint256 public constant DEDUCTIBLE = 5e6; // 5 USDC
    uint256 public constant PER_CLAIM_CAP = 500e6; // 500 USDC
    uint256 public constant CLAIM_GRACE = 7 days;
    uint256 public constant BOND_DEPOSIT = 2000e6; // 2000 USDC
    uint256 public constant VAULT_FUNDING = 5000e6; // 5000 USDC
    uint256 public constant VENDOR_CAP = 500e6; // 500 USDC

    function run() external returns (address vaultAddr, address bondPoolAddr, address tokenAddr) {
        bool local = block.chainid == 31337;
        uint256 pk = local ? vm.envOr("DEPLOYER_PRIVATE_KEY", ANVIL_DEPLOYER_PK) : vm.envUint("DEPLOYER_PRIVATE_KEY");
        uint256 oPk = local ? vm.envOr("OWNER_PRIVATE_KEY", ANVIL_OWNER_PK) : vm.envUint("OWNER_PRIVATE_KEY");
        uint256 exPk = local ? vm.envOr("EXAMINER_PRIVATE_KEY", ANVIL_EXAMINER_PK) : vm.envUint("EXAMINER_PRIVATE_KEY");
        uint256 uPk =
            local ? vm.envOr("UNDERWRITER_PRIVATE_KEY", ANVIL_UNDERWRITER_PK) : vm.envUint("UNDERWRITER_PRIVATE_KEY");
        uint256 adjPk =
            local ? vm.envOr("ADJUDICATOR_PRIVATE_KEY", ANVIL_ADJUDICATOR_PK) : vm.envUint("ADJUDICATOR_PRIVATE_KEY");
        uint256 gPk = local ? vm.envOr("GUARDIAN_PRIVATE_KEY", ANVIL_GUARDIAN_PK) : vm.envUint("GUARDIAN_PRIVATE_KEY");

        address deployer = vm.addr(pk);
        address owner = vm.addr(oPk);
        address examiner = vm.addr(exPk);
        address underwriter = vm.addr(uPk);
        address adjudicator = vm.addr(adjPk);
        address guardian = vm.addr(gPk);

        console2.log("=== DEPLOYING UNDERWRITE PROTOCOL ===");
        console2.log("Chain ID:", block.chainid);
        console2.log("Deployer:", deployer);
        console2.log("Owner:", owner);

        // 1. Deploy token and BondPool
        vm.startBroadcast(pk);
        MockUSDC token = new MockUSDC();
        tokenAddr = address(token);

        BondPool bondPool = new BondPool(underwriter, adjudicator, tokenAddr, DEDUCTIBLE, PER_CLAIM_CAP, CLAIM_GRACE);
        bondPoolAddr = address(bondPool);

        // 2. Deploy UnderwriteVault
        UnderwriteVault.Ceilings memory ceilings =
            UnderwriteVault.Ceilings({ perTx: 300e6, perWindow: 1000e6, t2PerTx: 2000e6 });

        UnderwriteVault vault =
            new UnderwriteVault(owner, examiner, guardian, bondPoolAddr, tokenAddr, ceilings, 86400, 500e6, 300, 300);
        vaultAddr = address(vault);

        // 4. Fund underwriter & deposit bond
        token.mint(underwriter, BOND_DEPOSIT);

        // 5. Fund vault with initial operational balance
        token.mint(vaultAddr, VAULT_FUNDING);

        vm.stopBroadcast();

        // 6. Underwriter links vault and deposits bond backing
        vm.startBroadcast(uPk);
        bondPool.setVault(vaultAddr);
        token.approve(bondPoolAddr, BOND_DEPOSIT);
        bondPool.deposit(BOND_DEPOSIT);
        vm.stopBroadcast();

        // 7. Owner registers 6 demo vendors
        vm.startBroadcast(oPk);
        address[6] memory vendors = [
            address(0x1111111111111111111111111111111111111111),
            address(0x2222222222222222222222222222222222222222),
            address(0x3333333333333333333333333333333333333333),
            address(0x4444444444444444444444444444444444444444),
            address(0x5555555555555555555555555555555555555555),
            address(0x6666666666666666666666666666666666666666)
        ];

        for (uint256 i = 0; i < vendors.length; i++) {
            vault.addRecipient(vendors[i], VENDOR_CAP);
        }
        vm.stopBroadcast();

        console2.log("MockUSDC deployed at:", tokenAddr);
        console2.log("BondPool deployed at:", bondPoolAddr);
        console2.log("UnderwriteVault deployed at:", vaultAddr);
        console2.log("Bond free balance:", bondPool.free());
        console2.log("Vault token balance:", token.balanceOf(vaultAddr));
        console2.log("=====================================");

        // Write deployment info to JSON
        string memory deploymentJson = string.concat(
            "{\n",
            '  "chainId": ',
            vm.toString(block.chainid),
            ",\n",
            '  "vault": "',
            vm.toString(vaultAddr),
            '",\n',
            '  "bondPool": "',
            vm.toString(bondPoolAddr),
            '",\n',
            '  "token": "',
            vm.toString(tokenAddr),
            '",\n',
            '  "owner": "',
            vm.toString(owner),
            '",\n',
            '  "examiner": "',
            vm.toString(examiner),
            '",\n',
            '  "underwriter": "',
            vm.toString(underwriter),
            '",\n',
            '  "adjudicator": "',
            vm.toString(adjudicator),
            '",\n',
            '  "guardian": "',
            vm.toString(guardian),
            '",\n',
            '  "version": "1.0.0",\n',
            '  "solc": "0.8.28"\n',
            "}\n"
        );

        string memory filePath = string.concat("deployments/", vm.toString(block.chainid), ".json");
        vm.writeFile(filePath, deploymentJson);
    }
}
