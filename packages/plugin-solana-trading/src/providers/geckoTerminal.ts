import { Provider, IAgentRuntime, Memory, State } from '@elizaos/core'
import axios from 'axios'

interface OhlcvData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export class GeckoTerminalProvider implements Provider {
  name = 'gecko-terminal'
  description = 'Provider for GeckoTerminal price data'

  private baseUrl = 'https://api.geckoterminal.com/api/v2'
  private network = 'solana'  // GeckoTerminal's network identifier for Solana

  async get(runtime: IAgentRuntime, message: Memory, state?: State): Promise<any> {
    const tokenSymbol = 'sol' // Default to SOL token
    const price = await this.getCurrentPrice(tokenSymbol)
    return { currentPrice: price }
  }

  async getCurrentPrice(tokenSymbol: string): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/networks/${this.network}/tokens/${tokenSymbol}`)
      return parseFloat(response.data.data.attributes.price_usd)
    } catch (error) {
      console.error('Error fetching current price:', error)
      throw error
    }
  }

  async getOhlcv(tokenSymbol: string, timeframe: string): Promise<OhlcvData[]> {
    try {
      // Convert timeframe to GeckoTerminal format (e.g., 1m -> 1, 1h -> 60)
      const interval = this.convertTimeframe(timeframe)
      
      const response = await axios.get(
        `${this.baseUrl}/networks/${this.network}/tokens/${tokenSymbol}/ohlcv/candlestick`,
        {
          params: {
            interval,
            limit: 100  // Get last 100 candles
          }
        }
      )

      return response.data.data.attributes.ohlcv_list.map((candle: any[]) => ({
        timestamp: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }))
    } catch (error) {
      console.error('Error fetching OHLCV data:', error)
      throw error
    }
  }

  private convertTimeframe(timeframe: string): number {
    const value = parseInt(timeframe)
    const unit = timeframe.slice(-1)

    switch (unit) {
      case 'm':
        return value
      case 'h':
        return value * 60
      case 'd':
        return value * 1440
      default:
        throw new Error(`Unsupported timeframe: ${timeframe}`)
    }
  }
}
