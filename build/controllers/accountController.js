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
exports.signScrTxn = exports.getSCRTxnHash = exports.checkSCRStatus = exports.toggleEnableDisableSocialRecovery = exports.createSafe = exports.getAccount = exports.getAccounts = void 0;
const ethers_1 = require("ethers");
const model_1 = require("../db-models/model");
const exports_1 = require("../exports");
const zksync_web3_1 = require("zksync-web3");
const getAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const safeAccounts = yield model_1.Account.find({});
        res.status(200).json(safeAccounts);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
    }
});
exports.getAccounts = getAccounts;
const getAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accountAddress } = req.params;
        const account = yield model_1.Account.findOne({ accountAddress: accountAddress });
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }
        return res.status(200).json(account);
    }
    catch (error) {
        res.status(500).send('Internal Server Error during fetch of the account');
    }
});
exports.getAccount = getAccount;
const createSafe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accountAddress, accountName, setThreshold, owners, network, socialRecoveryModuleAddress } = req.body;
        const scrConfig = new model_1.SCR({
            smartAccount: accountAddress,
            enabled: false,
        });
        yield scrConfig.save();
        const newAccount = new model_1.Account({
            accountAddress,
            accountName,
            setThreshold,
            owners,
            transactions: [],
            network,
            socialRecoveryConfig: scrConfig,
            socialRecoveryModuleAddress: socialRecoveryModuleAddress
        });
        const saveAccount = yield newAccount.save();
        res.json(saveAccount);
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error during creation of new safe account');
    }
});
exports.createSafe = createSafe;
const toggleEnableDisableSocialRecovery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accountAddress, activatedBy, value } = req.body;
        const account = yield model_1.Account.findOne({ accountAddress: accountAddress }).exec();
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }
        account.socialRecoveryConfig.enabled = value;
        account.socialRecoveryConfig.enabledBy = activatedBy;
        const scr = yield model_1.SCR.findOne({ smartAccount: account.accountAddress });
        scr.enabled = value;
        scr.enabledBy = activatedBy;
        if (value === false) {
            account.socialRecoveryConfig.signatures = [];
            scr.signatures = [];
            account.socialRecoveryConfig.signedBy = [];
            scr.signedBy = [];
        }
        yield Promise.all([account.save(), scr.save()]);
        res.status(200).json({ action: value === true ? "Enable" : "Disable", actionDoneBy: activatedBy });
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error while enabling/disabling SCR');
    }
});
exports.toggleEnableDisableSocialRecovery = toggleEnableDisableSocialRecovery;
const checkSCRStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accountAddress } = req.body;
        const scr = yield model_1.SCR.findOne({ smartAccount: accountAddress });
        if (!scr) {
            res.status(401).json({ message: "ERR: Invalid Req params - NO such scr" });
        }
        if (scr.enabled === true) {
            res.status(200).json(scr);
        }
        else {
            res.status(200).json(scr);
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error while retrieving the SCR Status');
    }
});
exports.checkSCRStatus = checkSCRStatus;
const getSCRTxnHash = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { safeAddress, scrmAddress } = req.body;
        console.log(scrmAddress);
        const acc = yield model_1.Account.findOne({ accountAddress: safeAddress });
        if (acc.socialRecoveryConfig.enabled === false) {
            return res.status(403).json({ message: "SCR IS DISABLED" });
        }
        const provider = new zksync_web3_1.Provider("https://zksync2-testnet.zksync.dev");
        const wallet = new ethers_1.Wallet("0470b3a89b046cdca84671d3ad445f0ecdb7cfa82b5154df393260a28cabd2e2").connect(provider);
        const account = new ethers_1.ethers.Contract(safeAddress, exports_1.TwoUserMultiSigABI, provider);
        let aaTx = yield account.populateTransaction.enableModule(scrmAddress);
        aaTx = Object.assign(Object.assign({}, aaTx), { 
            // deploy a new account using the multisig
            from: safeAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                // paymasterParams: paymasterParams,
            }, value: ethers_1.ethers.BigNumber.from(0) });
        aaTx.gasPrice = yield provider.getGasPrice();
        aaTx.gasLimit = ethers_1.ethers.BigNumber.from(200000);
        const signedTxHash = zksync_web3_1.EIP712Signer.getSignedDigest(aaTx);
        return res.status(200).json({ scrTxnHash: signedTxHash });
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error while retrieving the SCR Status');
    }
});
exports.getSCRTxnHash = getSCRTxnHash;
const signScrTxn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { safeAddress, signature, signerAddress, scrAddress } = req.body;
    console.log(scrAddress);
    const acc = yield model_1.Account.findOne({ accountAddress: safeAddress });
    if (acc.socialRecoveryConfig.enabled === false) {
        return res.status(403).json({ message: "SCR IS DISABLED" });
    }
    const scr = yield model_1.SCR.findOne({ smartAccount: safeAddress });
    const account = yield model_1.Account.findOne({ accountAddress: safeAddress });
    scr.signedBy.push(signerAddress);
    scr.signatures.push(signature);
    account.socialRecoveryConfig.signedBy.push(signerAddress);
    account.socialRecoveryConfig.signatures.push(signature);
    yield Promise.all([account.save(), scr.save()]);
    if (scr.signedBy.length === account.setThreshold) {
        console.log(scr.signatures);
        const provider = new zksync_web3_1.Provider("https://zksync2-testnet.zksync.dev");
        const wallet = new ethers_1.Wallet("0470b3a89b046cdca84671d3ad445f0ecdb7cfa82b5154df393260a28cabd2e2").connect(provider);
        const account = new ethers_1.ethers.Contract(safeAddress, exports_1.TwoUserMultiSigABI, provider);
        let signedDigestsByOwners = [];
        for (let i = 0; i < scr.signatures.length; i++) {
            signedDigestsByOwners.push(scr.signatures[i]);
        }
        const concatenatedSignatures = ethers_1.ethers.utils.concat(signedDigestsByOwners);
        let aaTx = yield account.populateTransaction.enableModule(scrAddress);
        aaTx = Object.assign(Object.assign({}, aaTx), { from: safeAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                // paymasterParams: paymasterParams,
            }, value: ethers_1.ethers.BigNumber.from(0) });
        aaTx.gasPrice = yield provider.getGasPrice();
        aaTx.gasLimit = ethers_1.ethers.BigNumber.from(200000);
        aaTx.customData = Object.assign(Object.assign({}, aaTx.customData), { customSignature: concatenatedSignatures });
        console.log(aaTx);
        const sentTx = yield provider.sendTransaction(zksync_web3_1.utils.serialize(aaTx));
        yield sentTx.wait();
        console.log("addedmodule in account");
        return res.status(200).json({ message: "successfully enabled scr module!!" });
    }
    return res.status(200).json({ message: "signed enable module txn" });
});
exports.signScrTxn = signScrTxn;
//# sourceMappingURL=accountController.js.map