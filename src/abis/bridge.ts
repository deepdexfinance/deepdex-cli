const BridgeABI = [
	{
		inputs: [
			{
				internalType: "address",
				name: "anchor_",
				type: "address",
			},
			{
				internalType: "address",
				name: "tokenVault_",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "expireTime_",
				type: "uint256",
			},
			{
				internalType: "address",
				name: "escapeAddress_",
				type: "address",
			},
			{
				internalType: "address",
				name: "_authorizer",
				type: "address",
			},
		],
		stateMutability: "nonpayable",
		type: "constructor",
	},
	{
		inputs: [],
		name: "InvalidShortString",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "wrongAnchor",
				type: "address",
			},
		],
		name: "NOT_ANCHOR",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "string",
				name: "str",
				type: "string",
			},
		],
		name: "StringTooLong",
		type: "error",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "bytes32",
				name: "txUniqueIdentification",
				type: "bytes32",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount",
				type: "uint256",
			},
			{
				indexed: true,
				internalType: "address",
				name: "recipient",
				type: "address",
			},
		],
		name: "BridgeIn",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "bytes32",
				name: "txUniqueIdentification",
				type: "bytes32",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount",
				type: "uint256",
			},
			{
				indexed: true,
				internalType: "address",
				name: "sender",
				type: "address",
			},
		],
		name: "BridgeOut",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [],
		name: "EIP712DomainChanged",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "previousOwner",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "newOwner",
				type: "address",
			},
		],
		name: "OwnershipTransferred",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "Paused",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "sender",
				type: "address",
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
			{
				indexed: false,
				internalType: "address",
				name: "token",
				type: "address",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount",
				type: "uint256",
			},
			{
				indexed: false,
				internalType: "address",
				name: "escapeAddress",
				type: "address",
			},
		],
		name: "Release",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "Unpaused",
		type: "event",
	},
	{
		inputs: [],
		name: "PURE_MESSAGE",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "anchor",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "authorizer",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint32",
				name: "dstChainId",
				type: "uint32",
			},
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256",
			},
			{
				internalType: "bytes32",
				name: "dstRecipient",
				type: "bytes32",
			},
			{
				internalType: "address payable",
				name: "refundAddress",
				type: "address",
			},
			{
				internalType: "bytes32",
				name: "salt",
				type: "bytes32",
			},
			{
				internalType: "bytes",
				name: "customData",
				type: "bytes",
			},
			{
				internalType: "bytes",
				name: "signature",
				type: "bytes",
			},
		],
		name: "bridgeOut",
		outputs: [
			{
				internalType: "bytes32",
				name: "txUniqueIdentification",
				type: "bytes32",
			},
		],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes",
				name: "payload",
				type: "bytes",
			},
		],
		name: "decodePayload",
		outputs: [
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256",
			},
			{
				internalType: "address",
				name: "recipient",
				type: "address",
			},
			{
				internalType: "bytes",
				name: "customData",
				type: "bytes",
			},
		],
		stateMutability: "pure",
		type: "function",
	},
	{
		inputs: [],
		name: "eip712Domain",
		outputs: [
			{
				internalType: "bytes1",
				name: "fields",
				type: "bytes1",
			},
			{
				internalType: "string",
				name: "name",
				type: "string",
			},
			{
				internalType: "string",
				name: "version",
				type: "string",
			},
			{
				internalType: "uint256",
				name: "chainId",
				type: "uint256",
			},
			{
				internalType: "address",
				name: "verifyingContract",
				type: "address",
			},
			{
				internalType: "bytes32",
				name: "salt",
				type: "bytes32",
			},
			{
				internalType: "uint256[]",
				name: "extensions",
				type: "uint256[]",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256",
			},
			{
				internalType: "bytes32",
				name: "dstRecipient",
				type: "bytes32",
			},
			{
				internalType: "bytes",
				name: "customData",
				type: "bytes",
			},
		],
		name: "encodePayload",
		outputs: [
			{
				internalType: "bytes",
				name: "payload",
				type: "bytes",
			},
		],
		stateMutability: "pure",
		type: "function",
	},
	{
		inputs: [],
		name: "escapeAddress",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "expireTime",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
		],
		name: "fixTokenConfig",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
			{
				internalType: "uint32",
				name: "dstChainId",
				type: "uint32",
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256",
			},
			{
				internalType: "bytes32",
				name: "dstRecipient",
				type: "bytes32",
			},
			{
				internalType: "bytes",
				name: "customData",
				type: "bytes",
			},
		],
		name: "getBridgeFee",
		outputs: [
			{
				internalType: "uint256",
				name: "fee",
				type: "uint256",
			},
		],
		stateMutability: "view",
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
		name: "isContract",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "messenger",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "owner",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "pause",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "paused",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "txUniqueIdentification",
				type: "bytes32",
			},
			{
				internalType: "bytes",
				name: "payload",
				type: "bytes",
			},
		],
		name: "receiveFromAnchor",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
		],
		name: "release",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "renounceOwnership",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "authorizer_",
				type: "address",
			},
		],
		name: "setAuthorizer",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "tokenId",
				type: "uint256",
			},
			{
				internalType: "bool",
				name: "isNativeAsset",
				type: "bool",
			},
			{
				internalType: "bool",
				name: "isGasToken",
				type: "bool",
			},
			{
				internalType: "address",
				name: "token",
				type: "address",
			},
			{
				internalType: "uint8",
				name: "commonDecimal",
				type: "uint8",
			},
		],
		name: "setNewTokenId",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes4",
				name: "interfaceId",
				type: "bytes4",
			},
		],
		name: "supportsInterface",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		name: "tokenIdToInfo",
		outputs: [
			{
				internalType: "bool",
				name: "isNativeAsset",
				type: "bool",
			},
			{
				internalType: "bool",
				name: "isGasToken",
				type: "bool",
			},
			{
				internalType: "address",
				name: "token",
				type: "address",
			},
			{
				internalType: "uint8",
				name: "commonDecimal",
				type: "uint8",
			},
			{
				internalType: "uint8",
				name: "localDecimal",
				type: "uint8",
			},
			{
				internalType: "bool",
				name: "isConfigFixed",
				type: "bool",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "tokenVault",
		outputs: [
			{
				internalType: "contract ITokenVault",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "newOwner",
				type: "address",
			},
		],
		name: "transferOwnership",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "unpause",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		name: "usedSalt",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
			},
		],
		stateMutability: "view",
		type: "function",
	},
] as const;

export default BridgeABI;
