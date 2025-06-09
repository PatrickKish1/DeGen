// // SPDX-License-Identifier: MIT
// pragma solidity 0.8.28;

// import {IRankNFT} from "../Interface/Games/IRankNFT.sol";
// import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import {IEntry} from "../Interface/Core/IEntry.sol";
// import {ICardGameWithNFT} from "../Interface/Games/IGameContract.sol";
// import {Structss} from "../DataTypes/Structs.sol";
// import {ErrorLib} from "../DataTypes/Errors.sol";
// import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
// import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

// contract CardGameWithNFT is ICardGameWithNFT, VRFConsumerBaseV2Plus {
//     using SafeERC20 for IERC20;

//     IEntry private immutable _entry;
//     IRankNFT private immutable _rankNFT;
//     address private immutable _token;
//     uint256 public s_gameId;

//     // VRF config
//     bytes32 private immutable i_keyHash;
//     uint256 private immutable i_subscriptionId;
//     uint32 private immutable i_callbackGasLimit;
//     uint32 private constant NUM_WORDS = 1; 

//     uint256 private constant MAX_PLAYERS = 4;
//     uint256 private constant CARDS_PER_PLAYER = 2;
//     uint256 private constant BLACKJACK = 21;
//     uint16 private constant REQUEST_CONFIRMATIONS = 3;

//     mapping(uint256 => uint256) private s_requestIdToGameId;
//     mapping(uint256 => Structss.CurrentGame) public gameStarted;

//     event GameStarted(uint256 indexed gameId);
//     event CardsDealt(uint256 indexed gameId);
//     event CardDrawn(address indexed player, uint8 card);
//     event WinnerDeclared(address indexed winner, uint256 gameId);
//     event NFTMinted(address indexed winner, uint256 tokenId);
//     event GameReset(uint256 indexed gameId);

//     constructor(
//         address vrfCoordinator,
//         bytes32 keyHash,
//         uint256 subscriptionId,
//         uint32 callbackGasLimit,
//         address entry,
//         address token,
//         address rankNFT
//     ) VRFConsumerBaseV2Plus(vrfCoordinator) {
//         i_keyHash = keyHash;
//         i_subscriptionId = subscriptionId;
//         i_callbackGasLimit = callbackGasLimit;
//         _entry = IEntry(entry);
//         _token = token;
//         _rankNFT = IRankNFT(rankNFT);
//     }

//     function CreateNewGame(uint256 betAmountRequired, uint256 noOfPlayers) external onlyEntryPoint {
//         require(noOfPlayers <= MAX_PLAYERS, "Too many players");

//         s_gameId++;
//         uint256 gameIndex = s_gameId;
//         Structss.CurrentGame storage game = gameStarted[gameIndex];

//         game.totalPlayers = noOfPlayers;
//         game.betAmountRequired = betAmountRequired;
//         game.gameState = Structss.GameState.WAITING;
//         game.lastTimestamp = block.timestamp;
//         game._totalBet = betAmountRequired;
//         game.deck = createDeck();

//         // Add creator as player[0] and set index
//         game.players.push(Structss.Player({
//             addr: msg.sender,
//             hand: new uint8,
//             isActive: true,
//             rankNFT: address(0),
//             totalgamesWon: 0,
//             totalGamesPlayed: 0
//         }));
//         game.isPlayerInGame[msg.sender] = true;
//         game.playerIndex[msg.sender] = 0; 

//         IERC20(_token).safeTransferFrom(msg.sender, address(this), betAmountRequired);
//         emit GameStarted(gameIndex);
//     }

//     function joinGame(uint256 gameId, uint256 amount) external onlyEntryPoint {
//         Structss.CurrentGame storage game = gameStarted[gameId];
//         require(game.gameState == Structss.GameState.WAITING, "Game not waiting");
//         require(!game.isPlayerInGame[msg.sender], "Already registered");
//         require(game.players.length < game.totalPlayers, "Game full");

