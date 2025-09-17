// Airdrop security and configuration settings
// Centralized configuration for airdrop system security measures

export interface AirdropSecurityConfig {
  // Rate limiting
  maxClaimsPerHour: number;
  maxClaimsPerDay: number;
  cooldownPeriodMinutes: number;
  
  // Validation settings
  minProfileConfidence: number;
  requireProfileCompletion: boolean;
  requireWalletVerification: boolean;
  
  // Treasury monitoring
  minTreasuryBalanceAlert: string; // in WFOUNDER tokens
  maxSingleAirdropAmount: string;
  
  // Security flags
  enableRealTimeValidation: boolean;
  enableTransactionVerification: boolean;
  enableDuplicateWalletCheck: boolean;
}

export const AIRDROP_SECURITY_CONFIG: AirdropSecurityConfig = {
  // Conservative rate limiting to prevent abuse
  maxClaimsPerHour: 100, // System-wide limit
  maxClaimsPerDay: 1000, // System-wide daily limit
  cooldownPeriodMinutes: 5, // Minimum time between attempts for same user

  // Quality gates for airdrop eligibility
  minProfileConfidence: 0.7, // Require 70% confidence in profile
  requireProfileCompletion: true,
  requireWalletVerification: true,

  // Treasury protection
  minTreasuryBalanceAlert: '1000', // Alert when treasury < 1000 WFOUNDER
  maxSingleAirdropAmount: '100', // Maximum tokens per airdrop

  // Security features
  enableRealTimeValidation: true,
  enableTransactionVerification: true,
  enableDuplicateWalletCheck: true,
};

// Helper functions for security validation
export const validateAirdropEligibility = (params: {
  userId: string;
  walletAddress: string;
  profileConfidence: number;
  profileCompleted: boolean;
  existingClaims: number;
  lastClaimTime?: string;
}): { eligible: boolean; reason?: string } => {
  const config = AIRDROP_SECURITY_CONFIG;

  // Check profile confidence
  if (config.requireProfileCompletion && !params.profileCompleted) {
    return { eligible: false, reason: 'Profile assessment not completed' };
  }

  if (params.profileConfidence < config.minProfileConfidence) {
    return { eligible: false, reason: 'Profile confidence too low' };
  }

  // Check for duplicate claims
  if (params.existingClaims > 0) {
    return { eligible: false, reason: 'User has already received an airdrop' };
  }

  // Check cooldown period
  if (params.lastClaimTime) {
    const lastClaim = new Date(params.lastClaimTime);
    const cooldownEnd = new Date(lastClaim.getTime() + (config.cooldownPeriodMinutes * 60 * 1000));
    
    if (new Date() < cooldownEnd) {
      return { 
        eligible: false, 
        reason: `Cooldown period active. Try again in ${Math.ceil((cooldownEnd.getTime() - Date.now()) / (60 * 1000))} minutes` 
      };
    }
  }

  return { eligible: true };
};

export const validateWalletAddress = (address: string): { valid: boolean; reason?: string } => {
  // Basic Ethereum address format check
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  
  if (!ethAddressRegex.test(address)) {
    return { valid: false, reason: 'Invalid wallet address format' };
  }

  // Check for common invalid addresses
  const invalidAddresses = [
    '0x0000000000000000000000000000000000000000', // Zero address
    '0x000000000000000000000000000000000000dEaD', // Dead address
  ];

  if (invalidAddresses.includes(address.toLowerCase())) {
    return { valid: false, reason: 'Cannot send to this address' };
  }

  return { valid: true };
};

export const formatSecurityLog = (event: {
  type: 'airdrop_claim' | 'validation_failed' | 'security_alert';
  userId: string;
  walletAddress?: string;
  reason?: string;
  metadata?: Record<string, any>;
}): string => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    ...event,
  };
  
  return JSON.stringify(logData);
};

// Rate limiting utilities for client-side checks
export const checkRateLimit = (
  attempts: Array<{ timestamp: string }>,
  windowMinutes: number,
  maxAttempts: number
): { allowed: boolean; resetTime?: Date } => {
  const windowStart = new Date(Date.now() - (windowMinutes * 60 * 1000));
  const recentAttempts = attempts.filter(attempt => 
    new Date(attempt.timestamp) > windowStart
  );

  if (recentAttempts.length >= maxAttempts) {
    const oldestAttempt = new Date(Math.min(...recentAttempts.map(a => new Date(a.timestamp).getTime())));
    const resetTime = new Date(oldestAttempt.getTime() + (windowMinutes * 60 * 1000));
    
    return { allowed: false, resetTime };
  }

  return { allowed: true };
};

// Treasury monitoring utilities
export const validateTreasuryBalance = (
  currentBalance: string, 
  requiredAmount: string
): { sufficient: boolean; shortfall?: string } => {
  const current = parseFloat(currentBalance);
  const required = parseFloat(requiredAmount);
  
  if (current < required) {
    return { 
      sufficient: false, 
      shortfall: (required - current).toFixed(6) 
    };
  }

  return { sufficient: true };
};

export const shouldAlertLowBalance = (currentBalance: string): boolean => {
  const current = parseFloat(currentBalance);
  const threshold = parseFloat(AIRDROP_SECURITY_CONFIG.minTreasuryBalanceAlert);
  
  return current < threshold;
};