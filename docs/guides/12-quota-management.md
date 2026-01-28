# Quota Management

Account quota is a system-level resource allocation mechanism that controls the operational rate-limiting for accounts on the DeepDex protocol.

## Overview

Quotas are unsigned 32-bit integer values that determine the operational capacity of an account. Manage quotas to control account rate limits and resource usage.

---

## Quick Reference

```bash
deepdex quota check                           # Check quota for active wallet
deepdex quota info [address]                  # Get detailed quota info
deepdex quota add <address> <amount>          # Add quota to account
deepdex quota stats                           # Show quota statistics
```

---

## Commands

### `deepdex quota check`

Check quota available for the active wallet.

```bash
deepdex quota check
deepdex quota check --json
```

**Output:**
```
📊 Account Quota
Address: 0x1234...5678

Account has 1000 quota available
```

**JSON Output:**
```json
{
  "account": "0x1234...5678",
  "quota": 1000,
  "available": true
}
```

### `deepdex quota info [address]`

Get detailed quota information for a specific address or active wallet.

```bash
deepdex quota info                              # Active wallet
deepdex quota info 0x1234567890123456789012345678901234567890  # Specific address
deepdex quota info 0xAddress... --json
```

**Output:**
```
📊 Account Quota
Account: 0x1234...5678

Address           0x1234...5678
Quota Amount      1000
Nonce             42
Account Exists    Yes
```

**JSON Output:**
```json
{
  "account": "0x1234...5678",
  "quota": 1000,
  "nonce": 42,
  "exists": true
}
```

### `deepdex quota add <address> <amount>`

Add quota to an account.

```bash
deepdex quota add 0x1234...5678 500
deepdex quota add 0x1234...5678 1000 --yes
```

**Requirements:**
- Active wallet with signing capability
- Wallet must be unlocked (prompts for password if needed)
- Valid Ethereum address (0x + 40 hex characters)
- Valid quota amount (positive integer, max uint32)

**Output:**
```
➕ Add Quota
Adding 500 quota to 0x1234...5678

✓ Added 500 quota to 0x1234...5678
  Transaction: https://explorer.deepdex.finance/tx/0x...
```

**Non-interactive:**
```bash
export DEEPDEX_WALLET_PASSWORD="mypassword"
deepdex quota add 0xAddress... 500 --yes
```

### `deepdex quota stats`

Display comprehensive quota statistics for the active wallet.

```bash
deepdex quota stats
deepdex quota stats --json
```

**Output:**
```
📈 Quota Statistics
Wallet: 0x1234...5678

Metric                Value
Total Quota           1000
Account Nonce         42
Account Status        Active
Address               0x1234...5678
```

**JSON Output:**
```json
{
  "account": "0x1234...5678",
  "quota": 1000,
  "nonce": 42,
  "status": "active"
}
```

---

## Common Workflows

### Setting Up New Account with Quota

```bash
#!/bin/bash

# 1. Create new trading account
deepdex account create trading-bot

# 2. Get account address (from account info)
ACCOUNT=$(deepdex account list --json | jq -r '.[0].address')

# 3. Allocate initial quota
deepdex quota add $ACCOUNT 5000 --yes

# 4. Verify quota
deepdex quota info $ACCOUNT
```

### Monitoring Quota Usage

```bash
#!/bin/bash

# Check main wallet quota
deepdex quota check

# Check subaccount quotas
deepdex quota info 0xSubaccount1...
deepdex quota info 0xSubaccount2...

# Get comprehensive stats
deepdex quota stats --json > quota_stats.json
```

### Multi-Bot Quota Allocation

```bash
#!/bin/bash

# Create multiple bots
for i in {1..3}; do
  deepdex account create "bot-$i"
done

# Get addresses
BOTS=($(deepdex account list --json | jq -r '.[].address'))

# Allocate quota to each bot
for address in "${BOTS[@]}"; do
  deepdex quota add "$address" 10000 --yes
done

# Verify all
for address in "${BOTS[@]}"; do
  deepdex quota info "$address" --json
done
```

---

## Use Cases

### 1. Rate Limiting Operations

Allocate quota based on expected transaction throughput:

```bash
# Low-frequency trading (grid strategy)
deepdex quota add $ADDRESS 1000

# High-frequency trading (market making)
deepdex quota add $ADDRESS 50000

# Monitoring only (no trading)
deepdex quota add $ADDRESS 100
```

