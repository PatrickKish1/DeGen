// api/tools/balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

const USDC_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const client = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    try {
      const [usdcBalance, ethBalance] = await Promise.all([
        client.readContract({
          address: USDC_CONTRACT as `0x${string}`,
          abi: [
            {
              name: 'balanceOf',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'account', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
            }
          ],
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        }),
        client.getBalance({
          address: address as `0x${string}`
        })
      ]);

      const formattedUsdcBalance = formatUnits(usdcBalance as bigint, 6);
      const formattedEthBalance = formatUnits(ethBalance, 18);

      return NextResponse.json({
        success: true,
        balance: parseFloat(formattedUsdcBalance).toFixed(6),
        ethBalance: parseFloat(formattedEthBalance).toFixed(6),
        address,
        network: 'Base Sepolia',
        timestamp: new Date().toISOString()
      });

    } catch (contractError) {
      console.error('Contract interaction error:', contractError);
      
      return NextResponse.json({
        success: true,
        balance: '0.000000',
        ethBalance: '0.000000',
        address,
        network: 'Base Sepolia',
        timestamp: new Date().toISOString(),
        note: 'Could not fetch balance - address may be new or network unavailable'
      });
    }

  } catch (error) {
    console.error('Balance API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch balance',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}