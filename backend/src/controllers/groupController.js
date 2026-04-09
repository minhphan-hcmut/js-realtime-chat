import GroupService from "../services/groupService.js";

class GroupController {
  static async createGroup(req, res, next) {
    try {
      const { channelId, name, ownerUid } = req.body;
      const group = await GroupService.createGroup({
        channelId,
        name,
        ownerUid,
      });
      return res.status(201).json({ success: true, data: group });
    } catch (err) {
      return next(err);
    }
  }
  static async joinGroup(req, res, next) {
    try {
      const { channelId, uid } = req.body;
      const group = await GroupService.joinGroup({ channelId, uid });
      return res.status(201).json({ success: true, data: group });
    } catch (err) {
      return next(err);
    }
  }
  static async listGroups(req, res, next) {
    try {
      const { uid } = req.query;
      const groups = await GroupService.listGroups({ uid });
      return res.status(201).json({ success: true, data: groups });
    } catch (err) {
      return next(err);
    }
  }
}

export default GroupController;
