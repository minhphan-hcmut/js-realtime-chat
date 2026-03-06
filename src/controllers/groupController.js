
import GroupService from "../services/groupService.js";

class GroupController {
    static async createGroup(req, res, next) {
        try {
            const { channelId, name, ownerUid } = req.body;
            const group = await GroupService.createGroup({channelId, name, ownerUid})
            res.status(201).json({ success: true, data: group });
        } catch (err) {
            next(err);
        }
    }
    static async joinGroup(req, res, next) {
        try { 
            const { } = req.body;
            const 
        }
        catch (err) {
            next(err)
        }
    }
    static async listGroup(req, res, next) {

    }
}

export default GroupController;