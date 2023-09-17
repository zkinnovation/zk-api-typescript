"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const txnController_1 = require("../controllers/txnController");
const router = express_1.default.Router();
router.route('/createTxn').post(txnController_1.createTxn);
router.route('/:safeAddress').get(txnController_1.getTxnsBySafeAddress);
router.route('/signTxn').post(txnController_1.signTxn);
router.route('/getTxHash').post(txnController_1.getSignedTxnHash);
exports.default = router;
//# sourceMappingURL=transactionRoutes.js.map