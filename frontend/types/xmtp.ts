export interface XMTPConfig {
  walletKey: string;
  encryptionKey: string;
  env: 'dev' | 'production';
  groqApiKey?: string;
}

export interface UserMode {
  type: 'lite' | 'pro';
  canCustomizeConfig: boolean;
}

export interface QuickCommand {
  id: string;
  label: string;
  command: string;
  icon: React.ReactNode;
  requiresInput?: boolean;
  inputPlaceholder?: string;
}