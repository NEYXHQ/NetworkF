// Direct Uniswap V2 integration for USDC→WFOUNDER swaps
// Simplified buy flow without external aggregators

import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/contracts';

// Uniswap V2 Router ABI (minimal interface for swapping)
const UNISWAP_V2_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function WETH() external pure returns (address)'
];

// Uniswap V2 Pair ABI (for reading reserves)
const UNISWAP_V2_PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];

// ERC20 ABI (for token operations)
const ERC20_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)'
];

export interface SwapQuote {
  amountOut: string;
  amountOutMin: string; // with slippage protection
  priceImpact: string;
  gasEstimate: string;
  route: string[];
  slippagePercentage: number;
}

export interface SwapTransaction {
  to: string;
  data: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
}

export interface ApprovalTransaction {
  to: string;
  data: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
}

export interface SwapParams {
  amountIn: string; // Amount of USDC to spend (in USDC units)
  slippagePercentage?: number; // Default 1%
  deadline?: number; // Default 20 minutes
}

class UniswapService {
  private routerAddress: string;
  private wfounderAddress: string;
  private usdcAddress: string;
  private poolAddress: string;

  constructor() {
    // Use the available environment variables through CONTRACT_ADDRESSES
    this.routerAddress = CONTRACT_ADDRESSES.UNISWAP_ROUTER;
    this.wfounderAddress = CONTRACT_ADDRESSES.WFOUNDER;
    this.usdcAddress = CONTRACT_ADDRESSES.USDC;
    this.poolAddress = CONTRACT_ADDRESSES.REF_POOL_ADDRESS; // USDC/WFOUNDER pool

    // Debug: Log addresses to help identify null values
    console.log('UniswapService Contract Addresses:', {
      routerAddress: this.routerAddress,
      wfounderAddress: this.wfounderAddress,
      usdcAddress: this.usdcAddress,
      poolAddress: this.poolAddress
    });

    // Validate that required addresses are not null
    if (!this.routerAddress) {
      throw new Error('UNISWAP_ROUTER address is null or undefined. Check VITE_ETHEREUM_UNISWAP_ALLOWED_ROUTERS environment variable.');
    }
    if (!this.usdcAddress) {
      throw new Error('USDC address is null or undefined. Check VITE_ETHEREUM_USDC_CONTRACT_ADDRESS environment variable.');
    }
    if (!this.wfounderAddress) {
      throw new Error('WFOUNDER address is null or undefined. Check VITE_ETHEREUM_WFOUNDER_CONTRACT_ADDRESS environment variable.');
    }
    if (!this.poolAddress) {
      throw new Error('Pool address is null or undefined. Check VITE_ETHEREUM_REF_POOL_ADDRESS environment variable.');
    }
  }

