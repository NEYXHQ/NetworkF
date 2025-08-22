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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-gray border border-teal-blue/30 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-teal-blue/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-teal-blue/20 rounded-lg flex items-center justify-center">
              <span className="text-teal-blue text-lg font-bold">N</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-soft-white">Buy NEYXT</h2>
              <p className="text-xs text-soft-white/60">Development Testing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-soft-white/60 hover:text-soft-white p-2 rounded-lg hover:bg-teal-blue/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Current Step Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-soft-white/80">Progress</span>
              <span className="text-xs text-soft-white/60">Step 1 of 3</span>
            </div>
            <div className="flex space-x-2">
              <div className="flex-1 h-2 bg-teal-blue/20 rounded-full overflow-hidden">
                <div className="h-full bg-teal-blue rounded-full" style={{ width: '33%' }}></div>
              </div>
              <div className="flex-1 h-2 bg-soft-white/10 rounded-full"></div>
              <div className="flex-1 h-2 bg-soft-white/10 rounded-full"></div>
            </div>
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {/* Step 1: Asset Selection */}
            <div className="bg-charcoal-black/30 rounded-lg p-4 border border-teal-blue/10">
              <h3 className="text-lg font-medium text-soft-white mb-3">1. Select Payment Asset</h3>
              <div className="grid grid-cols-2 gap-3">
                {['USDC', 'POL', 'ETH', 'FIAT'].map((asset) => (
                  <button
                    key={asset}
                    className="p-3 rounded-lg border border-soft-white/20 hover:border-teal-blue/40 hover:bg-teal-blue/10 transition-colors text-center"
                  >
                    <div className="text-soft-white font-medium">{asset}</div>
                    <div className="text-xs text-soft-white/60">
                      {asset === 'FIAT' ? 'Credit Card' : 'Crypto'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Quote (Placeholder) */}
            <div className="bg-charcoal-black/30 rounded-lg p-4 border border-soft-white/10 opacity-50">
              <h3 className="text-lg font-medium text-soft-white/60 mb-3">2. Get Quote</h3>
              <div className="text-center py-4">
                <p className="text-soft-white/40 text-sm">Quote will be fetched from 0x API</p>
                <p className="text-soft-white/30 text-xs mt-1">Price validation vs QuickSwap pool</p>
              </div>
            </div>

            {/* Step 3: Confirmation (Placeholder) */}
            <div className="bg-charcoal-black/30 rounded-lg p-4 border border-soft-white/10 opacity-50">
              <h3 className="text-lg font-medium text-soft-white/60 mb-3">3. Confirm Purchase</h3>
              <div className="text-center py-4">
                <p className="text-soft-white/40 text-sm">Gasless execution via Biconomy</p>
                <p className="text-soft-white/30 text-xs mt-1">Fees paid in NEYXT</p>
              </div>
            </div>
          </div>

          {/* Development Notice */}
          <div className="mt-6 p-4 bg-princeton-orange/10 border border-princeton-orange/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-princeton-orange/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-princeton-orange text-xs font-bold">!</span>
              </div>
              <div className="text-sm">
                <p className="text-princeton-orange font-medium mb-1">Development Mode</p>
                <p className="text-princeton-orange/80 text-xs">
                  This is a scaffolded UI for testing the buy flow. No actual transactions will be executed.
                  Implementation will connect to 0x API, Biconomy paymaster, and QuickSwap reference pool.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-teal-blue/20 bg-charcoal-black/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-soft-white/60 hover:text-soft-white transition-colors"
          >
            Close
          </button>
          <div className="flex space-x-3">
            <button
              className="px-4 py-2 bg-soft-white/10 text-soft-white rounded-lg hover:bg-soft-white/20 transition-colors text-sm"
              disabled
            >
              Previous
            </button>
            <button
              className="px-4 py-2 bg-teal-blue text-charcoal-black rounded-lg hover:bg-teal-blue/80 transition-colors text-sm font-medium"
              disabled
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyNeyxtModal;
