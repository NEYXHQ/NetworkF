// TODO [M7.4] - Widget params, status decorators
// TODO [M7.2] - Handle onramp webhook integration
// TODO [M7.3] - Manage onramp widget lifecycle

export interface OnrampWidgetConfig {
  apiKey: string;
  walletAddress: string;
  chainId: number;
  defaultAsset: string;
  theme: 'light' | 'dark';
}

export interface OnrampTransaction {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: string;
  asset: string;
  walletAddress: string;
  timestamp: number;
  txHash?: string;
}

export interface OnrampWidgetParams {
  apiKey: string;
  walletAddress: string;
  defaultCryptoCurrency: string;
  defaultCryptoAmount: string;
  defaultFiatCurrency: string;
  defaultFiatAmount: string;
  theme: string;
  redirectURL?: string;
}

class OnrampService {
  constructor() {
    // TODO: Initialize with environment config
  }

  getWidgetParams(walletAddress: string): OnrampWidgetParams {
    // TODO: Get from environment config
    return {
      apiKey: 'mock-api-key',
      walletAddress,
      defaultCryptoCurrency: 'USDC',
      defaultCryptoAmount: '100',
      defaultFiatCurrency: 'USD',
      defaultFiatAmount: '100',
      theme: 'light'
    };
  }

  async getTransactionStatus(transactionId: string): Promise<OnrampTransaction | null> {
    // TODO: Implement actual onramp status checking
    console.log('Getting onramp transaction status:', transactionId);
    
    // Placeholder response
    return {
      id: transactionId,
      status: 'PENDING',
      amount: '100',
      asset: 'USDC',
      walletAddress: '0x0000000000000000000000000000000000000000',
      timestamp: Date.now()
    };
  }

  async handleWebhookEvent(event: any): Promise<boolean> {
    // TODO: Implement webhook event handling
    console.log('Handling onramp webhook event:', event);
    
    // Placeholder response
    return true;
  }

  getSupportedAssets(): string[] {
    // TODO: Get from onramp provider
    return ['USDC', 'POL', 'ETH'];
  }

  getSupportedFiatCurrencies(): string[] {
    // TODO: Get from onramp provider
    return ['USD', 'EUR', 'GBP'];
  }

  validateTransaction(transaction: OnrampTransaction): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!transaction.id) errors.push('Missing transaction ID');
    if (!transaction.amount) errors.push('Missing amount');
    if (!transaction.asset) errors.push('Missing asset');
    if (!transaction.walletAddress) errors.push('Missing wallet address');
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const onrampService = new OnrampService();
export default onrampService;
