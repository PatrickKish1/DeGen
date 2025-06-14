// api/tools/gas-estimate/route.ts
/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionType, amount } = body;

    const client = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    const gasPrice = await client.getGasPrice();
    
    // Estimate gas based on transaction type
    let gasEstimate: number;
    
    switch (transactionType) {
      case 'transfer':
        gasEstimate = 65000; // ERC20 transfer
        break;
      case 'approve':
        gasEstimate = 45000; // ERC20 approval
        break;
      case 'swap':
        gasEstimate = 150000; // DEX swap
        break;
      case 'stake':
        gasEstimate = 120000; // Staking operation
        break;
      case 'unstake':
        gasEstimate = 100000; // Unstaking operation
        break;
      default:
        gasEstimate = 21000; // Basic ETH transfer
    }

    const totalCostWei = BigInt(gasEstimate) * gasPrice;
    const costInEth = formatUnits(totalCostWei, 18);
    
    // Mock ETH price for USD calculation
    const ethPriceUsd = 2500;
    const costInUsd = (parseFloat(costInEth) * ethPriceUsd).toFixed(2);

    return NextResponse.json({
      success: true,
      transactionType,
      gasEstimate: gasEstimate.toString(),
      gasPrice: formatUnits(gasPrice, 9) + ' Gwei',
      costInEth: parseFloat(costInEth).toFixed(6),
      costInUsd: costInUsd,
      network: 'Base Sepolia',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gas estimation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to estimate gas',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}