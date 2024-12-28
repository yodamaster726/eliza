import { IAgentRuntime, Evaluator, Memory, State } from "@elizaos/core";
import { DiscordClient } from "@elizaos/client-discord";

export class TradingSignalEvaluator extends Evaluator {
  name = "trading-signal";
  description = "Evaluates trading signals and sends Discord notifications";

  private lastNotificationTime: number = 0;
  private notificationCooldown: number = 5 * 60 * 1000; // 5 minutes

  async evaluate(
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<void> {
    const analysis = await runtime.memory.get("price_analysis");
    if (!analysis || !analysis.bottomSignal) {
      return;
    }

    if (this.shouldNotify(analysis.bottomSignal)) {
      await this.sendDiscordNotification(runtime, analysis);
    }
  }

  private shouldNotify(bottomSignal: any): boolean {
    const now = Date.now();
    
    if (now - this.lastNotificationTime < this.notificationCooldown) {
      return false;
    }

    return bottomSignal.isBottom && bottomSignal.confidence >= 75;
  }

  private async sendDiscordNotification(
    runtime: IAgentRuntime,
    analysis: any
  ) {
    const discordClient = runtime.getClient("discord") as DiscordClient;
    if (!discordClient) {
      console.error("Discord client not found");
      return;
    }

    const message = this.formatDiscordMessage(analysis);
    
    try {
      await discordClient.sendMessage({
        channelId: process.env.DISCORD_CHANNEL_ID as string,
        content: message
      });
      
      this.lastNotificationTime = Date.now();
    } catch (error) {
      console.error("Failed to send Discord notification:", error);
    }
  }

  private formatDiscordMessage(analysis: any): string {
    let message = `🚨 **Solana Trading Signal Alert** 🚨\n\n`;
    
    // Add timeframe analysis
    message += "📊 Timeframe Analysis:\n";
    for (const [timeframe, data] of Object.entries(analysis.timeframes)) {
      message += `${timeframe}: ${data.trend.toUpperCase()} | Support: $${data.support.toFixed(2)} | Resistance: $${data.resistance.toFixed(2)}\n`;
    }

    // Add bottom signal analysis
    message += `\n🎯 Bottom Signal:\n`;
    message += `Confidence: ${analysis.bottomSignal.confidence.toFixed(1)}%\n`;
    message += `Reasons:\n${analysis.bottomSignal.reasons.map(r => `• ${r}`).join("\n")}\n`;

    message += `\n⚠️ This is not financial advice. Always do your own research.`;

    return message;
  }
}
