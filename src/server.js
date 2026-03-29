import "dotenv/config";
import express from "express";
import cors from "cors";
import http, { request } from "http";
import { WebSocketServer } from "ws";
import { parse } from "url";
import jwt from 'jsonwebtoken'

import connectDb from "./config/database.js";
import messageRoutes from "./routes/messageRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import { connectRedis } from "./config/redis.js";
import { register, unregister } from "./websockets/socketManager.js";
import logger from "./utils/logger.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import config from "./config/index.js";



const app = express();
const server = http.createServer(app);
const prefixUri = "/api/v1";
const HEARTBEAT_INTERVAL = 30000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use(`${prefixUri}/messages`, authMiddleware, messageRoutes);
app.use(`${prefixUri}/groups`, authMiddleware, groupRoutes);
app.use(`${prefixUri}/conversations`, authMiddleware, conversationRoutes)
app.use(`${prefixUri}/auth`, authRoutes);



app.use(errorHandler);

const wss = new WebSocketServer({ noServer: true });


server.on("upgrade", (request, socket, head) => {
  const { pathname, query } = parse(request.url, true);
  const token = query.token;
  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }
  jwt.verify(token, config.jwt_access_secret, (err, decoded) => {
    if (err) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    request.user = decoded;
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
});


wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  //   const uid = url.searchParams.get("uid");
  const uid = req.user.uid;
  if (!uid) {
    ws.close(4001, "Missing uid");
    return;
  }
  register(uid, ws);
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("close", () => unregister(uid, ws));
  // ws.on('message', (data) => console.log(`[WS] Message from ${uid}:`, data.toString()));

  ws.on("message", (data) =>
    logger.info("WS", ` Message from ${uid}:`, data.toString()),
  );
});

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

wss.on("close", () => {
  clearInterval(heartbeatInterval);
});

const PORT = process.env.PORT || 3000;
Promise.all([connectDb(), connectRedis()]).then(() => {
  server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
});
