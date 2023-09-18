"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signTxn = exports.getSignedTxnHash = exports.getTxnsBySafeAddress = exports.createTxn = void 0;
const model_1 = require("../db-models/model");
const ethers_1 = require("ethers");
const zksync_web3_1 = require("zksync-web3");
const abi = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "name_",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "symbol_",
                "type": "string"
            },
            {
                "internalType": "uint8",
                "name": "decimals_",
                "type": "uint8"
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
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
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
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
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
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
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
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "subtractedValue",
                "type": "uint256"
            }
        ],
        "name": "decreaseAllowance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
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
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "addedValue",
                "type": "uint256"
            }
        ],
        "name": "increaseAllowance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
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
                "name": "_to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "name": "mint",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
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
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
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
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];
const createTxn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { safeAddress, transactionType, requiredThreshold, userAddress, txnAmount, recipientAddress } = req.body;
        const account = yield model_1.Account.findOne({ accountAddress: safeAddress }).exec();
        if (requiredThreshold > account.setThreshold) {
            return res.status(404).json({ message: "The set threshold is greater than the already set threshold for this zkwallet" });
        }
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }
        // Assuming that signerAddress is one of the owners of the account
        if (!account.owners.includes(userAddress)) {
            return res.status(403).json({ message: "Unauthorized signer" });
        }
        const newTxn = new model_1.Transaction({
            transactionType: transactionType,
            requiredThreshold: requiredThreshold,
            currentSignCount: 0,
            signedOwners: [],
            txnAmount: txnAmount,
            recipientAddress: recipientAddress
        });
        yield newTxn.save();
        account.transactions.push(newTxn);
        yield account.save();
        res.status(200).json({ message: "Transaction created successfully", transaction: newTxn });
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error during creation of new txn');
    }
});
exports.createTxn = createTxn;
const getTxnsBySafeAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { safeAddress } = req.params;
        const account = yield model_1.Account.findOne({ accountAddress: safeAddress });
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }
        let transactions = [];
        for (let i = 0; i < account.transactions.length; i++) {
            const txnId = account.transactions[i]._id;
            const txn = yield model_1.Transaction.findById(txnId);
            transactions.push(txn);
        }
        res.status(200).json({ transactions: transactions });
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error during fetching the txns');
    }
});
exports.getTxnsBySafeAddress = getTxnsBySafeAddress;
const getSignedTxnHash = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { safeAddress, amount, recipientAddress } = req.body;
        const provider = new ethers_1.ethers.providers.JsonRpcProvider("https://zksync2-testnet.zksync.dev");
        const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
        const erc20Contract = new ethers_1.ethers.Contract(erc20TokenAddress, abi, provider);
        let mintAddress = recipientAddress;
        let mint = yield erc20Contract.populateTransaction.mint(mintAddress, amount);
        mint = Object.assign(Object.assign({}, mint), { from: safeAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                // paymasterParams: paymasterParams,
            }, value: ethers_1.ethers.BigNumber.from(0) });
        mint.gasPrice = yield provider.getGasPrice();
        mint.gasLimit = ethers_1.ethers.BigNumber.from(2000000);
        const signedTxHash = zksync_web3_1.EIP712Signer.getSignedDigest(mint);
        return res.status(200).json({ message: signedTxHash });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.getSignedTxnHash = getSignedTxnHash;
const signTxn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { signedDigest, signerAddress, safeAddress, txnId, recipientAddress, txnAmount } = req.body;
        const txn = yield model_1.Transaction.findById(txnId);
        const account = yield model_1.Account.findOne({ accountAddress: safeAddress });
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }
        if (!txn) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        // checking if our signerAddress is one of the owners of this safe
        // if (!account.owners.includes(signerAddress)) {
        //     return res.status(403).json({ message: "Unauthorized signer" });
        // }
        const signature = new model_1.Signature({
            signerAddress: signerAddress,
            signedDigest: signedDigest
        });
        yield signature.save();
        txn.signedOwners.push(signature);
        yield txn.save();
        txn.currentSignCount += 1;
        yield txn.save();
        // updating the currentSignCount in both Transaction and Account schemas
        account.transactions.forEach(transaction => {
            if (transaction.id === txnId) {
                transaction.currentSignCount += 1;
            }
        });
        yield account.save();
        // for the mint txn
        if (txn.currentSignCount === account.setThreshold) {
            const provider = new zksync_web3_1.Provider("https://zksync2-testnet.zksync.dev");
            const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
            const erc20Contract = new ethers_1.ethers.Contract(erc20TokenAddress, abi, provider);
            // let mintAddress = "0x6Cf0944aDB0e90E3b89d0505e9B9668E8c0E0bA1"
            let mint = yield erc20Contract.populateTransaction.mint(recipientAddress, txnAmount);
            // let signedDigestsByOwners = [ethers.utils.joinSignature("0xd67ebc4688820752fd8b75c9e0fa35390285539d72424ce09310a6264b76b4df1d9b0085ac01921b0d4a26a33da629bb7441f05b5cc43ac07f669245b0ce07401b"), ethers.utils.joinSignature("0xfc2040f642a9e912e9c7572f659c7b638a6109b478411efaa42a9f11a2841e1425c34baa8cb73edc44a3fdbf25cdd905f4b3608d639fce32ba63131e040577531c")];
            let signedDigestsByOwners = [];
            for (let i = 0; i < txn.signedOwners.length; i++) {
                signedDigestsByOwners.push(txn.signedOwners[i].signedDigest);
            }
            const concatenatedSignatures = ethers_1.ethers.utils.concat(signedDigestsByOwners);
            mint = Object.assign(Object.assign({}, mint), { from: safeAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                    gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                    // paymasterParams: paymasterParams,
                }, value: ethers_1.ethers.BigNumber.from(0) });
            mint.gasPrice = yield provider.getGasPrice();
            mint.gasLimit = ethers_1.ethers.BigNumber.from(2000000);
            // const signedTxHash = EIP712Signer.getSignedDigest(mint);
            mint.customData = Object.assign(Object.assign({}, mint.customData), { customSignature: concatenatedSignatures });
            console.log(mint);
            const sentTx = yield provider.sendTransaction(zksync_web3_1.utils.serialize(mint));
            yield sentTx.wait();
            console.log("after");
            return res.status(200).json({ message: "Transaction signed successfully and TRANSACTION EXECUTED FROM SERVER END" });
        }
        return res.status(200).json({ message: "Transaction signed successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.signTxn = signTxn;
//# sourceMappingURL=txnController.js.map