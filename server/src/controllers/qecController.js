import { WorkflowRequest, Survey, User, StudentAttainment, ObeTarget } from '../models/index.js';
import CourseFile from '../models/CourseFile.js';

// @desc    Get QEC Dashboard Data
// @route   GET /api/qec/dashboard
// @access  Private/Admin
export const getQECDashboardData = async (req, res) => {
    try {
        const university = req.user.university;
        
        // Count workflows that are pending for QEC review
        const pendingReviews = await WorkflowRequest.countDocuments({ 
            university, 
            currentStage: 'QEC',
            status: 'Pending'
        });

        // Count approved workflows by QEC
        const approvedReviews = await WorkflowRequest.countDocuments({
            university,
            'history.stage': 'QEC',
            'history.action': { $in: ['Approve', 'Forward', 'Final Approval'] }
        });

        // Program reviews = Course Outline workflows
        const programReviews = await WorkflowRequest.countDocuments({
            university,
            module: 'Course Outline'
        });

        // ----- REAL COMPLIANCE CALCULATIONS -----

        // 1. OBE Compliance: % of CLOs that met their target
        const attainments = await StudentAttainment.find().lean();
        let obeCompliance = 0;
        if (attainments.length > 0) {
            const allClos = attainments.flatMap(a => a.clos);
            const achieved = allClos.filter(c => c.achieved).length;
            obeCompliance = allClos.length > 0 ? Math.round((achieved / allClos.length) * 100) : 0;
        }

        // 2. Course File Compliance: % of CourseFiles that are Approved or Submitted
        const totalCourseFiles = await CourseFile.countDocuments();
        const completedCourseFiles = await CourseFile.countDocuments({ status: { $in: ['Approved', 'Submitted', 'Under Review'] } });
        const courseFileCompliance = totalCourseFiles > 0 ? Math.round((completedCourseFiles / totalCourseFiles) * 100) : 0;

        // 3. Faculty Compliance: % of teachers with at least one submitted course file
        const activeTeachers = await User.countDocuments({ university, role: 'Teacher', isDeleted: false });
        const teachersWithCourseFiles = await CourseFile.distinct('teacher');
        const facultyCompliance = activeTeachers > 0 ? Math.round((teachersWithCourseFiles.length / activeTeachers) * 100) : 0;

        // 4. Survey Compliance: % of active/closed surveys vs total
        const totalSurveys = await Survey.countDocuments({ university });
        const activeSurveys = await Survey.countDocuments({ university, status: { $in: ['Active', 'Closed'] } });
        const surveyCompliance = totalSurveys > 0 ? Math.round((activeSurveys / totalSurveys) * 100) : 0;

        // ----- REAL ALERTS from pending workflows and low attainments -----
        const alerts = [];
        
        // Pending workflows alert
        if (pendingReviews > 0) {
            alerts.push({ title: `${pendingReviews} Pending QEC Reviews`, desc: 'Workflow requests are awaiting QEC stage approval.', type: 'warning' });
        }

        // Low OBE attainment alert
        if (obeCompliance < 60 && attainments.length > 0) {
            alerts.push({ title: 'Low CLO Attainment Rate', desc: `Only ${obeCompliance}% of CLOs are meeting their targets. Review course delivery.`, type: 'critical' });
        }

        // Low survey compliance
        if (surveyCompliance < 50) {
            alerts.push({ title: 'Low Survey Compliance', desc: `Only ${surveyCompliance}% of surveys are active or complete. Activate pending surveys.`, type: 'warning' });
        }

        // No course files submitted
        if (courseFileCompliance < 30 && totalCourseFiles > 0) {
            alerts.push({ title: 'Course File Submissions Low', desc: `Only ${courseFileCompliance}% of course files have been submitted/approved.`, type: 'critical' });
        }

        // Accreditation progress: composite of all compliance scores
        const avgCompliance = Math.round((obeCompliance + courseFileCompliance + facultyCompliance + surveyCompliance) / 4);

        res.json({
            kpis: {
                pendingReviews,
                approvedReviews,
                accreditationProgress: `${avgCompliance}%`,
                programReviews
            },
            compliance: [
                { name: 'OBE Compliance', score: obeCompliance, status: obeCompliance >= 80 ? 'Excellent' : obeCompliance >= 60 ? 'Good' : 'Needs Improvement', color: obeCompliance >= 80 ? '#50cc7f' : obeCompliance >= 60 ? '#0ff0fc' : '#ff1b6b' },
                { name: 'Course File Compliance', score: courseFileCompliance, status: courseFileCompliance >= 80 ? 'Good' : 'Needs Improvement', color: courseFileCompliance >= 80 ? '#50cc7f' : '#ffcc00' },
                { name: 'Faculty Compliance', score: facultyCompliance, status: facultyCompliance >= 80 ? 'Good' : 'Needs Improvement', color: facultyCompliance >= 80 ? '#0ff0fc' : '#ffcc00' },
                { name: 'Survey Compliance', score: surveyCompliance, status: surveyCompliance >= 70 ? 'Good' : 'Critical', color: surveyCompliance >= 70 ? '#50cc7f' : '#ff1b6b' }
            ],
            alerts: alerts.length > 0 ? alerts : [{ title: 'All Systems Compliant', desc: 'No critical issues detected at this time.', type: 'info' }]
        });
    } catch (error) {
        console.error('Error fetching QEC data:', error);
        res.status(500).json({ message: 'Server error retrieving QEC dashboard data' });
    }
};
