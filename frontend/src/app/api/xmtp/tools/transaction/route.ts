// api/tools/transaction/route.ts
/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import { USDCHandler } from '@/lib/usdc-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromAddress, toAddress, amount, token = 'USDC' } = body;

    if (!fromAddress || !toAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: fromAddress, toAddress, amount' },
        { status: 400 }
      );
    }

    const networkId = 'base-sepolia';
    const usdcHandler = new USDCHandler(networkId);

    const validation = usdcHandler.validateTransfer(fromAddress, toAddress, amount);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Invalid transaction: ${validation.errors.join(', ')}` },
        { status: 400 }
      );
    }

    const amountInDecimals = usdcHandler.parseAmount(amount);

    const walletSendCalls = usdcHandler.createUSDCTransferCalls(
      fromAddress,
      toAddress,
      amountInDecimals
    );

    // Get gas estimate
    try {
      const gasInfo = await usdcHandler.estimateTransactionCost(fromAddress, toAddress, amountInDecimals);
      
      return NextResponse.json({
        success: true,
        transaction: walletSendCalls,
        gasEstimate: gasInfo.gasEstimate.toString(),
        totalCost: gasInfo.totalCostEth,
        details: {
          from: fromAddress,
          to: toAddress,
          amount: amount,
          amountInDecimals: amountInDecimals,
          network: networkId,
          token: 'USDC'
        }
      });
    } catch (gasError) {
      // Return transaction without gas estimate if gas estimation fails
      return NextResponse.json({
        success: true,
        transaction: walletSendCalls,
        details: {
          from: fromAddress,
          to: toAddress,
          amount: amount,
          amountInDecimals: amountInDecimals,
          network: networkId,
          token: 'USDC'
        }
      });
    }

  } catch (error) {
    console.error('Error creating transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create transaction';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}