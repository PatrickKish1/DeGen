import { YieldCard } from '@/components/yield-card';
import { Card, CardContent } from '@/components/ui/card';
import { Leaf, ShieldAlert, Landmark } from 'lucide-react';

export default function YieldPage() {
  return (
    <div className="container mx-auto max-w-lg p-4 pb-20">
      <div className="mb-6 flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold">Yield Farming</h1>
      </div>
      
      {/* Introduction Card */}
      <Card className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <div className="mt-1 rounded-full bg-green-100 p-2 dark:bg-green-900/30">
              <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium">What is Yield Farming?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Yield farming is a way to earn passive income on your crypto assets by lending or 
                staking them. Choose a protocol below to start earning interest on your tokens.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center rounded-md border p-2">
                  <ShieldAlert className="mr-2 h-4 w-4 text-amber-500" />
                  <span className="text-xs">Always consider risks</span>
                </div>
                <div className="flex items-center rounded-md border p-2">
                  <Landmark className="mr-2 h-4 w-4 text-blue-500" />
                  <span className="text-xs">Powered by Aave & others</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <YieldCard />
    </div>
  );
}