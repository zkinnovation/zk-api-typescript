import { Wallet, ethers } from "ethers";
import { Account, SCR } from "../db-models/model";
import { Request, Response } from "express"
import { TwoUserMultiSigABI } from "../exports";
import { EIP712Signer, Provider, types, utils } from "zksync-web3";

export const getAccounts = async (req: Request, res: Response) => {
    try {
        const safeAccounts = await Account.find({});
        res.status(200).json(safeAccounts)
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error")
    }

};

export const getAccount = async (req: Request, res: Response) => {
    try {
        const { accountAddress } = req.params;
        const account = await Account.findOne({ accountAddress: accountAddress });
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }
        return res.status(200).json(account)
    } catch (error) {
        res.status(500).send('Internal Server Error during fetch of the account');

    }
}

export const createSafe = async (req: Request, res: Response) => {
    try {
        const { accountAddress, accountName, setThreshold, owners, network, socialRecoveryModuleAddress } = req.body;

        const scrConfig = new SCR({
            smartAccount: accountAddress,
            enabled: false,
        })

        await scrConfig.save();

        const newAccount = new Account({
            accountAddress,
            accountName,
            setThreshold,
            owners,
            transactions: [],
            network,
            socialRecoveryConfig: scrConfig,
            socialRecoveryModuleAddress: socialRecoveryModuleAddress
        })

        const saveAccount = await newAccount.save();
        res.json(saveAccount);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error during creation of new safe account');
    }
}

export const toggleEnableDisableSocialRecovery = async (req: Request, res: Response) => {
    try {
        const { accountAddress, activatedBy, value } = req.body;
        const account = await Account.findOne({ accountAddress: accountAddress }).exec();

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        account.socialRecoveryConfig.enabled = value;
        account.socialRecoveryConfig.enabledBy = activatedBy;

        const scr = await SCR.findOne({ smartAccount: account.accountAddress });
        scr.enabled = value;
        scr.enabledBy = activatedBy;

        if (value === false) {
            account.socialRecoveryConfig.signatures = [];
            scr.signatures = [];
            account.socialRecoveryConfig.signedBy = [];
            scr.signedBy = [];
        }

        await Promise.all([account.save(), scr.save()]);

        res.status(200).json({ action: value === true ? "Enable" : "Disable", actionDoneBy: activatedBy });

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error while enabling/disabling SCR');
    }
}


export const checkSCRStatus = async (req: Request, res: Response) => {
    try {
        const { accountAddress } = req.body;
        const scr = await SCR.findOne({ smartAccount: accountAddress });
        if (!scr) {
            res.status(401).json({ message: "ERR: Invalid Req params - NO such scr" })
        }
        if (scr.enabled === true) {
            res.status(200).json(scr)
        } else {
            res.status(200).json(scr)
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error while retrieving the SCR Status');
    }
}

export const getSCRTxnHash = async (req: Request, res: Response) => {
    try {
        const { safeAddress, scrmAddress } = req.body;
        console.log(scrmAddress)
        const acc = await Account.findOne({ accountAddress: safeAddress });
        if (acc.socialRecoveryConfig.enabled === false) {
            return res.status(403).json({ message: "SCR IS DISABLED" })
        }
        const provider = new Provider("https://zksync2-testnet.zksync.dev");

        const wallet = new Wallet("0470b3a89b046cdca84671d3ad445f0ecdb7cfa82b5154df393260a28cabd2e2").connect(provider)
        const account = new ethers.Contract(safeAddress, TwoUserMultiSigABI, provider);

        let aaTx = await account.populateTransaction.enableModule(scrmAddress);
        aaTx = {
            ...aaTx,
            // deploy a new account using the multisig
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
        aaTx.gasPrice = await provider.getGasPrice();
        aaTx.gasLimit = ethers.BigNumber.from(200000);
        const signedTxHash = EIP712Signer.getSignedDigest(aaTx);
        return res.status(200).json({ scrTxnHash: signedTxHash });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error while retrieving the SCR Status');
    }
}

export const signScrTxn = async (req: Request, res: Response) => {
    const { safeAddress, signature, signerAddress, scrAddress } = req.body;
    console.log(scrAddress)
    const acc = await Account.findOne({ accountAddress: safeAddress });
    if (acc.socialRecoveryConfig.enabled === false) {
        return res.status(403).json({ message: "SCR IS DISABLED" })
    }
    const scr = await SCR.findOne({ smartAccount: safeAddress });
    const account = await Account.findOne({ accountAddress: safeAddress })

    scr.signedBy.push(signerAddress);
    scr.signatures.push(signature);
    account.socialRecoveryConfig.signedBy.push(signerAddress);
    account.socialRecoveryConfig.signatures.push(signature);

    await Promise.all([account.save(), scr.save()]);

    if (scr.signedBy.length === account.setThreshold) {
        console.log(scr.signatures)
        const provider = new Provider("https://zksync2-testnet.zksync.dev");
        const wallet = new Wallet("0470b3a89b046cdca84671d3ad445f0ecdb7cfa82b5154df393260a28cabd2e2").connect(provider)
        const account = new ethers.Contract(safeAddress, TwoUserMultiSigABI, provider);
        let signedDigestsByOwners = [];
        for (let i = 0; i < scr.signatures.length; i++) {
            signedDigestsByOwners.push(scr.signatures[i]);
        }
        const concatenatedSignatures = ethers.utils.concat(signedDigestsByOwners);
        let aaTx = await account.populateTransaction.enableModule(scrAddress);
        aaTx = {
            ...aaTx,
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
        aaTx.gasPrice = await provider.getGasPrice();
        aaTx.gasLimit = ethers.BigNumber.from(200000);
        aaTx.customData = {
            ...aaTx.customData,
            customSignature: concatenatedSignatures,
        };
        console.log(aaTx)
        const sentTx = await provider.sendTransaction(utils.serialize(aaTx));
        await sentTx.wait();
        console.log("addedmodule in account")
        return res.status(200).json({ message: "successfully enabled scr module!!" })
    }
    return res.status(200).json({ message: "signed enable module txn" })
}
