// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IRankNFT} from "../Interface/Games/IRankNFT.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IEntry} from "../Interface/Core/IEntry.sol";
import {ICardGameWithNFT} from "../Interface/Games/IGameContract.sol";
import {Structss} from "../DataTypes/Structs.sol";
import {ErrorLib} from "../DataTypes/Errors.sol";

contract CardGameWithNFT is ICardGameWithNFT {
    using SafeERC20 for IERC20;

    IEntry private immutable _entry;
    IRankNFT private immutable _rankNFT;
    address private immutable _token;
    uint256 public s_gameId;

    uint256 private constant MAX_PLAYERS = 4;
    uint256 private constant CARDS_PER_PLAYER = 2;
    uint256 private constant BLACKJACK = 21;

    mapping(uint256 => Structss.CurrentGame) public gameStarted;


    constructor(address entry, address token, address rankNFT) {
        _entry = IEntry(entry);
        _token = token;
        _rankNFT = IRankNFT(rankNFT);
    }

    function CreateNewGame(uint256 betAmountRequired, uint256 noOfPlayers) external {
        require(noOfPlayers <= MAX_PLAYERS, "Too many players");

        s_gameId++;
        uint256 gameIndex = s_gameId;
        Structss.CurrentGame storage game = gameStarted[gameIndex];

        game.totalPlayers = noOfPlayers;
        game.betAmountRequired = betAmountRequired;
        game.gameState = Structss.GameState.WAITING;
        game.lastTimestamp = block.timestamp;
        game._totalBet = betAmountRequired;
        game.deck = createDeck();

        (,,,address _rAddr) = _entry.getUserInfo(msg.sender);

        game.players.push(Structss.Player({
            addr: msg.sender,
            hand: new uint8[](0) ,
            isActive: true,
            rankNFT: _rAddr,
            totalgamesWon: 0,
            totalGamesPlayed: 0
        }));

        game.isPlayerInGame[msg.sender] = true;
        game.playerIndex[msg.sender] = 0;

        IERC20(_token).safeTransferFrom(msg.sender, address(this), betAmountRequired);
        emit GameStarted(gameIndex);
    }

    function joinGame(uint256 gameId, uint256 amount) external onlyEntryPoint {
        Structss.CurrentGame storage game = gameStarted[gameId];
        require(game.gameState == Structss.GameState.WAITING, "Game not waiting");
        require(!game.isPlayerInGame[msg.sender], "Already registered");
        require(game.players.length < game.totalPlayers, "Game full");

        (,,,address _rAddr) = _entry.getUserInfo(msg.sender);

        game.players.push(Structss.Player({
            addr: msg.sender,
            hand: new uint8[](0) ,
            isActive: true,
            rankNFT: _rAddr,
            totalgamesWon: 0,
            totalGamesPlayed: 0
        }));

        uint256 index = game.players.length - 1;
        game.isPlayerInGame[msg.sender] = true;
        game.playerIndex[msg.sender] = index;
        game._totalBet += amount;

        IERC20(_token).safeTransferFrom(msg.sender, address(this), amount);
    }

    function startGame(uint256 gameId) external onlyEntryPoint {
        Structss.CurrentGame storage game = gameStarted[gameId];
        require(game.gameState == Structss.GameState.WAITING, "Invalid state");
        require(game.players.length >= 2, "Not enough players");
        game.gameState = Structss.GameState.SHUFFLING;
        shuffleDeck(gameId);
        dealCards(gameId);
        game.gameState = Structss.GameState.PLAYING;
        emit GameStarted(gameId);
    }

    function poke(uint256 gameId) external onlyEntryPoint {
        Structss.CurrentGame storage game = gameStarted[gameId];
        require(game.gameState == Structss.GameState.PLAYING, "Game not in playing state");

        for (uint256 i = 0; i < game.players.length; i++) {
            if (game.players[i].isActive) {
                return;
            }
        }

        declareWinner(gameId);
    }

    function hit(uint256 gameId) external onlyEntryPoint {
        Structss.CurrentGame storage game = gameStarted[gameId];
        require(game.gameState == Structss.GameState.PLAYING, "Game not in playing state");

        uint256 playerIndex = game.playerIndex[msg.sender];
        Structss.Player storage player = game.players[playerIndex];
        require(player.isActive, "Player not active");

        uint8 card = drawCard(game);
        player.hand.push(card);
        emit CardDrawn(msg.sender, card);

        if (calculateHandValue(player.hand) > BLACKJACK) {
            player.isActive = false;
            emit WinnerDeclared(msg.sender, gameId); // This could be misleading if the player busts
            declareWinner(gameId);
        }
    }

    function stand(uint256 gameId) external onlyEntryPoint {
        Structss.CurrentGame storage game = gameStarted[gameId];
        require(game.gameState == Structss.GameState.PLAYING, "Game not in playing state");

        uint256 playerIndex = game.playerIndex[msg.sender];
        Structss.Player storage player = game.players[playerIndex];
        require(player.isActive, "Player not active");

        player.isActive = false;

        bool allPlayersInactive = true;
        for (uint256 i = 0; i < game.players.length; i++) {
            if (game.players[i].isActive) {
                allPlayersInactive = false;
                break;
            }
        }

        if (allPlayersInactive) {
            declareWinner(gameId);
        }
    }

    function showHand(uint256 gameId) external view returns (uint8[] memory) {
        Structss.CurrentGame storage game = gameStarted[gameId];
        require(game.gameState == Structss.GameState.PLAYING, "Game not in playing state");

        require(game.isPlayerInGame[msg.sender], "Not part of this game");
        uint256 playerIndex = game.playerIndex[msg.sender];
        Structss.Player storage player = game.players[playerIndex];
        return player.hand;
    }

    function calculateHandValue(uint8[] memory hand) internal pure returns (uint8) {
        uint8 value = 0;
        uint8 aces = 0;

        for (uint256 i = 0; i < hand.length; i++) {
            uint8 card = hand[i];
            if (card > 10) value += 10;
            else if (card == 1) aces++;
            else value += card;
        }

        for (uint256 i = 0; i < aces; i++) {
            if (value + 11 <= BLACKJACK) value += 11;
            else value += 1;
        }

        return value;
    }

    function declareWinner(uint256 gameId) internal {
        Structss.CurrentGame storage game = gameStarted[gameId];
        require(game.gameState == Structss.GameState.PLAYING, "Game not in playing state");

        address winner;
        uint8 highestValue = 0;

        for (uint256 i = 0; i < game.players.length; i++) {
            Structss.Player storage player = game.players[i];
            uint8 handValue = calculateHandValue(player.hand);
            if (handValue > highestValue && handValue <= BLACKJACK) {
                highestValue = handValue;
                winner = player.addr;
            }
        }

        require(winner != address(0), "No winner found");

        uint256 playindex = game.playerIndex[winner];
        mintRankNFT(winner, 1, 1, game.players[playindex].rankNFT);
        emit WinnerDeclared(winner, gameId);

        game.gameState = Structss.GameState.FINISHED;
    }

    function mintRankNFT(address to, uint256 gamesWon, uint256 gamesPlayed, address rankNFTAddress) internal {
        IRankNFT(rankNFTAddress).mintRankNFT(to, gamesWon, gamesPlayed);
    }

    function dealCards(uint256 gameId) internal {
        Structss.CurrentGame storage game = gameStarted[gameId];

        for (uint256 i = 0; i < game.players.length; i++) {
            Structss.Player storage player = game.players[i];
            for (uint256 j = 0; j < CARDS_PER_PLAYER; j++) {
                uint8 card = drawCard(game);
                player.hand.push(card);
                emit CardDrawn(player.addr, card);
            }
        }

        game.gameState = Structss.GameState.DEALING;
        emit CardsDealt(gameId);
    }

    function drawCard(Structss.CurrentGame storage game) internal returns (uint8) {
        require(game.deck.length > 0, "No cards left");
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % game.deck.length;
        uint8 card = game.deck[randomIndex];
        game.deck[randomIndex] = game.deck[game.deck.length - 1];
        game.deck.pop();
        return card;
    }

   function createDeck() internal pure returns (uint8[] memory) {
    uint8[] memory deck = new uint8[](52);
    for (uint8 i = 0; i < 52; i++) {
        deck[i] = (i % 13) + 1;
    }
    return deck;
}

    function shuffleDeck(uint256 gameId) internal {
        Structss.CurrentGame storage game = gameStarted[gameId];
        require(game.gameState == Structss.GameState.SHUFFLING, "Invalid state");

        for (uint256 i = 0; i < game.deck.length; i++) {
            uint256 j = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, i))) % game.deck.length;
            (game.deck[i], game.deck[j]) = (game.deck[j], game.deck[i]);
        }
    }

    modifier onlyEntryPoint() {
        require(msg.sender == address(_entry), "Not entry point");
        _;
    }
}
