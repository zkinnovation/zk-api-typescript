"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signature = exports.Transaction = exports.Account = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const signatureSchema = new mongoose_1.default.Schema({
    signerAddress: {
        type: String,
        required: true
    },
    signedDigest: {
        type: String,
        required: true
    }
});
const transactionSchema = new mongoose_1.default.Schema({
    transactionType: {
        type: String,
        required: true
    },
    requiredThreshold: {
        type: Number,
        required: true
    },
    currentSignCount: {
        type: Number,
        required: true
    },
    signedOwners: {
        type: [signatureSchema]
    },
    txnAmount: {
        type: Number,
        required: true
    },
    recipientAddress: {
        type: String,
        required: true
    },
});
const accountSchema = new mongoose_1.default.Schema({
    accountAddress: {
        type: String,
        required: true,
        ref: "Accounts",
        unique: true
    },
    accountName: {
        type: String,
        required: [true, "account name is required"]
    },
    setThreshold: {
        type: Number,
        required: [true, "signer threshold is required"]
    },
    owners: {
        type: [String],
        required: [true, "signers are required"]
    },
    transactions: {
        type: [transactionSchema]
    },
    network: {
        type: String,
        required: true
    }
});
// Define the models based on the schemas
exports.Account = mongoose_1.default.model('Account', accountSchema);
exports.Transaction = mongoose_1.default.model('Transaction', transactionSchema);
exports.Signature = mongoose_1.default.model('Signature', signatureSchema);
//# sourceMappingURL=model.js.map