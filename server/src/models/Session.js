import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({ 
    name:      { type: String, required: true },
    term:      { type: String, enum: ['Spring', 'Fall', 'Summer'], default: 'Fall' },
    year:      { type: Number, required: true },
    startDate: { type: Date },
    endDate:   { type: Date },
    status:    { type: String, enum: ['Active', 'Closed', 'Upcoming'], default: 'Upcoming' }
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);
export default Session;

