import mongoose from "mongoose";
import { getCollectionName } from "../utils/sharding.js";

const messageSchema = new mongoose.Schema({
    channel_id: {
        type: String,
        required: true
    },
    sender_uid: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        default: "text",
    },
    message_seq: {
        type: Number,
        required: true
    },
}, { timestamps: true, collection: 'messages' })

messageSchema.index({channel_id: 1, message_seq: 1}, {unique: true})

// const Message = mongoose.model('Messages', messageSchema)

function getMessageModel(channelId) {
    const collectionName = getCollectionName(channelId);
    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName];
    }
    return mongoose.model(collectionName, messageSchema, collectionName)
}

export default getMessageModel;