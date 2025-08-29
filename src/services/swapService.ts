// TODO [M4.2] - Client for /api/quote & /api/execute
// TODO [M4.3] - Handle swap requests and responses
// TODO [M4.4] - Error handling and retry logic

export interface SwapQuoteRequest {
  payAsset: 'USDC' | 'POL' | 'ETH' | 'FIAT';
  payChain: 'polygon';
  amountIn: string;
  receiveAsset: 'NEYXT';
  receiveChain: 'polygon';
}

export interface SwapQuoteResponse {
  routeId: string;
  amountOutEst: string;
  price: string;
  usdEquivalent?: string; // USD value of the purchase
  neyxtPriceUsd?: string; // USD price for 1 NEYXT token
  fees: {
    protocol: string;
    gasInNeyxtEst: string;
  };
  slippageBps: number;
  estimatedTimeSec: number;
  ttlSec: number;
  warnings: string[];
  sources?: string[]; // Add sources field
  priceImpact?: string; // Add price impact field
  gasEstimate?: string; // Add gas estimate field
}

export interface SwapExecuteRequest {
  routeId: string;
  userAddress: string;
  sponsorGas: boolean;
}

export interface SwapExecuteResponse {
  txIds: string[];
  statusUrl: string;
}

class SwapService {
  private apiBaseUrl: string;

  constructor() {
    // Get API base URL from config
    this.apiBaseUrl = import.meta.env.VITE_BUY_FLOW_API_BASE_URL || '/api';
  }

  async getQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    // TODO: Implement actual API call to ${this.apiBaseUrl}/quote
    console.log('Getting swap quote:', request);
    
    // Placeholder response
    return {
      routeId: 'mock-route-id',
      amountOutEst: '0',
      price: '0',
      fees: {
        protocol: '0',
        gasInNeyxtEst: '0'
      },
      slippageBps: 100,
      estimatedTimeSec: 0,
      ttlSec: 45,
      warnings: ['Mock quote - not for production use']
    };
  }

  async executeSwap(request: SwapExecuteRequest): Promise<SwapExecuteResponse> {
    // TODO: Implement actual API call to ${this.apiBaseUrl}/execute
    console.log('Executing swap:', request);
    
    // Placeholder response
    return {
      txIds: ['mock-tx-id'],
      statusUrl: `${this.apiBaseUrl}/status?route_id=mock-route-id`
    };
  }

  async getSwapStatus(routeId: string): Promise<{ state: string; txIds: string[]; details: string }> {
    // TODO: Implement actual API call to ${this.apiBaseUrl}/status
    console.log('Getting swap status for route:', routeId);
    
    // Placeholder response
    return {
      state: 'PENDING',
      txIds: ['mock-tx-id'],
      details: 'Mock status - not for production use'
    };
  }
}

export const swapService = new SwapService();
export default swapService;
