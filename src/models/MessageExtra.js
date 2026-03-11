import mongoose from "mongoose";

const messageExtraSchema = new mongoose.Schema({
    message_id: {
        type: String,
        required: true,
    }, 
    uid: {
        type: String,
        required: true
    },
    is_deleted: {
        type: Boolean,
        default: true
    }
})

messageExtraSchema.index({message_id: 1, uid: 1}, {unique: true})

const MessageExtra = mongoose.model('messageextras', messageExtraSchema)

export default MessageExtra;
