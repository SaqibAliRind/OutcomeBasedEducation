import { CourseOffering, Semester } from '../models/index.js';

/**
 * Middleware to strictly prevent modifications to data associated with a Locked CourseOffering or Semester.
 */
export const checkDataLock = async (req, res, next) => {
    try {
        // Find possible context identifiers from body, query, or params
        const courseOfferingId = req.body.courseOfferingId || req.body.courseOffering || req.query.courseOffering;
        const semesterId = req.body.semesterId || req.body.semester || req.query.semester;

        // 1. Check CourseOffering lock status
        if (courseOfferingId) {
            const offering = await CourseOffering.findById(courseOfferingId).lean();
            if (offering && offering.status === 'Locked') {
                return res.status(423).json({ message: 'Data is locked for this Course Offering. Modifications are not allowed.' });
            }
            
            // If we found the offering, we can also implicitly check its semester
            if (offering && offering.semester) {
                const sem = await Semester.findById(offering.semester).lean();
                if (sem && sem.status === 'Locked') {
                    return res.status(423).json({ message: 'Data is locked for this Semester. Modifications are not allowed.' });
                }
            }
        }

        // 2. Check Semester lock status (if explicitly provided and not already checked via offering)
        if (semesterId) {
            const sem = await Semester.findById(semesterId).lean();
            if (sem && sem.status === 'Locked') {
                return res.status(423).json({ message: 'Data is locked for this Semester. Modifications are not allowed.' });
            }
        }

        next();
    } catch (error) {
        console.error('Data lock check error:', error);
        res.status(500).json({ message: 'Server error during data lock verification.' });
    }
};
