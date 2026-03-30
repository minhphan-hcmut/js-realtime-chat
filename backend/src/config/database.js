import mongoose from "mongoose"
// import { configDotenv } from "dotenv"

// configDotenv()
import config from "./index.js"
const {mongodb_user, mongodb_password, mongodb_host, mongodb_db} = config;
// const { MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST, MONGODB_DB } = process.env;
const mongo_uri = `mongodb://${mongodb_user}:${mongodb_password}@${mongodb_host}:27017/${mongodb_db}?authSource=admin`;

async function connectDb() {
    try {
        mongoose.connect(mongo_uri)
        console.log("MongoDB connected")
    }
    catch (err) {
        console.log(`MongoDB connections failed: ${err}`)
        process.exit(1)
    }
}

export default connectDb