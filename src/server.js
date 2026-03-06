import 'dotenv/config'
import  express from "express";
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

import connectDb from "./config/database.js";
import messageRoutes from "./routes/messageRoutes.js"
import errorHandler from "./middlewares/errorHandler.js";

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/messages', messageRoutes);



app.use(errorHandler)

const PORT = process.env.PORT || 3000;
connectDb().then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})