//         game.players.push(Structss.Player({
//             addr: msg.sender,
//             hand: new uint8,
//             isActive: true,
//             rankNFT: address(0),
//             totalgamesWon: 0,
//             totalGamesPlayed: 0
//         }));
//         uint256 index = game.players.length - 1;
//         game.isPlayerInGame[msg.sender] = true;
//         game.playerIndex[msg.sender] = index;
//         game._totalBet += amount;

//         IERC20(_token).safeTransferFrom(msg.sender, address(this), amount);
//     }

//     function startGame(uint256 gameId) external onlyEntryPoint {
//         Structss.CurrentGame storage game = gameStarted[gameId];
//         require(game.gameState == Structss.GameState.WAITING, "Invalid state");
//         require(game.players.length >= 2, "Not enough players");
//         game.gameState = Structss.GameState.SHUFFLING;
//     }

    

//     function performUpkeep(uint256 gameId) external {
//         (bool isValid, string memory message) = checkUpKeep(gameId); 
//         Structss.CurrentGame storage game = gameStarted[gameId];
//         if (!isValid) {
//             if (keccak256(bytes(message)) == keccak256("Game should have started")) {
//                 startGame(gameId);
//                 return;
//             }
//             if (keccak256(bytes(message)) == keccak256("Game appears stale")) {
//                 for (uint256 i = 0; i < game.players.length; i++) {
//                     IERC20(_token).safeTransfer(game.players[i].addr, game.betAmountRequired);
//                 }
//                 delete gameStarted[gameId];
//                 emit GameReset(gameId);
//                 return;
//             }
//             if (keccak256(bytes(message)) == keccak256("Active player should be bust")) {
//                 for (uint256 i = 0; i < game.players.length; i++) {
//                     if (game.players[i].isActive &&
//                         calculateHandValue(game.players[i].hand) > BLACKJACK) {
//                         game.players[i].isActive = false;
//                     }
//                 }
//                 if (shouldEndGame(gameId)) declareWinner(gameId);
//                 return;
//             }
//             revert(string(abi.encodePacked("Upkeep needed: ", message)));
//         }

//         if (game.gameState == Structss.GameState.PLAYING) {
//             checkForInactivePlayers(gameId);
//         }

//         if (game.gameState == Structss.GameState.SHUFFLING) {
//             VRFV2PlusClient.RandomWordsRequest memory request = VRFV2PlusClient.RandomWordsRequest({
//                 keyHash: i_keyHash,
//                 subId: i_subscriptionId,
//                 requestConfirmations: REQUEST_CONFIRMATIONS,
//                 callbackGasLimit: i_callbackGasLimit,
//                 numWords: NUM_WORDS,
//                 extraArgs: VRFV2PlusClient._argsToBytes(
//                     VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
//                 )
//             });
//             uint256 requestId = s_vrfCoordinator.requestRandomWords(request);
//             s_requestIdToGameId[requestId] = gameId;
//         }
//     }

//     function shouldEndGame(uint256 gameId) internal view returns (bool) {
//         Structss.CurrentGame storage game = gameStarted[gameId];
//         uint256 activePlayers;
//         for (uint256 i = 0; i < game.players.length; i++) {
//             activePlayers += game.players[i].isActive ? 1 : 0;
//         }
//         return activePlayers <= 1;
//     }

//     function checkForInactivePlayers(uint256 gameId) internal {
//         Structss.CurrentGame storage game = gameStarted[gameId];
//         bool ended;
//         for (uint256 i = 0; i < game.players.length; i++) {
//             if (game.players[i].isActive &&
//                 block.timestamp - game.lastTimestamp > 30 minutes) {
//                 game.players[i].isActive = false;
//                 ended = true;
//             }
//         }
//         if (ended && shouldEndGame(gameId)) declareWinner(gameId);
//     }

//     function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
//         uint256 gameId = s_requestIdToGameId[requestId];
//         Structss.CurrentGame storage game = gameStarted[gameId];
//         require(game.gameState == Structss.GameState.SHUFFLING, "Game not shuffling");

