# Account Management

Create and manage trading subaccounts, deposits, withdrawals, and delegation.

---

## Quick Reference

```bash
deepdex account create                        # Create subaccount
deepdex account list                          # List all subaccounts
deepdex account info [name]                   # Get account details
deepdex account deposit <amount> <token>      # Deposit collateral
deepdex account withdraw <amount> <token>     # Withdraw collateral
deepdex account delegate <address>            # Delegate trading authority
```

---

## Commands

### `deepdex account create [name]`

Create a new on-chain trading subaccount.

```bash
deepdex account create                # Auto-generates name
deepdex account create trading        # Custom name
deepdex account create --yes          # Skip confirmation
```

**Output:**
```
✓ Subaccount "trading" created!
  Transaction: https://explorer.deepdex.finance/tx/0x...
  Next: deepdex account deposit 1000 USDC --account trading
```

### `deepdex account list`

List all subaccounts for your wallet.

```bash
deepdex account list
deepdex account list --json
```

**Output:**
```
📂 Your Subaccounts
Wallet: 0x1234...5678

#  Name       ID                    Status
1  default    0xaaaa...aaaa         Active
2  trading    0xbbbb...bbbb         Active
3  arbitrage  0xcccc...cccc         Active
```

### `deepdex account info [name]`

Display detailed account information.

```bash
deepdex account info              # Active account
deepdex account info trading      # Specific account
deepdex account info --json
```

**Output:**
```
📊 Subaccount: trading
Owner: 0x1234...5678

Balance              $0.00
Margin Used          $0.00
Free Margin          $0.00
Open Positions       0
Open Orders          0
```

### `deepdex account deposit <amount> <token> [options]`

Deposit tokens to your subaccount.

```bash
deepdex account deposit 1000 USDC
deepdex account deposit 50% ETH
deepdex account deposit 100% USDC --account trading
deepdex account deposit 1000 USDC --yes
```

**Supported formats:**
- Fixed amount: `1000 USDC`, `1.5 ETH`
- Percentage: `50% USDC`, `100% ETH`

**Output:**
```
💰 Deposit
Deposit 1000.00 USDC to "default"

✓ Deposited 1000.00 USDC to "default"
  Transaction: https://explorer.deepdex.finance/tx/0x...
  Funds are now available for trading
```

### `deepdex account withdraw <amount> <token> [options]`

Withdraw tokens from your subaccount.

```bash
deepdex account withdraw 500 USDC
deepdex account withdraw 50% ETH --account trading
deepdex account withdraw 100% USDC --yes
```

**Supported formats:**
- Fixed amount: `500 USDC`, `1.0 ETH`
- Percentage: `50% USDC`, `100% ETH`

**Output:**
```
💸 Withdraw
Withdraw 500.00 USDC from "default"

✓ Withdrew 500.00 USDC from "default"
  Transaction: https://explorer.deepdex.finance/tx/0x...
  Funds returned to your wallet
```

### `deepdex account delegate <address> [options]`

Delegate trading authority to another address.

```bash
deepdex account delegate 0x1234...5678
deepdex account delegate 0x1234...5678 --account trading
deepdex account delegate 0x1234...5678 --yes
```

**⚠️ Security Warning:**
- Only delegate to addresses you trust
- Delegates can trade on your behalf
- Requires confirmation

**Output:**
```
🔐 Delegate Authority
Delegate trading authority for "default"
To: 0x1234...5678

⚠️  This will allow another address to trade on your behalf.
    Only delegate to addresses you trust!

✓ Delegation set successfully
  Transaction: https://explorer.deepdex.finance/tx/0x...
  0x1234...5678 can now trade on behalf of "default"
```

---

## Common Workflows

### New Account Setup

```bash
#!/bin/bash

# 1. Create new account
deepdex account create trading

# 2. Deposit initial capital
deepdex account deposit 1000 USDC --account trading

# 3. Verify setup
deepdex account info trading

# 4. Start trading
deepdex spot buy ETH/USDC 1 --account trading
```

### Multi-Account Strategy

```bash
#!/bin/bash

# Create separate accounts for different strategies
deepdex account create grid-trading
deepdex account create momentum-trading
deepdex account create arbitrage

# Fund each account based on strategy
deepdex account deposit 5000 USDC --account grid-trading
deepdex account deposit 3000 USDC --account momentum-trading
deepdex account deposit 2000 USDC --account arbitrage

# Verify all are funded
deepdex account list
```

### Bot Delegation

```bash
#!/bin/bash

# 1. Create dedicated bot wallet
deepdex wallet create bot-wallet

# 2. Create trading account for bot
deepdex account create bot-trading

# 3. Fund the account
deepdex account deposit 10000 USDC --account bot-trading

# 4. Delegate authority to bot wallet
BOT_ADDRESS=$(deepdex wallet info bot-wallet --json | jq -r '.address')
deepdex account delegate $BOT_ADDRESS --account bot-trading

# 5. Start bot
deepdex pm start my-bot grid --account bot-trading
```

---

## Best Practices

### 1. Account Isolation
```bash
# Create separate accounts for different strategies
deepdex account create scalping
deepdex account create position-trading
deepdex account create arbitrage
```

### 2. Risk Management
```bash
# Start small, scale up
deepdex account deposit 100 USDC --account trading  # Test

# After verification, deposit more
deepdex account deposit 5000 USDC --account trading
```

### 3. Monitoring
```bash
# Check account status regularly
deepdex account info trading
deepdex account list

# Monitor balances
deepdex balance
```

### 4. Secure Delegation
```bash
# Only delegate to secure, dedicated bot wallets
# Never share bot wallet password
# Monitor delegated account activity

deepdex account delegate 0xBotAddress... --account trading
```

### 5. Emergency Procedures
```bash
# Withdraw all funds quickly if needed
deepdex account withdraw 100% USDC --account trading --yes

# Or cancel all orders first
deepdex order cancel-all --account trading
deepdex account withdraw 100% USDC --account trading --yes
```

---

## Troubleshooting

### "Account not found"

Create the account first:

```bash
deepdex account create <name>
deepdex account list
```

### "Insufficient balance for deposit"

Check wallet balance:

```bash
deepdex balance
deepdex faucet USDC  # Request more tokens
```

### "Deposit transaction failed"

- Verify account exists: `deepdex account list`
- Check gas funds: `deepdex balance`
- Ensure token is valid: `deepdex market list`

### "Delegation not working"

- Verify address format: `0x + 40 hex characters`
- Ensure address exists
- Check account has sufficient funds

---

## JSON Output Examples

### Account List JSON
```json
[
  {
    "name": "default",
    "address": "0xaaaa...",
    "collateral": "1000.00",
    "status": "active"
  },
  {
    "name": "trading",
    "address": "0xbbbb...",
    "collateral": "5000.00",
    "status": "active"
  }
]
```

### Account Info JSON
```json
{
  "name": "trading",
  "address": "0xbbbb...",
  "owner": "0x1234...",
  "balance": "5000.00",
  "marginUsed": "0.00",
  "freeMargin": "5000.00",
  "openPositions": 0,
  "openOrders": 0
}
```

---

## Related Guides

- [Getting Started](./01-getting-started.md)
- [Wallet Management](./02-wallet-management.md)
- [Quota Management](./12-quota-management.md)
- [Security & Keyring](./16-security.md)
