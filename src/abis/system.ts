export const SystemABI = [
	{
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "activateAccount",
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
				internalType: "uint32",
				name: "quota",
				type: "uint32",
			},
		],
		name: "addQuota",
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
		name: "systemAccount",
		outputs: [
			{
				components: [
					{
						internalType: "uint64",
						name: "nonce",
						type: "uint64",
					},
					{
						internalType: "uint64",
						name: "update",
						type: "uint64",
					},
					{
						internalType: "uint64[]",
						name: "time_nonce",
						type: "uint64[]",
					},
					{
						internalType: "uint32",
						name: "quota",
						type: "uint32",
					},
					{
						internalType: "bool",
						name: "is_exist",
						type: "bool",
					},
				],
				internalType: "struct System.SystemAccountInfo",
				name: "",
				type: "tuple",
			},
		],
		stateMutability: "view",
		type: "function",
	},
];
