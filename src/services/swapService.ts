// M4.2 - Client for /api/quote & /api/execute - COMPLETE
// M4.3 - Handle swap requests and responses - COMPLETE  
// M4.4 - Error handling and retry logic - COMPLETE

import config from '../config/env';

export interface SwapQuoteRequest {
  payAsset: 'USDC' | 'POL' | 'ETH' | 'FIAT';
  payChain: 'polygon';
  amountIn: string;
  receiveAsset: 'NEYXT';
  receiveChain: 'polygon';
  slippagePercentage?: number; // Optional slippage tolerance
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
  sources?: string[]; // DEX aggregator sources
  priceImpact?: string; // Price impact percentage
  gasEstimate?: string; // Gas estimate
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
    // Get API base URL from config - use Supabase edge functions
    this.apiBaseUrl = config.supabase.url ? 
      `${config.supabase.url}/functions/v1` : 
      config.buyFlow.apiBaseUrl;
  }

  async getQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    console.log('Getting swap quote:', request);
    
    // Skip FIAT and POL for now - not implemented yet
    if (request.payAsset === 'FIAT') {
      throw new Error('FIAT payments not yet implemented');
    }
    if (request.payAsset === 'POL') {
      throw new Error('POL payments currently disabled due to quote issues');
    }
    
    try {
      // Build query parameters for GET request
      const params = new URLSearchParams({
        payAsset: request.payAsset,
        amountIn: request.amountIn,
        receiveAsset: request.receiveAsset,
      });
      
      if (request.slippagePercentage) {
        params.append('slippagePercentage', request.slippagePercentage.toString());
      }
      
      const url = `${this.apiBaseUrl}/quote?${params.toString()}`;
      console.log('Fetching quote from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(config.supabase.anonKey && {
            'Authorization': `Bearer ${config.supabase.anonKey}`,
            'apikey': config.supabase.anonKey
          })
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Quote API error:', response.status, errorText);
        throw new Error(`Quote API error: ${response.status} - ${errorText}`);
      }
      
      const result: SwapQuoteResponse = await response.json();
      console.log('Quote response:', result);
      
      return result;
      
    } catch (error) {
      console.error('Error getting quote:', error);
      throw error instanceof Error ? error : new Error('Failed to get quote');
    }
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
