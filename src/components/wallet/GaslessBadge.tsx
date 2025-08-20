import React from 'react';

// TODO [M6.3] - "No gas needed – fees in NEYXT"
// TODO [M5.4] - Show estimated gas fees in NEYXT
// TODO [M6.4] - Analytics tracking for gasless badge visibility

interface GaslessBadgeProps {
  gasFeeInNeyxt?: string;
  className?: string;
}

export const GaslessBadge: React.FC<GaslessBadgeProps> = ({ 
  gasFeeInNeyxt, 
  className = '' 
}) => {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium ${className}`}>
      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
      <span>Gasless Transaction</span>
      {gasFeeInNeyxt && (
        <span className="text-xs opacity-75">
          (Fees: {gasFeeInNeyxt} NEYXT)
        </span>
      )}
    </div>
  );
};

export default GaslessBadge;
