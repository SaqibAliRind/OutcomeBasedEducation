import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const run = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected!");
        
        const count = await User.countDocuments();
        console.log(`Total users in DB: ${count}`);

        const users = await User.find({}, 'name email username role isActive isDeleted').limit(20);
        console.log("Users:", JSON.stringify(users, null, 2));

        // Find users search
        const emptyUsernames = await User.find({ username: "" });
        console.log(`Users with empty string username: ${emptyUsernames.length}`);
        
        const undefinedUsernames = await User.find({ username: { $exists: false } });
        console.log(`Users with missing username field: ${undefinedUsernames.length}`);

        const nullUsernames = await User.find({ username: null });
        console.log(`Users with null username: ${nullUsernames.length}`);

    } catch (err) {
        console.error("Error running diagnostics:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
};

run();
