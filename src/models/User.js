import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        unique: true,
    }, 
    name: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        default: ""
    }
}, {timestamps: true, collection: 'users'})

const User = mongoose.model('Users', userSchema)

export default User;