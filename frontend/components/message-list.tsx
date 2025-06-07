'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Bell, 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

type MessageCategory = 'all' | 'notifications' | 'security' | 'transactions';
type MessageStatus = 'read' | 'unread';

interface Message {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  category: 'notifications' | 'security' | 'transactions';
  status: MessageStatus;
  actionable: boolean;
}

interface MessageListProps {
  className?: string;
}

const mockMessages: Message[] = [
  {
    id: 'm1',
    title: 'Transaction Approved',
    preview: 'Your payment of ₵250 to ABC Store has been approved and processed.',
    timestamp: '2025-01-15 15:30',
    category: 'transactions',
    status: 'unread',
    actionable: false,
  },
  {
    id: 'm2',
    title: 'Security Alert',
    preview: 'A new device was used to access your account. Please verify if this was you.',
    timestamp: '2025-01-14 09:15',
    category: 'security',
    status: 'unread',
    actionable: true,
  },
  {
    id: 'm3',
    title: 'Yield Farming Update',
    preview: 'Your staked assets generated 2.5 USDC in rewards today.',
    timestamp: '2025-01-13 22:45',
    category: 'notifications',
    status: 'read',
    actionable: false,
  },
  {
    id: 'm4',
    title: 'Approval Request',
    preview: 'Mobile Money agent 0277123456 is requesting approval for a withdrawal of ₵500.',
    timestamp: '2025-01-13 14:20',
    category: 'security',
    status: 'unread',
    actionable: true,
  },
  {
    id: 'm5',
    title: 'Transaction Failed',
    preview: 'Your transfer of ₵75 to Utility Co. has failed due to insufficient funds.',
    timestamp: '2025-01-10 16:10',
    category: 'transactions',
    status: 'read',
    actionable: false,
  },
];

export function MessageList({ className }: MessageListProps) {
  const [filter, setFilter] = useState<MessageCategory>('all');

  const filteredMessages = mockMessages.filter((message) => {
    if (filter === 'all') return true;
    return message.category === filter;
  });

  const getCategoryIcon = (category: 'notifications' | 'security' | 'transactions') => {
    switch (category) {
      case 'notifications':
        return <Bell className="h-4 w-4" />;
      case 'security':
        return <ShieldAlert className="h-4 w-4" />;
      case 'transactions':
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("border-0", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as MessageCategory)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Updates</TabsTrigger>
          </TabsList>
          
          <TabsContent value={filter} className="mt-4 space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No messages found
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "relative rounded-lg p-4 transition-colors hover:bg-muted/50",
                    message.status === 'unread' && "bg-primary/5"
                  )}
                >
                  {message.status === 'unread' && (
                    <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary"></div>
                  )}
                  
                  <div className="flex gap-3">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      message.category === 'transactions' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                      message.category === 'security' && "bg-red-100 text-red-600 dark:bg-red-900/30",
                      message.category === 'notifications' && "bg-green-100 text-green-600 dark:bg-green-900/30"
                    )}>
                      {getCategoryIcon(message.category)}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{message.title}</h3>
                        {message.actionable && (
                          <Badge variant="outline" className="text-[10px]">ACTION REQUIRED</Badge>
                        )}
                      </div>
                      
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {message.preview}
                      </p>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        
                        {message.actionable && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                              Decline
                            </Button>
                            <Button size="sm" className="h-8 px-3 text-xs">
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            <Button variant="ghost" className="w-full">
              View all messages
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}