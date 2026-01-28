# DeepDex CLI Guides

Complete documentation for the DeepDex CLI trading bot and utility suite.

## Quick Navigation

### Getting Started
- [**Getting Started**](./01-getting-started.md) - Init, wallet setup, quickstart
- [**Wallet Management**](./02-wallet-management.md) - Create, import, export, transfer wallets

### Trading & Accounts
- [**Account Management**](./03-account-management.md) - Subaccounts, deposits, withdrawals
- [**Market Data**](./04-market-data.md) - Market info, orderbook, prices, funding rates
- [**Spot Trading**](./05-spot-trading.md) - Buy/sell spot orders with limit and market prices
- [**Perpetual Trading**](./06-perpetual-trading.md) - Leveraged long/short positions with TP/SL

### Orders & Positions
- [**Order Management**](./07-order-management.md) - List, cancel, view order history
- [**Position Management**](./08-position-management.md) - Open positions, close, modify TP/SL

### Automation & Bots
- [**Automated Bot**](./09-bot-automation.md) - Start, stop, monitor single bot
- [**Process Manager**](./10-process-manager.md) - Run multiple bots simultaneously
- [**Strategies**](./11-strategies.md) - DCA, Grid, Momentum, Arbitrage

### System & Operations
- [**Quota Management**](./12-quota-management.md) - Account quota, allocation, monitoring
- [**Configuration**](./13-configuration.md) - Config show/set/reset
- [**History**](./14-history.md) - Trade and transfer history
- [**Health Checks**](./15-health-checks.md) - System diagnostics and monitoring

### Advanced Topics
- [**Security & Keyring**](./16-security.md) - Key storage, keyring integration, best practices
- [**MCP Server**](./17-mcp-server.md) - Model Context Protocol for AI integration
- [**Global Flags & Options**](./18-global-flags.md) - Flags, environment variables, aliases
- [**Output Conventions**](./19-output-conventions.md) - Display formats, colors, tables

---

## Command Tree Reference

```
deepdex
├── init                    # Setup wizard
├── help
│
├── wallet                  # 02-wallet-management.md
│   ├── list
│   ├── info
│   ├── create
│   ├── switch
│   ├── rename
│   ├── delete
│   ├── export
│   ├── import
│   ├── sign
│   └── transfer
│
├── account                 # 03-account-management.md
│   ├── create
│   ├── list
│   ├── info
│   ├── deposit
│   ├── withdraw
│   └── delegate
│
├── faucet                  # 01-getting-started.md
│
├── market                  # 04-market-data.md
│   ├── list
│   ├── info
│   ├── price
│   ├── orderbook
│   ├── trades
│   └── funding
│
├── balance                 # 04-market-data.md
├── portfolio
│
├── spot                    # 05-spot-trading.md
│   ├── buy
│   └── sell
│
├── perp                    # 06-perpetual-trading.md
│   ├── long
│   └── short
│
├── order                   # 07-order-management.md
│   ├── list
│   ├── cancel
│   ├── cancel-all
│   └── history
│
├── position                # 08-position-management.md
│   ├── list
│   ├── info
│   ├── close
│   └── modify
│
├── bot                     # 09-bot-automation.md
│   ├── start
│   ├── stop
│   ├── status
│   ├── logs
│   └── list-strategies
│
├── pm                      # 10-process-manager.md
│   ├── ps
│   ├── start
│   ├── stop
│   ├── restart
│   ├── logs
│   ├── kill
│   └── stop-all
│
├── config                  # 13-configuration.md
│   ├── show
│   ├── set
│   └── reset
│
├── history                 # 14-history.md
│   ├── trades
│   └── transfers
│
├── quota                   # 12-quota-management.md
│   ├── check
│   ├── info
│   ├── add
│   └── stats
│
├── health                  # 15-health-checks.md
│
├── mcp                     # 17-mcp-server.md
│
└── [aliases]               # 18-global-flags.md
    ├── buy   → spot buy
    ├── sell  → spot sell
    ├── long  → perp long
    └── short → perp short
```

---

## Common Workflows

### 1. Getting Started
```bash
deepdex init                          # Setup wallet
deepdex faucet                        # Get testnet tokens
deepdex account create                # Create subaccount
deepdex account deposit 1000 USDC     # Deposit collateral
```

### 2. Manual Trading
```bash
deepdex market info ETH/USDC          # Check price
deepdex spot buy ETH/USDC 1 --price 2500   # Limit order
deepdex perp long ETH-USDC 1 --lev 10      # Leverage position
deepdex order list                    # View orders
deepdex position list                 # View positions
```

### 3. Automated Trading
```bash
deepdex pm start eth-grid grid --config ./configs/grid.json
deepdex pm start sol-dca simple --config ./configs/dca.json
deepdex pm ps                         # Monitor all bots
deepdex pm logs eth-grid --follow     # Stream logs
```

### 4. Wallet Management
```bash
deepdex wallet list                   # List wallets
deepdex wallet create bot-wallet      # Create new wallet
deepdex wallet transfer 100 USDC bot  # Send tokens
deepdex wallet export                 # Backup private key
```

---

## Tips & Best Practices

- Use `--json` flag for scripts and monitoring
- Use `--yes` flag to skip confirmations in automation
- Set `DEEPDEX_WALLET_PASSWORD` for non-interactive use
- Use subaccounts to isolate trading strategies
- Run `deepdex health` before automation
- Check quota with `deepdex quota check` before trading
- Keep logs with `deepdex pm logs <name> --follow`

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DEEPDEX_WALLET_PASSWORD` | Unlock wallets for trading |
| `DEEPDEX_NEW_WALLET_PASSWORD` | Create/import wallets programmatically |
| `DEEPDEX_NON_INTERACTIVE` | Fail instead of prompting |
| `DEBUG` | Show detailed error traces |

---

## Getting Help

```bash
deepdex help                          # Main help
deepdex help <command>                # Command help
deepdex <command> --help              # Same as above
```

Each guide has detailed examples and explanations for its commands.
