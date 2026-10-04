// Root-level Vercel serverless handler
// Imports Express app from server/src/app.js
import app from '../server/src/app.js';
import connectDB from '../server/src/config/db.js';

let isConnected = false;

export default async function handler(req, res) {
    try {
        if (!isConnected) {
            await connectDB();
            isConnected = true;
        }
        return app(req, res);
    } catch (error) {
        console.error("Vercel API Handler Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "API Server Error", 
            error: error.message 
        });
    }
}
