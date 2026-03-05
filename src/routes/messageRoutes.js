import { Router } from "express";
import MessageController from "../controllers/messageController.js";

const router = Router();

router.post('/send', MessageController.sendMessage)



export default router;