import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ResponsiveNavigation } from '@/components/mobile-navigation';
import '@coinbase/onchainkit/styles.css';
import './globals.css';
import "@/lib/styles/onchainkit-styles.css"

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        <Providers>
          <div className="relative min-h-screen pb-16">
            {children}
            <ResponsiveNavigation
              logo={<span className="text-2xl font-bold">DeGen</span>}
              ThemeToggle={ThemeToggle}
              liquidGlass={true}
            />
          </div>
        </Providers>
      </body>
    </html>
  );
}