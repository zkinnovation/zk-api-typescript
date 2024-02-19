import express from 'express';
import { checkSCRStatus, createSafe, toggleEnableDisableSocialRecovery, getAccounts, getAccount, getSCRTxnHash, signScrTxn, addGuardian, signForGuardianApproval, getGuardianApprovalHash, createNewRecovery, getRecoveryStatus, getRecoveries, getGuardians, confirmRecoveryCall } from '../controllers/accountController';

const router = express.Router();

router.route("/").get(getAccounts).post(createSafe);
router.route("/enableSCR").post(toggleEnableDisableSocialRecovery)
router.route("/checkSCR").post(checkSCRStatus)
router.route("/getAccount/:accountAddress").get(getAccount);
router.route("/getTxnHash").post(getSCRTxnHash)
router.route("/signSCRTxn").post(signScrTxn)
router.route("/addGuardian").post(addGuardian)
router.route("/getGuardians").get(getGuardians)
router.route("/signForGuardianApproval").post(signForGuardianApproval)
router.route("/getGuardianCallHash").post(getGuardianApprovalHash)
router.route("/createRecoverySession").post(createNewRecovery)
router.route("/getRecoveryStatus").post(getRecoveryStatus)
router.route("/getRecoveries").post(getRecoveries)
router.route("/confirmRecovery").post(confirmRecoveryCall)
// router.route("/cancelGuardian").post(cancelGuardianApproval)

export default router;