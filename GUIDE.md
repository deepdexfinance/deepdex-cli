# DeepDex CLI Design Guide

This document outlines the comprehensive CLI design for **DeepDex**, a high-performance trading bot and utility suite for the DeepDex protocol.

---

## 📋 Complete Command Tree

```
deepdex
├── init                    # Setup wizard
├── help
│
├── wallet
│   ├── list
│   ├── info
│   ├── create
│   ├── switch
│   ├── rename
│   ├── delete
│   ├── export
│   ├── import
│   ├── sign
│   └── transfer            # Transfer tokens between wallets
│
├── account
│   ├── create
│   ├── list
│   ├── info [name]
│   ├── deposit
│   ├── withdraw
│   └── delegate
│
├── faucet [token]
│
├── market
│   ├── list
│   ├── info <pair>
│   ├── orderbook <pair>
│   ├── trades <pair>
│   ├── price <pair>
│   └── funding <pair>
│
├── balance
├── portfolio
│
├── spot
│   ├── buy <pair> <amount> [--price] [--post-only]
│   └── sell <pair> <amount> [--price] [--reduce-only]
│
├── perp
│   ├── long <pair> <amount> [--lev] [--price] [--tp] [--sl]
│   └── short <pair> <amount> [--lev] [--price] [--tp] [--sl]
│
├── order
│   ├── list
│   ├── cancel <id>
│   ├── cancel-all
│   └── history
│
├── position
│   ├── list
│   ├── info <id>
│   ├── close <id> [--size]
│   └── modify <id> [--tp] [--sl]
│
├── bot
│   ├── start [strategy] [--config]
│   ├── stop
│   ├── status
│   ├── logs
│   ├── list-strategies
│   └── backtest <strategy>
│
├── pm                      # Process Manager (multi-bot)
│   ├── ps                  # List all processes
│   ├── start <name> <strategy> [--config]
│   ├── stop <name>
│   ├── restart <name>
│   ├── logs <name>
│   ├── kill <name>
│   └── stop-all
│
├── config
│   ├── show
│   ├── set <key> <value>
│   └── reset
│
├── history
│   ├── trades
│   └── transfers
│
├── health                  # System health check
│
└── [aliases]
    ├── buy   → spot buy
    ├── sell  → spot sell
    ├── long  → perp long
    └── short → perp short
```

---

## 💡 CLI Workflow Design

The DeepDex CLI guides users through a seamless onboarding and trading process:

### 1. 🔐 Wallet Setup
- **Initialize**: Run `deepdex init` to create a new local wallet or import an existing private key.
- **Verification**: The CLI displays the public address and queries the chain for native token balance (Gas).

### 2. 💰 Asset Management
- **Fund Wallet**: User sends Testnet tokens to the generated address.
- **Mint/Add Tokens**: Use `deepdex faucet` to mint testnet USDC or add existing tokens.
- **Deposit**: Deposit collateral into the DeepDex Subaccount smart contract.

### 3. ⚙️ Account Configuration
- **Create Subaccount**: Register a unique trading subaccount on-chain to isolate positions.
- **Delegate Permissions**: (Optional) Delegate signing authority to a "hot wallet" for automated trading.

### 4. 🤖 Start Trading Bot
- **Select Strategy**: Choose from available presets (e.g., *Spot Grid*, *Perp Market Maker*).
- **Launch**: The bot enters an event loop, listening to Oracle updates and executing orders.

---

## 💻 Command Reference

### General Commands

#### `deepdex init`
Initializes the local environment, creates/imports a wallet, and sets up configuration files.

#### `deepdex help [command]`
Displays a list of available commands and usage instructions.

---

### Wallet Management

DeepDex supports multiple wallets for different purposes (trading, bots, cold storage).

#### `deepdex wallet list`
List all wallets with their addresses.
```bash
deepdex wallet list
deepdex wallet list --json
```

