import mongoose from "mongoose";
import { string } from "zod";


const userSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: string,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        select: false,
    },
    google_id: {
        type: String,
        sparse: true,
        unique: true,
    },
    auth_type: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
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