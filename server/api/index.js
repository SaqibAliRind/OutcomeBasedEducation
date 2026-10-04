// Vercel Serverless Entry Point
// Vercel does NOT use app.listen() - it imports the app directly
import app from '../src/app.js';
import connectDB from '../src/config/db.js';

// Connect to MongoDB once (cached for serverless)
let isConnected = false;
const handler = async (req, res) => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }
    return app(req, res);
};

export default handler;