**Output:**
```
→ default (active)
    0x1234...5678

  trading
    0xabcd...ef01

  bot-wallet
    0x9876...5432
```

#### `deepdex wallet info [name]`
Display wallet address, balances, and nonce.
```bash
deepdex wallet info              # Active wallet
deepdex wallet info trading      # Specific wallet
```

#### `deepdex wallet create [name]`
Create a new wallet with optional name.
```bash
deepdex wallet create            # Auto-generates name (wallet-2, wallet-3, etc.)
deepdex wallet create trading    # Create wallet named "trading"
deepdex wallet create bot-wallet
```

**Automation (non-interactive):**
```bash
# Using environment variable
DEEPDEX_NEW_WALLET_PASSWORD="mypassword" deepdex wallet create bot-1

# Using --password flag
deepdex wallet create bot-2 --password mypassword123
```

**Options:**
- `--password <password>` - Password for wallet encryption (for automation)

#### `deepdex wallet switch <name>`
Switch the active wallet.
```bash
deepdex wallet switch trading
deepdex wallet switch default
```

#### `deepdex wallet rename <current_name> <new_name>`
Rename an existing wallet.
```bash
deepdex wallet rename default main-wallet
```

#### `deepdex wallet delete <name>`
Delete a wallet (requires confirmation).
```bash
deepdex wallet delete old-wallet
```

#### `deepdex wallet export [name]`
Export private key (requires confirmation).
```bash
deepdex wallet export            # Export active wallet
deepdex wallet export trading    # Export specific wallet
```

#### `deepdex wallet import <private_key> [name]`
Import wallet from private key.
```bash
deepdex wallet import 0x...                # Import as auto-named wallet
deepdex wallet import 0x... trading        # Import as "trading"
```

**Automation (non-interactive):**
```bash
# Using environment variable
DEEPDEX_NEW_WALLET_PASSWORD="mypassword" deepdex wallet import 0x... my-wallet

# Using --password flag
deepdex wallet import 0x... my-wallet --password mypassword123
```

**Options:**
- `--password <password>` - Password for wallet encryption (for automation)

#### `deepdex wallet sign <message>`
Sign an arbitrary message with your wallet.

#### `deepdex wallet transfer <amount> <token> [recipient]`
Transfer tokens to another wallet or address. Amount can be a number or a percentage of your balance.
```bash
deapdex wallet transfer 10 USDC trading          # Transfer to wallet named "trading"
deepdex wallet transfer 50% USDC trading         # Transfer 50% of USDC balance
deepdex wallet transfer 100% tDGAS 0x1234...     # Transfer all tDGAS to address
deepdex wallet transfer 1 ETH --to 0x5678...     # Using --to flag
```

**Options:**
- `--to <address|wallet_name>` - Recipient address or wallet name

**Supported Tokens:**
- `tDGAS` - Native gas token
- `USDC` - USD Coin
- `ETH` - Ethereum

**Notes:**
- If recipient is omitted, prompts interactively with available wallets
- Accepts both wallet names and addresses as recipients
- Checks balance before transfer
- Waits for transaction confirmation

---

### Account Management

#### `deepdex account create [name]`
Registers a new DeepDex subaccount on-chain.

#### `deepdex account list`
Lists all created subaccounts and their statuses.

#### `deepdex account info [name]`
Display detailed information about a specific subaccount.

#### `deepdex account deposit <amount> <token>`
Deposits assets (e.g., USDC, ETH) from your main wallet into a subaccount. Amount can be a number or a percentage of your wallet balance.
```bash
deepdex account deposit 1000 USDC
deepdex account deposit 50% USDC                  # Deposit 50% of wallet USDC balance
deepdex account deposit 100% ETH --account trading-main  # Deposit all ETH
```

#### `deepdex account withdraw <amount> <token>`
Withdraws assets from a subaccount back to your main wallet. Amount can be a number or a percentage of your subaccount balance.
```bash
deepdex account withdraw 500 USDC
deepdex account withdraw 50% USDC --account trading-main  # Withdraw 50% of subaccount balance
deepdex account withdraw 100% ETH                 # Withdraw all ETH
```

