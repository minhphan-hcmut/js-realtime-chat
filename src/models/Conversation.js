import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        index: true
    },
    channel_id: {
        type: String,
        required: true,
        index: true
    },
    unread_count: {
        type: Number,
        default: 0
    },
    last_msg_seq: {
        type: Number,
        default: 0,
    },
    version: {
        type: Number,
        default: 0,
        comment: 'version for delta sync'
    
    }
}, { timestamps: true, collection: 'conversations' });

conversationSchema.index({ uid: 1, channel_id: 1 }, { unique: true });
conversationSchema.index({uid: 1, version: 1})

const Conversation = mongoose.model('Conversations', conversationSchema);

export default Conversation;