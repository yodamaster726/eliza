# Solana Trading Bot Client

A specialized Eliza client that monitors Solana prices, detects potential bottom formations, and sends notifications via Discord.

## Features

- Real-time price monitoring using Birdeye API
- Multi-timeframe analysis (1m, 5m, 15m, 1h)
- Bottom detection using support/resistance levels
- Discord notifications for trading signals

## Installation

```bash
pnpm install
```

## Configuration

1. Copy the environment configuration:
```bash
cp .env.example .env
```

2. Configure your environment variables in `.env`:
- `DISCORD_BOT_TOKEN`: Your Discord bot token
- `DISCORD_CHANNEL_ID`: The channel ID where notifications will be sent
- `BIRDEYE_API_KEY`: Your Birdeye API key

## Usage

Start the trading bot:
```bash
pnpm start
```

The bot will:
1. Monitor Solana prices every minute
2. Analyze price action across multiple timeframes
3. Detect potential bottom formations
4. Send notifications to Discord when high-confidence signals are found

## Discord Notifications

The bot sends detailed notifications including:
- Current price
- Support/resistance levels
- Analysis confidence
- Reasoning for the signal

## Warning

This bot is for educational purposes only. Never make trading decisions solely based on automated signals. Always do your own research and understand the risks involved in trading.
