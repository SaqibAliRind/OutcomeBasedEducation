import app from './app.js';
import connectDB from './config/db.js';


const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
    // Start Server
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
