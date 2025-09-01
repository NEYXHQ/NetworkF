// TODO [M4.3] - Quote/Route/Status types (zod)
// TODO [M4.4] - Validation schemas for API requests/responses
// TODO [M5.2] - Execute request/response types
// TODO [M7.2] - Onramp webhook event types

export interface QuoteRequest {
  payAsset: 'USDC' | 'POL' | 'ETH' | 'FIAT';
  payChain: 'polygon';
  amountIn: string;
  receiveAsset: 'NEYXT';
  receiveChain: 'polygon';
}

export interface QuoteResponse {
  routeId: string;
  amountOutEst: string;
  price: string;
  usdEquivalent?: string; // USD value of the purchase
  neyxtPriceUsd?: string; // USD price for 1 NEYXT token
  fees: {
    protocol: string;
    gasInPolEst: string;
  };
  slippageBps: number;
  estimatedTimeSec: number;
  ttlSec: number;
  warnings: string[];
  sources?: string[]; // Add sources field
  priceImpact?: string; // Add price impact field
  gasEstimate?: string; // Add gas estimate field
}

export interface ExecuteRequest {
  routeId: string;
  userAddress: string;
  payAsset: string;
  receiveAsset: string;
  amountIn: string;
  slippagePercentage?: number;
}

export interface ExecuteResponse {
  txData: {
    to: string;
    data: string;
    value: string;
    gasLimit: string;
    gasPrice: string;
  };
  statusUrl: string;
  estimatedGas: string;
  route: {
    source: string;
    routeId: string;
  };
}

export interface StatusResponse {
  state: 'PENDING' | 'CONFIRMED' | 'FAILED';
  txId?: string;
  blockNumber?: number;
  confirmations?: number;
  details: string;
  route?: {
    source: string;
    routeId: string;
  };
}

export interface OnrampWebhookEvent {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: string;
  asset: string;
  walletAddress: string;
  timestamp: number;
  txHash?: string;
  signature?: string; // HMAC signature for verification
}

export interface BuyFlowState {
  step: 'SELECT_ASSET' | 'GET_QUOTE' | 'CONFIRM_PURCHASE';
  selectedAsset?: 'USDC' | 'POL' | 'ETH' | 'FIAT';
  amount?: string;
  quote?: QuoteResponse;
  executing: boolean;
  error?: string;
}

export interface GasEstimate {
  gasInPol: string;
  gasInUsd: string;
  gasLimit: string;
}

export interface PricingValidation {
  valid: boolean;
  slippageOk: boolean;
  priceImpactOk: boolean;
  gasCoverageOk: boolean;
  warnings: string[];
  errors: string[];
}

// Validation schemas (placeholder for zod integration)
export const validateQuoteRequest = (data: any): data is QuoteRequest => {
  return (
    typeof data === 'object' &&
    typeof data.payAsset === 'string' &&
    typeof data.payChain === 'string' &&
    typeof data.amountIn === 'string' &&
    typeof data.receiveAsset === 'string' &&
    typeof data.receiveChain === 'string'
  );
};

export const validateExecuteRequest = (data: any): data is ExecuteRequest => {
  return (
    typeof data === 'object' &&
    typeof data.routeId === 'string' &&
    typeof data.userAddress === 'string' &&
    typeof data.payAsset === 'string' &&
    typeof data.receiveAsset === 'string' &&
    typeof data.amountIn === 'string'
  );
};

export const validateOnrampWebhookEvent = (data: any): data is OnrampWebhookEvent => {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.status === 'string' &&
    typeof data.amount === 'string' &&
    typeof data.asset === 'string' &&
    typeof data.walletAddress === 'string' &&
    typeof data.timestamp === 'number'
  );
};
