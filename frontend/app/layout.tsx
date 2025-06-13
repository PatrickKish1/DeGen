import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { Providers } from './providers';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ResponsiveNavigation } from '@/components/mobile-navigation';
import '@coinbase/onchainkit/styles.css';
import './globals.css';
import "@/lib/styles/onchainkit-styles.css"
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';

const outfit = Outfit({ subsets: ['latin'] });

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
      <body className={outfit.className}>
        <Providers>
          <div className="relative min-h-screen overflow-x-clip pb-0">
            <ResponsiveNavigation
              logo={<span className="text-2xl font-bold">DeGen</span>}
              ThemeToggle={ThemeToggle}
              liquidGlass={true}
            />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}