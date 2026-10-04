import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/assessments`;

const getConfig = (getState) => {
    const { auth: { token } } = getState();
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchAssessmentSettings = createAsyncThunk('assessment/fetch', async (programId, { getState, rejectWithValue }) => {
    try {
        const url = programId ? `${API_URL}?program=${programId}` : API_URL;
        const res = await axios.get(url, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const createAssessmentSetting = createAsyncThunk('assessment/create', async (payload, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post(API_URL, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const updateAssessmentSetting = createAsyncThunk('assessment/update', async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
        const res = await axios.put(`${API_URL}/${id}`, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const deleteAssessmentSetting = createAsyncThunk('assessment/delete', async (id, { getState, rejectWithValue }) => {
    try {
        await axios.delete(`${API_URL}/${id}`, getConfig(getState));
        return id;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

const assessmentSlice = createSlice({
    name: 'assessment',
    initialState: {
        settings: [],
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearAssessmentMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAssessmentSettings.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAssessmentSettings.fulfilled, (state, action) => { state.loading = false; state.settings = action.payload; })
            .addCase(fetchAssessmentSettings.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(createAssessmentSetting.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(createAssessmentSetting.fulfilled, (state, action) => {
                state.loading = false;
                state.settings.push(action.payload);
                state.successMessage = 'Assessment Setting created successfully!';
            })
            .addCase(createAssessmentSetting.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(updateAssessmentSetting.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(updateAssessmentSetting.fulfilled, (state, action) => {
                state.loading = false;
                const idx = state.settings.findIndex(s => s._id === action.payload._id);
                if (idx !== -1) state.settings[idx] = action.payload;
                state.successMessage = 'Assessment Setting updated successfully!';
            })
            .addCase(updateAssessmentSetting.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(deleteAssessmentSetting.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(deleteAssessmentSetting.fulfilled, (state, action) => {
                state.loading = false;
                state.settings = state.settings.filter(s => s._id !== action.payload);
                state.successMessage = 'Assessment Setting deleted successfully!';
            })
            .addCase(deleteAssessmentSetting.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

export const { clearAssessmentMessages } = assessmentSlice.actions;
export default assessmentSlice.reducer;
