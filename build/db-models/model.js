"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Guardian = exports.SCR = exports.Signature = exports.Transaction = exports.Account = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const signatureSchema = new mongoose_1.default.Schema({
    signerAddress: {
        type: String,
        required: true
    },
    signedDigest: {
        type: String,
        required: true
    },
});
const socialRecoverySchema = new mongoose_1.default.Schema({
    smartAccount: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        required: true
    },
    enabledBy: {
        type: String,
    },
    signatures: {
        type: [signatureSchema]
    },
});
const transactionSchema = new mongoose_1.default.Schema({
    transactionType: {
        type: String,
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
    paymaster: {
        type: Boolean,
        required: true
    }
});
const guardianSchema = new mongoose_1.default.Schema({
    safeAddress: {
        type: String,
        required: true
    },
    assignedBy: {
        type: String,
        required: true
    },
    guardianAddress: {
        type: String,
        required: true
    },
    approvalSignatures: {
        type: [signatureSchema],
        default: []
    },
    approvedStatus: {
        type: String,
        default: "hold",
        required: true
    },
    rejectedBy: {
        type: String,
    },
    currentSetThreshold: {
        type: Number,
        required: true
    },
    assignedAt: {
        type: Date,
        default: Date.now
    }
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
    },
    socialRecoveryConfig: {
        type: socialRecoverySchema,
        required: true
    },
    socialRecoveryModuleAddress: {
        type: String,
        required: true
    },
    accountGuardians: {
        type: [guardianSchema]
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});
// Define the models based on the schemas
exports.Account = mongoose_1.default.model('Account', accountSchema);
exports.Transaction = mongoose_1.default.model('Transaction', transactionSchema);
exports.Signature = mongoose_1.default.model('Signature', signatureSchema);
exports.SCR = mongoose_1.default.model('SCR', socialRecoverySchema);
exports.Guardian = mongoose_1.default.model('Guardian', guardianSchema);
//# sourceMappingURL=model.js.map