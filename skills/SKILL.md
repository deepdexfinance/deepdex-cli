---
name: deepdex-cli
description: "High-performance CLI trading bot and MCP server for the DeepDex protocol. Enables spot/perpetual trading, wallet management, subaccount operations, and automated trading strategies. Use when building features, fixing bugs, or extending the trading bot."
license: MIT
---

# DeepDex CLI Skill

A comprehensive skill for working with the DeepDex CLI trading bot, a high-performance TypeScript/Bun application for trading on the DeepDex protocol.

## Project Overview

DeepDex CLI is a feature-rich trading bot with:
- **Spot & Perpetual Trading**: ETH/USDC, SOL/USDC with limit/market orders and up to 50x leverage
- **Advanced Orders**: Take-profit, stop-loss, post-only, reduce-only orders
- **Subaccount Management**: Isolated accounts for different strategies
- **Automated Strategies**: Grid trading, DCA, momentum, funding rate arbitrage
- **Process Manager**: Run multiple bots simultaneously with monitoring
- **MCP Server Integration**: Expose trading tools to LLMs (Claude, etc.)
- **Built with Bun**: Fast TypeScript runtime with zero-config setup

## Directory Structure

```
deepdex-cli/
├── src/
│   ├── abis/                 # Contract ABIs for blockchain interaction
│   ├── config/               # Configuration management
│   ├── services/             # Business logic (trading, orders, accounts)
│   ├── types/                # TypeScript type definitions
│   └── mcp/                  # MCP server implementation
├── configs/                  # Example strategy configs (grid.json, dca.json, etc.)
├── index.ts                  # CLI entry point
├── GUIDE.md                  # Complete CLI reference
├── package.json              # Dependencies: viem, bignumber.js, zod, etc.
├── biome.json                # Biome linter/formatter config
├── tsconfig.json             # TypeScript configuration
└── bunfig.toml              # Bun runtime configuration
```

## Tech Stack

- **Runtime**: Bun v1.0.0+ (fast TypeScript/JavaScript runtime)
- **Language**: TypeScript 5+
- **Blockchain**: viem (Ethereum client library)
- **Validation**: zod (runtime type validation)
- **Logging**: consola
- **Math**: bignumber.js (arbitrary precision)
- **Config**: dotenv (environment variables)
- **MCP**: @modelcontextprotocol/sdk (AI model integration)

## Common Commands

### Development

```bash
bun install          # Install dependencies
bun run dev          # Watch mode with auto-reload
bun run start        # Run trading bot
bun test            # Run tests
bun test --watch    # Watch mode testing
bun run lint        # Check with Biome
bun run lint:fix    # Auto-fix with Biome
bun run format      # Format code with Biome
```

### Wallet Management

```bash
deepdex init                                  # Initialize wallet
deepdex wallet list                           # List all wallets
deepdex wallet info [name]                    # Display wallet address and balances
deepdex wallet create [name]                  # Create new wallet
deepdex wallet switch <name>                  # Switch active wallet
deepdex wallet import <private_key> [name]    # Import wallet from private key
deepdex wallet export [name]                  # Export private key
deepdex wallet transfer <amount> <token> <recipient>  # Transfer tokens
deepdex wallet transfer 50% USDC trading      # Transfer 50% of balance
```

### Account & Collateral

```bash
deepdex account create                        # Create subaccount
deepdex account list                          # List all subaccounts
deepdex account info [name]                   # Display account balance and margin
deepdex account deposit <amount> [token]      # Deposit collateral
deepdex account deposit 100% USDC             # Deposit all USDC
deepdex account withdraw <amount> [token]     # Withdraw collateral
deepdex account delegate [wallet]             # Delegate hot wallet authority
deepdex faucet [token]                        # Get testnet tokens
```

### Market Info

```bash
deepdex market list                           # List available trading pairs
deepdex market info <pair>                    # Get market details (ETH/USDC)
deepdex market orderbook <pair>               # Display order book
deepdex market price <pair>                   # Get current price
deepdex market funding <pair>                 # Check funding rates (perpetuals)
deepdex balance                               # Show portfolio balance
deepdex portfolio                             # Show detailed portfolio
```

### Spot Trading

