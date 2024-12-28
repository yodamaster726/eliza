import { IAgentRuntime, Action, Memory, State } from "@elizaos/core";
import { GeckoTerminalProvider } from "../providers/geckoTerminal";

interface TimeframeData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AnalysisResult {
  timeframes: {
    [key: string]: {
      trend: string;
      support: number;
      resistance: number;
    };
  };
  bottomSignal: {
    isBottom: boolean;
    confidence: number;
    reasons: string[];
  };
}

export class PriceAnalysisAction extends Action {
  name = "analyze-price";
  description = "Analyzes Solana price across multiple timeframes";

  private timeframes = ["1m", "5m", "15m", "1h"];
  private geckoProvider: GeckoTerminalProvider;

  async execute(
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<AnalysisResult> {
    this.geckoProvider = new GeckoTerminalProvider(runtime.cacheManager);

    // Fetch data for all timeframes
    const timeframeData: { [key: string]: TimeframeData[] } = {};
    for (const timeframe of this.timeframes) {
      const data = await this.geckoProvider.getOhlcv("sol", timeframe);
      timeframeData[timeframe] = data;
    }

    // Analyze each timeframe
    const analysis: AnalysisResult = {
      timeframes: {},
      bottomSignal: {
        isBottom: false,
        confidence: 0,
        reasons: []
      }
    };

    let supportHits = 0;
    const currentPrice = await this.geckoProvider.getCurrentPrice("sol");

    for (const [timeframe, candles] of Object.entries(timeframeData)) {
      const timeframeAnalysis = this.analyzeTimeframe(candles);
      analysis.timeframes[timeframe] = timeframeAnalysis;

      // Check if price is near support
      const supportDistance = ((currentPrice - timeframeAnalysis.support) / timeframeAnalysis.support) * 100;
      if (supportDistance <= 1) {
        supportHits++;
        analysis.bottomSignal.reasons.push(`Price near ${timeframe} support level`);
      }
    }

    // Calculate bottom signal confidence
    analysis.bottomSignal.confidence = (supportHits / this.timeframes.length) * 100;
    analysis.bottomSignal.isBottom = analysis.bottomSignal.confidence >= 75;

    if (analysis.bottomSignal.isBottom) {
      analysis.bottomSignal.reasons.push("High confidence bottom formation detected");
    }

    return analysis;
  }

  private analyzeTimeframe(candles: TimeframeData[]) {
    const recentCandles = candles.slice(-20);
    
    return {
      trend: this.calculateTrend(recentCandles),
      support: this.findSupport(recentCandles),
      resistance: this.findResistance(recentCandles)
    };
  }

  private calculateTrend(candles: TimeframeData[]) {
    const firstPrice = candles[0].close;
    const lastPrice = candles[candles.length - 1].close;
    return lastPrice > firstPrice ? "uptrend" : "downtrend";
  }

  private findSupport(candles: TimeframeData[]) {
    return Math.min(...candles.map(c => c.low));
  }

  private findResistance(candles: TimeframeData[]) {
    return Math.max(...candles.map(c => c.high));
  }
}