  /**
   * Get a quote for USDC → WFOUNDER swap
   */
  async getSwapQuote(
    amountInUsdc: string,
    provider: ethers.BrowserProvider,
    slippagePercentage: number = 1,
    userAddress?: string
  ): Promise<SwapQuote> {
    try {
      // Convert USDC amount to wei (USDC has 6 decimals)
      const amountInWei = ethers.parseUnits(amountInUsdc, 6);

      // Create router contract instance
      const routerContract = new ethers.Contract(
        this.routerAddress,
        UNISWAP_V2_ROUTER_ABI,
        provider
      );

      // Define swap path: USDC → WFOUNDER (direct pair)
      const path = [this.usdcAddress, this.wfounderAddress];

      // Get amounts out from Uniswap router
      const amountsOut = await routerContract.getAmountsOut(amountInWei, path);
      const amountOut = amountsOut[amountsOut.length - 1]; // Final output amount

      // Calculate minimum amount out with slippage protection
      const slippageBps = Math.floor(slippagePercentage * 100); // Convert to basis points
      const amountOutMin = amountOut - (amountOut * BigInt(slippageBps) / BigInt(10000));

      // Calculate price impact (simplified calculation)
      const priceImpact = await this.calculatePriceImpact(amountInWei, amountOut, provider);

      // Estimate gas for the swap (use user address if available, otherwise fallback)
      let gasEstimate: bigint;
      if (userAddress) {
        gasEstimate = await this.estimateSwapGas(amountInWei, amountOutMin, userAddress, provider);
      } else {
        gasEstimate = BigInt(150000); // Default gas limit when user address not available
      }

      return {
        amountOut: ethers.formatUnits(amountOut, 18), // WFOUNDER has 18 decimals
        amountOutMin: ethers.formatUnits(amountOutMin, 18),
        priceImpact: priceImpact.toString(),
        gasEstimate: gasEstimate.toString(),
        route: ['USDC', 'WFOUNDER'],
        slippagePercentage
      };

    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw new Error(`Failed to get swap quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prepare swap transaction data
   */
  async prepareSwapTransaction(
    params: SwapParams,
    userAddress: string,
    provider: ethers.BrowserProvider
  ): Promise<SwapTransaction> {
    try {
      const { amountIn, slippagePercentage = 1, deadline = 20 } = params;

      // Get quote first
      const quote = await this.getSwapQuote(amountIn, provider, slippagePercentage, userAddress);


      // Convert amounts to wei
      const amountInWei = ethers.parseUnits(amountIn, 6); // USDC has 6 decimals
      const amountOutMin = ethers.parseUnits(quote.amountOutMin, 18);

      // Calculate deadline (current time + minutes)
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);

      // Create router contract instance
      const routerContract = new ethers.Contract(
        this.routerAddress,
        UNISWAP_V2_ROUTER_ABI,
        provider
      );

      // Define swap path: USDC → WFOUNDER
      const path = [this.usdcAddress, this.wfounderAddress];

      // Prepare transaction data
      const txData = routerContract.interface.encodeFunctionData(
        'swapExactTokensForTokens',
        [amountInWei, amountOutMin, path, userAddress, deadlineTimestamp]
      );

      // Double-check allowance right before swap preparation
      const currentAllowance = await this.getCurrentAllowance(userAddress, provider);

      console.log('Debug: Swap transaction preparation:', {
        routerAddress: this.routerAddress,
        amountInWei: amountInWei.toString(),
        amountOutMin: amountOutMin.toString(),
        path,
        userAddress,
        deadlineTimestamp,
        currentAllowance: currentAllowance.toString(),
        allowanceSufficient: currentAllowance >= amountInWei,
        txData: txData.slice(0, 20) + '...', // Show first part of data
        txDataLength: txData.length
      });

      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('25', 'gwei'); // 25 Gwei fallback

      return {
        to: this.routerAddress,
        data: txData,
        value: '0', // No ETH value needed for token-to-token swap
        gasLimit: quote.gasEstimate,
        gasPrice: gasPrice.toString()
      };

    } catch (error) {
      console.error('Error preparing swap transaction:', error);
      throw new Error(`Failed to prepare swap transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if approval is needed for USDC swaps (always needed for ERC-20 tokens)
   */
  async checkApprovalNeeded(
    tokenAddress: string,
    userAddress: string,
    amountIn: string,
    provider: ethers.BrowserProvider
  ): Promise<boolean> {
    try {
      // For USDC swaps, always check allowance
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const allowance = await tokenContract.allowance(userAddress, this.routerAddress);

      // Use appropriate decimals based on token (USDC = 6, WFOUNDER = 18)
      const decimals = tokenAddress.toLowerCase() === this.usdcAddress.toLowerCase() ? 6 : 18;
      const amountInWei = ethers.parseUnits(amountIn, decimals);

      const approvalNeeded = allowance < amountInWei;

      console.log('Debug: Approval check:', {
        tokenAddress,
        userAddress,
        routerAddress: this.routerAddress,
        amountIn,
        amountInWei: amountInWei.toString(),
        allowance: allowance.toString(),
        decimals,
        approvalNeeded
      });

      return approvalNeeded;
    } catch (error) {
      console.error('Error checking approval:', error);
      return true; // Assume approval needed on error
    }
  }

  /**
   * Prepare approval transaction for token swaps
   */
  async prepareApprovalTransaction(
    tokenAddress: string,
    amountIn: string,
    provider: ethers.BrowserProvider
  ): Promise<ApprovalTransaction> {
    try {
      // Use appropriate decimals based on token (USDC = 6, WFOUNDER = 18)
      const decimals = tokenAddress.toLowerCase() === this.usdcAddress.toLowerCase() ? 6 : 18;
      const amountInWei = ethers.parseUnits(amountIn, decimals);

      // Approve a much larger amount to avoid repeated approvals
      // Use max uint256 for unlimited approval (common DeFi practice)
      const maxUint256 = ethers.MaxUint256;

      console.log('Debug: Preparing approval transaction:', {
        tokenAddress,
        amountIn,
        amountInWei: amountInWei.toString(),
        approvalAmount: maxUint256.toString(),
        routerAddress: this.routerAddress
      });

      // Get signer for gas estimation (this provides the 'from' address)
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

      // Prepare approval transaction data - approve max amount for convenience
      const txData = tokenContract.interface.encodeFunctionData(
        'approve',
        [this.routerAddress, maxUint256]
      );

      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('25', 'gwei');

      // Estimate gas for approval (using signer ensures 'from' address is set)
      const gasEstimate = await tokenContract.approve.estimateGas(this.routerAddress, maxUint256);

      return {
        to: tokenAddress,
        data: txData,
        value: '0',
        gasLimit: gasEstimate.toString(),
        gasPrice: gasPrice.toString()
      };

    } catch (error) {
      console.error('Error preparing approval transaction:', error);
      throw new Error(`Failed to prepare approval transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current USDC allowance for the router
   */
  private async getCurrentAllowance(userAddress: string, provider: ethers.BrowserProvider): Promise<bigint> {
    try {
      const tokenContract = new ethers.Contract(this.usdcAddress, ERC20_ABI, provider);
      return await tokenContract.allowance(userAddress, this.routerAddress);
    } catch (error) {
      console.error('Error getting current allowance:', error);
      return BigInt(0);
    }
  }

  /**
   * Get user's USDC balance
   */
  async getUsdcBalance(userAddress: string, provider: ethers.BrowserProvider): Promise<string> {
    try {
      const tokenContract = new ethers.Contract(this.usdcAddress, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(userAddress);
      return ethers.formatUnits(balance, 6); // USDC has 6 decimals
    } catch (error) {
      console.error('Error getting USDC balance:', error);
      return '0';
    }
  }

  /**
   * Get user's WFOUNDER balance
   */
  async getWfounderBalance(userAddress: string, provider: ethers.BrowserProvider): Promise<string> {
    try {
      const tokenContract = new ethers.Contract(this.wfounderAddress, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(userAddress);
      return ethers.formatUnits(balance, 18);
    } catch (error) {
      console.error('Error getting WFOUNDER balance:', error);
      return '0';
    }
  }

  /**
   * Calculate price impact based on pool reserves
   */
  private async calculatePriceImpact(
    amountInWei: bigint,
    amountOut: bigint,
    provider: ethers.BrowserProvider
  ): Promise<number> {
    try {
      // Get pool reserves
      const pairContract = new ethers.Contract(this.poolAddress, UNISWAP_V2_PAIR_ABI, provider);
      const reserves = await pairContract.getReserves();
      const token0 = await pairContract.token0();

      // Determine which reserve is USDC and which is WFOUNDER
      const isToken0Usdc = token0.toLowerCase() === this.usdcAddress.toLowerCase();
      const usdcReserve = isToken0Usdc ? reserves.reserve0 : reserves.reserve1;
      const wfounderReserve = isToken0Usdc ? reserves.reserve1 : reserves.reserve0;

      // Calculate current price (WFOUNDER per USDC)
      // Need to account for different decimals: USDC=6, WFOUNDER=18
      const usdcReserveFormatted = Number(usdcReserve) / 1e6;
      const wfounderReserveFormatted = Number(wfounderReserve) / 1e18;
      const currentPrice = wfounderReserveFormatted / usdcReserveFormatted;

      // Calculate execution price
      const amountInFormatted = Number(amountInWei) / 1e6; // USDC input
      const amountOutFormatted = Number(amountOut) / 1e18; // WFOUNDER output
      const executionPrice = amountOutFormatted / amountInFormatted;

      // Price impact as percentage
      const priceImpact = Math.abs((executionPrice - currentPrice) / currentPrice) * 100;

      return Math.min(priceImpact, 100); // Cap at 100%
    } catch (error) {
      console.error('Error calculating price impact:', error);
      return 0; // Return 0% on error
    }
  }

  /**
   * Estimate gas for swap transaction
   */
  private async estimateSwapGas(
    amountInWei: bigint,
    amountOutMin: bigint,
    userAddress: string,
    provider: ethers.BrowserProvider
  ): Promise<bigint> {
    try {
      const signer = await provider.getSigner();
      const routerContract = new ethers.Contract(
        this.routerAddress,
        UNISWAP_V2_ROUTER_ABI,
        signer
      );

      const path = [this.usdcAddress, this.wfounderAddress];
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

      // Estimate gas using the actual user address
      try {
        const gasEstimate = await routerContract.swapExactTokensForTokens.estimateGas(
          amountInWei,
          amountOutMin,
          path,
          userAddress,
          deadline
        );

        // Add 20% buffer for gas estimation
        return gasEstimate + (gasEstimate * BigInt(20) / BigInt(100));
      } catch {
        // Return reasonable default gas limit for token-to-token swaps
        return BigInt(150000);
      }
    } catch (error) {
      console.error('Error estimating gas:', error);
      return BigInt(150000); // Default gas limit
    }
  }
}

export const uniswapService = new UniswapService();
export default uniswapService;