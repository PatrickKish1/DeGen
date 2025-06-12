"use client"

import type React from "react"

import { useState } from "react"
import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from "@coinbase/onchainkit/wallet"
import { Avatar, Address } from "@coinbase/onchainkit/identity"
import { useAccount } from "wagmi"
import { useCustomTheme } from "@/lib/theme-context"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

export interface WalletConnectionProps {
  className?: string;
  buttonLabel?: string;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({ className, buttonLabel = "Connect Wallet" }) => {
  const { address, isConnected } = useAccount()
  const {  } = useCustomTheme()
  const [, setCopied] = useState(false)

  // Format address for display
  const formatAddress = (addr: string | undefined) => {
    if (!addr) return ""
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  // Copy address to clipboard
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      toast("Address copied",{
        description: "Address copied to clipboard",
        duration: 2000,
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Open block explorer
  const openExplorer = () => {
    if (address) {
      window.open(`https://basescan.org/address/${address}`, "_blank")
    }
  }

  // Custom styled connect button
  const CustomConnectButton = () => (
    <Button variant="default" className={`${className} flex items-center gap-2`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </svg>
      {buttonLabel}
    </Button>
  )

  return (
    <div className={className}>
      <Wallet>
        <ConnectWallet className="flex items-center gap-2 bg-blue-800 dark:bg-blue-800 hover:bg-blue-900">
          {isConnected ? (
            <div className="flex items-center gap-2 text-white">
              <div className="h-6 w-6 overflow-hidden rounded-full">
                {/* <Identity address={address} schemaId={address} className="items-center"> */}
                  <Avatar address={address} className="h-full w-full bg-white dark:bg-blue-800" />
                {/* </Identity> */}
              </div>
              <span className="hidden sm:inline">{formatAddress(address)}</span>
            </div>
          ) : (
            <CustomConnectButton />
          )}
        </ConnectWallet>

        {isConnected && (
          <WalletDropdown>
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 overflow-hidden rounded-full">
                  <Avatar address={address} className="h-full w-full" />
                </div>
                <div>
                  <Address address={address} className="text-sm font-medium" />
                  <div className="text-xs text-muted-foreground">Base Network</div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={copyAddress}>
                  <Copy className="mr-1 h-3 w-3" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={openExplorer}>
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Explorer
                </Button>
              </div>
            </div>
            <WalletDropdownDisconnect className="p-3 text-sm text-destructive hover:bg-accent" />
          </WalletDropdown>
        )}
      </Wallet>
    </div>
  )
}

export default WalletConnection
