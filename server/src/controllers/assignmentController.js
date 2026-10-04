import User from '../models/User.js';
import Department from '../models/Department.js';
import Program from '../models/Program.js';
import Section from '../models/Section.js';
import CourseOffering from '../models/CourseOffering.js';
import Course from '../models/Course.js';

// ─── GET all teachers (for the assignment UI) ─────────────────────────────────
export const getTeachersForAssignment = async (req, res) => {
    try {
        const teachers = await User.find({
            role: { $in: ['Teacher', 'ProgramCoordinator'] },
            isDeleted: false,
            isActive: true
        }).select('_id name email role').sort({ name: 1 });
        res.json({ success: true, data: teachers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET summary data (departments, programs, sections with teacher assignments) ─
export const getAssignmentSummary = async (req, res) => {
    try {
        const [departments, programs, sections] = await Promise.all([
            Department.find().populate('hod', 'name').sort({ name: 1 }),
            Program.find().populate('coordinator', 'name').sort({ name: 1 }),
            Section.find().populate('advisor', 'name').sort({ name: 1 })
        ]);
        res.json({ success: true, data: { departments, programs, sections } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── ASSIGN teacher to Department (sets hod field) ────────────────────────────
export const assignTeacherToDepartment = async (req, res) => {
    try {
        const { departmentId, teacherId } = req.body;
        if (!departmentId) return res.status(400).json({ success: false, message: 'departmentId is required' });

        const dept = await Department.findByIdAndUpdate(
            departmentId,
            { hod: teacherId || null },
            { new: true }
        ).populate('hod', 'name');
        if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

        res.json({ success: true, data: dept, message: teacherId ? `Teacher assigned to ${dept.name}` : `Teacher removed from ${dept.name}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── ASSIGN teacher to Program (sets coordinator field) ───────────────────────
export const assignTeacherToProgram = async (req, res) => {
    try {
        const { programId, teacherId } = req.body;
        if (!programId) return res.status(400).json({ success: false, message: 'programId is required' });

        const program = await Program.findByIdAndUpdate(
            programId,
            { coordinator: teacherId || null },
            { new: true }
        ).populate('coordinator', 'name');
        if (!program) return res.status(404).json({ success: false, message: 'Program not found' });

        res.json({ success: true, data: program, message: teacherId ? `Coordinator assigned to ${program.name}` : `Coordinator removed from ${program.name}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── ASSIGN teacher to Section (sets advisor field) ───────────────────────────
export const assignTeacherToSection = async (req, res) => {
    try {
        const { sectionId, teacherId } = req.body;
        if (!sectionId) return res.status(400).json({ success: false, message: 'sectionId is required' });

        const section = await Section.findByIdAndUpdate(
            sectionId,
            { advisor: teacherId || null },
            { new: true }
        ).populate('advisor', 'name');
        if (!section) return res.status(404).json({ success: false, message: 'Section not found' });

        res.json({ success: true, data: section, message: teacherId ? `Advisor assigned to ${section.name}` : `Advisor removed from ${section.name}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET Teacher Workload ─────────────────────────────────────────────────────
// Aggregates from CourseOfferings: credit hours, courses, sections, enrolled students
export const getTeacherWorkload = async (req, res) => {
    try {
        const teachers = await User.find({
            role: { $in: ['Teacher', 'ProgramCoordinator'] },
            isDeleted: false,
            isActive: true
        }).select('_id name email role').sort({ name: 1 });

        const offerings = await CourseOffering.find({ teacher: { $exists: true, $ne: '' } });
        const courses   = await Course.find().select('code creditHours');

        // Build credit hour lookup by course code
        const creditMap = {};
        courses.forEach(c => { creditMap[c.code] = c.creditHours || 3; });

        const workloadMap = {};

        offerings.forEach(o => {
            if (!o.teacher) return;
            const name = o.teacher;
            if (!workloadMap[name]) {
                workloadMap[name] = {
                    teacherName: name,
                    courses: [],
                    sections: [],
                    totalCreditHours: 0,
                    totalStudents: 0
                };
            }
            const w = workloadMap[name];
            if (!w.courses.includes(o.course)) w.courses.push(o.course);
            if (!w.sections.includes(o.section)) w.sections.push(o.section);
            w.totalCreditHours += creditMap[o.course] || 3;
            w.totalStudents += o.enrollmentLimit || 0;
        });

        // Merge with full teacher list (teachers with 0 workload get empty entries)
        const workload = teachers.map(t => {
            const w = workloadMap[t.name] || {
                teacherName: t.name,
                courses: [],
                sections: [],
                totalCreditHours: 0,
                totalStudents: 0
            };
            return {
                _id: t._id,
                name: t.name,
                email: t.email,
                role: t.role,
                creditHours: w.totalCreditHours,
                courses: w.courses.length,
                sections: w.sections.length,
                students: w.totalStudents,
                courseList: w.courses,
                sectionList: w.sections
            };
        });

        res.json({ success: true, data: workload });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
