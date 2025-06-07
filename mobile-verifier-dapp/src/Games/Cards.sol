// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IRankNFT} from "../Interface/Games/IRankNFT.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IEntry} from "../Interface/Core/IEntry.sol";
import{ICardGameWithNFT} from "../Interface/Games/IGameContract.sol";
import{Structss} from "../DataTypes/Structs.sol";
import {ErrorLib} from "../DataTypes/Errors.sol";

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";


contract CardGameWithNFT is ICardGameWithNFT, VRFConsumerBaseV2Plus {
    IEntry private immutable _entry;
    IRankNFT private immutable _rankNFT;
    Structss.CurrentGame public currentGame;
   

    address private immutable _token;

    uint256 public s_gameId;


  mapping(uint256 =>   Structss.CurrentGame) public gameStarted;


  
    // Chainlink
    bytes32 private immutable i_keyHash;
    uint256 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;

  

    // Constants
    uint256 private constant MAX_PLAYERS = 4;
    uint256 private constant CARDS_PER_PLAYER = 2;
    uint256 private constant BLACKJACK = 21;
    uint32 private constant NUM_WORDS = 1;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    




    
    // Events
    //event PlayerJoined(address player);
    event GameStarted();
    event CardsDealt();
    event CardDrawn(address player, uint8 card);
    event WinnerDeclared(address winner);
    event NFTMinted(address winner, uint256 tokenId);
    event GameReset();

      constructor(
        address vrfCoordinator,
        bytes32 keyHash,
        uint256 subscriptionId,
        uint32 callbackGasLimit,
      address entry,
        address token,
        address rankNFT
    )
        VRFConsumerBaseV2Plus(vrfCoordinator)
      
    {
        i_keyHash = keyHash;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        
       _entry = IEntry(entry);
        _token = token;
        _rankNFT = IRankNFT(rankNFT);
       
    }


function CreateNewGame(uint256 betAmountRequired, uint256 noOFPlayer) public  onlyEntryPoint{
     s_gameId++;
     uint256 gameindex = s_gameId;
    if (noOFPlayer > MAX_PLAYERS) {
        revert ErrorLib.Game__InvalidNumberOfPlayers();
    }
     gameStarted[gameindex].totalPlayers = noOFPlayer;
    gameStarted[gameindex].betAmountRequired = betAmountRequired;
    gameStarted[gameindex].gameState = Structss.GameState.WAITING;
    gameStarted[gameindex].lastTimestamp = block.timestamp;
    gameStarted[gameindex].totalbet += betAmountRequired;
   // gameStarted[gameindex].playerDetails.push(Player(msg.sender, new uint8 , true));
    gameStarted[gameindex].deck = createDeck();
    gameStarted[gameindex].isPlayerInGame[msg.sender] = true;
    IERC20(_token).transferFrom(msg.sender, address(this), betAmountRequired);
    emit GameStarted();

}

function joinGame(uint256 gameId, uint256 _amount) public  onlyEntryPoint{
    if (gameStarted[gameId].gameState != Structss.GameState.WAITING) {
        revert ErrorLib.Game__InvalidNumberOfPlayers();
    }
    if (gameStarted[gameId].isPlayerInGame[msg.sender]) {
        revert ErrorLib.Entry__already_Registered();
    }
    if (gameStarted[gameId].players.length >= gameStarted[gameId].totalPlayers) {
        revert ErrorLib.Game__InvalidNumberOfPlayers();
    }
    gameStarted[gameId].players.push(Structss.Player(msg.sender, new uint8[](0), true));
    gameStarted[gameId].isPlayerInGame[msg.sender] = true;
      gameStarted[gameId].totalbet += _amount;
    IERC20(_token).transferFrom(msg.sender, address(this), _amount);
   // emit PlayerJoined(msg.sender);
}

function startGame(uint256 gameId) public  onlyEntryPoint {
    if (gameStarted[gameId].gameState != Structss.GameState.WAITING) {
        revert ErrorLib.Game__InvalidState();
    }
    if (gameStarted[gameId].players.length < 2) {
        revert ErrorLib.Game__InvalidNumberOfPlayers();
    }
    gameStarted[gameId].gameState = Structss.GameState.SHUFFLING;
    gameStarted[gameId].deck = shuffleDeck(gameStarted[gameId].deck);
    gameStarted[gameId].gameState = Structss.GameState.DEALING;
    dealPLayersWithCards(gameId);
    gameStarted[gameId].lastTimestamp = block.timestamp;
    gameStarted[gameId].gameState = Structss.GameState.PLAYING;
    emit GameStarted();
}

function hit(uint256 gameId) public  onlyEntryPoint{
    if (gameStarted[gameId].gameState != Structss.GameState.PLAYING) {
        revert ErrorLib.Game__InvalidNumberOfPlayers();
    }
     Structss.CurrentGame storage player = gameStarted[gameId].players[msg.sender];
    if (!gameStarted[gameId].isPlayerInGame[msg.sender]) {
        revert ErrorLib.Entry__not_Registered();
    }
    if (player.hand.length >= CARDS_PER_PLAYER) {
        revert ErrorLib.Game__InvalidNumberOfPlayers();
    }
    uint8 card = gameStarted[gameId].deck[gameStarted[gameId].deck.length - 1];
    player.hand.push(card);
    gameStarted[gameId].deck.pop();
    emit CardDrawn(msg.sender, card);
    if (calculateHandValue(player.hand) > BLACKJACK) {
        player.isActive = false;
        emit WinnerDeclared(msg.sender);
        declareWinner(gameId);
    }
}

function poke(uint256 gameId, address target) public  onlyEntryPoint{
    if (gameStarted[gameId].gameState != Structss.GameState.PLAYING) {
        revert ErrorLib.Game__InvalidNumberOfPlayers();
    }
   Structss.CurrentGame storage sender = gameStarted[gameId].players[msg.sender];
     Structss.CurrentGame storage targetPlayer = gameStarted[gameId].players[target];
    if (!sender.isActive || !targetPlayer.isActive) {
        revert ErrorLib.Game__InvalidNumberOfPlayers();
    }
    uint8 card = gameStarted[gameId].deck[gameStarted[gameId].deck.length - 1];
    targetPlayer.hand.push(card);
    gameStarted[gameId].deck.pop();
    emit CardDrawn(target, card);
    if (calculateHandValue(targetPlayer.hand) > BLACKJACK) {
        targetPlayer.isActive = false;
        emit WinnerDeclared(target);
        declareWinner(gameId);
    }
}
function stand(uint256 gameId) public  onlyEntryPoint{
    if (gameStarted[gameId].gameState != Structss.GameState.PLAYING) {
        revert ErrorLib.Game__InvalidState();
    }
      Structss.CurrentGame storage player = gameStarted[gameId].players[msg.sender];
    if (!player.isActive) {
        revert ErrorLib.Entry__not_Registered();
    }
    player.isActive = false; // Player stands, no more actions
    emit WinnerDeclared(msg.sender);
    declareWinner(gameId);
}
function calculateHandValue(uint8[] memory hand) internal pure returns (uint8) {
    uint8 value = 0;
    uint8 aces = 0;
    for (uint256 i = 0; i < hand.length; i++) {
        uint8 cardValue = hand[i] % 13; // 0-12 for Ace to King
        if (cardValue >= 10) {
            value += 10; // Face cards are worth 10
        } else if (cardValue == 0) {
            value += 11; // Ace is worth 11 initially
            aces++;
        } else {
            value += cardValue + 1; // Cards 2-9 are worth their face value + 1
        }
    }
    // Adjust for Aces if value exceeds 21
    while (value > BLACKJACK && aces > 0) {
        value -= 10; // Convert Ace from 11 to 1
        aces--;
    }
    return value;
}
function declareWinner(uint256 gameId) internal {
    if (gameStarted[gameId].gameState != Structss.GameState.PLAYING) {
        revert ErrorLib.Game__InvalidNumberOfPlayers();
    }
    address winner;
    uint8 bestScore = 0;
    for (uint256 i = 0; i < gameStarted[gameId].players.length; i++) {
         Structss.CurrentGame storage player = gameStarted[gameId].players[i];
        if (player.isActive) {
            uint8 score = calculateHandValue(player.hand);
            if (score > bestScore && score <= BLACKJACK) {
                bestScore = score;
                winner = player.addr;
            }
        }
    }
    if (winner != address(0)) {
        // Transfer winnings
        uint256 winnings = gameStarted[gameId].totalbet;
        IERC20(_token).transfer(winner, winnings);
        emit WinnerDeclared(winner);
        
        // Mint NFT for the winner
      //  uint256 tokenId = IRankNFT(_entry.getRankNFT()).mintNFT(winner);
     (,,,address _nftAddr) = _entry.getUserInfo(winner);
     mintRankNFT(winner, 1, 1, _nftAddr);
       // emit NFTMinted(winner, tokenId);
    }
    delete gameStarted[gameId];
    emit GameReset();

}

    function createDeck() internal pure returns (uint8[] memory) {
        uint8[] memory deck = new uint8[](52);
        for (uint8 i = 0; i < 52; i++) {
            deck[i] = i;
        }
        return deck;
    }

//change tgis to utilize chainlike VRF and automation/ do deep read on how to use it great with blackjack
    function shuffleDeck(uint8[] memory deck) internal pure returns (uint8[] memory) {
        // use chainlin randonws
        for (uint256 i = deck.length - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, i))) % (i + 1);
            (deck[i], deck[j]) = (deck[j], deck[i]);
        }
        return deck;
    }
    function dealPLayersWithCards(uint256 gameId) internal {
    if (gameStarted[gameId].gameState != Structss.GameState.DEALING) {
        revert ErrorLib.Game__InvalidNumberOfPlayers();
    }
    for (uint256 i = 0; i < gameStarted[gameId].players.length; i++) {
         Structss.CurrentGame storage player = gameStarted[gameId].players[i];
        for (uint256 j = 0; j < CARDS_PER_PLAYER; j++) {
            uint8 card = gameStarted[gameId].deck[gameStarted[gameId].deck.length - 1];
            player.hand.push(card);
            gameStarted[gameId].deck.pop();
            emit CardDrawn(player.addr, card);
        }
    }
    gameStarted[gameId].gameState = Structss.GameState.PLAYING;
    emit CardsDealt();
}

function getGameDetails(uint256 gameId) public view returns (Structss.CurrentGame memory) {
    return gameStarted[gameId];
}
  
   
     function mintRankNFT(address to, uint256 _gamesWonCount, uint256 _gamesPlayedCount,address __rankNFT) internal {
     
        // Mint NFT based on game stats
        __rankNFT.mintRankNFT(to, _gamesWonCount, _gamesPlayedCount);  
    }


modifier onlyEntryPoint() {
        require(msg.sender == _entry, ErrorLib.Manager__OnlyEntryPoint());
        _;
    } 

}