#### `deepdex account delegate <subaccount> <delegate_address>`
Delegates trading authority of a subaccount to another address (e.g., a hot wallet for bot execution).

---

### Faucet (Testnet)

#### `deepdex faucet [--token <USDC|ETH>]`
Mint testnet tokens to your wallet.
```bash
deepdex faucet              # Mint default token (USDC)
deepdex faucet --token ETH  # Mint testnet ETH
```

---

### Market Data

#### `deepdex market list`
Displays all available Spot and Perpetual markets with current prices.

#### `deepdex market info <pair>`
Detailed market specifications (tick size, lot size, fees, limits).
```bash
deepdex market info ETH/USDC
```

#### `deepdex market orderbook <pair>`
Display live orderbook depth.
```bash
deepdex market orderbook ETH-USDC --depth 10
```

#### `deepdex market trades <pair>`
Show recent trade history for a market.

#### `deepdex market price <pair>`
Quick price check (oracle price + mark price).

#### `deepdex market funding <pair>`
Display funding rate history for perpetual markets.

---

### Portfolio & Balance

#### `deepdex balance`
Show all token balances across wallet and subaccounts.
```bash
deepdex balance
deepdex balance --account trading-main
```

#### `deepdex portfolio`
Portfolio summary with unrealized P&L, margin usage, and risk metrics.

---

### Spot Trading

#### `deepdex spot buy <pair> <amount> [options]`
Execute a spot buy order. Amount can be a number or a percentage of your quote token (USDC) balance.
```bash
deepdex spot buy ETH/USDC 1.5                    # Market order
deepdex spot buy ETH/USDC 50%                    # Buy with 50% of USDC balance
deepdex spot buy ETH/USDC 1.5 --price 2000       # Limit order
deepdex spot buy ETH/USDC 1.5 --price 2000 --post-only
```

**Options:**
- `--price <price>` - Limit price (omit for market order)
- `--post-only` - Ensure order is maker only
- `--account <name>` - Specify subaccount

#### `deepdex spot sell <pair> <amount> [options]`
Execute a spot sell order. Amount can be a number or a percentage of your base token balance.
```bash
deepdex spot sell ETH/USDC 1.5 --price 2100
deepdex spot sell ETH/USDC 50%                   # Sell 50% of ETH balance
deepdex spot sell ETH/USDC 100% --reduce-only    # Sell all ETH
```

**Options:**
- `--price <price>` - Limit price (omit for market order)
- `--reduce-only` - Only reduce existing position
- `--account <name>` - Specify subaccount

---

### Perpetual Trading

#### `deepdex perp long <pair> <amount> [options]`
Open a long perpetual position. Amount can be a number or a percentage of your available margin.
```bash
deepdex perp long ETH-USDC 1.5 --lev 10
deepdex perp long ETH-USDC 50% --lev 10          # Use 50% of available margin
deepdex perp long ETH-USDC 100% --lev 5          # Use all available margin at 5x
deepdex perp long ETH-USDC 1.5 --lev 10 --price 2000 --tp 2200 --sl 1900
```

**Options:**
- `--lev, --leverage <n>` - Leverage multiplier (default: 1)
- `--price <price>` - Limit price (omit for market order)
- `--tp <price>` - Take-profit price
- `--sl <price>` - Stop-loss price
- `--reduce-only` - Only reduce existing position
- `--account <name>` - Specify subaccount

#### `deepdex perp short <pair> <amount> [options]`
Open a short perpetual position.
```bash
deepdex perp short SOL-USDC 50 --lev 5 --tp 20 --sl 28
deepdex perp short SOL-USDC 25% --lev 3          # Use 25% of available margin
```

*(Same options as `perp long`)*

---

### Order Management

