import Mark from '../models/Mark.js';
import Assessment from '../models/Assessment.js';
import Enrollment from '../models/Enrollment.js';
import CourseOffering from '../models/CourseOffering.js';
import User from '../models/User.js';
import SystemSettings from '../models/SystemSettings.js';

// ─── GPA Conversion — loaded dynamically from SystemSettings ─────────────────
const DEFAULT_GRADE_TABLE = [
    { minPct: 90, grade: 'A+', points: 4.0 },
    { minPct: 85, grade: 'A',  points: 4.0 },
    { minPct: 80, grade: 'A-', points: 3.7 },
    { minPct: 75, grade: 'B+', points: 3.3 },
    { minPct: 70, grade: 'B',  points: 3.0 },
    { minPct: 65, grade: 'B-', points: 2.7 },
    { minPct: 60, grade: 'C+', points: 2.3 },
    { minPct: 55, grade: 'C',  points: 2.0 },
    { minPct: 50, grade: 'C-', points: 1.7 },
    { minPct: 45, grade: 'D+', points: 1.3 },
    { minPct: 40, grade: 'D',  points: 1.0 },
    { minPct: 0,  grade: 'F',  points: 0.0 },
];

async function getGradeTable() {
    const settings = await SystemSettings.findOne().lean();
    const scales = settings?.grades?.scales;
    if (scales && scales.length) {
        // Convert from {grade, minPercentage, gpa} to {minPct, grade, points}
        return scales
            .map(s => ({ minPct: s.minPercentage, grade: s.grade, points: s.gpa }))
            .sort((a, b) => b.minPct - a.minPct); // descending order for lookup
    }
    return DEFAULT_GRADE_TABLE;
}

function getGradeFromTable(pct, gradeTable) {
    const entry = gradeTable.find(g => pct >= g.minPct);
    return entry || { grade: 'F', points: 0.0 };
}

