import { Action } from '@elizaos/core'
import { GeckoTerminalProvider } from '../providers/geckoTerminal'

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class CandleAnalysisAction implements Action {
  name = 'analyze-candles'
  description = 'Analyzes candlestick patterns for Solana token'
  similes = []
  examples = []
  handler = this.execute.bind(this)
  async validate(): Promise<boolean> {
    return true
  }

  private timeframes = ['1m', '5m', '15m', '1h']
  private provider: GeckoTerminalProvider

  async execute(context: any) {
    this.provider = context.agent.getProvider('gecko-terminal') as GeckoTerminalProvider

    const candleData: Record<string, Candle[]> = {}

    // Fetch candles for all timeframes
    for (const timeframe of this.timeframes) {
      candleData[timeframe] = await this.provider.getOhlcv('sol', timeframe)
    }

    // Analyze trends across timeframes
    const analysis = this.analyzeTrends(candleData)

    // Store analysis in agent's memory
    await context.agent.memory.set('candle_analysis', analysis)

    return {
      success: true,
      data: analysis
    }
  }

  private analyzeTrends(candleData: Record<string, Candle[]>) {
    const analysis: Record<string, any> = {}

    for (const [timeframe, candles] of Object.entries(candleData)) {
      const trend = this.calculateTrend(candles)
      const support = this.findSupport(candles)
      const resistance = this.findResistance(candles)

      analysis[timeframe] = {
        trend,
        support,
        resistance
      }
    }

    return analysis
  }

  private calculateTrend(candles: Candle[]) {
    const recentCandles = candles.slice(-20)
    const firstPrice = recentCandles[0].close
    const lastPrice = recentCandles[recentCandles.length - 1].close

    return lastPrice > firstPrice ? 'uptrend' : 'downtrend'
  }

  private findSupport(candles: Candle[]) {
    return Math.min(...candles.map(c => c.low))
  }

  private findResistance(candles: Candle[]) {
    return Math.max(...candles.map(c => c.high))
  }
}
