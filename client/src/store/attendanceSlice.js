import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/attendance';

export const fetchAttendance = createAsyncThunk('attendance/fetchAttendance', async (filters, { getState, rejectWithValue }) => {
    try {
        const { auth: { token } } = getState();
        const config = { headers: { Authorization: `Bearer ${token}` }, params: filters };
        const response = await axios.get(API_URL, config);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const fetchAttendanceStats = createAsyncThunk('attendance/fetchAttendanceStats', async (_, { getState, rejectWithValue }) => {
    try {
        const { auth: { token } } = getState();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_URL}/stats`, config);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const fetchAttendanceReports = createAsyncThunk('attendance/fetchAttendanceReports', async (filters, { getState, rejectWithValue }) => {
    try {
        const { auth: { token } } = getState();
        const config = { headers: { Authorization: `Bearer ${token}` }, params: filters };
        const response = await axios.get(`${API_URL}/reports`, config);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const approveAttendanceRecord = createAsyncThunk('attendance/approveAttendanceRecord', async ({ id, status }, { getState, rejectWithValue }) => {
    try {
        const { auth: { token } } = getState();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.patch(`${API_URL}/${id}/approve`, { status }, config);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const fetchAttendanceAnalytics = createAsyncThunk('attendance/fetchAttendanceAnalytics', async (groupBy, { getState, rejectWithValue }) => {
    try {
        const { auth: { token } } = getState();
        const config = { headers: { Authorization: `Bearer ${token}` }, params: { groupBy } };
        const response = await axios.get(`${API_URL}/analytics`, config);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const fetchDetailedReports = createAsyncThunk('attendance/fetchDetailedReports', async (type, { getState, rejectWithValue }) => {
    try {
        const { auth: { token } } = getState();
        const config = { headers: { Authorization: `Bearer ${token}` }, params: { type } };
        const response = await axios.get(`${API_URL}/detailed-reports`, config);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const sendAttendanceAlerts = createAsyncThunk('attendance/sendAttendanceAlerts', async (payload, { getState, rejectWithValue }) => {
    try {
        const { auth: { token } } = getState();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post(`${API_URL}/alerts`, payload, config);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const markAttendance = createAsyncThunk('attendance/markAttendance', async (payload, { getState, rejectWithValue }) => {
    try {
        const { auth: { token } } = getState();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post(API_URL, payload, config);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

const attendanceSlice = createSlice({
    name: 'attendance',
    initialState: {
        records: [],
        stats: null,
        reports: [],
        analytics: [],
        detailedReports: [],
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearAttendanceMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch records
            .addCase(fetchAttendance.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAttendance.fulfilled, (state, action) => { state.loading = false; state.records = action.payload; })
            .addCase(fetchAttendance.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            // Fetch stats
            .addCase(fetchAttendanceStats.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAttendanceStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
            .addCase(fetchAttendanceStats.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            // Fetch reports
            .addCase(fetchAttendanceReports.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAttendanceReports.fulfilled, (state, action) => { state.loading = false; state.reports = action.payload; })
            .addCase(fetchAttendanceReports.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            // Fetch analytics
            .addCase(fetchAttendanceAnalytics.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAttendanceAnalytics.fulfilled, (state, action) => { state.loading = false; state.analytics = action.payload; })
            .addCase(fetchAttendanceAnalytics.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            // Fetch detailed reports
            .addCase(fetchDetailedReports.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchDetailedReports.fulfilled, (state, action) => { state.loading = false; state.detailedReports = action.payload; })
            .addCase(fetchDetailedReports.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            // Send Alerts
            .addCase(sendAttendanceAlerts.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(sendAttendanceAlerts.fulfilled, (state, action) => { state.loading = false; state.successMessage = action.payload.message; })
            .addCase(sendAttendanceAlerts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            // Mark attendance
            .addCase(markAttendance.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(markAttendance.fulfilled, (state, action) => { 
                state.loading = false; 
                state.successMessage = 'Attendance saved successfully';
                const existingIndex = state.records.findIndex(r => r._id === action.payload._id);
                if (existingIndex >= 0) {
                    state.records[existingIndex] = action.payload;
                } else {
                    state.records.unshift(action.payload);
                }
            })
            .addCase(markAttendance.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            // Approve attendance
            .addCase(approveAttendanceRecord.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(approveAttendanceRecord.fulfilled, (state, action) => { 
                state.loading = false; 
                state.successMessage = action.payload.message;
                const existingIndex = state.records.findIndex(r => r._id === action.payload.record._id);
                if (existingIndex >= 0) {
                    state.records[existingIndex] = action.payload.record;
                }
            })
            .addCase(approveAttendanceRecord.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

export const { clearAttendanceMessages } = attendanceSlice.actions;
export default attendanceSlice.reducer;
