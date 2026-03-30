import mongoose from "mongoose";
import Group from "../models/Group.js";
import getMessageModel from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import ChannelOffset from "../models/ChannelOffset.js";
import MessageExtra from "../models/MessageExtra.js";

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
    static async clearHistory({ uid, channelId }) {
        const MessageModel = getMessageModel(channelId);
        const latestMsg = await MessageModel.findOne({ channel_id: channelId }).sort({ message_seq: -1 }).select('message_seq').lean();

        if (!latestMsg) return null;

        //save and update offset
        //upsert: create new if it doesn't have.
        const offset = await ChannelOffset.findOneAndUpdate(
            { uid, channel_id: channelId },
            { offset_msg_seq: latestMsg.message_seq },
            {upsert: true, returnDocument: 'after'}
        )
        return offset;
    }
    static async deleteForMe({ uid, messageId }) {
        const extra = await MessageExtra.findOneAndUpdate(
            { message_id: messageId, 
            uid: uid },
            { is_deleted: true },
            { upsert: true, returnDocument: 'after'}
        ).lean();
      return extra;
    }

    static async getMessages({ uid, channelId, limit = 50, startSeq = null }) {
        const offset = await ChannelOffset.findOne({ uid, channel_id: channelId }).lean();
        const offsetSeq = offset?.offset_msg_seq || 0;

        const deletedExtras = await MessageExtra.find({ uid, is_deleted: true }).lean();
        // console.log(deletedExtras)
        const deletedMsgIds = deletedExtras.map(e => new mongoose.Types.ObjectId(e.message_id));
        // console.log(deletedMsgIds)

        const MessageModel = getMessageModel(channelId);
        // console.log(MessageModel);
        // console.log(channelId);
        const fromSeq = startSeq || offsetSeq;

        const query = {
            channel_id: channelId,
            message_seq: { $gt: fromSeq },
        };
        const validDeletedIds = deletedMsgIds.filter(id => id && id !== "null");

        if (validDeletedIds.length > 0) {
            query._id = { $nin: validDeletedIds };
        }

        const messages = await MessageModel.find(query).sort({ message_seq: 1 }).limit(limit).lean();
        return messages;
    }
  
}
export default MessageService;
