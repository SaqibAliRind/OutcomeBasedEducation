import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const submitMarks = createAsyncThunk('marks/submitMarks', async (data, thunkAPI) => {
    try {
        const { auth } = thunkAPI.getState();
        const config = { headers: { Authorization: `Bearer ${auth.token}` } };
        const response = await axios.post('/api/marks/submit', data, config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const fetchMarks = createAsyncThunk('marks/fetchMarks', async (params, thunkAPI) => {
    try {
        const { auth } = thunkAPI.getState();
        const config = { headers: { Authorization: `Bearer ${auth.token}` }, params };
        const response = await axios.get('/api/marks', config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const fetchMarksStats = createAsyncThunk('marks/fetchMarksStats', async (_, thunkAPI) => {
    try {
        const { auth } = thunkAPI.getState();
        const config = { headers: { Authorization: `Bearer ${auth.token}` } };
        const response = await axios.get('/api/marks/stats', config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const fetchMarksReports = createAsyncThunk('marks/fetchMarksReports', async (groupBy, thunkAPI) => {
    try {
        const { auth } = thunkAPI.getState();
        const config = { headers: { Authorization: `Bearer ${auth.token}` }, params: { groupBy } };
        const response = await axios.get('/api/marks/reports', config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const updateMarkStatus = createAsyncThunk('marks/updateMarkStatus', async ({ id, status }, thunkAPI) => {
    try {
        const { auth } = thunkAPI.getState();
        const config = { headers: { Authorization: `Bearer ${auth.token}` } };
        const response = await axios.patch(`/api/marks/${id}/status`, { status }, config);
        return response.data.record;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

const markSlice = createSlice({
    name: 'marks',
    initialState: {
        records: [],
        stats: null,
        reports: [],
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearMarkMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Submit Marks
            .addCase(submitMarks.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(submitMarks.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.records.findIndex(r => r._id === action.payload._id);
                if (index !== -1) {
                    state.records[index] = action.payload;
                } else {
                    state.records.unshift(action.payload);
                }
                state.successMessage = `Marks ${action.payload.status === 'Draft' ? 'saved as draft' : 'submitted successfully'}`;
            })
            .addCase(submitMarks.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            // Fetch Marks
            .addCase(fetchMarks.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchMarks.fulfilled, (state, action) => { state.loading = false; state.records = action.payload; })
            .addCase(fetchMarks.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            // Fetch Stats
            .addCase(fetchMarksStats.pending, (state) => { state.error = null; })
            .addCase(fetchMarksStats.fulfilled, (state, action) => { state.stats = action.payload; })
            
            // Fetch Reports
            .addCase(fetchMarksReports.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchMarksReports.fulfilled, (state, action) => { state.loading = false; state.reports = action.payload; })
            .addCase(fetchMarksReports.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            // Update Status
            .addCase(updateMarkStatus.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(updateMarkStatus.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.records.findIndex(r => r._id === action.payload._id);
                if (index !== -1) {
                    state.records[index] = action.payload;
                }
                state.successMessage = `Marks status updated to ${action.payload.status}`;
                if (state.stats) {
                    // Quick stat refresh simulation (will be accurate on re-fetch anyway)
                    state.stats.Verified += action.payload.status === 'Verified' ? 1 : 0;
                    state.stats.Locked += action.payload.status === 'Locked' ? 1 : 0;
                }
            })
            .addCase(updateMarkStatus.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

export const { clearMarkMessages } = markSlice.actions;
export default markSlice.reducer;
