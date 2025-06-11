import { NextRequest, NextResponse } from 'next/server';
import { USDCHandler } from '@/lib/usdc-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Get network from environment
    const networkId = process.env.NETWORK_ID || 'base-sepolia';
    const usdcHandler = new USDCHandler(networkId);

    const balance = await usdcHandler.getUSDCBalance(address);

    return NextResponse.json({
      success: true,
      balance,
      address,
      network: networkId
    });

  } catch (error) {
    console.error('Error getting balance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get balance';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}