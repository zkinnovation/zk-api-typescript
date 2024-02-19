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
exports.confirmRecoveryCall = exports.getRecoveryStatus = exports.getRecoveries = exports.createNewRecovery = exports.getApprovedGuardians = exports.signForGuardianApproval = exports.getGuardianApprovalHash = exports.addGuardian = exports.signScrTxn = exports.getSCRTxnHash = exports.checkSCRStatus = exports.toggleEnableDisableSocialRecovery = exports.createSafe = exports.getAccount = exports.getGuardians = exports.getAccounts = void 0;
const ethers_1 = require("ethers");
const model_1 = require("../db-models/model");
const exports_1 = require("../exports");
const zksync_web3_1 = require("zksync-web3");
const utils_1 = require("../utils");
require('dotenv').config();
const getAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // fetching all the safe accounts from db
        const safeAccounts = yield model_1.Account.find({});
        res.status(200).json(safeAccounts);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
    }
});
exports.getAccounts = getAccounts;
const getGuardians = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // fetching all the guardians from the db
        const guardians = yield model_1.Guardian.find({});
        res.status(200).json(guardians);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
    }
});
exports.getGuardians = getGuardians;
const getAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // to fetch the details of a specific safe account from db
        const { accountAddress } = req.params;
        // console.log(accountAddress)
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
        // getting the params required to create a safe account from the client.
        const { accountAddress, accountName, setThreshold, owners, network, socialRecoveryModuleAddress } = req.body;
        // creating a new entry for the social recovery config
        const scrConfig = new model_1.SCR({
            smartAccount: accountAddress,
            enabled: false,
        });
        yield scrConfig.save();
        // creating a new safe account entry in the db collection
        const newAccount = new model_1.Account({
            accountAddress,
            accountName,
            setThreshold,
            owners,
            transactions: [],
            network,
            socialRecoveryConfig: scrConfig,
            socialRecoveryModuleAddress: socialRecoveryModuleAddress,
            accountGuardians: []
        });
        const saveAccount = yield newAccount.save();
        res.status(200).json({ message: "created safe", data: saveAccount });
    }
    catch (error) {
        console.log(error);
        res.status(500).send(`Internal Server Error during creation of new safe account - ${error}`);
    }
});
exports.createSafe = createSafe;
const toggleEnableDisableSocialRecovery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // getting the params required for enabling the social recovery module.
        const { accountAddress, activatedBy, value } = req.body;
        const account = yield model_1.Account.findOne({ accountAddress: accountAddress });
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }
        // adding the enabled label in the db for the safe account
        account.socialRecoveryConfig.enabled = value;
        account.socialRecoveryConfig.enabledBy = activatedBy;
        // updating the collection
        const scr = yield model_1.SCR.findOne({ smartAccount: account.accountAddress });
        scr.enabled = value;
        scr.enabledBy = activatedBy;
        // condition for de-activating the enableModule call by any one of the owners - basically deletes all the signatures
        if (value === false) {
            const signatureIds = account.socialRecoveryConfig.signatures.map((s) => s._id);
            yield model_1.Signature.deleteMany({ _id: { $in: signatureIds } });
            console.log("deleted all signatures..");
            account.socialRecoveryConfig.signatures = [];
            scr.signatures = [];
        }
        // saving and syncing db..
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
        // to check the status of the scr - whether enabled or disabled.
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
        // to generate the scr contract call's eip712 txn hash and send to the client for signatures.
        const { safeAddress, scrmAddress } = req.body;
        console.log("Social recovery module address - ", scrmAddress);
        const acc = yield model_1.Account.findOne({ accountAddress: safeAddress });
        if (acc.socialRecoveryConfig.enabled === false) {
            return res.status(403).json({ message: "SCR IS DISABLED" });
        }
        // setting up blockchain and contract connections
        const provider = new zksync_web3_1.Provider("https://zksync2-testnet.zksync.dev");
        const wallet = new ethers_1.Wallet(process.env.PUBLIC_WHALE_PRIV_KEY_1).connect(provider);
        const account = new ethers_1.ethers.Contract(safeAddress, exports_1.TwoUserMultiSigABI, wallet);
        // populating the contract call (enableModule() function) and making the eip712 txn structure
        let aaTx = yield account.populateTransaction.enableModule(scrmAddress);
        aaTx = Object.assign(Object.assign({}, aaTx), { 
            // deploy a new account using the multisig
            from: safeAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                // paymasterParams: paymasterParams,
            }, value: ethers_1.ethers.BigNumber.from(0) });
        aaTx.gasPrice = yield provider.getGasPrice();
        aaTx.gasLimit = ethers_1.ethers.BigNumber.from(200000);
        // generating the signed hash..
        const signedTxHash = zksync_web3_1.EIP712Signer.getSignedDigest(aaTx);
        // sending it to the client for the signatures.
        return res.status(200).json({ scrTxnHash: signedTxHash });
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error while retrieving the SCR Status');
    }
});
exports.getSCRTxnHash = getSCRTxnHash;
const signScrTxn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // to save the signature received for the txn and store it in the db
    try {
        // getting the signature as a req body.. 
        const { safeAddress, signature, signerAddress, scrAddress } = req.body;
        // console.log(signerAddress, signature)
        const acc = yield model_1.Account.findOne({ accountAddress: safeAddress });
        // checking whether the social recovery module is enabled or not
        if (acc.socialRecoveryConfig.enabled === false) {
            return res.status(403).json({ message: "SCR IS DISABLED" });
        }
        const scr = yield model_1.SCR.findOne({ smartAccount: safeAddress });
        const account = yield model_1.Account.findOne({ accountAddress: safeAddress });
        // creating a signature item using the Signature db model class..
        const newSignature = new model_1.Signature({
            signerAddress: signerAddress,
            signedDigest: signature
        });
        // saving the signatures..
        scr.signatures.push(newSignature);
        account.socialRecoveryConfig.signatures.push(newSignature);
        yield Promise.all([newSignature.save(), account.save(), scr.save()]);
        // only send the final txn with the bundled signatures IF the threshold number of signatures are received or not..
        if (scr.signatures.length === account.setThreshold) {
            // console.log(scr.signatures)
            // setting up blockchain and contract connections
            const provider = new zksync_web3_1.Provider("https://zksync2-testnet.zksync.dev");
            const wallet = new ethers_1.Wallet(process.env.PUBLIC_WHALE_PRIV_KEY_1).connect(provider);
            const account = new ethers_1.ethers.Contract(safeAddress, exports_1.TwoUserMultiSigABI, wallet);
            // bundling all the signatures..
            let signedDigestsByOwners = [];
            for (let i = 0; i < scr.signatures.length; i++) {
                signedDigestsByOwners.push(scr.signatures[i].signedDigest);
            }
            const concatenatedSignatures = ethers_1.ethers.utils.concat(signedDigestsByOwners);
            // populating the txn and adding the bundled signatures along with it this time..
            let aaTx = yield account.populateTransaction.enableModule(scrAddress);
            aaTx = Object.assign(Object.assign({}, aaTx), { from: safeAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                    gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                    // paymasterParams: paymasterParams,
                }, value: ethers_1.ethers.BigNumber.from(0) });
            aaTx.gasPrice = yield provider.getGasPrice();
            aaTx.gasLimit = ethers_1.ethers.BigNumber.from(200000);
            aaTx.customData = Object.assign(Object.assign({}, aaTx.customData), { customSignature: concatenatedSignatures });
            console.log("eip712 str to be serialized and sent to chain - ", aaTx);
            const sentTx = yield provider.sendTransaction(zksync_web3_1.utils.serialize(aaTx));
            yield sentTx.wait();
            console.log("addedmodule in account - ", sentTx);
            return res.status(200).json({ message: "successfully enabled scr module!!" });
        }
        return res.status(200).json({ message: "Signed enable module txn" });
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error while signing the scr txn');
    }
});
exports.signScrTxn = signScrTxn;
const addGuardian = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // api call to add guardian address to db for recovery module.
    try {
        const { safeAddress, assignedBy, guardianAddress, currentSetThreshold } = req.body;
        const findGuardianAccount = yield model_1.Account.findOne({ accountAddress: guardianAddress });
        // if (!findGuardianAccount) {
        //     return res.status(403).send({ message: "INVALID Guardian Address or Guardian smart account not found..." })
        // }
        const account = yield model_1.Account.findOne({ accountAddress: safeAddress });
        // creating new guardian entry using the Guardian db model class and saving it to the db
        const newGuardian = new model_1.Guardian({
            safeAddress: safeAddress,
            guardianType: findGuardianAccount ? "ZKW" : "EOA",
            assignedBy: assignedBy,
            guardianAddress: guardianAddress,
            currentSetThreshold: currentSetThreshold
        });
        const saveGuardian = yield newGuardian.save();
        account.accountGuardians.push(newGuardian);
        yield account.save();
        return res.status(200).json({ message: "added guardian", data: saveGuardian });
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error while adding the guardian');
    }
});
exports.addGuardian = addGuardian;
const getGuardianApprovalHash = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // to get the signed eip 712 hash for the addGuardianWithThreshold call and get signatures from the client..
    try {
        const { safeAddress, guardianAddress } = req.body;
        const account = yield model_1.Account.findOne({ accountAddress: safeAddress });
        const accountGuardian = account.accountGuardians.findIndex((e) => e.guardianAddress === guardianAddress);
        console.log("account.accountGuardians[accountGuardian].currentSetThreshold - ", account.accountGuardians[accountGuardian].currentSetThreshold);
        // setting up blockchain and contract connections
        const provider = new zksync_web3_1.Provider("https://zksync2-testnet.zksync.dev");
        const scrContract = new ethers_1.ethers.Contract(account.socialRecoveryModuleAddress, exports_1.SCRABI, provider);
        const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
        const paymaster = "0x97E5A77B5f77fC3B657B84059D15Fe5b377E6519";
        // paymaster configuration
        const paymasterParams = zksync_web3_1.utils.getPaymasterParams(paymaster, {
            type: "ApprovalBased",
            token: erc20TokenAddress,
            // set minimalAllowance as we defined in the paymaster contract
            minimalAllowance: ethers_1.ethers.BigNumber.from(1),
            // empty bytes as testnet paymaster does not use innerInput
            innerInput: new Uint8Array(),
        });
        // populate the contract call txn and create the eip712 str .. hash it and send it to the owner client.
        let guardianCall = yield scrContract.populateTransaction.addGuardianWithThreshold(account.accountAddress, guardianAddress, account.accountGuardians[accountGuardian].currentSetThreshold);
        guardianCall = Object.assign(Object.assign({}, guardianCall), { from: account.accountAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                // paymasterParams: paymasterParams,
            }, value: ethers_1.ethers.BigNumber.from(0) });
        guardianCall.gasPrice = yield provider.getGasPrice();
        guardianCall.gasLimit = ethers_1.ethers.BigNumber.from(2000000);
        // generating the signed tx hash that is sent to the client owners for signatures
        const signedTxHash = zksync_web3_1.EIP712Signer.getSignedDigest(guardianCall);
        console.log("signedTxHash - ", signedTxHash);
        console.log("Sending signed txn hash for account guardian approval call..");
        return res.status(200).json({ guardianHash: signedTxHash });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error while sending the txn hash for guardiancall" });
    }
});
exports.getGuardianApprovalHash = getGuardianApprovalHash;
const signForGuardianApproval = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // store the signatures (of guardian approval fn) into the db 
    try {
        const { signedDigest, signerAddress, safeAddress, guardianAddress } = req.body;
        // console.log(signedDigest)
        const account = yield model_1.Account.findOne({ accountAddress: safeAddress });
        const guardian = yield model_1.Guardian.findOne({ safeAddress: safeAddress, guardianAddress: guardianAddress });
        const accountGuardian = account.accountGuardians.findIndex((e) => e.guardianAddress === guardianAddress);
        console.log(accountGuardian);
        if (!account.socialRecoveryConfig.enabled) {
            return res.status(403).send({ message: "Social recovery not enabled for this smart account" });
        }
        // checking if the no of approval signatures obtained is less than the account threshold
        if (account.accountGuardians[accountGuardian].approvalSignatures.length < account.setThreshold) {
            // creating a signature item using the Signature db model class..
            const signature = new model_1.Signature({
                signerAddress: signerAddress,
                signedDigest: signedDigest
            });
            // save the signature into the db
            guardian.approvalSignatures.push(signature);
            account.accountGuardians[accountGuardian].approvalSignatures.push(signature);
            yield Promise.all([signature.save(), guardian.save(), account.save()]);
            // checking if approval signatures is equal to set threshold of the smart account
            if (account.accountGuardians[accountGuardian].approvalSignatures.length === account.setThreshold) {
                // console.log("READY TO APPROVEEE..!!!!")
                // setting up blockchain and contract connections
                const provider = new zksync_web3_1.Provider("https://zksync2-testnet.zksync.dev");
                const scrContract = new ethers_1.ethers.Contract(account.socialRecoveryModuleAddress, exports_1.SCRABI, provider);
                const erc20TokenAddress = "0x4A0F0ca3A08084736c0ef1a3bbB3752EA4308bD3";
                const paymaster = "0x97E5A77B5f77fC3B657B84059D15Fe5b377E6519";
                // populating the txn call
                let guardianCall = yield scrContract.populateTransaction.addGuardianWithThreshold(account.accountAddress, guardianAddress, account.accountGuardians[accountGuardian].currentSetThreshold);
                const paymasterParams = zksync_web3_1.utils.getPaymasterParams(paymaster, {
                    type: "ApprovalBased",
                    token: erc20TokenAddress,
                    // set minimalAllowance as we defined in the paymaster contract
                    minimalAllowance: ethers_1.ethers.BigNumber.from(1),
                    // empty bytes as testnet paymaster does not use innerInput
                    innerInput: new Uint8Array(),
                });
                // bundling all the signatures..
                let signedDigestsByOwners = [];
                for (let i = 0; i < guardian.approvalSignatures.length; i++) {
                    const approvalSignature = account.accountGuardians[accountGuardian].approvalSignatures[i];
                    console.log("approvalSignature-", approvalSignature);
                    if (approvalSignature && approvalSignature.signedDigest) {
                        signedDigestsByOwners.push(approvalSignature.signedDigest);
                    }
                }
                // console.log(signedDigestsByOwners.length)
                const concatenatedSignatures = ethers_1.ethers.utils.concat(signedDigestsByOwners);
                // eip712 str..
                guardianCall = Object.assign(Object.assign({}, guardianCall), { from: account.accountAddress, chainId: (yield provider.getNetwork()).chainId, nonce: yield provider.getTransactionCount(safeAddress), type: 113, customData: {
                        gasPerPubdata: zksync_web3_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                        // paymasterParams: paymasterParams,
                    }, value: ethers_1.ethers.BigNumber.from(0) });
                guardianCall.gasPrice = yield provider.getGasPrice();
                guardianCall.gasLimit = ethers_1.ethers.BigNumber.from(2000000);
                guardianCall.customData = Object.assign(Object.assign({}, guardianCall.customData), { customSignature: concatenatedSignatures });
                console.log("eip712 str to be serialized and sent to chain - ", guardianCall);
                // sending the final serialized txn to the chain
                const sentTx = yield provider.sendTransaction(zksync_web3_1.utils.serialize(guardianCall));
                yield sentTx.wait();
                console.log(sentTx);
                console.log("addGuardianWithThreshold successfully called");
                // updating the guardian and account db items to change the approvedStatus to approved
                guardian.approvedStatus = "approved";
                account.accountGuardians[accountGuardian].approvedStatus = "approved";
                yield Promise.all([guardian.save(), account.save()]);
                return res.status(200).json({ message: "added guardian successfully", data: account });
            }
        }
        else {
            return res.status(403).json({ message: "failed to add guardian", data: account });
        }
        return res.status(200).json({ message: `signer - ${signerAddress} has signed for approval of the guardian - ${guardianAddress}`, data: account });
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error while signing for approval of the guardian');
    }
});
exports.signForGuardianApproval = signForGuardianApproval;
// export const cancelGuardianApproval = async (req: Request, res: Response) => {
//     try {
//         const { guardianAddress, safeAddress, rejectedByAddress } = req.body;
//         const account = await Account.findOne({ accountAddress: safeAddress });
//         const guardian = await Guardian.findOne({ guardianAddress: guardianAddress });
//         console.log(guardian)
//         const findGuardian = account.accountGuardians.findIndex((f: any) => f.guardianAddress === guardianAddress)
//         console.log(findGuardian)
//         //rejection before final guardian approval
//         if (account.accountGuardians[findGuardian].approvedStatus === "approve-hold") {
//             guardian.rejectedBy = rejectedByAddress;
//             guardian.approvedStatus = "rejected";
//             guardian.approvalSignatures = [] as any;
//             await guardian.save();
//             account.accountGuardians[findGuardian].rejectedBy = rejectedByAddress;
//             account.accountGuardians[findGuardian].approvedStatus = "rejected";
//             const signatureIds = account.accountGuardians[findGuardian].approvalSignatures.map((s: any) => s._id);
//             await Signature.deleteMany({ _id: { $in: signatureIds } });
//             account.accountGuardians[findGuardian].approvalSignatures = [] as any;
//             await account.save();
//         }
//         else if (account.accountGuardians[findGuardian].approvedStatus === "approved") {
//             guardian.rejectedBy = rejectedByAddress;
//             guardian.approvedStatus = "reject-hold";
//             guardian.approvalSignatures = [] as any;
//             await guardian.save();
//             account.accountGuardians[findGuardian].rejectedBy = rejectedByAddress;
//             account.accountGuardians[findGuardian].approvedStatus = "reject-hold";
//             const signatureIds = account.accountGuardians[findGuardian].approvalSignatures.map((s: any) => s._id);
//             await Signature.deleteMany({ _id: { $in: signatureIds } });
//             account.accountGuardians[findGuardian].approvalSignatures = [] as any;
//             await account.save();
//         }
//         // guardian.approvedStatus = "rejected";
//         // guardian.rejectedBy = rejectedByAddress;
//         // guardian.approvalSignatures = [] as any;
//         // await guardian.save();
//         // account.accountGuardians[findGuardian].approvedStatus = "rejected";
//         // account.accountGuardians[findGuardian].rejectedBy = rejectedByAddress;
//         // const signatureIds = account.accountGuardians[findGuardian].approvalSignatures.map((s: any) => s._id);
//         // await Signature.deleteMany({ _id: { $in: signatureIds } });
//         // account.accountGuardians[findGuardian].approvalSignatures = [] as any;
//         // await account.save();
//         return res.status(200).send({ message: `rejected the guardian by signer - ${rejectedByAddress}` })
//     } catch (error) {
//         console.error(error);
//         return res.status(500).send('Internal Server Error while rejecting the guardian');
//     }
// }
const getApprovedGuardians = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // to get the approved guardians of a smart account
    try {
        const { safeAddress } = req.body;
        const account = yield model_1.Account.findOne({ accountAddress: safeAddress });
        if (!account) {
            res.status(403).send({ message: "Invalid safeAddress" });
        }
        // find the approved guardians of the smart account and send it to the clients
        const getGuardians = yield model_1.Guardian.find({ safeAddress: safeAddress, approvedStatus: "approved" });
        return res.status(200).send({ message: "Approved guardians found", data: getGuardians });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ data: "Internal Server Error while getting the approved guardians", error: error });
    }
});
exports.getApprovedGuardians = getApprovedGuardians;
const createNewRecovery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // create new recovery session.
    try {
        const { safeAddress, recoveryReason, initiatedBy } = req.body;
        const getAccount = yield model_1.Account.findOne({ accountAddress: safeAddress });
        const recoveryExist = yield model_1.Recovery.findOne({ associatedZKWallet: safeAddress, recoveryStatus: "ongoing" });
        console.log(recoveryExist);
        // if a recovery session exists in the smart account, then send the res to the client that they cannot start another session
        if (recoveryExist) {
            return res.status(403).send({ message: "ZKW already has a recovery session ONGOING, cannot start another recovery session", data: recoveryExist });
        }
        // generating a random recovery id.. (not really required.. can use mongodb document ids)
        const newRecoveryId = (0, utils_1.generateRandomID)();
        // console.log(newRecoveryId)
        // creating a new recovery item in the Recovery sessions db and saving it..
        const newZKWRecovery = new model_1.Recovery({
            recoveryId: newRecoveryId,
            recoveryReason: recoveryReason,
            associatedZKWallet: safeAddress,
            initiatedBy: initiatedBy,
            recoveryStatus: "ongoing"
        });
        yield newZKWRecovery.save();
        getAccount.recoveries.push(newZKWRecovery);
        yield getAccount.save();
        return res.status(200).send({ message: "Recovery session started!", data: newZKWRecovery });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Internal Server Error while creating a new recovery", error: error });
    }
});
exports.createNewRecovery = createNewRecovery;
const getRecoveries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // get recoveries of a smart account..
    try {
        const { safeAddress } = req.body;
        const getRecoveries = yield model_1.Recovery.find({ associatedZKWallet: safeAddress });
        return res.status(200).send({ message: "Recoveries found", data: getRecoveries });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Internal Server Error while fetching the safe's recoveries", error: error });
    }
});
exports.getRecoveries = getRecoveries;
const getRecoveryStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // to check whether any ongoing recovery sessions exists..
    try {
        const { safeAddress } = req.body;
        const recoveryExist = yield model_1.Recovery.findOne({ associatedZKWallet: safeAddress, recoveryStatus: "ongoing" });
        if (recoveryExist) {
            return res.status(200).send({ message: "EXISTS", data: recoveryExist });
        }
        return res.status(200).send({ message: "FREE" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Internal Server Error while checking recoveries status", error: error });
    }
});
exports.getRecoveryStatus = getRecoveryStatus;
const confirmRecoveryCall = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // confirm recovery call - called by the guardians after adding their new threshold and new owner(s) addresses. this function will call a finalize recovery after it hits the threshold no of confirm recovery calls
    try {
        const { safeAddress, guardianAddress, recoveryAddresses, newThreshold, recoveryId, scrAddress } = req.body;
        const getAccount = yield model_1.Account.findOne({ accountAddress: safeAddress });
        const getGuardian = yield model_1.Guardian.findOne({ safeAddress: safeAddress, guardianAddress: guardianAddress });
        const recoverySession = yield model_1.Recovery.findOne({ recoveryId: recoveryId });
        // three levels of validating the api call
        if (!getGuardian) {
            return res.status(403).send({ message: "Invalid Guardian Address" });
        }
        if (!recoverySession) {
            return res.status(403).send({ message: "Recovery Session doesn't exist. Please verify your recovery ID" });
        }
        if (recoverySession.recoveryStatus !== "ongoing") {
            return res.status(403).send({ message: "Recovery session already terminated or completed. Cannot make a confirm recovery call for this session" });
        }
        // gets the recovery index from collection in db
        const recoveryIndex = getAccount.recoveries.findIndex((e) => e.recoveryId === recoveryId);
        // checking if an approved guardian is making the call or not
        getAccount.accountGuardians.map((guardian) => {
            if (guardian.guardianAddress === guardianAddress) {
                if (guardian.approvedStatus !== "approved") {
                    return res.status(403).send({ message: "Call should be made by an approved guardian" });
                }
            }
        });
        // create new confirmRecovery entry and save it into the db
        const newRecovery = new model_1.ConfirmRecovery({
            guardianAssociated: guardianAddress,
            walletAssociated: safeAddress,
            recoveryAddresses: recoveryAddresses,
            newThresholdSet: newThreshold,
            executeFlag: true
        });
        yield newRecovery.save();
        // check if the guardian has already confirmed the recovery or not ..
        getAccount.recoveries[recoveryIndex].confirmedRecoveryList.map((cr) => {
            if (cr.guardianAssociated === guardianAddress) {
                return res.status(403).send({ message: "Guardian had already confirmed recovery for this recovery session", data: cr });
            }
        });
        // finally save it..
        recoverySession.confirmedRecoveryList.push(newRecovery);
        getAccount.recoveries[recoveryIndex].confirmedRecoveryList.push(newRecovery);
        yield Promise.all([recoverySession.save(), getAccount.save()]);
        // condition to check for finalizing the recovery..
        if (getAccount.accountGuardians.map((guardian) => guardian.approvedStatus === "approved").length === recoverySession.confirmedRecoveryList.length) {
            // setting up blockchain and contract connections
            const provider = new zksync_web3_1.Provider("https://zksync2-testnet.zksync.dev");
            const whale_pkey = process.env.PUBLIC_WHALE_PRIV_KEY;
            const whale_signer = new ethers_1.ethers.Wallet(whale_pkey, provider);
            const account = new ethers_1.ethers.Contract(scrAddress, exports_1.SCRABI, whale_signer);
            // direct contract call to finalize the recovery..
            let aaTx1 = yield account.finalizeRecovery(safeAddress);
            yield aaTx1.wait();
            console.log("recovery finalized");
            // updating the db accordingly..
            getAccount.owners = recoveryAddresses;
            getAccount.setThreshold = recoveryAddresses.length;
            getAccount.recoveries[recoveryIndex].recoveryStatus = "completed";
            recoverySession.recoveryStatus = "completed";
            yield Promise.all([recoverySession.save(), getAccount.save()]);
            console.log(aaTx1);
            return res.status(200).send({ message: `Confirm Recovery successfully called. Recovery successfully completed. New owners of ${safeAddress} - [${recoveryAddresses}]` });
        }
        return res.status(200).send({ message: "Confirm Recovery successfully called. Waiting for all guardians to confirm" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Internal Server Error while calling the confirm recovery", error: error });
    }
});
exports.confirmRecoveryCall = confirmRecoveryCall;
//# sourceMappingURL=accountController.js.map