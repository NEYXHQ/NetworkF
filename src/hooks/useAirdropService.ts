import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useWeb3Auth } from './useWeb3Auth';
import { useSupabaseUser } from './useSupabaseUser';
import { getAirdropConfig, getAllContractAddresses } from '../config/contracts';
import config from '../config/env';

export type AirdropStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AirdropClaim {
  id: string;
  status: AirdropStatus;
  tokenAmount: number;
  transactionHash?: string;
  claimedAt: string;
  processedAt?: string;
  errorMessage?: string;
}

interface AirdropResponse {
  success: boolean;
  claimId?: string;
  transactionHash?: string;
  error?: string;
}

export const useAirdropService = () => {
  const { getAccounts } = useWeb3Auth();
  const { supabaseUser } = useSupabaseUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claim, setClaim] = useState<AirdropClaim | null>(null);

  const airdropConfig = getAirdropConfig();

  // Get user's existing airdrop claim
  const getAirdropClaim = useCallback(async (): Promise<AirdropClaim | null> => {
    console.log('🎯 AIRDROP SERVICE: getAirdropClaim called');
    
    if (!supabaseUser?.id) {
      console.log('🎯 AIRDROP SERVICE: No user ID available');
      return null;
    }

    console.log('🎯 AIRDROP SERVICE: Fetching claim for user:', supabaseUser.id);

    try {
      const { data, error } = await supabase
        .rpc('get_user_airdrop_claim', { user_uuid: supabaseUser.id });

      console.log('🎯 AIRDROP SERVICE: Database response:', { data, error });

      if (error) {
        console.error('🎯 AIRDROP SERVICE: Database error fetching claim:', error);
        return null;
      }

      if (data && data.length > 0) {
        const claimData = data[0];
        console.log('🎯 AIRDROP SERVICE: Found existing claim:', claimData);
        
        const claim = {
          id: claimData.id,
          status: claimData.status as AirdropStatus,
          tokenAmount: parseFloat(claimData.token_amount),
          transactionHash: claimData.transaction_hash,
          claimedAt: claimData.claimed_at,
          processedAt: claimData.processed_at,
          errorMessage: claimData.error_message,
        };
        
        console.log('🎯 AIRDROP SERVICE: Parsed claim data:', claim);
        return claim;
      }

      console.log('🎯 AIRDROP SERVICE: No existing claim found');
      return null;
    } catch (err) {
      console.error('🎯 AIRDROP SERVICE: Exception in getAirdropClaim:', err);
      return null;
    }
  }, [supabaseUser?.id]);

  // Claim airdrop for completed profiler
  const claimAirdrop = useCallback(async (): Promise<boolean> => {
    console.log('🎯 AIRDROP SERVICE: claimAirdrop called');
    console.log('🎯 AIRDROP SERVICE: User ID:', supabaseUser?.id);
    
    // Log complete configuration
    const allAddresses = getAllContractAddresses();
    console.log('🎯 AIRDROP SERVICE: All contract addresses:', allAddresses);
    console.log('🎯 AIRDROP SERVICE: Airdrop config:', airdropConfig);
    console.log('🎯 AIRDROP SERVICE: Environment config:', {
      isDev: config.isDevelopment,
      network: config.network,
      supabaseUrl: config.supabase.url
    });
    
    console.log('🎯 AIRDROP SERVICE: Airdrop enabled:', airdropConfig.enableAirdrop);
    
    if (!supabaseUser?.id || !airdropConfig.enableAirdrop) {
      console.warn('🎯 AIRDROP SERVICE: Airdrop not available - missing user ID or disabled');
      setError('Airdrop not available');
      return false;
    }

    console.log('🎯 AIRDROP SERVICE: Starting airdrop claim process...');
    setIsProcessing(true);
    setError(null);

    try {
      // Get user's wallet address
      console.log('🎯 AIRDROP SERVICE: Getting wallet address...');
      const walletAddresses = await getAccounts();
      console.log('🎯 AIRDROP SERVICE: Raw wallet addresses response:', walletAddresses);
      
      // Handle both array and string responses
      const walletAddress = Array.isArray(walletAddresses) ? walletAddresses[0] : walletAddresses;
      console.log('🎯 AIRDROP SERVICE: Extracted wallet address:', walletAddress);
      console.log('🎯 AIRDROP SERVICE: Wallet address type:', typeof walletAddress);
      console.log('🎯 AIRDROP SERVICE: Wallet address length:', walletAddress?.length);
      
      if (!walletAddress) {
        throw new Error('No wallet address available');
      }

      // Prepare request data
      const requestData = {
        userId: supabaseUser.id,
        walletAddress,
        tokenAmount: airdropConfig.airdropAmount,
      };
      
      console.log('🎯 AIRDROP SERVICE: Request data:', requestData);
      
      // Call Supabase Edge Function to process airdrop
      const functionUrl = `${config.supabase.url}/functions/v1/airdrop-tokens`;
      console.log('🎯 AIRDROP SERVICE: Calling Edge Function:', functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(requestData),
      });

      console.log('🎯 AIRDROP SERVICE: Response status:', response.status);
      console.log('🎯 AIRDROP SERVICE: Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.error('🎯 AIRDROP SERVICE: HTTP error:', response.status, response.statusText);
        let errorDetails = '';
        try {
          const errorJson = await response.json();
          console.error('🎯 AIRDROP SERVICE: Error response JSON:', errorJson);
          errorDetails = errorJson.error || errorJson.message || response.statusText;
        } catch {
          const errorText = await response.text();
          console.error('🎯 AIRDROP SERVICE: Error response body:', errorText);
          errorDetails = errorText || response.statusText;
        }
        throw new Error(`Airdrop failed: ${errorDetails}`);
      }

      const result: AirdropResponse = await response.json();
      console.log('🎯 AIRDROP SERVICE: Edge Function response:', result);

      if (!result.success) {
        console.error('🎯 AIRDROP SERVICE: Edge Function returned failure:', result.error);
        // Include claim ID for debugging if available
        const errorMsg = result.error || 'Airdrop failed';
        const claimInfo = result.claimId ? ` (Claim ID: ${result.claimId})` : '';
        throw new Error(`${errorMsg}${claimInfo}`);
      }

      console.log('🎯 AIRDROP SERVICE: Airdrop successful!', {
        claimId: result.claimId,
        transactionHash: result.transactionHash
      });

      // Fetch updated claim details
      console.log('🎯 AIRDROP SERVICE: Fetching updated claim details...');
      const updatedClaim = await getAirdropClaim();
      console.log('🎯 AIRDROP SERVICE: Updated claim:', updatedClaim);
      setClaim(updatedClaim);

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('🎯 AIRDROP SERVICE: Claim failed with error:', err);
      console.error('🎯 AIRDROP SERVICE: Error message:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
      console.log('🎯 AIRDROP SERVICE: claimAirdrop finished');
    }
  }, [supabaseUser?.id, getAccounts, airdropConfig, getAirdropClaim]);

  // Check airdrop eligibility
  const checkAirdropEligibility = useCallback(async (): Promise<{
    eligible: boolean;
    reason?: string;
    existingClaim?: AirdropClaim;
  }> => {
    console.log('🎯 AIRDROP SERVICE: checkAirdropEligibility called');
    console.log('🎯 AIRDROP SERVICE: Airdrop enabled:', airdropConfig.enableAirdrop);
    console.log('🎯 AIRDROP SERVICE: User ID:', supabaseUser?.id);
    
    if (!airdropConfig.enableAirdrop) {
      console.log('🎯 AIRDROP SERVICE: Airdrops disabled by configuration');
      return { eligible: false, reason: 'Airdrops are currently disabled' };
    }

    if (!supabaseUser?.id) {
      console.log('🎯 AIRDROP SERVICE: User not authenticated');
      return { eligible: false, reason: 'User not authenticated' };
    }

    try {
      // Check if user has existing claim
      console.log('🎯 AIRDROP SERVICE: Checking for existing claim...');
      const existingClaim = await getAirdropClaim();
      
      if (existingClaim) {
        console.log('🎯 AIRDROP SERVICE: Found existing claim:', existingClaim);
        return { 
          eligible: false, 
          reason: 'User has already received an airdrop',
          existingClaim 
        };
      }
      
      console.log('🎯 AIRDROP SERVICE: No existing claim found');

      // Check if user has completed profiler
      console.log('🎯 AIRDROP SERVICE: Checking profiler completion...');
      const { data: userData, error } = await supabase
        .from('users')
        .select('profiler_completed_at, profiler_profile_name')
        .eq('id', supabaseUser.id)
        .single();

      console.log('🎯 AIRDROP SERVICE: User data query result:', { userData, error });

      if (error) {
        console.error('🎯 AIRDROP SERVICE: Error checking user profile completion:', error);
        return { eligible: false, reason: 'Error checking user profile completion' };
      }

      const hasCompletedProfiler = userData?.profiler_completed_at && userData?.profiler_profile_name;
      console.log('🎯 AIRDROP SERVICE: Profiler completion status:', {
        profiler_completed_at: userData?.profiler_completed_at,
        profiler_profile_name: userData?.profiler_profile_name,
        hasCompleted: hasCompletedProfiler
      });

      if (!hasCompletedProfiler) {
        console.log('🎯 AIRDROP SERVICE: Profiler not completed');
        return { eligible: false, reason: 'Profiler assessment not completed' };
      }

      console.log('🎯 AIRDROP SERVICE: User is eligible for airdrop!');
      return { eligible: true };

    } catch (err) {
      console.error('🎯 AIRDROP SERVICE: Exception checking eligibility:', err);
      return { eligible: false, reason: 'Error checking eligibility' };
    }
  }, [supabaseUser?.id, airdropConfig.enableAirdrop, getAirdropClaim]);

  // Refresh claim status
  const refreshClaimStatus = useCallback(async (): Promise<void> => {
    console.log('🎯 AIRDROP SERVICE: refreshClaimStatus called');
    const updatedClaim = await getAirdropClaim();
    console.log('🎯 AIRDROP SERVICE: Refreshed claim data:', updatedClaim);
    setClaim(updatedClaim);
  }, [getAirdropClaim]);

  return {
    // State
    claim,
    isProcessing,
    error,
    airdropEnabled: airdropConfig.enableAirdrop,
    airdropAmount: airdropConfig.airdropAmount,

    // Actions
    claimAirdrop,
    checkAirdropEligibility,
    refreshClaimStatus,
    getAirdropClaim,

    // Utilities
    clearError: () => setError(null),
  };
};