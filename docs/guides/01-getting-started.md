# Getting Started

Initialize your wallet, fund it, and prepare for trading.

## Quick Start Workflow

### 1. Initialize Wallet

```bash
deepdex init
```

Creates a new local wallet or imports an existing one. The CLI will:
- Generate or import a keypair
- Set up encryption
- Display your public address
- Query chain for native token balance

### 2. Get Testnet Tokens

```bash
deepdex faucet
deepdex faucet USDC
```

Request testnet tokens from the faucet:
- `tDGAS` - Native gas token (default)
- `USDC` - Stablecoin for trading
- `ETH` - For spot/perp trading
- `SOL` - For spot/perp trading

### 3. Create Subaccount

```bash
deepdex account create
deepdex account create trading-main
```

Create an on-chain trading subaccount. Each account can isolate positions and collateral.

### 4. Deposit Collateral

```bash
deepdex account deposit 1000 USDC
deepdex account deposit 50% ETH
```

Deposit tokens to your trading subaccount. Supports:
- Fixed amounts: `1000 USDC`
- Percentages: `50% ETH` (uses 50% of wallet balance)

---

## Detailed Commands

### `deepdex init`

Initialize the DeepDex CLI for the first time.

```bash
deepdex init
```

**What it does:**
1. Creates `.deepdex` directory in home folder
2. Generates new keypair or prompts for import
3. Sets up wallet encryption with password
4. Queries RPC for wallet balance
5. Stores configuration

**Output:**
```
✓ Wallet initialized
  Address: 0x1234...5678
  tDGAS Balance: 0.00
  
  Next: deepdex faucet
```

**For non-interactive use:**
```bash
deepdex wallet create default --password mypassword
```

### `deepdex faucet [token]`

Request testnet tokens from the faucet.

```bash
deepdex faucet                # Request tDGAS
deepdex faucet USDC           # Request USDC
deepdex faucet --json         # JSON output
```

**Available tokens:**
- `tDGAS` - Native gas token (5.0 per request)
- `USDC` - Stablecoin (10,000 per request)
- `ETH` - Ethereum (100 per request)
- `SOL` - Solana (1,000 per request)

**Rate limiting:**
- Testnet: 1 request per token per hour
- Check current balance with `deepdex balance`

---

## Complete Onboarding Workflow

### Script-Based Setup

```bash
#!/bin/bash

# 1. Initialize wallet (non-interactive)
export DEEPDEX_NEW_WALLET_PASSWORD="my-secure-password"
deepdex wallet create default

# 2. Request tokens
deepdex faucet
deepdex faucet USDC
sleep 2

# 3. Create subaccount
deepdex account create main-trading

# 4. Deposit collateral
deepdex account deposit 1000 USDC --account main-trading

# 5. Verify setup
deepdex balance
deepdex account info main-trading
```

### Interactive Setup

```bash
# 1. Run initialization
deepdex init
# → Follow prompts for wallet setup

# 2. Get tokens
deepdex faucet
# → Select tokens to request

# 3. Create account
deepdex account create
# → Enter account name

# 4. Deposit funds
deepdex account deposit 1000 USDC
# → Confirm transaction
```

---

## Verification Checklist

After setup, verify everything is working:

```bash
# Check wallet balance
deepdex balance

# List accounts
deepdex account list

# Check account info
deepdex account info

# Run health check
deepdex health
```

All should show ✓ for successful setup.

---

## Troubleshooting

### "Wallet not found"

Run `deepdex init` to create a new wallet.

### "Faucet request failed"

- Check rate limiting (1 per hour per token)
- Verify network connectivity
- Run `deepdex health` to diagnose

### "Account creation failed"

- Ensure you have tDGAS for gas fees
- Request more tokens: `deepdex faucet`
- Check account name is valid (alphanumeric, no spaces)

### "Deposit transaction reverted"

- Verify account exists: `deepdex account list`
- Check token balance: `deepdex balance`
- Ensure sufficient gas: `deepdex faucet`

---

## Next Steps

Once setup is complete:

1. **Trading**: Read [Spot Trading](./05-spot-trading.md) or [Perpetual Trading](./06-perpetual-trading.md)
2. **Automation**: Read [Automated Bot](./09-bot-automation.md)
3. **Management**: Read [Account Management](./03-account-management.md)

---

## Network Details

| Property | Value |
|----------|-------|
| RPC URL | `https://rpc-testnet.deepdex.finance` |
| Network | DeepDex Testnet |
| Chain ID | 4833 |
| Explorer | https://explorer-testnet.deepdex.finance |

---

## Related Guides

- [Wallet Management](./02-wallet-management.md)
- [Account Management](./03-account-management.md)
- [Security & Keyring](./16-security.md)