#### `deepdex order list [options]`
List open orders.
```bash
deepdex order list
deepdex order list --market ETH-USDC
deepdex order list --status filled
```

**Options:**
- `--market <pair>` - Filter by market
- `--status <open|filled|cancelled>` - Filter by status
- `--account <name>` - Filter by subaccount

#### `deepdex order cancel <order_id>`
Cancel a specific order.
```bash
deepdex order cancel 0x1234...
```

#### `deepdex order cancel-all [options]`
Cancel all open orders. **Requires confirmation.**
```bash
deepdex order cancel-all
deepdex order cancel-all --market ETH-USDC
deepdex order cancel-all --yes  # Skip confirmation
```

#### `deepdex order history [options]`
View order history.
```bash
deepdex order history --limit 50
```

---

### Position Management

#### `deepdex position list`
List all open positions.
```bash
deepdex position list
deepdex position list --account trading-main
```

#### `deepdex position info <position_id>`
Display detailed position information including entry price, P&L, liquidation price.

#### `deepdex position close <position_id> [options]`
Close a position (fully or partially). Size can be a number or a percentage of the position.
```bash
deepdex position close ETH-USDC                # Close entire position
deepdex position close ETH-USDC --size 0.5     # Close 0.5 units
deepdex position close ETH-USDC --size 50%     # Close 50% of position
deepdex position close ETH-USDC --size 100%    # Close entire position
```

#### `deepdex position modify <position_id> [options]`
Modify take-profit and stop-loss levels.
```bash
deepdex position modify 0x1234... --tp 2500 --sl 2000
```

---

### Bot Execution

#### `deepdex bot start [strategy] [options]`
Start the automated trading bot.
```bash
deepdex bot start                          # Default strategy
deepdex bot start grid --config ./my-grid.json
deepdex bot start mm --account bot-wallet
```

**Available Strategies:**
1. **Simple DCA (`simple`)**: Dollar-cost averaging.
2. **Grid Trading (`grid`)**: Range-bound trading with inventory skewing.
3. **Momentum (`momentum`)**: Trend following with moving averages.
4. **Arbitrage (`arbitrage`)**: Funding rate arbitrage (Delta Neutral).

**Options:**
- `--strategy <name>` - Strategy: `grid`, `momentum`, `arbitrage`, `simple`
- `--config <path>` - Path to strategy configuration file
- `--account <name>` - Subaccount to use
- `--daemon` - Run in background

#### `deepdex bot stop`
Gracefully stop the running bot.

#### `deepdex bot status`
Check if bot is running and display current state.

#### `deepdex bot logs [options]`
View bot execution logs.
```bash
deepdex bot logs
deepdex bot logs --follow  # Stream logs
deepdex bot logs --lines 100
```

#### `deepdex bot list-strategies`
List all available trading strategies with descriptions.

#### `deepdex bot backtest <strategy> [options]`
Backtest a strategy against historical data.
```bash
deepdex bot backtest grid --from 2024-01-01 --to 2024-06-01 --config ./grid.json
```

---

### Configuration

#### `deepdex config show`
Display current configuration.

#### `deepdex config set <key> <value>`
Update a configuration value.
```bash
deepdex config set default_account trading-main
deepdex config set rpc_url https://custom-rpc.example.com
```

#### `deepdex config reset`
Reset configuration to defaults. **Requires confirmation.**

#### `deepdex config export`
Export configuration to file for backup.

#### `deepdex config import <file>`
Import configuration from file.

---

### History

#### `deepdex history trades [options]`
View personal trade history.
```bash
deepdex history trades --market ETH-USDC --limit 100
```

#### `deepdex history transfers`
View deposit and withdrawal history.

---

### Utility Commands

#### `deepdex quickstart`
Interactive wizard: `init` → `faucet` → `account create` → `deposit` in one flow.

#### `deepdex emergency-exit`
**Panic button**: Cancel all orders and close all positions. **Requires confirmation.**

