// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { ISwapRouter } from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

interface ISwapManager {
    // Events
    event SwapRouterUpdated(address indexed oldRouter, address indexed newRouter);

    // State variable getters
    function swapRouter() external view returns (ISwapRouter);
    function uniswapFactory() external view returns (address);

    // Functions
    function swapExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 minAmountOut,
        uint40 deadline,
        address receiver
    ) external returns (uint256 amountOut);

    function setSwapRouter(address _swapRouter) external;
}