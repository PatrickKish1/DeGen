'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import WalletConnection from '@/components/wallet-connection'; // Adjust path as needed
import {
  LayoutGrid,
  ArrowRightLeft,
  MessageSquare,
  ShieldCheck,
  Leaf,
  Vote,
  Sparkles,
  Gamepad2Icon
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresWallet?: boolean;
}

interface ResponsiveNavigationProps {
  logo?: React.ReactNode;
  ThemeToggle: React.ComponentType;
  liquidGlass?: boolean;
}

export function ResponsiveNavigation({ 
  logo, 
  ThemeToggle, 
  liquidGlass = false 
}: ResponsiveNavigationProps) {
  const pathname = usePathname();
  const { isConnected } = useAccount();
 
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutGrid size={20} />,
      requiresWallet: true,
    },
    {
      label: 'Transactions',
      href: '/transactions',
      icon: <ArrowRightLeft size={20} />,
      requiresWallet: true,
    },
    {
      label: 'Messages',
      href: '/messages',
      icon: <MessageSquare size={20} />,
      requiresWallet: true,
    },
    {
      label: 'Verify',
      href: '/verify',
      icon: <ShieldCheck size={20} />,
      requiresWallet: false,
    },
    {
      label: 'Yield',
      href: '/yield',
      icon: <Leaf size={20} />,
      requiresWallet: true,
    },
    {
      label: 'Vote',
      href: '/vote',
      icon: <Vote size={20} />,
      requiresWallet: false,
    },
    {
      label: 'Lite',
      href: '/lite',
      icon: <Sparkles size={20} />,
      requiresWallet: false,
    },
    {
      label: 'Games',
      href: '/game',
      icon: <Gamepad2Icon size={20} />,
      requiresWallet: false,
    },
  ];

  // Filter nav items based on wallet connection
  const visibleNavItems = navItems.filter(item => 
    !item.requiresWallet || isConnected
  );

  // Liquid glass styles
  const liquidGlassStyles = liquidGlass ? {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  } : {};

  const liquidGlassClasses = liquidGlass 
    ? 'bg-white/10 backdrop-blur-[20px] backdrop-saturate-[180%] border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]'
    : 'bg-background/80 backdrop-blur-md border-border/40';

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={cn(
        "hidden md:fixed md:top-0 md:left-0 md:right-0 md:z-50 md:flex md:items-center md:justify-between md:border-b md:px-6 md:py-4",
        liquidGlassClasses
      )}>
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            {logo || <div className="text-xl font-bold">Logo</div>}
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex items-center space-x-8">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : liquidGlass 
                    ? "text-white/80 hover:bg-white/20 hover:text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Desktop Wallet + Theme Toggle */}
        <div className="flex items-center space-x-4">
          <WalletConnection />
          <ThemeToggle />
        </div>
      </nav>

      {/* Mobile Header (Logo + Wallet + Theme Toggle) */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 md:hidden",
        liquidGlassClasses
      )}>
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            {logo || <div className="text-lg font-bold">Logo</div>}
          </Link>
        </div>

        {/* Mobile Wallet + Theme Toggle */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <ThemeToggle />
          </div>
          <WalletConnection 
            className="text-xs px-2 py-1 min-w-0 flex-shrink-0" 
            buttonLabel="Connect"
          />
        </div>
      </div>

      {/* Mobile Navigation - Bottom */}
      <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto w-[95%] max-w-lg md:hidden">
        <nav className={cn(
          "flex items-center justify-between rounded-full p-1 shadow-lg",
          liquidGlassClasses
        )}>
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center rounded-full p-2 text-xs transition-all duration-200",
                "min-w-[50px]", // Increased minimum width
                pathname === item.href
                  ? liquidGlass
                    ? "bg-white/30 text-white shadow-lg scale-105"
                    : "bg-primary text-primary-foreground scale-105"
                  : liquidGlass
                    ? "text-white/70 hover:bg-white/20 hover:text-white hover:scale-105"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105"
              )}
            >
              <div className="transition-transform duration-200">
                {item.icon}
              </div>
              <span className={cn(
                "mt-1 text-[9px] font-medium truncate w-full text-center transition-opacity duration-200",
                "leading-tight" // Better line height for small text
              )}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Wallet Connection Status Indicator (Mobile) */}
      {!isConnected && (
        <div className={cn(
          "fixed bottom-20 left-0 right-0 z-40 mx-auto w-[95%] max-w-lg md:hidden",
          "flex items-center justify-center p-3 rounded-lg",
          liquidGlassClasses
        )}>
          <p className={cn(
            "text-sm text-center",
            liquidGlass ? "text-white/80" : "text-muted-foreground"
          )}>
            Connect your wallet to access all features
          </p>
        </div>
      )}

      {/* Add padding to body to account for fixed navigation */}
      <style jsx global>{`
        body {
          padding-top: 70px; /* Desktop header height */
          padding-bottom: ${isConnected ? '100px' : '140px'}; /* Mobile nav + status indicator */
        }
        
        @media (min-width: 768px) {
          body {
            padding-bottom: 0;
          }
        }

        /* Enhanced liquid glass animation */
        ${liquidGlass ? `
          .backdrop-blur-[20px] {
            backdrop-filter: blur(20px) saturate(180%) brightness(110%);
          }
          
          /* Subtle shimmer effect for liquid glass */
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          .bg-white\\/10::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.1) 50%,
              transparent 100%
            );
            background-size: 200% 100%;
            animation: shimmer 3s ease-in-out infinite;
            pointer-events: none;
          }
        ` : ''}
      `}</style>
    </>
  );
}