export const TwoUserMultiSigABI = [
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "_owners",
                "type": "address[]"
            },
            {
                "internalType": "uint256",
                "name": "_threshold",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "AddedOwner",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "threshold",
                "type": "uint256"
            }
        ],
        "name": "ChangedThreshold",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "module",
                "type": "address"
            }
        ],
        "name": "DisabledModule",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "module",
                "type": "address"
            }
        ],
        "name": "EnabledModule",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "module",
                "type": "address"
            }
        ],
        "name": "ExecutionFromModuleFailure",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "module",
                "type": "address"
            }
        ],
        "name": "ExecutionFromModuleSuccess",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "RemovedOwner",
        "type": "event"
    },
    {
        "stateMutability": "nonpayable",
        "type": "fallback"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_threshold",
                "type": "uint256"
            }
        ],
        "name": "addOwnerWithThreshold",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_threshold",
                "type": "uint256"
            }
        ],
        "name": "changeThreshold",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "dataHash",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "signatures",
                "type": "bytes"
            },
            {
                "internalType": "uint256",
                "name": "requiredSignatures",
                "type": "uint256"
            }
        ],
        "name": "checkNSignatures",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "dataHash",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "signatures",
                "type": "bytes"
            }
        ],
        "name": "checkSignatures",
        "outputs": [
            {
                "internalType": "bytes4",
                "name": "magic",
                "type": "bytes4"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "prevModule",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "module",
                "type": "address"
            }
        ],
        "name": "disableModule",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "module",
                "type": "address"
            }
        ],
        "name": "enableModule",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            },
            {
                "internalType": "enum Enum.Operation",
                "name": "operation",
                "type": "uint8"
            }
        ],
        "name": "execTransactionFromModule",
        "outputs": [
            {
                "internalType": "bool",
                "name": "success",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            },
            {
                "internalType": "enum Enum.Operation",
                "name": "operation",
                "type": "uint8"
            }
        ],
        "name": "execTransactionFromModuleReturnData",
        "outputs": [
            {
                "internalType": "bool",
                "name": "success",
                "type": "bool"
            },
            {
                "internalType": "bytes",
                "name": "returnData",
                "type": "bytes"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "txType",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "from",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "to",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasLimit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasPerPubdataByteLimit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxFeePerGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxPriorityFeePerGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "paymaster",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "nonce",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256[4]",
                        "name": "reserved",
                        "type": "uint256[4]"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "signature",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes32[]",
                        "name": "factoryDeps",
                        "type": "bytes32[]"
                    },
                    {
                        "internalType": "bytes",
                        "name": "paymasterInput",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "reservedDynamic",
                        "type": "bytes"
                    }
                ],
                "internalType": "struct Transaction",
                "name": "_transaction",
                "type": "tuple"
            }
        ],
        "name": "executeTransaction",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "txType",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "from",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "to",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasLimit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasPerPubdataByteLimit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxFeePerGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxPriorityFeePerGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "paymaster",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "nonce",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256[4]",
                        "name": "reserved",
                        "type": "uint256[4]"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "signature",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes32[]",
                        "name": "factoryDeps",
                        "type": "bytes32[]"
                    },
                    {
                        "internalType": "bytes",
                        "name": "paymasterInput",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "reservedDynamic",
                        "type": "bytes"
                    }
                ],
                "internalType": "struct Transaction",
                "name": "_transaction",
                "type": "tuple"
            }
        ],
        "name": "executeTransactionFromOutside",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "start",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "pageSize",
                "type": "uint256"
            }
        ],
        "name": "getModulesPaginated",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "array",
                "type": "address[]"
            },
            {
                "internalType": "address",
                "name": "next",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getOwners",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getThreshold",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "module",
                "type": "address"
            }
        ],
        "name": "isModuleEnabled",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "isOwner",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "txType",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "from",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "to",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasLimit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasPerPubdataByteLimit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxFeePerGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxPriorityFeePerGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "paymaster",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "nonce",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256[4]",
                        "name": "reserved",
                        "type": "uint256[4]"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "signature",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes32[]",
                        "name": "factoryDeps",
                        "type": "bytes32[]"
                    },
                    {
                        "internalType": "bytes",
                        "name": "paymasterInput",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "reservedDynamic",
                        "type": "bytes"
                    }
                ],
                "internalType": "struct Transaction",
                "name": "_transaction",
                "type": "tuple"
            }
        ],
        "name": "payForTransaction",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "txType",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "from",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "to",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasLimit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasPerPubdataByteLimit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxFeePerGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxPriorityFeePerGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "paymaster",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "nonce",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256[4]",
                        "name": "reserved",
                        "type": "uint256[4]"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "signature",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes32[]",
                        "name": "factoryDeps",
                        "type": "bytes32[]"
                    },
                    {
                        "internalType": "bytes",
                        "name": "paymasterInput",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "reservedDynamic",
                        "type": "bytes"
                    }
                ],
                "internalType": "struct Transaction",
                "name": "_transaction",
                "type": "tuple"
            }
        ],
        "name": "prepareForPaymaster",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "prevOwner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_threshold",
                "type": "uint256"
            }
        ],
        "name": "removeOwner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes4",
                "name": "interfaceId",
                "type": "bytes4"
            }
        ],
        "name": "supportsInterface",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "prevOwner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "oldOwner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "swapOwner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "_suggestedSignedHash",
                "type": "bytes32"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "txType",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "from",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "to",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasLimit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasPerPubdataByteLimit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxFeePerGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxPriorityFeePerGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "paymaster",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "nonce",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256[4]",
                        "name": "reserved",
                        "type": "uint256[4]"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "signature",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes32[]",
                        "name": "factoryDeps",
                        "type": "bytes32[]"
                    },
                    {
                        "internalType": "bytes",
                        "name": "paymasterInput",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "reservedDynamic",
                        "type": "bytes"
                    }
                ],
                "internalType": "struct Transaction",
                "name": "_transaction",
                "type": "tuple"
            }
        ],
        "name": "validateTransaction",
        "outputs": [
            {
                "internalType": "bytes4",
                "name": "magic",
                "type": "bytes4"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    }
]