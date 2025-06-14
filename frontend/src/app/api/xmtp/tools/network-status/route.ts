// api/tools/network-status/route.ts
/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

export async function GET() {
  try {
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    const [blockNumber, gasPrice, chainId] = await Promise.all([
      client.getBlockNumber(),
      client.getGasPrice(),
      client.getChainId()
    ]);

    return NextResponse.json({
      success: true,
      name: 'Base Sepolia',
      chainId: Number(chainId),
      blockNumber: blockNumber.toString(),
      gasPrice: formatUnits(gasPrice, 9) + ' Gwei',
      gasPriceWei: gasPrice.toString(),
      isHealthy: true,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Network status error:', error);
    
    return NextResponse.json({
      success: false,
      name: 'Base Sepolia',
      chainId: 84532,
      blockNumber: '0',
      gasPrice: 'Unknown',
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Network unavailable',
      lastUpdated: new Date().toISOString()
    }, { status: 500 });
  }
}