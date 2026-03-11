import 'dotenv/config'
import  express from "express";
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

import connectDb from "./config/database.js";
import messageRoutes from "./routes/messageRoutes.js"
import groupRoutes from "./routes/groupRoutes.js"
import errorHandler from "./middlewares/errorHandler.js";

const app = express();
const server = http.createServer(app);
const prefixUri = '/api/v1';

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(`${prefixUri}/messages`, messageRoutes);
app.use(`${prefixUri}/groups`, groupRoutes);


app.use(errorHandler)

const PORT = process.env.PORT || 3000;
connectDb().then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})