import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk to fetch reports
const getConfig = (getState) => {
    const { auth: { token } } = getState();
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchSystemReports = createAsyncThunk(
    'reports/fetchSystemReports',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.get('/api/reports/system', getConfig(getState));
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchAcademicReports = createAsyncThunk(
    'reports/fetchAcademicReports',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.get('/api/reports/academic', getConfig(getState));
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchObeReports = createAsyncThunk(
    'reports/fetchObeReports',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.get('/api/reports/obe', getConfig(getState));
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchAttendanceReports = createAsyncThunk(
    'reports/fetchAttendanceReports',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.get('/api/reports/attendance', getConfig(getState));
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchMarksReports = createAsyncThunk(
    'reports/fetchMarksReports',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.get('/api/reports/marks', getConfig(getState));
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchAccreditationReports = createAsyncThunk(
    'reports/fetchAccreditationReports',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.get('/api/reports/accreditation', getConfig(getState));
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Async thunk to mock AI Usage increment
export const logAiUsage = createAsyncThunk(
    'reports/logAiUsage',
    async (payload, { getState, rejectWithValue }) => {
        try {
            const cfg = { ...getConfig(getState), headers: { ...getConfig(getState).headers, 'Content-Type': 'application/json' } };
            const { data } = await axios.post('/api/reports/ai-usage', payload, cfg);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message
            );
        }
    }
);

const initialState = {
    data: null,
    academic: null,
    obe: null,
    attendance: null,
    marks: null,
    accreditation: null,
    loading: false,
    error: null,
};

const reportsSlice = createSlice({
    name: 'reports',
    initialState,
    reducers: {
        clearReportsError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSystemReports.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchSystemReports.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
            .addCase(fetchSystemReports.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            .addCase(fetchAcademicReports.pending, (state) => { state.loading = true; })
            .addCase(fetchAcademicReports.fulfilled, (state, action) => { state.loading = false; state.academic = action.payload; })
            .addCase(fetchAcademicReports.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            .addCase(fetchObeReports.pending, (state) => { state.loading = true; })
            .addCase(fetchObeReports.fulfilled, (state, action) => { state.loading = false; state.obe = action.payload; })
            .addCase(fetchObeReports.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            .addCase(fetchAttendanceReports.pending, (state) => { state.loading = true; })
            .addCase(fetchAttendanceReports.fulfilled, (state, action) => { state.loading = false; state.attendance = action.payload; })
            .addCase(fetchAttendanceReports.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            .addCase(fetchMarksReports.pending, (state) => { state.loading = true; })
            .addCase(fetchMarksReports.fulfilled, (state, action) => { state.loading = false; state.marks = action.payload; })
            .addCase(fetchMarksReports.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            .addCase(fetchAccreditationReports.pending, (state) => { state.loading = true; })
            .addCase(fetchAccreditationReports.fulfilled, (state, action) => { state.loading = false; state.accreditation = action.payload; })
            .addCase(fetchAccreditationReports.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(logAiUsage.fulfilled, (state) => {
                // Not altering state immediately to let fetchSystemReports handle fresh data
            });
    },
});

export const { clearReportsError } = reportsSlice.actions;
export default reportsSlice.reducer;
