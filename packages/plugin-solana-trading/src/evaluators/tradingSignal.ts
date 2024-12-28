import { Evaluator, IAgentRuntime, ServiceType } from '@elizaos/core'
import { DiscordClient } from '@elizaos/client-discord'
import { TextChannel } from 'discord.js'

// Define interface for bottom detection data
interface BottomDetection {
  confidence: number;
  price: number;
  roomId: string;
  timestamp: string;
}

export class TradingSignalEvaluator implements Evaluator {
  name = 'trading-signal'
  description = 'Evaluates trading signals and sends notifications'
  similes = []
  examples = []
  alwaysRun = true

  private lastNotificationTime: number = 0
  private notificationCooldown: number = 5 * 60 * 1000 // 5 minutes

  handler = async (runtime: IAgentRuntime) => {
    const analysis = await runtime.cacheManager.get<{
      bottomSignal: BottomDetection;
      timestamp: string;
    }>('trading_analysis')
    
    if (!analysis || !analysis.bottomSignal) {
      return
    }

    if (this.shouldNotify(analysis.bottomSignal)) {
      await this.sendDiscordNotification(runtime, analysis.bottomSignal)
    }
  }

  validate = async () => true

  private shouldNotify(detection: BottomDetection): boolean {
    const now = Date.now()
    
    // Check if we're in cooldown period
    if (now - this.lastNotificationTime < this.notificationCooldown) {
      return false
    }

    // Only notify when we have a strong bottom signal
    return detection.confidence > 0.8
  }

  private async sendDiscordNotification(
    runtime: IAgentRuntime,
    detection: BottomDetection
  ) {
    const service = runtime.services.get('discord' as ServiceType)
    if (!service) {
      console.error('Discord service not found')
      return
    }

    const discordClient = service as unknown as DiscordClient
    const channel = await discordClient.client.channels.fetch(detection.roomId) as TextChannel

    if (!channel || !channel.isTextBased()) {
      console.error('Invalid Discord channel')
      return
    }

    const message = `🚨 **Strong Bottom Signal Detected!**
Price: $${detection.price.toFixed(2)}
Confidence: ${(detection.confidence * 100).toFixed(1)}%
Time: ${detection.timestamp}`

    await channel.send(message)
    this.lastNotificationTime = Date.now()
  }
}