// ─── Helper: Compute per-student course result from Marks ────────────────────
async function computeCourseResults(courseOfferingId, gradeTable) {
    const marks = await Mark.find({ courseOffering: courseOfferingId })
        .populate('assessment', 'totalMarks weightage type');

    if (!marks.length) return [];

    // Build per-student weighted total
    const studentMap = {};

    marks.forEach(record => {
        if (!record.students || !record.students.length) return; // skip marks with no students
        const w = record.assessment?.weightage || 0;
        if (w === 0) return; // skip zero-weight assessments
        record.students.forEach(sm => {
            const sid = sm.student.toString();
            if (!studentMap[sid]) studentMap[sid] = { obtained: 0, maxPossible: 0 };
            const total = record.assessment?.totalMarks || 1;
            studentMap[sid].obtained    += (sm.obtainedMarks / total) * w;
            studentMap[sid].maxPossible += w;
        });
    });

    const table = gradeTable || DEFAULT_GRADE_TABLE;
    return Object.entries(studentMap).map(([sid, data]) => {
        const pct = data.maxPossible > 0 ? (data.obtained / data.maxPossible) * 100 : 0;
        const { grade, points } = getGradeFromTable(pct, table);
        return { student: sid, percentage: Math.round(pct * 100) / 100, grade, points };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get result summary stats (pass/fail counts, GPA extremes)
// @route GET /api/results/summary
// @access Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getResultSummary = async (req, res) => {
    try {
        const { semester, session } = req.query;

        const enrollQuery = { status: { $in: ['Active', 'Enrolled', 'Completed'] } };
        if (semester) enrollQuery.semester = semester;
        if (session)  enrollQuery.session  = session;

        const enrollments = await Enrollment.find(enrollQuery)
            .populate({ path: 'courseOffering', populate: { path: 'course', select: 'name code creditHours program' } })
            .populate({ path: 'student', select: 'name rollNo program department',
                populate: [
                    { path: 'program', select: 'name' },
                    { path: 'department', select: 'name' }
                ]
            });

        if (!enrollments.length) {
            return res.json({ totalPassed: 0, totalFailed: 0, passPercentage: 0, failPercentage: 0, highestGpa: 0, lowestGpa: 0, topDepartment: 'N/A', topProgram: 'N/A', totalStudents: 0 });
        }

        // Group enrollments by student
        const studentEnrollments = {};
        enrollments.forEach(e => {
            const sid = e.student?._id?.toString();
            if (!sid) return;
            if (!studentEnrollments[sid]) studentEnrollments[sid] = { student: e.student, courses: [] };
            studentEnrollments[sid].courses.push(e);
        });

        // Compute GPA per student
        const offerings = await CourseOffering.find(semester ? { semester } : {});
        const offeringIds = offerings.map(o => o._id.toString());

        // Cache course results
        const courseResultCache = {};
        const gradeTable = await getGradeTable();
        for (const offeringId of offeringIds) {
            courseResultCache[offeringId] = await computeCourseResults(offeringId, gradeTable);
        }

        let passed = 0, failed = 0;
        const gpaList = [];
        const deptGPAMap = {}, progGPAMap = {};

        for (const [sid, { student, courses }] of Object.entries(studentEnrollments)) {
            let totalPoints = 0, totalCredits = 0, hasFailed = false;

            for (const enr of courses) {
                const offeringId = enr.courseOffering?._id?.toString();
                if (!offeringId) continue;
                const results = courseResultCache[offeringId] || [];
                const myResult = results.find(r => r.student === sid);
                if (!myResult) continue;

                const credits = enr.courseOffering?.course?.creditHours || 3;
                totalPoints  += myResult.points * credits;
                totalCredits += credits;
                if (myResult.grade === 'F') hasFailed = true;
            }

            if (totalCredits === 0) continue;

            const gpa = Math.round((totalPoints / totalCredits) * 100) / 100;
            gpaList.push({ sid, gpa, student });
            if (hasFailed) failed++; else passed++;

            // Track by dept / program
            const dept = student.department?.name || student.department?.toString() || 'Unknown';
            const prog = student.program?.name || student.program?.toString() || 'Unknown';
            if (!deptGPAMap[dept]) deptGPAMap[dept] = [];
            deptGPAMap[dept].push(gpa);
            if (!progGPAMap[prog]) progGPAMap[prog] = [];
            progGPAMap[prog].push(gpa);
        }

        const total   = passed + failed;
        const highGPA = gpaList.length ? Math.max(...gpaList.map(g => g.gpa)) : 0;
        const lowGPA  = gpaList.length ? Math.min(...gpaList.map(g => g.gpa)) : 0;

        // Top dept/prog by avg GPA
        const avgOf = map => Object.entries(map).sort((a, b) => {
            const avgA = a[1].reduce((s, v) => s + v, 0) / a[1].length;
            const avgB = b[1].reduce((s, v) => s + v, 0) / b[1].length;
            return avgB - avgA;
        })[0]?.[0] || 'N/A';

        res.json({
            totalStudents:  total,
            totalPassed:    passed,
            totalFailed:    failed,
            passPercentage: total ? Math.round((passed / total) * 10000) / 100 : 0,
            failPercentage: total ? Math.round((failed / total) * 10000) / 100 : 0,
            highestGpa:     highGPA,
            lowestGpa:      lowGPA,
            topDepartment:  avgOf(deptGPAMap),
            topProgram:     avgOf(progGPAMap),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get semester results per student
// @route GET /api/results/semester
// @access Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getSemesterResults = async (req, res) => {
    try {
        const { semester, session, search, page = 1, limit = 50 } = req.query;

        const enrollQuery = { status: { $in: ['Active', 'Enrolled', 'Completed'] } };
        if (semester) enrollQuery.semester = semester;
        if (session)  enrollQuery.session  = session;

        const enrollments = await Enrollment.find(enrollQuery)
            .populate({ path: 'courseOffering', populate: { path: 'course', select: 'name code creditHours' } })
            .populate({ path: 'student', select: 'name rollNo email program department',
                populate: [
                    { path: 'program', select: 'name' },
                    { path: 'department', select: 'name' }
                ]
            })
            .populate('semester', 'name');

        // Group by student
        const studentMap = {};
        enrollments.forEach(e => {
            const sid = e.student?._id?.toString();
            if (!sid) return;
            if (!studentMap[sid]) studentMap[sid] = { student: e.student, semester: e.semester, session: e.session, courses: [] };
            studentMap[sid].courses.push(e);
        });

        // Cache course results
        const offeringIds = [...new Set(enrollments.map(e => e.courseOffering?._id?.toString()).filter(Boolean))];
        const courseResultCache = {};
        const gradeTable = await getGradeTable();
        for (const id of offeringIds) {
            courseResultCache[id] = await computeCourseResults(id, gradeTable);
        }

        let results = [];
        for (const [sid, { student, semester: sem, session: sess, courses }] of Object.entries(studentMap)) {
            let totalPoints = 0, totalCredits = 0, failedCourses = 0;
            const courseDetails = [];

            for (const enr of courses) {
                const offeringId = enr.courseOffering?._id?.toString();
                if (!offeringId) continue;
                const courseRes = courseResultCache[offeringId] || [];
                const myRes = courseRes.find(r => r.student === sid);
                const credits = enr.courseOffering?.course?.creditHours || 3;

                if (myRes) {
                    totalPoints  += myRes.points * credits;
                    totalCredits += credits;
                    if (myRes.grade === 'F') failedCourses++;
                    courseDetails.push({ course: enr.courseOffering?.course?.name, credits, grade: myRes.grade, percentage: myRes.percentage });
                }
            }

            const gpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
            const status = failedCourses > 0 ? (failedCourses >= 3 ? 'Failed' : 'Probation') : 'Passed';

            results.push({
                _id:          sid,
                id:           student.rollNo || sid.slice(-6),
                name:         student.name,
                program:      student.program?.name || student.program?.toString() || '',
                semester:     sem?.name || sess || '',
                cgpa:         gpa,
                credits:      totalCredits,
                failed:       failedCourses,
                status,
                courseDetails,
            });
        }

        // Search filter
        if (search) {
            results = results.filter(r =>
                r.name?.toLowerCase().includes(search.toLowerCase()) ||
                r.id?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Sort by CGPA desc
        results.sort((a, b) => b.cgpa - a.cgpa);

        // Pagination
        const total    = results.length;
        const startIdx = (page - 1) * limit;
        const paged    = results.slice(startIdx, startIdx + Number(limit));

        res.json({ results: paged, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get merit list (top students by GPA)
// @route GET /api/results/merit
// @access Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getMeritList = async (req, res) => {
    try {
        const { semester, session, topN = 20 } = req.query;

        const enrollQuery = { status: { $in: ['Active', 'Enrolled', 'Completed'] } };
        if (semester) enrollQuery.semester = semester;
        if (session)  enrollQuery.session  = session;

        const enrollments = await Enrollment.find(enrollQuery)
            .populate({ path: 'courseOffering', populate: { path: 'course', select: 'creditHours program department' } })
            .populate({ path: 'student', select: 'name rollNo program department',
                populate: [
                    { path: 'program', select: 'name' },
                    { path: 'department', select: 'name' }
                ]
            });

        const studentMap = {};
        enrollments.forEach(e => {
            const sid = e.student?._id?.toString();
            if (!sid) return;
            if (!studentMap[sid]) studentMap[sid] = { student: e.student, courses: [] };
            studentMap[sid].courses.push(e);
        });

        const offeringIds = [...new Set(enrollments.map(e => e.courseOffering?._id?.toString()).filter(Boolean))];
        const courseResultCache = {};
        const gradeTable = await getGradeTable();
        for (const id of offeringIds) {
            courseResultCache[id] = await computeCourseResults(id, gradeTable);
        }

        const studentGPAs = [];
        for (const [sid, { student, courses }] of Object.entries(studentMap)) {
            let totalPoints = 0, totalCredits = 0, hasFailed = false;
            for (const enr of courses) {
                const offeringId = enr.courseOffering?._id?.toString();
                if (!offeringId) continue;
                const res = courseResultCache[offeringId]?.find(r => r.student === sid);
                if (!res) continue;
                const cr = enr.courseOffering?.course?.creditHours || 3;
                totalPoints  += res.points * cr;
                totalCredits += cr;
                if (res.grade === 'F') hasFailed = true;
            }
            if (totalCredits === 0 || hasFailed) continue;
            const gpa = Math.round((totalPoints / totalCredits) * 100) / 100;
            studentGPAs.push({ sid, gpa, student });
        }

        studentGPAs.sort((a, b) => b.gpa - a.gpa);

        // Build merit list with categories (University top, Dept top, Program top)
        const topAll  = studentGPAs.slice(0, Number(topN));
        const usedIds = new Set();

        const meritList = topAll.map((entry, idx) => {
            usedIds.add(entry.sid);
            let category = 'University';
            if (idx >= 3 && idx < 10) category = 'Department';
            else if (idx >= 10) category = 'Program';
            return {
                rank:    idx + 1,
                id:      entry.student.rollNo || entry.sid.slice(-6),
                name:    entry.student.name,
                program: entry.student.program?.name || entry.student.program?.toString() || '',
                cgpa:    entry.gpa,
                category,
            };
        });

        res.json({ meritList, total: meritList.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get available semesters + sessions for filter dropdowns
// @route GET /api/results/filters
// @access Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getResultFilters = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({}).distinct('session');
        const semesters   = await Enrollment.find({}).populate('semester', 'name').distinct('semester');

        res.json({
            sessions:  enrollments,
            semesters: semesters.map(s => typeof s === 'object' ? s : { _id: s, name: s }),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
