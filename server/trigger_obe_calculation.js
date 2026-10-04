import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, CourseOffering } from './src/models/index.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });

const runCalculation = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const co = await CourseOffering.findOne();
        const superAdmin = await User.findOne({ role: 'SuperAdmin' });
        
        if (!co || !superAdmin) throw new Error("Missing CourseOffering or SuperAdmin!");

        const token = generateToken(superAdmin._id);
        console.log(`Triggering HTTP API for CourseOffering: ${co._id}`);
        
        const apiRes = await fetch(`http://localhost:5000/api/obe/calculate/${co._id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await apiRes.json();
        console.log("Calculation API result:", data.message || data);
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
};

runCalculation();
