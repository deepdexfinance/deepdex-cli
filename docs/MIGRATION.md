# Documentation Migration Guide

This document explains the reorganization of DeepDex CLI documentation from a single large `GUIDE.md` to a modular guides structure.

## What Changed

### Before
- Single `GUIDE.md` file (~1200+ lines)
- Difficult to navigate for large documentation
- Hard to reference specific topics
- Slow to load and edit

### After
- Organized `docs/guides/` folder with 19+ focused guides
- Easy navigation with cross-references
- Better SEO and discoverability
- Faster to load and maintain

---

## New Documentation Structure

```
docs/
├── README.md                          # Documentation index
└── guides/
    ├── README.md                      # Guides overview and command tree
    ├── 01-getting-started.md          # Init, faucet, quickstart
    ├── 02-wallet-management.md        # Wallets, keys, transfers
    ├── 03-account-management.md       # Subaccounts, deposits, delegation
    ├── 04-market-data.md              # Market info, prices, orderbooks
    ├── 05-spot-trading.md             # Spot buy/sell orders
    ├── 06-perpetual-trading.md        # Leverage, perpetual positions
    ├── 07-order-management.md         # Orders, cancellation, history
    ├── 08-position-management.md      # Positions, closing, modification
    ├── 09-bot-automation.md           # Single bot management
    ├── 10-process-manager.md          # Multi-bot orchestration
    ├── 11-strategies.md               # DCA, Grid, Momentum, Arbitrage
    ├── 12-quota-management.md         # Account quotas and allocation
    ├── 13-configuration.md            # Config management
    ├── 14-history.md                  # Trade and transfer history
    ├── 15-health-checks.md            # System diagnostics
    ├── 16-security.md                 # Key storage, best practices
    ├── 17-mcp-server.md               # AI integration
    ├── 18-global-flags.md             # Flags, env vars, aliases
    └── 19-output-conventions.md       # Display formats and colors
```

---

## File Mapping

### Original GUIDE.md Sections → New Guides

| Original Section | New Guide |
|------------------|-----------|
| Quick Start | [01-getting-started.md](./guides/01-getting-started.md) |
| Wallet Commands | [02-wallet-management.md](./guides/02-wallet-management.md) |
| Account Management | [03-account-management.md](./guides/03-account-management.md) |
| Market Commands | [04-market-data.md](./guides/04-market-data.md) |
| Spot Trading | [05-spot-trading.md](./guides/05-spot-trading.md) |
| Perp Trading | [06-perpetual-trading.md](./guides/06-perpetual-trading.md) |
| Order Management | [07-order-management.md](./guides/07-order-management.md) |
| Position Management | [08-position-management.md](./guides/08-position-management.md) |
| Bot Commands | [09-bot-automation.md](./guides/09-bot-automation.md) |
| Process Manager | [10-process-manager.md](./guides/10-process-manager.md) |
| Strategies | [11-strategies.md](./guides/11-strategies.md) |
| **NEW** Quota | [12-quota-management.md](./guides/12-quota-management.md) |
| Config | [13-configuration.md](./guides/13-configuration.md) |
| History | [14-history.md](./guides/14-history.md) |
| Health Check | [15-health-checks.md](./guides/15-health-checks.md) |
| Keyring Integration | [16-security.md](./guides/16-security.md) |
| MCP Server | [17-mcp-server.md](./guides/17-mcp-server.md) |
| Global Flags | [18-global-flags.md](./guides/18-global-flags.md) |
| Output Conventions | [19-output-conventions.md](./guides/19-output-conventions.md) |

---

## How to Navigate

### For Users
1. **Start here**: [docs/README.md](./README.md)
2. **Pick a guide** based on what you want to do
3. **Use cross-references** to jump between related topics
4. **Check command tree** in [guides/README.md](./guides/README.md)

### For Contributors
1. **Adding new content**: Create a new guide in `docs/guides/`
2. **Update index**: Add entry to [guides/README.md](./guides/README.md) and [docs/README.md](./README.md)
3. **Cross-reference**: Link related guides using relative paths
4. **Keep it focused**: Each guide should cover one topic/command family

