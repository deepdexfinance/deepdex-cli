export const network = {
	name: "DeepDex Testnet",
	rpc: "https://rpc-testnet.deepdex.finance",
	contracts: {
		subaccount: "0x0000000000000000000000000000000000000451",
		spot: "0x000000000000000000000000000000000000004D",
		perp: "0x000000000000000000000000000000000000004E",
	},
	tokens: {
		usdc: {
			name: "USDC",
			address: "0xaba94d6c512f9a37a3b12ae5d3ed171c5d0b475a",
			icon: "/images/usdc.png",
			symbol: "USDC",
			decimals: 6,
		},
		eth: {
			name: "ETH",
			address: "0x86bdE473a14BC71E5c145BB9eE723eF7c3cCCe6F",
			icon: "/images/eth.png",
			symbol: "ETH",
			decimals: 18,
			marketId: 1,
		},
		sol: {
			name: "SOL",
			address: "0x8a77F53BCdC4780BE8C64F341913d552B13D32fA",
			icon: "/images/sol.png",
			symbol: "SOL",
			decimals: 9,
			marketId: 3,
		},
	},
};

export const spotPairs = [
	{
		value: "ETH/USDC",
		label: "ETH/USDC",
		fee: "0.30%",
		pairId:
			"0xadfb870c1aa7e97bd82e5823253a0ff2fb8a4342345e2365da4fe0829c65bba2",
		price: "0",
		isPerp: false,
		disabled: false,
		priceDecimal: 2,
		sizeOptions: [0.01, 0.1, 1, 10, 100],
		orderDecimal: 3,
		leverage: 1,
		tokens: [network.tokens.eth, network.tokens.usdc],
	},
	{
		value: "SOL/USDC",
		label: "SOL/USDC",
		fee: "0.30%",
		pairId:
			"0x4e1af3b5045cc8c4feeb72e106dcb9dd2d2f0921111009fbb90d175057158932",
		price: "0",
		isPerp: false,
		disabled: false,
		leverage: 1,
		priceDecimal: 2,
		sizeOptions: [0.01, 0.1, 1, 10, 100],
		orderDecimal: 2,
		tokens: [network.tokens.sol, network.tokens.usdc],
	},
];

export const perpPairs = [
	{
		value: "ETH-USDC",
		label: "ETH-USDC",
		fee: "0.30%",
		price: "0",
		isPerp: true,
		tokens: [network.tokens.eth],
		leverage: 50,
		priceDecimal: 2, // Tick size is 0.01
		sizeOptions: [0.01, 0.1, 1, 10, 100],
		orderDecimal: 3, // Step size is 0.001
		pairId: "1", // MarketId
		disabled: false,
	},
	{
		value: "USDT-PERP",
		label: "USDT-USDC",
		fee: "0.30%",
		price: "0",
		isPerp: true,
		tokens: [network.tokens.usdc],
		leverage: 50,
		priceDecimal: 0,
		orderDecimal: 2,
		sizeOptions: [1, 2, 5, 10, 100, 1000],
		pairId: "2", // MarketId
		disabled: true,
	},
	{
		value: "SOL-PERP",
		label: "SOL-USDC",
		fee: "0.30%",
		price: "0",
		isPerp: true,
		leverage: 50,
		tokens: [network.tokens.sol],
		pairId: "3", // MarketId
		priceDecimal: 2,
		orderDecimal: 2,
		sizeOptions: [0.01, 0.1, 1, 10, 100],
		disabled: false,
	},
];
