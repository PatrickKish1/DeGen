# DeGen Yield Farming Integration

This module integrates the DeFi yield farming capabilities from our smart contracts into the frontend. It allows users to:

1. View available yield farming opportunities
2. Deposit assets into Aave and other DeFi protocols
3. Track their positions and earned yield
4. Withdraw assets when needed

## Smart Contract Integration

The frontend integrates with the `Entry.sol` contract, specifically using the `enterAaveMarket` function to deposit tokens into Aave markets.

### Key Functions

- `enterAaveMarket(uint256 amountIn, uint minAmountOut)`: Deposits tokens into Aave markets
- `exitAaveMarket(uint256 amountIn, address to, uint minAmountOut)`: Withdraws tokens from Aave

## Frontend Components

- `YieldCard`: Displays available yield farming options and handles deposits/withdrawals
- `EntryService`: Service class that interfaces with the Entry contract

## Setup

1. Add your Entry contract address to `.env.local`:

```
NEXT_PUBLIC_ENTRY_CONTRACT_ADDRESS=0x123...abc
```

2. Ensure you have a connected wallet before attempting to use the yield farming features

## Technical Notes

- The contract requires that users are registered before calling `enterAaveMarket`
- A 5% slippage tolerance is applied to `minAmountOut` by default
- APY rates are fetched from the respective protocols

## Future Improvements

1. Real-time APY updates from on-chain data
2. Position tracking and visualization
3. Yield history charts
4. Multiple asset support
5. Portfolio rebalancing tools
