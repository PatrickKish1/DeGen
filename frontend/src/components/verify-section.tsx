'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, QrCode, Search, Info, X, Check, Loader2, Camera } from 'lucide-react';
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
import { Input } from '@/components/ui/input';

interface VerifiedEntity {
  id: string;
  name: string;
  type: 'merchant' | 'agent' | 'service';
  identifier: string;
  verifiedSince: string;
  isVerified: boolean;
  isVerifying?: boolean;
}

interface VerifySectionProps {
  className?: string;
}

// Sample QR codes for demo purposes - create a folder in public/qr-demo with some QR code images
const sampleQrCodes: string[] = [
  '/qr-demo/qr1.png',
  '/qr-demo/qr2.png',
  '/qr-demo/qr3.png',
  // Fallback data URLs in case the images don't exist
  'data:image/png;base64,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',
  'data:image/png;base64,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'
];

const mockVerifiedEntities: VerifiedEntity[] = [
  {
    id: 've1',
    name: 'AccraMall MoMo Agent',
    type: 'agent',
    identifier: '0277123456',
    verifiedSince: '2024-12-10',
    isVerified: true,
  },
  {
    id: 've2',
    name: 'GlobalPay Services',
    type: 'service',
    identifier: 'GP829135',
    verifiedSince: '2024-11-25',
    isVerified: true,
  },
  {
    id: 've3',
    name: 'ElectroTech Store',
    type: 'merchant',
    identifier: 'MER456789',
    verifiedSince: '2024-10-15',
    isVerified: true,
  },
  {
    id: 've4',
    name: 'QuickCash Agent',
    type: 'agent',
    identifier: '0244789123',
    verifiedSince: '',
    isVerified: false,
  },
];

