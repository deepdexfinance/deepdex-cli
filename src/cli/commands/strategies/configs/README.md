# Strategy Configuration Examples

Example configuration files for all available trading strategies.

## Usage

```bash
deepdex bot start <strategy> --config configs/<strategy>.json
```

## Available Strategies

| Strategy | File | Risk | Description |
|----------|------|------|-------------|
| **simple** | `simple.json` | Low | Dollar cost averaging at regular intervals |
| **grid** | `grid.json` | Medium | Places orders at regular price intervals |
| **momentum** | `momentum.json` | High | Trend following using moving averages |
| **arbitrage** | `arbitrage.json` | Low | Exploits price differences across markets |
| **mm** | `mm.json` | High | Market making - provides liquidity on both sides |

## Configuration Parameters

### Simple (DCA)
- `pair`: Trading pair (e.g., "BTC-USDT")
- `amount`: Amount to buy each interval
- `interval`: Time between buys ("1h", "30m", "1d")
- `amountType`: "base" or "quote"

### Grid Trading
- `pair`: Trading pair
- `lowerPrice`: Lower bound of the grid
- `upperPrice`: Upper bound of the grid
- `grids`: Number of grid levels
- `amountPerGrid`: Amount per grid order

### Momentum
- `pair`: Trading pair
- `shortPeriod`: Short MA period
- `longPeriod`: Long MA period
- `amount`: Trade amount
- `interval`: Check interval

### Arbitrage
- `pair`: Trading pair
- `minSpread`: Minimum spread to trigger trade
- `amount`: Trade amount
- `checkInterval`: Check interval in ms

### Market Making
- `pair`: Trading pair
- `spread`: Bid-ask spread (e.g., "0.002" = 0.2%)
- `orderSize`: Size of each order
- `levels`: Number of order levels on each side
- `levelSpacing`: Price spacing between levels
- `refreshInterval`: Quote refresh interval in ms
- `inventoryTarget`: Target inventory ratio (0.5 = 50%)
- `maxSkew`: Maximum price skew adjustment
