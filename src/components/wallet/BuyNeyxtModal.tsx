import React, { useState } from 'react';
import { useQuote } from '../../hooks/useQuote';
import { QuoteBreakdown } from '../ui/QuoteBreakdown';
import config from '../../config/env';

// M6.1 - 3-step flow (select → quote → confirm) - COMPLETE
// M6.2 - Asset picker (USDC, POL, ETH, FIAT) - COMPLETE  
// M6.3 - Quote display with QuoteBreakdown + GaslessBadge - COMPLETE
// TODO [M6.4] - Confirm + progress; analytics events

interface BuyNeyxtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PayAsset = 'USDC' | 'POL' | 'ETH' | 'FIAT';
type Step = 'select' | 'quote' | 'confirm';

export const BuyNeyxtModal: React.FC<BuyNeyxtModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [selectedAsset, setSelectedAsset] = useState<PayAsset | null>(null);
  const [amount, setAmount] = useState('');
  const { quote, loading, error, getQuote, clearQuote } = useQuote();

  // Reset state when modal closes
  const handleClose = () => {
    setCurrentStep('select');
    setSelectedAsset(null);
    setAmount('');
    clearQuote();
    onClose();
  };

  // Handle asset selection
  const handleAssetSelect = (asset: PayAsset) => {
    if (asset === 'FIAT' && !config.buyFlow.enableFiat) {
      return; // FIAT disabled
    }
    if (asset === 'POL') {
      return; // POL disabled - quote doesn't return valid results
    }
    setSelectedAsset(asset);
    setCurrentStep('quote');
  };

  // Handle quote request
  const handleGetQuote = async () => {
    if (!selectedAsset || !amount) return;

    await getQuote({
      payAsset: selectedAsset,
      payChain: 'polygon',
      amountIn: amount,
      receiveAsset: 'NEYXT',
      receiveChain: 'polygon'
    });
  };

  // Handle going back
  const handleBack = () => {
    if (currentStep === 'quote') {
      setCurrentStep('select');
      clearQuote();
    } else if (currentStep === 'confirm') {
      setCurrentStep('quote');
    }
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 'quote' && quote) {
      setCurrentStep('confirm');
    }
  };

  // Get minimum amount for selected asset
  const getMinAmount = () => {
    if (selectedAsset === 'ETH') return '0.00001';
    return '0.01';
  };

  const getProgressPercentage = () => {
    switch (currentStep) {
      case 'select': return 33;
      case 'quote': return 66;
      case 'confirm': return 100;
      default: return 33;
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'select': return 1;
      case 'quote': return 2;
      case 'confirm': return 3;
      default: return 1;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-gray border border-teal-blue/30 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
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
            onClick={handleClose}
            className="text-soft-white/60 hover:text-soft-white p-2 rounded-lg hover:bg-teal-blue/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current Step Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-soft-white/80">Progress</span>
              <span className="text-xs text-soft-white/60">Step {getStepNumber()} of 3</span>
            </div>
            <div className="flex space-x-2">
              <div className="flex-1 h-2 bg-teal-blue/20 rounded-full overflow-hidden">
                <div className="h-full bg-teal-blue rounded-full" style={{ width: `${getProgressPercentage()}%` }}></div>
              </div>
              <div className="flex-1 h-2 bg-soft-white/10 rounded-full"></div>
              <div className="flex-1 h-2 bg-soft-white/10 rounded-full"></div>
            </div>
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {/* Step 1: Asset Selection */}
            {currentStep === 'select' && (
              <div className="bg-charcoal-black/30 rounded-lg p-4 border border-teal-blue/10">
                <h3 className="text-lg font-medium text-soft-white mb-3">1. Select Payment Asset</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(['USDC', 'POL', 'ETH', 'FIAT'] as PayAsset[]).map((asset) => {
                    const isFiatDisabled = asset === 'FIAT' && !config.buyFlow.enableFiat;
                    const isPolDisabled = asset === 'POL'; // POL disabled - quote issues
                    const isDisabled = isFiatDisabled || isPolDisabled;
                    
                    return (
                      <button
                        key={asset}
                        onClick={() => handleAssetSelect(asset)}
                        disabled={isDisabled}
                        className={`p-3 rounded-lg border transition-colors text-center ${
                          isDisabled
                            ? 'border-soft-white/10 bg-soft-white/5 opacity-50 cursor-not-allowed'
                            : 'border-soft-white/20 hover:border-teal-blue/40 hover:bg-teal-blue/10'
                        }`}
                      >
                        <div className="text-soft-white font-medium">{asset}</div>
                        <div className="text-xs text-soft-white/60">
                          {asset === 'FIAT' ? (isFiatDisabled ? 'Coming Soon' : 'Credit Card') : 
                           asset === 'POL' ? 'Coming Soon' : 'Crypto'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Quote */}
            {currentStep === 'quote' && (
              <div className="bg-charcoal-black/30 rounded-lg p-4 border border-teal-blue/10">
                <h3 className="text-lg font-medium text-soft-white mb-3">
                  2. Get Quote ({selectedAsset})
                </h3>
                
                {/* Amount Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-soft-white/80 mb-2">
                    Amount to spend
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={selectedAsset === 'ETH' ? '0.00001' : '0.5'}
                    min={getMinAmount()}
                    step={selectedAsset === 'ETH' ? '0.00001' : '0.01'}
                    className="w-full px-3 py-2 bg-soft-white/10 border border-soft-white/20 rounded-lg text-soft-white placeholder-soft-white/40 focus:border-teal-blue/40 focus:outline-none"
                  />
                  <p className="text-xs text-soft-white/60 mt-1">
                    Minimum: {getMinAmount()} {selectedAsset}
                  </p>
                </div>

                {/* Get Quote Button */}
                <button
                  onClick={handleGetQuote}
                  disabled={!amount || loading}
                  className="w-full mb-4 px-4 py-2 bg-teal-blue text-charcoal-black rounded-lg hover:bg-teal-blue/80 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Getting Quote...' : 'Get Quote'}
                </button>

                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Quote Display */}
                {quote && (
                  <QuoteBreakdown quote={quote} className="bg-soft-white/5" />
                )}
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 'confirm' && quote && (
              <div className="bg-charcoal-black/30 rounded-lg p-4 border border-teal-blue/10">
                <h3 className="text-lg font-medium text-soft-white mb-3">3. Confirm Purchase</h3>
                
                {/* Final Quote Summary */}
                <QuoteBreakdown quote={quote} className="mb-4 bg-soft-white/5" />
                
                {/* Execution Button */}
                <button
                  disabled
                  className="w-full px-4 py-2 bg-soft-white/10 text-soft-white/60 rounded-lg cursor-not-allowed text-sm font-medium"
                >
                  Execute Trade (Not Implemented)
                </button>
                
                <p className="text-xs text-soft-white/60 mt-2 text-center">
                  Trade execution will be implemented in M5
                </p>
              </div>
            )}
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
        
        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-teal-blue/20 bg-charcoal-black/20">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-soft-white/60 hover:text-soft-white transition-colors"
          >
            Close
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handleBack}
              disabled={currentStep === 'select'}
              className="px-4 py-2 bg-soft-white/10 text-soft-white rounded-lg hover:bg-soft-white/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep !== 'quote' || !quote}
              className="px-4 py-2 bg-teal-blue text-charcoal-black rounded-lg hover:bg-teal-blue/80 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === 'confirm' ? 'Execute' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyNeyxtModal;