#### `deepdex report [options]`
Generate trading report with P&L, volume, and fees.
```bash
deepdex report --period 24h
deepdex report --period 7d --format json
```

#### `deepdex health [options]`
Run comprehensive system health checks.
```bash
deepdex health
deepdex health --json
deepdex health --watch   # Continuous monitoring
```

**Output Example:**
```
┌─────────────────────────────────────────────────────────┐
│                    DeepDex Health Check                 │
├─────────────────────────────────────────────────────────┤
│ Component          │ Status │ Details                   │
├────────────────────┼────────┼───────────────────────────┤
│ RPC Connection     │   ✓    │ 45ms latency              │
│ Oracle Feed        │   ✓    │ Last update: 2s ago       │
│ Chain Sync         │   ✓    │ Block #1234567            │
│ Wallet Balance     │   ✓    │ 0.05 ETH (gas)            │
│ Subaccount         │   ✓    │ trading-main active       │
│ Bot Process        │   ✓    │ PID 12345 (grid)          │
│ Disk Space         │   ✓    │ 2.3 GB free               │
│ Memory Usage       │   ✓    │ 128 MB / 512 MB           │
└────────────────────┴────────┴───────────────────────────┘

Overall: ✓ All systems operational
```

**Options:**
- `--json` - Output in JSON format for monitoring tools
- `--watch` - Continuously monitor (updates every 5s)
- `--component <name>` - Check specific component only

---

## 🎯 Global Flags

These flags work with all commands:

| Flag | Description |
|------|-------------|
| `--account, -a <name>` | Specify subaccount to use |
| `--json` | Output in JSON format (machine-readable) |
| `--yes, -y` | Skip confirmation prompts |
| `--verbose, -v` | Show detailed output |
| `--dry-run` | Simulate without executing |
| `--help, -h` | Show help for command |
| `--password` | Wallet password (for wallet create/import) |

---

## 🔑 Environment Variables

For automation and non-interactive use:

| Variable | Description |
|----------|-------------|
| `DEEPDEX_WALLET_PASSWORD` | Password for unlocking existing wallets |
| `DEEPDEX_NEW_WALLET_PASSWORD` | Password for creating/importing new wallets |
| `DEEPDEX_NON_INTERACTIVE` | Set to "true" to fail instead of prompting |

**Example Usage:**
```bash
# Create multiple wallets in a script
export DEEPDEX_NEW_WALLET_PASSWORD="mypassword"
for i in {1..10}; do
  deepdex wallet create "bot-$i"
done

# Run bot with password from env
export DEEPDEX_WALLET_PASSWORD="mypassword"
deepdex pm start my-bot momentum --config ./config.json --yes
```

---

## ⌨️ Command Aliases

Quick shortcuts for common operations:

| Alias | Expands To |
|-------|------------|
| `deepdex buy` | `deepdex spot buy` |
| `deepdex sell` | `deepdex spot sell` |
| `deepdex long` | `deepdex perp long` |
| `deepdex short` | `deepdex perp short` |

---

## 🎨 Output Conventions

| Context | Display |
|---------|---------|
| Prices going up | 🟢 Green text |
| Prices going down | 🔴 Red text |
| Buy orders / Long | Green/Cyan |
| Sell orders / Short | Red/Magenta |
| Success | ✓ Checkmark |
| Error | ✗ With helpful message |
| Pending | ⏳ Spinner animation |
| Tables | Clean box-drawing characters |

---

## 🔐 Security Considerations

### Confirmation Required
These operations require `--yes` flag or interactive confirmation:
- `order cancel-all`
- `position close` (large positions)
- `account withdraw` (full amount)
- `wallet export`
- `config reset`
- `emergency-exit`

### Recommended Practices
- Use subaccount delegation for bot trading (keep main wallet secure)
- Store private keys in OS keyring when available
- Set spending limits for automated trading
- Enable notifications for liquidation warnings

