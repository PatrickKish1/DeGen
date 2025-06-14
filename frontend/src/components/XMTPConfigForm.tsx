'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2,
} from 'lucide-react';
import { useXMTPNode } from '@/lib/xmtp-client-service';
import { generateEncryptionKey } from '@/lib/xmtp-browser-helpers';

interface XMTPConfigFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// const encryptionKey = generateEncryptionKey()

export function XMTPConfigForm({ onSuccess, onCancel }: XMTPConfigFormProps) {
  const [config, setConfig] = useState({
    walletKey: '',
    encryptionKey: '',
    env: 'dev' as 'dev' | 'production',
    networkId: 'base-sepolia'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { initialize } = useXMTPNode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await initialize(config);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Configuration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Wallet Address</label>
        <Input
          type="text"
          placeholder="0x..."
          value={config.walletKey}
          onChange={(e) => setConfig(prev => ({ ...prev, walletKey: e.target.value }))}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Your wallet address (not private key)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Encryption Key</label>
        <Input
          type="text"
          value={config.encryptionKey}
          onChange={(e) => setConfig(prev => ({ ...prev, encryptionKey: e.target.value }))}
          required
          readOnly
        />
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="mt-1"
          onClick={() => setConfig(prev => ({ ...prev, encryptionKey: generateEncryptionKey() }))}
        >
          Generate New Key
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Network</label>
        <select 
          className="w-full p-2 border rounded"
          value={config.networkId}
          onChange={(e) => setConfig(prev => ({ ...prev, networkId: e.target.value }))}
        >
          <option value="base-sepolia">Base Sepolia (Testnet)</option>
          <option value="base-mainnet">Base Mainnet</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">XMTP Environment</label>
        <select 
          className="w-full p-2 border rounded"
          value={config.env}
          onChange={(e) => setConfig(prev => ({ ...prev, env: e.target.value as 'dev' | 'production' }))}
        >
          <option value="dev">Development</option>
          <option value="production">Production</option>
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Initializing...
            </>
          ) : (
            'Initialize XMTP'
          )}
        </Button>
      </div>
    </form>
  );
}