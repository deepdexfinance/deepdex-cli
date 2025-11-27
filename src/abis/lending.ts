export const LendingABI = [
	{
		inputs: [
			{
				internalType: "uint8",
				name: "lending_market",
				type: "uint8",
			},
		],
		name: "assetPools",
		outputs: [
			{
				components: [
					{
						internalType: "uint8",
						name: "market_id",
						type: "uint8",
					},
					{
						internalType: "bytes",
						name: "asset",
						type: "bytes",
					},
					{
						internalType: "uint32",
						name: "decimal",
						type: "uint32",
					},
					{
						internalType: "uint128",
						name: "total_deposits",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "total_borrows",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "cumulative_deposit_interest",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "cumulative_borrow_interest",
						type: "uint128",
					},
					{
						internalType: "uint64",
						name: "last_updated_slot",
						type: "uint64",
					},
					{
						internalType: "uint128",
						name: "reserve_factor",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "custom_liquidation_bonus",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "initial_asset_weight",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "maintenance_asset_weight",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "initial_borrow_weight",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "maintenance_borrow_weight",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "apr_borrow",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "apr_lend",
						type: "uint128",
					},
					{
						internalType: "uint128",
						name: "protocol_reserve",
						type: "uint128",
					},
				],
				internalType: "struct Lending.AssetPoolState[]",
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
				internalType: "uint8",
				name: "lending_market",
				type: "uint8",
			},
			{
				internalType: "bytes",
				name: "asset",
				type: "bytes",
			},
			{
				internalType: "uint128",
				name: "amount",
				type: "uint128",
			},
		],
		name: "borrow",
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
				internalType: "bytes",
				name: "asset",
				type: "bytes",
			},
			{
				internalType: "uint128",
				name: "amount",
				type: "uint128",
			},
		],
		name: "deposit",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "from_subaccount",
				type: "address",
			},
			{
				internalType: "address",
				name: "to_subaccount",
				type: "address",
			},
			{
				internalType: "bytes",
				name: "asset",
				type: "bytes",
			},
			{
				internalType: "uint128",
				name: "amount",
				type: "uint128",
			},
		],
		name: "depositFromSubaccount",
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
		],
		name: "healthFor",
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
				internalType: "uint8",
				name: "lending_market",
				type: "uint8",
			},
		],
		name: "lendingMarkets",
		outputs: [
			{
				components: [
					{
						internalType: "uint8",
						name: "market_id",
						type: "uint8",
					},
					{
						internalType: "bytes",
						name: "market_name",
						type: "bytes",
					},
					{
						internalType: "uint128",
						name: "liquidation_bonus",
						type: "uint128",
					},
				],
				internalType: "struct Lending.MarketState",
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
				internalType: "uint8",
				name: "lending_market",
				type: "uint8",
			},
			{
				internalType: "bytes",
				name: "asset",
				type: "bytes",
			},
		],
		name: "maxBorrowAmountFor",
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
				internalType: "uint8",
				name: "lending_market",
				type: "uint8",
			},
			{
				internalType: "bytes",
				name: "asset",
				type: "bytes",
			},
		],
		name: "maxWithdrawAmountFor",
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
				internalType: "uint8",
				name: "lending_market",
				type: "uint8",
			},
			{
				internalType: "bytes",
				name: "asset",
				type: "bytes",
			},
			{
				internalType: "uint128",
				name: "amount",
				type: "uint128",
			},
		],
		name: "repay",
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
				internalType: "bytes",
				name: "asset",
				type: "bytes",
			},
			{
				internalType: "uint128",
				name: "amount",
				type: "uint128",
			},
		],
		name: "withdraw",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
];
