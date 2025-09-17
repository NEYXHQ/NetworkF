import React from 'react';

// TODO [M4.4] - Quote/fees/slippage summary UI
// TODO [M4.2] - Display amount_out_est, price, fees, slippage
// TODO [M4.3] - Show gas_in_wfounder_est and warnings
// TODO [M6.4] - Analytics for quote display

interface QuoteBreakdownProps {
  quote?: {
    amountOutEst: string;
    price: string;
    usdEquivalent?: string; // USD value of the purchase
    wfounderPriceUsd?: string; // USD price for 1 WFOUNDER token
    fees: {
      protocol: string;
      gasInPolEst: string;
    };
    slippageBps: number;
    warnings: string[];
    priceImpact?: string; // Add price impact
  };
  className?: string;
}

export const QuoteBreakdown: React.FC<QuoteBreakdownProps> = ({ 
  quote, 
  className = '' 
}) => {
  if (!quote) {
    return (
      <div className={`border border-gray-200 rounded-lg p-4 bg-gray-50 ${className}`}>
        <p className="text-gray-500 text-center">No quote available</p>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
      <h4 className="font-semibold mb-3">Quote Breakdown</h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">You'll receive:</span>
          <span className="font-medium">{quote.amountOutEst} WFOUNDER</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Price:</span>
          <span className="font-medium">{quote.price}</span>
        </div>
        
        {quote.usdEquivalent && (
          <div className="flex justify-between">
            <span className="text-gray-600">Total cost:</span>
            <span className="font-medium">${quote.usdEquivalent}</span>
          </div>
        )}
        
        {quote.wfounderPriceUsd && (
          <div className="flex justify-between">
            <span className="text-gray-600">WFOUNDER price:</span>
            <span className="font-medium">${quote.wfounderPriceUsd} per token</span>
          </div>
        )}
        
        {quote.priceImpact && (
          <div className="flex justify-between">
            <span className="text-gray-600">Price impact:</span>
            <span className="font-medium">{quote.priceImpact}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-600">Protocol fees:</span>
          <span className="font-medium">{quote.fees.protocol}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Gas fees (POL):</span>
          <span className="font-medium">{quote.fees.gasInPolEst}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Slippage:</span>
          <span className="font-medium">{quote.slippageBps / 100}%</span>
        </div>
      </div>
      
      {quote.warnings.length > 0 && (
        <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
          <p className="text-yellow-800 text-xs font-medium">Warnings:</p>
          <ul className="text-yellow-700 text-xs mt-1">
            {quote.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QuoteBreakdown;
