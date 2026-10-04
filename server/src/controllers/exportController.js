import {
    generateCLOAchievementExcel,
    generatePLOAchievementExcel,
    generateCQIActionRegisterExcel,
    generateMarksExcel,
    generateGenericExcel,
    generateCSV,
    generatePDF
} from '../services/reportExportService.js';
import { getCLOAchievementReport, getPLOAchievementReport } from './reportController.js';
import { getCQIActionRegister } from './cqiController.js';
import { StudentAttainment, Mark, CLO, PLO, Enrollment } from '../models/index.js';

/**
 * Helper: Promisify a controller call by mocking req/res to capture JSON output
 */
const captureControllerData = (controllerFn, req) => {
    return new Promise((resolve, reject) => {
        const mockRes = {
            json: (data) => resolve(data),
            status: (code) => ({ json: (data) => resolve(data) })
        };
        Promise.resolve(controllerFn(req, mockRes)).catch(reject);
    });
};

// ─────────────────────────────────────────────────────────────
// DOWNLOAD ENDPOINTS
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/export/clo-report?format=excel|pdf|csv
 */
export const exportCLOReport = async (req, res) => {
    try {
        const format = req.query.format || 'excel';
        const data = await captureControllerData(getCLOAchievementReport, req);

        if (format === 'excel' || format === 'xlsx') {
            const wb = await generateCLOAchievementExcel(data);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="CLO_Achievement_Report_${Date.now()}.xlsx"`);
            await wb.xlsx.write(res);
            return res.end();
        }

        if (format === 'csv') {
            const headers = ['CLO Code', 'Description', 'Course', 'Target (%)', 'Achieved (%)', 'Attainment Rate (%)', 'Status'];
            const rows = (data.clos || []).map(r => [r.clo, r.description || '—', r.course, r.target, r.achieved, r.attainmentRate ?? '—', r.status]);
            const csv = generateCSV(headers, rows);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="CLO_Achievement_Report_${Date.now()}.csv"`);
            return res.send(csv);
        }

        if (format === 'pdf') {
            const headers = ['CLO', 'Course', 'Target%', 'Achieved%', 'Rate%', 'Status'];
            const rows = (data.clos || []).map(r => [r.clo, r.course, r.target, r.achieved, r.attainmentRate ?? '—', r.status]);
            return generatePDF('CLO Achievement Report', `Total: ${data.total} | Met: ${data.achieved} | Not Met: ${data.notAchieved}`, headers, rows, res);
        }

        res.status(400).json({ message: 'Invalid format. Use excel, csv, or pdf.' });
    } catch (error) {
        console.error('CLO export error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/export/plo-report?format=excel|pdf|csv
 */
export const exportPLOReport = async (req, res) => {
    try {
        const format = req.query.format || 'excel';
        const data = await captureControllerData(getPLOAchievementReport, req);

        if (format === 'excel' || format === 'xlsx') {
            const wb = await generatePLOAchievementExcel(data);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="PLO_Achievement_Report_${Date.now()}.xlsx"`);
            await wb.xlsx.write(res);
            return res.end();
        }

        if (format === 'csv') {
            const headers = ['PLO Code', 'Description', 'Program', 'Target (%)', 'Achieved (%)', 'Attainment Rate (%)', 'Status'];
            const rows = (data.plos || []).map(r => [r.plo, r.description || '—', r.program, r.target, r.achieved, r.attainmentRate ?? '—', r.status]);
            const csv = generateCSV(headers, rows);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="PLO_Achievement_Report_${Date.now()}.csv"`);
            return res.send(csv);
        }

        if (format === 'pdf') {
            const headers = ['PLO', 'Program', 'Target%', 'Achieved%', 'Rate%', 'Status'];
            const rows = (data.plos || []).map(r => [r.plo, r.program, r.target, r.achieved, r.attainmentRate ?? '—', r.status]);
            return generatePDF('PLO Achievement Report', `Total: ${data.total} | Met: ${data.achieved} | Not Met: ${data.notAchieved}`, headers, rows, res);
        }

        res.status(400).json({ message: 'Invalid format. Use excel, csv, or pdf.' });
    } catch (error) {
        console.error('PLO export error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/export/cqi-report?format=excel|pdf|csv
 */
export const exportCQIReport = async (req, res) => {
    try {
        const format = req.query.format || 'excel';
        const { programId, sessionId } = req.query;
        const { buildCQIActionRegister } = await import('../controllers/cqiController.js');
        const actions = await buildCQIActionRegister({ programId, sessionId });
        const data = {
            total: actions.length,
            completed: actions.filter(a => a.status === 'Completed').length,
            inProgress: actions.filter(a => a.status === 'In Progress').length,
            pending: actions.filter(a => a.status === 'Pending').length,
            actions
        };

        if (format === 'excel' || format === 'xlsx') {
            const wb = await generateCQIActionRegisterExcel(data);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="CQI_Action_Register_${Date.now()}.xlsx"`);
            await wb.xlsx.write(res);
            return res.end();
        }

        if (format === 'csv') {
            const headers = ['ID', 'Course Code', 'Course Name', 'Weak CLO', 'Root Cause', 'Corrective Action', 'Responsible Person', 'Target Date', 'Status'];
            const rows = actions.map(a => [a.id, a.courseCode, a.courseName, a.weakCLO, a.rootCause, a.correctiveAction || a.action || '—', a.responsiblePerson, a.targetDate, a.status]);
            const csv = generateCSV(headers, rows);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="CQI_Action_Register_${Date.now()}.csv"`);
            return res.send(csv);
        }

        if (format === 'pdf') {
            const headers = ['ID', 'Course', 'CLO', 'Root Cause', 'Action', 'Responsible', 'Due Date', 'Status'];
            const rows = actions.map(a => [a.id, a.courseCode, a.weakCLO, a.rootCause, a.correctiveAction || '—', a.responsiblePerson, a.targetDate, a.status]);
            return generatePDF('CQI Action Register', `Total: ${data.total} | Completed: ${data.completed} | Pending: ${data.pending}`, headers, rows, res);
        }

        res.status(400).json({ message: 'Invalid format. Use excel, csv, or pdf.' });
    } catch (error) {
        console.error('CQI export error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/export/marks-report?format=excel|pdf|csv
 */
export const exportMarksReport = async (req, res) => {
    try {
        const format = req.query.format || 'excel';
        const enrollments = await Enrollment.find({ grade: { $ne: null } })
            .populate('student', 'name email')
            .populate({ path: 'courseOffering', populate: { path: 'course', select: 'name code' } })
            .lean();

        const rows = enrollments.map(e => ({
            studentName: e.student?.name || 'N/A',
            courseName: e.courseOffering?.course?.name || 'N/A',
            courseCode: e.courseOffering?.course?.code || 'N/A',
            session: e.session || 'N/A',
            grade: e.grade || 'N/A'
        }));

        if (format === 'excel' || format === 'xlsx') {
            const wb = await generateMarksExcel(rows);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="Marks_Report_${Date.now()}.xlsx"`);
            await wb.xlsx.write(res);
            return res.end();
        }

        if (format === 'csv') {
            const headers = ['Student Name', 'Course Name', 'Course Code', 'Session', 'Grade'];
            const csvRows = rows.map(r => [r.studentName, r.courseName, r.courseCode, r.session, r.grade]);
            const csv = generateCSV(headers, csvRows);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="Marks_Report_${Date.now()}.csv"`);
            return res.send(csv);
        }

        if (format === 'pdf') {
            const headers = ['Student', 'Course', 'Code', 'Session', 'Grade'];
            const pdfRows = rows.map(r => [r.studentName, r.courseName, r.courseCode, r.session, r.grade]);
            return generatePDF('Marks / Grade Report', `Total Records: ${rows.length}`, headers, pdfRows, res);
        }

        res.status(400).json({ message: 'Invalid format. Use excel, csv, or pdf.' });
    } catch (error) {
        console.error('Marks export error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/export/attainment-report?courseOfferingId=...&format=excel|pdf|csv
 */
export const exportAttainmentReport = async (req, res) => {
    try {
        const format = req.query.format || 'excel';
        const { courseOfferingId } = req.query;

        if (!courseOfferingId) {
            return res.status(400).json({ message: 'courseOfferingId is required' });
        }

        const attainments = await StudentAttainment.find({ courseOffering: courseOfferingId })
            .populate('student', 'name rollNo')
            .populate('clos.clo', 'code')
            .lean();

        if (!attainments.length) {
            return res.status(404).json({ message: 'No attainment data found for this course offering.' });
        }

        // Build flat row structure for export
        const allCloKeys = [...new Set(attainments.flatMap(a => a.clos.map(c => c.clo?.code || c.clo?.toString())))];
        const headers = [
            { key: 'student', label: 'Student Name', width: 28 },
            { key: 'rollNo', label: 'Roll No', width: 14 },
            ...allCloKeys.map(k => ({ key: k, label: k, width: 12 })),
            { key: 'overall', label: 'Overall %', width: 12 }
        ];

        const rows = attainments.map(att => {
            const row = {
                student: att.student?.name || 'N/A',
                rollNo: att.student?.rollNo || '—'
            };
            let totalPct = 0, cloCount = 0;
            att.clos.forEach(c => {
                const key = c.clo?.code || c.clo?.toString();
                row[key] = c.percentage;
                totalPct += c.percentage;
                cloCount++;
            });
            row.overall = cloCount > 0 ? parseFloat((totalPct / cloCount).toFixed(2)) : 0;
            return row;
        });

        if (format === 'excel' || format === 'xlsx') {
            const wb = await generateGenericExcel('Student CLO Attainment', headers, rows);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="Attainment_Report_${Date.now()}.xlsx"`);
            await wb.xlsx.write(res);
            return res.end();
        }

        if (format === 'csv') {
            const csvHeaders = headers.map(h => h.label);
            const csvRows = rows.map(r => headers.map(h => r[h.key] ?? '—'));
            const csv = generateCSV(csvHeaders, csvRows);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="Attainment_Report_${Date.now()}.csv"`);
            return res.send(csv);
        }

        if (format === 'pdf') {
            const pdfHeaders = ['Student', 'Roll No', ...allCloKeys, 'Overall%'];
            const pdfRows = rows.map(r => [r.student, r.rollNo, ...allCloKeys.map(k => r[k] ?? '—'), r.overall]);
            return generatePDF('Student CLO Attainment Report', `Course Offering: ${courseOfferingId}`, pdfHeaders, pdfRows, res);
        }

        res.status(400).json({ message: 'Invalid format. Use excel, csv, or pdf.' });
    } catch (error) {
        console.error('Attainment export error:', error);
        res.status(500).json({ message: error.message });
    }
};
