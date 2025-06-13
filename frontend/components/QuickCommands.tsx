'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Send,
  Wallet,
  Zap,
} from 'lucide-react';


interface QuickCommandsProps {
  onCommandSelect: (command: string) => void;
  disabled?: boolean;
}

export function QuickCommands({ onCommandSelect, disabled }: QuickCommandsProps) {
  const commands = [
    {
      id: 'balance',
      label: 'Check Balance',
      command: '/balance',
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      id: 'send',
      label: 'Send USDC',
      command: '/tx ',
      icon: <Send className="h-4 w-4" />,
      requiresInput: true,
      inputPlaceholder: 'Enter amount (e.g., 0.1)'
    },
    {
      id: 'status',
      label: 'Status',
      command: '/status',
      icon: <Zap className="h-4 w-4" />,
    },
    {
      id: 'help',
      label: 'Help',
      command: '/help',
      icon: <MessageSquare className="h-4 w-4" />,
    }
  ];

  const [showAmountInput, setShowAmountInput] = useState(false);
  const [amount, setAmount] = useState('');

  const handleCommandClick = (cmd: any) => {
    if (cmd.requiresInput) {
      setShowAmountInput(true);
      return;
    }
    onCommandSelect(cmd.command);
  };

  const handleSendWithAmount = () => {
    if (amount) {
      onCommandSelect(`/tx ${amount}`);
      setAmount('');
      setShowAmountInput(false);
    }
  };

  if (showAmountInput) {
    return (
      <div className="flex gap-2 p-2 bg-muted rounded-lg">
        <Input
          type="number"
          placeholder="Enter amount (e.g., 0.1)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.000001"
          min="0"
          className="flex-1"
        />
        <Button onClick={handleSendWithAmount} disabled={!amount || disabled} size="sm">
          Send
        </Button>
        <Button 
          onClick={() => setShowAmountInput(false)} 
          variant="outline" 
          size="sm"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-2 bg-muted rounded-lg">
      {commands.map((cmd) => (
        <Button
          key={cmd.id}
          variant="outline"
          size="sm"
          onClick={() => handleCommandClick(cmd)}
          disabled={disabled}
          className="flex items-center gap-2 h-8"
        >
          {cmd.icon}
          <span className="text-xs">{cmd.label}</span>
        </Button>
      ))}
    </div>
  );
}
