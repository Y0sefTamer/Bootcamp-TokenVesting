// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {TokenVesting} from "../src/TokenVesting.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("SEPOLIA_KEY");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        // Deploy MockERC20 with 18 decimals, mint total supply to deployer
        // Choose sensible default params since none specified
        uint256 totalAmount = 1_000_000 * 1e18;
        MockERC20 token = new MockERC20("MockToken", "MTK", 18, totalAmount);

        // Vesting params (defaults): cliff 3 months, total 12 months, start now
        uint256 start = block.timestamp;
        uint256 cliffMonths = 3;
        uint256 totalMonths = 12;
        TokenVesting vesting = new TokenVesting(address(token), deployer, start, cliffMonths, totalMonths, totalAmount);

        // Transfer/mint tokens to vesting contract so it holds balance
        // Token was minted to deployer; transfer to vesting
        token.transfer(address(vesting), totalAmount);

        vm.stopBroadcast();

        console.log("Deployer:", deployer);
        console.log("MockERC20:", address(token));
        console.log("TokenVesting:", address(vesting));
        console.log("TotalAmount:", totalAmount);
        console.log("CliffMonths:", cliffMonths);
        console.log("TotalMonths:", totalMonths);
        console.log("Start:", start);
    }
}
