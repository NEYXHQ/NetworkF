import { useState, useCallback, useEffect } from 'react';

// TODO [M7.3] - Listen to widget & webhook statuses
// TODO [M7.4] - Handle onramp success/failure events
// TODO [M7.2] - Integrate with onramp webhook for autoswap

interface OnrampEvent {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: string;
  asset: string;
  walletAddress: string;
  timestamp: number;
}

interface OnrampStatus {
  loading: boolean;
  events: OnrampEvent[];
  error: string | null;
}

export const useOnrampEvents = (walletAddress?: string) => {
  const [status, setStatus] = useState<OnrampStatus>({
    loading: false,
    events: [],
    error: null
  });

  const refreshEvents = useCallback(async () => {
    if (!walletAddress) return;
    
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      // TODO: Implement actual onramp event fetching
      console.log('Refreshing onramp events for wallet:', walletAddress);
      
      // Placeholder events for now
      const mockEvents: OnrampEvent[] = [
        {
          id: 'mock-event-1',
          status: 'COMPLETED',
          amount: '100',
          asset: 'USDC',
          walletAddress,
          timestamp: Date.now()
        }
      ];
      
      setStatus({
        loading: false,
        events: mockEvents,
        error: null
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch onramp events';
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  }, [walletAddress]);

  const clearEvents = useCallback(() => {
    setStatus({
      loading: false,
      events: [],
      error: null
    });
  }, []);

  // Auto-refresh events when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      refreshEvents();
    } else {
      clearEvents();
    }
  }, [walletAddress, refreshEvents, clearEvents]);

  return {
    ...status,
    refreshEvents,
    clearEvents
  };
};
