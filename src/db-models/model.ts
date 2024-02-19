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

const confirmRecoverySchema = new mongoose.Schema({
    guardianAssociated: {
        type: String,
        required: true
    },
    walletAssociated: {
        type: String,
        required: true
    },
    recoveryAddresses: {
        type: [String],
        required: true
    },
    newThresholdSet: {
        type: Number, // new threshold of the smart wallet
        required: true
    },
    executeFlag: {
        type: Boolean,
        required: true
    }
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
    currentSetAccountThreshold: {
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
    guardianType: {
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
        default: "hold", // approved, rejected, approve-hold, reject-hold
        required: true
    },
    rejectedBy: {
        type: String,
        default: ""
    },
    currentSetThreshold: {
        type: Number,
        required: true
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },

});

const recoverySchema = new mongoose.Schema({
    recoveryId: {
        type: String,
        required: true
    },
    recoveryReason: {
        type: String,
        default: ""
    },
    associatedZKWallet: {
        type: String, // address of the zkw
        required: true
    },
    initiatedBy: {
        type: String, // guardian address
        required: true
    },
    confirmedRecoveryList: {
        type: [confirmRecoverySchema],
        default: [] // take the data of the confirm recovery calls into this
    },
    recoveryStatus: {
        type: String, // ongoing, killed, completed
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
    recoveries: {
        type: [recoverySchema],
        default: []
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
export const ConfirmRecovery = mongoose.model('ConfirmRecovery', confirmRecoverySchema);
export const Recovery = mongoose.model('Recovery', recoverySchema);