//         game.deck = shuffleDeckWithSeed(game.deck, randomWords[0]);
//         game.gameState = Structss.GameState.DEALING;
//         dealPlayersWithCards(gameId);

//         game.lastTimestamp = block.timestamp;
//         game.gameState = Structss.GameState.PLAYING;
//         emit GameStarted(gameId);
//         emit CardsDealt(gameId);
//     }

//     function hit(uint256 gameId) external onlyEntryPoint {
//         Structss.CurrentGame storage game = gameStarted[gameId];
//         require(game.gameState == Structss.GameState.PLAYING, "Game not playing");
//         require(game.isPlayerInGame[msg.sender], "Not registered");

//         Structss.Player storage player = game.players[game.playerIndex[msg.sender]];
//         require(player.isActive, "Player not active");
//         require(player.hand.length < CARDS_PER_PLAYER, "Max cards reached");
//         require(game.deck.length > 0, "Deck empty");                             

//         uint8 card = game.deck.pop();
//         player.hand.push(card);
//         emit CardDrawn(msg.sender, card);

//         if (calculateHandValue(player.hand) > BLACKJACK) {
//             player.isActive = false;
//             if (shouldEndGame(gameId)) declareWinner(gameId);                    
//         }
//     }

//     function checkUpKeep(uint256 gameId) external view returns (bool isValid, string memory message) {
//         Structss.CurrentGame storage game = gameStarted[gameId];
//         if (game.players.length == 0)              return (false, "Game does not exist");
//         if (game.players.length > MAX_PLAYERS)     return (false, "Too many players in game");
//         if (game.deck.length > 52)                 return (false, "Deck has too many cards");
//         if (game.gameState == Structss.GameState.WAITING && 
//             game.players.length >= game.totalPlayers) return (false, "Game should have started");

//         for (uint256 i = 0; i < game.players.length; i++) {
//             Structss.Player storage player = game.players[i];
//             if (player.hand.length > CARDS_PER_PLAYER)      return (false, "Player has too many cards");
//             if (player.isActive && calculateHandValue(player.hand) > BLACKJACK) return (false, "Active player should be bust");
//         }
//         if (game._totalBet != game.betAmountRequired * game.players.length) return (false, "Total bet amount mismatch");
//         if (game.gameState != Structss.GameState.WAITING &&
//             block.timestamp - game.lastTimestamp > 1 days) return (false, "Game appears stale");

//         if (game.gameState == Structss.GameState.SHUFFLING) {
//             bool requestFound;
//             for (uint256 i = 0; i <= s_gameId; i++) {
//                 if (s_requestIdToGameId[i] == gameId) { requestFound = true; break; }
//             }
//             if (!requestFound) return (false, "No VRF request for shuffling");
//         }
//         return (true, "All checks passed");
//     }

//     function poke(uint256 gameId, address target) external onlyEntryPoint {
//         Structss.CurrentGame storage game = gameStarted[gameId];
//         require(game.gameState == Structss.GameState.PLAYING, "Game not playing");
//         require(game.isPlayerInGame[msg.sender], "Sender not registered");
//         require(game.isPlayerInGame[target], "Target not registered");

//         Structss.Player storage sender = game.players[game.playerIndex[msg.sender]];    
//         Structss.Player storage targetPlayer = game.players[game.playerIndex[target]];
//         require(sender.isActive && targetPlayer.isActive, "Players must be active");
//         require(game.deck.length > 0, "Deck empty");                                    

//         uint8 card = game.deck.pop();
//         targetPlayer.hand.push(card);
//         emit CardDrawn(target, card);

//         if (calculateHandValue(targetPlayer.hand) > BLACKJACK) {
//             targetPlayer.isActive = false;
//             if (shouldEndGame(gameId)) declareWinner(gameId);                           
//         }
//     }

