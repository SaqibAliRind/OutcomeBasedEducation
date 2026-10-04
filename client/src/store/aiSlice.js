import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai`;

const getConfig = (getState) => {
    const { auth: { token } } = getState();
    return { headers: { Authorization: `Bearer ${token}` } };
};

const makeThunk = (name, endpoint) => createAsyncThunk(`ai/${name}`, async (payload, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post(`${API}/${endpoint}`, payload, getConfig(getState));
        return { feature: name, data: res.data };
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const aiGenerateQuestion        = makeThunk('generateQuestion',       'generate-question');
export const aiSuggestCLOs             = makeThunk('suggestCLOs',            'suggest-clo');
export const aiSuggestPLOs             = makeThunk('suggestPLOs',            'suggest-plo');
export const aiDetectBTLevel           = makeThunk('detectBTLevel',          'detect-bt-level');
export const aiSuggestActionVerbs      = makeThunk('suggestActionVerbs',     'suggest-action-verbs');
export const aiGenerateBlueprint       = makeThunk('generateBlueprint',      'generate-blueprint');
export const aiGenerateRubric          = makeThunk('generateRubric',         'generate-rubric');
export const aiAnalyzeDifficulty       = makeThunk('analyzeDifficulty',      'analyze-difficulty');
export const aiDetectDuplicate         = makeThunk('detectDuplicate',        'detect-duplicate');
// Student Analytics AI
export const aiPredictAttendance       = makeThunk('predictAttendance',      'predict-attendance');
export const aiDetectAtRisk            = makeThunk('detectAtRisk',           'detect-at-risk');
export const aiPredictGrade            = makeThunk('predictGrade',           'predict-grade');
export const aiPredictGPA              = makeThunk('predictGPA',             'predict-gpa');
export const aiAnalyzePerformance      = makeThunk('analyzePerformance',     'analyze-performance');
export const aiStudentRecommendations  = makeThunk('studentRecommendations', 'student-recommendations');

// Management AI
export const aiSurveyAnalysis          = makeThunk('surveyAnalysis',         'survey-analysis');
export const aiSentimentAnalysis       = makeThunk('sentimentAnalysis',      'sentiment-analysis');
export const aiNotificationSuggestions = makeThunk('notificationSuggestions','notification-suggestions');
export const aiWorkflowDelay           = makeThunk('workflowDelay',          'workflow-delay');
export const aiAutoReminder            = makeThunk('autoReminder',           'auto-reminder');
export const aiQualityScore            = makeThunk('qualityScore',           'quality-score');
export const aiQECRecommendations      = makeThunk('qecRecommendations',     'qec-recommendations');
export const aiAccreditationChecklist  = makeThunk('accreditationChecklist', 'accreditation-checklist');

// Teaching AI
export const aiGenerateLectureNotes    = makeThunk('generateLectureNotes',   'generate-lecture-notes');
export const aiGeneratePPTOutline      = makeThunk('generatePPTOutline',     'generate-ppt-outline');
export const aiGenerateQuiz            = makeThunk('generateQuiz',           'generate-quiz');
export const aiGenerateAssignment      = makeThunk('generateAssignment',     'generate-assignment');
export const aiGenerateProgrammingQuestion = makeThunk('generateProgrammingQuestion', 'generate-programming-question');
export const aiGenerateLabManual       = makeThunk('generateLabManual',      'generate-lab-manual');

const aiSlice = createSlice({
    name: 'ai',
    initialState: {
        loading: false,
        result: null,
        error: null,
        feature: null    // tracks which feature produced the current result
    },
    reducers: {
        clearAI: (state) => {
            state.loading = false;
            state.result = null;
            state.error = null;
            state.feature = null;
        }
    },
    extraReducers: (builder) => {
        const allThunks = [
            aiGenerateQuestion, aiSuggestCLOs, aiSuggestPLOs, aiDetectBTLevel,
            aiSuggestActionVerbs, aiGenerateBlueprint, aiGenerateRubric,
            aiAnalyzeDifficulty, aiDetectDuplicate,
            aiPredictAttendance, aiDetectAtRisk, aiPredictGrade,
            aiPredictGPA, aiAnalyzePerformance, aiStudentRecommendations,
            aiSurveyAnalysis, aiSentimentAnalysis, aiNotificationSuggestions,
            aiWorkflowDelay, aiAutoReminder, aiQualityScore, aiQECRecommendations,
            aiAccreditationChecklist,
            aiGenerateLectureNotes, aiGeneratePPTOutline, aiGenerateQuiz,
            aiGenerateAssignment, aiGenerateProgrammingQuestion, aiGenerateLabManual
        ];
        allThunks.forEach(thunk => {
            builder
                .addCase(thunk.pending, (state) => {
                    state.loading = true;
                    state.error = null;
                    state.result = null;
                })
                .addCase(thunk.fulfilled, (state, action) => {
                    state.loading = false;
                    state.result = action.payload.data;
                    state.feature = action.payload.feature;
                })
                .addCase(thunk.rejected, (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                });
        });
    }
});

export const { clearAI } = aiSlice.actions;
export default aiSlice.reducer;
