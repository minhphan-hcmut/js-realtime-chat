import { Router } from "express";
import MessageController from "../controllers/messageController.js";

const router = Router();

router.post('/send', MessageController.sendMessage);
router.get('/list', MessageController.listMessage);
router.post('/clear', MessageController.clearHistory);
router.post('/delete', MessageController.deleteForMe);


export default router;