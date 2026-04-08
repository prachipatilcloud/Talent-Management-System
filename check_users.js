import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./server/src/models/User.js";

dotenv.config({ path: "./server/.env" });

const checkUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/tm_system";
    await mongoose.connect(mongoUri);
    const users = await User.find({}, 'email role');
    console.log("Users found:", JSON.stringify(users, null, 2));
    process.exit();
  } catch (error) {
    console.error("Error checking users:", error);
    process.exit(1);
  }
};

checkUsers();
