// TODO [M5.3] - GET /api/status (poll tx/route)
// TODO [M5.4] - Return transaction status and details
// TODO [M5.5] - Handle route status tracking

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Health check - no business logic yet
  if (req.method === 'GET') {
    try {
      // TODO: Parse route_id query parameter
      // TODO: Fetch transaction status from blockchain
      // TODO: Return status response with state and details
      
      console.log('Status endpoint called - health check response');
      
      const response = {
        message: 'Status endpoint - health check OK',
        status: 'placeholder',
        timestamp: new Date().toISOString(),
        note: 'Business logic not yet implemented',
        mockResponse: {
          state: 'PENDING',
          txIds: ['mock-tx-id'],
          details: 'Mock status - not for production use'
        }
      };

      return new Response(
        JSON.stringify(response),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    } catch (error) {
      console.error('Status endpoint error:', error);
      
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
