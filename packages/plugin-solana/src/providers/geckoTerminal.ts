import { Provider } from "@elizaos/core";
import { ICacheManager } from "@elizaos/core";
import NodeCache from "node-cache";
import * as path from "path";

const PROVIDER_CONFIG = {
    BASE_URL: "https://api.geckoterminal.com/api/v2",
    NETWORKS: {
        SOLANA: "solana"
    },
    TOKENS: {
        SOL: "sol",
        USDC: "usd-coin"
    },
    DEFAULT_POOL: "raydium_sol_usdc", // Default Raydium SOL/USDC pool
    CACHE_TTL: 300 // 5 minutes
};

export interface OhlcvData {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export class GeckoTerminalProvider extends Provider {
    name = "geckoterminal";
    private cache: NodeCache;
    private cacheKey: string = "solana/geckoterminal";

    constructor(private cacheManager: ICacheManager) {
        super();
        this.cache = new NodeCache({ stdTTL: PROVIDER_CONFIG.CACHE_TTL });
    }

    private async fetchWithCache<T>(endpoint: string, cacheKey: string): Promise<T> {
        // Check memory cache first
        const cachedData = this.cache.get<T>(cacheKey);
        if (cachedData) return cachedData;

        // Check file cache
        const fileCachedData = await this.cacheManager.get<T>(path.join(this.cacheKey, cacheKey));
        if (fileCachedData) {
            this.cache.set(cacheKey, fileCachedData);
            return fileCachedData;
        }

        // Fetch fresh data
        const response = await fetch(`${PROVIDER_CONFIG.BASE_URL}${endpoint}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`GeckoTerminal API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache the data
        this.cache.set(cacheKey, data);
        await this.cacheManager.set(path.join(this.cacheKey, cacheKey), data, {
            expires: Date.now() + PROVIDER_CONFIG.CACHE_TTL * 1000
        });

        return data;
    }

    async getCurrentPrice(tokenAddress: string): Promise<number> {
        const endpoint = `/networks/${PROVIDER_CONFIG.NETWORKS.SOLANA}/pools/${PROVIDER_CONFIG.DEFAULT_POOL}`;
        const data = await this.fetchWithCache(endpoint, 'current_price');
        
        // Extract the price from the pool data
        const price = data.data.attributes.token_price_usd;
        return parseFloat(price);
    }

    async getOhlcv(tokenAddress: string, timeframe: string, limit: number = 100): Promise<OhlcvData[]> {
        // Map our timeframes to GeckoTerminal's format
        const timeframeMap: { [key: string]: string } = {
            '1m': '1m',
            '5m': '5m',
            '15m': '15m',
            '1h': '1h'
        };

        const geckoTimeframe = timeframeMap[timeframe] || '5m';
        const endpoint = `/networks/${PROVIDER_CONFIG.NETWORKS.SOLANA}/pools/${PROVIDER_CONFIG.DEFAULT_POOL}/ohlcv/${geckoTimeframe}`;
        
        const data = await this.fetchWithCache<any>(endpoint, `ohlcv_${geckoTimeframe}`);
        
        // Transform the data into our format
        return data.data.attributes.ohlcv_list.map((item: any[]) => ({
            timestamp: item[0],
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5])
        }));
    }

    async getPoolInfo(): Promise<any> {
        const endpoint = `/networks/${PROVIDER_CONFIG.NETWORKS.SOLANA}/pools/${PROVIDER_CONFIG.DEFAULT_POOL}`;
        return this.fetchWithCache(endpoint, 'pool_info');
    }
}
