/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ToolDefinition, BalanceInfo, TransactionResult, NetworkStatus, YieldOpportunity, ProtocolInfo } from '@/types/chat';

/**
 * Get USDC and ETH balance for a wallet address
 */
export const getBalanceTool: ToolDefinition = {
  name: 'get_balance',
  description: 'Get USDC and ETH balance for a wallet address on Base Sepolia network',
  parameters: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'The wallet address to check balance for (will use connected wallet if not provided)'
      }
    },
    required: []
  },
  function: async (args: Record<string, any>, userAddress?: string): Promise<BalanceInfo> => {
    const targetAddress = args.address || userAddress;
    
    if (!targetAddress) {
      throw new Error('No wallet address provided and no connected wallet found');
    }

    try {
      const response = await fetch('/api/xmtp/tools/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: targetAddress })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch balance');
      }

      const data = await response.json();
      return {
        usdc: data.balance,
        eth: data.ethBalance,
        address: targetAddress,
        network: 'Base Sepolia',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }
};

/**
 * Create a USDC transfer transaction
 */
export const createTransferTool: ToolDefinition = {
  name: 'create_transfer',
  description: 'Create a USDC transfer transaction on Base Sepolia network',
  parameters: {
    type: 'object',
    properties: {
      toAddress: {
        type: 'string',
        description: 'The recipient wallet address'
      },
      amount: {
        type: 'string',
        description: 'The amount of USDC to transfer (e.g., "10.5")'
      },
      fromAddress: {
        type: 'string',
        description: 'The sender wallet address (will use connected wallet if not provided)'
      }
    },
    required: ['toAddress', 'amount']
  },
  function: async (args: Record<string, any>, userAddress?: string): Promise<TransactionResult> => {
    const fromAddress = args.fromAddress || userAddress;
    
    if (!fromAddress) {
      throw new Error('No sender address provided and no connected wallet found');
    }

    if (!args.toAddress || !args.amount) {
      throw new Error('Recipient address and amount are required');
    }

    try {
      const response = await fetch('/api/xmtp/tools/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAddress,
          toAddress: args.toAddress,
          amount: parseFloat(args.amount),
          token: 'USDC'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create transaction');
      }

      const data = await response.json();
      return {
        success: true,
        transactionHash: data.transactionHash,
        gasEstimate: data.gasEstimate,
        totalCost: data.totalCost
      };
    } catch (error) {
      console.error('Error creating transfer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

/**
 * Get current gas prices and network status
 */
export const getNetworkStatusTool: ToolDefinition = {
  name: 'get_network_status',
  description: 'Get current network status, gas prices, and block information for Base Sepolia',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  function: async (): Promise<NetworkStatus> => {
    try {
      const response = await fetch('/api/xmtp/tools/network-status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch network status');
      }

      const data = await response.json();
      return {
        name: data.name,
        chainId: data.chainId,
        blockNumber: data.blockNumber,
        gasPrice: data.gasPrice,
        isHealthy: data.isHealthy,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching network status:', error);
      throw error;
    }
  }
};

/**
 * Get DeFi yield opportunities on Base network
 */
export const getYieldOpportunitiesTool: ToolDefinition = {
  name: 'get_yield_opportunities',
  description: 'Get current DeFi yield farming and staking opportunities on Base network',
  parameters: {
    type: 'object',
    properties: {
      minApy: {
        type: 'string',
        description: 'Minimum APY percentage (e.g., "5" for 5%)'
      },
      riskLevel: {
        type: 'string',
        description: 'Risk level preference',
        enum: ['low', 'medium', 'high', 'all']
      }
    },
    required: []
  },
  function: async (args: Record<string, any>): Promise<YieldOpportunity[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (args.minApy) queryParams.set('minApy', args.minApy);
      if (args.riskLevel) queryParams.set('riskLevel', args.riskLevel);

      const response = await fetch(`/api/xmtp/tools/yield-opportunities?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch yield opportunities');
      }

      const data = await response.json();
      return data.opportunities || [];
    } catch (error) {
      console.error('Error fetching yield opportunities:', error);
      // Return mock data for demo
      return [
        {
          protocol: 'Aave',
          pool: 'USDC Supply',
          apy: '4.2%',
          tvl: '$125M',
          risk: 'low',
          minimumDeposit: '1 USDC'
        },
        {
          protocol: 'Compound',
          pool: 'cUSDC',
          apy: '3.8%',
          tvl: '$89M',
          risk: 'low',
          minimumDeposit: '1 USDC'
        }
      ];
    }
  }
};

/**
 * Get information about DeFi protocols
 */
export const getProtocolInfoTool: ToolDefinition = {
  name: 'get_protocol_info',
  description: 'Get detailed information about DeFi protocols available on Base network',
  parameters: {
    type: 'object',
    properties: {
      protocol: {
        type: 'string',
        description: 'Name of the protocol to get info about (e.g., "aave", "compound", "uniswap")'
      }
    },
    required: []
  },
  function: async (args: Record<string, any>): Promise<ProtocolInfo[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (args.protocol) queryParams.set('protocol', args.protocol);

      const response = await fetch(`/api/xmtp/tools/protocol-info?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch protocol info');
      }

      const data = await response.json();
      return data.protocols || [];
    } catch (error) {
      console.error('Error fetching protocol info:', error);
      // Return mock data for demo
      return [
        {
          name: 'Aave',
          tvl: '$125M',
          apy: '4.2%',
          risk: 'low' as const,
          description: 'Decentralized lending protocol with over-collateralized loans'
        },
        {
          name: 'Compound',
          tvl: '$89M',
          apy: '3.8%',
          risk: 'low' as const,
          description: 'Algorithmic money market protocol for lending and borrowing'
        },
        {
          name: 'Uniswap V3',
          tvl: '$245M',
          apy: '12.5%',
          risk: 'medium' as const,
          description: 'Concentrated liquidity AMM with customizable fee tiers'
        }
      ];
    }
  }
};

/**
 * Estimate gas costs for transactions
 */
export const estimateGasTool: ToolDefinition = {
  name: 'estimate_gas',
  description: 'Estimate gas costs for different types of transactions on Base Sepolia',
  parameters: {
    type: 'object',
    properties: {
      transactionType: {
        type: 'string',
        description: 'Type of transaction to estimate',
        enum: ['transfer', 'approve', 'swap', 'stake', 'unstake']
      },
      amount: {
        type: 'string',
        description: 'Amount for the transaction (if applicable)'
      }
    },
    required: ['transactionType']
  },
  function: async (args: Record<string, any>): Promise<{ gasEstimate: string; costInEth: string; costInUsd: string }> => {
    try {
      const response = await fetch('/api/xmtp/tools/gas-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to estimate gas');
      }

      const data = await response.json();
      return {
        gasEstimate: data.gasEstimate,
        costInEth: data.costInEth,
        costInUsd: data.costInUsd
      };
    } catch (error) {
      console.error('Error estimating gas:', error);
      // Return mock estimate for demo
      return {
        gasEstimate: '21000',
        costInEth: '0.0001',
        costInUsd: '0.25'
      };
    }
  }
};

/**
 * Validate wallet addresses
 */
export const validateAddressTool: ToolDefinition = {
  name: 'validate_address',
  description: 'Validate if a given string is a valid Ethereum wallet address',
  parameters: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'The address to validate'
      }
    },
    required: ['address']
  },
  function: async (args: Record<string, any>): Promise<{ isValid: boolean; checksumAddress?: string; type?: string }> => {
    const address = args.address;
    
    if (!address || typeof address !== 'string') {
      return { isValid: false };
    }

    // Basic validation
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    const isValidFormat = ethAddressRegex.test(address);

    if (!isValidFormat) {
      return { isValid: false };
    }

    try {
      // Additional validation via API
      const response = await fetch('/api/xmtp/tools/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      if (!response.ok) {
        return { isValid: isValidFormat };
      }

      const data = await response.json();
      return {
        isValid: data.isValid,
        checksumAddress: data.checksumAddress,
        type: data.type
      };
    } catch (error) {
      console.error('Error validating address:', error);
      return { isValid: isValidFormat };
    }
  }
};

// Export all tools
export const blockchainTools: ToolDefinition[] = [
  getBalanceTool,
  createTransferTool,
  getNetworkStatusTool,
  getYieldOpportunitiesTool,
  getProtocolInfoTool,
  estimateGasTool,
  validateAddressTool
];

// Helper function to get tool by name
export function getToolByName(name: string): ToolDefinition | undefined {
  return blockchainTools.find(tool => tool.name === name);
}

// Helper function to execute a tool
export async function executeTool(
  toolName: string, 
  args: Record<string, any>, 
  userAddress?: string
): Promise<any> {
  const tool = getToolByName(toolName);
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }

  try {
    return await tool.function(args, userAddress);
  } catch (error) {
    console.error(`Error executing tool '${toolName}':`, error);
    throw error;
  }
}