```bash
deepdex spot buy <pair> <amount> [--price] [--post-only]
deepdex spot buy ETH/USDC 1                   # Buy 1 ETH at market
deepdex spot buy ETH/USDC 1 --price 2500      # Buy with limit price
deepdex spot sell <pair> <amount> [--price] [--reduce-only]
deepdex spot sell ETH/USDC 0.5                # Sell 0.5 ETH at market
```

### Perpetual Futures

```bash
deepdex perp long <pair> <amount> [--lev] [--price] [--tp] [--sl]
deepdex perp long ETH-USDC 1 --lev 10         # Long 1 ETH at 10x leverage
deepdex perp long ETH-USDC 25% --lev 5 --tp 2600 --sl 2400
deepdex perp short <pair> <amount> [--lev] [--price] [--tp] [--sl]
deepdex perp short SOL-USDC 10 --lev 5        # Short 10 SOL at 5x leverage
```

### Order Management

```bash
deepdex order list                            # List open orders
deepdex order cancel <id>                     # Cancel specific order
deepdex order cancel-all                      # Cancel all orders
deepdex order history                         # View trade history
```

### Position Management

```bash
deepdex position list                         # List open positions
deepdex position info <id>                    # Get position details
deepdex position close <id> [--size]          # Close position fully or partially
deepdex position modify <id> [--tp] [--sl]    # Update TP/SL
```

### Automated Bot (Single)

```bash
deepdex bot start [strategy] [--config config.json]  # Start bot in foreground
deepdex bot start grid                        # Start default grid strategy
deepdex bot start momentum --config ./configs/momentum.json
deepdex bot status                            # Check running bot status
deepdex bot stop                              # Stop bot gracefully
deepdex bot logs [--follow]                   # View bot logs
deepdex bot list-strategies                   # Show available strategies
deepdex bot backtest <strategy> [--config]    # Backtest strategy
```

### Process Manager (Multi-Bot)

```bash
deepdex pm ps                                 # List all running processes
deepdex pm start <name> <strategy> [--config] [--account]  # Start new process
deepdex pm start eth-grid grid --config ./configs/grid.json
deepdex pm start sol-dca simple --config ./configs/dca.json --account dca-bot
deepdex pm stop <name>                        # Gracefully stop process
deepdex pm restart <name>                     # Restart process
deepdex pm kill <name>                        # Force kill process
deepdex pm logs <name> [--follow] [-n 100]    # View process logs
deepdex pm stop-all                           # Stop all running processes
```

### Quota Management

```bash
deepdex quota check                           # Check quota for active wallet
deepdex quota info [address]                  # Get quota info for address
deepdex quota add <address> <amount>          # Add quota to account
deepdex quota stats                           # Show quota statistics
```

### Cross-Chain Bridge

```bash
deepdex bridge chains                         # List supported chains
deepdex bridge fees <chain> <amount> <token>  # Estimate bridge fees
deepdex bridge deposit <chain> <amount> <token>   # Deposit from external chain
deepdex bridge withdraw <chain> <amount> <token>  # Withdraw to external chain
deepdex bridge status <txHash>                # Check transaction status
```

### System & Config

```bash
deepdex config show                           # Display current config
deepdex config set <key> <value>              # Update config value
deepdex config reset                          # Reset to defaults
deepdex history trades                        # View trade history
deepdex history transfers                     # View transfer history
deepdex health                                # Run health check
deepdex health --json                         # JSON format
deepdex health --watch                        # Watch mode with refresh
```

### Aliases

```bash
deepdex buy <pair> <amount>   # Alias for spot buy
deepdex sell <pair> <amount>  # Alias for spot sell
deepdex long <pair> <amount>  # Alias for perp long
deepdex short <pair> <amount> # Alias for perp short
```

## Key Concepts

### Quota System

Quotas are system-level resource allocations for accounts on the DeepDex protocol. They control the rate of operations an account can perform:

- **Add Quota**: Allocate quota to an account with `deepdex quota add <address> <amount>`
- **Check Quota**: View available quota with `deepdex quota check`
- **Query Info**: Get detailed quota information with `deepdex quota info [address]`
- **Statistics**: View usage stats with `deepdex quota stats`

Quota amounts are unsigned 32-bit integers representing operation limits or transaction throughput constraints.

### Strategies

1. **Simple DCA** (`simple`): Dollar-cost averaging at regular intervals
2. **Grid Trading** (`grid`): Buy/sell at fixed intervals with inventory skewing
3. **Momentum** (`momentum`): Trend-following with moving averages
4. **Funding Rate Arbitrage** (`arbitrage`): Delta-neutral funding rate exploitation

