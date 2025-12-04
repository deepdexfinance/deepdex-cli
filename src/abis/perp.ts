export const PerpABI = [
	{
		inputs: [
			{
				internalType: "uint16",
				name: "market_id",
				type: "uint16",
			},
		],
		name: "activePosForMarket",
		outputs: [
			{
				components: [
					{
						internalType: "uint16",
						name: "market_id",
						type: "uint16",
					},
					{
						internalType: "bool",
						name: "is_long",
						type: "bool",
					},
					{
						internalType: "uint128",
						name: "base_asset_amount",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "entry_price",
						type: "uint128",
					},
					{
						internalType: "uint8",
						name: "leverage",
						type: "uint8",
					},
					{
						internalType: "int128",
						name: "last_funding_rate",
						type: "int128",
					},
					{
						internalType: "uint64",
						name: "version",
						type: "uint64",
					},
					{
						internalType: "int128",
						name: "realized_pnl",
						type: "int128",
					},
					{
						internalType: "int128",
						name: "funding_payment",
						type: "int128",
					},
					{
						internalType: "address",
						name: "owner",
						type: "address",
					},
					{
						internalType: "uint128",
						name: "take_profit",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "stop_loss",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "liquidate_price",
						type: "uint128",
					},
				],
				internalType: "struct Perp.PerpPosition[]",
				name: "",
				type: "tuple[]",
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
				internalType: "uint16",
				name: "market_id",
				type: "uint16",
			},
			{
				internalType: "uint32",
				name: "order_id",
				type: "uint32",
			},
		],
		name: "cancelOrder",
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
				internalType: "uint16",
				name: "market_id",
				type: "uint16",
			},
			{
				internalType: "uint128",
				name: "price",
				type: "uint128",
			},
			{
				internalType: "uint64",
				name: "slippage",
				type: "uint64",
			},
		],
		name: "closePosition",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "freeDepositFor",
		outputs: [
			{
				internalType: "uint128",
				name: "",
				type: "uint128",
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
				internalType: "uint16",
				name: "market_id",
				type: "uint16",
			},
		],
		name: "getLiquidatePrice",
		outputs: [
			{
				internalType: "uint128",
				name: "",
				type: "uint128",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "getOraclePriceAll",
		outputs: [
			{
				components: [
					{
						internalType: "bytes",
						name: "symbol",
						type: "bytes",
					},
					{
						internalType: "uint128",
						name: "price",
						type: "uint128",
					},
				],
				internalType: "struct Perp.OraclePrice[]",
				name: "",
				type: "tuple[]",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint16",
				name: "market_id",
				type: "uint16",
			},
		],
		name: "lastTradePriceFor",
		outputs: [
			{
				internalType: "uint128",
				name: "",
				type: "uint128",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint16",
				name: "market_id",
				type: "uint16",
			},
		],
		name: "markPriceFor",
		outputs: [
			{
				internalType: "uint128",
				name: "",
				type: "uint128",
			},
		],
		stateMutability: "view",
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
				internalType: "uint32",
				name: "order_id",
				type: "uint32",
			},
		],
		name: "orderInfo",
		outputs: [
			{
				components: [
					{
						internalType: "uint32",
						name: "order_id",
						type: "uint32",
					},
					{
						internalType: "address",
						name: "owner",
						type: "address",
					},
					{
						internalType: "uint16",
						name: "market_id",
						type: "uint16",
					},
					{
						internalType: "bool",
						name: "is_long",
						type: "bool",
					},
					{
						internalType: "uint128",
						name: "size",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "price",
						type: "uint128",
					},
					{
						internalType: "uint8",
						name: "order_type",
						type: "uint8",
					},
					{
						internalType: "uint64",
						name: "create_time",
						type: "uint64",
					},
					{
						internalType: "uint8",
						name: "leverage",
						type: "uint8",
					},
					{
						internalType: "uint64",
						name: "slippage",
						type: "uint64",
					},
					{
						internalType: "uint8",
						name: "status",
						type: "uint8",
					},
					{
						internalType: "uint128",
						name: "size_filled",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "size_remain",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "take_profit",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "stop_loss",
						type: "uint128",
					},
				],
				internalType: "struct Perp.Order",
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
				internalType: "uint16",
				name: "market_id",
				type: "uint16",
			},
		],
		name: "perpMarkets",
		outputs: [
			{
				components: [
					{
						internalType: "uint16",
						name: "id",
						type: "uint16",
					},
					{
						internalType: "bytes",
						name: "name",
						type: "bytes",
					},
					{
						internalType: "bytes",
						name: "base_symbol",
						type: "bytes",
					},
					{
						internalType: "int32",
						name: "base_decimal",
						type: "int32",
					},
					{
						internalType: "uint16",
						name: "quote_market_id",
						type: "uint16",
					},
					{
						internalType: "bytes",
						name: "network",
						type: "bytes",
					},
					{
						internalType: "uint64",
						name: "height",
						type: "uint64",
					},
					{
						internalType: "int128",
						name: "funding_rate",
						type: "int128",
					},
					{
						internalType: "uint64",
						name: "last_cacl_funding_rate_time",
						type: "uint64",
					},
					{
						internalType: "uint128",
						name: "oracle_price",
						type: "uint128",
					},
					{
						internalType: "uint64",
						name: "max_deviation_bps",
						type: "uint64",
					},
					{
						internalType: "uint64",
						name: "liquid_spread_bps",
						type: "uint64",
					},
					{
						internalType: "uint128",
						name: "maintenance_margin_ratio",
						type: "uint128",
					},
					{
						internalType: "uint32",
						name: "taker_fee_rate",
						type: "uint32",
					},
					{
						internalType: "int32",
						name: "maker_fee_rate",
						type: "int32",
					},
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
						internalType: "struct Perp.MarketSpec",
						name: "order_spec",
						type: "tuple",
					},
					{
						internalType: "uint128",
						name: "open_interest",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "long_open_pos_num",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "short_open_pos_num",
						type: "uint128",
					},
					{
						internalType: "int128",
						name: "base_interest_rate",
						type: "int128",
					},
					{
						internalType: "uint128",
						name: "impact_margin_value",
						type: "uint128",
					},
					{
						internalType: "int128",
						name: "funding_rate_change_cap",
						type: "int128",
					},
					{
						internalType: "int128",
						name: "funding_rate_change_floor",
						type: "int128",
					},
				],
				internalType: "struct Perp.PerpMarket",
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
				internalType: "uint16",
				name: "market_id",
				type: "uint16",
			},
			{
				internalType: "bool",
				name: "is_long",
				type: "bool",
			},
			{
				internalType: "uint128",
				name: "size",
				type: "uint128",
			},
			{
				internalType: "uint128",
				name: "price",
				type: "uint128",
			},
			{
				internalType: "uint8",
				name: "order_type",
				type: "uint8",
			},
			{
				internalType: "uint8",
				name: "leverage",
				type: "uint8",
			},
			{
				internalType: "uint128",
				name: "take_profit",
				type: "uint128",
			},
			{
				internalType: "uint128",
				name: "stop_loss",
				type: "uint128",
			},
			{
				internalType: "bool",
				name: "reduce_only",
				type: "bool",
			},
			{
				internalType: "uint8",
				name: "post_only",
				type: "uint8",
			},
		],
		name: "placePerpOrder",
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
				internalType: "uint16",
				name: "market_id",
				type: "uint16",
			},
			{
				internalType: "uint128",
				name: "take_profit_point",
				type: "uint128",
			},
			{
				internalType: "uint128",
				name: "stop_loss_point",
				type: "uint128",
			},
		],
		name: "setProfitAndLossPoint",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address",
			},
			{
				internalType: "uint8",
				name: "weight_direction",
				type: "uint8",
			},
		],
		name: "totalCollateralAndMarginRequiredFor",
		outputs: [
			{
				components: [
					{
						internalType: "uint128",
						name: "collateral",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "margin_required",
						type: "uint128",
					},
				],
				internalType: "struct Perp.TotalCollateralAndMargin",
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
				name: "user",
				type: "address",
			},
		],
		name: "userActiveOrders",
		outputs: [
			{
				components: [
					{
						internalType: "address",
						name: "owner",
						type: "address",
					},
					{
						internalType: "uint16",
						name: "market_id",
						type: "uint16",
					},
					{
						internalType: "uint8",
						name: "order_side",
						type: "uint8",
					},
					{
						internalType: "uint8",
						name: "order_type",
						type: "uint8",
					},
					{
						internalType: "uint32",
						name: "order_id",
						type: "uint32",
					},
					{
						internalType: "uint128",
						name: "price",
						type: "uint128",
					},
					{
						internalType: "uint64",
						name: "created_at",
						type: "uint64",
					},
				],
				internalType: "struct Perp.ActiveOrder[]",
				name: "",
				type: "tuple[]",
			},
		],
		stateMutability: "view",
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
				internalType: "uint16[]",
				name: "market_id",
				type: "uint16[]",
			},
		],
		name: "userPerpPositions",
		outputs: [
			{
				components: [
					{
						internalType: "uint16",
						name: "market_id",
						type: "uint16",
					},
					{
						internalType: "bool",
						name: "is_long",
						type: "bool",
					},
					{
						internalType: "uint128",
						name: "base_asset_amount",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "entry_price",
						type: "uint128",
					},
					{
						internalType: "uint8",
						name: "leverage",
						type: "uint8",
					},
					{
						internalType: "int128",
						name: "last_funding_rate",
						type: "int128",
					},
					{
						internalType: "uint64",
						name: "version",
						type: "uint64",
					},
					{
						internalType: "int128",
						name: "realized_pnl",
						type: "int128",
					},
					{
						internalType: "int128",
						name: "funding_payment",
						type: "int128",
					},
					{
						internalType: "address",
						name: "owner",
						type: "address",
					},
					{
						internalType: "uint128",
						name: "take_profit",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "stop_loss",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "liquidate_price",
						type: "uint128",
					},
				],
				internalType: "struct Perp.PerpPosition[]",
				name: "",
				type: "tuple[]",
			},
		],
		stateMutability: "view",
		type: "function",
	},
];
