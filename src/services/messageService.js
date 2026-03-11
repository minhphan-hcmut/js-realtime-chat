import getMessageModel from "../models/Message.js";
import Group from "../models/Group.js";
import Conversation from "../models/Conversation.js";

class MessageService {
    static async sendMessage({ channelId, senderUid, content, type = "text" }) {
        const MessageModel = getMessageModel(channelId);

        const MAX_RETRIES = 3;
        let message;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const lastMessage = await MessageModel.findOne({ channel_id:channelId }).sort({ message_seq: -1 }).select('message_seq').lean();
                // console.log(lastMessage.message_seq)
                const message_seq = (lastMessage?.message_seq || 0) + 1;
                console.log(`message sequence: ${message_seq}`)
                message = await MessageModel.create({
                    channel_id: channelId,
                    sender_uid: senderUid,
                    content,
                    type,
                    message_seq,
                });

                break;
            } catch (err) {
                if (err.code === 11000 && attempt < MAX_RETRIES - 1) {
                    continue;
                }
                console.log('HIHI')
                throw err;
            }
        }
        const group = await Group.findOne({ channel_id: channelId });
        if (!group) {
            const error = new Error(`Group with channelId ${channelId} not found`);
            error.statusCode = 404;
            throw error;
        }
        const memberUids = group.member_uids;

        const bulkOps = memberUids.map(uid => ({
            updateOne: {
                filter: { uid, channel_id: channelId },
                update: {
                    $inc: { unread_count: 1, version: 1 },
                    $set: { last_msg_seq: message.message_seq }
                },
                upsert: true,
            }
        }));
        await Conversation.bulkWrite(bulkOps)
        return {message, memberUids}

    }
}
export default MessageService;