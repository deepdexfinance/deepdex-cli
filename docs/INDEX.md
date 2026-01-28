# Documentation Index

Quick reference to find what you need.

## 📋 Main Entry Points

| Purpose | Document |
|---------|----------|
| **Start here** | [docs/README.md](./README.md) |
| **Browse all guides** | [docs/guides/README.md](./guides/README.md) |
| **Understand migration** | [docs/MIGRATION.md](./MIGRATION.md) |
| **Project overview** | [../README.md](../README.md) |

---

## 🎯 By Use Case

### "I'm new to DeepDex CLI"
1. [Getting Started](./guides/01-getting-started.md) - Initialize and fund wallet
2. [Wallet Management](./guides/02-wallet-management.md) - Understand wallets
3. [Account Management](./guides/03-account-management.md) - Create trading accounts

### "I want to trade"
1. [Market Data](./guides/04-market-data.md) - Check prices and market info
2. [Spot Trading](./guides/05-spot-trading.md) - Buy/sell spot orders
3. [Perpetual Trading](./guides/06-perpetual-trading.md) - Leverage trading
4. [Order Management](./guides/07-order-management.md) - Manage orders
5. [Position Management](./guides/08-position-management.md) - Manage positions

### "I want to automate trading"
1. [Strategies](./guides/11-strategies.md) - Understand available strategies
2. [Automated Bot](./guides/09-bot-automation.md) - Run single bot
3. [Process Manager](./guides/10-process-manager.md) - Run multiple bots
4. [Quota Management](./guides/12-quota-management.md) - Allocate quotas

### "I want to manage accounts"
1. [Account Management](./guides/03-account-management.md) - Subaccounts and funds
2. [Wallet Management](./guides/02-wallet-management.md) - Wallet operations
3. [Quota Management](./guides/12-quota-management.md) - Account quotas

### "I'm concerned about security"
1. [Security & Keyring](./guides/16-security.md) - Key storage and best practices
2. [Wallet Management](./guides/02-wallet-management.md) - Secure wallet practices

### "I need to integrate with AI/LLMs"
1. [MCP Server](./guides/17-mcp-server.md) - Model Context Protocol integration

### "I need to monitor systems"
1. [Health Checks](./guides/15-health-checks.md) - System diagnostics
2. [History](./guides/14-history.md) - Trade and transfer logs

---

## 🔍 By Command Family

### Wallet Commands
- Reference: [Wallet Management](./guides/02-wallet-management.md)
- `wallet list`, `wallet create`, `wallet import`, `wallet export`, `wallet transfer`

### Account Commands
- Reference: [Account Management](./guides/03-account-management.md)
- `account create`, `account list`, `account deposit`, `account withdraw`, `account delegate`

### Market Commands
- Reference: [Market Data](./guides/04-market-data.md)
- `market list`, `market info`, `market price`, `market orderbook`, `market trades`, `market funding`

### Trading Commands
- Spot: [Spot Trading](./guides/05-spot-trading.md) - `spot buy`, `spot sell`
- Perp: [Perpetual Trading](./guides/06-perpetual-trading.md) - `perp long`, `perp short`

### Order Commands
- Reference: [Order Management](./guides/07-order-management.md)
- `order list`, `order cancel`, `order history`

### Position Commands
- Reference: [Position Management](./guides/08-position-management.md)
- `position list`, `position info`, `position close`, `position modify`

### Bot Commands
- Single: [Automated Bot](./guides/09-bot-automation.md) - `bot start`, `bot stop`, `bot status`
- Multiple: [Process Manager](./guides/10-process-manager.md) - `pm ps`, `pm start`, `pm stop`, `pm logs`

### Quota Commands
- Reference: [Quota Management](./guides/12-quota-management.md)
- `quota check`, `quota info`, `quota add`, `quota stats`

### System Commands
- Config: [Configuration](./guides/13-configuration.md) - `config show`, `config set`
- History: [History](./guides/14-history.md) - `history trades`, `history transfers`
- Health: [Health Checks](./guides/15-health-checks.md) - `health`
- MCP: [MCP Server](./guides/17-mcp-server.md) - `mcp`

---

## 📚 All Guides

