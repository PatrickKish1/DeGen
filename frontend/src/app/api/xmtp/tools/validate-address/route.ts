// api/tools/validate-address/route.ts
/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import { getAddress, isAddress } from 'viem';

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

    const isValidFormat = isAddress(address);
    
    if (!isValidFormat) {
      return NextResponse.json({
        success: true,
        isValid: false,
        address,
        error: 'Invalid address format'
      });
    }

    try {
      const checksumAddress = getAddress(address);
      
      // Additional validation could be added here
      // e.g., checking if it's a contract vs EOA
      
      return NextResponse.json({
        success: true,
        isValid: true,
        address,
        checksumAddress,
        type: 'address', // Could be 'contract' or 'eoa' with additional checks
        network: 'Base Sepolia'
      });

    } catch (checksumError) {
      return NextResponse.json({
        success: true,
        isValid: false,
        address,
        error: 'Failed to create checksum address'
      });
    }

  } catch (error) {
    console.error('Address validation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to validate address',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}