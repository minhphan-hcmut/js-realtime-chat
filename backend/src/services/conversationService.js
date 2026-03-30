import Conversation  from "../models/Conversation.js";
import { broadcastToChannel } from "../websockets/socketManager.js";


class ConversationService {
    static async syncConversations({ uid, clientVersion }) {
        const query = {
            uid,
            version: { $gt: clientVersion }
        }
        const conversations = await Conversation.find(query).lean();
        const maxVersion = conversations.reduce((acc, el) => {
            Math.max(acc, el.version), clientVersion
        })
        return { conversations, maxVersion };
    }
    static async markAsRead({ uid, channelId }) {
        const conv = await Conversation.findOne({ uid, channel_id: channelId });
        if (!conv) {
            const error = new Error(`Conversation not found for uid="${uid}", channelId="${channelId}`)
            error.statusCode = 404;
            throw error;
        }
        conv.unread_count = 0;
        conv.last_read_seq = conv.last_msg_seq;
        conv.version += 1;
        await conv.save();

        broadcastToChannel([uid], {
            type: 'conversation_updated',
            data: conv
        })
        return conv;
    }
}

export default ConversationService;
