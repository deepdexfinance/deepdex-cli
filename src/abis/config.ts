export const deepdexTestnet = {
	rpc: "https://testnetx-rpc.deepdex.finance",
	chainId: 4833,
	symbol: "tDGAS",
	name: "DeepDEX Testnet",
	value: "deepdex_testnet",
	explorer: "https://explorer-testnet.deepdex.finance",
	networkType: "evm",
	marketWs: "wss://deepdex-api.deepdex.net/v2/ws",
	rpcWs: "wss://testnetx-rpc.deepdex.finance",
	icon: "/images/deepdex.png",
	contracts: {
		consumerSepolia: "0x493530944CCc4b5C12FDfeF74553650695148d73",
		consumer: "0x",
		consumerXlayerTestnet: "0xde6029952a25b3ACfB727480b8faF05a1471D4b5",
		consumerSolanaDevnet: "0xf01a35C347bFE2944A32d7610531f42B706301BC",
		vault: "0x9837BBE7BA2C7ABfcc268cDC0CD687D3AA47973A",
		// Legacy contracts placeholders
		subaccount: "0x0000000000000000000000000000000000000451",
		spot: "0x000000000000000000000000000000000000044d",
		perp: "0x000000000000000000000000000000000000044e",
		lending: "0x0000000000000000000000000000000000000450",
		system: "0x0000000000000000000000000000000000000452",
	},
	tokens: {
		usdc: {
			name: "USDC",
			address: "0xBBdefA290B10D6762E44e5581A3533BF831A8C5C",
			icon: "/images/usdc.png",
			symbol: "USDC",
			decimals: 6,
			marketId: 1,
		},
		eth: {
			name: "ETH",
			address: "0xD6c9c7078fc1Fe5065bc85f4743FAB219Bb053fd",
			icon: "/images/eth.png",
			symbol: "ETH",
			decimals: 18,
			marketId: 2,
		},
		sol: {
			name: "SOL",
			address: "0x273Bc0743CeD7c5508015461E60C256f880926Cb",
			icon: "/images/sol.png",
			symbol: "SOL",
			decimals: 9,
			marketId: 3,
		},
		// Legacy token
		tDGAS: {
			name: "tDGAS",
			address: "0x0000000000000000000000000000000000000000",
			icon: "/images/tgas.png",
			symbol: "tDGAS",
			decimals: 18,
			marketId: 0,
		},
	},
};

export const network = deepdexTestnet;

export const spotPairs = [
	{
		value: "ETH/USDC",
		label: "ETH/USDC",
		fee: "0.30%",
		pairId:
			"0x950c1bb15508369148679bf2921417929f1465c068c4b22a980c3c23535846c0",
		price: "0",
		isPerp: false,
		disabled: false,
		priceDecimal: 2,
		tickSize: 0.01,
		sizeOptions: [0.01, 0.1, 1, 10, 100],
		orderDecimal: 3,
		stepSize: 0.001,
		leverage: 1,
		tokens: [network.tokens.eth, network.tokens.usdc],
	},
	{
		value: "SOL/USDC",
		label: "SOL/USDC",
		fee: "0.30%",
		pairId:
			"0x7219b7b8ceab0580a3124c284f9bda81dfef3309f28e50c08df32711967a489d",
		price: "0",
		isPerp: false,
		disabled: false,
		leverage: 1,
		priceDecimal: 2,
		tickSize: 0.01,
		sizeOptions: [0.01, 0.1, 1, 10, 100],
		orderDecimal: 2,
		stepSize: 0.01,
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
		tickSize: 0.01,
		sizeOptions: [0.01, 0.1, 1, 10, 100],
		orderDecimal: 3, // Step size is 0.001
		stepSize: 0.001,
		pairId: "3", // MarketId
		disabled: false,
	},
	{
		value: "USDT-USDC",
		label: "USDT-USDC",
		fee: "0.30%",
		price: "0",
		isPerp: true,
		tokens: [network.tokens.usdc],
		leverage: 50,
		priceDecimal: 0,
		tickSize: 1,
		orderDecimal: 2,
		stepSize: 0.01,
		sizeOptions: [1, 2, 5, 10, 100, 1000],
		pairId: "1", // MarketId
		disabled: true,
	},
	{
		value: "SOL-USDC",
		label: "SOL-USDC",
		fee: "0.30%",
		price: "0",
		isPerp: true,
		leverage: 50,
		tokens: [network.tokens.sol],
		pairId: "4", // MarketId
		priceDecimal: 2,
		tickSize: 0.01,
		orderDecimal: 2,
		stepSize: 0.01,
		sizeOptions: [0.01, 0.1, 1, 10, 100],
		disabled: false,
	},
];
