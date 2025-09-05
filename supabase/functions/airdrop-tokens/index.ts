// Supabase Edge Function for processing NEYXT token airdrops
// Handles automated token distribution for profiler completion rewards

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6'

// NEYXT Token ABI (ERC-20 transfer function)
const NEYXT_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

interface AirdropRequest {
  userId: string;
  walletAddress: string;
  tokenAmount: string;
}

interface AirdropResponse {
  success: boolean;
  claimId?: string;
  transactionHash?: string;
  error?: string;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse request body
    const { userId, walletAddress, tokenAmount }: AirdropRequest = await req.json();
    
    // Log received data for debugging
    console.log('🎯 AIRDROP EDGE FUNCTION: Received request data:', {
      userId,
      walletAddress,
      tokenAmount,
      walletAddressType: typeof walletAddress,
      walletAddressLength: walletAddress?.length
    });

    // Validate request
    if (!userId || !walletAddress || !tokenAmount) {
      console.error('🎯 AIRDROP EDGE FUNCTION: Missing required fields:', {
        hasUserId: !!userId,
        hasWalletAddress: !!walletAddress,
        hasTokenAmount: !!tokenAmount
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: userId, walletAddress, tokenAmount' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate wallet address format
    const isValidAddress = ethers.isAddress(walletAddress);
    console.log('🎯 AIRDROP EDGE FUNCTION: Wallet address validation:', {
      address: walletAddress,
      isValid: isValidAddress,
      addressType: typeof walletAddress,
      addressLength: walletAddress?.length
    });
    
    if (!isValidAddress) {
      console.error('🎯 AIRDROP EDGE FUNCTION: Invalid wallet address format:', walletAddress);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid wallet address format: "${walletAddress}" (type: ${typeof walletAddress}, length: ${walletAddress?.length})` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user has already received an airdrop
    const { data: existingClaim } = await supabase
      .from('airdrop_claims')
      .select('id, status')
      .eq('user_id', userId)
      .single();

    if (existingClaim) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User has already received an airdrop',
          claimId: existingClaim.id
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify user has completed profiler
    const { data: user } = await supabase
      .from('users')
      .select('profiler_completed_at, profiler_profile_name')
      .eq('id', userId)
      .single();

    if (!user?.profiler_completed_at || !user?.profiler_profile_name) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User must complete profiler assessment to receive airdrop' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create initial airdrop claim record
    const { data: claim, error: claimError } = await supabase
      .from('airdrop_claims')
      .insert({
        user_id: userId,
        wallet_address: walletAddress,
        token_amount: parseFloat(tokenAmount),
        status: 'processing'
      })
      .select('id')
      .single();

    if (claimError || !claim) {
      console.error('Error creating airdrop claim:', claimError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create airdrop claim record' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      // Get environment configuration
      const treasuryPrivateKey = Deno.env.get('VITE_POLYGON_TREASURY_WALLET_PRIVATE_KEY');
      const neyxtContractAddress = Deno.env.get('VITE_POLYGON_NEYXT_CONTRACT_ADDRESS');
      
      // Network configuration following src/config/networks.ts pattern
      // Edge Function needs explicit environment detection since it can't use import.meta.env.DEV
      
      // Option 1: Use explicit environment variable to determine network
      const networkEnv = Deno.env.get('NETWORK_ENVIRONMENT'); // 'development' | 'production'
      
      // Option 2: Auto-detect based on common environment patterns
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const isDevelopment = networkEnv === 'development' || 
                          supabaseUrl.includes('kxepoivhqnurxmkgiojo') || // Your dev project
                          Deno.env.get('NODE_ENV') === 'development';
      
      // Use network configuration similar to src/config/networks.ts
      const networkConfig = isDevelopment ? {
        name: 'Polygon Amoy Testnet',
        chainId: '80002',
        rpcUrl: 'https://rpc-amoy.polygon.technology',
        isTestnet: true
      } : {
        name: 'Polygon Mainnet', 
        chainId: '137',
        rpcUrl: 'https://polygon-rpc.com',
        isTestnet: false
      };
      
      // Allow explicit RPC URL override
      const rpcUrl = Deno.env.get('POLYGON_RPC_URL') || networkConfig.rpcUrl;

      // Log all configuration for debugging
      console.log('🎯 AIRDROP EDGE FUNCTION: Environment configuration:', {
        treasuryPrivateKeyExists: !!treasuryPrivateKey,
        treasuryPrivateKeyLength: treasuryPrivateKey?.length,
        neyxtContractAddress,
        rpcUrl,
        networkConfiguration: {
          networkEnv: networkEnv || 'NOT SET',
          supabaseUrl,
          nodeEnv: Deno.env.get('NODE_ENV') || 'NOT SET',
          isDevelopment,
          selectedNetwork: networkConfig.name,
          chainId: networkConfig.chainId,
          isTestnet: networkConfig.isTestnet,
          rpcUrlSource: Deno.env.get('POLYGON_RPC_URL') ? 'explicit env var' : 'auto-detected from network config'
        },
        allEnvVars: {
          VITE_POLYGON_TREASURY_WALLET_PRIVATE_KEY: treasuryPrivateKey ? `${treasuryPrivateKey.slice(0, 10)}...` : 'NOT SET',
          VITE_POLYGON_NEYXT_CONTRACT_ADDRESS: neyxtContractAddress || 'NOT SET',
          POLYGON_RPC_URL: Deno.env.get('POLYGON_RPC_URL') || 'NOT SET (using auto-detection)',
          VITE_POLYGON_TREASURY_WALLET_ADDRESS: Deno.env.get('VITE_POLYGON_TREASURY_WALLET_ADDRESS') || 'NOT SET',
          VITE_NEYXT_AIRDROP_AMOUNT_FOR_SURVEY_COMPLETION: Deno.env.get('VITE_NEYXT_AIRDROP_AMOUNT_FOR_SURVEY_COMPLETION') || 'NOT SET'
        }
      });

      if (!treasuryPrivateKey || !neyxtContractAddress || !rpcUrl) {
        const missingVars = [];
        if (!treasuryPrivateKey) missingVars.push('VITE_POLYGON_TREASURY_WALLET_PRIVATE_KEY');
        if (!neyxtContractAddress) missingVars.push('VITE_POLYGON_NEYXT_CONTRACT_ADDRESS');
        if (!rpcUrl) missingVars.push('POLYGON_RPC_URL');
        
        console.error('🎯 AIRDROP EDGE FUNCTION: Missing environment variables:', missingVars);
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }

      // Initialize blockchain provider and wallet
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const treasuryWallet = new ethers.Wallet(treasuryPrivateKey, provider);
      
      console.log('🎯 AIRDROP EDGE FUNCTION: Blockchain connection setup:', {
        rpcUrl,
        treasuryWalletAddress: treasuryWallet.address,
        neyxtContractAddress,
        networkFromProvider: await provider.getNetwork().then(n => ({ name: n.name, chainId: n.chainId.toString() })).catch(() => 'Failed to get network')
      });

      // Initialize NEYXT token contract
      const neyxtContract = new ethers.Contract(neyxtContractAddress, NEYXT_ABI, treasuryWallet);
      
      console.log('🎯 AIRDROP EDGE FUNCTION: Attempting to call decimals() on contract...');

      // Get token decimals
      const decimals = await neyxtContract.decimals();
      console.log('🎯 AIRDROP EDGE FUNCTION: Contract decimals:', decimals);
      
      // Convert token amount to proper units (assuming tokenAmount is in human-readable format)
      const tokenAmountWei = ethers.parseUnits(tokenAmount, decimals);

      // Check treasury balance
      const treasuryBalance = await neyxtContract.balanceOf(treasuryWallet.address);
      if (treasuryBalance < tokenAmountWei) {
        throw new Error('Insufficient treasury balance for airdrop');
      }

      // Execute token transfer
      console.log(`Sending ${tokenAmount} NEYXT to ${walletAddress} for user ${userId}`);
      const transferTx = await neyxtContract.transfer(walletAddress, tokenAmountWei);
      
      // Wait for transaction confirmation
      const receipt = await transferTx.wait();
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed on blockchain');
      }

      // Update airdrop claim with success
      const { error: updateError } = await supabase
        .from('airdrop_claims')
        .update({
          status: 'completed',
          transaction_hash: receipt.hash,
          processed_at: new Date().toISOString()
        })
        .eq('id', claim.id);

      if (updateError) {
        console.error('Error updating airdrop claim:', updateError);
        // Transaction succeeded but DB update failed - log for manual resolution
      }

      console.log(`Airdrop successful: ${receipt.hash}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          claimId: claim.id,
          transactionHash: receipt.hash
        } as AirdropResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (blockchainError) {
      console.error('Blockchain transaction failed:', blockchainError);
      
      // Update claim status to failed
      await supabase
        .from('airdrop_claims')
        .update({
          status: 'failed',
          error_message: blockchainError instanceof Error ? blockchainError.message : 'Unknown blockchain error',
          processed_at: new Date().toISOString()
        })
        .eq('id', claim.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Blockchain transaction failed',
          claimId: claim.id
        } as AirdropResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Airdrop function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      } as AirdropResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});