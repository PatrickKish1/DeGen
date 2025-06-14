'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Vote, 
  Timer, 
  Trophy, 
  Flame, 
  Users, 
  Calendar, 
  ThumbsUp, 
  Filter, 
  Check, 
  Loader2, 
  ExternalLink,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface VotingEvent {
  id: string;
  title: string;
  category: 'sports' | 'entertainment' | 'politics' | 'crypto';
  endTime: string;
  options: {
    id: string;
    name: string;
    odds: number;
    votes: number;
    userVoted: boolean;
  }[];
  totalVotes: number;
  isHot: boolean;
  isPredicted: boolean;
}

interface VotingCardProps {
  className?: string;
}

const initialVotingEvents: VotingEvent[] = [
  {
    id: 'v1',
    title: 'Ghana Premier League: Hearts of Oak vs Asante Kotoko',
    category: 'sports',
    endTime: '2025-01-20 15:00',
    options: [
      { id: 'o1', name: 'Hearts of Oak Win', odds: 2.4, votes: 1250, userVoted: true },
      { id: 'o2', name: 'Draw', odds: 3.1, votes: 850, userVoted: false },
      { id: 'o3', name: 'Asante Kotoko Win', odds: 2.7, votes: 1100, userVoted: false },
    ],
    totalVotes: 3200,
    isHot: true,
    isPredicted: false,
  },
  {
    id: 'v2',
    title: 'Bitcoin Price on Feb 1st, 2025',
    category: 'crypto',
    endTime: '2025-02-01 00:00',
    options: [
      { id: 'o4', name: 'Under $75,000', odds: 2.1, votes: 2100, userVoted: false },
      { id: 'o5', name: '$75,000 - $85,000', odds: 2.5, votes: 1800, userVoted: false },
      { id: 'o6', name: 'Over $85,000', odds: 3.0, votes: 2300, userVoted: false },
    ],
    totalVotes: 6200,
    isHot: true,
    isPredicted: false,
  },
  {
    id: 'v3',
    title: 'Ghana Music Awards Best Artist',
    category: 'entertainment',
    endTime: '2025-03-15 20:00',
    options: [
      { id: 'o7', name: 'Artist A', odds: 1.8, votes: 3500, userVoted: false },
      { id: 'o8', name: 'Artist B', odds: 2.2, votes: 2900, userVoted: false },
      { id: 'o9', name: 'Artist C', odds: 4.0, votes: 1200, userVoted: false },
    ],
    totalVotes: 7600,
    isHot: false,
    isPredicted: false,
  },
  {
    id: 'v4',
    title: '2025 Ghana Elections Outcome',
    category: 'politics',
    endTime: '2025-12-07 20:00',
    options: [
      { id: 'o10', name: 'Party A', odds: 1.9, votes: 4500, userVoted: false },
      { id: 'o11', name: 'Party B', odds: 1.9, votes: 4300, userVoted: false },
      { id: 'o12', name: 'Other', odds: 10.0, votes: 200, userVoted: false },
    ],
    totalVotes: 9000,
    isHot: true,
    isPredicted: false,
  },
];

