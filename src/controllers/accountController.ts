import asyncHandler from "express-async-handler";
import { Account } from "../db-models/model";
import { Request, Response } from "express"

export const getAccounts = asyncHandler(async (req: Request, res: Response) => {
    try {
        const safeAccounts = await Account.find({});
        res.status(200).json(safeAccounts)
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error")
    }

});

export const createSafe = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { accountAddress, accountName, setThreshold, owners, network } = req.body;
        const newAccount = new Account({
            accountAddress,
            accountName,
            setThreshold,
            owners,
            transactions: [],
            network
        })

        const saveAccount = await newAccount.save();
        res.json(saveAccount);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error during creation of new safe account');
    }
})
module.exports = { getAccounts, createSafe }