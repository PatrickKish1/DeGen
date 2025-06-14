# DeGen Mobile Verifier DApp

This repository contains the smart contracts for the DeGen platform's blockchain verification system and DeFi integrations. The smart contracts handle transaction verification, cross-chain operations, token management, game mechanics, and community governance.

## Table of Contents

- [Overview](#overview)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Features](#features)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contract Addresses](#contract-addresses)
- [Future Development](#future-development)
- [Security](#security)

## Overview

The DeGen Mobile Verifier DApp serves as the blockchain backbone for the DeGen platform, providing secure verification mechanisms for mobile money transactions and enabling DeFi functionality for users transitioning from traditional finance to Web3.

## Smart Contract Architecture

The system consists of several interconnected smart contracts:

- **Manager**: Central coordination contract
- **Entry Point**: Primary interaction point for users
- **Token**: USDC/USDT compatible token implementation
- **Game Contract**: Handles on-chain game mechanics (currently Blackjack)
- **Rank NFT**: NFT system for user achievements and status
- **Farm**: Yield generation through staking mechanisms
- **Swap Manager**: Facilitates token swaps across chains

## Features

### Implemented Features

#### Agents & Verification
- ✅ Agent verification system
- ✅ Community creation functionality

#### Communities & Groups
- ✅ Conditional voting communities
  - Allows users to vote on shared investment strategies
  - Rewards are distributed based on voting outcomes
- ✅ Private groups with single ownership
  - Supports staking, conditional voting, and game chat rooms

#### Gaming
- ✅ On-chain Blackjack implementation

### Under Development

#### Cross-Chain Integration (CCIP)
- 🔄 Cross-chain supply management
- 🔄 Cross-chain token swaps

#### Gaming Enhancements
- 🔄 Chainlink VRF integration for verifiable randomness
- 🔄 Chainlink Automation for game state management

## Development Setup

### Prerequisites

- Foundry (Forge, Cast, Anvil)
- Solidity ^0.8.13
- Node.js >= 16.x
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/jossyboydgenius/DeGen.git
cd DeGen/mobile-verifier-dapp

# Install dependencies
forge install

# Build the project
forge build
```

## Testing

Run the test suite to ensure everything is functioning correctly:

```bash
# Run all tests
forge test

# Run tests with verbosity level 2
forge test -vv

# Run specific test
forge test --match-test testFunctionName -vv
```

## Deployment

### Base Network

```bash
# Deploy to Base network
forge script script/Deploy.s.sol:DeployToBase \
  --rpc-url $BASE_URL \
  --broadcast \
  --private-key $PRIVATE_KEY
```

### Other Networks

Modify the deployment script and run:

```bash
# Example for Optimism deployment
forge script script/Deploy.s.sol:DeployToOptimism \
  --rpc-url $OPTIMISM_URL \
  --broadcast \
  --private-key $PRIVATE_KEY
```

## Contract Addresses

### Base Network

| Contract       | Address                                      |
|----------------|----------------------------------------------|
| Manager        | 0x76fB7D48d3cC6D1715DB44f61C6F0D36344C77eb  |
| Entry Point    | 0x518382220a0C9e474242Ec261019658E907776aE  |
| Token          | 0x198117b62F4ffB67d44E54bC6d2FE67Be1c9305C  |
| Game Contract  | 0x0EFB3d7EA0A0930ced25535BeCA582DC564EE081  |
| Rank NFT       | 0x816aAC1Dd487C3f7345256C3d62cBF52840977e0  |
| Farm           | 0xB262a3435A3a4aa948721B7C3882728634672588  |
| Swap Manager   | 0xC414100f3C8BB7e50ED340D2AB947B7Ebd41C39e  |

## Future Development

### Q3 2025 Roadmap

1. **CCIP Integration**
   - Cross-chain supply management
   - Cross-chain token swaps
   
2. **Game Enhancements**
   - Implement Chainlink VRF for fair random number generation
   - Set up Chainlink Automation for automated game state changes

### Q4 2025 Roadmap

1. **Scalability Improvements**
   - Optimize gas usage for key functions
   - Implement Layer 2 integrations

2. **Additional Features**
   - Expanded voting mechanisms
   - Agent reputation system
   - More gaming options

## Security

This project utilizes several security-focused libraries and practices:

- OpenZeppelin contracts for standard implementations
- Access control mechanisms for sensitive functions
- Reentrancy guards on state-changing functions
- Formal verification for critical components

### Audit Status

The contracts are pending external security audit. Please use caution when interacting with them in production environments.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**DeGen Mobile Verifier DApp** - The blockchain backbone of the DeGen ecosystem.
