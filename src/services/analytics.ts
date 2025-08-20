// TODO [M6.4] - Emit buy_opened/quote_returned/etc.
// TODO [M8.1] - Track success rate, median time to complete
// TODO [M8.2] - Monitor drop-off before payment

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export interface BuyFlowMetrics {
  buyOpened: number;
  quoteReturned: number;
  swapSubmitted: number;
  swapConfirmed: number;
  swapFailed: number;
  timeToComplete: number[];
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  track(event: string, properties: Record<string, any> = {}, userId?: string): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      userId,
      sessionId: this.sessionId
    };

    this.events.push(analyticsEvent);
    
    // TODO: Send to actual analytics provider
    console.log('Analytics Event:', analyticsEvent);
  }

  // Buy flow specific events
  trackBuyOpened(userId?: string): void {
    this.track('buy_opened', {}, userId);
  }

  trackAssetSelected(asset: string, userId?: string): void {
    this.track('asset_selected', { asset }, userId);
  }

  trackQuoteReturned(quoteId: string, asset: string, amount: string, userId?: string): void {
    this.track('quote_returned', { quoteId, asset, amount }, userId);
  }

  trackKycStarted(userId?: string): void {
    this.track('kyc_started', {}, userId);
  }

  trackSwapSubmitted(routeId: string, asset: string, amount: string, userId?: string): void {
    this.track('swap_submitted', { routeId, asset, amount }, userId);
  }

  trackSwapConfirmed(routeId: string, txHash: string, timeToComplete: number, userId?: string): void {
    this.track('swap_confirmed', { routeId, txHash, timeToComplete }, userId);
  }

  trackSwapFailed(routeId: string, error: string, userId?: string): void {
    this.track('swap_failed', { routeId, error }, userId);
  }

  trackTimeToComplete(timeMs: number, userId?: string): void {
    this.track('time_to_complete_sec', { timeMs: Math.round(timeMs / 1000) }, userId);
  }

  // Metrics calculation
  getBuyFlowMetrics(): BuyFlowMetrics {
    const metrics: BuyFlowMetrics = {
      buyOpened: 0,
      quoteReturned: 0,
      swapSubmitted: 0,
      swapConfirmed: 0,
      swapFailed: 0,
      timeToComplete: []
    };

    this.events.forEach(event => {
      switch (event.event) {
        case 'buy_opened':
          metrics.buyOpened++;
          break;
        case 'quote_returned':
          metrics.quoteReturned++;
          break;
        case 'swap_submitted':
          metrics.swapSubmitted++;
          break;
        case 'swap_confirmed':
          metrics.swapConfirmed++;
          break;
        case 'swap_failed':
          metrics.swapFailed++;
          break;
        case 'time_to_complete_sec':
          metrics.timeToComplete.push(event.properties.timeMs);
          break;
      }
    });

    return metrics;
  }

  getSuccessRate(): number {
    const metrics = this.getBuyFlowMetrics();
    const total = metrics.swapConfirmed + metrics.swapFailed;
    return total > 0 ? (metrics.swapConfirmed / total) * 100 : 0;
  }

  getMedianTimeToComplete(): number {
    const metrics = this.getBuyFlowMetrics();
    if (metrics.timeToComplete.length === 0) return 0;
    
    const sorted = [...metrics.timeToComplete].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  getDropOffRate(): number {
    const metrics = this.getBuyFlowMetrics();
    if (metrics.buyOpened === 0) return 0;
    
    const dropOffs = metrics.buyOpened - metrics.swapSubmitted;
    return (dropOffs / metrics.buyOpened) * 100;
  }

  // Export events for external analytics
  exportEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
