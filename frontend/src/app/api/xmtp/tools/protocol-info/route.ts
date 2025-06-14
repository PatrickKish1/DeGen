// api/tools/protocol-info/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const protocol = searchParams.get('protocol');

    let protocols = [
      {
        name: 'Aave V3',
        tvl: '$125M',
        apy: '4.2%',
        risk: 'low',
        description: 'Decentralized lending protocol with over-collateralized loans and flash loans',
        website: 'https://aave.com',
        features: ['Lending', 'Borrowing', 'Flash Loans', 'Governance'],
        security: 'Audited by multiple firms, battle-tested',
        fees: '0.1% flash loan fee, variable borrow rates'
      },
      {
        name: 'Compound V3',
        tvl: '$89M',
        apy: '3.8%',
        risk: 'low',
        description: 'Algorithmic money market protocol for lending and borrowing crypto assets',
        website: 'https://compound.finance',
        features: ['Lending', 'Borrowing', 'Governance', 'COMP Rewards'],
        security: 'Audited and time-tested protocol',
        fees: 'Dynamic interest rates based on utilization'
      },
      {
        name: 'Uniswap V3',
        tvl: '$245M',
        apy: '12.5%',
        risk: 'medium',
        description: 'Concentrated liquidity AMM with customizable fee tiers and price ranges',
        website: 'https://uniswap.org',
        features: ['DEX', 'Liquidity Provision', 'Fee Tiers', 'NFT Positions'],
        security: 'Audited, high liquidity and volume',
        fees: '0.05%, 0.3%, 1% fee tiers available'
      },
      {
        name: 'Curve Finance',
        tvl: '$156M',
        apy: '6.8%',
        risk: 'low',
        description: 'DEX optimized for stablecoin and similar asset swaps with low slippage',
        website: 'https://curve.fi',
        features: ['Stable Swaps', 'Liquidity Mining', 'CRV Rewards', 'Gauges'],
        security: 'Audited, specialized for stable assets',
        fees: 'Variable fees, typically 0.04-0.4%'
      },
      {
        name: 'Yearn Finance',
        tvl: '$78M',
        apy: '8.3%',
        risk: 'medium',
        description: 'Automated yield farming aggregator that optimizes strategies across DeFi',
        website: 'https://yearn.finance',
        features: ['Yield Farming', 'Auto-compounding', 'Strategy Vaults', 'YFI Governance'],
        security: 'Audited strategies, managed by expert strategists',
        fees: '2% performance fee on profits'
      },
      {
        name: 'Stargate',
        tvl: '$345M',
        apy: '15.2%',
        risk: 'high',
        description: 'Cross-chain liquidity protocol enabling seamless asset transfers',
        website: 'https://stargate.finance',
        features: ['Cross-chain', 'Liquidity Provision', 'STG Rewards', 'Instant Finality'],
        security: 'LayerZero-based, newer protocol with bridge risks',
        fees: 'Variable based on cross-chain activity'
      }
    ];

    // Filter by specific protocol if requested
    if (protocol) {
      protocols = protocols.filter(p => 
        p.name.toLowerCase().includes(protocol.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      protocols,
      count: protocols.length,
      query: protocol || 'all',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Protocol info error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch protocol information',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}