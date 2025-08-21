// TODO [M5.1] - Biconomy token paymaster helpers
// TODO [M5.4] - Gas estimation and validation utilities
// TODO [M5.2] - Paymaster integration functions

export interface PaymasterConfig {
  apiKey: string;
  paymasterId: string;
  chainId: number;
  allowedTokens: string[];
}

// Helper function to create PaymasterConfig from environment variables
export const createPaymasterConfigFromEnv = (): PaymasterConfig => {
  const apiKey = Deno.env.get('BICONOMY_API_KEY');
  const paymasterId = Deno.env.get('BICONOMY_PAYMASTER_ID');
  
  if (!apiKey || !paymasterId) {
    throw new Error('Biconomy configuration missing from environment');
  }
  
  // Auto-detect chain ID based on environment (dev = testnet, prod = mainnet)
  const chainId = Deno.env.get('ENVIRONMENT') === 'production' ? 137 : 80002; // Polygon mainnet vs Amoy testnet
  
  return {
    apiKey,
    paymasterId,
    chainId,
    allowedTokens: ['NEYXT'] // Only NEYXT is allowed as fee token
  };
};

export interface GasEstimate {
  gasInNeyxt: string;
  gasInUsd: string;
  gasLimit: string;
  paymasterAddress: string;
}

export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

export class PaymasterService {
  private config: PaymasterConfig;

  constructor(config: PaymasterConfig) {
    this.config = config;
  }

  async estimateGas(userOperation: UserOperation, tokenAddress: string): Promise<GasEstimate> {
    // TODO: Implement actual Biconomy gas estimation
    console.log('Estimating gas for user operation:', userOperation);
    
    // Placeholder response
    return {
      gasInNeyxt: '0.1',
      gasInUsd: '0.05',
      gasLimit: '300000',
      paymasterAddress: '0x0000000000000000000000000000000000000000'
    };
  }

  async sponsorTransaction(userOperation: UserOperation, gasEstimate: GasEstimate): Promise<string> {
    // TODO: Implement actual paymaster sponsorship
    console.log('Sponsoring transaction with gas estimate:', gasEstimate);
    
    // Placeholder response
    return 'mock-sponsor-hash';
  }

  validateGasCoverage(neyxtAmount: string, gasInNeyxt: string, buffer: number = 1.25): { valid: boolean; message: string } {
    const neyxtNum = parseFloat(neyxtAmount);
    const gasNum = parseFloat(gasInNeyxt);
    const required = gasNum * buffer;
    
    if (neyxtNum < required) {
      return {
        valid: false,
        message: `Insufficient NEYXT. Need at least ${required.toFixed(4)} NEYXT to cover gas fees (${gasNum.toFixed(4)} + ${((buffer - 1) * 100).toFixed(0)}% buffer)`
      };
    }
    
    return {
      valid: true,
      message: 'Gas coverage sufficient'
    };
  }

  getPaymasterStatus(): { available: boolean; message: string } {
    // TODO: Check paymaster availability
    return {
      available: false,
      message: 'Paymaster not configured - using mock service'
    };
  }
}

export const createPaymasterService = (config: PaymasterConfig): PaymasterService => {
  return new PaymasterService(config);
};
