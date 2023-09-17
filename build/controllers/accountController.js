"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSafe = exports.getAccounts = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const model_1 = require("../db-models/model");
exports.getAccounts = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const safeAccounts = yield model_1.Account.find({});
        res.status(200).json(safeAccounts);
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
    }
}));
exports.createSafe = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accountAddress, accountName, setThreshold, owners, network } = req.body;
        const newAccount = new model_1.Account({
            accountAddress,
            accountName,
            setThreshold,
            owners,
            transactions: [],
            network
        });
        const saveAccount = yield newAccount.save();
        res.json(saveAccount);
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error during creation of new safe account');
    }
}));
module.exports = { getAccounts: exports.getAccounts, createSafe: exports.createSafe };
//# sourceMappingURL=accountController.js.map