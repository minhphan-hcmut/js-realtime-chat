import 'dotenv/config'
import  express from "express";
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

import connectDb from "./config/database.js";
import messageRoutes from "./routes/messageRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import { register, unregister } from './websockets/socketManager.js';
import logger from './utils/logger.js'

const app = express();
const server = http.createServer(app);
const prefixUri = '/api/v1';
const HEARTBEAT_INTERVAL = 30000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(`${prefixUri}/messages`, messageRoutes);
app.use(`${prefixUri}/groups`, groupRoutes);
app.use(`${prefixUri}/conversations`, conversationRoutes)


app.use(errorHandler)

const wss = new WebSocketServer({ server });
wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const uid = url.searchParams.get('uid');
    if (!uid) {
        ws.close(4001, 'Missing uid'); return;
    }
    register(uid, ws);
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
    })
    
    ws.on('close', () => unregister(uid, ws));
    // ws.on('message', (data) => console.log(`[WS] Message from ${uid}:`, data.toString()));

    ws.on('message', (data) => logger.info('WS', ` Message from ${uid}:`, data.toString()));
})
const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
    });
}, HEARTBEAT_INTERVAL);
wss.on('close', () => {
    clearInterval(heartbeatInterval);
})

const PORT = process.env.PORT || 3000;
connectDb().then(() => {
    server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
})