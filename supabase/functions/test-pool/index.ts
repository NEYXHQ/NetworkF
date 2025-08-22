// Test endpoint to verify QuickSwap pool connection and pricing data
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { fetchPoolData, validateQuote, getPricingPolicy } from '../_shared/pricing.ts';
import { getCurrentNetwork, getContractAddresses, getRpcUrl } from '../_shared/networks.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Testing QuickSwap pool connection...');
    
    // Fetch pool data
    const poolData = await fetchPoolData();
    console.log('Pool data fetched successfully:', {
      spotPrice: poolData.spotPrice,
      token0: poolData.token0.symbol,
      token1: poolData.token1.symbol,
      blockTimestamp: poolData.blockTimestamp,
    });

    // Get pricing policy
    const policy = getPricingPolicy();

    // Test validation with a small trade
    const testAmountIn = '0.1'; // 0.1 WETH
    const testQuotePrice = poolData.spotPrice; // Use spot price for testing
    const testAmountOut = (parseFloat(testAmountIn) * poolData.spotPrice).toString();

    const validation = validateQuote(
      poolData,
      testQuotePrice,
      testAmountIn,
      testAmountOut,
      true, // WETH in
      policy
    );

    const response = {
      success: true,
      poolData: {
        spotPrice: poolData.spotPrice,
        spotPriceFormatted: `1 WETH = ${poolData.spotPrice.toFixed(6)} NEYXT`,
        reserves: {
          token0: `${poolData.token0.symbol}: ${(Number(poolData.reserve0) / 1e18).toFixed(6)}`,
          token1: `${poolData.token1.symbol}: ${(Number(poolData.reserve1) / 1e18).toFixed(6)}`,
        },
        isNeyxtToken0: poolData.isNeyxtToken0,
        blockTimestamp: poolData.blockTimestamp,
        lastUpdate: new Date(poolData.blockTimestamp * 1000).toISOString(),
      },
      policy,
      testValidation: {
        testTrade: `${testAmountIn} WETH → ${testAmountOut} NEYXT`,
        ...validation,
      },
      network: {
        config: getCurrentNetwork(),
        contracts: getContractAddresses(),
        rpcUrl: getRpcUrl(),
      },
    };

    return new Response(
      JSON.stringify(response, null, 2),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  } catch (error) {
    console.error('Pool test error:', error);
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
      network: {
        config: getCurrentNetwork(),
        contracts: getContractAddresses(),
        rpcUrl: getRpcUrl(),
      },
    };

    return new Response(
      JSON.stringify(errorResponse, null, 2),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
