import React from 'react';

// TODO [M7.1] - Transak/Ramp widget wrapper
// TODO [M7.2] - Prefill wallet + Polygon chain
// TODO [M7.3] - Listen to onramp events
// TODO [M7.4] - Status handling and autoswap integration

interface OnrampWidgetProps {
  walletAddress?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const OnrampWidget: React.FC<OnrampWidgetProps> = ({ 
  walletAddress, 
  onSuccess: _onSuccess, 
  onError: _onError 
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Fiat Onramp</h3>
        <p className="text-gray-600 mb-4">
          TODO: Integrate Transak/Ramp widget
        </p>
        
        <div className="space-y-2 text-sm text-gray-500 text-left">
          <p>• Prefill wallet: {walletAddress || 'Not connected'}</p>
          <p>• Target chain: Polygon</p>
          <p>• Auto-swap to NEYXT on success</p>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
          <p className="text-yellow-800 text-sm">
            Widget integration pending - will enable fiat → NEYXT path
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnrampWidget;