### 2. Bot Delegation

When setting up bots with delegated authority:

```bash
# Create bot account
deepdex account create my-bot

# Get bot address
BOT_ADDRESS=$(deepdex account info my-bot --json | jq '.address')

# Allocate quota before delegation
deepdex quota add $BOT_ADDRESS 10000

# Delegate trading authority
deepdex account delegate $BOT_ADDRESS --account my-bot

# Start bot
deepdex pm start my-bot grid --account my-bot
```

### 3. Account Lifecycle Management

```bash
# New account onboarding
deepdex account create new-strategy
ADDR=$(...)
deepdex quota add $ADDR 5000      # Initial allocation

# Scale up as needed
deepdex quota add $ADDR 5000      # Add more quota

# Monitor usage
deepdex quota stats
```

---

## Quota Limits & Parameters

### Value Ranges
- **Minimum**: 0 (no quota)
- **Maximum**: 4,294,967,295 (uint32 max)
- **Type**: Unsigned 32-bit integer

### Quota Usage
- Quota is consumed with each account operation
- Operations include trades, deposits, withdrawals
- Different operations may consume different amounts
- Check remaining quota with `deepdex quota check`

---

## Best Practices

### 1. Plan Ahead
- Estimate required quota based on trading frequency
- Allocate excess capacity for contingencies
- Monitor usage regularly

### 2. Separate Concerns
- One quota allocation per account/strategy
- Use subaccounts to isolate quota usage
- Monitor per-account quota independently

### 3. Monitor Continuously
```bash
# Regular monitoring script
watch -n 5 'deepdex quota check && deepdex quota stats'
```

### 4. Document Changes
```bash
# Log quota allocations
deepdex quota stats --json | jq '. + {timestamp: now}' >> quota_history.jsonl
```

### 5. Secure Authorization
- Keep wallet passwords secure
- Use OS keyring for key storage
- Restrict quota modification permissions
- Audit quota changes

---

## Troubleshooting

### "Account does not exist"

The account hasn't been created on-chain yet.

```bash
# Create account first
deepdex account create my-account

# Then add quota
ADDR=$(...)
deepdex quota add $ADDR 1000
```

### "Failed to add quota"

**Reason**: Wallet not unlocked or authorization issue.

```bash
# Verify wallet is unlocked
deepdex wallet list

# Try again (will prompt for password)
deepdex quota add $ADDR 1000

# Or provide password
export DEEPDEX_WALLET_PASSWORD="..."
deepdex quota add $ADDR 1000 --yes
```

### "Invalid address format"

Address must be valid Ethereum address.

```bash
# ✓ Correct format
deepdex quota add 0x1234567890123456789012345678901234567890 1000

# ✗ Wrong formats
deepdex quota add 1234567890123456789012345678901234567890 1000
deepdex quota add 0x123 1000
```

### "Invalid quota amount"

Quota must be non-negative integer.

```bash
# ✓ Valid
deepdex quota add 0xAddress... 0
deepdex quota add 0xAddress... 1000
deepdex quota add 0xAddress... 4294967295

# ✗ Invalid
deepdex quota add 0xAddress... -100
deepdex quota add 0xAddress... 4294967296
deepdex quota add 0xAddress... abc
```

### Quota not updating

Quota changes are on-chain transactions. Wait for confirmation:

```bash
# After adding quota, wait a few blocks
sleep 5

# Check again
deepdex quota info $ADDR
```

---

## Automation Examples

### GitHub Actions Workflow

```yaml
name: Setup Trading Account

on: [workflow_dispatch]

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Account with Quota
        env:
          DEEPDEX_WALLET_PASSWORD: ${{ secrets.WALLET_PASSWORD }}
        run: |
          deepdex account create gh-actions
          ADDR=$(deepdex account list --json | jq -r '.[0].address')
          deepdex quota add $ADDR 10000 --yes
          deepdex quota info $ADDR --json
```

### Monitoring Script

```bash
#!/bin/bash

# Monitor quota every 30 seconds
while true; do
  echo "[$(date)] Quota Check:"
  deepdex quota check
  sleep 30
done
```

---

## Related Guides

- [Account Management](./03-account-management.md)
- [Security & Keyring](./16-security.md)
- [Getting Started](./01-getting-started.md)
