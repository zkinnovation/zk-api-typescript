import express from 'express';
import { createTxn, getTxnsBySafeAddress, signTxn, getSignedTxnHash } from '../controllers/txnController';
const router = express.Router();

router.route('/createTxn').post(createTxn)
router.route('/:safeAddress').get(getTxnsBySafeAddress);
router.route('/signTxn').post(signTxn)
router.route('/getTxHash').post(getSignedTxnHash)


export default router