---

## 🔧 Configuration File

Default location: `~/.deepdex/config.json`

```json
{
  "default_account": "main",
  "rpc_url": "https://rpc-testnet.deepdex.finance",
  "confirmations": true,
  "output_format": "table",
  "notifications": {
    "discord_webhook": null,
    "telegram_bot": null
  },
  "trading": {
    "default_leverage": 1,
    "max_slippage": 0.5,
    "auto_approve": false
  }
}
```

---

## 🏗️ Core Architecture

### Multi-Wallet Management

DeepDex supports multiple local wallets, each with its own private key:

```
┌─────────────────────────────────────────────────────────────┐
│                    Local Wallet Store                        │
│                   (~/.deepdex/wallets.json)                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
  ┌───────────┐         ┌───────────┐         ┌───────────┐
  │  default  │         │  trading  │         │ bot-wallet│
  │  (active) │         │           │         │           │
  │ 0x1234... │         │ 0xabcd... │         │ 0x9876... │
  └───────────┘         └───────────┘         └───────────┘
    Cold Storage          Hot Wallet           Automation
```

**Key Features:**
- Each wallet has a unique name and encrypted private key
- One wallet is "active" at a time (used by default)
- Switch between wallets with `deepdex wallet switch`
- Transfer tokens between wallets with `deepdex wallet transfer`

**Common Workflows:**

```bash
# Create wallets for different purposes
deepdex wallet create trading      # For manual trading
deepdex wallet create bot-wallet   # For automated bots

# Fund wallets from main
deepdex wallet switch default
deepdex wallet transfer 100 USDC trading
deepdex wallet transfer 50 USDC bot-wallet

# Switch to trading wallet
deepdex wallet switch trading

# List all wallets
deepdex wallet list
```

**Storage:**
- Wallets stored in `~/.deepdex/wallets.json`
- Private keys encrypted with AES-256-GCM
- Password required to unlock wallet for signing

---

### Multi-Subaccount Strategy

DeepDex supports multiple isolated subaccounts for different trading strategies:

```
┌─────────────────────────────────────────────────────┐
│                   Main Wallet                       │
│                  (Cold Storage)                     │
└───────────┬───────────┬───────────┬────────────────┘
            │           │           │
            ▼           ▼           ▼
     ┌──────────┐ ┌──────────┐ ┌──────────┐
     │ trading  │ │   grid   │ │   mm     │
     │  -main   │ │  -bot    │ │  -bot    │
     └──────────┘ └──────────┘ └──────────┘
       Manual      Grid Bot    Market Maker
```

**Usage:**
```bash
# Create subaccounts
deepdex account create trading-main
deepdex account create grid-bot
deepdex account create mm-bot

# Specify account per command
deepdex spot buy ETH/USDC 1 --account trading-main
deepdex bot start grid --account grid-bot

# Set default account
deepdex config set default_account trading-main
```

**Behavior:**
- Each subaccount has isolated margin and positions
- `--account` flag overrides the default
- Funds must be deposited per-subaccount

---

### Daemon & Process Management

The bot supports both foreground and background execution:

| Mode | Command | Use Case |
|------|---------|----------|
| Foreground | `deepdex bot start` | Development, debugging |
| Background | `deepdex bot start --daemon` | Production, single bot |
| Multi-Process | `deepdex pm start` | Production, multiple bots |

---

### Process Manager (`pm`)

The `pm` command provides PM2/Docker Compose style process management for running multiple bots simultaneously with unique names.

#### `deepdex pm ps`
List all registered processes with their status.
```bash
deepdex pm ps
deepdex pm ps --json
```

