import express from 'express';
import { checkSCRStatus, createSafe, toggleEnableDisableSocialRecovery, getAccounts, getAccount, getSCRTxnHash, signScrTxn } from '../controllers/accountController';

const router = express.Router();

router.route("/").get(getAccounts).post(createSafe);
router.route("/enableSCR").post(toggleEnableDisableSocialRecovery)
router.route("/checkSCR").post(checkSCRStatus)
router.route("/:accountAddress").get(getAccount);
router.route("/getTxnHash").post(getSCRTxnHash)
router.route("/signSCRTxn").post(signScrTxn)

export default router;