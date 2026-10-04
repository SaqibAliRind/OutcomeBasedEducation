// Root-level Vercel serverless handler
let isConnected = false;
let appInstance = null;

export default async function handler(req, res) {
    try {
        if (!appInstance) {
            // Dynamic imports to catch any top-level errors in app.js or db.js
            const { default: app } = await import('../server/src/app.js');
            const { default: connectDB } = await import('../server/src/config/db.js');
            
            if (!isConnected) {
                await connectDB();
                isConnected = true;
            }
            appInstance = app;
        }
        
        return appInstance(req, res);
    } catch (error) {
        console.error("Vercel API Handler Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "API Server Initialization Error", 
            error: error.message,
            stack: error.stack
        });
    }
}
