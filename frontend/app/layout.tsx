import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { Providers } from './providers';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ResponsiveNavigation } from '@/components/mobile-navigation';
import '@coinbase/onchainkit/styles.css';
import './globals.css';
import "@/lib/styles/onchainkit-styles.css"
import { cn } from '@/lib/utils';

const outfit = Outfit({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DeGen',
  description: 'A secure decentralized finance mobile application with data protection',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={cn(
          outfit.className,
          'antialiased overflow-x-clip',
          'min-h-screen flex flex-col'
        )}
        suppressHydrationWarning
      >
        <Providers>
          <ResponsiveNavigation
              logo={<span className="text-2xl font-bold">DeGen</span>}
            ThemeToggle={ThemeToggle}
            liquidGlass={true}
          />
          <main className="flex-1 relative z-10 pb-0">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}