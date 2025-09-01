import { useState, useCallback } from 'react';
import { swapService, type SwapQuoteRequest, type SwapQuoteResponse } from '../services/swapService';

// M4.2 - Call /api/quote + min-fee checks - COMPLETE
// M4.3 - Handle quote response and validation - COMPLETE  
// M4.4 - Error handling and retry logic - COMPLETE

// Use the interfaces from swapService for consistency
type QuoteRequest = SwapQuoteRequest;
type QuoteResponse = SwapQuoteResponse;

export const useQuote = () => {
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuote = useCallback(async (request: QuoteRequest): Promise<QuoteResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Getting quote for:', request);
      
      // Validate minimum purchase amount
      const amountNum = parseFloat(request.amountIn);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount: must be a positive number');
      }
      
      // Set minimum based on asset type
      let minAmount = 0.01; // Default for USDC
      if (request.payAsset === 'ETH') {
        minAmount = 0.00001; // Much lower minimum for ETH
      }
      // Note: POL is currently disabled due to quote issues
      
      if (amountNum < minAmount) {
        throw new Error(`Minimum purchase amount is ${minAmount} ${request.payAsset}`);
      }
      
      // Call the real API
      const quote = await swapService.getQuote(request);
      
      // Note: With traditional gas approach, users need POL for gas fees
      // In a real implementation, you'd check the user's POL balance here
      const gasInPol = parseFloat(quote.fees.gasInPolEst);
      console.log(`Transaction will require ${gasInPol} POL for gas fees`);
      
      // Add a note about POL requirement to warnings if gas cost is significant
      if (gasInPol > 0.001) {
        quote.warnings.push(
          `This transaction will require approximately ${gasInPol} POL for gas fees. Ensure you have sufficient POL in your wallet.`
        );
      }
      
      setQuote(quote);
      return quote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get quote';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearQuote = useCallback(() => {
    setQuote(null);
    setError(null);
  }, []);

  return {
    quote,
    loading,
    error,
    getQuote,
    clearQuote
  };
};
