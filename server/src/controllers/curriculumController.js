import Curriculum from '../models/Curriculum.js';

export const getCurriculums = async (req, res) => {
  try {
    const curriculums = await Curriculum.find()
      .populate('program', 'name code')
      .populate('department', 'name code')
      .populate({
        path: 'semesters.courses.course',
        select: 'name code creditHours theoryCreditHours labCreditHours type'
      })
      .populate({
        path: 'semesters.courses.prerequisites',
        select: 'name code'
      })
      .sort({ createdAt: -1 });
    res.status(200).json(curriculums);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCurriculum = async (req, res) => {
  try {
    const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
    if (!isAdmin) return res.status(403).json({ message: 'Not authorized to create curriculum' });

    const curriculum = new Curriculum(req.body);
    const savedCurriculum = await curriculum.save();
    
    const populatedCurriculum = await Curriculum.findById(savedCurriculum._id)
      .populate('program', 'name code')
      .populate('department', 'name code')
      .populate({
        path: 'semesters.courses.course',
        select: 'name code creditHours theoryCreditHours labCreditHours type'
      })
      .populate({
        path: 'semesters.courses.prerequisites',
        select: 'name code'
      });

    res.status(201).json(populatedCurriculum);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A curriculum with this name and version already exists.' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const updateCurriculum = async (req, res) => {
  try {
    const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
    if (!isAdmin) return res.status(403).json({ message: 'Not authorized to update curriculum' });

    const updatedCurriculum = await Curriculum.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    )
    .populate('program', 'name code')
    .populate('department', 'name code')
    .populate({
      path: 'semesters.courses.course',
      select: 'name code creditHours theoryCreditHours labCreditHours type'
    })
    .populate({
      path: 'semesters.courses.prerequisites',
      select: 'name code'
    });

    if (!updatedCurriculum) return res.status(404).json({ message: 'Curriculum not found' });
    res.status(200).json(updatedCurriculum);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A curriculum with this name and version already exists.' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const deleteCurriculum = async (req, res) => {
  try {
    const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
    if (!isAdmin) return res.status(403).json({ message: 'Not authorized to delete curriculum' });

    const deletedCurriculum = await Curriculum.findByIdAndDelete(req.params.id);
    if (!deletedCurriculum) return res.status(404).json({ message: 'Curriculum not found' });
    
    res.status(200).json({ message: 'Curriculum deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add course to semester
export const addCourseToSemester = async (req, res) => {
  try {
    const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
    if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });

    const { id } = req.params;
    const { semesterNumber, courseId } = req.body;

    const curriculum = await Curriculum.findById(id);
    if (!curriculum) return res.status(404).json({ message: 'Curriculum not found' });

    let semester = curriculum.semesters.find(s => s.semesterNumber === semesterNumber);
    if (!semester) {
      curriculum.semesters.push({ semesterNumber, courses: [{ course: courseId, prerequisites: [] }] });
    } else {
      if (semester.courses.some(c => c.course.toString() === courseId)) {
        return res.status(400).json({ message: 'Course already exists in this semester' });
      }
      semester.courses.push({ course: courseId, prerequisites: [] });
    }

    await curriculum.save();
    
    const updatedCurriculum = await Curriculum.findById(id)
      .populate('program', 'name code')
      .populate('department', 'name code')
      .populate({ path: 'semesters.courses.course', select: 'name code creditHours theoryCreditHours labCreditHours type' })
      .populate({ path: 'semesters.courses.prerequisites', select: 'name code' });

    res.status(200).json(updatedCurriculum);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove course from semester
export const removeCourseFromSemester = async (req, res) => {
  try {
    const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
    if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });

    const { id, courseId } = req.params;
    
    const curriculum = await Curriculum.findById(id);
    if (!curriculum) return res.status(404).json({ message: 'Curriculum not found' });

    curriculum.semesters.forEach(semester => {
      semester.courses = semester.courses.filter(c => c.course.toString() !== courseId);
    });

    // Remove empty semesters
    curriculum.semesters = curriculum.semesters.filter(s => s.courses.length > 0);

    await curriculum.save();

    const updatedCurriculum = await Curriculum.findById(id)
      .populate('program', 'name code')
      .populate('department', 'name code')
      .populate({ path: 'semesters.courses.course', select: 'name code creditHours theoryCreditHours labCreditHours type' })
      .populate({ path: 'semesters.courses.prerequisites', select: 'name code' });

    res.status(200).json(updatedCurriculum);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update prerequisites for a course
export const updateCoursePrerequisites = async (req, res) => {
  try {
    const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
    if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });

    const { id, courseId } = req.params;
    const { prerequisites } = req.body; // Array of Course ObjectIds

    const curriculum = await Curriculum.findById(id);
    if (!curriculum) return res.status(404).json({ message: 'Curriculum not found' });

    let found = false;
    curriculum.semesters.forEach(semester => {
      const courseMapping = semester.courses.find(c => c.course.toString() === courseId);
      if (courseMapping) {
        courseMapping.prerequisites = prerequisites;
        found = true;
      }
    });

    if (!found) return res.status(404).json({ message: 'Course not found in this curriculum' });

    await curriculum.save();

    const updatedCurriculum = await Curriculum.findById(id)
      .populate('program', 'name code')
      .populate('department', 'name code')
      .populate({ path: 'semesters.courses.course', select: 'name code creditHours theoryCreditHours labCreditHours type' })
      .populate({ path: 'semesters.courses.prerequisites', select: 'name code' });

    res.status(200).json(updatedCurriculum);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Clone a previous curriculum
export const cloneCurriculum = async (req, res) => {
  try {
    const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
    if (!isAdmin) return res.status(403).json({ message: 'Not authorized to clone curriculum' });

    const originalId = req.params.id;
    const { newVersion, newName, newEffectiveFrom, newEffectiveTo, newDegreeLevel, newTotalCreditHours, newTotalSemesters } = req.body;

    const originalCurriculum = await Curriculum.findById(originalId);
    if (!originalCurriculum) return res.status(404).json({ message: 'Original curriculum not found' });

    const curriculumData = originalCurriculum.toObject();
    delete curriculumData._id;
    delete curriculumData.createdAt;
    delete curriculumData.updatedAt;

    curriculumData.name = newName || curriculumData.name;
    curriculumData.version = newVersion || `${curriculumData.version}-copy`;
    if (newEffectiveFrom) curriculumData.effectiveFrom = newEffectiveFrom;
    if (newEffectiveTo) curriculumData.effectiveTo = newEffectiveTo;
    if (newDegreeLevel) curriculumData.degreeLevel = newDegreeLevel;
    if (newTotalCreditHours) curriculumData.totalCreditHours = newTotalCreditHours;
    if (newTotalSemesters) curriculumData.totalSemesters = newTotalSemesters;
    curriculumData.status = 'Draft';

    const clonedCurriculum = new Curriculum(curriculumData);
    const savedCurriculum = await clonedCurriculum.save();

    const populatedCurriculum = await Curriculum.findById(savedCurriculum._id)
      .populate('program', 'name code')
      .populate('department', 'name code')
      .populate({ path: 'semesters.courses.course', select: 'name code creditHours theoryCreditHours labCreditHours type' })
      .populate({ path: 'semesters.courses.prerequisites', select: 'name code' });

    res.status(201).json(populatedCurriculum);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A curriculum with this name and version already exists.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Update course type (Core/Elective)
export const updateCourseType = async (req, res) => {
  try {
    const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
    if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });

    const { id, courseId } = req.params;
    const { courseType } = req.body; 

    const curriculum = await Curriculum.findById(id);
    if (!curriculum) return res.status(404).json({ message: 'Curriculum not found' });

    let found = false;
    curriculum.semesters.forEach(semester => {
      const courseMapping = semester.courses.find(c => c.course.toString() === courseId);
      if (courseMapping) {
        courseMapping.courseType = courseType;
        found = true;
      }
    });

    if (!found) return res.status(404).json({ message: 'Course not found in this curriculum' });

    await curriculum.save();

    const updatedCurriculum = await Curriculum.findById(id)
      .populate('program', 'name code')
      .populate('department', 'name code')
      .populate({ path: 'semesters.courses.course', select: 'name code creditHours theoryCreditHours labCreditHours type' })
      .populate({ path: 'semesters.courses.prerequisites', select: 'name code' });

    res.status(200).json(updatedCurriculum);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reorder courses within a semester
export const reorderSemesterCourses = async (req, res) => {
  try {
    const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
    if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });

    const { id, semesterNumber } = req.params;
    const { orderedCourseIds } = req.body; // Array of object IDs in the new order

    const curriculum = await Curriculum.findById(id);
    if (!curriculum) return res.status(404).json({ message: 'Curriculum not found' });

    const semester = curriculum.semesters.find(s => s.semesterNumber === Number(semesterNumber));
    if (!semester) return res.status(404).json({ message: 'Semester not found in curriculum' });

    // Map existing courses by courseId to maintain their data (prereqs, type)
    const existingCoursesMap = new Map();
    semester.courses.forEach(c => {
      existingCoursesMap.set(c.course.toString(), c);
    });

    const newCoursesArray = [];
    orderedCourseIds.forEach(courseId => {
      if (existingCoursesMap.has(courseId)) {
        newCoursesArray.push(existingCoursesMap.get(courseId));
      }
    });

    semester.courses = newCoursesArray;
    await curriculum.save();

    const updatedCurriculum = await Curriculum.findById(id)
      .populate('program', 'name code')
      .populate('department', 'name code')
      .populate({ path: 'semesters.courses.course', select: 'name code creditHours theoryCreditHours labCreditHours type' })
      .populate({ path: 'semesters.courses.prerequisites', select: 'name code' });

    res.status(200).json(updatedCurriculum);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};