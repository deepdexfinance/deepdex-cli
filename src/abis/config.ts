export const network = {
	name: "DeepDex Testnet",
	rpc: "https://rpc-testnet.deepdex.finance",
	explorer: "https://explorer-testnet.deepdex.finance",
	contracts: {
		subaccount: "0x0000000000000000000000000000000000000451",
		spot: "0x000000000000000000000000000000000000044d",
		perp: "0x000000000000000000000000000000000000044e",
		lending: "0x0000000000000000000000000000000000000450",
	},
	tokens: {
		tDGAS: {
			name: "tDGAS",
			address: "0x0000000000000000000000000000000000000000",
			icon: "/images/tgas.png",
			symbol: "tDGAS",
			decimals: 18,
			marketId: 0,
		},
		usdc: {
			name: "USDC",
			address: "0xB94e8cE66d708251C893d32B077eC634D5D44D16",
			icon: "/images/usdc.png",
			symbol: "USDC",
			decimals: 6,
			marketId: 1,
		},
		eth: {
			name: "ETH",
			address: "0x983D7366Ac7860809cA93b96ba3cA1640Cefc115",
			icon: "/images/eth.png",
			symbol: "ETH",
			decimals: 18,
			marketId: 2,
		},
		// sol: {
		// 	name: "SOL",
		// 	address: "0x8a77F53BCdC4780BE8C64F341913d552B13D32fA",
		// 	icon: "/images/sol.png",
		// 	symbol: "SOL",
		// 	decimals: 9,
		// 	marketId: 3,
		// },
	},
};

export const spotPairs = [
	{
		value: "ETH/USDC",
		label: "ETH/USDC",
		fee: "0.30%",
		pairId:
			"0x7cf219b32b35000e20677b2c149c92b785bd8417c3c0834376a8a1df31734d6a",
		price: "0",
		disabled: false,
		tickSize: 0.01,
		stepSize: 0.001,
		leverage: 1,
		tokens: [network.tokens.eth, network.tokens.usdc],
	},
	// {
	// 	value: "SOL/USDC",
	// 	label: "SOL/USDC",
	// 	fee: "0.30%",
	// 	pairId:
	// 		"0x4e1af3b5045cc8c4feeb72e106dcb9dd2d2f0921111009fbb90d175057158932",
	// 	price: "0",
	// 	isPerp: false,
	// 	disabled: false,
	// 	leverage: 1,
	// 	priceDecimal: 2,
	// 	sizeOptions: [0.01, 0.1, 1, 10, 100],
	// 	orderDecimal: 2,
	// 	tokens: [network.tokens.sol, network.tokens.usdc],
	// },
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
		tickSize: 0.01,
		stepSize: 0.001,
		pairId: "2", // MarketId
		disabled: false,
	},
	// {
	// 	value: "USDT-PERP",
	// 	label: "USDT-USDC",
	// 	fee: "0.30%",
	// 	price: "0",
	// 	isPerp: true,
	// 	tokens: [network.tokens.usdc],
	// 	leverage: 50,
	// 	tickSize: 0,
	// 	stepSize: 1,
	// 	pairId: "2", // MarketId
	// 	disabled: true,
	// },
	// {
	// 	value: "SOL-PERP",
	// 	label: "SOL-USDC",
	// 	fee: "0.30%",
	// 	price: "0",
	// 	isPerp: true,
	// 	leverage: 50,
	// 	tokens: [network.tokens.sol],
	// 	pairId: "3", // MarketId
	// 	priceDecimal: 2,
	// 	orderDecimal: 2,
	// 	sizeOptions: [0.01, 0.1, 1, 10, 100],
	// 	disabled: false,
	// },
];
