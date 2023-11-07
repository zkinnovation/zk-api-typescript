import express from 'express';
import Cors from 'cors';
import mongoose from 'mongoose';
import accountRoutes from "./routes/accountRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import * as dotenv from "dotenv"

dotenv.config()
//app setup
const app = express();
const port = process.env.PORT || 8001;
const connection_url = process.env.MONGODB_URL;

// middleware 
app.use(express.json());
app.use(Cors());

// DB Config
mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
} as any);
// API Endpoints
app.use('/api/account', accountRoutes);
app.use('/api/txn', transactionRoutes);

app.listen(port, () => {
    console.log(`Server started. Listening to port - ${port}`);
});
