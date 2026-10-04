import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getSystemReports, logAiUsage, getAcademicReports, getObeReports, getAttendanceReports, getMarksReports, getAccreditationReports,
    getQuestionBankReport, getBlueprintReport, getRubricReport, getQuestionMappingReport,
    getBTCoverageReport, getCLOCoverageReport, getPLOCoverageReport, getGACoverageReport,
    getCLOAchievementReport, getPLOAchievementReport, getGAAchievementReport,
    getPEOAchievementReport, getTargetReport, getGapReport, getCQIReport,
    getOutcomeSummaryReport, getDeptReport, getProgramReport, getAccreditationReadinessReport
} from '../controllers/reportController.js';

const router = express.Router();

router.route('/system').get(protect, admin, getSystemReports);
router.route('/ai-usage').post(protect, logAiUsage);
router.route('/academic').get(protect, getAcademicReports);
router.route('/obe').get(protect, getObeReports);
router.route('/attendance').get(protect, getAttendanceReports);
router.route('/marks').get(protect, getMarksReports);
router.route('/accreditation').get(protect, getAccreditationReports);

// OBE-Specific Reports
router.route('/obe/question-bank').get(protect, getQuestionBankReport);
router.route('/obe/blueprint').get(protect, getBlueprintReport);
router.route('/obe/rubric').get(protect, getRubricReport);
router.route('/obe/question-mapping').get(protect, getQuestionMappingReport);
router.route('/obe/bt-coverage').get(protect, getBTCoverageReport);
router.route('/obe/clo-coverage').get(protect, getCLOCoverageReport);
router.route('/obe/plo-coverage').get(protect, getPLOCoverageReport);
router.route('/obe/ga-coverage').get(protect, getGACoverageReport);
router.route('/obe/clo-report').get(protect, getCLOAchievementReport);
router.route('/obe/plo-report').get(protect, getPLOAchievementReport);
router.route('/obe/ga-report').get(protect, getGAAchievementReport);
router.route('/obe/peo-report').get(protect, getPEOAchievementReport);
router.route('/obe/target-report').get(protect, getTargetReport);
router.route('/obe/gap-report').get(protect, getGapReport);
router.route('/obe/cqi-report').get(protect, getCQIReport);
router.route('/obe/outcome-report').get(protect, getOutcomeSummaryReport);
router.route('/obe/dept-report').get(protect, getDeptReport);
router.route('/obe/prog-report').get(protect, getProgramReport);
router.route('/obe/accred-report').get(protect, getAccreditationReadinessReport);

export default router;
