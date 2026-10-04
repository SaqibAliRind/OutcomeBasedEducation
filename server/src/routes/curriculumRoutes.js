import express from 'express';
import { protect, admin, authorize } from '../middleware/authMiddleware.js';
import { isProgramCoordinator } from '../middleware/rowLevelAuth.js';
import { checkDataLock } from '../middleware/dataLocking.js';
import { 
  getCurriculums, 
  createCurriculum, 
  updateCurriculum, 
  deleteCurriculum,
  addCourseToSemester,
  removeCourseFromSemester,
  updateCoursePrerequisites,
  cloneCurriculum,
  updateCourseType,
  reorderSemesterCourses
} from '../controllers/curriculumController.js';

const router = express.Router();

// Allow Admins and Program Coordinators to mutate curriculums
const curriculumAuth = [protect, authorize('SuperAdmin', 'UniversityAdmin', 'ProgramCoordinator')];

router.get('/', protect, getCurriculums);
router.post('/', ...curriculumAuth, checkDataLock, createCurriculum);
router.put('/:id', ...curriculumAuth, isProgramCoordinator, checkDataLock, updateCurriculum);
router.delete('/:id', ...curriculumAuth, isProgramCoordinator, checkDataLock, deleteCurriculum);
router.post('/:id/clone', ...curriculumAuth, isProgramCoordinator, checkDataLock, cloneCurriculum);

// Course Management inside Curriculum
router.post('/:id/courses', ...curriculumAuth, isProgramCoordinator, checkDataLock, addCourseToSemester);
router.delete('/:id/courses/:courseId', ...curriculumAuth, isProgramCoordinator, checkDataLock, removeCourseFromSemester);
router.put('/:id/courses/:courseId/prerequisites', ...curriculumAuth, isProgramCoordinator, checkDataLock, updateCoursePrerequisites);
router.put('/:id/courses/:courseId/type', ...curriculumAuth, isProgramCoordinator, checkDataLock, updateCourseType);
router.put('/:id/semesters/:semesterNumber/reorder', ...curriculumAuth, isProgramCoordinator, checkDataLock, reorderSemesterCourses);

export default router;