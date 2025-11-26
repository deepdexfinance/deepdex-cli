export const SpotABI = [
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "pair",
				type: "bytes32",
			},
		],
		name: "getSpotMarketSpec",
		outputs: [
			{
				components: [
					{
						internalType: "uint128",
						name: "min_order_size",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "tick_size",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "step_size",
						type: "uint128",
					},
				],
				internalType: "struct SpotMarket.MarketSpec",
				name: "",
				type: "tuple",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "subaccount",
				type: "address",
			},
			{
				internalType: "bytes32",
				name: "pair",
				type: "bytes32",
			},
			{
				internalType: "uint256",
				name: "order_id",
				type: "uint256",
			},
		],
		name: "subaccountCancelOrderBuyB",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "subaccount",
				type: "address",
			},
			{
				internalType: "bytes32",
				name: "pair",
				type: "bytes32",
			},
			{
				internalType: "uint256",
				name: "order_id",
				type: "uint256",
			},
		],
		name: "subaccountCancelOrderSellB",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "subaccount",
				type: "address",
			},
			{
				internalType: "bytes32",
				name: "pair",
				type: "bytes32",
			},
			{
				internalType: "uint256",
				name: "quote_amount",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "base_amount",
				type: "uint256",
			},
			{
				internalType: "uint8",
				name: "slippage",
				type: "uint8",
			},
			{
				internalType: "bool",
				name: "auto_cancel",
				type: "bool",
			},
			{
				internalType: "bool",
				name: "reduce_only",
				type: "bool",
			},
		],
		name: "subaccountPlaceMarketOrderBuyBWithPrice",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "subaccount",
				type: "address",
			},
			{
				internalType: "bytes32",
				name: "pair",
				type: "bytes32",
			},
			{
				internalType: "uint256",
				name: "quote_amount",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "base_amount",
				type: "uint256",
			},
			{
				internalType: "bool",
				name: "auto_cancel",
				type: "bool",
			},
			{
				internalType: "bool",
				name: "reduce_only",
				type: "bool",
			},
		],
		name: "subaccountPlaceMarketOrderBuyBWithoutPrice",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "subaccount",
				type: "address",
			},
			{
				internalType: "bytes32",
				name: "pair",
				type: "bytes32",
			},
			{
				internalType: "uint256",
				name: "quote_amount",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "base_amount",
				type: "uint256",
			},
			{
				internalType: "uint8",
				name: "slippage",
				type: "uint8",
			},
			{
				internalType: "bool",
				name: "auto_cancel",
				type: "bool",
			},
			{
				internalType: "bool",
				name: "reduce_only",
				type: "bool",
			},
		],
		name: "subaccountPlaceMarketOrderSellBWithPrice",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "subaccount",
				type: "address",
			},
			{
				internalType: "bytes32",
				name: "pair",
				type: "bytes32",
			},
			{
				internalType: "uint256",
				name: "quote_amount",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "base_amount",
				type: "uint256",
			},
			{
				internalType: "bool",
				name: "auto_cancel",
				type: "bool",
			},
			{
				internalType: "bool",
				name: "reduce_only",
				type: "bool",
			},
		],
		name: "subaccountPlaceMarketOrderSellBWithoutPrice",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "subaccount",
				type: "address",
			},
			{
				internalType: "bytes32",
				name: "pair",
				type: "bytes32",
			},
			{
				internalType: "uint256",
				name: "quote_amount",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "base_amount",
				type: "uint256",
			},
			{
				internalType: "uint8",
				name: "post_only",
				type: "uint8",
			},
			{
				internalType: "bool",
				name: "reduce_only",
				type: "bool",
			},
		],
		name: "subaccountPlaceOrderBuyB",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "subaccount",
				type: "address",
			},
			{
				internalType: "bytes32",
				name: "pair",
				type: "bytes32",
			},
			{
				internalType: "uint256",
				name: "quote_amount",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "base_amount",
				type: "uint256",
			},
			{
				internalType: "uint8",
				name: "post_only",
				type: "uint8",
			},
			{
				internalType: "bool",
				name: "reduce_only",
				type: "bool",
			},
		],
		name: "subaccountPlaceOrderSellB",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "user",
				type: "address",
			},
			{
				internalType: "bytes32",
				name: "pair",
				type: "bytes32",
			},
		],
		name: "userActiveSpotOrders",
		outputs: [
			{
				components: [
					{
						internalType: "bytes32",
						name: "pair",
						type: "bytes32",
					},
					{
						internalType: "uint256",
						name: "id",
						type: "uint256",
					},
					{
						internalType: "address",
						name: "maker",
						type: "address",
					},
					{
						internalType: "uint256",
						name: "price",
						type: "uint256",
					},
					{
						internalType: "uint256",
						name: "quote_amount",
						type: "uint256",
					},
					{
						internalType: "uint256",
						name: "base_amount",
						type: "uint256",
					},
					{
						internalType: "uint32",
						name: "create_time",
						type: "uint32",
					},
					{
						internalType: "uint8",
						name: "status",
						type: "uint8",
					},
					{
						internalType: "bool",
						name: "is_buy",
						type: "bool",
					},
					{
						internalType: "uint8",
						name: "order_type",
						type: "uint8",
					},
					{
						internalType: "uint8",
						name: "slippage",
						type: "uint8",
					},
				],
				internalType: "struct SpotMarket.Order[]",
				name: "",
				type: "tuple[]",
			},
		],
		stateMutability: "view",
		type: "function",
	},
];
