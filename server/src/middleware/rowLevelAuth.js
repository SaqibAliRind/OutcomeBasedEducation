import { CourseOffering, Department, Program } from '../models/index.js';

/**
 * Ensures the logged-in user is the teacher assigned to the given courseOffering.
 * The courseOfferingId must be in req.body.courseOfferingId, req.body.courseOffering, or req.params.id (if it's a direct resource manipulation that can be mapped).
 */
export const isCourseTeacher = async (req, res, next) => {
    try {
        if (req.user.role === 'SuperAdmin' || req.user.role === 'UniversityAdmin') {
            return next(); // Admins bypass this check
        }

        const courseOfferingId = req.body.courseOfferingId || req.body.courseOffering || req.query.courseOffering;

        if (!courseOfferingId) {
            return res.status(400).json({ message: 'courseOfferingId is required for authorization.' });
        }

        const offering = await CourseOffering.findById(courseOfferingId);
        if (!offering) {
            return res.status(404).json({ message: 'CourseOffering not found.' });
        }

        if (offering.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied: You are not the assigned teacher for this course offering.' });
        }

        next();
    } catch (error) {
        console.error('Row-level auth error (isCourseTeacher):', error);
        res.status(500).json({ message: 'Server error during authorization.' });
    }
};

/**
 * Ensures the user is the HOD for a department.
 */
export const isDepartmentHOD = async (req, res, next) => {
    try {
        if (req.user.role === 'SuperAdmin' || req.user.role === 'UniversityAdmin') {
            return next();
        }

        const departmentId = req.body.departmentId || req.body.department || req.params.departmentId || req.query.departmentId;

        if (!departmentId) {
            return next(); // If no department context, let controller handle it, or reject.
        }

        const department = await Department.findById(departmentId);
        if (!department) {
            return res.status(404).json({ message: 'Department not found.' });
        }

        // The schema uses String for HOD. This is a bit weak, but we check if it matches User's _id or name.
        if (department.hod !== req.user._id.toString() && department.hod !== req.user.name) {
            return res.status(403).json({ message: 'Access denied: You are not the HOD for this department.' });
        }

        next();
    } catch (error) {
        console.error('Row-level auth error (isDepartmentHOD):', error);
        res.status(500).json({ message: 'Server error during authorization.' });
    }
};

/**
 * Ensures the user is the Coordinator for a program.
 */
export const isProgramCoordinator = async (req, res, next) => {
    try {
        if (req.user.role === 'SuperAdmin' || req.user.role === 'UniversityAdmin' || req.user.role === 'Dean') {
            return next();
        }

        const programId = req.body.programId || req.body.program || req.params.programId || req.query.programId;

        if (!programId) {
            return next();
        }

        const program = await Program.findById(programId);
        if (!program) {
            return res.status(404).json({ message: 'Program not found.' });
        }

        if (program.coordinator !== req.user._id.toString() && program.coordinator !== req.user.name) {
            return res.status(403).json({ message: 'Access denied: You are not the Coordinator for this program.' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error during authorization.' });
    }
};

/**
 * Ensures the logged-in user is the teacher who created the question.
 */
export const isQuestionTeacher = async (req, res, next) => {
    try {
        if (req.user.role === 'SuperAdmin' || req.user.role === 'UniversityAdmin' || req.user.role === 'HOD') {
            return next();
        }

        // For creation, we don't have a question ID yet. The controller should enforce teacher=req.user._id.
        // This middleware is primarily for PUT/DELETE where the question ID is in req.params.id
        if (!req.params.id) {
            return next();
        }

        // We need the Question model imported
        // We will import it at the top of the file in the next step, for now just dynamically import or use a quick fix
        const { Question } = await import('../models/index.js');
        const question = await Question.findById(req.params.id);
        
        if (!question) {
            return res.status(404).json({ message: 'Question not found.' });
        }

        if (question.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied: You are not the teacher who created this question.' });
        }

        next();
    } catch (error) {
        console.error('Row-level auth error (isQuestionTeacher):', error);
        res.status(500).json({ message: 'Server error during authorization.' });
    }
};

/**
 * Ensures the logged-in user is the one who created the assessment definition.
 */
export const isAssessmentCreator = async (req, res, next) => {
    try {
        if (req.user.role === 'SuperAdmin' || req.user.role === 'UniversityAdmin' || req.user.role === 'Dean' || req.user.role === 'HOD') {
            return next();
        }

        if (!req.params.id) {
            return next();
        }

        const { Assessment } = await import('../models/index.js');
        const assessment = await Assessment.findById(req.params.id);
        
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found.' });
        }

        // If the assessment was created by someone else, block it
        // Handle case where createdBy might not exist for legacy data
        if (assessment.createdBy && assessment.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied: You did not create this assessment.' });
        }

        next();
    } catch (error) {
        console.error('Row-level auth error (isAssessmentCreator):', error);
        res.status(500).json({ message: 'Server error during authorization.' });
    }
};
