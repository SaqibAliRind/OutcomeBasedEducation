import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import dashboardReducer from './dashboardSlice';
import usersReducer from './userSlice';
import universityReducer from './universitySlice';
import adminReducer from './adminSlice';
import academicReducer from './academicSlice';
import roleReducer from './roleSlice';
import settingsReducer from './settingsSlice';
import logsReducer from './logsSlice';
import reportsReducer from './reportsSlice';
import teacherProfileReducer from './teacherProfileSlice';
import assignmentReducer from './assignmentSlice';
import studentProfileReducer from './studentProfileSlice';
import admissionReducer from './admissionSlice';
import enrollmentReducer from './enrollmentSlice';
import semesterRegReducer from './semesterRegSlice';
import academicRecordReducer from './academicRecordSlice';
import curriculumReducer from './curriculumSlice';
import obeReducer from './obeSlice';
import assessmentReducer from './assessmentSlice';
import notificationReducer from './notificationSlice';
import workflowReducer from './workflowSlice';
import assessmentDefReducer from './assessmentDefSlice';
import questionReducer from './questionSlice';
import questionMappingReducer from './questionMappingSlice';
import blueprintReducer from './blueprintSlice';
import rubricReducer from './rubricSlice';
import aiReducer from './aiSlice';
import attendanceReducer from './attendanceSlice';
import markReducer from './markSlice';
import surveyReducer from './surveySlice';
import qecReducer from './qecSlice';
import archiveReducer from './archiveSlice';
import profileReducer from './profileSlice';
import uniSettingsReducer from './uniSettingsSlice';
import emailTemplatesReducer from './emailTemplatesSlice';
import deanReducer from './deanSlice';
import hodReducer from './hodSlice';
import teacherDashReducer from './teacherDashSlice';
import studentDashReducer from './studentDashSlice';
import coordinatorDashReducer from './coordinatorDashSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        dashboard: dashboardReducer,
        users: usersReducer,
        university: universityReducer,
        admin: adminReducer,
        academic: academicReducer,
        roles: roleReducer,
        settings: settingsReducer,
        logs: logsReducer,
        reports: reportsReducer,
        teacherProfile: teacherProfileReducer,
        assignments: assignmentReducer,
        studentProfile: studentProfileReducer,
        admission: admissionReducer,
        enrollment: enrollmentReducer,
        semesterReg: semesterRegReducer,
        academicRecord: academicRecordReducer,
        curriculum: curriculumReducer,
        obe: obeReducer,
        assessment: assessmentReducer,
        notifications: notificationReducer,
        workflow: workflowReducer,
        assessmentDef: assessmentDefReducer,
        questions: questionReducer,
        questionMappings: questionMappingReducer,
        blueprints: blueprintReducer,
        rubrics: rubricReducer,
        ai: aiReducer,
        attendance: attendanceReducer,
        marks: markReducer,
        surveys: surveyReducer,
        qec: qecReducer,
        archive: archiveReducer,
        profile: profileReducer,
        uniSettings: uniSettingsReducer,
        emailTemplates: emailTemplatesReducer,
        dean: deanReducer,
        hod: hodReducer,
        teacherDash: teacherDashReducer,
        studentDash: studentDashReducer,
        coordinatorDash: coordinatorDashReducer
    }
});

export default store;