**Output:**
```
╭───📋 Process Manager─────────────────────────────────────╮
│                                                          │
│  3 processes registered                                  │
│                                                          │
╰──────────────────────────────────────────────────────────╯

┌──────────┬──────────┬───────┬─────────┬────────────┬──────────┐
│ Name     │ Strategy │ PID   │ Account │ Status     │ Uptime   │
├──────────┼──────────┼───────┼─────────┼────────────┼──────────┤
│ eth-grid │ grid     │ 12345 │ default │ 🟢 running │ 2h 15m   │
│ btc-dca  │ simple   │ 12346 │ trading │ 🟢 running │ 45m      │
│ arb-bot  │ arbitrage│ 12347 │ default │ 🔴 stopped │ -        │
└──────────┴──────────┴───────┴─────────┴────────────┴──────────┘
```

#### `deepdex pm start <name> <strategy> [options]`
Start a new named process in the background.
```bash
deepdex pm start eth-grid grid --config ./configs/grid.json
deepdex pm start btc-dca simple --config ./configs/dca.json --account trading
```

**Options:**
- `--config <path>` - Path to strategy config file
- `--account, -a <name>` - Subaccount to use

**Process Name Rules:**
- Must be unique across all processes
- Alphanumeric characters, dashes, and underscores only
- Maximum 32 characters

#### `deepdex pm stop <name>`
Gracefully stop a process (sends SIGTERM).
```bash
deepdex pm stop eth-grid
deepdex pm stop eth-grid --yes  # Skip confirmation
```

#### `deepdex pm restart <name>`
Restart a process with the same configuration.
```bash
deepdex pm restart eth-grid
```

#### `deepdex pm logs <name> [options]`
View logs for a specific process.
```bash
deepdex pm logs eth-grid
deepdex pm logs eth-grid --follow  # Stream logs (like tail -f)
deepdex pm logs eth-grid -n 100    # Show last 100 lines
```

**Options:**
- `--follow, -f` - Stream logs continuously
- `--lines, -n <number>` - Number of lines to show (default: 50)

#### `deepdex pm kill <name>`
Force kill a process (sends SIGKILL).
```bash
deepdex pm kill eth-grid
```

#### `deepdex pm stop-all`
Stop all running processes.
```bash
deepdex pm stop-all
deepdex pm stop-all --yes  # Skip confirmation
```

**PM Files:**
- Process Store: `~/.deepdex/processes.json`
- Process Logs: `~/.deepdex/logs/processes/<name>.log`

---

**Example Multi-Bot Workflow:**
```bash
# Start multiple bots with different strategies
deepdex pm start eth-grid grid --config ./configs/eth-grid.json
deepdex pm start sol-momentum momentum --config ./configs/sol-momentum.json  
deepdex pm start arb-bot arbitrage --config ./configs/arb.json --account arb

# Check all running processes
deepdex pm ps

# View logs for a specific bot
deepdex pm logs eth-grid --follow

# Restart a bot after config change
deepdex pm restart eth-grid

# Stop individual bot
deepdex pm stop sol-momentum

# Stop everything
deepdex pm stop-all
```

**Single Bot Lifecycle (using `bot` command):**
```bash
# Start in foreground (Ctrl+C to stop)
deepdex bot start grid

# Start as daemon
deepdex bot start grid --daemon
# → Bot started (PID: 12345)

# Check status
deepdex bot status
# → Running: grid strategy on account "grid-bot" (PID: 12345)

# Graceful shutdown
deepdex bot stop
# → Sending SIGTERM to bot (PID: 12345)...
# → Bot stopped gracefully

# View logs
deepdex bot logs --follow
```

**Bot PID File:** `~/.deepdex/bot.pid`
**Bot Log File:** `~/.deepdex/logs/bot.log`

---

### Keyring Integration

Private keys are stored securely using OS-level credential storage:

