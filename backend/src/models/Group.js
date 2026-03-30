import mongoose from "mongoose";


const groupSchema = new mongoose.Schema({
    channel_id: {
        type: String,
        required: true,
        unique: true,
    }, 
    name: {
        type: String,
        required: true
    },
    owner_uid: {
        type: String,
        required: true,
    },
    member_uids: {
        type: [String],
        default: []
    }
}, { timestamps: true, collection: 'groups'})

const Group = mongoose.model('Groups', groupSchema)

export default Group;