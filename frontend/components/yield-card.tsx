'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Leaf, 
  TrendingUp, 
  Timer, 
  Gem, 
  Landmark,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { entryService } from '@/lib/entry-service';
import { useAccount, useConnect } from 'wagmi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ethers } from 'ethers';

interface YieldOption {
  id: string;
  name: string;
  description: string;
  apy: number;
  risk: 'low' | 'medium' | 'high';
  lockPeriod: string;
  provider: string;
  userParticipating: boolean;
  contractFunction?: 'enterAaveMarket' | 'liquidityMining';
}

interface YieldCardProps {
  className?: string;
}

const mockYieldOptions: YieldOption[] = [
  {
    id: 'y1',
    name: 'Stablecoin Savings',
    description: 'Earn yield on USDC by providing liquidity to lending protocols',
    apy: 4.2,
    risk: 'low',
    lockPeriod: '0 days',
    provider: 'Aave',
    userParticipating: true,
    contractFunction: 'enterAaveMarket'
  },
  {
    id: 'y2',
    name: 'ETH Staking Pool',
    description: 'Stake ETH and earn rewards from network validation',
    apy: 5.8,
    risk: 'low',
    lockPeriod: '30 days',
    provider: 'Lido',
    userParticipating: false
  },
  {
    id: 'y3',
    name: 'Liquidity Mining',
    description: 'Provide liquidity to token pairs and earn trading fees plus rewards',
    apy: 12.5,
    risk: 'medium',
    lockPeriod: '7 days',
    provider: 'Uniswap',
    userParticipating: false,
    contractFunction: 'liquidityMining'
  },
  {
    id: 'y4',
    name: 'Yield Optimizer',
    description: 'Automatically compounds yields across multiple protocols',
    apy: 18.9,
    risk: 'high',
    lockPeriod: '14 days',
    provider: 'Yearn',
    userParticipating: false
  },
];

export function YieldCard({ className }: YieldCardProps) {  const [isLoading, setIsLoading] = useState(false);
  const [selectedYield, setSelectedYield] = useState<YieldOption | null>(null);
  const [amount, setAmount] = useState('');
  const { toast } = useToast();  
  const { address, connector } = useAccount();
  const { connect, connectors } = useConnect();
  
  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30';
      case 'medium':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30';
      case 'high':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30';
    }
  };
  
  const handleYieldAction = async (option: YieldOption) => {
    if (option.userParticipating) {
      // Handle manage position
      toast({
        title: "Managing Position",
        description: `You're managing your position in ${option.name}`,
      });
    } else {
      // Open dialog to start earning
      setSelectedYield(option);
    }
  };  const handleStartEarning = async () => {
    if (!selectedYield || !amount || !address) {
      if (!address) {
        // Connect to the first available connector
        const connector = connectors[0];
        if (connector) {
          connect({ connector });
        }
        return;
      }
      return;
    }
    
    setIsLoading(true);    try {
      console.log('Starting yield action for:', selectedYield.name);
      
      // Get provider from connector
      const provider = await connector?.getProvider();
      if (!provider) {
        throw new Error('No provider available');
      }
      
      console.log('Provider obtained:', provider);
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      await entryService.init(ethersProvider);
      console.log('Entry service initialized');
      
      // Check if the user is registered
      try {
        // First, check if the user is registered by calling getUserInfo
        const userInfo = await entryService.getUserInfo(address);
        console.log('User is registered, user info:', userInfo);
      } catch (error) {
        console.log('User not registered, registering user...');
        // If not registered, register the user
        const registration = await entryService.registerUser();
        console.log('User registration transaction:', registration);
      }
      
      // Calculate a safe minAmountOut (e.g., 95% of input to account for slippage)
      const minAmountOut = (parseFloat(amount) * 0.95).toString();
      console.log('Calculated minAmountOut:', minAmountOut);
      
      if (selectedYield.contractFunction === 'enterAaveMarket') {
        console.log('Calling enterAaveMarket for Stablecoin Savings...');
        const tx = await entryService.enterAaveMarket(amount, minAmountOut);
        console.log('Transaction result:', tx);
        
        toast({
          title: "Success!",
          description: `You've successfully deposited ${amount} into ${selectedYield.name}`,
        });
        
        // Close dialog and reset states
        setSelectedYield(null);
        setAmount('');
      } else if (selectedYield.contractFunction === 'liquidityMining') {
        // Call the same enterAaveMarket function for liquidity mining as per requirement
        console.log('Calling enterAaveMarket for Liquidity Mining...');
        const tx = await entryService.enterAaveMarket(amount, minAmountOut);
        console.log('Transaction result:', tx);
        
        toast({
          title: "Liquidity Mining Started!",
          description: `You've successfully started liquidity mining with ${amount}`,
        });
        
        // Close dialog and reset states
        setSelectedYield(null);
        setAmount('');
      } else {
        toast({
          title: "Coming Soon",
          description: `This yield option is not yet implemented`,
        });
      }
    } catch (error: any) {
      console.error('Error in handleStartEarning:', error);
      toast({
        title: "Transaction Failed",
        description: error.message || "There was an error processing your transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className={cn("border-0", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-500" />
            Yield Farming
          </CardTitle>
          <CardDescription>
            Earn passive income from your crypto assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockYieldOptions.map((option) => (
              <div
                key={option.id}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  option.userParticipating && "border-primary/50 bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{option.name}</h3>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px]", 
                          getRiskColor(option.risk)
                        )}
                      >
                        {option.risk.toUpperCase()} RISK
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-500">
                      {option.apy}% <span className="text-xs font-normal">APY</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Timer className="h-3.5 w-3.5" />
                    <span>Lock: {option.lockPeriod}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Landmark className="h-3.5 w-3.5" />
                    <span>Provider: {option.provider}</span>
                  </div>
                </div>
                
                {option.userParticipating && (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>Your position</span>
                      <span className="font-medium">$540 USDC</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                )}
                
                <div className="mt-4">
                  <Button 
                    className="w-full"
                    variant={option.userParticipating ? "outline" : "default"}
                    onClick={() => handleYieldAction(option)}
                  >
                    {option.userParticipating ? "Manage Position" : "Start Earning"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Deposit Dialog */}
      <Dialog open={!!selectedYield} onOpenChange={(open) => !open && setSelectedYield(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deposit into {selectedYield?.name}</DialogTitle>
            <DialogDescription>
              Enter the amount you want to deposit. Current APY: {selectedYield?.apy}%
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="col-span-4">
                Amount
              </Label>
              <div className="col-span-4 relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  className="pr-12"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ETH
                </div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Risk Level:</span> 
                <span className={cn(
                  selectedYield?.risk === 'low' ? 'text-green-500' : 
                  selectedYield?.risk === 'medium' ? 'text-yellow-500' : 
                  'text-red-500'
                )}>
                  {selectedYield?.risk.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Lock Period:</span> 
                <span>{selectedYield?.lockPeriod}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Provider:</span> 
                <span>{selectedYield?.provider}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSelectedYield(null)} variant="outline" disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleStartEarning} disabled={!amount || isLoading || parseFloat(amount) <= 0}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Processing...
                </>
              ) : (
                "Deposit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}