export function VerifySection({ className }: VerifySectionProps) {
  const [entities, setEntities] = useState<VerifiedEntity[]>(mockVerifiedEntities);
  const [scanQrOpen, setScanQrOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [currentQrCode, setCurrentQrCode] = useState<string | null>(null);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanResult, setScanResult] = useState<VerifiedEntity | null>(null);
  
  // Search functionality
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VerifiedEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Function to handle verify now action
  const handleVerify = (id: string) => {
    setEntities(prev => prev.map(entity => 
      entity.id === id ? { 
        ...entity, 
        isVerifying: true 
      } : entity
    ));
    
    // Simulate verification process
    setTimeout(() => {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      setEntities(prev => prev.map(entity => 
        entity.id === id ? { 
          ...entity, 
          isVerified: true, 
          isVerifying: false,
          verifiedSince: dateStr
        } : entity
      ));
      
      toast({
        title: "Verification Successful",
        description: "Entity has been verified successfully",
        variant: "default",
      });
    }, 1500);
  };

  // Function to handle QR scan
  const handleScanQR = () => {
    setScanQrOpen(true);
    setScanning(true);
    setScanComplete(false);
    setScanResult(null);
    setCurrentQrCode(null);
    
    // Simulate camera scanning
    setTimeout(() => {
      // Randomly select a QR code from the samples
      const randomQrCode = sampleQrCodes[Math.floor(Math.random() * sampleQrCodes.length)];
      setCurrentQrCode(randomQrCode);
      
      // Simulate processing
      setTimeout(() => {
        setScanning(false);
        setScanComplete(true);
        
        // Random entity as scan result
        const randomEntity = entities[Math.floor(Math.random() * entities.length)];
        setScanResult({...randomEntity, isVerified: true});
        
        toast({
          title: "QR Code Scanned",
          description: `Found information for ${randomEntity.name}`,
          variant: "default",
        });
      }, 2000);
    }, 1000);
  };

  // Function to handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    // Simulate search API call with timeout
    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const results = entities.filter(entity => 
        entity.name.toLowerCase().includes(query) || 
        entity.identifier.toLowerCase().includes(query) ||
        entity.type.toLowerCase().includes(query)
      );
      
      setSearchResults(results);
      setIsSearching(false);
      
      toast({
        title: `${results.length} results found`,
        description: results.length > 0 ? `Found entities matching "${searchQuery}"` : `No entities found for "${searchQuery}"`,
        variant: results.length > 0 ? "default" : "destructive",
      });
    }, 800);
  };

  return (
    <Card className={cn("border-0", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-500" />
          Verification Center
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button className="flex-1 gap-2" onClick={handleScanQR}>
            <QrCode className="h-4 w-4" />
            <span>Scan QR</span>
          </Button>          <Button 
            variant="outline" 
            className="flex-1 gap-2"
            onClick={() => {
              setSearchOpen(true);
              setSearchQuery('');
              setSearchResults([]);
            }}
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </Button>
        </div>
        
        <div className="mt-6">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">Recently Verified</h3>
          <div className="space-y-3">
            {entities.map((entity) => (
              <div
                key={entity.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    entity.isVerified ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30"
                  )}>
                    {entity.isVerified ? <ShieldCheck className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entity.name}</span>
                      <Badge variant="outline" className="text-[10px]">{entity.type.toUpperCase()}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">ID: {entity.identifier}</div>
                  </div>
                </div>
                
                <div>
                  {entity.isVerified ? (
                    <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>
                  ) : entity.isVerifying ? (
                    <Button size="sm" className="h-8 text-xs" disabled>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Verifying...
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      className="h-8 text-xs"
                      onClick={() => handleVerify(entity.id)}
                    >
                      Verify Now
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      
        {/* Search Dialog */}
        <Dialog open={searchOpen} onOpenChange={(open) => !open && setSearchOpen(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Search Verified Entities</DialogTitle>
              <DialogDescription>
                Search by name, ID, or entity type
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 flex gap-2">
              <Input 
                placeholder="Enter search term..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            <div className="mt-6">
              {searchResults.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  <h4 className="text-sm font-medium mb-2">Results ({searchResults.length})</h4>
                  
                  {searchResults.map((entity) => (
                    <div
                      key={entity.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full",
                          entity.isVerified ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30"
                        )}>
                          {entity.isVerified ? <ShieldCheck className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{entity.name}</span>
                            <Badge variant="outline" className="text-[10px]">{entity.type.toUpperCase()}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">ID: {entity.identifier}</div>
                        </div>
                      </div>
                      
                      <div>
                        {entity.isVerified ? (
                          <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>
                        ) : entity.isVerifying ? (
                          <Button size="sm" className="h-8 text-xs" disabled>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Verifying...
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="h-8 text-xs"
                            onClick={() => {
                              handleVerify(entity.id);
                              setSearchOpen(false);
                            }}
                          >
                            Verify Now
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery && !isSearching ? (
                <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
                  <Search className="h-10 w-10 mb-2" />
                  <p>No entities found matching &quot;{searchQuery}&quot;</p>
                </div>
              ) : null}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setSearchOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* QR Code Scan Dialog */}
        <Dialog open={scanQrOpen} onOpenChange={(open) => !open && setScanQrOpen(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>
                Position the QR code in the center of the camera view
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center justify-center py-6">
              {scanning && !currentQrCode && (
                <div className="flex flex-col items-center">
                  <div className="w-64 h-64 border-4 border-dashed border-gray-300 flex items-center justify-center rounded-lg mb-4">
                    <Camera className="h-12 w-12 text-gray-400 animate-pulse" />
                  </div>
                  <p className="text-muted-foreground">Scanning...</p>
                </div>
              )}
              
              {currentQrCode && (
                <div className="flex flex-col items-center">
                  <div className="w-64 h-64 border-4 border-blue-500 p-2 rounded-lg">
                    {currentQrCode.startsWith('data:') ? (
                      // For data URLs, use regular img tag since Next.js Image doesn't support them directly
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={currentQrCode} 
                        alt="QR Code" 
                        className="w-full h-full object-contain" 
                      />
                    ) : (
                      // For normal image paths, use Next.js Image component
                      <Image 
                        src={currentQrCode}
                        alt="QR Code"
                        width={256}
                        height={256}
                        className="object-contain"
                      />
                    )}
                  </div>
                  
                  {scanning && <p className="mt-2 text-muted-foreground">Processing QR code...</p>}
                </div>
              )}
              
              {scanComplete && scanResult && (
                <div className="mt-4 w-full">
                  <div className="border rounded-lg p-4 mt-4 bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <h3 className="font-medium">Verification Result</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Name:</span>
                        <span className="font-medium">{scanResult.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">ID:</span>
                        <span>{scanResult.identifier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Type:</span>
                        <Badge variant="outline">{scanResult.type.toUpperCase()}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge className="bg-green-500">Verified</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setScanQrOpen(false)}
              >
                Close
              </Button>
              {scanComplete ? (
                <Button onClick={() => {
                  setScanQrOpen(false);
                  setScanning(false);
                }}>
                  Done
                </Button>
              ) : (
                <Button disabled={!scanComplete && scanning}>
                  {scanning ? "Scanning..." : "Scan Again"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}