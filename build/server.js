"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const accountRoutes_1 = __importDefault(require("./routes/accountRoutes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
//app setup
const app = (0, express_1.default)();
const port = process.env.PORT || 8001;
const connection_url = "mongodb+srv://appskans2017:8RXeQcdCjMmqIBTT@cluster0.oacodo4.mongodb.net/zkapidb?retryWrites=true&w=majority";
// middleware 
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// DB Config
mongoose_1.default.connect(connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
// API Endpoints
app.use('/api/account', accountRoutes_1.default);
app.use('/api/txn', transactionRoutes_1.default);
app.listen(port, () => {
    console.log(`Server started. Listening to port - ${port}`);
});
//# sourceMappingURL=server.js.map