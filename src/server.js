import connectDb from "./config/database.js";
import messageRoutes from "./routes/messageRoutes.js"
import { configDotenv } from "dotenv";
import  express from "express";
import cors from 'cors';

const app = express()
configDotenv()
const { PORT } = process.env;
try {
    app.use(cors());
    app.use(express.json());
    app.get('/health', function (req, res, next) {
        res.json({status: "OK"})
    })
    app.use('/api/v1/messages', messageRoutes)
    connectDb();
    app.listen(PORT);
    console.log(`app listern on port ${PORT}`)
}
catch (err){
    console.log(err);
    process.exit(1);
}
