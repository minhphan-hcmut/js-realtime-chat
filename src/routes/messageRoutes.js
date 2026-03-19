import { Router } from "express";
import MessageController from "../controllers/messageController.js";
import { validateBody, validateQuery } from "../middlewares/validator.js";
import {
    sendMessageSchema,
    listMessagesSchema,
    clearHistorySchema,
    deleteForMeSchema,
    listMessageSchema,
} from '../validators/schemas.js';


const router = Router();

router.post('/send', validateBody(sendMessageSchema),MessageController.sendMessage);
router.get('/list', validateQuery(listMessageSchema),MessageController.listMessages);
router.post('/clear', validateQuery(clearHistorySchema),MessageController.clearHistory);
router.post('/delete', validateBody(deleteForMeSchema),MessageController.deleteForMe);


export default router;