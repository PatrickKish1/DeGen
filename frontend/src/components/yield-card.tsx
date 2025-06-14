'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { entryService } from '@/lib/entry-service';
import { useAccount, useConnect } from 'wagmi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrowserProvider } from 'ethers';

interface YieldOption {
  id: string;
  name: string;
  description: string;
  apy: number;
  risk: 'low' | 'medium' | 'high';
  lockPeriod: string;
  provider: string;
  userParticipating: boolean;
  balance?: string; // User's position balance
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
    balance: '0.540',
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

export function YieldCard({ className }: YieldCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYield, setSelectedYield] = useState<YieldOption | null>(null);
  const [amount, setAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
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
      // Open withdraw dialog for existing positions
      setSelectedYield(option);
      setIsWithdrawDialogOpen(true);
    } else {
      // Open dialog to start earning
      setSelectedYield(option);
    }
  };const handleStartEarning = async () => {
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
      if (!provider || typeof provider !== 'object' || !('request' in provider)) {
        throw new Error('No valid provider available');
      }
      
      console.log('Provider obtained:', provider);
      const ethersProvider = new BrowserProvider(provider as any);
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
    }  };

  const handleWithdraw = async () => {
    if (!selectedYield || !withdrawalAmount || !address || parseFloat(withdrawalAmount) <= 0) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting withdrawal for:', selectedYield.name);
      
      // Get provider from connector
      const provider = await connector?.getProvider();
      if (!provider || typeof provider !== 'object' || !('request' in provider)) {
        throw new Error('No valid provider available');
      }
      
      console.log('Provider obtained:', provider);
      const ethersProvider = new BrowserProvider(provider as any);
      await entryService.init(ethersProvider);
      console.log('Entry service initialized');
      
      // Calculate a safe minAmountOut (e.g., 95% of input to account for slippage)
      const minAmountOut = (parseFloat(withdrawalAmount) * 0.95).toString();
      console.log('Calculated minAmountOut for withdrawal:', minAmountOut);
      
      // Call exitAaveMarket with the current user's address as the recipient
      console.log('Calling exitAaveMarket...');
      const tx = await entryService.exitAaveMarket(withdrawalAmount, address, minAmountOut);
      console.log('Withdrawal transaction result:', tx);
      
      toast({
        title: "Withdrawal Successful!",
        description: `You've successfully withdrawn ${withdrawalAmount} from ${selectedYield.name}`,
      });
      
      // Close dialog and reset states
      setIsWithdrawDialogOpen(false);
      setSelectedYield(null);
      setWithdrawalAmount('');
    } catch (error: any) {
      console.error('Error in handleWithdraw:', error);
      toast({
        title: "Withdrawal Failed",
        description: error.message || "There was an error processing your withdrawal",
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
                      <span className="font-medium">{option.balance} ETH</span>
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
                    {option.userParticipating ? "Withdraw" : "Start Earning"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        {/* Deposit Dialog */}
      <Dialog open={!!selectedYield && !isWithdrawDialogOpen} onOpenChange={(open) => !open && setSelectedYield(null)}>
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
            <Button onClick={handleStartEarning} disabled={Boolean(!amount || isLoading || (amount && parseFloat(amount) <= 0))}>
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
      
      {/* Withdrawal Dialog */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsWithdrawDialogOpen(false);
          setSelectedYield(null);
          setWithdrawalAmount('');
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Withdraw from {selectedYield?.name}</DialogTitle>
            <DialogDescription>
              Enter the amount you want to withdraw from your position.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="withdrawalAmount" className="col-span-4">
                Amount to Withdraw
              </Label>
              <div className="col-span-4 relative">
                <Input
                  id="withdrawalAmount"
                  type="number"
                  placeholder="0.00"
                  className="pr-12"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  disabled={isLoading}
                  max={selectedYield?.balance}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ETH
                </div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Current Position:</span> 
                <span>{selectedYield?.balance} ETH</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Provider:</span> 
                <span>{selectedYield?.provider}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                setIsWithdrawDialogOpen(false);
                setSelectedYield(null);
              }} 
              variant="outline" 
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button              onClick={handleWithdraw}
              disabled={Boolean(!withdrawalAmount || isLoading || 
                (withdrawalAmount && parseFloat(withdrawalAmount) <= 0) || 
                (selectedYield?.balance && withdrawalAmount && parseFloat(withdrawalAmount) > parseFloat(selectedYield.balance)))}
              variant="destructive"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Processing...
                </>
              ) : (
                "Withdraw"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}