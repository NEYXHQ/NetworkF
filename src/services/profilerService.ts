import { supabase } from '../lib/supabase'

export interface ProfilerResult {
  profileName: string
  profileType: string
  confidence: number
  userId: string
  triggerAirdrop?: boolean // Flag to trigger airdrop after saving
}

export interface ProfilerSession {
  userId: string
  questionsAsked: string[]
  answers: Record<string, string>
  finalProfile: ProfilerResult
  completedAt: string
}

/**
 * Save profiler results to the user's profile in the database
 */
export async function saveProfilerResult(result: ProfilerResult): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 Attempting to save profiler result:', {
      profileName: result.profileName,
      profileType: result.profileType,
      confidence: result.confidence,
      userId: result.userId
    });

    // Check if userId is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.userId);
    
    let query = supabase.from('users').update({
      profiler_profile_name: result.profileName,
      profiler_profile_type: result.profileType,
      profiler_confidence: result.confidence,
      profiler_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (isUUID) {
      query = query.eq('id', result.userId);
      console.log('📝 Using UUID-based update for user ID:', result.userId);
    } else {
      query = query.eq('email', result.userId);
      console.log('📝 Using email-based update for user email:', result.userId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('❌ Error saving profiler result:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Profiler result saved successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('💥 Unexpected error saving profiler result:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Trigger airdrop after successful profiler completion
 */
export async function triggerProfilerAirdrop(
  userId: string, 
  walletAddress: string
): Promise<{ success: boolean; claimId?: string; error?: string }> {
  try {
    console.log('🎁 Triggering airdrop for user:', userId);
    
    // Get airdrop configuration
    const { getAirdropConfig } = await import('../config/contracts');
    const airdropConfig = getAirdropConfig();
    
    if (!airdropConfig.enableAirdrop) {
      console.log('⚠️ Airdrops disabled in configuration');
      return { success: false, error: 'Airdrops are currently disabled' };
    }

    // Call Supabase Edge Function for airdrop processing
    const { data, error } = await supabase.functions.invoke('airdrop-tokens', {
      body: {
        userId,
        walletAddress,
        tokenAmount: airdropConfig.airdropAmount,
      },
    });
    
    if (error) {
      console.error('Error calling airdrop function:', error);
      return { success: false, error: 'Airdrop service unavailable' };
    }
    
    if (data?.success) {
      console.log('✅ Airdrop triggered successfully:', data.claimId);
      return { success: true, claimId: data.claimId };
    } else {
      console.error('❌ Airdrop failed:', data?.error);
      return { success: false, error: data?.error || 'Airdrop failed' };
    }

  } catch (error) {
    console.error('💥 Unexpected error triggering airdrop:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to trigger airdrop' 
    };
  }
}

/**
 * Get profiler results for a specific user
 */
export async function getProfilerResult(userId: string): Promise<{ 
  success: boolean; 
  result?: ProfilerResult; 
  error?: string 
}> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('profiler_profile_name, profiler_profile_type, profiler_confidence, profiler_completed_at')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profiler result:', error)
      return { success: false, error: error.message }
    }

    if (!data.profiler_profile_name || !data.profiler_profile_type) {
      return { success: false, error: 'No profiler result found' }
    }

    const result: ProfilerResult = {
      profileName: data.profiler_profile_name,
      profileType: data.profiler_profile_type,
      confidence: data.profiler_confidence || 0,
      userId
    }

    return { success: true, result }
  } catch (error) {
    console.error('Unexpected error fetching profiler result:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

/**
 * Check if a user has completed the profiler
 */
export async function hasCompletedProfiler(userId: string): Promise<{ 
  success: boolean; 
  completed: boolean; 
  error?: string 
}> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('profiler_completed_at')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking profiler completion:', error)
      return { success: false, completed: false, error: error.message }
    }

    return { success: true, completed: !!data.profiler_completed_at }
  } catch (error) {
    console.error('Unexpected error checking profiler completion:', error)
    return { success: false, completed: false, error: 'Unexpected error occurred' }
  }
}

/**
 * Get all users who have completed the profiler, grouped by profile type
 */
export async function getProfilerStats(): Promise<{ 
  success: boolean; 
  stats?: Record<string, number>; 
  error?: string 
}> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('profiler_profile_type')
      .not('profiler_profile_type', 'is', null)

    if (error) {
      console.error('Error fetching profiler stats:', error)
      return { success: false, error: error.message }
    }

    const stats: Record<string, number> = {}
    data.forEach(user => {
      if (user.profiler_profile_type) {
        stats[user.profiler_profile_type] = (stats[user.profiler_profile_type] || 0) + 1
      }
    })

    return { success: true, stats }
  } catch (error) {
    console.error('Unexpected error fetching profiler stats:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}


