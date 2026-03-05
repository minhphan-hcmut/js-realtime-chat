import mongoose from "mongoose"
import { configDotenv } from "dotenv"

configDotenv()
const { MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST, MONGODB_DB } = process.env;
const mongo_uri = `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}:27017/${MONGODB_DB}?authSource=admin`;

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