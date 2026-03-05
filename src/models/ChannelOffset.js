import mongoose from "mongoose";


const channelOffsetSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
    },
    channel_id: {
        type: String,
        required: true
    },
    offset_msg_seq: {
        type: Number,
        default: 0
    }
}, {timestamps: true, collation: 'channels_offsets'})

channelOffsetSchema.index({ uid: 1, channel_id: 1 }, { unique: true });

const Channel = mongoose.model('Channels', channelOffsetSchema)

export default Channel;