'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Send, 
  BarChart3, 
  Settings, 
  HelpCircle,
  Zap,
  TrendingUp,
  Shield,
  Network
} from 'lucide-react';
import type { QuickCommand } from '@/types/chat';

interface QuickCommandsProps {
  onCommandSelect: (command: string) => void;
}

export function QuickCommands({ onCommandSelect }: QuickCommandsProps) {
  const quickCommands: QuickCommand[] = [
    {
      id: 'balance',
      label: 'Check Balance',
      command: '/balance',
      description: 'Check USDC and ETH balance',
      category: 'wallet',
      icon: 'wallet'
    },
    {
      id: 'gas',
      label: 'Gas Prices',
      command: '/gas',
      description: 'Current gas prices and network status',
      category: 'info',
      icon: 'zap'
    },
    {
      id: 'yields',
      label: 'Yield Farming',
      command: '/yields',
      description: 'Show available yield opportunities',
      category: 'defi',
      icon: 'trending-up'
    },
    {
      id: 'protocols',
      label: 'DeFi Protocols',
      command: '/protocols',
      description: 'List available DeFi protocols',
      category: 'defi',
      icon: 'bar-chart'
    },
    {
      id: 'status',
      label: 'Network Status',
      command: '/status',
      description: 'Check Base Sepolia network health',
      category: 'info',
      icon: 'network'
    },
    {
      id: 'help',
      label: 'Help',
      command: '/help',
      description: 'Show all available commands',
      category: 'info',
      icon: 'help'
    }
  ];

  const getCommandIcon = (iconName: string) => {
    switch (iconName) {
      case 'wallet':
        return <Wallet className="h-3 w-3" />;
      case 'send':
        return <Send className="h-3 w-3" />;
      case 'bar-chart':
        return <BarChart3 className="h-3 w-3" />;
      case 'settings':
        return <Settings className="h-3 w-3" />;
      case 'help':
        return <HelpCircle className="h-3 w-3" />;
      case 'zap':
        return <Zap className="h-3 w-3" />;
      case 'trending-up':
        return <TrendingUp className="h-3 w-3" />;
      case 'shield':
        return <Shield className="h-3 w-3" />;
      case 'network':
        return <Network className="h-3 w-3" />;
      default:
        return <HelpCircle className="h-3 w-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'wallet':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'defi':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'trading':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'info':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">Quick Commands</h4>
        <Badge variant="outline" className="text-xs">
          {quickCommands.length} available
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {quickCommands.map((cmd) => (
          <Button
            key={cmd.id}
            onClick={() => onCommandSelect(cmd.command)}
            variant="outline"
            size="sm"
            className="h-auto flex flex-col items-start p-3 text-left"
          >
            <div className="flex items-center gap-2 w-full mb-1">
              <div className={`p-1 rounded ${getCategoryColor(cmd.category)}`}>
                {getCommandIcon(cmd.icon || 'help')}
              </div>
              <span className="font-medium text-xs">{cmd.label}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {cmd.description}
            </span>
            <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1">
              {cmd.command}
            </code>
          </Button>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        <p className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          <strong>Pro tip:</strong> You can also type commands directly or ask questions naturally
        </p>
      </div>
    </div>
  );
}