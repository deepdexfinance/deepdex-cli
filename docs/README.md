# DeepDex CLI Documentation

Complete documentation for the DeepDex CLI trading bot and utility suite.

## 📚 Documentation Structure

- **[Guides](./guides/)** - Comprehensive command reference and workflows
  - Getting started, wallet management, trading, automation, and advanced topics
  
- **[GUIDE.md](../GUIDE.md)** - Original CLI design document (being migrated to guides/)

- **[QUOTA_GUIDE.md](../QUOTA_GUIDE.md)** - Detailed quota management documentation

- **[README.md](../README.md)** - Project overview and quick start

---

## Quick Start

```bash
# Initialize wallet
deepdex init

# Get testnet tokens
deepdex faucet

# Create subaccount
deepdex account create

# Start trading
deepdex spot buy ETH/USDC 1.0
deepdex perp long ETH-USDC 1.0 --lev 10

# Run automated bot
deepdex bot start grid
```

---

## Guides Overview

### Getting Started (New Users)
1. [**Getting Started**](./guides/01-getting-started.md) - Init, faucet, quickstart
2. [**Wallet Management**](./guides/02-wallet-management.md) - Create, import, transfer

### Core Features
3. [**Account Management**](./guides/03-account-management.md) - Subaccounts, deposits, withdrawals
4. [**Market Data**](./guides/04-market-data.md) - Prices, orderbooks, market info
5. [**Spot Trading**](./guides/05-spot-trading.md) - Buy and sell orders
6. [**Perpetual Trading**](./guides/06-perpetual-trading.md) - Leveraged positions

### Order & Position Management
7. [**Order Management**](./guides/07-order-management.md) - List, cancel, history
8. [**Position Management**](./guides/08-position-management.md) - Open, close, modify

### Automation
9. [**Automated Bot**](./guides/09-bot-automation.md) - Single bot management
10. [**Process Manager**](./guides/10-process-manager.md) - Multiple bots
11. [**Strategies**](./guides/11-strategies.md) - DCA, Grid, Momentum, Arbitrage

### System & Operations
12. [**Quota Management**](./guides/12-quota-management.md) - Account quotas
13. [**Configuration**](./guides/13-configuration.md) - Config management
14. [**History**](./guides/14-history.md) - Trade and transfer history
15. [**Health Checks**](./guides/15-health-checks.md) - System diagnostics

### Advanced
16. [**Security & Keyring**](./guides/16-security.md) - Key storage, best practices
17. [**MCP Server**](./guides/17-mcp-server.md) - AI integration
18. [**Global Flags**](./guides/18-global-flags.md) - Flags, env vars, aliases
19. [**Output Conventions**](./guides/19-output-conventions.md) - Display formats

---

## Common Workflows

### Manual Trading
```bash
deepdex market info ETH/USDC           # Check price
deepdex spot buy ETH/USDC 1            # Buy spot
deepdex perp long ETH-USDC 1 --lev 10  # Leverage
deepdex position list                  # View positions
deepdex order cancel <id>              # Cancel order
```

### Automated Trading
```bash
deepdex pm start eth-grid grid --config ./configs/grid.json
deepdex pm ps                          # Monitor
deepdex pm logs eth-grid --follow      # Stream logs
```

### Account Setup
```bash
deepdex wallet create bot              # New wallet
deepdex account create trading         # New account
deepdex quota add 0xAddress... 5000     # Add quota
deepdex account deposit 1000 USDC      # Deposit funds
```

---

## Command Tree

See [guides/README.md](./guides/README.md) for the complete command tree and index.

---

## Finding Help

| Task | Resource |
|------|----------|
| **Getting started?** | [01-getting-started.md](./guides/01-getting-started.md) |
| **Want to trade?** | [05-spot-trading.md](./guides/05-spot-trading.md) or [06-perpetual-trading.md](./guides/06-perpetual-trading.md) |
| **Need automation?** | [09-bot-automation.md](./guides/09-bot-automation.md) or [10-process-manager.md](./guides/10-process-manager.md) |
| **Managing accounts?** | [03-account-management.md](./guides/03-account-management.md) |
| **Security concerns?** | [16-security.md](./guides/16-security.md) |
| **Advanced features?** | [17-mcp-server.md](./guides/17-mcp-server.md) |

---

## Environment Variables

```bash
DEEPDEX_WALLET_PASSWORD      # Unlock wallets for trading
DEEPDEX_NEW_WALLET_PASSWORD  # Create/import wallets programmatically
DEEPDEX_NON_INTERACTIVE      # Fail instead of prompting (for scripts)
DEBUG                         # Show detailed error traces
```

---

## Tips

- Use `--json` flag for scripts and integration
- Use `--yes` flag to skip confirmations in automation
- Set `DEEPDEX_WALLET_PASSWORD` for non-interactive use
- Run `deepdex health` before automation to diagnose issues
- Check `deepdex quota check` before trading
- Use `deepdex pm logs <name> --follow` to monitor bots in real-time

---

## Related Resources

- **[Project README](../README.md)** - Features, installation, tech stack
- **[GUIDE.md](../GUIDE.md)** - Original design guide (being migrated)
- **[QUOTA_GUIDE.md](../QUOTA_GUIDE.md)** - Quota detailed reference
- **[GitHub Repository](https://github.com/stonega/deepdex-trader)**

---

## Migration Notice

The original `GUIDE.md` is being migrated to individual guides in the `guides/` folder for better organization and readability. Both resources are available during the transition.

**Last Updated**: January 2026

---

## Navigation

- **[View All Guides →](./guides/README.md)**
