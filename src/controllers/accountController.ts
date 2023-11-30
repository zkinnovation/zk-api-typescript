import { Wallet, ethers } from "ethers";
import { Account, Guardian, SCR, Signature } from "../db-models/model";
import { Request, Response } from "express"
import { SCRABI, TwoUserMultiSigABI } from "../exports";
import { EIP712Signer, Provider, types, utils } from "zksync-web3";
import { Types } from "mongoose";

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
            socialRecoveryModuleAddress: socialRecoveryModuleAddress,
            accountGuardians: []
        })
        const saveAccount = await newAccount.save();

        res.status(200).json({ message: "created safe", data: saveAccount })

    } catch (error) {
        console.log(error);
        res.status(500).send(`Internal Server Error during creation of new safe account - ${error}`);
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
            const signatureIds = account.socialRecoveryConfig.signatures.map((s: any) => s._id);
            await Signature.deleteMany({ _id: { $in: signatureIds } });
            console.log("deleted all signatures..")

            account.socialRecoveryConfig.signatures = [] as Types.DocumentArray<{
                signerAddress: string;
                signedDigest: string;
            }>;

            scr.signatures = [] as Types.DocumentArray<{
                signerAddress: string;
                signedDigest: string;
            }>;
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
    try {
        const { safeAddress, signature, signerAddress, scrAddress } = req.body;
        console.log(signerAddress, signature)
        const acc = await Account.findOne({ accountAddress: safeAddress });
        if (acc.socialRecoveryConfig.enabled === false) {
            return res.status(403).json({ message: "SCR IS DISABLED" })
        }
        const scr = await SCR.findOne({ smartAccount: safeAddress });
        const account = await Account.findOne({ accountAddress: safeAddress })
        const newSignature = new Signature({
            signerAddress: signerAddress,
            signedDigest: signature
        })
        scr.signatures.push(newSignature);
        account.socialRecoveryConfig.signatures.push(newSignature);

        await Promise.all([newSignature.save(), account.save(), scr.save()]);

        if (scr.signatures.length === account.setThreshold) {
            console.log(scr.signatures)
            const provider = new Provider("https://zksync2-testnet.zksync.dev");
            const wallet = new Wallet("0470b3a89b046cdca84671d3ad445f0ecdb7cfa82b5154df393260a28cabd2e2").connect(provider)
            const account = new ethers.Contract(safeAddress, TwoUserMultiSigABI, provider);
            let signedDigestsByOwners = [];
            for (let i = 0; i < scr.signatures.length; i++) {
                signedDigestsByOwners.push(scr.signatures[i].signedDigest);
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
    } catch (error) {
        console.log(error)
        res.status(500).send('Internal Server Error while signing the scr txn');
    }

}

export const addGuardian = async (req: Request, res: Response) => {
    try {
        const { safeAddress, assignedBy, guardianAddress, currentSetThreshold } = req.body;
        const findGuardianAccount = await Account.findOne({ accountAddress: guardianAddress });
        if (!findGuardianAccount) {
            return res.status(403).send({ message: "INVALID Guardian Address or Guardian smart account not found..." })
        }
        const account = await Account.findOne({ accountAddress: safeAddress });
        const newGuardian = new Guardian({
            safeAddress: safeAddress,
            assignedBy: assignedBy,
            guardianAddress: guardianAddress,
            currentSetThreshold: currentSetThreshold
        });
        const saveGuardian = await newGuardian.save();
        account.accountGuardians.push(newGuardian)
        await account.save();
        return res.status(200).json({ message: "added guardian", data: saveGuardian })
    } catch (error) {
        console.log(error)
        res.status(500).send('Internal Server Error while adding the guardian');
    }
}

export const signForGuardianApproval = async (req: Request, res: Response) => {
    try {
        const { signedDigest, signerAddress, safeAddress, guardianAddress } = req.body;
        const account = await Account.findOne({ accountAddress: safeAddress });
        const guardian = await Guardian.findOne({ guardianAddress: guardianAddress });
        const accountGuardian = account.accountGuardians.findIndex((e) => e.guardianAddress === guardianAddress)
        if (!account.socialRecoveryConfig.enabled) {
            return res.status(403).send({ message: "Social recovery not enabled for this smart account" })
        }
        if (account.accountGuardians[accountGuardian].approvalSignatures.length < account.setThreshold) {
            const signature = new Signature({
                signerAddres: signerAddress,
                signedDigest: signedDigest
            });
            await signature.save()
            guardian.approvalSignatures.push(signature)
            await guardian.save()
            account.accountGuardians[accountGuardian].approvalSignatures.push(signature)
            await account.save();

            if (account.accountGuardians[accountGuardian].approvalSignatures.length === account.setThreshold) {
                const provider = new Provider("https://zksync2-testnet.zksync.dev");
                const scrContract = new ethers.Contract(account.socialRecoveryModuleAddress, SCRABI, provider)
                let guardianCall = await scrContract.populateTransaction.addGuardianWithThreshold(account.accountAddress, guardianAddress, account.accountGuardians[accountGuardian].currentSetThreshold);
                let signedDigestsByOwners = [];
                for (let i = 0; i < guardian.approvalSignatures.length; i++) {
                    signedDigestsByOwners.push(guardian.approvalSignatures[i].signedDigest);
                }
                const concatenatedSignatures = ethers.utils.concat(signedDigestsByOwners);
                guardianCall = {
                    ...guardianCall,
                    from: account.accountAddress,
                    chainId: (await provider.getNetwork()).chainId,
                    nonce: await provider.getTransactionCount(safeAddress),
                    type: 113,
                    customData: {
                        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                        // paymasterParams: paymasterParams,
                    } as types.Eip712Meta,
                    value: ethers.BigNumber.from(0),
                };
                guardianCall.gasPrice = await provider.getGasPrice();
                guardianCall.gasLimit = ethers.BigNumber.from(2000000);
                guardianCall.customData = {
                    ...guardianCall.customData,
                    customSignature: concatenatedSignatures,
                } as types.Eip712Meta;
                console.log(guardianCall)
                const sentTx = await provider.sendTransaction(utils.serialize(guardianCall));
                await sentTx.wait();
                console.log("addGuardianWithThreshold successfully called")
                return res.status(200).json({ message: `signer - ${signerAddress} has signed for approval of the guardian - ${guardianAddress} and addGuardianWithThreshold function has been executed SUCCESSFULLY upon receiving the threshold limit of signatures!!`, data: account })
            }
        } else {
            return res.status(403).json({ message: `failed to signForApproval either because the transaction is completed with the required number of signatures that satisfies the threshold limit, current number of signatures - ${account.accountGuardians[accountGuardian].approvalSignatures.length}`, data: account })
        }


        return res.status(200).json({ message: `signer - ${signerAddress} has signed for approval of the guardian - ${guardianAddress}`, data: account })
    } catch (error) {
        res.status(500).send('Internal Server Error while signing for approval of the guardian');
    }
}

export const cancelGuardianApproval = async (req: Request, res: Response) => {
    try {
        const { guardianAddress, safeAddress, rejectedByAddress } = req.body;
        const account = await Account.findOne({ accountAddress: safeAddress });
        const guardian = await Guardian.findOne({ guardianAddress: guardianAddress });

        const findGuardian = account.accountGuardians.findIndex((f: any) => f === guardian)

        guardian.approvedStatus = "rejected";
        guardian.rejectedBy = rejectedByAddress;
        guardian.approvalSignatures = [] as any;
        await guardian.save();

        account.accountGuardians[findGuardian].approvedStatus = "rejected";
        account.accountGuardians[findGuardian].rejectedBy = rejectedByAddress;

        const signatureIds = account.accountGuardians[findGuardian].approvalSignatures.map((s: any) => s._id);
        await Signature.deleteMany({ _id: { $in: signatureIds } });

        account.accountGuardians[findGuardian].approvalSignatures = [] as any;
        await account.save();

        return res.status(200).send({ message: `rejected the guardian by signer - ${rejectedByAddress}` })

    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error while rejecting the guardian');
    }
}
