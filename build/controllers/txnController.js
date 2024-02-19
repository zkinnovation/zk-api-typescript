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
const exports_1 = require("../exports");
const abi = exports_1.ERC20ABI;
const createTxn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // to create a txn..
    try {
        const { safeAddress, transactionType, userAddress, txnAmount, recipientAddress, paymasterEnable } = req.body;
        const account = yield model_1.Account.findOne({ accountAddress: safeAddress }).exec();
        console.log(account);
        // if (requiredThreshold > account.setThreshold) {
        //     return res.status(404).json({ message: "The set threshold is greater than the already set threshold for this zkwallet" });
        // }
        console.log(userAddress);
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }
        //Assuming that signerAddress is one of the owners of the account
        // if (!account.owners.some((s) => s.toLowerCase() === userAddress.toLowerCase())) {
        //     return res.status(403).json({ message: "Unauthorized signer" });
        // }
        const newTxn = new model_1.Transaction({
            transactionType: transactionType,
            // requiredThreshold: requiredThreshold,
            currentSignCount: 0,
            currentSetAccountThreshold: account.setThreshold,
            signedOwners: [],
            txnAmount: txnAmount,
            recipientAddress: recipientAddress,
            paymaster: paymasterEnable
        });
        yield newTxn.save();
        account.transactions.push(newTxn);
        yield account.save();
        res.status(200).json({ message: "Transaction created successfully", transaction: newTxn });
    }
    catch (error) {
        console.log(error);
        res.status(500).send({ message: "Internal server error while creating a txn", data: error });
    }
});
exports.createTxn = createTxn;
const getTxnsBySafeAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // get the transaction history of a particular safe account..
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
    // to get the signed txn hash and sending it to the client (owner) for generating the signature.
    try {
        const { safeAddress, amount, recipientAddress, paymasterParams, txnType } = req.body;
        // initializing the blockchain provider
        const provider = new ethers_1.ethers.providers.JsonRpcProvider("https://zksync2-testnet.zksync.dev");
        // for mint txn type..
        if (txnType === 'mint') {
            // test token address...
            const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
            const erc20Contract = new ethers_1.ethers.Contract(erc20TokenAddress, abi, provider);
            let mintAddress = recipientAddress;
            // checking if the paymaster needed to be added to this txn
            if (paymasterParams === true) {
                // paymaster contract's deployed address
                const paymaster = "0x97E5A77B5f77fC3B657B84059D15Fe5b377E6519";
                const paymasterParams = zksync_web3_1.utils.getPaymasterParams(paymaster, {
                    type: "ApprovalBased",
                    token: erc20TokenAddress,
                    // set minimalAllowance as we defined in the paymaster contract
                    minimalAllowance: ethers_1.ethers.BigNumber.from(1),
                    // empty bytes as testnet paymaster does not use innerInput
                    innerInput: new Uint8Array(),
                });
                // populating the contract call transaction..
                let mint = yield erc20Contract.populateTransaction.mint(mintAddress, amount);
                mint = Object.assign(Object.assign({}, mint), { from: safeAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                        gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                        paymasterParams: paymasterParams,
                    }, value: ethers_1.ethers.BigNumber.from(0) });
                mint.gasPrice = yield provider.getGasPrice();
                mint.gasLimit = ethers_1.ethers.BigNumber.from(2000000);
                // generating the signed txn hash..
                const signedTxHash = zksync_web3_1.EIP712Signer.getSignedDigest(mint);
                console.log("Sending signed txn hash for mint with paymaster params...");
                return res.status(200).json({ message: signedTxHash });
            }
            if (paymasterParams === false) {
                // populating the contract call txn..
                let mint = yield erc20Contract.populateTransaction.mint(mintAddress, amount);
                mint = Object.assign(Object.assign({}, mint), { from: safeAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                        gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                        // paymasterParams: paymasterParams,
                    }, value: ethers_1.ethers.BigNumber.from(0) });
                mint.gasPrice = yield provider.getGasPrice();
                mint.gasLimit = ethers_1.ethers.BigNumber.from(2000000);
                // generating the signed txn hash and sending it to the client..
                const signedTxHash = zksync_web3_1.EIP712Signer.getSignedDigest(mint);
                console.log("Sending signed txn hash for mint without paymaster params...");
                return res.status(200).json({ message: signedTxHash });
            }
        }
        // for transfer txn type...
        if (txnType === 'transfer') {
            // same test token address
            const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
            const erc20Contract = new ethers_1.ethers.Contract(erc20TokenAddress, abi, provider);
            let recipientAddr = recipientAddress;
            // when paymaster is enabled for this txn..
            if (paymasterParams === true) {
                // paymaster contract's deployed address
                const paymaster = "0x97E5A77B5f77fC3B657B84059D15Fe5b377E6519";
                const paymasterParams = zksync_web3_1.utils.getPaymasterParams(paymaster, {
                    type: "ApprovalBased",
                    token: erc20TokenAddress,
                    // set minimalAllowance as we defined in the paymaster contract
                    minimalAllowance: ethers_1.ethers.BigNumber.from(1),
                    // empty bytes as testnet paymaster does not use innerInput
                    innerInput: new Uint8Array(),
                });
                // populating the contract call txn..
                let transfer = yield erc20Contract.populateTransaction.transfer(recipientAddr, amount);
                transfer = Object.assign(Object.assign({}, transfer), { from: safeAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                        gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                        paymasterParams: paymasterParams,
                    }, value: ethers_1.ethers.BigNumber.from(0) });
                transfer.gasPrice = yield provider.getGasPrice();
                transfer.gasLimit = ethers_1.ethers.BigNumber.from(2000000);
                // getting the signed txn hash and sending it back to the client
                const signedTxHash = zksync_web3_1.EIP712Signer.getSignedDigest(transfer);
                console.log("Sending signed txn hash for Transfer with paymaster params...");
                return res.status(200).json({ message: signedTxHash });
            }
            if (paymasterParams === false) {
                // populating the contract call txn..
                let transfer = yield erc20Contract.populateTransaction.transfer(recipientAddr, amount);
                transfer = Object.assign(Object.assign({}, transfer), { from: safeAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                        gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                    }, value: ethers_1.ethers.BigNumber.from(0) });
                transfer.gasPrice = yield provider.getGasPrice();
                transfer.gasLimit = ethers_1.ethers.BigNumber.from(2000000);
                // generating the signed txn hash and sending it to the client for the obtaining the signatures..
                const signedTxHash = zksync_web3_1.EIP712Signer.getSignedDigest(transfer);
                console.log("Sending signed txn hash for Transfer without paymaster params...");
                return res.status(200).json({ message: signedTxHash });
            }
        }
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error while sending the txn hash" });
    }
});
exports.getSignedTxnHash = getSignedTxnHash;
const signTxn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //store the signatures (of mint/transfer fn) into the db 
    try {
        const { signedDigest, signerAddress, safeAddress, txnId, recipientAddress, txnAmount, txnType } = req.body;
        const txn = yield model_1.Transaction.findById(txnId);
        const account = yield model_1.Account.findOne({ accountAddress: safeAddress });
        // some basic validations..
        if (txn.signedOwners.includes(signerAddress)) {
            return res.status(404).json({ message: "Signer already signed for this transaction" });
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
        // if the threshold amount of txns are obtained..
        if (txn.currentSignCount === account.setThreshold) {
            // if the txn type is mint..
            if (txnType === 'mint') {
                // checking if paymaster was enabled for this txn..
                if (txn.paymaster === true) {
                    // console.log("Paymaster enabled")
                    // setting up blockchain and contract connections
                    const provider = new zksync_web3_1.Provider("https://zksync2-testnet.zksync.dev");
                    const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
                    const erc20Contract = new ethers_1.ethers.Contract(erc20TokenAddress, abi, provider);
                    // paymaster deployed address and configuration..
                    const paymaster = "0x97E5A77B5f77fC3B657B84059D15Fe5b377E6519";
                    const paymasterParams = zksync_web3_1.utils.getPaymasterParams(paymaster, {
                        type: "ApprovalBased",
                        token: erc20TokenAddress,
                        // set minimalAllowance as we defined in the paymaster contract
                        minimalAllowance: ethers_1.ethers.BigNumber.from(1),
                        // empty bytes as testnet paymaster does not use innerInput
                        innerInput: new Uint8Array(),
                    });
                    // populating the mint contract call txn..
                    let mint = yield erc20Contract.populateTransaction.mint(recipientAddress, txnAmount);
                    // bundling the txn signatures of owners..
                    let signedDigestsByOwners = [];
                    for (let i = 0; i < txn.signedOwners.length; i++) {
                        signedDigestsByOwners.push(txn.signedOwners[i].signedDigest);
                    }
                    const concatenatedSignatures = ethers_1.ethers.utils.concat(signedDigestsByOwners);
                    // forming the final eip712 structure..
                    mint = Object.assign(Object.assign({}, mint), { from: safeAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                            gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                            paymasterParams: paymasterParams,
                        }, value: ethers_1.ethers.BigNumber.from(0) });
                    mint.gasPrice = yield provider.getGasPrice();
                    mint.gasLimit = ethers_1.ethers.BigNumber.from(2000000);
                    mint.customData = Object.assign(Object.assign({}, mint.customData), { customSignature: concatenatedSignatures });
                    console.log("eip712 str to be serialized and sent to chain - ", mint);
                    // sending the serialized eip712 typed structure into the chain..
                    const sentTx = yield provider.sendTransaction(zksync_web3_1.utils.serialize(mint));
                    yield sentTx.wait();
                    console.log("after sending.. - ", sentTx);
                    return res.status(200).json({ message: "Mint Transaction signed successfully and TRANSACTION EXECUTED FROM SERVER END" });
                }
                if (txn.paymaster === false) {
                    // setting up blockchain and contract connections
                    const provider = new zksync_web3_1.Provider("https://zksync2-testnet.zksync.dev");
                    const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
                    const erc20Contract = new ethers_1.ethers.Contract(erc20TokenAddress, abi, provider);
                    // populating the txn..
                    let mint = yield erc20Contract.populateTransaction.mint(recipientAddress, txnAmount);
                    // bundling the txn signatures by owners..
                    let signedDigestsByOwners = [];
                    for (let i = 0; i < txn.signedOwners.length; i++) {
                        signedDigestsByOwners.push(txn.signedOwners[i].signedDigest);
                    }
                    const concatenatedSignatures = ethers_1.ethers.utils.concat(signedDigestsByOwners);
                    // finalizing the 712 structure..
                    mint = Object.assign(Object.assign({}, mint), { from: safeAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                            gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                        }, value: ethers_1.ethers.BigNumber.from(0) });
                    mint.gasPrice = yield provider.getGasPrice();
                    mint.gasLimit = ethers_1.ethers.BigNumber.from(2000000);
                    mint.customData = Object.assign(Object.assign({}, mint.customData), { customSignature: concatenatedSignatures });
                    console.log("eip712 str to be serialized and sent to chain - ", mint);
                    // sending the serialized eip712 typed structure into the chain..
                    const sentTx = yield provider.sendTransaction(zksync_web3_1.utils.serialize(mint));
                    yield sentTx.wait();
                    console.log("Transaction Executed -", sentTx);
                    return res.status(200).json({ message: "Mint Transaction signed successfully and TRANSACTION EXECUTED FROM SERVER END" });
                }
            }
            // if the txn type is transfer..
            if (txnType === "transfer") {
                // checking if paymaster was enabled for this txn..
                if (txn.paymaster === true) {
                    // setting up blockchain and contract connections
                    const provider = new zksync_web3_1.Provider("https://zksync2-testnet.zksync.dev");
                    const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
                    const erc20Contract = new ethers_1.ethers.Contract(erc20TokenAddress, abi, provider);
                    // paymaster deployed address and configuration..
                    const paymaster = "0x97E5A77B5f77fC3B657B84059D15Fe5b377E6519";
                    const paymasterParams = zksync_web3_1.utils.getPaymasterParams(paymaster, {
                        type: "ApprovalBased",
                        token: erc20TokenAddress,
                        // set minimalAllowance as we defined in the paymaster contract
                        minimalAllowance: ethers_1.ethers.BigNumber.from(1),
                        // empty bytes as testnet paymaster does not use innerInput
                        innerInput: new Uint8Array(),
                    });
                    // populating the txn...
                    let transfer = yield erc20Contract.populateTransaction.transfer(recipientAddress, txnAmount);
                    // bundling the signatures..
                    let signedDigestsByOwners = [];
                    for (let i = 0; i < txn.signedOwners.length; i++) {
                        signedDigestsByOwners.push(txn.signedOwners[i].signedDigest);
                    }
                    const concatenatedSignatures = ethers_1.ethers.utils.concat(signedDigestsByOwners);
                    // finalizing the transfer eip712 str..
                    transfer = Object.assign(Object.assign({}, transfer), { from: safeAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                            gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                            paymasterParams: paymasterParams,
                        }, value: ethers_1.ethers.BigNumber.from(0) });
                    transfer.gasPrice = yield provider.getGasPrice();
                    transfer.gasLimit = ethers_1.ethers.BigNumber.from(2000000);
                    transfer.customData = Object.assign(Object.assign({}, transfer.customData), { customSignature: concatenatedSignatures });
                    console.log("eip712 str to be serialized and sent to chain - ", transfer);
                    // sending the serialized eip712 typed structure into the chain..
                    const sentTx = yield provider.sendTransaction(zksync_web3_1.utils.serialize(transfer));
                    yield sentTx.wait();
                    console.log("after waiting - ", sentTx);
                    return res.status(200).json({ message: "Transfer Transaction signed successfully and TRANSACTION EXECUTED FROM SERVER END" });
                }
                if (txn.paymaster === false) {
                    // setting up blockchain and contract connections
                    const provider = new zksync_web3_1.Provider("https://zksync2-testnet.zksync.dev");
                    const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
                    const erc20Contract = new ethers_1.ethers.Contract(erc20TokenAddress, abi, provider);
                    // populating the txn..
                    let transfer = yield erc20Contract.populateTransaction.transfer(recipientAddress, txnAmount);
                    // bundling the signatures.. 
                    let signedDigestsByOwners = [];
                    for (let i = 0; i < txn.signedOwners.length; i++) {
                        signedDigestsByOwners.push(txn.signedOwners[i].signedDigest);
                    }
                    const concatenatedSignatures = ethers_1.ethers.utils.concat(signedDigestsByOwners);
                    // forming the final eip712 txn structure ..
                    transfer = Object.assign(Object.assign({}, transfer), { from: safeAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                            gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                        }, value: ethers_1.ethers.BigNumber.from(0) });
                    transfer.gasPrice = yield provider.getGasPrice();
                    transfer.gasLimit = ethers_1.ethers.BigNumber.from(2000000);
                    transfer.customData = Object.assign(Object.assign({}, transfer.customData), { customSignature: concatenatedSignatures });
                    console.log("eip712 str to be serialized and sent to chain - ", transfer);
                    // sending the serialized eip712 typed structure into the chain..
                    const sentTx = yield provider.sendTransaction(zksync_web3_1.utils.serialize(transfer));
                    yield sentTx.wait();
                    console.log("after - ", sentTx);
                    return res.status(200).json({ message: "Transfer Transaction signed successfully and TRANSACTION EXECUTED FROM SERVER END" });
                }
            }
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