| # | Guide | Topics |
|---|-------|--------|
| 01 | [Getting Started](./guides/01-getting-started.md) | Init, faucet, onboarding |
| 02 | [Wallet Management](./guides/02-wallet-management.md) | Wallets, keys, transfers |
| 03 | [Account Management](./guides/03-account-management.md) | Subaccounts, deposits, delegation |
| 04 | [Market Data](./guides/04-market-data.md) | Prices, orderbooks, market info |
| 05 | [Spot Trading](./guides/05-spot-trading.md) | Spot buy/sell orders |
| 06 | [Perpetual Trading](./guides/06-perpetual-trading.md) | Leverage positions |
| 07 | [Order Management](./guides/07-order-management.md) | Orders, cancellation, history |
| 08 | [Position Management](./guides/08-position-management.md) | Positions, closing, modification |
| 09 | [Automated Bot](./guides/09-bot-automation.md) | Single bot management |
| 10 | [Process Manager](./guides/10-process-manager.md) | Multi-bot orchestration |
| 11 | [Strategies](./guides/11-strategies.md) | DCA, Grid, Momentum, Arbitrage |
| 12 | [Quota Management](./guides/12-quota-management.md) | Account quotas, allocation |
| 13 | [Configuration](./guides/13-configuration.md) | Config management |
| 14 | [History](./guides/14-history.md) | Trade and transfer logs |
| 15 | [Health Checks](./guides/15-health-checks.md) | System diagnostics |
| 16 | [Security & Keyring](./guides/16-security.md) | Key storage, best practices |
| 17 | [MCP Server](./guides/17-mcp-server.md) | AI integration |
| 18 | [Global Flags](./guides/18-global-flags.md) | Flags, env vars, aliases |
| 19 | [Output Conventions](./guides/19-output-conventions.md) | Display formats |

---

## 🎓 Learning Path

### Complete Beginner
1. [Getting Started](./guides/01-getting-started.md) - 10 mins
2. [Wallet Management](./guides/02-wallet-management.md) - 15 mins
3. [Account Management](./guides/03-account-management.md) - 15 mins
4. [Spot Trading](./guides/05-spot-trading.md) - 20 mins
5. Total: ~60 minutes

### Intermediate Trader
1. Prerequisites: Complete Beginner path
2. [Market Data](./guides/04-market-data.md) - 15 mins
3. [Perpetual Trading](./guides/06-perpetual-trading.md) - 20 mins
4. [Order Management](./guides/07-order-management.md) - 15 mins
5. [Position Management](./guides/08-position-management.md) - 15 mins
6. Total: ~65 minutes

### Automation Enthusiast
1. Prerequisites: Complete Beginner path
2. [Strategies](./guides/11-strategies.md) - 15 mins
3. [Automated Bot](./guides/09-bot-automation.md) - 20 mins
4. [Process Manager](./guides/10-process-manager.md) - 20 mins
5. [Quota Management](./guides/12-quota-management.md) - 15 mins
6. Total: ~70 minutes

### Advanced User
1. All previous paths
2. [Security & Keyring](./guides/16-security.md) - 20 mins
3. [MCP Server](./guides/17-mcp-server.md) - 15 mins
4. [Global Flags](./guides/18-global-flags.md) - 10 mins
5. [Configuration](./guides/13-configuration.md) - 10 mins
6. Total: ~55 minutes

---

## ⚡ Quick Commands

```bash
# Setup (5 mins)
deepdex init
deepdex faucet
deepdex account create
deepdex account deposit 1000 USDC

# Trading (ongoing)
deepdex balance
deepdex spot buy ETH/USDC 1
deepdex perp long ETH-USDC 1 --lev 10
deepdex position list

# Automation (setup once)
deepdex pm start eth-grid grid --config ./configs/grid.json
deepdex pm ps
deepdex pm logs eth-grid --follow

# Monitoring (daily)
deepdex quota check
deepdex health
deepdex account list
```

---

## 🔗 External Resources

- [DeepDex Protocol](https://deepdex.finance)
- [GitHub Repository](https://github.com/stonega/deepdex-trader)
- [Bun Runtime](https://bun.sh)
- [Viem Library](https://viem.sh)
- [Zod Validation](https://zod.dev)

---

## 📞 Getting Help

| Question | Resource |
|----------|----------|
| "Where do I start?" | [Getting Started](./guides/01-getting-started.md) |
| "How do I...?" | Search guides or [Browse All Guides](./guides/README.md) |
| "What does X command do?" | See [guides/README.md](./guides/README.md) command tree |
| "Best practices?" | See "Best Practices" section in relevant guide |
| "Security concerns?" | [Security & Keyring](./guides/16-security.md) |
| "Troubleshooting?" | Check "Troubleshooting" section in guide |

---

## 📝 Document Status

- ✅ Completed: 6 guides + index + migration guide
- ⏳ In Progress: Documentation migration
- 📅 Planned: Remaining 13 guides

**Last Updated**: January 2026

---

## Navigation

- **[Main Documentation Index →](./README.md)**
- **[All Guides →](./guides/README.md)**
- **[Migration Guide →](./MIGRATION.md)**
