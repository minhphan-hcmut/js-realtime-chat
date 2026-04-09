import mongoose from "mongoose";

import config from "./index.js";
const { mongodb_user, mongodb_password, mongodb_host, mongodb_db, mongodb_uri } =
  config;
async function connectDb() {
  try {
    mongoose.connect(mongodb_uri);
    console.log("MongoDB connected");
  } catch (err) {
    console.log(`MongoDB connections failed: ${err}`);
    process.exit(1);
  }
}

export default connectDb;
