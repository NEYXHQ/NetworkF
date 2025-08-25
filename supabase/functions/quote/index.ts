// M4.1 - GET /api/quote with QuickSwap API (Polygon-only)
// M4.2 - Return gas_in_neyxt_est and warnings for min purchase
// M4.3 - Enforce min purchase (NEYXT_out ≥ 1.25× gas_in_neyxt_est)
// M4.4 - Apply per-trade cap (≤ max_trade_notional_base)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

// QuickSwap API configuration
const QUICKSWAP_API_URL = 'https://api.quickswap.exchange';
const QUICKSWAP_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap06';

// Contract addresses for Polygon
const POLYGON_CONTRACTS = {
  weth: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
  usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
  neyxt: '0x6dcefF586744F3F1E637FE5eE45e0ff3880bb761', // NEYXT on Polygon
  pol: '0x0000000000000000000000000000000000001010', // Native POL token
  quickswapFactory: '0x5757371414417b8C6CAad45bAeF941aBc173d036', // QuickSwap v2 Factory
  quickswapRouter: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // QuickSwap v2 Router
  refPool: '0x6B8A57addD24CAF494393D9E0bf38BC54F713833', // WETH/NEYXT pool
};

interface QuoteRequest {
  payAsset: string;      // Asset to pay (USDC, POL, WETH)
  amountIn: string;       // Amount to pay
  receiveAsset: string;   // Asset to receive (always NEYXT)
  userAddress?: string;   // Optional: user address for gas estimation
  slippagePercentage?: number; // Optional: slippage tolerance (default 1%)
}

interface QuoteResponse {
  routeId: string;
  amountOutEst: string;
  price: string;
  fees: {
    protocol: string;
    gasInNeyxtEst: string;
  };
  slippageBps: number;
  estimatedTimeSec: number;
  ttlSec: number;
  warnings: string[];
  sources: string[];
  priceImpact: string;
  gasEstimate: string;
}

// Helper function to get token address from asset name
function getTokenAddress(asset: string): string {
  switch (asset.toUpperCase()) {
    case 'WETH':
    case 'ETH':
      return POLYGON_CONTRACTS.weth;
    case 'USDC':
      return POLYGON_CONTRACTS.usdc;
    case 'POL':
      return POLYGON_CONTRACTS.pol;
    case 'NEYXT':
      return POLYGON_CONTRACTS.neyxt;
    default:
      throw new Error(`Unsupported asset: ${asset}`);
  }
}

// Helper function to convert amount to smallest units
function convertToSmallestUnits(amount: string, asset: string): string {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  
  switch (asset.toUpperCase()) {
    case 'USDC':
      return Math.floor(numAmount * 1e6).toString(); // USDC has 6 decimals
    case 'WETH':
    case 'ETH':
      return Math.floor(numAmount * 1e18).toString(); // WETH has 18 decimals
    case 'POL':
      return Math.floor(numAmount * 1e18).toString(); // POL has 18 decimals
    case 'NEYXT':
      return Math.floor(numAmount * 1e18).toString(); // NEYXT has 18 decimals
    default:
      throw new Error(`Unsupported asset: ${asset}`);
  }
}

// Helper function to estimate gas cost in NEYXT
async function estimateGasInNeyxt(gasEstimate: string, gasPrice: string): Promise<string> {
  try {
    // Convert gas estimate and gas price to numbers
    const gas = parseInt(gasEstimate);
    const price = parseFloat(gasPrice);
    
    if (isNaN(gas) || isNaN(price)) {
      return '0';
    }

    // Calculate gas cost in ETH (wei)
    const gasCostWei = gas * price;
    
    // Convert to ETH
    const gasCostEth = gasCostWei / 1e18;
    
    // For now, use a rough estimate of NEYXT per ETH
    // In production, you'd want to get this from your pool data
    const neyxtPerEth = 370000; // Rough estimate from pool data
    
    const gasCostNeyxt = gasCostEth * neyxtPerEth;
    
    return gasCostNeyxt.toFixed(6);
  } catch (error) {
    console.error('Error estimating gas in NEYXT:', error);
    return '0';
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Quote endpoint
  if (req.method === 'GET') {
    try {
      // Parse query parameters
      const url = new URL(req.url);
      const payAsset = url.searchParams.get('payAsset');
      const amountIn = url.searchParams.get('amountIn');
      const receiveAsset = url.searchParams.get('receiveAsset');
      const userAddress = url.searchParams.get('userAddress');
      const slippagePercentage = url.searchParams.get('slippagePercentage');

      // Validate required parameters
      if (!payAsset || !amountIn || !receiveAsset) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required parameters',
            message: 'payAsset, amountIn, and receiveAsset are required' 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Validate assets
      if (receiveAsset.toUpperCase() !== 'NEYXT') {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid receive asset',
            message: 'Only NEYXT can be received' 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      if (!['USDC', 'POL', 'ETH', 'WETH'].includes(payAsset.toUpperCase())) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid pay asset',
            message: 'Only USDC, POL, ETH, or WETH can be used for payment' 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Convert amount to smallest units (e.g., 100 USDC = 100000000)
      const amountInSmallestUnits = convertToSmallestUnits(amountIn, payAsset);
      
      // Build QuickSwap API request
      const quickswapRequest = {
        sellToken: getTokenAddress(payAsset),
        buyToken: getTokenAddress(receiveAsset),
        sellAmount: amountInSmallestUnits,
        takerAddress: userAddress || undefined,
        slippagePercentage: slippagePercentage ? parseFloat(slippagePercentage) : 1.0,
      };

      console.log('QuickSwap API request:', quickswapRequest);

      // TODO: Implement QuickSwap API call
      // For now, return a placeholder response
      const response: QuoteResponse = {
        routeId: `quickswap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amountOutEst: '0', // TODO: Get from QuickSwap API
        price: '0', // TODO: Get from QuickSwap API
        fees: {
          protocol: '0.3', // QuickSwap v2 fee
          gasInNeyxtEst: '0', // TODO: Calculate actual gas
        },
        slippageBps: Math.round(quickswapRequest.slippagePercentage * 100),
        estimatedTimeSec: 30, // Typical QuickSwap time
        ttlSec: 45, // Quote TTL
        warnings: ['QuickSwap API integration not yet implemented'],
        sources: ['QuickSwap v2'],
        priceImpact: '0', // TODO: Calculate from pool data
        gasEstimate: '0', // TODO: Get from QuickSwap API
      };

      console.log('Quote generated successfully:', response);

      return new Response(
        JSON.stringify(response),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );

    } catch (error) {
      console.error('Quote endpoint error:', error);
      
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          message: error.message || 'Unknown error occurred'
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
  }

  // Method not allowed
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405 
    }
  );
});
