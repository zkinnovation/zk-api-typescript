import { Account, Transaction, Signature } from "../db-models/model";
import { ethers } from "ethers";
import { utils, EIP712Signer, types, Provider } from "zksync-web3";
import { Request, Response } from "express"
import { ERC20ABI } from "../exports";

const abi = ERC20ABI;

export const createTxn = async (req: Request, res: Response) => {
    // to create a txn..
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
            currentSetAccountThreshold: account.setThreshold,
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
        res.status(500).send({ message: "Internal server error while creating a txn", data: error });
    }
};

export const getTxnsBySafeAddress = async (req: Request, res: Response) => {
    // get the transaction history of a particular safe account..
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
    // to get the signed txn hash and sending it to the client (owner) for generating the signature.
    try {
        const { safeAddress, amount, recipientAddress, paymasterParams, txnType } = req.body
        // initializing the blockchain provider
        const provider = new ethers.providers.JsonRpcProvider("https://zksync2-testnet.zksync.dev");

        // for mint txn type..
        if (txnType === 'mint') {
            // test token address...
            const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
            const erc20Contract = new ethers.Contract(erc20TokenAddress, abi, provider);
            let mintAddress = recipientAddress;

            // checking if the paymaster needed to be added to this txn
            if (paymasterParams === true) {
                // paymaster contract's deployed address
                const paymaster = "0x97E5A77B5f77fC3B657B84059D15Fe5b377E6519"
                const paymasterParams = utils.getPaymasterParams(paymaster, {
                    type: "ApprovalBased",
                    token: erc20TokenAddress,
                    // set minimalAllowance as we defined in the paymaster contract
                    minimalAllowance: ethers.BigNumber.from(1),
                    // empty bytes as testnet paymaster does not use innerInput
                    innerInput: new Uint8Array(),
                });

                // populating the contract call transaction..
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

                // generating the signed txn hash..
                const signedTxHash = EIP712Signer.getSignedDigest(mint);

                console.log("Sending signed txn hash for mint with paymaster params...")
                return res.status(200).json({ message: signedTxHash })
            }
            if (paymasterParams === false) {
                // populating the contract call txn..
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

                // generating the signed txn hash and sending it to the client..
                const signedTxHash = EIP712Signer.getSignedDigest(mint);
                console.log("Sending signed txn hash for mint without paymaster params...")
                return res.status(200).json({ message: signedTxHash })
            }
        }

        // for transfer txn type...
        if (txnType === 'transfer') {
            // same test token address
            const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
            const erc20Contract = new ethers.Contract(erc20TokenAddress, abi, provider);
            let recipientAddr = recipientAddress;

            // when paymaster is enabled for this txn..
            if (paymasterParams === true) {
                // paymaster contract's deployed address
                const paymaster = "0x97E5A77B5f77fC3B657B84059D15Fe5b377E6519"
                const paymasterParams = utils.getPaymasterParams(paymaster, {
                    type: "ApprovalBased",
                    token: erc20TokenAddress,
                    // set minimalAllowance as we defined in the paymaster contract
                    minimalAllowance: ethers.BigNumber.from(1),
                    // empty bytes as testnet paymaster does not use innerInput
                    innerInput: new Uint8Array(),
                });

                // populating the contract call txn..
                let transfer = await erc20Contract.populateTransaction.transfer(recipientAddr, amount);
                transfer = {
                    ...transfer,
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
                transfer.gasPrice = await provider.getGasPrice();
                transfer.gasLimit = ethers.BigNumber.from(2000000);

                // getting the signed txn hash and sending it back to the client
                const signedTxHash = EIP712Signer.getSignedDigest(transfer);
                console.log("Sending signed txn hash for Transfer with paymaster params...")
                return res.status(200).json({ message: signedTxHash })
            }
            if (paymasterParams === false) {
                // populating the contract call txn..
                let transfer = await erc20Contract.populateTransaction.transfer(recipientAddr, amount);
                transfer = {
                    ...transfer,
                    from: safeAddress,
                    chainId: (await provider.getNetwork()).chainId,
                    nonce: await provider.getTransactionCount(safeAddress),
                    type: 113,
                    customData: {
                        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                    } as types.Eip712Meta,
                    value: ethers.BigNumber.from(0),
                };
                transfer.gasPrice = await provider.getGasPrice();
                transfer.gasLimit = ethers.BigNumber.from(2000000);

                // generating the signed txn hash and sending it to the client for the obtaining the signatures..
                const signedTxHash = EIP712Signer.getSignedDigest(transfer);
                console.log("Sending signed txn hash for Transfer without paymaster params...")
                return res.status(200).json({ message: signedTxHash })
            }
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error while sending the txn hash" });
    }
}

export const signTxn = async (req: Request, res: Response) => {
    //store the signatures (of mint/transfer fn) into the db 

    try {
        const { signedDigest, signerAddress, safeAddress, txnId, recipientAddress, txnAmount, txnType } = req.body;
        const txn = await Transaction.findById(txnId);
        const account = await Account.findOne({ accountAddress: safeAddress });

        // some basic validations..
        if (txn.signedOwners.includes(signerAddress)) {
            return res.status(404).json({ message: "Signer already signed for this transaction" })
        }
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

        // creating a new signature db doc object and saving it to the db collections..
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

        // if the threshold amount of txns are obtained..
        if (txn.currentSignCount === account.setThreshold) {
            // if the txn type is mint..
            if (txnType === 'mint') {
                // checking if paymaster was enabled for this txn..
                if (txn.paymaster === true) {
                    // console.log("Paymaster enabled")

                    // setting up blockchain and contract connections
                    const provider = new Provider("https://zksync2-testnet.zksync.dev");
                    const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
                    const erc20Contract = new ethers.Contract(erc20TokenAddress, abi, provider);

                    // paymaster deployed address and configuration..
                    const paymaster = "0x97E5A77B5f77fC3B657B84059D15Fe5b377E6519"
                    const paymasterParams = utils.getPaymasterParams(paymaster, {
                        type: "ApprovalBased",
                        token: erc20TokenAddress,
                        // set minimalAllowance as we defined in the paymaster contract
                        minimalAllowance: ethers.BigNumber.from(1),
                        // empty bytes as testnet paymaster does not use innerInput
                        innerInput: new Uint8Array(),
                    });

                    // populating the mint contract call txn..
                    let mint = await erc20Contract.populateTransaction.mint(recipientAddress, txnAmount);

                    // bundling the txn signatures of owners..
                    let signedDigestsByOwners = [];
                    for (let i = 0; i < txn.signedOwners.length; i++) {
                        signedDigestsByOwners.push(txn.signedOwners[i].signedDigest);
                    }
                    const concatenatedSignatures = ethers.utils.concat(signedDigestsByOwners);

                    // forming the final eip712 structure..
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
                    mint.customData = {
                        ...mint.customData,
                        customSignature: concatenatedSignatures,
                    } as types.Eip712Meta;
                    console.log("eip712 str to be serialized and sent to chain - ", mint)

                    // sending the serialized eip712 typed structure into the chain..
                    const sentTx = await provider.sendTransaction(utils.serialize(mint));
                    await sentTx.wait();

                    console.log("after sending.. - ", sentTx)
                    return res.status(200).json({ message: "Mint Transaction signed successfully and TRANSACTION EXECUTED FROM SERVER END" });
                }
                if (txn.paymaster === false) {
                    // setting up blockchain and contract connections
                    const provider = new Provider("https://zksync2-testnet.zksync.dev");
                    const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
                    const erc20Contract = new ethers.Contract(erc20TokenAddress, abi, provider);

                    // populating the txn..
                    let mint = await erc20Contract.populateTransaction.mint(recipientAddress, txnAmount);

                    // bundling the txn signatures by owners..
                    let signedDigestsByOwners = [];
                    for (let i = 0; i < txn.signedOwners.length; i++) {
                        signedDigestsByOwners.push(txn.signedOwners[i].signedDigest);
                    }
                    const concatenatedSignatures = ethers.utils.concat(signedDigestsByOwners);

                    // finalizing the 712 structure..
                    mint = {
                        ...mint,
                        from: safeAddress,
                        chainId: (await provider.getNetwork()).chainId,
                        nonce: await provider.getTransactionCount(safeAddress),
                        type: 113,
                        customData: {
                            gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                        } as types.Eip712Meta,
                        value: ethers.BigNumber.from(0),
                    };
                    mint.gasPrice = await provider.getGasPrice();
                    mint.gasLimit = ethers.BigNumber.from(2000000);
                    mint.customData = {
                        ...mint.customData,
                        customSignature: concatenatedSignatures,
                    } as types.Eip712Meta;
                    console.log("eip712 str to be serialized and sent to chain - ", mint)

                    // sending the serialized eip712 typed structure into the chain..
                    const sentTx = await provider.sendTransaction(utils.serialize(mint));
                    await sentTx.wait();
                    console.log("Transaction Executed -", sentTx)
                    return res.status(200).json({ message: "Mint Transaction signed successfully and TRANSACTION EXECUTED FROM SERVER END" });
                }
            }

            // if the txn type is transfer..
            if (txnType === "transfer") {
                // checking if paymaster was enabled for this txn..
                if (txn.paymaster === true) {
                    // setting up blockchain and contract connections
                    const provider = new Provider("https://zksync2-testnet.zksync.dev");
                    const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
                    const erc20Contract = new ethers.Contract(erc20TokenAddress, abi, provider);

                    // paymaster deployed address and configuration..
                    const paymaster = "0x97E5A77B5f77fC3B657B84059D15Fe5b377E6519"
                    const paymasterParams = utils.getPaymasterParams(paymaster, {
                        type: "ApprovalBased",
                        token: erc20TokenAddress,
                        // set minimalAllowance as we defined in the paymaster contract
                        minimalAllowance: ethers.BigNumber.from(1),
                        // empty bytes as testnet paymaster does not use innerInput
                        innerInput: new Uint8Array(),
                    });

                    // populating the txn...
                    let transfer = await erc20Contract.populateTransaction.transfer(recipientAddress, txnAmount);

                    // bundling the signatures..
                    let signedDigestsByOwners = [];
                    for (let i = 0; i < txn.signedOwners.length; i++) {
                        signedDigestsByOwners.push(txn.signedOwners[i].signedDigest);
                    }
                    const concatenatedSignatures = ethers.utils.concat(signedDigestsByOwners);

                    // finalizing the transfer eip712 str..
                    transfer = {
                        ...transfer,
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
                    transfer.gasPrice = await provider.getGasPrice();
                    transfer.gasLimit = ethers.BigNumber.from(2000000);
                    transfer.customData = {
                        ...transfer.customData,
                        customSignature: concatenatedSignatures,
                    } as types.Eip712Meta;
                    console.log("eip712 str to be serialized and sent to chain - ", transfer)

                    // sending the serialized eip712 typed structure into the chain..
                    const sentTx = await provider.sendTransaction(utils.serialize(transfer));
                    await sentTx.wait();
                    console.log("after waiting - ", sentTx)
                    return res.status(200).json({ message: "Transfer Transaction signed successfully and TRANSACTION EXECUTED FROM SERVER END" });
                }
                if (txn.paymaster === false) {
                    // setting up blockchain and contract connections
                    const provider = new Provider("https://zksync2-testnet.zksync.dev");
                    const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
                    const erc20Contract = new ethers.Contract(erc20TokenAddress, abi, provider);

                    // populating the txn..
                    let transfer = await erc20Contract.populateTransaction.transfer(recipientAddress, txnAmount);

                    // bundling the signatures.. 
                    let signedDigestsByOwners = [];
                    for (let i = 0; i < txn.signedOwners.length; i++) {
                        signedDigestsByOwners.push(txn.signedOwners[i].signedDigest);
                    }
                    const concatenatedSignatures = ethers.utils.concat(signedDigestsByOwners);

                    // forming the final eip712 txn structure ..
                    transfer = {
                        ...transfer,
                        from: safeAddress,
                        chainId: (await provider.getNetwork()).chainId,
                        nonce: await provider.getTransactionCount(safeAddress),
                        type: 113,
                        customData: {
                            gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                        } as types.Eip712Meta,
                        value: ethers.BigNumber.from(0),
                    };
                    transfer.gasPrice = await provider.getGasPrice();
                    transfer.gasLimit = ethers.BigNumber.from(2000000);
                    transfer.customData = {
                        ...transfer.customData,
                        customSignature: concatenatedSignatures,
                    } as types.Eip712Meta;
                    console.log("eip712 str to be serialized and sent to chain - ", transfer)

                    // sending the serialized eip712 typed structure into the chain..
                    const sentTx = await provider.sendTransaction(utils.serialize(transfer));
                    await sentTx.wait();
                    console.log("after - ", sentTx)
                    return res.status(200).json({ message: "Transfer Transaction signed successfully and TRANSACTION EXECUTED FROM SERVER END" });
                }
            }
        }
        return res.status(200).json({ message: "Transaction signed successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

