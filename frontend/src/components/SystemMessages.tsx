'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
} from 'lucide-react';


export function SystemMessages() {
  const [mounted, setMounted] = useState(false);
  const [systemMessages] = useState([
    {
      id: 's1',
      title: 'Transaction Confirmed',
      preview: 'Your payment of 250 USDC has been confirmed on Base.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      category: 'transactions',
      status: 'unread',
      actionable: false,
      txHash: '0x1234...abcd',
      amount: '250',
      token: 'USDC'
    },
    {
      id: 's2',
      title: 'Security Alert',
      preview: 'New device detected accessing your wallet.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      category: 'security',
      status: 'unread',
      actionable: true,
    }
  ]);

  // Use useEffect to handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-4">
      {systemMessages.map((message) => (
        <div
          key={message.id}
          className="relative rounded-lg p-4 transition-colors hover:bg-muted/50 border"
        >
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{message.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {message.preview}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {/* Only render formatted date on client-side to avoid hydration mismatch */}
                  {mounted 
                    ? new Date(message.timestamp).toLocaleString() 
                    : message.timestamp}
                </span>
                {message.actionable && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                      Dismiss
                    </Button>
                    <Button size="sm" className="h-8 px-3 text-xs">
                      View
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}