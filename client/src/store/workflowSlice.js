import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getHeaders = (getState) => {
    const { auth: { token } } = getState();
    return { Authorization: `Bearer ${token}` };
};

export const fetchWorkflowRequests = createAsyncThunk(
    'workflow/fetchAll',
    async (params = {}, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            if (user && user.role === 'HOD' && user.department) {
                params.department = user.department;
            } else if (user && user.role === 'ProgramCoordinator' && user.program) {
                params.program = user.program;
            }
            const query = new URLSearchParams(params).toString();
            const { data } = await axios.get(`/api/workflow?${query}`, { headers: getHeaders(getState) });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchWorkflowStats = createAsyncThunk(
    'workflow/fetchStats',
    async (params = {}, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            if (user && user.role === 'HOD' && user.department) {
                params.department = user.department;
            } else if (user && user.role === 'ProgramCoordinator' && user.program) {
                params.program = user.program;
            }
            const query = new URLSearchParams(params).toString();
            const { data } = await axios.get(`/api/workflow/stats?${query}`, { headers: getHeaders(getState) });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const submitWorkflowRequest = createAsyncThunk(
    'workflow/submit',
    async (requestData, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.post('/api/workflow', requestData, { headers: getHeaders(getState) });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const actionWorkflowRequest = createAsyncThunk(
    'workflow/action',
    async ({ id, actionData }, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.put(`/api/workflow/${id}/action`, actionData, { headers: getHeaders(getState) });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const deleteWorkflowRequest = createAsyncThunk(
    'workflow/delete',
    async (id, { getState, rejectWithValue }) => {
        try {
            await axios.delete(`/api/workflow/${id}`, { headers: getHeaders(getState) });
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const workflowSlice = createSlice({
    name: 'workflow',
    initialState: {
        requests: [],
        total: 0,
        pages: 1,
        stats: {},
        loading: false,
        statsLoading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearWorkflowMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchWorkflowRequests.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchWorkflowRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.requests = action.payload.requests;
                state.total = action.payload.total;
                state.pages = action.payload.pages;
            })
            .addCase(fetchWorkflowRequests.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            // Stats
            .addCase(fetchWorkflowStats.pending, (state) => { state.statsLoading = true; })
            .addCase(fetchWorkflowStats.fulfilled, (state, action) => { state.statsLoading = false; state.stats = action.payload; })
            .addCase(fetchWorkflowStats.rejected, (state) => { state.statsLoading = false; })
            
            // Submit
            .addCase(submitWorkflowRequest.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(submitWorkflowRequest.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = 'Workflow request submitted successfully!';
                state.requests.unshift(action.payload);
                state.total += 1;
            })
            .addCase(submitWorkflowRequest.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            // Action
            .addCase(actionWorkflowRequest.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(actionWorkflowRequest.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = 'Action applied successfully!';
                const idx = state.requests.findIndex(r => r._id === action.payload._id);
                if (idx !== -1) state.requests[idx] = action.payload;
            })
            .addCase(actionWorkflowRequest.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            // Delete
            .addCase(deleteWorkflowRequest.fulfilled, (state, action) => {
                state.requests = state.requests.filter(r => r._id !== action.payload);
                state.total -= 1;
                state.successMessage = 'Workflow removed.';
            });
    }
});

export const { clearWorkflowMessages } = workflowSlice.actions;
export default workflowSlice.reducer;
