import mongoose, { Types } from 'mongoose';

const signatureSchema = new mongoose.Schema({
    signerAddress: {
        type: String,
        required: true
    },
    signedDigest: {
        type: String,
        required: true
    },

})

const socialRecoverySchema = new mongoose.Schema({
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

})

const transactionSchema = new mongoose.Schema({
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

const guardianSchema = new mongoose.Schema({
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
        default: "hold", // approved, rejected, hold
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

})

const accountSchema = new mongoose.Schema({
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
export const Account = mongoose.model('Account', accountSchema);
export const Transaction = mongoose.model('Transaction', transactionSchema);
export const Signature = mongoose.model('Signature', signatureSchema);
export const SCR = mongoose.model('SCR', socialRecoverySchema);
export const Guardian = mongoose.model('Guardian', guardianSchema);

