import React, { useState, useEffect } from 'react';
import { useUniswapSwap } from '../../hooks/useUniswapSwap';
import { CONTRACT_ADDRESSES } from '../../config/contracts';

// Simplified USDC → WFOUNDER buy flow using direct Uniswap integration
// 3-step flow: Enter Amount → Review → Execute

interface BuyWfounderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'amount' | 'review' | 'approve' | 'executing' | 'success' | 'error';

export const BuyWfounderModal: React.FC<BuyWfounderModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(1); // 1% default slippage
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isExecutingApproval, setIsExecutingApproval] = useState(false);
  const {
    quote,
    isLoadingQuote,
    isExecuting,
    txHash,
    error,
    usdcBalance,
    wfounderBalance,
    userAddress,
    isConnected,
    getQuote,
    executeSwap,
    checkApprovalNeeded,
    executeApproval,
    clearSwapState
  } = useUniswapSwap();

  // Get quote when amount changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (amount && parseFloat(amount) > 0) {
        getQuote(amount, slippage);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [amount, slippage, getQuote]);

  // Clean state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, clearing any stale state');
      clearSwapState();
      setCurrentStep('amount');
      setAmount('');
      setSlippage(1);
      setNeedsApproval(false);
      setIsExecutingApproval(false);
    }
  }, [isOpen, clearSwapState]);

  // Reset state when modal closes
  const handleClose = () => {
    setCurrentStep('amount');
    setAmount('');
    setSlippage(1);
    setNeedsApproval(false);
    setIsExecutingApproval(false);
    clearSwapState();
    onClose();
  };

  // Handle amount input
  const handleAmountChange = (value: string) => {
    setAmount(value);
  };

  // Handle slippage change
  const handleSlippageChange = (value: number) => {
    setSlippage(value);
  };


  // Handle next step
  const handleNext = async () => {
    if (currentStep === 'amount' && quote && !isLoadingQuote) {
      // Check if USDC approval is needed
      try {
        const approvalNeeded = await checkApprovalNeeded(CONTRACT_ADDRESSES.USDC, amount);
        setNeedsApproval(approvalNeeded);

        if (approvalNeeded) {
          setCurrentStep('approve');
        } else {
          setCurrentStep('review');
        }
      } catch (error) {
        console.error('Error checking approval:', error);
        setCurrentStep('review'); // Proceed to review if check fails
      }
    }
  };

  // Handle approval execution
  const handleApprovalExecute = async () => {
    if (!amount || !userAddress) {
      console.error('Missing required data for approval');
      return;
    }

    setIsExecutingApproval(true);

    try {
      const success = await executeApproval(CONTRACT_ADDRESSES.USDC, amount);
      if (success) {
        console.log('Approval successful and confirmed');
        // Move to review step after successful approval
        setCurrentStep('review');
        // Reset approval flag since we now have approval
        setNeedsApproval(false);
      }
    } catch (error) {
      console.error('Error executing approval:', error);
    } finally {
      setIsExecutingApproval(false);
    }
  };

  // Handle swap execution
  const handleExecute = async () => {
    if (!amount || !quote || !userAddress) {
      console.error('Missing required data for execution');
      return;
    }

    setCurrentStep('executing');

    try {
      const success = await executeSwap({
        amountIn: amount,
        slippagePercentage: slippage,
        deadline: 20 // 20 minutes
      });

      if (success) {
        setCurrentStep('success');
      } else {
        setCurrentStep('error');
      }
    } catch (error) {
      console.error('Error executing swap:', error);
      setCurrentStep('error');
    }
  };

  // Get minimum amount for USDC
  const getMinAmount = () => {
    return '0.01'; // 0.01 USDC minimum
  };

  const getProgressBars = () => {
    // Returns [bar1%, bar2%, bar3%] for the 3 progress bars
    switch (currentStep) {
      case 'amount':
        if (!amount || !quote) return [0, 0, 0]; // No amount entered yet
        return [100, 0, 0]; // Amount entered and quote received
      case 'approve':
        return [100, 50, 0]; // Approval step (partial progress on step 2)
      case 'review':
        return [100, 100, 0]; // Ready to execute
      case 'executing':
        return [100, 100, 50]; // Transaction running
      case 'success':
      case 'error':
        return [100, 100, 100]; // Complete
      default:
        return [0, 0, 0];
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'amount': return 1;
      case 'approve': return 2;
      case 'review': return 2;
      case 'executing': return 3;
      case 'success':
      case 'error': return 3;
      default: return 1;
    }
  };

  const getTotalSteps = () => {
    return 3;
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
              <h2 className="text-xl font-semibold text-soft-white">Buy WFOUNDER</h2>
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
              <span className="text-xs text-soft-white/60">Step {getStepNumber()} of {getTotalSteps()}</span>
            </div>
            <div className="flex space-x-2">
              {[0, 1, 2].map((index) => {
                const progress = getProgressBars()[index] || 0;
                return (
                  <div key={index} className="flex-1 h-2 bg-teal-blue/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-blue rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {/* Step 1: Enter Amount */}
            {currentStep === 'amount' && (
              <div className="bg-charcoal-black/30 rounded-lg p-4 border border-teal-blue/10">
                <h3 className="text-lg font-medium text-soft-white mb-3">1. Enter USDC Amount</h3>

                {/* Balance Display */}
                {isConnected && (
                  <div className="mb-4 p-3 bg-soft-white/5 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-soft-white/80">Your USDC Balance:</span>
                      <span className="text-soft-white font-medium">{parseFloat(usdcBalance).toFixed(2)} USDC</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-soft-white/80">Your WFOUNDER Balance:</span>
                      <span className="text-soft-white font-medium">{parseFloat(wfounderBalance).toFixed(2)} WFOUNDER</span>
                    </div>
                  </div>
                )}

                {/* Amount Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-soft-white/80 mb-2">
                    Amount to spend (USDC)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0.01"
                      min={getMinAmount()}
                      step="0.01"
                      className="w-full px-3 py-3 bg-soft-white/10 border border-soft-white/20 rounded-lg text-soft-white placeholder-soft-white/40 focus:border-teal-blue/40 focus:outline-none text-lg"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-soft-white/60 font-medium">USDC</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-soft-white/60">
                      Minimum: {getMinAmount()} USDC
                    </p>
                    {isConnected && (
                      <button
                        onClick={() => setAmount((parseFloat(usdcBalance) * 0.9).toString())}
                        className="text-xs text-teal-blue hover:text-teal-blue/80 transition-colors"
                      >
                        Use 90% of balance
                      </button>
                    )}
                  </div>
                </div>

                {/* Slippage Settings */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-soft-white/80 mb-2">
                    Slippage Tolerance
                  </label>
                  <div className="flex space-x-2">
                    {[0.5, 1, 2, 5].map((value) => (
                      <button
                        key={value}
                        onClick={() => handleSlippageChange(value)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          slippage === value
                            ? 'bg-teal-blue text-charcoal-black'
                            : 'bg-soft-white/10 text-soft-white hover:bg-soft-white/20'
                        }`}
                      >
                        {value}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real-time Quote */}
                {amount && parseFloat(amount) > 0 && (
                  <div className="bg-soft-white/5 rounded-lg p-3">
                    {isLoadingQuote ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-blue"></div>
                        <span className="ml-2 text-soft-white/80">Getting quote...</span>
                      </div>
                    ) : quote ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-soft-white/80">You will receive:</span>
                          <span className="text-soft-white font-medium text-lg">
                            {parseFloat(quote.amountOut).toFixed(2)} WFOUNDER
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-soft-white/60">Minimum received:</span>
                          <span className="text-soft-white/80">
                            {parseFloat(quote.amountOutMin).toFixed(2)} WFOUNDER
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-soft-white/60">Price impact:</span>
                          <span className={`${parseFloat(quote.priceImpact) > 5 ? 'text-princeton-orange' : 'text-soft-white/80'}`}>
                            {parseFloat(quote.priceImpact).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-soft-white/60">Estimated gas:</span>
                          <span className="text-soft-white/80">
                            {(parseFloat(quote.gasEstimate) / 1e18).toFixed(6)} ETH
                          </span>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="text-princeton-orange text-sm">
                        {error}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Proceed Button - show when quote is available */}
                {amount && parseFloat(amount) > 0 && quote && !isLoadingQuote && (
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 bg-soft-white/10 text-soft-white rounded-lg hover:bg-soft-white/20 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!quote || isLoadingQuote || !amount}
                      className="flex-1 px-4 py-3 bg-teal-blue text-charcoal-black rounded-lg hover:bg-teal-blue/80 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Proceed
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Approve USDC (if needed) */}
            {currentStep === 'approve' && (
              <div className="bg-charcoal-black/30 rounded-lg p-4 border border-teal-blue/10">
                <h3 className="text-lg font-medium text-soft-white mb-3">2. Approve USDC</h3>

                <div className="bg-soft-white/5 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-teal-blue/20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-teal-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>

                  <h4 className="text-soft-white font-medium text-center mb-2">USDC Approval Required</h4>
                  <p className="text-soft-white/80 text-sm text-center mb-4">
                    To complete the swap, you need to approve {amount} USDC to be spent by the Uniswap router.
                  </p>

                  <div className="bg-charcoal-black/30 rounded-lg p-3">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-soft-white/60">Token to approve:</span>
                      <span className="text-soft-white font-medium">USDC</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-soft-white/60">Amount:</span>
                      <span className="text-soft-white font-medium">{amount} USDC</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-soft-white/60">Spender:</span>
                      <span className="text-soft-white/80 font-mono text-xs">
                        {CONTRACT_ADDRESSES.UNISWAP_ROUTER.slice(0, 6)}...{CONTRACT_ADDRESSES.UNISWAP_ROUTER.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-teal-blue/10 border border-teal-blue/20 rounded-lg">
                  <p className="text-teal-blue text-sm">
                    ℹ️ This is a one-time approval. You won't need to approve again for future swaps of the same or smaller amounts.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setCurrentStep('amount')}
                    className="flex-1 px-4 py-3 bg-soft-white/10 text-soft-white rounded-lg hover:bg-soft-white/20 transition-colors text-sm font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleApprovalExecute}
                    disabled={!isConnected || isExecutingApproval}
                    className="flex-1 px-4 py-3 bg-teal-blue text-charcoal-black rounded-lg hover:bg-teal-blue/80 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExecutingApproval ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-charcoal-black mr-2"></div>
                        Approving...
                      </div>
                    ) : (
                      'Approve USDC'
                    )}
                  </button>
                </div>

                <p className="text-xs text-soft-white/60 mt-2 text-center">
                  Please confirm the approval transaction in your wallet
                </p>
              </div>
            )}

            {/* Step 2/3: Review & Confirm */}
            {currentStep === 'review' && quote && (
              <div className="bg-charcoal-black/30 rounded-lg p-4 border border-teal-blue/10">
                <h3 className="text-lg font-medium text-soft-white mb-3">2. Review Your Trade</h3>

                {/* Trade Summary */}
                <div className="bg-soft-white/5 rounded-lg p-4 mb-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-soft-white/80">You pay:</span>
                      <span className="text-soft-white font-medium text-lg">{amount} USDC</span>
                    </div>
                    <div className="border-t border-soft-white/10 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-soft-white/80">You receive:</span>
                        <span className="text-teal-blue font-medium text-lg">
                          {parseFloat(quote.amountOut).toFixed(2)} WFOUNDER
                        </span>
                      </div>
                    </div>
                    <div className="bg-charcoal-black/30 rounded-lg p-3 mt-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-soft-white/60">Minimum received:</span>
                          <div className="text-soft-white/80 font-medium">
                            {parseFloat(quote.amountOutMin).toFixed(2)} WFOUNDER
                          </div>
                        </div>
                        <div>
                          <span className="text-soft-white/60">Price impact:</span>
                          <div className={`font-medium ${
                            parseFloat(quote.priceImpact) > 5 ? 'text-princeton-orange' : 'text-soft-white/80'
                          }`}>
                            {parseFloat(quote.priceImpact).toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-soft-white/60">Slippage tolerance:</span>
                          <div className="text-soft-white/80 font-medium">{slippage}%</div>
                        </div>
                        <div>
                          <span className="text-soft-white/60">Estimated gas:</span>
                          <div className="text-soft-white/80 font-medium">
                            {(parseFloat(quote.gasEstimate) / 1e18).toFixed(6)} ETH
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet Connection Check */}
                {!isConnected ? (
                  <div className="mb-4 p-3 bg-princeton-orange/10 border border-princeton-orange/20 rounded-lg">
                    <p className="text-princeton-orange text-sm">Please connect your wallet to continue</p>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-teal-blue/10 border border-teal-blue/20 rounded-lg">
                    <p className="text-teal-blue text-sm">Wallet connected: {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</p>
                  </div>
                )}

                {/* Price Impact Warning */}
                {parseFloat(quote.priceImpact) > 5 && (
                  <div className="mb-4 p-3 bg-princeton-orange/10 border border-princeton-orange/20 rounded-lg">
                    <p className="text-princeton-orange text-sm">
                      ⚠️ High price impact ({parseFloat(quote.priceImpact).toFixed(2)}%). You may receive significantly less tokens due to low liquidity.
                    </p>
                  </div>
                )}

                {/* Execute Button */}
                <div className="flex space-x-3">
                  <button
                    onClick={needsApproval ? () => setCurrentStep('approve') : () => setCurrentStep('amount')}
                    className="flex-1 px-4 py-3 bg-soft-white/10 text-soft-white rounded-lg hover:bg-soft-white/20 transition-colors text-sm font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleExecute}
                    disabled={!isConnected || isExecuting}
                    className="flex-1 px-4 py-3 bg-teal-blue text-charcoal-black rounded-lg hover:bg-teal-blue/80 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExecuting ? 'Preparing Transaction...' : 'Execute Swap'}
                  </button>
                </div>

                <p className="text-xs text-soft-white/60 mt-2 text-center">
                  You will be prompted to sign the transaction in your wallet
                </p>
              </div>
            )}


            {/* Step 3/4: Executing */}
            {currentStep === 'executing' && (
              <div className="bg-charcoal-black/30 rounded-lg p-4 border border-teal-blue/10">
                <h3 className="text-lg font-medium text-soft-white mb-3">3. Executing Swap</h3>

                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-blue"></div>
                </div>

                <p className="text-soft-white/80 text-center mb-2">
                  {txHash ? 'Transaction submitted, waiting for confirmation...' : 'Preparing your swap transaction...'}
                </p>
                <p className="text-xs text-soft-white/60 text-center">
                  Please confirm the transaction in your wallet and wait for network confirmation
                </p>

                {txHash && (
                  <div className="mt-4 p-3 bg-teal-blue/10 border border-teal-blue/20 rounded-lg">
                    <p className="text-teal-blue text-sm mb-1">Transaction Hash:</p>
                    <p className="text-xs text-soft-white/80 font-mono break-all">{txHash}</p>
                  </div>
                )}
              </div>
            )}

            {/* Success */}
            {currentStep === 'success' && (
              <div className="bg-charcoal-black/30 rounded-lg p-4 border border-teal-blue/10">
                <h3 className="text-lg font-medium text-soft-white mb-3">🎉 Swap Successful!</h3>

                {txHash && (
                  <div className="mb-4 p-3 bg-teal-blue/10 border border-teal-blue/20 rounded-lg">
                    <p className="text-teal-blue text-sm mb-1">Transaction Hash:</p>
                    <p className="text-xs text-soft-white/80 font-mono break-all">{txHash}</p>
                  </div>
                )}

                {quote && (
                  <div className="mb-4 p-3 bg-soft-white/5 rounded-lg">
                    <div className="text-center">
                      <p className="text-soft-white/80 mb-1">Successfully swapped</p>
                      <p className="text-soft-white font-medium text-lg">{amount} USDC</p>
                      <p className="text-soft-white/80 mb-1">for approximately</p>
                      <p className="text-teal-blue font-medium text-lg">
                        {parseFloat(quote.amountOut).toFixed(2)} WFOUNDER
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 bg-teal-blue text-charcoal-black rounded-lg hover:bg-teal-blue/80 transition-colors text-sm font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {currentStep === 'error' && (
              <div className="bg-charcoal-black/30 rounded-lg p-4 border border-princeton-orange/30">
                <h3 className="text-lg font-medium text-soft-white mb-3">❌ Swap Failed</h3>

                <div className="mb-4 p-3 bg-princeton-orange/10 border border-princeton-orange/20 rounded-lg">
                  <p className="text-princeton-orange text-sm mb-1">Error:</p>
                  <p className="text-xs text-princeton-orange/80">
                    {error || 'An unknown error occurred during the swap'}
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setCurrentStep('review')}
                    className="flex-1 px-4 py-2 bg-soft-white/10 text-soft-white rounded-lg hover:bg-soft-white/20 transition-colors text-sm font-medium"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 bg-princeton-orange text-white rounded-lg hover:bg-princeton-orange/80 transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Development Notice - only show during early steps */}
          {(currentStep === 'amount' || currentStep === 'review') && (
            <div className="mt-6 p-4 bg-teal-blue/10 border border-teal-blue/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-teal-blue/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal-blue text-xs font-bold">⚡</span>
                </div>
                <div className="text-sm">
                  <p className="text-teal-blue font-medium mb-1">Direct Uniswap Integration</p>
                  <p className="text-teal-blue/80 text-xs">
                    This connects directly to Uniswap V2 for fast, efficient USDC→WFOUNDER swaps.
                    Real-time pricing with minimal price impact.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyWfounderModal;