```
┌─────────────────────────────────────────────────────┐
│                  Key Storage Flow                   │
└─────────────────────────────────────────────────────┘

     ┌──────────────┐
     │ deepdex init │
     └──────┬───────┘
            │
            ▼
   ┌────────────────────┐
   │ OS Keyring Available│
   │   (macOS/Linux)?   │
   └────────┬───────────┘
            │
       ┌────┴────┐
       │         │
       ▼         ▼
   ┌───────┐  ┌─────────────────┐
   │  Yes  │  │       No        │
   └───┬───┘  └────────┬────────┘
       │               │
       ▼               ▼
┌─────────────┐  ┌─────────────────┐
│ Store in    │  │ Encrypted file  │
│ OS Keyring  │  │ ~/.deepdex/key  │
│ (Keychain,  │  │ (AES-256-GCM)   │
│  libsecret) │  │ + password      │
└─────────────┘  └─────────────────┘
```

**Supported Keyring Backends:**
| OS | Backend |
|----|---------|
| macOS | Keychain |
| Linux | libsecret (GNOME), kwallet (KDE) |
| Windows | Credential Manager |

**Commands:**
```bash
# Import with keyring storage
deepdex wallet import 0xPRIVATE_KEY
# → Private key stored in OS keyring ✓

# Export (requires confirmation)
deepdex wallet export
# → ⚠️  WARNING: This will display your private key.
# → Type "EXPORT" to confirm: 

# Force encrypted file storage
deepdex wallet import 0xKEY --no-keyring
# → Enter encryption password: ****
```

**Security Features:**
- Keys never written to disk in plaintext
- Memory wiped after use (secure zeroing)
- Export requires explicit confirmation
- Session timeout for unlocked keys

---

### Health Check System

The `deepdex health` command performs comprehensive system diagnostics:

```
┌─────────────────────────────────────────────────────────┐
│                   Health Check Flow                     │
└─────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │ deepdex      │
     │ health       │
     └──────┬───────┘
            │
            ▼
   ┌────────────────────────────────────────┐
   │           Run All Checks               │
   │  (parallel execution for speed)        │
   └────────────────────────────────────────┘
            │
   ┌────────┼────────┬────────┬────────┐
   │        │        │        │        │
   ▼        ▼        ▼        ▼        ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ RPC  │ │Oracle│ │Wallet│ │ Bot  │ │System│
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘
```

**Check Components:**

| Component | What It Checks | Warning Threshold | Critical Threshold |
|-----------|----------------|-------------------|-------------------|
| **RPC Connection** | Latency, block sync | >500ms | >2000ms or offline |
| **Oracle Feed** | Price freshness | >30s stale | >60s stale |
| **Chain Sync** | Block height vs expected | >10 blocks behind | >50 blocks behind |
| **Wallet Balance** | Gas token balance | <0.01 ETH | <0.001 ETH |
| **Subaccount** | Margin ratio, health | <50% margin | <20% margin |
| **Bot Process** | Running, responsive | High CPU/memory | Crashed or hung |
| **Disk Space** | Log storage | <1 GB free | <100 MB free |
| **Memory** | Process memory usage | >80% limit | >95% limit |

**Exit Codes:**
```
Exit 0  → All checks passed
Exit 1  → One or more warnings
Exit 2  → One or more critical failures
```

**Integration with Monitoring:**
```bash
# Prometheus-compatible output
deepdex health --format prometheus

# JSON for alerting systems
deepdex health --json | jq '.checks[] | select(.status != "ok")'

# Use in scripts
if ! deepdex health --quiet; then
  echo "Health check failed!"
  deepdex emergency-exit --yes
fi
```

**Continuous Monitoring:**
```bash
# Watch mode with 5s refresh
deepdex health --watch

# Custom interval
deepdex health --watch --interval 30

# Alert on status change
deepdex health --watch --alert-cmd "notify-send 'DeepDex Alert'"
```

---

## 🚀 Future Considerations

- **Interactive Mode**: `deepdex shell` for REPL-style interface
- **Advanced Orders**: OCO, trailing stops, iceberg orders
- **Notifications**: Discord/Telegram webhooks for fills and liquidations
- **Multi-Chain**: Support for multiple EVM networks
- **Plugin System**: Custom strategy development framework
