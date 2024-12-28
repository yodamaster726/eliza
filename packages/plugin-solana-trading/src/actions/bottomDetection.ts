import { Action } from '@elizaos/core'
import { GeckoTerminalProvider } from '../providers/geckoTerminal'

export class BottomDetectionAction implements Action {
  name = 'detect-bottom'
  description = 'Detects potential market bottom for Solana token'
  similes = []
  examples = []
  handler = this.execute.bind(this)
  async validate(): Promise<boolean> {
    return true
  }

  private provider: GeckoTerminalProvider
  private timeframes = ['1h', '4h', '1d']
  private lookbackPeriods = 30

  async execute(context: any) {
    this.provider = context.agent.getProvider('gecko-terminal') as GeckoTerminalProvider

    const signals: Record<string, boolean> = {}
    let overallSignal = false

    // Check for bottom signals across multiple timeframes
    for (const timeframe of this.timeframes) {
      const candles = await this.provider.getOhlcv('sol', timeframe)
      signals[timeframe] = this.detectBottomSignal(candles)
    }

    // If we have bottom signals on multiple timeframes, it's a stronger indication
    overallSignal = Object.values(signals).filter(signal => signal).length >= 2

    const currentPrice = await this.provider.getCurrentPrice('sol')

    const analysis = {
      currentPrice,
      timeframeSignals: signals,
      overallBottomSignal: overallSignal
    }

    // Store analysis in agent's memory
    await context.agent.memory.set('bottom_detection', analysis)

    return {
      success: true,
      data: analysis
    }
  }

  private detectBottomSignal(candles: any[]) {
    if (candles.length < this.lookbackPeriods) return false

    const recentCandles = candles.slice(-this.lookbackPeriods)

    // Check for oversold conditions
    const rsi = this.calculateRSI(recentCandles)
    const isOversold = rsi < 30

    // Check for bullish divergence
    const hasBullishDivergence = this.checkBullishDivergence(recentCandles)

    // Check for volume increase
    const hasVolumeIncrease = this.checkVolumeIncrease(recentCandles)

    // Return true if we have at least 2 confirming signals
    const signals = [isOversold, hasBullishDivergence, hasVolumeIncrease]
    return signals.filter(signal => signal).length >= 2
  }

  private calculateRSI(candles: any[]) {
    let gains = 0
    let losses = 0

    for (let i = 1; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close
      if (change >= 0) {
        gains += change
      } else {
        losses -= change
      }
    }

    const avgGain = gains / candles.length
    const avgLoss = losses / candles.length
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  private checkBullishDivergence(candles: any[]) {
    const prices = candles.map(c => c.close)
    const lows = this.findLocalLows(prices)

    if (lows.length < 2) return false

    // Check if price is making lower lows but RSI is making higher lows
    const lastTwoLows = lows.slice(-2)
    const priceSlope = (prices[lastTwoLows[1]] - prices[lastTwoLows[0]]) / (lastTwoLows[1] - lastTwoLows[0])

    const rsiValues = lastTwoLows.map(idx => this.calculateRSI(candles.slice(0, idx + 1)))
    const rsiSlope = (rsiValues[1] - rsiValues[0]) / (lastTwoLows[1] - lastTwoLows[0])

    return priceSlope < 0 && rsiSlope > 0
  }

  private checkVolumeIncrease(candles: any[]) {
    const recentVolumes = candles.slice(-5).map(c => c.volume)
    const previousVolumes = candles.slice(-10, -5).map(c => c.volume)

    const avgRecentVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length
    const avgPreviousVolume = previousVolumes.reduce((a, b) => a + b, 0) / previousVolumes.length

    return avgRecentVolume > avgPreviousVolume * 1.5
  }

  private findLocalLows(prices: number[]) {
    const lows: number[] = []

    for (let i = 1; i < prices.length - 1; i++) {
      if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
        lows.push(i)
      }
    }

    return lows
  }
}
