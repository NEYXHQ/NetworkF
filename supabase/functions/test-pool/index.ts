// Test endpoint to verify QuickSwap pool connection and pricing data
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { 
  fetchPoolData, 
  validateQuote, 
  getPricingPolicy, 
  getPoolHealthMetrics,
  calculatePriceImpact,
  isPoolDataStale 
} from '../_shared/pricing.ts';
import { getCurrentNetwork, getContractAddresses, getRpcUrl } from '../_shared/networks.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Testing QuickSwap pool connection and pricing utilities...');
    
    // Fetch pool data
    const poolData = await fetchPoolData();
    console.log('Pool data fetched successfully:', {
      spotPrice: poolData.spotPrice,
      token0: poolData.token0.symbol,
      token1: poolData.token1.symbol,
      blockTimestamp: poolData.blockTimestamp,
      liquidityWeth: poolData.liquidityWeth,
      liquidityWfounder: poolData.liquidityWfounder,
    });

    // Get pricing policy
    const policy = getPricingPolicy();

    // Test validation with different trade sizes
    const testTrades = [
      { amountIn: '0.1', description: '0.1 WETH trade' },
      { amountIn: '1.0', description: '1.0 WETH trade' },
      { amountIn: '10.0', description: '10.0 WETH trade' },
    ];

    const validationResults = testTrades.map(trade => {
      const testQuotePrice = poolData.spotPrice; // Use spot price for testing
      const testAmountOut = (parseFloat(trade.amountIn) * poolData.spotPrice).toString();

      const validation = validateQuote(
        poolData,
        testQuotePrice,
        trade.amountIn,
        testAmountOut,
        true, // WETH in
        policy
      );

      const priceImpact = calculatePriceImpact(poolData, trade.amountIn, true);

      return {
        trade: trade.description,
        amountIn: `${trade.amountIn} WETH`,
        amountOut: `${testAmountOut} WFOUNDER`,
        priceImpact: `${(priceImpact * 100).toFixed(4)}%`,
        validation,
      };
    });

    // Test WFOUNDER to WETH trades
    const neyxtTestTrades = [
      { amountIn: '100', description: '100 WFOUNDER trade' },
      { amountIn: '1000', description: '1000 WFOUNDER trade' },
    ];

    const neyxtValidationResults = neyxtTestTrades.map(trade => {
      const testQuotePrice = 1 / poolData.spotPrice; // WETH per WFOUNDER
      const testAmountOut = (parseFloat(trade.amountIn) / poolData.spotPrice).toString();

      const validation = validateQuote(
        poolData,
        testQuotePrice,
        trade.amountIn,
        testAmountOut,
        false, // WFOUNDER in
        policy
      );

      const priceImpact = calculatePriceImpact(poolData, trade.amountIn, false);

      return {
        trade: trade.description,
        amountIn: `${trade.amountIn} WFOUNDER`,
        amountOut: `${testAmountOut} WETH`,
        priceImpact: `${(priceImpact * 100).toFixed(4)}%`,
        validation,
      };
    });

    // Get pool health metrics
    const healthMetrics = getPoolHealthMetrics(poolData);

    // Check if pool data is stale
    const isStale = isPoolDataStale(poolData);
    const dataAge = Math.floor(Date.now() / 1000) - poolData.blockTimestamp;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      poolData: {
        spotPrice: poolData.spotPrice,
        spotPriceFormatted: `1 WETH = ${poolData.spotPrice.toFixed(6)} WFOUNDER`,
        reserves: {
          token0: `${poolData.token0.symbol}: ${(Number(poolData.reserve0) / Math.pow(10, poolData.token0.decimals)).toFixed(6)}`,
          token1: `${poolData.token1.symbol}: ${(Number(poolData.reserve1) / Math.pow(10, poolData.token1.decimals)).toFixed(6)}`,
        },
        liquidity: {
          weth: `${poolData.liquidityWeth.toFixed(4)} WETH`,
          wfounder: `${poolData.liquidityWfounder.toFixed(2)} WFOUNDER`,
          totalValueWeth: `${(poolData.liquidityWeth + (poolData.liquidityWfounder / poolData.spotPrice)).toFixed(4)} WETH`,
        },
        isWfounderToken0: poolData.isWfounderToken0,
        blockTimestamp: poolData.blockTimestamp,
        lastUpdate: new Date(poolData.blockTimestamp * 1000).toISOString(),
        dataAge: `${dataAge} seconds`,
        isStale: isStale,
      },
      policy,
      healthMetrics,
      testResults: {
        wethToNeyxt: validationResults,
        neyxtToWeth: neyxtValidationResults,
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
      timestamp: new Date().toISOString(),
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
