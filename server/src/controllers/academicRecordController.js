import Enrollment from '../models/Enrollment.js';
import Student from '../models/Student.js';
import Mark from '../models/Mark.js';
import Assessment from '../models/Assessment.js';
import CourseOffering from '../models/CourseOffering.js';

// Helper: grade from percentage
const getGrade = (pct) => {
    if (pct >= 95) return 'A+';
    if (pct >= 90) return 'A';
    if (pct >= 85) return 'A-';
    if (pct >= 80) return 'B+';
    if (pct >= 75) return 'B';
    if (pct >= 70) return 'B-';
    if (pct >= 65) return 'C+';
    if (pct >= 60) return 'C';
    if (pct >= 55) return 'C-';
    if (pct >= 50) return 'D';
    return 'F';
};

const getGradePoints = (grade) => {
    switch (grade) {
        case 'A+': case 'A': return 4.0;
        case 'A-': return 3.7;
        case 'B+': return 3.3;
        case 'B': return 3.0;
        case 'B-': return 2.7;
        case 'C+': return 2.3;
        case 'C': return 2.0;
        case 'C-': return 1.7;
        case 'D+': return 1.3;
        case 'D': return 1.0;
        default: return 0.0;
    }
};

// Build course grade map: { courseOfferingId -> { obtainedMarks, totalMarks } }
async function buildCourseGradeMap(userId) {
    const uIdStr = userId.toString();
    const marks = await Mark.find({ 'students.student': uIdStr })
        .populate({ path: 'assessment', select: 'totalMarks weightage type' })
        .populate({ path: 'courseOffering', select: 'course semester', populate: [
            { path: 'course', select: 'name code creditHours' },
            { path: 'semester', select: 'name number' }
        ]});

    // Group by courseOffering, compute weighted percentage
    const courseMap = {};
    for (const markDoc of marks) {
        const coId = markDoc.courseOffering?._id?.toString();
        if (!coId || !markDoc.assessment) continue;

        const studentEntry = markDoc.students.find(s => s.student.toString() === uIdStr);
        if (!studentEntry) continue;

        if (!courseMap[coId]) {
            courseMap[coId] = {
                courseOffering: markDoc.courseOffering,
                totalObtained: 0,
                totalPossible: 0,
            };
        }
        const wt = markDoc.assessment.weightage || 100;
        const tm = markDoc.assessment.totalMarks || 100;
        // contribution = (obtained/totalMarks) * weightage
        courseMap[coId].totalObtained += (studentEntry.obtainedMarks / tm) * wt;
        courseMap[coId].totalPossible += wt;
    }
    return courseMap;
}

