// Test script to fetch actual pool data from QuickSwap v2 WETH/WFOUNDER pool
// This script tests the real fetchPoolData function with live blockchain data
// Run with: node test-pool-data.mjs

import { ethers } from 'ethers';

// QuickSwap v2 Pair ABI (minimal interface)
const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function price0CumulativeLast() external view returns (uint256)',
  'function price1CumulativeLast() external view returns (uint256)',
];

// ERC20 ABI (minimal interface)
const ERC20_ABI = [
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

// Contract addresses (you can update these with your actual addresses)
const CONTRACTS = {
  // Testnet addresses (Polygon Amoy) - QuickSwap NOT deployed
  testnet: {
    refPool: '0x6B8A57addD24CAF494393D9E0bf38BC54F713833', // WETH/WFOUNDER pool - NOT DEPLOYED
    wfounder: '0x5911FF908512f9CAC1FC8727dDBfca208F164814', // WFOUNDER token
    weth: '0x52eF3d68BaB452a294342DC3e5f464d7f610f72E', // WETH token
    rpcUrl: 'https://rpc-amoy.polygon.technology'
  },
  // Mainnet addresses (Polygon) - QuickSwap IS deployed
  mainnet: {
    refPool: '0x6B8A57addD24CAF494393D9E0bf38BC54F713833', // WETH/WFOUNDER pool - EXISTS
    wfounder: '0x6dcefF586744F3F1E637FE5eE45e0ff3880bb761', // WFOUNDER token
    weth: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH token
    rpcUrl: 'https://polygon-rpc.com'
  }
};

// Choose environment (mainnet by default since testnet doesn't have QuickSwap)
const ENVIRONMENT = 'mainnet'; // Change to 'testnet' for testing (but QuickSwap not deployed there)
const contracts = CONTRACTS[ENVIRONMENT];

console.log(`🔗 Testing ${ENVIRONMENT.toUpperCase()} environment`);
console.log(`📡 RPC URL: ${contracts.rpcUrl}`);
console.log(`🏊 Pool Address: ${contracts.refPool}`);
console.log(`🪙 WFOUNDER Address: ${contracts.wfounder}`);
console.log(`💎 WETH Address: ${contracts.weth}`);
console.log('');

// Add warning for testnet
if (ENVIRONMENT === 'testnet') {
  console.log('⚠️  WARNING: QuickSwap v2 is NOT deployed on Polygon Amoy testnet');
  console.log('⚠️  The pool contract will not exist and this test will fail');
  console.log('⚠️  Switch to mainnet to test with real pool data\n');
}

async function fetchPoolData() {
  try {
    // Create provider
    const provider = new ethers.JsonRpcProvider(contracts.rpcUrl);
    console.log('✅ Connected to RPC provider');

    // Create contract instances
    const pairContract = new ethers.Contract(contracts.refPool, PAIR_ABI, provider);
    console.log('✅ Created pair contract instance');

    // Fetch pool data
    console.log('📊 Fetching pool data...');
    const [reserves, token0Address, token1Address] = await Promise.all([
      pairContract.getReserves(),
      pairContract.token0(),
      pairContract.token1(),
    ]);

    console.log('✅ Pool data fetched successfully');

    // Determine which token is WFOUNDER and which is WETH
    const isWfounderToken0 = token0Address.toLowerCase() === contracts.wfounder.toLowerCase();
    const isWethToken0 = token0Address.toLowerCase() === contracts.weth.toLowerCase();
    const isWfounderToken1 = token1Address.toLowerCase() === contracts.wfounder.toLowerCase();
    const isWethToken1 = token1Address.toLowerCase() === contracts.weth.toLowerCase();

    // Validate this is actually a WFOUNDER/WETH pair
    if (!((isWfounderToken0 && isWethToken1) || (isWfounderToken1 && isWethToken0))) {
      throw new Error(`Pool at ${contracts.refPool} is not a WFOUNDER/WETH pair. Found tokens: ${token0Address}, ${token1Address}`);
    }

    console.log('✅ Confirmed WFOUNDER/WETH pair');

    // Get token metadata
    const token0Contract = new ethers.Contract(token0Address, ERC20_ABI, provider);
    const token1Contract = new ethers.Contract(token1Address, ERC20_ABI, provider);

    const [token0Symbol, token0Decimals, token1Symbol, token1Decimals] = await Promise.all([
      token0Contract.symbol(),
      token0Contract.decimals(),
      token1Contract.symbol(),
      token1Contract.decimals(),
    ]);

    console.log('✅ Token metadata retrieved');

    // Calculate spot price (WFOUNDER per WETH)
    const reserve0 = reserves[0];
    const reserve1 = reserves[1];
    const blockTimestampLast = reserves[2];

    let spotPrice, liquidityWeth, liquidityWfounder;
    
    if (isWfounderToken0) {
      // WFOUNDER is token0, WETH is token1
      const token0Formatted = Number(ethers.formatUnits(reserve0, token0Decimals));
      const token1Formatted = Number(ethers.formatUnits(reserve1, token1Decimals));
      spotPrice = token0Formatted / token1Formatted;
      liquidityWfounder = token0Formatted;
      liquidityWeth = token1Formatted;
    } else {
      // WETH is token0, WFOUNDER is token1
      const token0Formatted = Number(ethers.formatUnits(reserve0, token0Decimals));
      const token1Formatted = Number(ethers.formatUnits(reserve1, token1Decimals));
      spotPrice = token1Formatted / token0Formatted;
      liquidityWeth = token0Formatted;
      liquidityWfounder = token1Formatted;
    }

    // Calculate total value locked in WETH
    const totalValueWeth = liquidityWeth + (liquidityWfounder / spotPrice);

    // Display results
    console.log('\n📊 POOL DATA RESULTS:');
    console.log('=====================');
    console.log(`💰 Spot Price: 1 WETH = ${spotPrice.toFixed(6)} WFOUNDER`);
    console.log(`💎 WFOUNDER Liquidity: ${liquidityWfounder.toLocaleString()} WFOUNDER`);
    console.log(`💎 WETH Liquidity: ${liquidityWeth.toFixed(4)} WETH`);
    console.log(`💎 Total Value Locked: ${totalValueWeth.toFixed(4)} WETH`);
    console.log(`⏰ Last Update: ${new Date(Number(blockTimestampLast) * 1000).toISOString()}`);
    console.log(`🔗 Block Number: ${Number(blockTimestampLast)}`);
    console.log('');
    console.log(`📝 Token Details:`);
    console.log(`   Token0 (${token0Symbol}): ${token0Address}`);
    console.log(`   Token1 (${token1Symbol}): ${token1Address}`);
    console.log(`   WFOUNDER is Token${isWfounderToken0 ? '0' : '1'}`);
    console.log(`   WETH is Token${isWethToken0 ? '0' : '1'}`);
    console.log('');

    // Test price impact calculations for different trade sizes
    console.log('📈 PRICE IMPACT ANALYSIS:');
    console.log('========================');
    
    const testAmounts = [0.1, 1.0, 10.0, 50.0, 100.0];
    testAmounts.forEach(amount => {
      if (amount <= liquidityWeth * 0.1) { // Only test if within 10% of liquidity
        // Simplified price impact calculation
        const impact = (amount / liquidityWeth) * 0.3; // Rough estimate
        console.log(`   ${amount} WETH trade: ~${(impact * 100).toFixed(3)}% price impact`);
      } else {
        console.log(`   ${amount} WETH trade: ⚠️  Exceeds 10% of liquidity`);
      }
    });

    console.log('');
    console.log('✅ Pool data test completed successfully!');

    return {
      spotPrice,
      liquidityWeth,
      liquidityWfounder,
      totalValueWeth,
      blockTimestamp: Number(blockTimestampLast), // Convert BigInt to Number
      isWfounderToken0,
      token0: { symbol: token0Symbol, decimals: token0Decimals, address: token0Address },
      token1: { symbol: token1Symbol, decimals: token1Decimals, address: token1Address }
    };

  } catch (error) {
    console.error('❌ Error fetching pool data:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Run the test
async function main() {
  try {
    console.log('🚀 Starting pool data test...\n');
    await fetchPoolData();
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
