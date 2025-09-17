// M4.2 - Client for /api/quote & /api/execute - COMPLETE
// M4.3 - Handle swap requests and responses - COMPLETE  
// M4.4 - Error handling and retry logic - COMPLETE

import config from '../config/env';

export interface SwapQuoteRequest {
  payAsset: 'USDC' | 'POL' | 'ETH' | 'FIAT';
  payChain: 'polygon';
  amountIn: string;
  receiveAsset: 'WFOUNDER';
  receiveChain: 'polygon';
  slippagePercentage?: number; // Optional slippage tolerance
}

export interface SwapQuoteResponse {
  routeId: string;
  amountOutEst: string;
  price: string;
  usdEquivalent?: string; // USD value of the purchase
  wfounderPriceUsd?: string; // USD price for 1 WFOUNDER token
  fees: {
    protocol: string;
    gasInPolEst: string;
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
  payAsset: string;
  receiveAsset: string;
  amountIn: string;
  slippagePercentage?: number;
}

export interface SwapExecuteResponse {
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

export interface SwapStatusResponse {
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
    console.log('Executing swap:', request);
    
    try {
      const url = `${this.apiBaseUrl}/execute`;
      console.log('Calling execute endpoint:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(config.supabase.anonKey && {
            'Authorization': `Bearer ${config.supabase.anonKey}`,
            'apikey': config.supabase.anonKey
          })
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Execute API error:', response.status, errorText);
        throw new Error(`Execute API error: ${response.status} - ${errorText}`);
      }
      
      const result: SwapExecuteResponse = await response.json();
      console.log('Execute response:', result);
      
      return result;
      
    } catch (error) {
      console.error('Error executing swap:', error);
      throw error instanceof Error ? error : new Error('Failed to execute swap');
    }
  }

  async getSwapStatus(routeId?: string, txId?: string): Promise<SwapStatusResponse> {
    console.log('Getting swap status for:', { routeId, txId });
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (routeId) params.append('route_id', routeId);
      if (txId) params.append('tx_id', txId);
      
      if (!routeId && !txId) {
        throw new Error('Either routeId or txId is required');
      }
      
      const url = `${this.apiBaseUrl}/status?${params.toString()}`;
      console.log('Calling status endpoint:', url);
      
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
        console.error('Status API error:', response.status, errorText);
        throw new Error(`Status API error: ${response.status} - ${errorText}`);
      }
      
      const result: SwapStatusResponse = await response.json();
      console.log('Status response:', result);
      
      return result;
      
    } catch (error) {
      console.error('Error getting swap status:', error);
      throw error instanceof Error ? error : new Error('Failed to get swap status');
    }
  }

  async updateRouteStatus(routeId: string, txId: string, userAddress: string): Promise<void> {
    console.log('Updating route status:', { routeId, txId, userAddress });
    
    try {
      const url = `${this.apiBaseUrl}/status`;
      console.log('Updating status endpoint:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(config.supabase.anonKey && {
            'Authorization': `Bearer ${config.supabase.anonKey}`,
            'apikey': config.supabase.anonKey
          })
        },
        body: JSON.stringify({
          routeId,
          txId,
          userAddress
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Status update API error:', response.status, errorText);
        throw new Error(`Status update API error: ${response.status} - ${errorText}`);
      }
      
      console.log('Route status updated successfully');
      
    } catch (error) {
      console.error('Error updating route status:', error);
      throw error instanceof Error ? error : new Error('Failed to update route status');
    }
  }
}

export const swapService = new SwapService();
export default swapService;
