# Wallet Management

Create, import, export, and manage multiple wallets.

## Overview

DeepDex supports multiple wallets for different purposes:
- **Main wallet**: Primary account and gas management
- **Trading wallets**: Isolated trading accounts
- **Bot wallets**: Hot wallets delegated for automation
- **Cold storage**: Backup private keys

---

## Quick Reference

```bash
deepdex wallet list                   # List all wallets
deepdex wallet create trading         # Create new wallet
deepdex wallet import 0x... bot       # Import private key
deepdex wallet switch trading         # Switch active wallet
deepdex wallet export                 # Export private key
deepdex wallet transfer 100 USDC bot  # Send tokens
deepdex wallet delete old              # Delete wallet
deepdex wallet rename old new          # Rename wallet
```

---

## Commands

### `deepdex wallet list`

List all stored wallets.

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

**JSON Output:**
```json
[
  {
    "name": "default",
    "address": "0x1234...",
    "active": true
  },
  {
    "name": "trading",
    "address": "0xabcd...",
    "active": false
  }
]
```

### `deepdex wallet info [name]`

Display wallet address, balances, and nonce.

```bash
deepdex wallet info              # Active wallet
deepdex wallet info trading      # Specific wallet
deepdex wallet info --json
```

**Output:**
```
Wallet: trading
Address: 0xabcd...ef01

Token         Balance       USD Value
tDGAS         0.50          -
USDC          5,000.00      $5,000.00
ETH           2.50          $7,500.00
SOL           10.00         $2,400.00
```

### `deepdex wallet create [name]`

Create a new wallet.

```bash
deepdex wallet create              # Auto-generates name
deepdex wallet create trading      # Specific name
deepdex wallet create bot-1
```

**Interactive (prompts for password):**
```bash
deepdex wallet create my-wallet
# → Enter encryption password: ****
# → Confirm password: ****
# ✓ Wallet created
```

**Non-interactive (via environment variable):**
```bash
DEEPDEX_NEW_WALLET_PASSWORD="mypassword" deepdex wallet create bot-1
```

**Non-interactive (via flag):**
```bash
deepdex wallet create bot-2 --password mypassword123
```

### `deepdex wallet switch <name>`

Switch the active wallet for subsequent commands.

```bash
deepdex wallet switch trading
deepdex wallet switch default
```

**Verification:**
```bash
deepdex wallet list
# → Shows "default (active)" changed to "trading (active)"
```

### `deepdex wallet rename <current_name> <new_name>`

Rename an existing wallet.

```bash
deepdex wallet rename default main-wallet
deepdex wallet rename old-trading new-trading
```

### `deepdex wallet delete <name>`

Delete a wallet (requires confirmation).

```bash
deepdex wallet delete old-wallet
deepdex wallet delete old-wallet --yes
```

**⚠️ Warning**: This is permanent. Export private key first if you need backup.

### `deepdex wallet export [name]`

Export private key for backup or import elsewhere.

```bash
deepdex wallet export              # Export active wallet
deepdex wallet export trading      # Export specific wallet
```

**Security**: Requires explicit confirmation and displays warning.

**Output:**
```
⚠️  WARNING: This will display your private key in plaintext
     Only do this on a secure, offline machine
     Type "EXPORT" to confirm: EXPORT

Private Key: 0x1234567890abcdef...
```

### `deepdex wallet import <private_key> [name]`

Import wallet from private key.

```bash
deepdex wallet import 0x...                # Auto-named
deepdex wallet import 0x... trading        # Named
deepdex wallet import 0x... my-wallet --password mypass
```

**Non-interactive:**
```bash
DEEPDEX_NEW_WALLET_PASSWORD="mypass" \
  deepdex wallet import 0x1234... my-wallet
```

### `deepdex wallet sign <message>`

Sign an arbitrary message with your wallet.

```bash
deepdex wallet sign "Hello, DeepDex"
deepdex wallet sign "0x1234..." --wallet trading
```

**Output:**
```
Message: Hello, DeepDex
Signature: 0xabcd...ef01
Address: 0x1234...5678
```

### `deepdex wallet transfer <amount> <token> [recipient]`

Transfer tokens to another wallet or address.

```bash
# To wallet name
deepdex wallet transfer 10 USDC trading
deepdex wallet transfer 50% USDC trading

# To address
deepdex wallet transfer 100 USDC 0x1234...5678
deepdex wallet transfer 100 USDC --to 0x1234...5678

# All tokens
deepdex wallet transfer 100% USDC trading
deepdex wallet transfer 100% ETH 0xAddress...
```

