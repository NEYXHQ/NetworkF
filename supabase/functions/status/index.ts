// M5.3 - GET /api/status for transaction monitoring
// Basic transaction status polling for Polygon network

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

// Status response interface
interface StatusResponse {
  state: 'PENDING' | 'CONFIRMED' | 'FAILED';
  txId?: string;
  blockNumber?: number;
  confirmations?: number;
  details: string;
  route?: {
    source: string;
    routeId: string;
  };
}

// Simple in-memory store for route tracking (in production, use a proper database)
const routeStore = new Map<string, {
  txId?: string;
  userAddress: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  createdAt: number;
  details: string;
}>();

// Polygon RPC endpoint (you may want to use environment variable)
const POLYGON_RPC = 'https://polygon-rpc.com';

// Check transaction status on Polygon
async function checkTransactionStatus(txId: string): Promise<{
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  blockNumber?: number;
  confirmations?: number;
  details: string;
}> {
  try {
    console.log('Checking transaction status:', txId);
    
    // Get transaction receipt
    const receiptResponse = await fetch(POLYGON_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txId],
        id: 1
      })
    });
    
    if (!receiptResponse.ok) {
      throw new Error(`RPC request failed: ${receiptResponse.status}`);
    }
    
    const receiptData = await receiptResponse.json();
    
    if (receiptData.error) {
      throw new Error(`RPC error: ${receiptData.error.message}`);
    }
    
    // If no receipt, transaction is still pending
    if (!receiptData.result) {
      return {
        status: 'PENDING',
        details: 'Transaction is pending confirmation'
      };
    }
    
    const receipt = receiptData.result;
    
    // Check if transaction was successful
    const success = receipt.status === '0x1';
    
    if (!success) {
      return {
        status: 'FAILED',
        blockNumber: parseInt(receipt.blockNumber, 16),
        details: 'Transaction failed during execution'
      };
    }
    
    // Get current block number for confirmations
    const blockResponse = await fetch(POLYGON_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 2
      })
    });
    
    let confirmations = 0;
    if (blockResponse.ok) {
      const blockData = await blockResponse.json();
      if (blockData.result) {
        const currentBlock = parseInt(blockData.result, 16);
        const txBlock = parseInt(receipt.blockNumber, 16);
        confirmations = currentBlock - txBlock;
      }
    }
    
    return {
      status: 'CONFIRMED',
      blockNumber: parseInt(receipt.blockNumber, 16),
      confirmations,
      details: `Transaction confirmed with ${confirmations} confirmations`
    };
    
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return {
      status: 'PENDING',
      details: `Unable to check status: ${error.message}`
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('=== STATUS FUNCTION CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Current timestamp:', new Date().toISOString());
  console.log('===================================');

  // Status endpoint
  if (req.method === 'GET') {
    try {
      // Parse query parameters
      const url = new URL(req.url);
      const routeId = url.searchParams.get('route_id');
      const txId = url.searchParams.get('tx_id');

      // Validate required parameters - need either route_id or tx_id
      if (!routeId && !txId) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required parameters',
            message: 'Either route_id or tx_id is required' 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      let response: StatusResponse;

      if (txId) {
        // Check status by transaction ID directly
        console.log('Checking status for transaction ID:', txId);
        
        const txStatus = await checkTransactionStatus(txId);
        
        response = {
          state: txStatus.status,
          txId: txId,
          blockNumber: txStatus.blockNumber,
          confirmations: txStatus.confirmations,
          details: txStatus.details
        };
        
      } else if (routeId) {
        // Check status by route ID (requires route to be stored)
        console.log('Checking status for route ID:', routeId);
        
        const routeData = routeStore.get(routeId);
        
        if (!routeData) {
          return new Response(
            JSON.stringify({ 
              error: 'Route not found',
              message: `No route found with ID: ${routeId}` 
            }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 404 
            }
          );
        }
        
        if (routeData.txId) {
          // Transaction has been submitted, check its status
          const txStatus = await checkTransactionStatus(routeData.txId);
          
          // Update stored status
          routeData.status = txStatus.status;
          routeData.details = txStatus.details;
          routeStore.set(routeId, routeData);
          
          response = {
            state: txStatus.status,
            txId: routeData.txId,
            blockNumber: txStatus.blockNumber,
            confirmations: txStatus.confirmations,
            details: txStatus.details,
            route: {
              source: '1inch', // For now, all routes use 1inch
              routeId: routeId
            }
          };
          
        } else {
          // Transaction not yet submitted
          response = {
            state: 'PENDING',
            details: 'Transaction not yet submitted',
            route: {
              source: '1inch',
              routeId: routeId
            }
          };
        }
      }

      console.log('Final status response:', response);

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
          message: error.message || 'Unknown error occurred'
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
  }

  // POST method to update route status (for when transaction is submitted)
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { routeId, txId, userAddress } = body;

      if (!routeId || !txId || !userAddress) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required parameters',
            message: 'routeId, txId, and userAddress are required' 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Store or update route data
      routeStore.set(routeId, {
        txId,
        userAddress,
        status: 'PENDING',
        createdAt: Date.now(),
        details: 'Transaction submitted to network'
      });

      console.log('Route updated:', { routeId, txId, userAddress });

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Route status updated'
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );

    } catch (error) {
      console.error('Status update error:', error);
      
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