export function VotingCard({ className }: VotingCardProps) {
  // State management
  const [votingEvents, setVotingEvents] = useState<VotingEvent[]>(initialVotingEvents);
  const [activeTab, setActiveTab] = useState<string>('active');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    eventId: string;
    optionId: string;
    optionName: string;
    odds: number;
  }>({
    isOpen: false,
    eventId: '',
    optionId: '',
    optionName: '',
    odds: 0
  });
  const [voteAmount, setVoteAmount] = useState<number>(10);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDialogOpen, setFilterDialogOpen] = useState<boolean>(false);
  
  // State for event details dialog
  const [detailsDialog, setDetailsDialog] = useState<{
    isOpen: boolean;
    event: VotingEvent | null;
  }>({
    isOpen: false,
    event: null
  });

  // State for reward popup
  const [rewardCalculatorOpen, setRewardCalculatorOpen] = useState<boolean>(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<number>(10);

  // Filter events based on active tab and category
  const filteredEvents = useMemo(() => {
    let filtered = [...votingEvents];
    
    if (activeTab === 'hot') {
      filtered = filtered.filter(event => event.isHot);
    } else if (activeTab === 'my') {
      filtered = filtered.filter(event => 
        event.options.some(option => option.userVoted)
      );
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(event => event.category === filterCategory);
    }
    
    return filtered;
  }, [votingEvents, activeTab, filterCategory]);

  const getCategoryColor = (category: 'sports' | 'entertainment' | 'politics' | 'crypto') => {
    switch (category) {
      case 'sports':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30';
      case 'entertainment':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30';
      case 'politics':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30';
      case 'crypto':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30';
    }
  };

  // Handle vote initiation - opens confirmation dialog
  const handleVoteClick = (eventId: string, optionId: string, optionName: string, odds: number) => {
    setConfirmDialog({
      isOpen: true,
      eventId,
      optionId,
      optionName,
      odds
    });
  };

  // Handle vote confirmation
  const handleVoteConfirm = () => {
    setIsVoting(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const { eventId, optionId } = confirmDialog;
      
      setVotingEvents(prev => 
        prev.map(event => {
          if (event.id === eventId) {
            // Calculate new votes 
            const updatedOptions = event.options.map(option => {
              if (option.id === optionId) {
                return {
                  ...option,
                  votes: option.votes + voteAmount,
                  userVoted: true
                };
              }
              return {
                ...option,
                userVoted: false // Reset any previous votes
              };
            });
            
            // Update total votes
            const newTotalVotes = event.totalVotes + voteAmount;
            
            return {
              ...event,
              options: updatedOptions,
              totalVotes: newTotalVotes
            };
          }
          return event;
        })
      );
      
      // Reset state
      setIsVoting(false);
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      setVoteAmount(10);
      
      // Show toast notification
      toast({
        title: "Vote Successful",
        description: `You voted for "${confirmDialog.optionName}" with ${voteAmount} USDC`,
        variant: "default",
      });
    }, 1500);
  };

  // Calculate potential reward based on odds and vote amount
  const calculateReward = (odds: number, amount: number): number => {
    return parseFloat((odds * amount).toFixed(2));
  };

  // Get user's votes (for the "my" tab)
  const userVotedEvents = useMemo(() => {
    return votingEvents.filter(event => 
      event.options.some(option => option.userVoted)
    );
  }, [votingEvents]);
  // Function to handle view details
  const handleViewDetails = (event: VotingEvent) => {
    setDetailsDialog({
      isOpen: true,
      event
    });
    
    toast({
      title: "Event Details",
      description: `Viewing details for "${event.title}"`,
      variant: "default",
    });
  };
  // Function to handle potential reward calculation
  const handleShowRewardCalculator = (eventId: string) => {
    // Find the event and get the odds
    const event = votingEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const votedOption = event.options.find(o => o.userVoted);
    if (!votedOption) return;
    
    setSelectedEventId(eventId);
    setCustomAmount(voteAmount); // Initialize with the same amount as the vote
    setRewardCalculatorOpen(true);
    
    toast({
      title: "Reward Calculator",
      description: `Calculating potential rewards for ${votedOption.name}`,
      variant: "default",
    });
  };

  return (
    <Card className={cn("border-0", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Vote className="h-5 w-5 text-purple-500" />
          Conditional Voting
        </CardTitle>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setFilterDialogOpen(true)}
          className="h-8 w-8"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="hot">Hot 🔥</TabsTrigger>
            <TabsTrigger value="my">My Votes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-4 space-y-6">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <div key={event.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">{event.title}</h3>
                        {event.isHot && (
                          <Badge variant="outline" className="flex items-center gap-1 bg-red-100 text-[10px] text-red-600 dark:bg-red-900/30">
                            <Flame className="h-3 w-3" /> HOT
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            getCategoryColor(event.category)
                          )}
                        >
                          {event.category}
                        </Badge>
                        
                        <div className="flex items-center gap-1">
                          <Timer className="h-3.5 w-3.5" />
                          <span>
                            Ends: {new Date(event.endTime).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{event.totalVotes.toLocaleString()} votes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    {event.options.map((option) => (
                      <div key={option.id} className={cn(
                        "rounded-lg p-3",
                        option.userVoted ? "bg-primary/10" : "bg-muted/50"
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={option.userVoted ? "font-medium" : ""}>
                              {option.name}
                            </span>
                            {option.userVoted && (
                              <Badge variant="outline" className="text-[10px]">YOUR VOTE</Badge>
                            )}
                          </div>
                          <div className="text-sm font-medium">
                            {option.odds}x
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{Math.round((option.votes / event.totalVotes) * 100)}%</span>
                            <span>{option.votes.toLocaleString()} votes</span>
                          </div>
                          <Progress 
                            value={event.totalVotes > 0 ? (option.votes / event.totalVotes) * 100 : 0} 
                            className={cn(
                              "h-1.5",
                              option.userVoted && "bg-primary/20"
                            )}
                          />
                        </div>
                        
                        {!option.userVoted && !event.options.some(o => o.userVoted) && (
                          <Button 
                            className="mt-2 w-full" 
                            size="sm"
                            variant="outline"
                            onClick={() => handleVoteClick(event.id, option.id, option.name, option.odds)}
                          >
                            Vote
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleViewDetails(event)}
                    >
                      View Details
                    </Button>
                    
                    {event.options.some(o => o.userVoted) && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 text-xs"
                        onClick={() => handleShowRewardCalculator(event.id)}
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        Potential Reward: {
                          calculateReward(
                            event.options.find(o => o.userVoted)?.odds || 0,
                            voteAmount
                          )
                        } USDC
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
                {filterCategory !== 'all' ? (
                  <>
                    <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                    <p>No events found with the selected filter</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2" 
                      onClick={() => setFilterCategory('all')}
                    >
                      Clear Filter
                    </Button>
                  </>
                ) : (
                  <>
                    <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                    <p>No active events available</p>
                  </>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="hot">
            {filteredEvents.length > 0 ? (
              <div className="mt-4 space-y-6">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{event.title}</h3>
                          <Badge variant="outline" className="flex items-center gap-1 bg-red-100 text-[10px] text-red-600 dark:bg-red-900/30">
                            <Flame className="h-3 w-3" /> HOT
                          </Badge>
                        </div>
                        
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className={cn(getCategoryColor(event.category))}>
                            {event.category}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{event.totalVotes.toLocaleString()} votes</span>
                          </div>
                        </div>
                      </div>
                        <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8"
                        onClick={() => handleViewDetails(event)}
                      >
                        View Event
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
                <Flame className="h-10 w-10 text-muted-foreground mb-2" />
                <p>No hot events available right now</p>
                {filterCategory !== 'all' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2" 
                    onClick={() => setFilterCategory('all')}
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my">
            {userVotedEvents.length > 0 && filteredEvents.length > 0 ? (
              <div className="mt-4 space-y-6">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{event.title}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className={cn(getCategoryColor(event.category))}>
                            {event.category}
                          </Badge>
                          
                          <div className="flex items-center gap-1">
                            <Timer className="h-3.5 w-3.5" />
                            <span>
                              Ends: {new Date(event.endTime).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 rounded-lg bg-primary/10 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                          <span className="font-medium">
                            {event.options.find(o => o.userVoted)?.name}
                          </span>
                          <Badge variant="outline" className="text-[10px]">YOUR VOTE</Badge>
                        </div>
                        <div className="text-sm font-medium">
                          {event.options.find(o => o.userVoted)?.odds}x
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <Progress 
                          value={
                            event.totalVotes > 0 
                              ? ((event.options.find(o => o.userVoted)?.votes || 0) / event.totalVotes) * 100 
                              : 0
                          } 
                          className="h-1.5 bg-primary/20"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-between">                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs" 
                        onClick={() => handleViewDetails(event)}
                      >
                        View Details
                      </Button>
                        <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 text-xs"
                        onClick={() => handleShowRewardCalculator(event.id)}
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        Potential Reward: {
                          calculateReward(
                            event.options.find(o => o.userVoted)?.odds || 0,
                            10
                          )
                        } USDC
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
                <Vote className="h-10 w-10 text-muted-foreground mb-2" />
                <p>You haven&apos;t voted on any events yet</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={() => setActiveTab('active')}
                >
                  Explore Events
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Vote Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Vote</DialogTitle>
            <DialogDescription>
              You are voting for &quot;{confirmDialog.optionName}&quot; with a potential {confirmDialog.odds}x return.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Vote Amount (USDC)</span>
                <span className="text-sm text-muted-foreground">
                  Potential Return: {calculateReward(confirmDialog.odds, voteAmount)} USDC
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {[5, 10, 25, 50, 100].map((amount) => (
                  <Button 
                    key={amount} 
                    type="button" 
                    variant={voteAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVoteAmount(amount)}
                    className={cn(
                      "flex-1",
                      voteAmount === amount && "text-primary-foreground"
                    )}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Important Information</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-1">
                  <Check className="h-3 w-3" /> Once placed, votes cannot be changed
                </li>
                <li className="flex items-center gap-1">
                  <Check className="h-3 w-3" /> Rewards are paid in USDC if your prediction is correct
                </li>
                <li className="flex items-center gap-1">
                  <Check className="h-3 w-3" /> Results are determined by verified oracle data
                </li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
              disabled={isVoting}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleVoteConfirm}
              disabled={isVoting}
            >
              {isVoting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Vote"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Filter Events</DialogTitle>
            <DialogDescription>
              Filter events by category
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-2 py-4">
            <Button 
              variant={filterCategory === 'all' ? "default" : "outline"}
              className="justify-start"
              onClick={() => setFilterCategory('all')}
            >
              All Categories
            </Button>
            <Button 
              variant={filterCategory === 'sports' ? "default" : "outline"}
              className="justify-start"
              onClick={() => setFilterCategory('sports')}
            >
              Sports
            </Button>
            <Button 
              variant={filterCategory === 'crypto' ? "default" : "outline"}
              className="justify-start"
              onClick={() => setFilterCategory('crypto')}
            >
              Crypto
            </Button>
            <Button 
              variant={filterCategory === 'entertainment' ? "default" : "outline"}
              className="justify-start"
              onClick={() => setFilterCategory('entertainment')}
            >
              Entertainment
            </Button>
            <Button 
              variant={filterCategory === 'politics' ? "default" : "outline"}
              className="justify-start"
              onClick={() => setFilterCategory('politics')}
            >
              Politics
            </Button>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setFilterDialogOpen(false)}>
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>      {/* Event Details Dialog */}
      <Dialog open={detailsDialog.isOpen} onOpenChange={(open) => setDetailsDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailsDialog.event?.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              Category:{" "}
              <Badge variant="outline" className={cn(getCategoryColor(detailsDialog.event?.category || 'sports'))}>
                {detailsDialog.event?.category}
              </Badge>
              
              {detailsDialog.event?.isHot && (
                <Badge variant="outline" className="flex items-center gap-1 bg-red-100 text-[10px] text-red-600 dark:bg-red-900/30">
                  <Flame className="h-3 w-3" /> HOT
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap justify-between gap-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Created: {new Date(new Date(detailsDialog.event?.endTime || '').getTime() - 1000*60*60*24*7).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Timer className="h-3.5 w-3.5" />
                  <span>
                    Ends: {new Date(detailsDialog.event?.endTime || '').toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{detailsDialog.event?.totalVotes.toLocaleString()} votes</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 text-xs flex items-center gap-1"
                  onClick={() => {
                    if (detailsDialog.event) {
                      handleShowRewardCalculator(detailsDialog.event.id);
                      setDetailsDialog(prev => ({ ...prev, isOpen: false }));
                    }
                  }}
                >
                  <Trophy className="h-3.5 w-3.5" />
                  Calculate Rewards
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    window.open('https://oracle.degenplatform.io/events/' + detailsDialog.event?.id, '_blank');
                    toast({
                      title: "External Link",
                      description: "Opening event verification data in Oracle Explorer",
                      variant: "default",
                    });
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Oracle Data
                </Button>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Voting Options</h3>
              <div className="space-y-3">
                {detailsDialog.event?.options.map((option) => (
                  <div key={option.id} className={cn(
                    "rounded-lg border p-3",
                    option.userVoted ? "bg-primary/10" : ""
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={option.userVoted ? "font-medium" : ""}>
                          {option.name}
                        </span>
                        {option.userVoted && (
                          <Badge variant="outline" className="text-[10px]">YOUR VOTE</Badge>
                        )}
                      </div>
                      <div className="text-sm font-medium">
                        {option.odds}x
                      </div>
                    </div>
                    
                    <div className="mt-2">                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{detailsDialog.event ? Math.round((option.votes / detailsDialog.event.totalVotes) * 100) : 0}%</span>
                      <span>{option.votes.toLocaleString()} votes</span>
                    </div>
                    <Progress 
                      value={detailsDialog.event && detailsDialog.event.totalVotes > 0 ? (option.votes / detailsDialog.event.totalVotes) * 100 : 0} 
                      className={cn(
                        "h-1.5",
                        option.userVoted && "bg-primary/20"
                      )}
                    />
                    </div>
                    
                    {!option.userVoted && detailsDialog.event && !detailsDialog.event.options.some(o => o.userVoted) && (
                      <Button 
                        className="mt-2 w-full" 
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleVoteClick(detailsDialog.event!.id, option.id, option.name, option.odds);
                          setDetailsDialog(prev => ({ ...prev, isOpen: false }));
                        }}
                      >
                        Vote
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">About This Event</h3>
              <p className="text-sm text-muted-foreground">
                This conditional voting event is verified using our secure oracle network.
                Results will be determined based on verified data sources at the time of event conclusion.
                {detailsDialog.event?.category === 'sports' && " Match results are sourced from official league statistics."}
                {detailsDialog.event?.category === 'crypto' && " Cryptocurrency prices are aggregated from major exchanges."}
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setDetailsDialog(prev => ({ ...prev, isOpen: false }))}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reward Calculator Popup */}
      <Dialog open={rewardCalculatorOpen} onOpenChange={setRewardCalculatorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Potential Reward Calculator</DialogTitle>
            <DialogDescription>
              Calculate potential rewards for your vote
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {selectedEventId && (
              <div className="rounded-lg bg-muted/50 p-3">
                <h4 className="text-sm font-medium mb-1">Your Vote</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">{votingEvents.find(e => e.id === selectedEventId)?.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {votingEvents.find(e => e.id === selectedEventId)?.options.find(o => o.userVoted)?.name}
                    </p>
                  </div>
                  <Badge variant="outline">{votingEvents.find(e => e.id === selectedEventId)?.options.find(o => o.userVoted)?.odds}x</Badge>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Select Amount (USDC)</span>
                <span className="text-sm font-medium text-green-600">
                  Reward: {calculateReward(
                    votingEvents.find(e => e.id === selectedEventId)?.options.find(o => o.userVoted)?.odds || 2.4, 
                    customAmount
                  )} USDC
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {[5, 10, 25, 50, 100].map((amount) => (
                  <Button 
                    key={amount} 
                    type="button" 
                    variant={customAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCustomAmount(amount)}
                    className={cn(
                      "flex-1",
                      customAmount === amount && "text-primary-foreground"
                    )}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
              
              <div className="mt-1 text-xs text-muted-foreground flex items-center justify-between">
                <span>Investment</span>
                <span>{customAmount} USDC</span>
              </div>
              
              <div className="text-xs flex items-center justify-between">
                <span>Potential profit</span>
                <span className="font-medium text-green-600">
                  +{(calculateReward(
                    votingEvents.find(e => e.id === selectedEventId)?.options.find(o => o.userVoted)?.odds || 2.4, 
                    customAmount
                  ) - customAmount).toFixed(2)} USDC
                </span>
              </div>
              
              <div className="mt-2 bg-green-50 dark:bg-green-900/20 rounded-md p-2 text-xs space-y-1">
                <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
                  <Info className="h-3 w-3" />
                  <span className="font-medium">ROI Calculation</span>
                </div>
                <p className="text-muted-foreground">
                  {Math.round((calculateReward(
                    votingEvents.find(e => e.id === selectedEventId)?.options.find(o => o.userVoted)?.odds || 2.4, 
                    customAmount
                  ) / customAmount - 1) * 100)}% return on investment if your prediction is correct
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Important Information</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-1">
                  <Check className="h-3 w-3" /> Rewards are calculated based on the odds and your selected amount
                </li>
                <li className="flex items-center gap-1">
                  <Check className="h-3 w-3" /> Higher odds mean higher potential rewards
                </li>
                <li className="flex items-center gap-1">
                  <Check className="h-3 w-3" /> Rewards are paid in USDC if your prediction is correct
                </li>
                <li className="flex items-center gap-1">
                  <Check className="h-3 w-3" /> Oracle verification ensures fair and transparent results
                </li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setRewardCalculatorOpen(false)}>
              Close
            </Button>
            {selectedEventId && (
              <Button 
                variant="default"
                onClick={() => {
                  // Show a toast notification for simulating reward claim or strategy saving
                  toast({
                    title: "Strategy Saved",
                    description: "Your reward calculation strategy has been saved",
                    variant: "default",
                  });
                  setRewardCalculatorOpen(false);
                }}
              >
                Save Strategy
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}