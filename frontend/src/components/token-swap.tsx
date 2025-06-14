'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowDown, Loader2, RefreshCw } from 'lucide-react';
import { BrowserProvider } from 'ethers';
import { entryService } from '@/lib/entry-service';
import { useAccount, useConnect } from 'wagmi';

// Define common ERC20 tokens
const TOKENS = [
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/9956/thumb/4943.png'
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png'
  },
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png'
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    logoURI: 'https://assets.coingecko.com/coins/images/7598/thumb/wrapped_bitcoin_wbtc.png'
  }
];

// Define common fee tiers in Uniswap V3
const FEE_TIERS = [
  { value: 500, label: '0.05%' },
  { value: 3000, label: '0.3%' },
  { value: 10000, label: '1%' }
];

export function TokenSwap({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [amountIn, setAmountIn] = useState('');
  const [minAmountOut, setMinAmountOut] = useState('');
  const [tokenIn, setTokenIn] = useState(TOKENS[0].address);
  const [tokenOut, setTokenOut] = useState(TOKENS[2].address);
  const [feeTier, setFeeTier] = useState(3000);
  const [deadline, setDeadline] = useState(20); // 20 minutes by default
  const [slippage, setSlippage] = useState(0.5); // 0.5% by default
  const [autoMinAmountOut, setAutoMinAmountOut] = useState(true);
  const { toast } = useToast();
  const { address, connector } = useAccount();
  const { connect, connectors } = useConnect();

  // Effect to calculate min amount out based on slippage
  useEffect(() => {
    if (amountIn && autoMinAmountOut) {
      const calculatedMinAmount = parseFloat(amountIn) * (1 - slippage / 100);
      setMinAmountOut(calculatedMinAmount.toString());
    }
  }, [amountIn, slippage, autoMinAmountOut]);

  const handleSwapTokens = async () => {
    if (!tokenIn || !tokenOut || !amountIn || !minAmountOut || !address) {
      if (!address) {
        // Connect to the first available connector
        const connector = connectors[0];
        if (connector) {
          connect({ connector });
        }
        return;
      }
      
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to proceed with the swap.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Get provider from connector
      const provider = await connector?.getProvider();
      if (!provider || typeof provider !== 'object' || !('request' in provider)) {
        throw new Error('No valid provider available');
      }
      
      const ethersProvider = new BrowserProvider(provider as any);
      await entryService.init(ethersProvider);
      
      // Check if the user is registered
      try {
        const userInfo = await entryService.getUserInfo(address);
        console.log('User is registered, user info:', userInfo);
      } catch (error) {
        console.log('User not registered, registering user...');
        const registration = await entryService.registerUser();
        console.log('User registration transaction:', registration);
      }
      
      // Execute the token swap
      const tx = await entryService.swapTokens(
        tokenIn,
        tokenOut,
        amountIn,
        minAmountOut,
        feeTier,
        deadline,
        address // Receiver is the connected wallet address
      );
      
      toast({
        title: "Swap Successful!",
        description: `You've successfully swapped tokens`,
      });
      
      // Reset input fields
      setAmountIn('');
      setMinAmountOut('');
      
    } catch (error: any) {
      console.error('Error in handleSwapTokens:', error);
      toast({
        title: "Swap Failed",
        description: error.message || "There was an error processing your swap",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to swap token input and output
  const handleSwapDirection = () => {
    const tempTokenIn = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(tempTokenIn);
  };

  // Find token details by address
  const getTokenByAddress = (address: string) => {
    return TOKENS.find(token => token.address.toLowerCase() === address.toLowerCase()) || TOKENS[0];
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          Token Swap
        </CardTitle>
        <CardDescription>
          Swap tokens using Uniswap V3 liquidity pools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* From Token Section */}
          <div className="space-y-2">
            <Label>From</Label>
            <div className="flex gap-2">
              <Select value={tokenIn} onValueChange={setTokenIn}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue>
                    {getTokenByAddress(tokenIn).symbol}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TOKENS.map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input 
                type="number" 
                placeholder="0.0" 
                value={amountIn} 
                onChange={(e) => setAmountIn(e.target.value)} 
                className="flex-1"
                disabled={isLoading}
              />
            </div>
          </div>
          
          {/* Swap Direction Button */}
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full" 
              onClick={handleSwapDirection}
              disabled={isLoading}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
          
          {/* To Token Section */}
          <div className="space-y-2">
            <Label>To</Label>
            <div className="flex gap-2">
              <Select value={tokenOut} onValueChange={setTokenOut}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue>
                    {getTokenByAddress(tokenOut).symbol}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TOKENS.map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input 
                type="number" 
                placeholder="0.0" 
                value={minAmountOut} 
                onChange={(e) => setMinAmountOut(e.target.value)}
                disabled={autoMinAmountOut || isLoading}
                className="flex-1"
              />
            </div>
          </div>
          
          {/* Settings Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-slippage">Auto Min Amount (Slippage {slippage}%)</Label>
              <Switch 
                id="auto-slippage" 
                checked={autoMinAmountOut} 
                onCheckedChange={setAutoMinAmountOut} 
                disabled={isLoading}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fee-tier">Fee Tier</Label>
                <Select value={feeTier.toString()} onValueChange={(value) => setFeeTier(parseInt(value))}>
                  <SelectTrigger id="fee-tier">
                    <SelectValue placeholder="Select Fee Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEE_TIERS.map((fee) => (
                      <SelectItem key={fee.value} value={fee.value.toString()}>
                        {fee.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="deadline">Deadline (minutes)</Label>
                <Input 
                  id="deadline" 
                  type="number" 
                  value={deadline} 
                  onChange={(e) => setDeadline(parseInt(e.target.value))} 
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {!autoMinAmountOut && (
              <div>
                <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
                <Input 
                  id="slippage" 
                  type="number" 
                  value={slippage} 
                  onChange={(e) => setSlippage(parseFloat(e.target.value))} 
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
          
          {/* Swap Button */}
          <Button 
            className="w-full" 
            onClick={handleSwapTokens} 
            disabled={isLoading || !amountIn || parseFloat(amountIn) <= 0 || !minAmountOut || parseFloat(minAmountOut) <= 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Swapping...
              </>
            ) : (
              "Swap Tokens"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}