**Supported amounts:**
- Fixed: `10 USDC`, `1.5 ETH`
- Percentage: `50% USDC` (uses 50% of wallet balance)
- All: `100% ETH` (transfers entire balance)

**Supported tokens:**
- `tDGAS` - Native gas token
- `USDC` - Stablecoin
- `ETH` - Ethereum
- `SOL` - Solana

---

## Multi-Wallet Workflows

### Setup for Multiple Bots

```bash
#!/bin/bash

# Create wallets for different strategies
deepdex wallet create eth-grid-bot
deepdex wallet create sol-momentum-bot
deepdex wallet create arb-bot

# Fund each wallet
deepdex wallet transfer 100 USDC eth-grid-bot
deepdex wallet transfer 100 USDC sol-momentum-bot
deepdex wallet transfer 100 USDC arb-bot

# Create subaccounts for each
deepdex account create eth-grid --wallet eth-grid-bot
deepdex account create sol-momentum --wallet sol-momentum-bot
deepdex account create arbitrage --wallet arb-bot
```

### Transfer Between Wallets

```bash
# Check current wallet
deepdex wallet list

# Transfer from active wallet
deepdex wallet transfer 50 USDC backup-wallet

# Switch and verify
deepdex wallet switch backup-wallet
deepdex balance
```

### Secure Backup Workflow

```bash
# Export private key to file (on offline machine)
deepdex wallet export > my-wallet-backup.txt

# Later, import from backup
deepdex wallet import $(cat my-wallet-backup.txt) restored-wallet

# Verify it's the same address
deepdex wallet info restored-wallet
```

---

## Best Practices

### 1. **Wallet Naming**
Use descriptive names:
- ✓ `eth-grid-bot`, `sol-momentum-bot`, `backup-main`
- ✗ `wallet1`, `test`, `temp`

### 2. **Private Key Security**
- Export keys only on secure machines
- Use OS keyring when available
- Never commit private keys to version control
- Store backups offline

### 3. **Password Management**
- Use strong, unique passwords
- Store passwords in secure password manager
- For automation, use secure env vars or secret management

### 4. **Fund Strategically**
```bash
# Keep minimal gas funds in trading wallets
deepdex wallet transfer 0.1 tDGAS eth-trading

# Keep larger reserves in main wallet
deepdex wallet switch default
deepdex faucet USDC
```

### 5. **Monitor Wallets**
```bash
# Check all wallet balances
for wallet in $(deepdex wallet list --json | jq -r '.[].name'); do
  echo "=== $wallet ==="
  deepdex wallet info $wallet
done
```

---

## Automation Examples

### CI/CD Wallet Creation

```bash
#!/bin/bash

# Create bot wallet in CI pipeline
export DEEPDEX_NEW_WALLET_PASSWORD=${{ secrets.WALLET_PASSWORD }}
BOT_ADDRESS=$(deepdex wallet create ci-bot --json | jq -r '.address')

# Fund from main wallet
deepdex wallet transfer 100 USDC $BOT_ADDRESS

# Output for subsequent steps
echo "BOT_ADDRESS=$BOT_ADDRESS" >> $GITHUB_ENV
```

### Automated Fund Distribution

```bash
#!/bin/bash

MAIN_BALANCE=$(deepdex balance --json | jq '.tokens[] | select(.symbol=="USDC") | .balance' | bc)
BOT_COUNT=5

# Distribute evenly among bots
PER_BOT=$(echo "scale=2; $MAIN_BALANCE / $BOT_COUNT" | bc)

for i in $(seq 1 $BOT_COUNT); do
  deepdex wallet transfer "$PER_BOT USDC" "bot-$i" --yes
done
```

---

## Troubleshooting

### "Wallet not found"
```bash
deepdex wallet list          # See all wallets
deepdex wallet create name   # Create if missing
```

### "Wrong password"
```bash
# Wallets are encrypted. Use correct password to unlock.
# For automated use, set DEEPDEX_WALLET_PASSWORD environment variable
```

### "Insufficient balance"
```bash
deepdex balance              # Check all tokens
deepdex faucet               # Request more tokens
deepdex wallet transfer      # Transfer from another wallet
```

### "Transfer failed"
```bash
deepdex health               # Check network connectivity
deepdex wallet info          # Verify recipient address format
```

---

## Related Guides

- [Getting Started](./01-getting-started.md)
- [Account Management](./03-account-management.md)
- [Security & Keyring](./16-security.md)
