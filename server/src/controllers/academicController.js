import mongoose from 'mongoose';
import Faculty from '../models/Faculty.js';
import Department from '../models/Department.js';
import Program from '../models/Program.js';
import Session from '../models/Session.js';
import Semester from '../models/Semester.js';
import Section from '../models/Section.js';
import Batch from '../models/Batch.js';
import Course from '../models/Course.js';
import AcademicCalendar from '../models/AcademicCalendar.js';
import CourseOffering from '../models/CourseOffering.js';
import Timetable from '../models/Timetable.js';

const getModel = (name) => {
    const models = {
        faculties: Faculty,
        departments: Department,
        programs: Program,
        sessions: Session,
        semesters: Semester,
        sections: Section,
        batches: Batch,
        courses: Course,
        courseofferings: CourseOffering,
        calendar: AcademicCalendar,
        timetables: Timetable
    };
    return models[name.toLowerCase()];
};

// Generic GET all
export const getAllRecords = async (req, res) => {
    try {
        const Model = getModel(req.params.moduleName);
        if (!Model) return res.status(404).json({ message: 'Dynamic module not found' });

        const filter = {};
        if (req.query.department && Model.schema.paths.department) {
            filter.department = req.query.department;
        }

        // Security enforcement for HOD
        if (req.user && req.user.role === 'HOD' && Model.schema.paths.department) {
            filter.department = req.user.department;
        }

        // Security enforcement for Program Coordinator
        if (req.user && req.user.role === 'ProgramCoordinator') {
            if (Model.schema.paths.program) {
                filter.program = req.user.program;
            } else if (Model.schema.paths.department) {
                // If the model only has department, scope to coordinator's department as fallback
                filter.department = req.user.department;
            }
        }

        if (req.params.moduleName.toLowerCase() === 'sections' && (req.query.department || (req.user && req.user.role === 'HOD'))) {
            const dept = req.query.department || req.user.department;
            const Program = getModel('programs');
            const deptPrograms = await Program.find({ department: dept }).select('_id');
            filter.program = { $in: deptPrograms.map(p => p._id) };
        } else if (req.params.moduleName.toLowerCase() === 'sections' && req.user && req.user.role === 'ProgramCoordinator') {
            filter.program = req.user.program;
        }

        let query = Model.find(filter).sort({ createdAt: -1 });

        if (req.params.moduleName.toLowerCase() === 'courseofferings') {
            query = query.populate('course', 'name code').populate('teacher', 'name email').populate('section', 'name').populate('semester', 'name');
        } else if (req.params.moduleName.toLowerCase() === 'courses') {
            query = query.populate('prerequisite', 'name code').populate('department', 'name').populate('program', 'name').populate('semester', 'name');
        } else if (req.params.moduleName.toLowerCase() === 'programs') {
            query = query.populate('department', 'name').populate('coordinator', 'name email');
        } else if (req.params.moduleName.toLowerCase() === 'departments') {
            query = query.populate('hod', 'name email');
        } else if (req.params.moduleName.toLowerCase() === 'sections') {
            query = query.populate('semester', 'name').populate('program', 'name');
        } else if (req.params.moduleName.toLowerCase() === 'timetables') {
            query = query.populate('course', 'name code').populate('teacher', 'name email').populate('section', 'name');
        }

        const records = await query;
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Generic GET single
export const getRecordById = async (req, res) => {
    try {
        const Model = getModel(req.params.moduleName);
        if (!Model) return res.status(404).json({ message: 'Dynamic module not found' });

        const record = await Model.findById(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });

        res.status(200).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper function to check timetable clashes
const checkTimetableClash = async (Model, data, excludeId = null) => {
    if (!data.day || !data.startTime || !data.endTime) return null;
    
    // Find all schedules for that day
    let query = { day: data.day };
    if (excludeId) query._id = { $ne: excludeId };
    
    const existingSchedules = await Model.find(query);
    
    const newStart = parseInt(data.startTime.replace(':', ''));
    const newEnd = parseInt(data.endTime.replace(':', ''));
    
    for (let schedule of existingSchedules) {
        const existStart = parseInt(schedule.startTime.replace(':', ''));
        const existEnd = parseInt(schedule.endTime.replace(':', ''));
        
        // Check for time overlap
        if (newStart < existEnd && newEnd > existStart) {
            // Check specific clash types
            if (schedule.teacher === data.teacher) return `Clash: ${schedule.teacher} is already teaching at this time.`;
            if (schedule.room === data.room) return `Clash: Room ${schedule.room} is already booked at this time.`;
            if (schedule.section === data.section) return `Clash: Section ${schedule.section} already has a class scheduled at this time.`;
        }
    }
    return null;
};

// Generic POST create
export const createRecord = async (req, res) => {
    try {
        const Model = getModel(req.params.moduleName);
        if (!Model) return res.status(404).json({ message: 'Dynamic module not found' });

        if (req.params.moduleName === 'timetables') {
            const clashError = await checkTimetableClash(Model, req.body);
            if (clashError) return res.status(400).json({ message: clashError });
        }

        const newRecord = new Model(req.body);
        const savedRecord = await newRecord.save();

        // For courseofferings: re-fetch with populates so frontend gets names not raw IDs
        if (req.params.moduleName.toLowerCase() === 'courseofferings') {
            const populated = await Model.findById(savedRecord._id)
                .populate('course', 'name code')
                .populate('teacher', 'name email')
                .populate('section', 'name')
                .populate('semester', 'name')
                .populate('program', 'name')
                .populate('session', 'name');
            return res.status(201).json(populated);
        }

        res.status(201).json(savedRecord);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Generic PUT update
export const updateRecord = async (req, res) => {
    try {
        const Model = getModel(req.params.moduleName);
        if (!Model) return res.status(404).json({ message: 'Dynamic module not found' });

        if (req.params.moduleName === 'timetables') {
            const currentRecord = await Model.findById(req.params.id);
            if (!currentRecord) return res.status(404).json({ message: 'Record not found' });
            
            const mergedData = { ...currentRecord.toObject(), ...req.body };
            const clashError = await checkTimetableClash(Model, mergedData, req.params.id);
            if (clashError) return res.status(400).json({ message: clashError });
        }

        const updatedRecord = await Model.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after', runValidators: false }
        );

        // Sync HOD user reference if department HOD is updated
        if (req.params.moduleName.toLowerCase() === 'departments' && req.body.hod) {
            import('../models/User.js').then(({ default: User }) => {
                if (req.body.hod !== 'Unassigned') {
                    User.findByIdAndUpdate(req.body.hod, { department: updatedRecord._id }).exec();
                }
            });
        }

        if (!updatedRecord) return res.status(404).json({ message: 'Record not found' });

        // For courseofferings: re-fetch with populates so the frontend gets proper names
        if (req.params.moduleName.toLowerCase() === 'courseofferings') {
            const populated = await Model.findById(updatedRecord._id)
                .populate('course', 'name code')
                .populate('teacher', 'name email')
                .populate('section', 'name')
                .populate('semester', 'name');
            return res.status(200).json(populated);
        }

        res.status(200).json(updatedRecord);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Generic DELETE
export const deleteRecord = async (req, res) => {
    try {
        const Model = getModel(req.params.moduleName);
        if (!Model) return res.status(404).json({ message: 'Dynamic module not found' });

        const deletedRecord = await Model.findByIdAndDelete(req.params.id);
        if (!deletedRecord) return res.status(404).json({ message: 'Record not found' });

        res.status(200).json({ message: 'Record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Set Active Session — deactivates all others first
export const setActiveSession = async (req, res) => {
    try {
        await Session.updateMany({}, { status: 'Closed' });
        const session = await Session.findByIdAndUpdate(
            req.params.id,
            { status: 'Active' },
            { returnDocument: 'after' }
        );
        if (!session) return res.status(404).json({ message: 'Session not found' });
        res.status(200).json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

