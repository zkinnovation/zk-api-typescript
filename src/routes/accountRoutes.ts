import express from 'express';
import { createSafe, getAccounts } from '../controllers/accountController';

const router = express.Router();

router.route("/").get(getAccounts).post(createSafe);

export default router;