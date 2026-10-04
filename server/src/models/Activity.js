import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({ 
    action: { type: String, required: true }, 
    performedBy: { type: String, required: true } 
}, { timestamps: true });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
