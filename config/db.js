// 1. Get your tools ready
import mongoose from "mongoose";  // The phone operator
import dotenv from "dotenv";      // The secret notebook

// 2. Open the secret notebook
dotenv.config();  // "Hey app, read the secret notes!"

// 3. Find the database's "phone number"
const MONGO_URI = process.env.MONGO_URI;  // "What's MongoDB's number?"

// 4. Safety check - Did we get the number?
if (!MONGO_URI) {
  console.error("❌ Oops! Where's the phone number?");
  process.exit(1); // "Can't call without a number, let's stop here"
}

// 5. Make the phone call
const connectDB = async () => {  // "Let's try calling..."
  try {
    await mongoose.connect(MONGO_URI);  // "Dialing the number..."
    console.log("✅ Connected! We're talking to MongoDB!");
  } catch (error) {
    console.error("❌ Call failed:", error.message);
    process.exit(1); // "Let's hang up and try later"
  }
};

export default connectDB;  // "Here's how to make calls anytime!"