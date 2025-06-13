import { ethers } from 'ethers';
import entryAbi from '../web3/api/entry.json';

export interface YieldPosition {
  id: string;
  amount: string;
  apy: number;
  provider: string;
}

export class EntryService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  
  constructor(private readonly contractAddress: string) {}
  
  async init(provider: ethers.providers.Web3Provider) {
    this.provider = provider;
    this.signer = provider.getSigner();
    this.contract = new ethers.Contract(
      this.contractAddress,
      entryAbi,
      this.signer
    );
  }
  
  async enterAaveMarket(amountIn: string, minAmountOut: string) {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.contractAddress || this.contractAddress === '') throw new Error('Contract address is not set');
    
    console.log('Entering Aave market with:', {
      contractAddress: this.contractAddress,
      amountIn,
      minAmountOut
    });
    
    const amountInWei = ethers.utils.parseUnits(amountIn, 'ether');
    const minAmountOutWei = ethers.utils.parseUnits(minAmountOut, 'ether');
    
    try {
      console.log('Calling enterAaveMarket on contract...');
      const tx = await this.contract.enterAaveMarket(amountInWei, minAmountOutWei, {
        gasLimit: 300000 // Adding gas limit to prevent underestimation
      });
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      return receipt;
    } catch (error) {
      console.error('Error entering Aave market:', error);
      throw error;
    }
  }
  
  async exitAaveMarket(amountIn: string, to: string, minAmountOut: string) {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.contractAddress || this.contractAddress === '') throw new Error('Contract address is not set');
    
    console.log('Exiting Aave market with:', {
      contractAddress: this.contractAddress,
      amountIn,
      to,
      minAmountOut
    });
    
    const amountInWei = ethers.utils.parseUnits(amountIn, 'ether');
    const minAmountOutWei = ethers.utils.parseUnits(minAmountOut, 'ether');
    
    try {
      console.log('Calling exitAaveMarket on contract...');
      const tx = await this.contract.exitAaveMarket(amountInWei, to, minAmountOutWei, {
        gasLimit: 300000 // Adding gas limit to prevent underestimation
      });
      console.log('Withdrawal transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Withdrawal transaction confirmed:', receipt);
      return receipt;
    } catch (error) {
      console.error('Error exiting Aave market:', error);
      throw error;
    }
  }
  
  async registerUser() {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.contractAddress || this.contractAddress === '') throw new Error('Contract address is not set');
    
    console.log('Registering user on contract:', this.contractAddress);
    
    try {
      const tx = await this.contract.registerUser({
        gasLimit: 500000 // Adding gas limit to prevent underestimation
      });
      console.log('Registration transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Registration transaction confirmed:', receipt);
      return receipt;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }
  
  async getUserInfo(userAddress: string) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      const userInfo = await this.contract.getUserInfo(userAddress);
      return {
        mAddr: userInfo[0],
        balance: ethers.utils.formatUnits(userInfo[1], 'ether'),
        tokenBalance: ethers.utils.formatUnits(userInfo[2], 'ether'),
        rankNFT: userInfo[3]
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }
  
  async getBalance(userAddress: string, tokenAddress: string) {
    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      const balance = await this.contract.getBalanceOf(userAddress, tokenAddress);
      return ethers.utils.formatUnits(balance, 'ether');
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
// Using a fallback address for development if the environment variable is not set
const contractAddress = process.env.NEXT_PUBLIC_ENTRY_CONTRACT_ADDRESS || '0xABCdef1234567890ABCDEF1234567890abcdef12';
console.log('Entry contract address:', contractAddress);
export const entryService = new EntryService(contractAddress);
