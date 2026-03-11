import MessageService from "../services/messageService.js";


class MessageController {
    static async sendMessage(req, res, next) {
        try {
            const { channelId, senderUid, content, type } = req.body;
            const { message, memberUids } = await MessageService.sendMessage({ channelId, senderUid, content, type });

            // broadcast 
            return res.status(201).json({success: true, data: message})
        } catch (err) {
            next(err);
        }
    }
}


export default MessageController;
