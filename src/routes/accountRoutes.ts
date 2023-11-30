import express from 'express';
import { checkSCRStatus, createSafe, toggleEnableDisableSocialRecovery, getAccounts, getAccount, getSCRTxnHash, signScrTxn, addGuardian, signForGuardianApproval } from '../controllers/accountController';

const router = express.Router();

router.route("/").get(getAccounts).post(createSafe);
router.route("/enableSCR").post(toggleEnableDisableSocialRecovery)
router.route("/checkSCR").post(checkSCRStatus)
router.route("/:accountAddress").get(getAccount);
router.route("/getTxnHash").post(getSCRTxnHash)
router.route("/signSCRTxn").post(signScrTxn)
router.route("/addGuardian").post(addGuardian)
router.route("/signForGuardianApproval").post(signForGuardianApproval)

export default router;