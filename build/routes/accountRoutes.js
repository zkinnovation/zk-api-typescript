"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const accountController_1 = require("../controllers/accountController");
const router = express_1.default.Router();
router.route("/").get(accountController_1.getAccounts).post(accountController_1.createSafe);
router.route("/enableSCR").post(accountController_1.toggleEnableDisableSocialRecovery);
router.route("/checkSCR").post(accountController_1.checkSCRStatus);
router.route("/getAccount/:accountAddress").get(accountController_1.getAccount);
router.route("/getTxnHash").post(accountController_1.getSCRTxnHash);
router.route("/signSCRTxn").post(accountController_1.signScrTxn);
router.route("/addGuardian").post(accountController_1.addGuardian);
router.route("/getGuardians").get(accountController_1.getGuardians);
router.route("/signForGuardianApproval").post(accountController_1.signForGuardianApproval);
router.route("/getGuardianCallHash").post(accountController_1.getGuardianApprovalHash);
router.route("/createRecoverySession").post(accountController_1.createNewRecovery);
router.route("/getRecoveryStatus").post(accountController_1.getRecoveryStatus);
router.route("/getRecoveries").post(accountController_1.getRecoveries);
router.route("/confirmRecovery").post(accountController_1.confirmRecoveryCall);
// router.route("/cancelGuardian").post(cancelGuardianApproval)
exports.default = router;
//# sourceMappingURL=accountRoutes.js.map