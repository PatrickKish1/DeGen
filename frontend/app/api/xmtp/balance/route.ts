import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// USDC contract addresses
const USDC_CONTRACTS = {
  'base-mainnet': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, networkId = 'base-sepolia' } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Setup chain and client
    const chain = networkId === 'base-mainnet' ? base : baseSepolia;
    const usdcAddress = USDC_CONTRACTS[networkId as keyof typeof USDC_CONTRACTS];

    if (!usdcAddress) {
      return NextResponse.json(
        { error: 'Unsupported network' },
        { status: 400 }
      );
    }

    // Create public client
    const client = createPublicClient({
      chain,
      transport: http()
    });

    try {
      // Get USDC balance
      const balance = await client.readContract({
        address: usdcAddress as `0x${string}`,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
          },
          {
            name: 'decimals',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ name: '', type: 'uint8' }],
          }
        ],
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      });

      // Get decimals (USDC has 6 decimals)
      const decimals = await client.readContract({
        address: usdcAddress as `0x${string}`,
        abi: [
          {
            name: 'decimals',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ name: '', type: 'uint8' }],
          }
        ],
        functionName: 'decimals'
      });

      // Format balance
      const formattedBalance = formatUnits(balance as bigint, decimals as number);

      // Get ETH balance for gas estimation
      const ethBalance = await client.getBalance({
        address: address as `0x${string}`
      });

      const formattedEthBalance = formatUnits(ethBalance, 18);

      return NextResponse.json({
        success: true,
        balance: parseFloat(formattedBalance).toFixed(6),
        ethBalance: parseFloat(formattedEthBalance).toFixed(6),
        address,
        networkId,
        usdcContract: usdcAddress,
        timestamp: new Date().toISOString()
      });

    } catch (contractError) {
      console.error('Contract interaction error:', contractError);
      
      // Return zero balance if contract call fails (might be new address)
      return NextResponse.json({
        success: true,
        balance: '0.000000',
        ethBalance: '0.000000',
        address,
        networkId,
        usdcContract: usdcAddress,
        timestamp: new Date().toISOString(),
        note: 'Could not fetch balance - address may be new or network unavailable'
      });
    }

  } catch (error) {
    console.error('Balance API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch balance',
        details: process.env.NODE_ENV === 'development' ? `` : undefined
      },
      { status: 500 }
    );
  }
}