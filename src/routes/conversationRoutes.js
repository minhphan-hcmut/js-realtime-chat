import { Router } from 'express';
import ConversationController from '../controllers/conversationController.js'


const router = Router();

router.post('/sync', ConversationController.syncConversations);
router.post('/mark-read', ConversationController.markAsRead);

export default router;