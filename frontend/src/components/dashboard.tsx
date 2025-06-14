'use client';
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Bell, 
  ShieldAlert, 
  IdCard, 
  HeartPulse, 
  Cpu, 
  Check,
  Lock,
  Shield
} from "lucide-react";
import { BalanceCard } from "./balance-card";
import { QuickActions } from "./quick-actions";
import { LiveUpdates } from "./live-updates";
import { TokenSwap } from "./token-swap";
import { toast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

interface DashboardProps {
  onGoToLiteMode: () => void;
}

// Define types for pendingApprovals and protectedData
interface PendingApproval {
  id: string;
  title: string;
  description: string;
  isVisible: boolean;
}

interface ProtectedData {
  id: string;
  title: string;
  description: string;
  isProtected: boolean;
  isProcessing?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ onGoToLiteMode }) => {  // State for pending approvals
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([
    {
      id: "uniswap",
      title: "Uniswap Router",
      description: "Requesting approval to spend your USDC",
      isVisible: true
    },
    {
      id: "aave",
      title: "Aave Lending Pool",
      description: "Requesting approval to spend your ETH",
      isVisible: true
    }
  ]);

  // State for protected data
  const [protectedData, setProtectedData] = useState<ProtectedData[]>([
    {
      id: "passport",
      title: "Passport Data",
      description: "Protected with iExec",
      isProtected: true
    },
    {
      id: "health",
      title: "Health Data",
      description: "Not yet protected",
      isProtected: false
    }
  ]);

  // State for the configure dialog
  const [configureDialogOpen, setConfigureDialogOpen] = useState(false);
  const [configureProcessing, setConfigureProcessing] = useState(false);
  const [configureComplete, setConfigureComplete] = useState(false);

  // Function to handle reject action
  const handleReject = (id: string) => {
    setPendingApprovals(prevApprovals => 
      prevApprovals.map(approval => 
        approval.id === id ? { ...approval, isVisible: false } : approval
      )
    );
    toast({
      title: "Approval Rejected",
      description: `You've rejected the approval request`,
      variant: "destructive",
    });
  };

  // Function to handle approve action
  const handleApprove = (id: string) => {
    setPendingApprovals(prevApprovals => 
      prevApprovals.map(approval => 
        approval.id === id ? { ...approval, isVisible: false } : approval
      )
    );
    toast({
      title: "Approval Successful",
      description: `You've approved the request`,
      variant: "default",
    });
  };

  // Function to handle protect action
  const handleProtect = (id: string) => {
    setProtectedData(prevData => 
      prevData.map(data => 
        data.id === id ? { ...data, isProcessing: true } : data
      )
    );
    
    // Simulate API call with a timeout
    setTimeout(() => {
      setProtectedData(prevData => 
        prevData.map(data => 
          data.id === id ? { 
            ...data, 
            isProtected: true, 
            isProcessing: false, 
            description: "Protected with iExec" 
          } : data
        )
      );
      toast({
        title: "Data Protection Complete",
        description: `Your ${id} data is now protected with iExec`,
        variant: "default",
      });
    }, 1500); // 1.5 seconds delay to simulate process
  };

  // Function to handle configure action
  const handleConfigure = () => {
    setConfigureDialogOpen(true);
  };

  // Function to handle configure confirmation
  const handleConfigureConfirm = () => {
    setConfigureProcessing(true);
    
    // Simulate API call with a timeout
    setTimeout(() => {
      setConfigureProcessing(false);
      setConfigureComplete(true);
      toast({
        title: "Configuration Complete",
        description: "iExec Confidential Computing has been configured successfully",
        variant: "default",
      });
    }, 2000); // 2 seconds delay to simulate process
  };

  // Function to reset and close dialog
  const handleCloseDialog = () => {
    setConfigureDialogOpen(false);
    // Reset after animation
    setTimeout(() => {
      setConfigureComplete(false);
    }, 300);
  };

  // Calculate visible approvals count
  const visibleApprovalsCount = pendingApprovals.filter(approval => approval.isVisible).length;

  return (
    <div className="space-y-6 mt-16">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold"></h2>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={onGoToLiteMode}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          Lite Mode
        </Button>
      </div>
        <BalanceCard />
      
      <QuickActions />
        <div className="space-y-6">
        <LiveUpdates />
        <TokenSwap />
      </div>
      
      <Card className="gradient-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Recent Transactions</h3>
            <Button size="sm" variant="ghost" className="text-primary">
              View All
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <ArrowDownLeft className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Received BTC</p>
                  <p className="text-muted-foreground text-sm">Today, 10:45 AM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">+0.0045 BTC</p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Completed
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <ArrowUpRight className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Sent ETH</p>
                  <p className="text-muted-foreground text-sm">Yesterday, 6:30 PM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">-0.25 ETH</p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Completed
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <ArrowUpRight className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Swap USDC to ETH</p>
                  <p className="text-muted-foreground text-sm">Yesterday, 2:15 PM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">-120 USDC</p>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Pending
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Pending Approvals</h3>
            <div className="relative">
              <Button size="sm" variant="ghost">
                <Bell className="h-4 w-4" />
              </Button>
              {visibleApprovalsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {visibleApprovalsCount}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            {pendingApprovals.map(approval => (
              approval.isVisible && (
                <div key={approval.id} className="p-3 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="text-red-500 h-5 w-5" />
                      <p className="font-medium">{approval.title}</p>
                    </div>
                    <Badge variant="destructive">Action Required</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {approval.description}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-red-200 text-red-600"
                      onClick={() => handleReject(approval.id)}
                    >
                      Reject
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleApprove(approval.id)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              )
            ))}
            
            {visibleApprovalsCount === 0 && (
              <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
                <Check className="h-12 w-12 text-green-500 mb-2" />
                <p>No pending approvals</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="gradient-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">iExec Data Protection</h3>
              <Badge variant="secondary">Powered by iExec</Badge>
            </div>
            <Button size="sm" variant="ghost" className="text-secondary">
              View All
            </Button>
          </div>
          
          <div className="space-y-3">
            {protectedData.map(data => (
              <div key={data.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary/10 p-2 rounded-full">
                    {data.id === "passport" ? (
                      <IdCard className="text-secondary h-5 w-5" />
                    ) : (
                      <HeartPulse className="text-secondary h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{data.title}</p>
                    <p className="text-muted-foreground text-sm">{data.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  {data.isProtected ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Protected
                    </Badge>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      disabled={data.isProcessing}
                      onClick={() => handleProtect(data.id)}
                    >
                      {data.isProcessing ? "Processing..." : "Protect"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <div className="p-3 bg-secondary/10 rounded-md">
              <div className="flex items-center gap-2">
                <Cpu className="text-secondary h-4 w-4" />
                <div className="flex-1">
                  <p className="font-medium text-sm">iExec Confidential Computing</p>
                  <p className="text-xs text-muted-foreground">Process data without exposing it</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-secondary text-secondary"
                  onClick={handleConfigure}
                >
                  Configure
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* iExec Configuration Dialog */}
      <Dialog open={configureDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure iExec Confidential Computing</DialogTitle>              <DialogDescription>
              Set up how your sensitive data is processed with iExec&apos;s secure computation framework.
            </DialogDescription>
          </DialogHeader>
          {configureComplete ? (
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4">
                <Shield className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Configuration Complete</h3>
              <p className="text-center text-muted-foreground mb-4">
                Your iExec Confidential Computing environment has been set up successfully.
              </p>
              <Button onClick={handleCloseDialog}>Close</Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-secondary/10 p-2 rounded-full">
                    <Lock className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Encryption Level</h4>
                    <p className="text-xs text-muted-foreground">Military-grade end-to-end encryption</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-secondary/10 p-2 rounded-full">
                    <Shield className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Access Control</h4>
                    <p className="text-xs text-muted-foreground">Only you control who can access your data</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-secondary/10 p-2 rounded-full">
                    <Cpu className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Compute Environment</h4>
                    <p className="text-xs text-muted-foreground">Trusted execution environment for maximum security</p>
                  </div>
                </div>
              </div>
              <DialogFooter className="sm:justify-start">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={handleConfigureConfirm}
                  disabled={configureProcessing}
                >
                  {configureProcessing ? "Configuring..." : "Configure"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};