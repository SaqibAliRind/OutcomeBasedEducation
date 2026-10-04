import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University'
    },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    recipient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
        // Can be null if targeting an audience instead of an individual
    },
    targetAudience: {
        type: String,
        enum: ['All Users', 'Students', 'Teachers', 'HODs', 'Program Coordinators', 'Departments', 'Programs', 'Sections', 'Individual User'],
        default: 'Individual User'
    },
    targetGroup: {
        type: String // To store Department ID, Program ID, etc. if audience is group
    },
    type: { 
        type: String, 
        enum: [
            'Assignment Deadline', 'Quiz Reminder', 'Mid Reminder', 'Final Reminder', 
            'Attendance Warning', 'Result Published', 'Registration Reminder', 
            'Course Registration', 'Semester Registration', 'Academic Calendar Updates', 
            'Holiday Notice', 'Event Announcement', 'Workshop Announcement', 
            'Survey Reminder', 'Accreditation Notice',
            // Legacy types for compatibility
            'Assignment Reminder', 'Attendance Alert', 'Result Notification', 
            'Academic Announcement', 'Workflow', 'System',
            'Admission Confirmation', 'Fee Reminder', 'Semester Registration Alert'
        ],
        default: 'System'
    },
    title: { 
        type: String, 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    isRead: { 
        type: Boolean, 
        default: false 
    },
    status: {
        type: String,
        enum: ['Pending', 'Sent', 'Failed', 'Cancelled'],
        default: 'Sent'
    },
    scheduledFor: {
        type: Date
    },
    channels: [{
        type: String,
        enum: ['In-App', 'Email', 'SMS', 'WhatsApp', 'Push']
    }]
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