//     function stand(uint256 gameId) external onlyEntryPoint {
//         Structss.CurrentGame storage game = gameStarted[gameId];
//         require(game.gameState == Structss.GameState.PLAYING, "Game not playing");
//         require(game.isPlayerInGame[msg.sender], "Not registered");

//         Structss.Player storage player = game.players[game.playerIndex[msg.sender]];
//         require(player.isActive, "Player already inactive");

//         player.isActive = false;
//         if (shouldEndGame(gameId)) declareWinner(gameId);                               
//     }

//     function calculateHandValue(uint8[] memory hand) internal pure returns (uint8) {
//         uint8 value = 0;
//         uint8 aces;
//         for (uint256 i = 0; i < hand.length; i++) {
//             uint8 cardValue = hand[i] % 13;
//             if (cardValue == 0) { value += 11; aces++; }
//             else if (cardValue >= 10) { value += 10; }
//             else { value += cardValue + 1; }
//         }
//         while (value > BLACKJACK && aces > 0) { value -= 10; aces--; }
//         return value;
//     }

//     function declareWinner(uint256 gameId) internal {
//         Structss.CurrentGame storage game = gameStarted[gameId];
//         require(game.gameState == Structss.GameState.PLAYING, "Game not playing");

//         address winner;
//         uint8 bestScore;
//         for (uint256 i = 0; i < game.players.length; i++) {
//             Structss.Player storage p = game.players[i];
//             if (p.isActive) {
//                 uint8 score = calculateHandValue(p.hand);
//                 if (score > bestScore && score <= BLACKJACK) {
//                     bestScore = score;
//                     winner = p.addr;
//                 }
//             }
//         }

//         if (winner != address(0)) {
//             IERC20(_token).safeTransfer(winner, game._totalBet);
//             emit WinnerDeclared(winner, gameId);
//             (, , , address nftAddr) = _entry.getUserInfo(winner);
//             mintRankNFT(winner, 1, 1, nftAddr);
//         }

//         delete game.players;
//         delete game.deck;
//         delete game.isPlayerInGame;
//         delete game.playerIndex;

//         delete gameStarted[gameId];                                                    
//         emit GameReset(gameId);                                                            
//     }

//     function createDeck() internal pure returns (uint8[] memory) {
//         uint8;
//         for (uint8 i = 0; i < 52; i++) deck[i] = i;
//         return deck;
//     }

//     function shuffleDeckWithSeed(uint8[] memory deck, uint256 randomSeed) internal pure returns (uint8[] memory) {
//         for (uint256 i = deck.length - 1; i > 0; i--) {
//             uint256 j = uint256(keccak256(abi.encode(randomSeed, i))) % (i + 1);
//             (deck[i], deck[j]) = (deck[j], deck[i]);
//         }
//         return deck;
//     }

//     function dealPlayersWithCards(uint256 gameId) internal {
//         Structss.CurrentGame storage game = gameStarted[gameId];
//         require(game.gameState == Structss.GameState.DEALING, "Game not dealing");
//         for (uint256 i = 0; i < game.players.length; i++) {
//             for (uint8 j = 0; j < CARDS_PER_PLAYER; j++) {
//                 require(game.deck.length > 0, "Deck empty");
//                 uint8 card = game.deck.pop();
//                 game.players[i].hand.push(card);
//                 emit CardDrawn(game.players[i].addr, card);
//             }
//         }
//         game.gameState = Structss.GameState.PLAYING;
//         emit CardsDealt(gameId);
//     }

//     function getGameDetails(uint256 gameId) external view returns (Structss.CurrentGame memory) {
//         return gameStarted[gameId];
//     }

//     function mintRankNFT(address to, uint256 gamesWon, uint256 gamesPlayed, address rankNFTAddress) internal {
//         IRankNFT(rankNFTAddress).mintRankNFT(to, gamesWon, gamesPlayed);
//     }

//     modifier onlyEntryPoint() {
//         require(msg.sender == address(_entry), ErrorLib.Manager__OnlyEntryPoint());
//         _;
//     }
// }
