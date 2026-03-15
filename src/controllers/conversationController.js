import Conversation from "../models/Conversation.js";
import ConversationService from "../services/conversationService.js";

class ConversationController  {
    static async syncConversations(req, res, next) {
        try {
            const { uid, clientVersion } = req.body;
            const result = await ConversationService.syncConversations({ uid, clientVersion: parseInt(clientVersion) || 0,  });
            
            return res.status(200).json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
        
    } 
    static async markAsRead(req, res, next) {
        try {
            const { uid, channelId } = req.body;
            const conversation = await ConversationService.markAsRead({ uid, channelId });
            return res.status(200).json({success : true, data: conversation})
        } catch (err) {
            next(err);
        }
    }
}


export default ConversationController;