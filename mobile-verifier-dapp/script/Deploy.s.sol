// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import {AaveV3Farm} from "../src/Aave/AaveFarm.sol";
import {Manager} from "../src/Core/manager.sol";
import {Entry} from "../src/Core/Entry.sol";
import {IEntry} from "../src/Interface/Core/IEntry.sol";
import {Transactions} from "../src/Core/transactions.sol";
import {IRankNFT} from "../src/Interface/Games/IRankNFT.sol";
import {ICardGameWithNFT} from "../src/Interface/Games/IGameContract.sol";
import {IManager} from "../src/Interface/Core/Imanager.sol";
import {CardGameWithNFT} from "../src/Games/Cards.sol";
import {RankNFT} from "../src/Games/RankNft.sol";
import {SwapManger} from "../src/swap/swapManager.sol";
import {Token} from "../src/Token/token.sol";

contract DeployToBase is Script {
    AaveV3Farm public farm;
    Manager public manager;
    Entry public entry;
    Transactions public transactions;
    CardGameWithNFT public gameContract;
    RankNFT public rankNFT;
   SwapManger public swapManager;
    Token public token;

    // Interfaces
    ICardGameWithNFT public _nftCardGameInterface;
    IEntry public entryPoint;
    IRankNFT public rankNFTInterface;
    IManager public managerInterface;

    // Constants
    address public constant uniswapFactory = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address public constant swapRouter = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address public constant gameToken = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address public constant aToken = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address public constant lendingPool = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; 
    address public constant assetToken = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; 
    address public constant userAdmin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    function run() external {
        vm.createSelectFork(vm.rpcUrl("basechain"));
        vm.startBroadcast();

        // Deploy manager first (temporary dummy address for entry)
        manager = new Manager(userAdmin, address(entry));

        // Deploy token
        token = new Token(address(entry));

        // Deploy entry contract with correct dependencies
        entry = new Entry(
            address(manager),
            address(farm),
            address(token),
            address(swapManager),
            address(gameContract),
          IRankNFT(rankNFT)
        );

        // Update manager with actual entry
        manager = new Manager(userAdmin, address(entry));
         token = new Token(address(entry));

        // Set up interfaces for linking
        entryPoint = IEntry(address(entry));
        managerInterface = IManager(address(manager));

        // Deploy farm
        farm = new AaveV3Farm(
            aToken,
            lendingPool,
            address(managerInterface),
            assetToken
        );

        // Deploy transactions
        transactions = new Transactions();

        // Deploy rankNFT
      
        rankNFTInterface = IRankNFT(address(rankNFT));

        // Deploy game contract
        gameContract = new CardGameWithNFT(address(entryPoint), gameToken, address(rankNFTInterface));
        _nftCardGameInterface = ICardGameWithNFT(address(gameContract));
          rankNFT = new RankNFT(address(entryPoint), address(gameContract));

        // Deploy SwapManager
        swapManager = new SwapManger(
            address(entryPoint),
            uniswapFactory,
            swapRouter,
            address(managerInterface)
        );
 // initialize the entry 
  entry.initialize(
            address(manager),
            address(farm),
            address(token),
            address(swapManager),
            address(gameContract),
            IRankNFT(rankNFT)
  );

   console.log("======== Deployment Results ========");
        console.log("Manager:", address(manager));
        console.log("Entry Point:", address(entry));
        console.log("Token:", address(token));
        console.log("Game Contract:", address(gameContract));
        console.log("Rank NFT:", address(rankNFT));
        console.log("Farm:", address(farm));
        console.log("Swap Manager:", address(swapManager));
       

        vm.stopBroadcast();
    }
}
