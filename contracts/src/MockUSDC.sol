// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC implementation with 6 decimals and a testnet-only mint function.
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin", "USDC") { }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Testnet-only mint function. Unrestricted for testing and demo flows.
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
