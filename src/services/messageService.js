import getMessageModel from "../models/Message.js";
import Group from "../models/Group.js";
import Conversation from "../models/Conversation.js";

class MessageService {
    constructor() {
    }
    static async sendMessage({ channelId, senderUid, content, type = "text" }) {
        const MessageModel = getMessageModel(channelId);

        const count = await MessageModel.countDocuments({ channel_id: channelId});
        const message_seq = count + 1

        const message = await MessageModel.create({
            channel_id: channelId,
            sender_uid: senderUid,
            content,
            type,
            message_seq
        })

        const group = await Group.findOne({ channel_id: channelId })
        const memberUids = group.member_uids;
        const bulkOps = memberUids.map(uid => ({
            updateOne: {
                filter: { uid, channel_id: channelId },
                update: {
                    $inc: { unread_count: 1, version: 1 },
                    $set: {last_msg_seq: message_seq}
                },
                upsert: true
            }
        }))
        await Conversation.bulkWrite(bulkOps)
        return {message, memberUids} // return memberUids to broadcast
    }
}
export default MessageService;