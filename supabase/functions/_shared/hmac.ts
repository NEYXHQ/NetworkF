// TODO [M7.2] - Verify onramp webhook (HMAC)
// TODO [M7.2] - HMAC signature validation
// TODO [M7.2] - Webhook security utilities

export interface HmacConfig {
  secret: string;
  algorithm: 'sha256' | 'sha512';
}

export interface WebhookVerification {
  valid: boolean;
  message: string;
  signature?: string;
}

export class HmacService {
  private config: HmacConfig;

  constructor(config: HmacConfig) {
    this.config = config;
  }

  generateSignature(payload: string): string {
    // TODO: Implement actual HMAC signature generation
    console.log('Generating HMAC signature for payload:', payload);
    
    // Placeholder response - this should use crypto.subtle.importKey and crypto.subtle.sign
    return 'mock-hmac-signature';
  }

  verifySignature(
    payload: string,
    signature: string,
    timestamp?: number
  ): WebhookVerification {
    // TODO: Implement actual HMAC signature verification
    console.log('Verifying HMAC signature:', { payload, signature, timestamp });
    
    // Placeholder validation
    if (!signature) {
      return {
        valid: false,
        message: 'No signature provided'
      };
    }
    
    if (signature === 'mock-hmac-signature') {
      return {
        valid: true,
        message: 'Signature verified (mock)',
        signature
      };
    }
    
    return {
      valid: false,
      message: 'Invalid signature'
    };
  }

  verifyTimestamp(timestamp: number, toleranceMs: number = 300000): boolean {
    // 5 minute tolerance by default
    const now = Date.now();
    const diff = Math.abs(now - timestamp);
    
    return diff <= toleranceMs;
  }

  validateWebhookRequest(
    body: string,
    signature: string,
    timestamp?: number
  ): WebhookVerification {
    // Validate timestamp if provided
    if (timestamp && !this.verifyTimestamp(timestamp)) {
      return {
        valid: false,
        message: 'Request timestamp expired or too far in the future'
      };
    }
    
    // Verify signature
    return this.verifySignature(body, signature, timestamp);
  }

  getHmacHeaders(payload: string): Record<string, string> {
    const signature = this.generateSignature(payload);
    const timestamp = Date.now();
    
    return {
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp.toString(),
      'Content-Type': 'application/json'
    };
  }
}

export const createHmacService = (config: HmacConfig): HmacService => {
  return new HmacService(config);
};

// Utility function for extracting signature from headers
export const extractSignatureFromHeaders = (headers: Headers): string | null => {
  return headers.get('X-Webhook-Signature') || 
         headers.get('X-Hub-Signature-256') || 
         headers.get('Authorization')?.replace('Bearer ', '') ||
         null;
};

// Utility function for extracting timestamp from headers
export const extractTimestampFromHeaders = (headers: Headers): number | null => {
  const timestamp = headers.get('X-Webhook-Timestamp') || 
                   headers.get('X-Hub-Timestamp');
  
  return timestamp ? parseInt(timestamp, 10) : null;
};
