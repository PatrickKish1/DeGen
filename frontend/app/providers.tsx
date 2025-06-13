'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { OnchainKitProvider } from "@coinbase/onchainkit"
// import { base } from "wagmi/chains"
import { useCustomTheme, ThemeProviderCustom } from "@/lib/theme-context"
import { http, createConfig, WagmiProvider } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'

const BASE_API_KEY = process.env.COINBASE_TOKEN
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || 'YOUR_PROJECT_ID'

export const config = createConfig({
  chains: [baseSepolia,],
  transports: {
    [baseSepolia.id]: http(),
    // [sepolia.id]: http(),
  },
})

// This component can safely use the custom theme hook since it's inside ThemeProviderCustom
function OnchainKitProviderInner({ children }: { children: React.ReactNode }) {
  const { customTheme } = useCustomTheme()

  return (
    <OnchainKitProvider
      apiKey={BASE_API_KEY}
      projectId={PROJECT_ID}
      chain={baseSepolia}
      config={{
        appearance: {
          name: "DEGEN",
          logo: "https://pbs.twimg.com/profile_images/1902457858232287232/lLiKq_s__400x400.jpg",
          mode: customTheme === "dark" ? "dark" : "light",
          theme: "base",
        },
        wallet: {
          display: "modal",
          termsUrl: "https://cryptotraderpro.com/terms",
          privacyUrl: "https://cryptotraderpro.com/privacy",
        },
      }}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster position="top-center" richColors />
      </ThemeProvider>
    </OnchainKitProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <ThemeProviderCustom>
        <OnchainKitProviderInner>
          {children}
        </OnchainKitProviderInner>
      </ThemeProviderCustom>
    </WagmiProvider>
  );
}