import { useState, useCallback } from 'react';
import { swapService, type SwapExecuteRequest, type SwapStatusResponse } from '../services/swapService';

// M5.5 - Orchestrate quote → execute → status - IN PROGRESS
// M5.4 - Handle traditional gas payment (no paymaster) - COMPLETE
// M6.4 - Analytics tracking for buy flow events - TODO

interface BuyRequest {
  routeId: string;
  userAddress: string;
  payAsset: string;
  receiveAsset: string;
  amountIn: string;
  slippagePercentage?: number;
}

interface BuyResponse {
  // If approval is needed, this will be the approval transaction
  approvalTx?: {
    to: string;
    data: string;
    value: string;
    gasLimit: string;
    gasPrice: string;
  };
  // The main swap transaction
  txData: {
    to: string;
    data: string;
    value: string;
    gasLimit: string;
    gasPrice: string;
  };
  statusUrl: string;
  estimatedGas: string;
  route: {
    source: string;
    routeId: string;
  };
  // Approval info
  requiresApproval?: boolean;
  approvalToken?: string;
}

type BuyStatus = SwapStatusResponse;

export const useBuyNeyxt = () => {
  const [buying, setBuying] = useState(false);
  const [status, setStatus] = useState<BuyStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeBuy = useCallback(async (request: BuyRequest): Promise<BuyResponse | null> => {
    setBuying(true);
    setError(null);
    
    try {
      console.log('Executing buy with:', request);
      
      // Call the swap service to prepare transaction
      const executeRequest: SwapExecuteRequest = {
        routeId: request.routeId,
        userAddress: request.userAddress,
        payAsset: request.payAsset,
        receiveAsset: request.receiveAsset,
        amountIn: request.amountIn,
        slippagePercentage: request.slippagePercentage
      };
      
      const response = await swapService.executeSwap(executeRequest);
      console.log('Execute response:', response);
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute buy';
      setError(errorMessage);
      return null;
    } finally {
      setBuying(false);
    }
  }, []);

  const checkStatus = useCallback(async (routeId?: string, txId?: string): Promise<BuyStatus | null> => {
    try {
      console.log('Checking status for:', { routeId, txId });
      
      const status = await swapService.getSwapStatus(routeId, txId);
      console.log('Status response:', status);
      
      setStatus(status);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check status';
      setError(errorMessage);
      return null;
    }
  }, []);

  const updateRouteStatus = useCallback(async (routeId: string, txId: string, userAddress: string): Promise<void> => {
    try {
      console.log('Updating route status:', { routeId, txId, userAddress });
      
      await swapService.updateRouteStatus(routeId, txId, userAddress);
      console.log('Route status updated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update route status';
      setError(errorMessage);
    }
  }, []);

  const clearBuyState = useCallback(() => {
    setStatus(null);
    setError(null);
  }, []);

  return {
    buying,
    status,
    error,
    executeBuy,
    checkStatus,
    updateRouteStatus,
    clearBuyState
  };
};
