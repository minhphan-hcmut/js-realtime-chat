import { Router } from 'express';
import GroupController from '../controllers/groupController.js';

const router = Router();

router.post('/create', GroupController.createGroup);
router.post('/join', GroupController.joinGroup)
router.get('/list', GroupController.listGroups);

export default router;
