# DeGen Yield Farming Integration

This module integrates the DeFi yield farming capabilities from our smart contracts into the frontend. It allows users to:

1. View available yield farming opportunities
2. Deposit assets into Aave and other DeFi protocols
3. Track their positions and earned yield
4. Withdraw assets when needed

## Smart Contract Integration

The frontend integrates with the `Entry.sol` contract, specifically using the `enterAaveMarket` function to deposit tokens into Aave markets and for Liquidity Mining functionality.

### Key Functions

- `enterAaveMarket(uint256 amountIn, uint minAmountOut)`: Deposits tokens into Aave markets and for Liquidity Mining
- `exitAaveMarket(uint256 amountIn, address to, uint minAmountOut)`: Withdraws tokens from Aave

### Implementation Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend as DeGen Frontend
    participant Wallet as User Wallet
    participant Entry as Entry.sol Contract
    participant Aave as Aave Protocol
    participant Token as Token Contract

    User->>Frontend: Clicks "Start Earning" on Yield Card
    alt User not connected
        Frontend->>Wallet: Prompt to connect wallet
        Wallet-->>Frontend: Return wallet connection
    end
    
    Frontend->>Entry: Check if user is registered
    alt User not registered
        Frontend->>Entry: registerUser()
        Entry-->>Frontend: Registration confirmation
    end
    
    User->>Frontend: Enter deposit amount
    User->>Frontend: Click "Deposit" button
    Frontend->>Frontend: Calculate minAmountOut (95% of input)
    
    alt Stablecoin Savings
        Frontend->>Entry: enterAaveMarket(amountIn, minAmountOut)
    else Liquidity Mining
        Frontend->>Entry: enterAaveMarket(amountIn, minAmountOut)
    end

    Entry->>Aave: depositToAave(amountIn, minAmountOut)
    Aave-->>Entry: Return amountReceived
    Entry->>Token: mint(user, amountReceived)
    Entry->>Entry: Update userStuff[user].tokenBalance
    Entry-->>Frontend: Transaction confirmation
    Frontend-->>User: Success message with deposited amount
```

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

### Stablecoin Savings vs. Liquidity Mining Implementation

Both the Stablecoin Savings and Liquidity Mining options utilize the same `enterAaveMarket` function in the smart contract, but they are presented as different yield opportunities to users with different risk profiles and APY rates:

```mermaid
graph TD
    A[User Interface] --> B{Yield Option Selected}
    B -->|Stablecoin Savings| C[Low Risk - 4.2% APY]
    B -->|Liquidity Mining| D[Medium Risk - 12.5% APY]
    C --> E[enterAaveMarket function]
    D --> E
    E --> F[Aave Protocol]
    F --> G[Mint Reward Tokens]
    G --> H[Update User Balance]
```

#### Technical Implementation Details

1. **Contract Function**: Both options call the same `enterAaveMarket` function in Entry.sol:
   ```solidity
   function enterAaveMarket(uint256 amountIn, uint minAmountOut) public {
       require(userStuff[msg.sender].mAddr != address(0), ErrorLib.Entry__not_Registered());
       uint256 amountReceived = farm.depositToAave(amountIn, minAmountOut);
       // mint Tokens of equivalence to user
       token.mint(msg.sender, amountReceived);
       userStuff[msg.sender].tokenBalance += amountIn;
   }
   ```

2. **Frontend Integration**:
   - The YieldCard component handles both yield options
   - Each option is configured with different display attributes (risk level, APY, lock period)
   - The `contractFunction` parameter identifies which yield option is selected
   - Both options use the EntryService's `enterAaveMarket` method to interact with the smart contract

## Future Improvements

1. Real-time APY updates from on-chain data
2. Position tracking and visualization
3. Yield history charts
4. Multiple asset support
5. Portfolio rebalancing tools
6. Additional yield strategies with different risk-reward profiles
7. Gas fee optimization for smaller deposits
8. Cross-chain yield farming using CCIP as mentioned in Entry.sol comments

## Status

As of June 2025, both Stablecoin Savings and Liquidity Mining features are fully implemented and functional in the frontend. Users can deposit assets and start earning yield from both strategies through the unified `enterAaveMarket` function in the Entry.sol contract.
