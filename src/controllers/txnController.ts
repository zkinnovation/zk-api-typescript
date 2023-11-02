import asyncHandler from "express-async-handler";
import { Account, Transaction, Signature } from "../db-models/model";
import { ethers } from "ethers";
import { utils, EIP712Signer, types, Provider } from "zksync-web3";
import { Request, Response } from "express"

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
]

export const createTxn = async (req: Request, res: Response) => {
    try {
        const { safeAddress, transactionType, userAddress, txnAmount, recipientAddress, paymasterEnable } = req.body;
        const account = await Account.findOne({ accountAddress: safeAddress }).exec();
        console.log(account)

        // if (requiredThreshold > account.setThreshold) {
        //     return res.status(404).json({ message: "The set threshold is greater than the already set threshold for this zkwallet" });
        // }
        console.log(userAddress)
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        //Assuming that signerAddress is one of the owners of the account
        // if (!account.owners.some((s) => s.toLowerCase() === userAddress.toLowerCase())) {
        //     return res.status(403).json({ message: "Unauthorized signer" });
        // }

        const newTxn = new Transaction({
            transactionType: transactionType,
            // requiredThreshold: requiredThreshold,
            currentSignCount: 0,
            signedOwners: [],
            txnAmount: txnAmount,
            recipientAddress: recipientAddress,
            paymaster: paymasterEnable
        });
        await newTxn.save()
        account.transactions.push(newTxn);
        await account.save();

        res.status(200).json({ message: "Transaction created successfully", transaction: newTxn });

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error during creation of new txn');
    }
};

export const getTxnsBySafeAddress = async (req: Request, res: Response) => {
    try {
        const { safeAddress } = req.params;
        const account = await Account.findOne({ accountAddress: safeAddress });
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }
        let transactions = [];
        for (let i = 0; i < account.transactions.length; i++) {
            const txnId = account.transactions[i]._id;
            const txn = await Transaction.findById(txnId);
            transactions.push(txn)
        }
        res.status(200).json({ transactions: transactions })
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error during fetching the txns');
    }
};
export const getSignedTxnHash = async (req: Request, res: Response) => {
    try {
        const { safeAddress, amount, recipientAddress, paymasterParams } = req.body
        const provider = new ethers.providers.JsonRpcProvider("https://zksync2-testnet.zksync.dev");
        const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
        const erc20Contract = new ethers.Contract(erc20TokenAddress, abi, provider);
        let mintAddress = recipientAddress;
        if (paymasterParams === true) {
            const paymaster = "0x97E5A77B5f77fC3B657B84059D15Fe5b377E6519"
            const paymasterParams = utils.getPaymasterParams(paymaster, {
                type: "ApprovalBased",
                token: erc20TokenAddress,
                // set minimalAllowance as we defined in the paymaster contract
                minimalAllowance: ethers.BigNumber.from(1),
                // empty bytes as testnet paymaster does not use innerInput
                innerInput: new Uint8Array(),
            });
            let mint = await erc20Contract.populateTransaction.mint(mintAddress, amount);
            mint = {
                ...mint,
                from: safeAddress,
                chainId: (await provider.getNetwork()).chainId,
                nonce: await provider.getTransactionCount(safeAddress),
                type: 113,
                customData: {
                    gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                    paymasterParams: paymasterParams,
                } as types.Eip712Meta,
                value: ethers.BigNumber.from(0),
            };
            mint.gasPrice = await provider.getGasPrice();
            mint.gasLimit = ethers.BigNumber.from(2000000);
            const signedTxHash = EIP712Signer.getSignedDigest(mint);
            console.log("Sending signed txn hash with paymaster params...")
            return res.status(200).json({ message: signedTxHash })
        }
        if (paymasterParams === false) {
            let mint = await erc20Contract.populateTransaction.mint(mintAddress, amount);
            mint = {
                ...mint,
                from: safeAddress,
                chainId: (await provider.getNetwork()).chainId,
                nonce: await provider.getTransactionCount(safeAddress),
                type: 113,
                customData: {
                    gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                    // paymasterParams: paymasterParams,
                } as types.Eip712Meta,
                value: ethers.BigNumber.from(0),
            };
            mint.gasPrice = await provider.getGasPrice();
            mint.gasLimit = ethers.BigNumber.from(2000000);
            const signedTxHash = EIP712Signer.getSignedDigest(mint);
            console.log("Sending signed txn hash without paymaster params...")
            return res.status(200).json({ message: signedTxHash })
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });

    }
}

