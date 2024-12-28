import { Plugin } from '@elizaos/core'
import { GeckoTerminalProvider } from './providers/geckoTerminal'
import { PriceMonitorAction } from './actions/priceMonitor'
import { CandleAnalysisAction } from './actions/candleAnalysis'
import { BottomDetectionAction } from './actions/bottomDetection'
import { TradingSignalEvaluator } from './evaluators/tradingSignal'

// Export individual components
export { GeckoTerminalProvider } from './providers/geckoTerminal'
export { PriceMonitorAction } from './actions/priceMonitor'
export { CandleAnalysisAction } from './actions/candleAnalysis'
export { BottomDetectionAction } from './actions/bottomDetection'
export { TradingSignalEvaluator } from './evaluators/tradingSignal'

export class SolanaTradingPlugin extends Plugin {
  name = 'solana-trading'
  version = '0.1.0'

  providers = [
    GeckoTerminalProvider
  ]

  actions = [
    PriceMonitorAction,
    CandleAnalysisAction,
    BottomDetectionAction
  ]

  evaluators = [
    TradingSignalEvaluator
  ]
}

export default SolanaTradingPlugin
