/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { WalletSendCallsParams } from "@xmtp/content-type-wallet-send-calls";
import { createPublicClient, formatUnits, http, toHex, parseUnits } from "viem";
import { base, baseSepolia } from "viem/chains";

// Network configuration type
export type NetworkConfig = {
  tokenAddress: string;
  chainId: `0x${string}`;
  decimals: number;
  networkName: string;
  networkId: string;
  explorerUrl: string;
  rpcUrl?: string;
};

// Available network configurations
export const USDC_NETWORKS: NetworkConfig[] = [
  {
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
    chainId: toHex(84532), // Base Sepolia network ID (84532 in hex)
    decimals: 6,
    networkName: "Base Sepolia",
    networkId: "base-sepolia",
    explorerUrl: "https://sepolia.basescan.org",
    rpcUrl: "https://sepolia.base.org"
  },
  {
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base Mainnet
    chainId: toHex(8453), // Base Mainnet network ID (8453 in hex)
    decimals: 6,
    networkName: "Base Mainnet",
    networkId: "base-mainnet",
    explorerUrl: "https://basescan.org",
    rpcUrl: "https://mainnet.base.org"
  },
];

// ERC20 ABI for balance checking and transfers
const erc20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  }
] as const;

export class USDCHandler {
  private networkConfig: NetworkConfig;
  private publicClient;

  /**
   * Create a USDC handler for a specific network
   * @param networkId - The network identifier ("base-sepolia" or "base-mainnet")
   */
  constructor(networkId: string) {
    const config = USDC_NETWORKS.find(
      (network) => network.networkId === networkId,
    );
    if (!config) {
      throw new Error(`Network configuration not found for: ${networkId}. Available networks: ${USDC_NETWORKS.map(n => n.networkId).join(', ')}`);
    }

    this.networkConfig = config;
    this.publicClient = createPublicClient({
      chain: networkId === "base-mainnet" ? base : baseSepolia,
      transport: http(config.rpcUrl),
    });

    console.log(`✓ USDC Handler initialized for ${config.networkName}`);
  }

  /**
   * Get USDC balance for a given address
   */
  async getUSDCBalance(address: string): Promise<string> {
    try {
      if (!address || !address.startsWith('0x')) {
        throw new Error('Invalid address format');
      }

      const balance = await this.publicClient.readContract({
        address: this.networkConfig.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });

      const formattedBalance = formatUnits(balance, this.networkConfig.decimals);
      console.log(`💰 Balance for ${address.slice(0, 6)}...${address.slice(-4)}: ${formattedBalance} USDC`);
      
      return parseFloat(formattedBalance).toFixed(6);
    } catch (error: unknown) {
      console.error("Error getting USDC balance:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Invalid address')) {
        throw new Error("Invalid wallet address provided");
      }
      
      throw new Error(`Failed to get USDC balance: ${errorMessage}`);
    }
  }

  /**
   * Get USDC token information
   */
  async getTokenInfo(): Promise<{ name: string; symbol: string; decimals: number }> {
    try {
      const [name, symbol] = await Promise.all([
        this.publicClient.readContract({
          address: this.networkConfig.tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "name",
        }),
        this.publicClient.readContract({
          address: this.networkConfig.tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "symbol",
        })
      ]);

      return {
        name: name as string,
        symbol: symbol as string,
        decimals: this.networkConfig.decimals
      };
    } catch (error: unknown) {
      console.error("Error getting token info:", error);
      return {
        name: "USD Coin",
        symbol: "USDC",
        decimals: this.networkConfig.decimals
      };
    }
  }

