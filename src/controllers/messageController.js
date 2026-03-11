import MessageService from "../services/messageService.js";
import { broadcastToChannel } from "../websockets/socketManager.js";


class MessageController {
    static async sendMessage(req, res, next) {
        try {
            const { channelId, senderUid, content, type } = req.body;
            const { message, memberUids } = await MessageService.sendMessage({ channelId, senderUid, content, type });

            // broadcast 
            broadcastToChannel(memberUids, {
                type: 'new_message',
                data: message
            })
            return res.status(201).json({success: true, data: message})
        } catch (err) {
            next(err);
        }
    }
    static async listMessage(req, res, next) {
        try {
            const { uid, channelId, limit, startSeq } = req.query;
            const messages = await MessageService.getMessages({ uid, channelId, limit: limit ? parseInt(limit) : 50 , startSeq: startSeq ? parseInt(startSeq) : null,});
            return res.status(200).json({ success: true, data: messages });
        } catch (err) {
            next(err)
        }
    }

    static async clearHistory(req, res, next) {
        try {
            const { uid, channelId } = req.body;
            const offset = await MessageService.clearHistory({ uid, channelId });
            return res.status(200).json({success: true, data: offset})
        } catch (err) {
            next(err);
        }
    }
    static async deleteForMe(req, res, next) {
        try {
            const { uid, messageId } = req.body;
            const extra = await MessageService.deleteForMe({ uid, messageId });
            
            return res.status(200).json({success: true, data: extra})

        } catch (err) {
            next(err);
        }
    }
}


export default MessageController;
