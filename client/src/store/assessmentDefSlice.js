import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/assessments-def`;

const getConfig = (getState) => {
    const { auth: { token } } = getState();
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const fetchAssessments = createAsyncThunk('assessmentsDef/fetch', async (filters = {}, { getState, rejectWithValue }) => {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const res = await axios.get(`${API}?${queryParams}`, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const createAssessment = createAsyncThunk('assessmentsDef/create', async (payload, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post(API, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const updateAssessment = createAsyncThunk('assessmentsDef/update', async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
        const res = await axios.put(`${API}/${id}`, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const deleteAssessment = createAsyncThunk('assessmentsDef/delete', async (id, { getState, rejectWithValue }) => {
    try {
        await axios.delete(`${API}/${id}`, getConfig(getState));
        return id;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

const assessmentDefSlice = createSlice({
    name: 'assessmentDef',
    initialState: {
        assessments: [],
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearAssessmentDefMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAssessments.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAssessments.fulfilled, (state, action) => { state.loading = false; state.assessments = action.payload; })
            .addCase(fetchAssessments.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            .addCase(createAssessment.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(createAssessment.fulfilled, (state, action) => {
                state.loading = false;
                state.assessments.unshift(action.payload);
                state.successMessage = 'Assessment created successfully!';
            })
            .addCase(createAssessment.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            .addCase(updateAssessment.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(updateAssessment.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.assessments.findIndex(a => a._id === action.payload._id);
                if (index !== -1) state.assessments[index] = action.payload;
                state.successMessage = 'Assessment updated successfully!';
            })
            .addCase(updateAssessment.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            .addCase(deleteAssessment.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(deleteAssessment.fulfilled, (state, action) => {
                state.loading = false;
                state.assessments = state.assessments.filter(a => a._id !== action.payload);
                state.successMessage = 'Assessment deleted successfully!';
            })
            .addCase(deleteAssessment.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

export const { clearAssessmentDefMessages } = assessmentDefSlice.actions;
export default assessmentDefSlice.reducer;
