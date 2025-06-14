// api/tools/yield-opportunities/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const minApy = searchParams.get('minApy');
    const riskLevel = searchParams.get('riskLevel');

    // Mock yield opportunities data for Base Sepolia
    let opportunities = [
      {
        protocol: 'Aave V3',
        pool: 'USDC Supply',
        apy: '4.2%',
        tvl: '$125M',
        risk: 'low',
        minimumDeposit: '1 USDC',
        description: 'Lend USDC to earn interest with battle-tested protocol'
      },
      {
        protocol: 'Compound V3',
        pool: 'cUSDCv3',
        apy: '3.8%',
        tvl: '$89M',
        risk: 'low',
        minimumDeposit: '1 USDC',
        description: 'Algorithmic money market with autonomous interest rates'
      },
      {
        protocol: 'Uniswap V3',
        pool: 'USDC/ETH 0.05%',
        apy: '12.5%',
        tvl: '$245M',
        risk: 'medium',
        minimumDeposit: '10 USDC',
        description: 'Provide liquidity to earn fees (subject to impermanent loss)'
      },
      {
        protocol: 'Curve Finance',
        pool: 'USDC-USDT',
        apy: '6.8%',
        tvl: '$156M',
        risk: 'low',
        minimumDeposit: '1 USDC',
        description: 'Stable coin liquidity with low impermanent loss risk'
      },
      {
        protocol: 'Yearn Finance',
        pool: 'USDC Vault',
        apy: '8.3%',
        tvl: '$78M',
        risk: 'medium',
        minimumDeposit: '1 USDC',
        description: 'Automated yield farming strategy vault'
      },
      {
        protocol: 'Stargate',
        pool: 'S*USDC',
        apy: '15.2%',
        tvl: '$345M',
        risk: 'high',
        minimumDeposit: '5 USDC',
        description: 'Cross-chain liquidity with STG rewards'
      }
    ];

    // Filter by minimum APY
    if (minApy) {
      const minApyNum = parseFloat(minApy);
      opportunities = opportunities.filter(opp => parseFloat(opp.apy) >= minApyNum);
    }

    // Filter by risk level
    if (riskLevel && riskLevel !== 'all') {
      opportunities = opportunities.filter(opp => opp.risk === riskLevel);
    }

    return NextResponse.json({
      success: true,
      opportunities,
      count: opportunities.length,
      filters: {
        minApy: minApy || 'none',
        riskLevel: riskLevel || 'all'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Yield opportunities error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch yield opportunities',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}