// GET /api/academic-record/gpa/:studentId
export const getStudentGPA = async (req, res) => {
    try {
        const studentId = req.params.studentId === 'me' ? req.user._id : req.params.studentId;
        const courseMap = await buildCourseGradeMap(studentId);

        // Group by semester
        const semesterData = {};
        for (const entry of Object.values(courseMap)) {
            const sem = entry.courseOffering?.semester;
            if (!sem) continue;
            const semId = sem._id?.toString();
            const credits = entry.courseOffering?.course?.creditHours || 3;
            const pct = entry.totalPossible > 0 ? (entry.totalObtained / entry.totalPossible) * 100 : 0;
            const grade = getGrade(pct);
            const points = getGradePoints(grade) * credits;

            if (!semesterData[semId]) {
                semesterData[semId] = { semester: sem, totalCredits: 0, totalPoints: 0 };
            }
            semesterData[semId].totalCredits += credits;
            semesterData[semId].totalPoints += points;
        }

        const gpaList = Object.values(semesterData).map(data => ({
            semester: data.semester,
            gpa: data.totalCredits > 0 ? parseFloat((data.totalPoints / data.totalCredits).toFixed(2)) : 0,
            totalCredits: data.totalCredits
        }));

        res.status(200).json(gpaList);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// GET /api/academic-record/cgpa/:studentId
export const getStudentCGPA = async (req, res) => {
    try {
        const studentId = req.params.studentId === 'me' ? req.user._id : req.params.studentId;
        const courseMap = await buildCourseGradeMap(studentId);

        let totalCredits = 0;
        let totalPoints = 0;
        for (const entry of Object.values(courseMap)) {
            const credits = entry.courseOffering?.course?.creditHours || 3;
            const pct = entry.totalPossible > 0 ? (entry.totalObtained / entry.totalPossible) * 100 : 0;
            const grade = getGrade(pct);
            totalCredits += credits;
            totalPoints += getGradePoints(grade) * credits;
        }

        const cgpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0.00;
        res.status(200).json({ cgpa, totalCredits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// GET /api/academic-record/transcript/:studentId
export const getStudentTranscript = async (req, res) => {
    try {
        const param = req.params.studentId === 'me' ? req.user._id : req.params.studentId;

        // Find student profile
        let studentProfile = null;
        if (String(param).length === 24) {
            studentProfile = await Student.findOne({ user: param })
                .populate('user', 'name email')
                .populate('academicInfo.program', 'name code')
                .populate('academicInfo.department', 'name')
                .populate('academicInfo.batch', 'name');
        }
        if (!studentProfile) {
            studentProfile = await Student.findOne({ $or: [{ rollNumber: param }, { studentId: param }] })
                .populate('user', 'name email')
                .populate('academicInfo.program', 'name code')
                .populate('academicInfo.department', 'name')
                .populate('academicInfo.batch', 'name');
        }

        if (!studentProfile) return res.status(404).json({ message: 'Student profile not found.' });

        const uId = studentProfile.user ? (studentProfile.user._id || studentProfile.user) : param;
        const courseMap = await buildCourseGradeMap(uId);

        // Group by semester for transcript
        const transcriptMap = {};
        let grandTotalCredits = 0;
        let grandTotalPoints = 0;

        for (const [, entry] of Object.entries(courseMap)) {
            const sem = entry.courseOffering?.semester;
            const course = entry.courseOffering?.course;
            if (!sem || !course) continue;

            const semName = `${sem.name} (Semester ${sem.number || ''})`;
            const credits = course.creditHours || 3;
            const pct = entry.totalPossible > 0 ? (entry.totalObtained / entry.totalPossible) * 100 : 0;
            const grade = getGrade(pct);
            const points = getGradePoints(grade) * credits;

            if (!transcriptMap[semName]) {
                transcriptMap[semName] = { courses: [], termCredits: 0, termPoints: 0 };
            }

            transcriptMap[semName].courses.push({
                code: course.code || '—',
                name: course.name || '—',
                credits,
                grade,
                percentage: parseFloat(pct.toFixed(1)),
                points: parseFloat(points.toFixed(2))
            });

            transcriptMap[semName].termCredits += credits;
            transcriptMap[semName].termPoints += points;
            grandTotalCredits += credits;
            grandTotalPoints += points;
        }

        const terms = Object.keys(transcriptMap).map(term => {
            const t = transcriptMap[term];
            return {
                termName: term,
                courses: t.courses,
                termGPA: t.termCredits > 0 ? parseFloat((t.termPoints / t.termCredits).toFixed(2)) : 0
            };
        });

        const overallCGPA = grandTotalCredits > 0 ? parseFloat((grandTotalPoints / grandTotalCredits).toFixed(2)) : 0;

        const profile = {
            name: studentProfile.user?.name,
            email: studentProfile.user?.email,
            studentId: studentProfile.studentId,
            rollNumber: studentProfile.rollNumber,
            program: studentProfile.academicInfo?.program?.name,
            department: studentProfile.academicInfo?.department?.name,
            batch: studentProfile.academicInfo?.batch?.name
        };

        res.status(200).json({ profile, terms, overallCGPA, totalCredits: grandTotalCredits });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
