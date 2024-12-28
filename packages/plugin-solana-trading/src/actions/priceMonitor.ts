import { Action } from '@elizaos/core'
import { GeckoTerminalProvider } from '../providers/geckoTerminal'

export class PriceMonitorAction implements Action {
  name = 'monitor-price'
  description = 'Monitors the price of Solana token'
  similes = []
  examples = []
  handler = this.execute.bind(this)
  async validate(): Promise<boolean> {
    return true
  }

  private solanaAddress = 'sol'  // GeckoTerminal uses symbol instead of address
  private provider: GeckoTerminalProvider

  async execute(context: any) {
    this.provider = context.agent.getProvider('gecko-terminal') as GeckoTerminalProvider
    
    const price = await this.provider.getCurrentPrice(this.solanaAddress)
    
    // Store price in agent's memory for analysis
    await context.agent.memory.set('current_price', price)
    
    return {
      success: true,
      data: { price }
    }
  }
}