export const signTxn = async (req: Request, res: Response) => {
    try {
        const { signedDigest, signerAddress, safeAddress, txnId, recipientAddress, txnAmount } = req.body;
        const txn = await Transaction.findById(txnId);
        const account = await Account.findOne({ accountAddress: safeAddress });

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
        const signature = new Signature({
            signerAddress: signerAddress,
            signedDigest: signedDigest
        })
        await signature.save()
        txn.signedOwners.push(signature);
        await txn.save();
        txn.currentSignCount += 1;
        await txn.save();

        // updating the currentSignCount in both Transaction and Account schemas
        account.transactions.forEach(transaction => {
            if (transaction.id === txnId) {
                transaction.currentSignCount += 1;
            }
        });
        await account.save();

        // for the mint txn
        if (txn.currentSignCount === account.setThreshold) {
            if (txn.paymaster === true) {
                console.log("Paymaster enabled")
                const provider = new Provider("https://zksync2-testnet.zksync.dev");
                const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
                const erc20Contract = new ethers.Contract(erc20TokenAddress, abi, provider);
                const paymaster = "0x97E5A77B5f77fC3B657B84059D15Fe5b377E6519"
                const paymasterParams = utils.getPaymasterParams(paymaster, {
                    type: "ApprovalBased",
                    token: erc20TokenAddress,
                    // set minimalAllowance as we defined in the paymaster contract
                    minimalAllowance: ethers.BigNumber.from(1),
                    // empty bytes as testnet paymaster does not use innerInput
                    innerInput: new Uint8Array(),
                });
                let mint = await erc20Contract.populateTransaction.mint(recipientAddress, txnAmount);
                // let signedDigestsByOwners = [ethers.utils.joinSignature("0xd67ebc4688820752fd8b75c9e0fa35390285539d72424ce09310a6264b76b4df1d9b0085ac01921b0d4a26a33da629bb7441f05b5cc43ac07f669245b0ce07401b"), ethers.utils.joinSignature("0xfc2040f642a9e912e9c7572f659c7b638a6109b478411efaa42a9f11a2841e1425c34baa8cb73edc44a3fdbf25cdd905f4b3608d639fce32ba63131e040577531c")];
                let signedDigestsByOwners = [];
                for (let i = 0; i < txn.signedOwners.length; i++) {
                    signedDigestsByOwners.push(txn.signedOwners[i].signedDigest);
                }
                const concatenatedSignatures = ethers.utils.concat(signedDigestsByOwners);
                mint = {
                    ...mint,
                    from: safeAddress,
                    chainId: (await provider.getNetwork()).chainId,
                    nonce: await provider.getTransactionCount(safeAddress),
                    type: 113,
                    customData: {
                        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                        paymasterParams: paymasterParams,
                    } as types.Eip712Meta,
                    value: ethers.BigNumber.from(0),
                };
                mint.gasPrice = await provider.getGasPrice();
                mint.gasLimit = ethers.BigNumber.from(2000000);
                // const signedTxHash = EIP712Signer.getSignedDigest(mint);

                mint.customData = {
                    ...mint.customData,
                    customSignature: concatenatedSignatures,
                } as types.Eip712Meta;
                console.log(mint)
                const sentTx = await provider.sendTransaction(utils.serialize(mint));
                await sentTx.wait();
                console.log("after")
                return res.status(200).json({ message: "Transaction signed successfully and TRANSACTION EXECUTED FROM SERVER END" });
            }
            if (txn.paymaster === false) {
                const provider = new Provider("https://zksync2-testnet.zksync.dev");
                const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
                const erc20Contract = new ethers.Contract(erc20TokenAddress, abi, provider);
                // let mintAddress = "0x6Cf0944aDB0e90E3b89d0505e9B9668E8c0E0bA1"
                let mint = await erc20Contract.populateTransaction.mint(recipientAddress, txnAmount);
                // let signedDigestsByOwners = [ethers.utils.joinSignature("0xd67ebc4688820752fd8b75c9e0fa35390285539d72424ce09310a6264b76b4df1d9b0085ac01921b0d4a26a33da629bb7441f05b5cc43ac07f669245b0ce07401b"), ethers.utils.joinSignature("0xfc2040f642a9e912e9c7572f659c7b638a6109b478411efaa42a9f11a2841e1425c34baa8cb73edc44a3fdbf25cdd905f4b3608d639fce32ba63131e040577531c")];
                let signedDigestsByOwners = [];
                for (let i = 0; i < txn.signedOwners.length; i++) {
                    signedDigestsByOwners.push(txn.signedOwners[i].signedDigest);
                }
                const concatenatedSignatures = ethers.utils.concat(signedDigestsByOwners);
                mint = {
                    ...mint,
                    from: safeAddress,
                    chainId: (await provider.getNetwork()).chainId,
                    nonce: await provider.getTransactionCount(safeAddress),
                    type: 113,
                    customData: {
                        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                        // paymasterParams: paymasterParams,
                    } as types.Eip712Meta,
                    value: ethers.BigNumber.from(0),
                };
                mint.gasPrice = await provider.getGasPrice();
                mint.gasLimit = ethers.BigNumber.from(2000000);
                // const signedTxHash = EIP712Signer.getSignedDigest(mint);

                mint.customData = {
                    ...mint.customData,
                    customSignature: concatenatedSignatures,
                } as types.Eip712Meta;
                console.log(mint)
                const sentTx = await provider.sendTransaction(utils.serialize(mint));
                await sentTx.wait();
                console.log("after")
                return res.status(200).json({ message: "Transaction signed successfully and TRANSACTION EXECUTED FROM SERVER END" });
            }



        }
        return res.status(200).json({ message: "Transaction signed successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

