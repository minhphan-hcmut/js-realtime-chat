import Group from '../models/Group.js';
import Conversation from '../models/Conversation.js'


class GroupService {
    static async createGroup({ channelId, name, ownerUid }) {
        const group = await Group.create({
            channel_id: channelId,
            name,
            owner_uid: ownerUid,
            member_uids: [ownerUid],
        });
        const conversation = await Conversation.create({
            uid: ownerUid,
            channel_id: channelId
        });
        return group;
    }
    static async joinGroup({ channelId, uid }) {
        const group = await Group.findOneAndUpdate(
            { channel_id: channelId },
            { $addToSet: { member_uids: uid } },
            {new: true}
        )
        if (!group) {
            const error = new Error(`Group with channelId "${channelId}" not found`);
            error.statusCode = 404;
        }
        await Conversation.updateOne({ uid, channel_id: channelId }, { $setOnInsert: { uid, channel_id: channelId, } } , { upsert: true });
        return group;
    }
    static async listGroups({ uid }) {
        const groups = await Group.find({ member_uids: uid }).lean();
        return groups;
    }
}


export default GroupService;