---

## Current Documentation Status

### Completed Guides
- ✅ [01-getting-started.md](./guides/01-getting-started.md)
- ✅ [02-wallet-management.md](./guides/02-wallet-management.md)
- ✅ [03-account-management.md](./guides/03-account-management.md)
- ✅ [12-quota-management.md](./guides/12-quota-management.md)
- ✅ [guides/README.md](./guides/README.md)
- ✅ [docs/README.md](./README.md)

### Planned Guides (To Be Created)
- ⏳ [04-market-data.md](./guides/04-market-data.md)
- ⏳ [05-spot-trading.md](./guides/05-spot-trading.md)
- ⏳ [06-perpetual-trading.md](./guides/06-perpetual-trading.md)
- ⏳ [07-order-management.md](./guides/07-order-management.md)
- ⏳ [08-position-management.md](./guides/08-position-management.md)
- ⏳ [09-bot-automation.md](./guides/09-bot-automation.md)
- ⏳ [10-process-manager.md](./guides/10-process-manager.md)
- ⏳ [11-strategies.md](./guides/11-strategies.md)
- ⏳ [13-configuration.md](./guides/13-configuration.md)
- ⏳ [14-history.md](./guides/14-history.md)
- ⏳ [15-health-checks.md](./guides/15-health-checks.md)
- ⏳ [16-security.md](./guides/16-security.md)
- ⏳ [17-mcp-server.md](./guides/17-mcp-server.md)
- ⏳ [18-global-flags.md](./guides/18-global-flags.md)
- ⏳ [19-output-conventions.md](./guides/19-output-conventions.md)

### Legacy Documents (Being Migrated)
- ⚠️ [../GUIDE.md](../GUIDE.md) - Original design guide (still available for reference)
- ⚠️ [../QUOTA_GUIDE.md](../QUOTA_GUIDE.md) - Original quota guide (content migrated to 12-quota-management.md)

---

## Getting Started with Migration

### For New Documentation
1. Check [docs/README.md](./README.md) for main index
2. Navigate to [docs/guides/README.md](./guides/README.md) for command overview
3. Use breadcrumbs and "Related Guides" sections to navigate

### For Existing Content
- Original [../GUIDE.md](../GUIDE.md) still available
- Gradually migrating content to modular guides
- Cross-reference old and new docs during transition

---

## Search Tips

### Finding Specific Commands
1. Use [guides/README.md](./guides/README.md) command tree
2. Search for command name in specific guide
3. Use browser find (Ctrl+F) to search within guides

### Finding Workflow Examples
1. Check [docs/README.md](./README.md) "Common Workflows"
2. See "Workflows" section in relevant guide
3. Search for use case name

### Finding Best Practices
1. Check "Best Practices" section in each guide
2. See [16-security.md](./guides/16-security.md) for security practices
3. Check [18-global-flags.md](./guides/18-global-flags.md) for global tips

---

## Feedback & Improvements

The documentation is continuously being improved. If you find:

- **Missing content**: Check if it's in a guide or create an issue
- **Outdated information**: File a bug report or contribute a fix
- **Unclear explanations**: Suggest improvements
- **Better organization**: Propose restructuring

---

## Related Files

- [Project README](../README.md)
- [SKILL.md](../skills/SKILL.md) - Skill definition
- [QUOTA_GUIDE.md](../QUOTA_GUIDE.md) - Original quota guide
- [GUIDE.md](../GUIDE.md) - Original design guide

---

## Timeline

| Date | Status | Notes |
|------|--------|-------|
| Jan 2026 | Started | Migration begins |
| Jan 2026 | WIP | Core guides completed (01-03, 12) |
| TBD | Next | Trading guides (04-08) |
| TBD | Next | Automation guides (09-11) |
| TBD | Final | System & Advanced guides (13-19) |

---

## Questions?

- Check [Getting Started](./guides/01-getting-started.md)
- Browse [docs/README.md](./README.md) for quick navigation
- View [guides/README.md](./guides/README.md) for command tree
- See related guides within each document
