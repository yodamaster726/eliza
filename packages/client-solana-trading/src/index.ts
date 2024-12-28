import { Client, IAgentRuntime, Memory, Plugin, UUID } from "@elizaos/core";
import { DiscordClient } from "@elizaos/client-discord";
import { 
  PriceMonitorAction,
  CandleAnalysisAction,
  BottomDetectionAction,
  TradingSignalEvaluator,
  GeckoTerminalProvider
} from "@elizaos/plugin-solana-trading";
import { stringToUuid } from "@elizaos/core";
import dotenv from "dotenv";

dotenv.config();

export class SolanaTradingClient implements Client {
  name = "solana-trading";
  private discordClient: DiscordClient;
  private analysisInterval: NodeJS.Timeout | null = null;
  private plugin: Plugin;

  constructor(private runtime: IAgentRuntime) {
    // Initialize plugin
    this.plugin = {
      name: "solana-trading",
      description: "Solana trading analysis plugin",
      actions: [
        new PriceMonitorAction(),
        new CandleAnalysisAction(),
        new BottomDetectionAction()
      ],
      evaluators: [
        new TradingSignalEvaluator()
      ],
      providers: [
        new GeckoTerminalProvider()
      ]
    };
  }

  start = async (runtime: IAgentRuntime): Promise<unknown> => {
    // Initialize Discord client
    this.discordClient = new DiscordClient(runtime);

    // Register plugin's actions
    this.plugin.actions?.forEach(action => runtime.registerAction(action));
    
    // Add evaluators and providers to runtime arrays
    if (this.plugin.evaluators) {
      runtime.evaluators.push(...this.plugin.evaluators);
    }
    if (this.plugin.providers) {
      runtime.providers.push(...this.plugin.providers);
    }

    // Start price monitoring
    this.startPriceMonitoring(runtime);
    
    console.log("Solana Trading Bot initialized and monitoring prices...");
    return this;
  };

  private startPriceMonitoring(runtime: IAgentRuntime) {
    // Run price analysis every minute
    this.analysisInterval = setInterval(async () => {
      try {
        // Create memory object for analysis
        const message: Memory = {
          id: stringToUuid(runtime.agentId),
          userId: runtime.agentId,
          agentId: runtime.agentId,
          roomId: runtime.agentId,
          createdAt: Date.now(),
          content: {
            text: "Analyze trading signals",
            action: "analyze"
          }
        };

        // Get state for processing
        const state = await runtime.composeState(message);

        // Process actions and evaluators
        await runtime.processActions(message, [], state);
        await runtime.evaluate(message, state);

      } catch (error) {
        console.error("Error in price analysis:", error);
      }
    }, 60 * 1000); // Every minute
  }

  stop = async (runtime: IAgentRuntime): Promise<unknown> => {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }

    // Stop Discord client
    await this.discordClient.stop();

    console.log("Shutting down Solana Trading Bot...");
    return this;
  };
}

// Export the client class instead of an instance
export default SolanaTradingClient;