### Subaccounts

Isolated accounts for managing different trading strategies and risk separately. Use `deepdex account create` to set up new subaccounts.

### Process Manager

Run multiple bots simultaneously with unique names:
```bash
deepdex pm start strategy-1 grid --config ./configs/grid.json
deepdex pm start strategy-2 dca --config ./configs/dca.json
deepdex pm ps    # List running processes
```

### Making Changes
1. **Code**: Edit TypeScript files in `src/`
2. **Validate**: Run `bun run lint --write` to auto-fix style issues
3. **Test**: Use `bun test` to verify functionality
4. **Build**: The `index.ts` file is the compiled entry point

### Adding Features
- Trading strategies go in `src/services/strategies/`
- New commands extend the CLI interface in `src/` or `index.ts`
- MCP tools are defined in `src/mcp/`
- Type definitions belong in `src/types/`

### Environment Variables
```bash
DEEPDEX_WALLET_PASSWORD      # Unlock wallets for trading
DEEPDEX_NEW_WALLET_PASSWORD  # Create new wallets
DEEPDEX_NON_INTERACTIVE      # Fail instead of prompting (for CI/CD)
```

## Important Files

- **index.ts**: CLI entry point and command dispatcher
- **GUIDE.md**: Complete CLI reference with all commands and options
- **src/services/**: Core trading logic (orders, accounts, strategies)
- **src/mcp/**: Model Context Protocol server for AI integration
- **configs/grid.json, dca.json**: Example strategy configurations
- **src/types/**: TypeScript interfaces for trading data structures

## Security & Key Storage

### Keyring Integration

Private keys are stored securely using OS-level credential storage:

- **macOS**: Keychain
- **Linux**: libsecret (GNOME) or kwallet (KDE)
- **Windows**: Credential Manager

Keys are never written to disk in plaintext. Memory is securely zeroed after use.

### Environment Variables for Automation

```bash
DEEPDEX_WALLET_PASSWORD       # Unlock wallets for trading
DEEPDEX_NEW_WALLET_PASSWORD   # Create/import wallets programmatically
DEEPDEX_NON_INTERACTIVE       # Fail instead of prompting (for CI/CD)
```

**Automation Example:**
```bash
# Create bot wallet programmatically
DEEPDEX_NEW_WALLET_PASSWORD="mypassword" deepdex wallet create bot-1

# Run trading command without prompts
export DEEPDEX_WALLET_PASSWORD="mypassword"
deepdex account deposit 100% USDC --yes
deepdex bot start grid --yes
```

## Health Check System

The `deepdex health` command runs comprehensive diagnostics:

**Checks:**
- RPC connection latency and block sync
- Oracle price feed freshness
- Wallet gas token balance
- Subaccount margin ratio and health
- Bot process status and resource usage
- Disk space and memory availability

**Exit Codes:**
- `0` = All checks passed
- `1` = One or more warnings
- `2` = One or more critical failures

**Usage:**
```bash
deepdex health                    # Run health check
deepdex health --json             # JSON output for parsing
deepdex health --watch            # Watch mode with 5s refresh
deepdex health --quiet            # Silent mode for scripts
```

## Common Tasks

### Adding a CLI Command
Extend the command parsing in `index.ts` or create new handler in `src/services/`.

### Implementing a Strategy
Create a new file in `src/services/strategies/` following the existing pattern (Simple, Grid, Momentum, Arbitrage).

### Debugging Trading Logic
Use `consola` for structured logging. Check the strategy implementation in `src/services/strategies/`.

### MCP Tool Integration
Add tools in `src/mcp/` to expose new functionality to Claude and other MCP clients.

## Network

- **RPC**: `https://rpc-testnet.deepdex.finance`
- **Network**: DeepDex Testnet
- **Contract Addresses**: Defined in `src/config/`

## Resources

- **Full Documentation**: See GUIDE.md for complete CLI reference
- **Quota Guide**: See QUOTA_GUIDE.md for quota management details
- **Example Configs**: configs/ directory contains grid.json, dca.json templates
- **Blockchain Interaction**: viem library (https://viem.sh)
- **Type Safety**: Zod schemas (https://zod.dev)
