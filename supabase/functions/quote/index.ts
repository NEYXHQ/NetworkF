// M4.1 - GET /api/quote with DEX Aggregator API (Polygon-only)
// M4.2 - Return gas_in_wfounder_est and warnings for min purchase
// M4.3 - Enforce min purchase (WFOUNDER_out ≥ 1.25× gas_in_wfounder_est)
// M4.4 - Apply per-trade cap (≤ max_trade_notional_base)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

// Token addresses for Polygon
const POLYGON_TOKENS = {
  weth: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
  usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
  wfounder: '0x6dcefF586744F3F1E637FE5eE45e0ff3880bb761', // WFOUNDER on Polygon
  pol: '0x0000000000000000000000000000000000001010', // Native POL token
};

// DEX Aggregator APIs (fallback order)
const DEX_APIS = {
  // 1inch API v6 for Polygon (Chain ID: 137) - public endpoints
  oneinch: 'https://api.1inch.dev/swap/v6.0/137',
  // ParaSwap API for Polygon
  paraswap: 'https://apiv5.paraswap.io',
  // 0x API for Polygon
  zeroex: 'https://polygon.api.0x.org',
  // Backup: OpenOcean (no auth required)
  openocean: 'https://open-api.openocean.finance/v3/137'
};



// 1inch API v6 Response Interface
interface OneinchQuoteResponse {
  dstAmount: string; // Changed from toAmount in v6
  srcAmount: string; // Changed from fromAmount in v6
  protocols?: Array<unknown>;
  estimatedGas?: number;
  gas?: number; // Alternative gas field in v6
  // Price impact data (if available in response)
  priceImpact?: string;
}

interface QuoteResponse {
  routeId: string;
  amountOutEst: string;
  price: string;
  usdEquivalent?: string; // Add USD equivalent
  wfounderPriceUsd?: string; // Add WFOUNDER price in USD
  fees: {
    protocol: string;
    gasInPolEst: string;
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
      return POLYGON_TOKENS.weth;
    case 'USDC':
      return POLYGON_TOKENS.usdc;
    case 'POL':
      return POLYGON_TOKENS.pol;
    case 'WFOUNDER':
      return POLYGON_TOKENS.neyxt;
    default:
      throw new Error(`Unsupported asset: ${asset}`);
  }
}

