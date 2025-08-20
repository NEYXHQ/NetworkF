import React from 'react';

// TODO [M6.1] - 3-step flow (select → quote → confirm)
// TODO [M6.2] - Asset picker (USDC, POL, ETH, FIAT)
// TODO [M6.3] - Quote display with QuoteBreakdown + GaslessBadge
// TODO [M6.4] - Confirm + progress; analytics events

interface BuyNeyxtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuyNeyxtModal: React.FC<BuyNeyxtModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Buy NEYXT</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            TODO: Implement 3-step buy flow
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>1. Select payment asset</p>
            <p>2. Get quote</p>
            <p>3. Confirm purchase</p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default BuyNeyxtModal;
