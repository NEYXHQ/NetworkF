// Transak webhook handler for onramp success → autoswap NEYXT
// ✅ TRANSAK_API_KEY configured in Supabase secrets
// 🧩 [M7.2] - Verify HMAC (ONRAMP_WEBHOOK_SECRET) - TODO: Implement signature verification
// 🧩 [M7.2] - Must be idempotent (no double swaps on retries) - TODO: Add idempotency logic
// 🧩 [M7.4] - Server-initiated autoswap USDC→NEYXT via /api/execute - TODO: Connect to execute endpoint

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Process Transak webhook events
  if (req.method === 'POST') {
    try {
      // Get request body
      const body = await req.text();
      
      // Get Transak API key from environment
      const transakApiKey = Deno.env.get('TRANSAK_API_KEY');
      if (!transakApiKey) {
        console.error('TRANSAK_API_KEY not configured');
        return new Response(
          JSON.stringify({ error: 'Transak API key not configured' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      // TODO: Verify HMAC signature using ONRAMP_WEBHOOK_SECRET
      // TODO: Parse onramp webhook event
      // TODO: Check for successful onramp completion
      // TODO: Trigger autoswap to NEYXT
      // TODO: Ensure idempotency
      
      console.log('Transak webhook endpoint called - processing webhook');
      
      // Parse webhook data (placeholder - will be enhanced)
      let webhookData;
      try {
        webhookData = JSON.parse(body);
        console.log('Webhook data received:', webhookData);
      } catch (parseError) {
        console.error('Failed to parse webhook body:', parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid webhook payload' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      
      const response = {
        message: 'Transak webhook processed successfully',
        status: 'processing',
        timestamp: new Date().toISOString(),
        webhookData: webhookData,
        transakApiKeyConfigured: !!transakApiKey,
        nextSteps: [
          'Verify webhook signature',
          'Parse onramp completion event',
          'Trigger autoswap to NEYXT',
          'Ensure idempotency'
        ]
      };

      return new Response(
        JSON.stringify(response),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    } catch (error) {
      console.error('Onramp webhook endpoint error:', error);
      
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          message: error.message 
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
