export const SubaccountABI = [
	{
		inputs: [
			{
				internalType: "address",
				name: "new_account",
				type: "address",
			},
		],
		name: "createOneClickTradingAccount",
		outputs: [],
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
		],
		name: "delegateAccounts",
		outputs: [
			{
				components: [
					{
						internalType: "address",
						name: "subaccount",
						type: "address",
					},
					{
						internalType: "bytes",
						name: "name",
						type: "bytes",
					},
				],
				internalType: "struct Subaccount.DelegateInfo[]",
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
		],
		name: "deleteSubaccount",
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
		name: "disableOnClickTradingAccount",
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
		name: "enableOnClickTradingAccount",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes",
				name: "name",
				type: "bytes",
			},
		],
		name: "initializeSubaccount",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "owner",
				type: "address",
			},
		],
		name: "oneClickTradingAccountsFor",
		outputs: [
			{
				components: [
					{
						internalType: "address",
						name: "account",
						type: "address",
					},
					{
						internalType: "uint8",
						name: "mode",
						type: "uint8",
					},
					{
						internalType: "uint32",
						name: "create_time",
						type: "uint32",
					},
				],
				internalType: "struct Subaccount.OneClickTrading[]",
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
				internalType: "address",
				name: "delegate",
				type: "address",
			},
		],
		name: "setDelegateAccount",
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
				internalType: "bool",
				name: "enable_spot_margin",
				type: "bool",
			},
		],
		name: "setSpotMargin",
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
		name: "subaccountInfo",
		outputs: [
			{
				components: [
					{
						internalType: "address",
						name: "authority",
						type: "address",
					},
					{
						internalType: "address",
						name: "delegate",
						type: "address",
					},
					{
						internalType: "bytes",
						name: "name",
						type: "bytes",
					},
					{
						components: [
							{
								internalType: "uint128",
								name: "token_amount",
								type: "uint128",
							},
							{
								internalType: "int64",
								name: "open_bids",
								type: "int64",
							},
							{
								internalType: "int64",
								name: "open_asks",
								type: "int64",
							},
							{
								internalType: "int64",
								name: "cumulative_deposits",
								type: "int64",
							},
							{
								internalType: "uint16",
								name: "market_index",
								type: "uint16",
							},
							{
								internalType: "uint8",
								name: "balance_type",
								type: "uint8",
							},
							{
								internalType: "uint8",
								name: "open_orders",
								type: "uint8",
							},
							{
								internalType: "bytes",
								name: "padding",
								type: "bytes",
							},
						],
						internalType: "struct Subaccount.SpotPosition[]",
						name: "spot_positions",
						type: "tuple[]",
					},
					{
						components: [
							{
								internalType: "uint8",
								name: "lending_market_id",
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
							{
								internalType: "uint128",
								name: "interest",
								type: "uint128",
							},
						],
						internalType: "struct Subaccount.BorrowPosition[]",
						name: "borrow_positions",
						type: "tuple[]",
					},
					{
						internalType: "uint32",
						name: "next_order_id",
						type: "uint32",
					},
					{
						internalType: "uint8",
						name: "status",
						type: "uint8",
					},
					{
						internalType: "bool",
						name: "is_margin_trading_enabled",
						type: "bool",
					},
				],
				internalType: "struct Subaccount.User",
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
		name: "userStats",
		outputs: [
			{
				components: [
					{
						components: [
							{
								internalType: "address",
								name: "subaccount",
								type: "address",
							},
							{
								internalType: "bytes",
								name: "name",
								type: "bytes",
							},
						],
						internalType: "struct Subaccount.SimpleSubaccount[]",
						name: "subaccounts",
						type: "tuple[]",
					},
					{
						internalType: "uint64",
						name: "if_staked_quote_asset_amount",
						type: "uint64",
					},
					{
						internalType: "uint16",
						name: "number_of_sub_accounts",
						type: "uint16",
					},
					{
						internalType: "uint16",
						name: "number_of_sub_accounts_created",
						type: "uint16",
					},
				],
				internalType: "struct Subaccount.UserStats",
				name: "",
				type: "tuple",
			},
		],
		stateMutability: "view",
		type: "function",
	},
];