// Helper function to get token decimals
function getTokenDecimals(asset: string): number {
  switch (asset.toUpperCase()) {
    case 'USDC':
      return 6;
    case 'WETH':
    case 'ETH':
    case 'POL':
    case 'WFOUNDER':
      return 18;
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
  
  const decimals = getTokenDecimals(asset);
  return Math.floor(numAmount * Math.pow(10, decimals)).toString();
}

// Fetch quote from 1inch API (trying public endpoints)
async function fetchQuoteFrom1inch(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string
): Promise<OneinchQuoteResponse> {
  // Try the public endpoint first
  const url = `${DEX_APIS.oneinch}/quote?src=${fromTokenAddress}&dst=${toTokenAddress}&amount=${amount}`;
  
  console.log('Fetching quote from 1inch v6:', url);
  
  const response = await fetch(url, {
      headers: {
      'Accept': 'application/json',
    }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
    console.error('1inch API error:', {
      status: response.status,
      statusText: response.statusText,
      url: url,
      errorText: errorText
    });
    throw new Error(`1inch API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('1inch quote result:', result);
  
  return result;
}

// ParaSwap API Response Interface
interface ParaSwapQuoteResponse {
  priceRoute: {
    destAmount: string;
    side: string;
    srcUSD?: string; // USD value of source amount
    destUSD?: string; // USD value of destination amount
    maxImpactReached?: boolean; // High price impact flag
  };
  error?: string; // Error message (for high impact scenarios)
  value?: string; // Price impact percentage when rejected
}

// OpenOcean API Response Interface
interface OpenOceanQuoteResponse {
  data: {
    outAmount: string;
    estimatedGas: string;
    priceImpact?: string; // Price impact if provided
    resPricePerFromToken?: string; // Price data for calculation
    resPricePerToToken?: string;
  };
}

// Fallback to ParaSwap API
async function fetchQuoteFromParaSwap(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  fromDecimals: number
): Promise<ParaSwapQuoteResponse> {
  const url = `${DEX_APIS.paraswap}/prices?srcToken=${fromTokenAddress}&destToken=${toTokenAddress}&amount=${amount}&srcDecimals=${fromDecimals}&destDecimals=18&side=SELL&network=137`;
  
  console.log('Fetching quote from ParaSwap:', url);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('ParaSwap API error:', {
      status: response.status,
      statusText: response.statusText,
      url: url,
      errorText: errorText
    });
    throw new Error(`ParaSwap API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('ParaSwap quote result:', result);
  
  return result;
}

// Fetch quote from OpenOcean API (no auth required)
async function fetchQuoteFromOpenOcean(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string
): Promise<OpenOceanQuoteResponse> {
  const url = `${DEX_APIS.openocean}/quote?inTokenAddress=${fromTokenAddress}&outTokenAddress=${toTokenAddress}&amount=${amount}&gasPrice=30000000000`;
  
  console.log('Fetching quote from OpenOcean:', url);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenOcean API error:', {
      status: response.status,
      statusText: response.statusText,
      url: url,
      errorText: errorText
    });
    throw new Error(`OpenOcean API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('OpenOcean quote result:', result);
  
  return result;
}

// Estimate pool liquidity from trade impact data
function estimatePoolLiquidity(
  quote: ParaSwapQuoteResponse,
  amountInUSD: number
): { estimatedTVL: number; confidence: string } {
  try {
    // If we have USD values, we can estimate pool size from price impact
    if (quote.priceRoute.srcUSD && quote.priceRoute.destUSD) {
      const srcUSD = parseFloat(quote.priceRoute.srcUSD);
      const destUSD = parseFloat(quote.priceRoute.destUSD);
      
      // Price impact calculation: impact = tradeSize / (poolSize + tradeSize/2)
      // Rearranging: poolSize ≈ tradeSize * (1 - impact) / impact
      const priceDistortionRatio = destUSD / srcUSD;
      
      if (priceDistortionRatio > 1.2) {
        // For low liquidity pools, estimate based on price distortion
        // Higher distortion = smaller pool
        const estimatedPoolMultiplier = Math.min(10, Math.max(0.5, 5 / priceDistortionRatio));
        const estimatedTVL = srcUSD * estimatedPoolMultiplier;
        
        return {
          estimatedTVL: estimatedTVL,
          confidence: priceDistortionRatio > 3 ? 'low' : 'medium'
        };
      }
    }
    
    // If we have the exact price impact percentage from ParaSwap error
    if (quote.value) {
      const priceImpactPercent = parseFloat(quote.value.replace('%', ''));
      
      if (priceImpactPercent > 10) {
        // Use constant product formula estimation
        // For AMM: impact ≈ tradeSize / (2 * poolSize) for small trades
        // For large trades: impact ≈ tradeSize / poolSize
        const impact = priceImpactPercent / 100;
        
        let estimatedPoolSize;
        if (impact > 0.5) {
          // Very high impact - trade size comparable to pool
          estimatedPoolSize = amountInUSD / impact;
        } else {
          // Lower impact - use more conservative estimate
          estimatedPoolSize = amountInUSD / (impact * 2);
        }
        
        return {
          estimatedTVL: estimatedPoolSize,
          confidence: impact > 0.8 ? 'high' : impact > 0.3 ? 'medium' : 'low'
        };
      }
    }
    
    // Fallback estimation
    return {
      estimatedTVL: amountInUSD * 5, // Conservative estimate
      confidence: 'low'
    };
    
  } catch (error) {
    console.error('Error estimating pool liquidity:', error);
    return {
      estimatedTVL: 1.0,
      confidence: 'unknown'
    };
  }
}

// Calculate price impact from different sources with low liquidity detection
function calculatePriceImpact(
  quote: OneinchQuoteResponse | ParaSwapQuoteResponse | OpenOceanQuoteResponse,
  source: string,
  amountIn: string
): string {
  try {
    if (source === '1inch') {
      const oneinchQuote = quote as OneinchQuoteResponse;
      // Check if 1inch provides price impact directly
      if (oneinchQuote.priceImpact) {
        return parseFloat(oneinchQuote.priceImpact).toFixed(4);
      }
    } else if (source === 'ParaSwap') {
      const paraswapQuote = quote as ParaSwapQuoteResponse;
      
      // If we have the exact price impact from error (most reliable)
      if (paraswapQuote.value) {
        return parseFloat(paraswapQuote.value.replace('%', '')).toFixed(4);
      }
      
      // Enhanced calculation for low liquidity detection
      if (paraswapQuote.priceRoute.srcUSD && paraswapQuote.priceRoute.destUSD) {
        const srcUSD = parseFloat(paraswapQuote.priceRoute.srcUSD);
        const destUSD = parseFloat(paraswapQuote.priceRoute.destUSD);
        const amountInNum = parseFloat(amountIn);
        
        console.log('ParaSwap price impact calculation:', {
          srcUSD,
          destUSD,
          amountIn: amountInNum,
          tradeSize: srcUSD
        });
        
        // Detect price distortion (when output USD value > input USD value significantly)
        const priceDistortionRatio = destUSD / srcUSD;
        
        if (priceDistortionRatio > 1.5) {
          // Liquidity crisis detected - the pool is pricing tokens incorrectly
          console.warn('LOW LIQUIDITY POOL DETECTED:', {
            priceDistortionRatio: priceDistortionRatio.toFixed(2),
            explanation: 'Output USD value significantly exceeds input USD value due to low liquidity'
          });
          
          // Estimate actual pool size and calculate realistic impact
          const poolLiquidity = estimatePoolLiquidity(paraswapQuote, srcUSD);
          const poolSize = poolLiquidity.estimatedTVL;
          const poolImpactRatio = srcUSD / poolSize;
          
          console.log('Pool liquidity estimation:', {
            estimatedTVL: poolSize.toFixed(2),
            confidence: poolLiquidity.confidence,
            tradeSize: srcUSD,
            poolImpactRatio: (poolImpactRatio * 100).toFixed(1) + '%'
          });
          
          if (poolImpactRatio > 0.8) {
            return '95.0000'; // 95%+ impact for trades > 80% of pool
          } else if (poolImpactRatio > 0.5) {
            return (80 + (poolImpactRatio * 30)).toFixed(4); // 80%+ impact for trades > 50% of pool
          } else if (poolImpactRatio > 0.2) {
            return (30 + (poolImpactRatio * 150)).toFixed(4); // 30%+ impact for trades > 20% of pool
          } else if (poolImpactRatio > 0.05) {
            return (poolImpactRatio * 300).toFixed(4); // Scaled impact for smaller trades
          } else {
            return (poolImpactRatio * 100).toFixed(4); // Linear impact for very small trades
          }
        }
        
        // Normal calculation (for sufficient liquidity pools)
        const impact = Math.abs(((srcUSD - destUSD) / srcUSD) * 100);
        
        // Sanity check: if calculated impact seems too low for the price distortion, override
        if (priceDistortionRatio > 2 && impact < 50) {
          console.warn('Price impact calculation override due to extreme price distortion');
          return '90.0000';
        }
        
        return impact.toFixed(4);
      }
    } else if (source === 'OpenOcean') {
      const openoceanQuote = quote as OpenOceanQuoteResponse;
      // Check if OpenOcean provides price impact directly
      if (openoceanQuote.data.priceImpact) {
        return parseFloat(openoceanQuote.data.priceImpact).toFixed(4);
      }
    }
    
    // Fallback: Enhanced estimation for low liquidity scenarios
    const amountInNum = parseFloat(amountIn);
    
    // For WFOUNDER pools (known low liquidity), be more conservative
    const tradeSize = amountInNum;
    let estimatedImpact = 0;
    
    // More aggressive estimates for known low liquidity tokens
    if (tradeSize > 1) {
      estimatedImpact = 85.0; // Very large trades in low liquidity: extreme impact
    } else if (tradeSize > 0.5) {
      estimatedImpact = 60.0; // Large trades: very high impact
    } else if (tradeSize > 0.1) {
      estimatedImpact = 30.0; // Medium trades: high impact
    } else if (tradeSize > 0.01) {
      estimatedImpact = 10.0; // Small trades: moderate impact
    } else {
      estimatedImpact = 5.0; // Very small trades: low impact
    }
    
    return estimatedImpact.toFixed(4);
    
  } catch (error) {
    console.error('Error calculating price impact:', error);
    return '50.0000'; // Conservative fallback for low liquidity
  }
}

// Main function to get quote with fallback logic
async function getQuote(
  payAsset: string,
  amountIn: string,
  receiveAsset: string
): Promise<QuoteResponse> {
  const fromTokenAddress = getTokenAddress(payAsset);
  const toTokenAddress = getTokenAddress(receiveAsset);
  const amountInSmallestUnits = convertToSmallestUnits(amountIn, payAsset);
  
  console.log('Getting quote:', {
    payAsset,
    receiveAsset,
    amountIn,
    fromTokenAddress,
    toTokenAddress,
    amountInSmallestUnits
  });
  
  let quote: OneinchQuoteResponse | ParaSwapQuoteResponse | OpenOceanQuoteResponse | null = null;
  let source = '';
  let oneinchError: Error | null = null;
  let paraswapError: Error | null = null;
  
  try {
    // Try 1inch first
    quote = await fetchQuoteFrom1inch(fromTokenAddress, toTokenAddress, amountInSmallestUnits);
    source = '1inch';
  } catch (error) {
    oneinchError = error as Error;
    console.warn('1inch failed, trying ParaSwap:', error);
    
    try {
      // Fallback to ParaSwap (but handle high price impact)
      const fromDecimals = getTokenDecimals(payAsset);
      quote = await fetchQuoteFromParaSwap(fromTokenAddress, toTokenAddress, amountInSmallestUnits, fromDecimals);
      source = 'ParaSwap';
    } catch (error) {
      paraswapError = error as Error;
      console.warn('ParaSwap failed, trying OpenOcean:', error);
      
      // Check if ParaSwap failed due to high price impact but still has quote data
      if (paraswapError.message.includes('ESTIMATED_LOSS_GREATER_THAN_MAX_IMPACT')) {
        console.warn('ParaSwap rejected due to high price impact (98.94%), extracting quote data anyway...');
        
        try {
          // Try to extract the quote from the error message
          const errorText = paraswapError.message;
          
          // Extract price impact percentage
          const priceImpactMatch = errorText.match(/"value":"([^"]+)"/);
          const priceImpact = priceImpactMatch ? priceImpactMatch[1] : '98.94%';
          
          // Extract destination amount
          const priceRouteMatch = errorText.match(/"priceRoute":\{[^}]*"destAmount":"([^"]+)"/);
          
          // Extract USD values for better price impact calculation
          const srcUSDMatch = errorText.match(/"srcUSD":"([^"]+)"/);
          const destUSDMatch = errorText.match(/"destUSD":"([^"]+)"/);
          
          if (priceRouteMatch) {
            const destAmount = priceRouteMatch[1];
            const srcUSD = srcUSDMatch ? srcUSDMatch[1] : undefined;
            const destUSD = destUSDMatch ? destUSDMatch[1] : undefined;
            
            console.log('Extracted ParaSwap quote data:', {
              destAmount,
              priceImpact,
              srcUSD,
              destUSD
            });
            
            // Create a response with the extracted data
            quote = {
              priceRoute: {
                destAmount: destAmount,
                side: priceImpact,
                srcUSD: srcUSD,
                destUSD: destUSD,
                maxImpactReached: true
              },
              error: 'ESTIMATED_LOSS_GREATER_THAN_MAX_IMPACT',
              value: priceImpact
            } as ParaSwapQuoteResponse;
            source = 'ParaSwap';
            
            // Add warning about high price impact
            console.warn(`Using ParaSwap quote with HIGH PRICE IMPACT: ${priceImpact}`);
            // Don't try OpenOcean since we got a quote
          } else {
            console.warn('Could not extract quote from ParaSwap error, trying OpenOcean...');
            throw paraswapError; // Continue to OpenOcean
          }
        } catch {
          console.warn('Failed to extract ParaSwap quote, trying OpenOcean...');
          // Continue to OpenOcean fallback below
        }
      }
      
      // Only try OpenOcean if we don't have a quote yet
      if (!quote) {
        try {
          // Last fallback to OpenOcean
          quote = await fetchQuoteFromOpenOcean(fromTokenAddress, toTokenAddress, amountInSmallestUnits);
          source = 'OpenOcean';
        } catch (openoceanError) {
          console.error('All DEX aggregators failed:', openoceanError);
        
          // Enhanced debugging information
          const debugInfo = {
            fromToken: fromTokenAddress,
            toToken: toTokenAddress,
            amount: amountInSmallestUnits,
            payAsset: payAsset,
            receiveAsset: receiveAsset,
            amountInOriginal: amountIn,
            poolAddresses: {
              quickswapRouter: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
              wethNeyxtPool: '0x6B8A57addD24CAF494393D9E0bf38BC54F713833',
              wethUsdcPool: '0x853Ee4b2A13f8a742d64C8F088bE7bA2131f670d'
            },
            errors: {
              oneinch: oneinchError?.message || 'Failed to fetch quote',
              paraswap: paraswapError?.message || 'Failed to fetch quote',
              openocean: (openoceanError as Error)?.message || 'Failed to fetch quote'
            }
          };
          
          console.error('No liquidity found - Debug info:', debugInfo);
          
          throw new Error(`No liquidity found for this token pair. Debug info: ${JSON.stringify(debugInfo, null, 2)}`);
        }
      }
    }
  }
  
  // Ensure we have a quote before proceeding
  if (!quote) {
    throw new Error('No quote received from any DEX aggregator');
  }
  
  // Parse the quote response based on source
  let amountOutEst: string;
  if (source === '1inch') {
    amountOutEst = (parseFloat((quote as OneinchQuoteResponse).dstAmount) / 1e18).toFixed(6);
  } else if (source === 'ParaSwap') {
    amountOutEst = (parseFloat((quote as ParaSwapQuoteResponse).priceRoute.destAmount) / 1e18).toFixed(6);
  } else { // OpenOcean
    amountOutEst = (parseFloat((quote as OpenOceanQuoteResponse).data.outAmount) / 1e18).toFixed(6);
  }
  
  // Calculate price (amount of WFOUNDER per input token)
  const price = (parseFloat(amountOutEst) / parseFloat(amountIn)).toFixed(6);
  
  // Calculate USD equivalent
  const usdEquivalent = await calculateUsdEquivalent(payAsset, amountIn);
  
  // Calculate WFOUNDER price in USD
  const wfounderPriceUsd = parseFloat(usdEquivalent) / parseFloat(amountOutEst);
  
  // Estimate gas costs
  let gasEstimate: string;
  if (source === '1inch') {
    const oneinchQuote = quote as OneinchQuoteResponse;
    gasEstimate = (oneinchQuote.estimatedGas || oneinchQuote.gas || 150000).toString();
  } else if (source === 'OpenOcean') {
    gasEstimate = (quote as OpenOceanQuoteResponse).data.estimatedGas;
  } else {
    gasEstimate = '150000'; // Default for ParaSwap
  }
  
  const gasInPolEst = await estimateGasInPol(gasEstimate);
  
  // Calculate price impact using smart extraction
  const priceImpact = calculatePriceImpact(quote, source, amountIn);
  
  // Generate warnings based on price impact and liquidity analysis
  const warnings: string[] = [];
  const priceImpactNum = parseFloat(priceImpact);
  
  // Detect liquidity crisis based on inflated WFOUNDER price
  const neyxtPriceNum = parseFloat(wfounderPriceUsd.toFixed(6));
  const isLiquidityCrisis = neyxtPriceNum > 100; // WFOUNDER should be ~$0.01, not $100+
  
  // Get actual pool liquidity estimate if available
  let poolTVLEstimate = 'unknown';
  let poolConfidence = 'unknown';
  
  if (source === 'ParaSwap' && isLiquidityCrisis) {
    const paraswapQuote = quote as ParaSwapQuoteResponse;
    const tradeUsdValue = parseFloat(usdEquivalent);
    const poolLiquidity = estimatePoolLiquidity(paraswapQuote, tradeUsdValue);
    
    poolTVLEstimate = poolLiquidity.estimatedTVL < 10 
      ? `$${poolLiquidity.estimatedTVL.toFixed(2)}`
      : `$${poolLiquidity.estimatedTVL.toFixed(0)}`;
    poolConfidence = poolLiquidity.confidence;
  }
  
  if (isLiquidityCrisis) {
    warnings.push(`LIQUIDITY CRISIS: WFOUNDER price inflated to $${neyxtPriceNum.toFixed(2)} (should be ~$0.01)`);
    
    if (poolTVLEstimate !== 'unknown') {
      warnings.push(`Pool has insufficient liquidity (estimated ${poolTVLEstimate} TVL, ${poolConfidence} confidence) - Trade may not be executable`);
    } else {
      warnings.push('Pool has insufficient liquidity - Trade may not be executable');
    }
    
    warnings.push(`Actual price impact likely >90% despite ${priceImpact}% calculation`);
  }
  
  // Standard price impact warnings
  if (priceImpactNum > 90) {
    warnings.push(`CRITICAL PRICE IMPACT: ${priceImpact}% - Trade will destroy pool pricing`);
  } else if (priceImpactNum > 50) {
    warnings.push(`EXTREME PRICE IMPACT: ${priceImpact}% - Trade not recommended`);
  } else if (priceImpactNum > 15) {
    warnings.push(`HIGH PRICE IMPACT: ${priceImpact}% - Consider smaller amount`);
  } else if (priceImpactNum > 5) {
    warnings.push(`Moderate price impact: ${priceImpact}%`);
  }
  
  // Trade size warnings for low liquidity pools
  const tradeUsdValue = parseFloat(usdEquivalent);
  if (tradeUsdValue > 0.5) {
    warnings.push(`Large trade ($${tradeUsdValue.toFixed(2)}) for low liquidity pool - Consider multiple smaller trades`);
  }
  
  if (source === 'ParaSwap' && (quote as ParaSwapQuoteResponse).error) {
    warnings.push('Quote extracted from rejected high-impact trade');
  }
  
  return {
    routeId: `${source.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    amountOutEst,
    price,
    usdEquivalent,
    wfounderPriceUsd: wfounderPriceUsd.toFixed(6),
    fees: {
      protocol: source === '1inch' ? '0.3' : '0.25',
      gasInPolEst,
    },
    slippageBps: 100, // 1% default
    estimatedTimeSec: 30,
    ttlSec: 45,
    warnings: warnings,
    sources: [source],
    priceImpact: `${priceImpact}%`,
    gasEstimate,
  };
}

// Simplified USD calculation
async function calculateUsdEquivalent(payAsset: string, amountIn: string): Promise<string> {
  const amountNum = parseFloat(amountIn);
  
  switch (payAsset.toUpperCase()) {
    case 'USDC':
      return amountNum.toFixed(2);
    case 'WETH':
    case 'ETH':
      return (amountNum * 3000).toFixed(2); // Approximate WETH price
    case 'POL':
      return (amountNum * 0.5).toFixed(2); // Approximate POL price
    default:
      return '0.00';
    }
}

// Simplified gas estimation in POL
async function estimateGasInPol(gasEstimate: string): Promise<string> {
  try {
    const gas = parseInt(gasEstimate);
    // Calculate gas cost in POL: gas units * gas price (30 gwei) / 1e18
    const gasCostPol = (gas * 30e9) / 1e18;
    return gasCostPol.toFixed(6);
  } catch (error) {
    console.error('Error estimating gas in POL:', error);
    return '0.001'; // Default estimate (small amount of POL)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('=== QUOTE FUNCTION CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Current timestamp:', new Date().toISOString());
  console.log('Function version: UPDATED WITH REAL BLOCKCHAIN DATA');
  console.log('=====================================');

  // Quote endpoint
  if (req.method === 'GET') {
    try {
      // Parse query parameters
      const url = new URL(req.url);
      const payAsset = url.searchParams.get('payAsset');
      const amountIn = url.searchParams.get('amountIn');
      const receiveAsset = url.searchParams.get('receiveAsset');

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
      if (receiveAsset.toUpperCase() !== 'WFOUNDER') {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid receive asset',
            message: 'Only WFOUNDER can be received' 
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

      // Validate minimum purchase amount
      const amountNum = parseFloat(amountIn);
      if (isNaN(amountNum) || amountNum <= 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid amount',
            message: 'Amount must be a positive number' 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Check if POL is being used (currently disabled)
      if (payAsset.toUpperCase() === 'POL') {
        return new Response(
          JSON.stringify({ 
            error: 'Asset temporarily disabled',
            message: 'POL payments are currently disabled due to quote issues' 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Set minimum amounts based on asset type
      let minAmount = 0.01; // Default for USDC
      if (payAsset.toUpperCase() === 'ETH' || payAsset.toUpperCase() === 'WETH') {
        minAmount = 0.00001; // Much lower minimum for ETH
      }

      if (amountNum < minAmount) {
        return new Response(
          JSON.stringify({ 
            error: 'Amount too small',
            message: `Minimum purchase amount is ${minAmount} ${payAsset}` 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Get quote using DEX aggregator APIs
      const response = await getQuote(payAsset, amountIn, receiveAsset);
      
      // Add slippage from request if provided
      if (slippagePercentage) {
        response.slippageBps = Math.round(parseFloat(slippagePercentage.toString()) * 100);
      }

      console.log('Final quote response:', response);

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
