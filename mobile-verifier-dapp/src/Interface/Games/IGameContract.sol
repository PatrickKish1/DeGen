// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface ICardGameWithNFT {
    // Events
    event GameStarted(uint256 indexed gameId);
    event CardsDealt(uint256 indexed gameId);
    event CardDrawn(address indexed player, uint8 card);
    event WinnerDeclared(address indexed winner, uint256 gameId);
    event NFTMinted(address indexed winner, uint256 tokenId);
    event GameReset(uint256 indexed gameId);

    // External Functions
    function CreateNewGame(uint256 betAmountRequired, uint256 noOfPlayers) external;

    function joinGame(uint256 gameId, uint256 amount) external;

    function startGame(uint256 gameId) external;

    function poke(uint256 gameId) external;

    function hit(uint256 gameId) external;

    function stand(uint256 gameId) external;

    function showHand(uint256 gameId) external view returns (uint8[] memory);
}