  /**
   * Create wallet send calls parameters for USDC transfer
   */
  createUSDCTransferCalls(
    fromAddress: string,
    recipientAddress: string,
    amount: number,
  ): WalletSendCallsParams {
    try {
      // Validate inputs
      if (!fromAddress?.startsWith('0x') || !recipientAddress?.startsWith('0x')) {
        throw new Error('Invalid address format');
      }

      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Function signature for ERC20 'transfer(address,uint256)'
      const methodSignature = "0xa9059cbb";

      // Format the transaction data following ERC20 transfer standard
      // Remove '0x' prefix from recipient address and pad to 32 bytes
      const recipientParam = recipientAddress.slice(2).padStart(64, "0");
      
      // Convert amount to hex and pad to 32 bytes
      const amountParam = BigInt(amount).toString(16).padStart(64, "0");
      
      const transactionData = `${methodSignature}${recipientParam}${amountParam}` as `0x${string}`;

      const formattedAmount = this.formatAmount(amount);
      
      console.log(`🔄 Creating transfer: ${formattedAmount} USDC from ${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)} to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`);

      return {
        version: "1.0",
        from: fromAddress as `0x${string}`,
        chainId: this.networkConfig.chainId,
        calls: [
          {
            to: this.networkConfig.tokenAddress as `0x${string}`,
            data: transactionData,
            value: "0x0", // No ETH value for ERC20 transfer
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error creating USDC transfer calls:', error);
      throw new Error(`Failed to create transfer: ${errorMessage}`);
    }
  }

  /**
   * Create wallet send calls for USDC approval
   */
  createUSDCApprovalCalls(
    fromAddress: string,
    spenderAddress: string,
    amount: number,
  ): WalletSendCallsParams {
    try {
      // Function signature for ERC20 'approve(address,uint256)'
      const methodSignature = "0x095ea7b3";

      const spenderParam = spenderAddress.slice(2).padStart(64, "0");
      const amountParam = BigInt(amount).toString(16).padStart(64, "0");
      const transactionData = `${methodSignature}${spenderParam}${amountParam}` as `0x${string}`;

      const formattedAmount = this.formatAmount(amount);

      return {
        version: "1.0",
        from: fromAddress as `0x${string}`,
        chainId: this.networkConfig.chainId,
        calls: [
          {
            to: this.networkConfig.tokenAddress as `0x${string}`,
            data: transactionData,
            value: "0x0",
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error creating USDC approval calls:', error);
      throw new Error(`Failed to create approval: ${errorMessage}`);
    }
  }

  /**
   * Check USDC allowance
   */
  async getUSDCAllowance(ownerAddress: string, spenderAddress: string): Promise<string> {
    try {
      const allowance = await this.publicClient.readContract({
        address: this.networkConfig.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`],
      });

      return formatUnits(allowance, this.networkConfig.decimals);
    } catch (error) {
      console.error("Error getting USDC allowance:", error);
      throw new Error("Failed to get USDC allowance");
    }
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(): NetworkConfig {
    return { ...this.networkConfig };
  }

  /**
   * Format amount from contract format to display format
   */
  formatAmount(amount: number): string {
    return (amount / Math.pow(10, this.networkConfig.decimals)).toFixed(6);
  }

  /**
   * Parse amount from display format to contract format
   */
  parseAmount(displayAmount: number): number {
    return Math.floor(displayAmount * Math.pow(10, this.networkConfig.decimals));
  }

  /**
   * Parse amount using viem's parseUnits for better precision
   */
  parseAmountPrecise(displayAmount: string): bigint {
    return parseUnits(displayAmount, this.networkConfig.decimals);
  }

  /**
   * Validate address format
   */
  isValidAddress(address: string): boolean {
    return Boolean(address && address.startsWith('0x') && address.length === 42);
  }

  /**
   * Get transaction explorer URL
   */
  getTransactionUrl(txHash: string): string {
    return `${this.networkConfig.explorerUrl}/tx/${txHash}`;
  }

  /**
   * Get address explorer URL
   */
  getAddressUrl(address: string): string {
    return `${this.networkConfig.explorerUrl}/address/${address}`;
  }

  /**
   * Get token explorer URL
   */
  getTokenUrl(): string {
    return `${this.networkConfig.explorerUrl}/token/${this.networkConfig.tokenAddress}`;
  }

  /**
   * Estimate gas for USDC transfer
   */
  async estimateTransferGas(fromAddress: string, toAddress: string, amount: number): Promise<bigint> {
    try {
      const gas = await this.publicClient.estimateContractGas({
        address: this.networkConfig.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [toAddress as `0x${string}`, BigInt(amount)],
        account: fromAddress as `0x${string}`,
      });

      return gas;
    } catch (error) {
      console.error('Error estimating gas:', error);
      // Return a reasonable default gas estimate for ERC20 transfers
      return BigInt(65000);
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      return await this.publicClient.getGasPrice();
    } catch (error) {
      console.error('Error getting gas price:', error);
      // Return a reasonable default (20 gwei)
      return BigInt(20000000000);
    }
  }

  /**
   * Calculate transaction cost estimate
   */
  async estimateTransactionCost(fromAddress: string, toAddress: string, amount: number): Promise<{
    gasEstimate: bigint;
    gasPrice: bigint;
    totalCostWei: bigint;
    totalCostEth: string;
  }> {
    try {
      const [gasEstimate, gasPrice] = await Promise.all([
        this.estimateTransferGas(fromAddress, toAddress, amount),
        this.getGasPrice()
      ]);

      const totalCostWei = gasEstimate * gasPrice;
      const totalCostEth = formatUnits(totalCostWei, 18);

      return {
        gasEstimate,
        gasPrice,
        totalCostWei,
        totalCostEth
      };
    } catch (error) {
      console.error('Error estimating transaction cost:', error);
      throw new Error('Failed to estimate transaction cost');
    }
  }

  /**
   * Create batch transfer calls for multiple recipients
   */
  createBatchTransferCalls(
    fromAddress: string,
    transfers: Array<{ recipient: string; amount: number }>
  ): WalletSendCallsParams {
    try {
      const calls = transfers.map(({ recipient, amount }) => {
        const methodSignature = "0xa9059cbb";
        const recipientParam = recipient.slice(2).padStart(64, "0");
        const amountParam = BigInt(amount).toString(16).padStart(64, "0");
        const transactionData = `${methodSignature}${recipientParam}${amountParam}` as `0x${string}`;

        return {
          to: this.networkConfig.tokenAddress as `0x${string}`,
          data: transactionData,
          value: "0x0" as `0x${string}`,
        };
      });

      const totalAmount = transfers.reduce((sum, t) => sum + t.amount, 0);

      return {
        version: "1.0",
        from: fromAddress as `0x${string}`,
        chainId: this.networkConfig.chainId,
        calls,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error creating batch transfer calls:', error);
      throw new Error(`Failed to create batch transfer: ${errorMessage}`);
    }
  }

  /**
   * Create enhanced transfer with gas estimation
   */
  async createEnhancedTransferCalls(
    fromAddress: string,
    recipientAddress: string,
    amount: number,
    includeGasEstimate: boolean = true
  ): Promise<WalletSendCallsParams & { gasEstimate?: any }> {
    try {
      const transferCalls = this.createUSDCTransferCalls(fromAddress, recipientAddress, amount);

      if (!includeGasEstimate) {
        return transferCalls;
      }

      const gasInfo = await this.estimateTransactionCost(fromAddress, recipientAddress, amount);

      return {
        ...transferCalls,
        gasEstimate: {
          gas: gasInfo.gasEstimate.toString(),
          gasPrice: gasInfo.gasPrice.toString(),
          totalCostEth: gasInfo.totalCostEth,
          network: this.networkConfig.networkName
        }
      };
    } catch (error) {
      console.error('Error creating enhanced transfer calls:', error);
      // Return basic transfer calls if gas estimation fails
      return this.createUSDCTransferCalls(fromAddress, recipientAddress, amount);
    }
  }

  /**
   * Validate transfer parameters
   */
  validateTransfer(fromAddress: string, toAddress: string, amount: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!this.isValidAddress(fromAddress)) {
      errors.push('Invalid sender address');
    }

    if (!this.isValidAddress(toAddress)) {
      errors.push('Invalid recipient address');
    }

    if (fromAddress.toLowerCase() === toAddress.toLowerCase()) {
      errors.push('Cannot send to the same address');
    }

    if (amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (amount > 1000000) { // 1M USDC safety limit
      errors.push('Amount exceeds safety limit');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get network status and health
   */
  async getNetworkStatus(): Promise<{
    isHealthy: boolean;
    blockNumber: bigint;
    chainId: number;
    networkName: string;
  }> {
    try {
      const [blockNumber, chainId] = await Promise.all([
        this.publicClient.getBlockNumber(),
        this.publicClient.getChainId()
      ]);

      return {
        isHealthy: true,
        blockNumber,
        chainId,
        networkName: this.networkConfig.networkName
      };
    } catch (error: unknown) {
      console.error("Error getting network status:", error);
      return {
        isHealthy: false,
        blockNumber: BigInt(0),
        chainId: 0,
        networkName: this.networkConfig.networkName
      };
    }
  }

  /**
   * Format transaction for display
   */
  formatTransaction(calls: WalletSendCallsParams): {
    summary: string;
    details: Array<{ label: string; value: string }>;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const details: Array<{ label: string; value: string }> = [];

    if (calls.calls.length === 0) {
      warnings.push('No transaction calls found');
      return { summary: 'Invalid transaction', details, warnings };
    }

    const firstCall = calls.calls[0];
    
    if (calls.calls.length === 1) {
      // Single transfer - try to decode amount from data
      const summary = `Transfer USDC`;
      
      details.push(
        { label: 'Amount', value: 'Unknown USDC' },
        { label: 'To', value: 'Unknown' },
        { label: 'Network', value: this.networkConfig.networkName },
        { label: 'Token', value: `USDC (${this.networkConfig.tokenAddress.slice(0, 6)}...${this.networkConfig.tokenAddress.slice(-4)})` }
      );

      return {
        summary,
        details,
        warnings
      };
    } else {
      // Batch transfer
      const summary = `Batch transfer USDC to ${calls.calls.length} recipients`;
      
      details.push(
        { label: 'Recipients', value: calls.calls.length.toString() },
        { label: 'Network', value: this.networkConfig.networkName }
      );

      return {
        summary,
        details,
        warnings
      };
    }
  }
}