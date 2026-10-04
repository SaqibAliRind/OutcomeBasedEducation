import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchSurveys = createAsyncThunk(
    'surveys/fetchSurveys',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('/api/surveys', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const createSurvey = createAsyncThunk(
    'surveys/createSurvey',
    async (surveyData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post('/api/surveys', surveyData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const updateSurvey = createAsyncThunk(
    'surveys/updateSurvey',
    async ({ id, ...surveyData }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.put(`/api/surveys/${id}`, surveyData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const updateSurveyStatus = createAsyncThunk(
    'surveys/updateSurveyStatus',
    async ({ id, status }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.patch(`/api/surveys/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const deleteSurvey = createAsyncThunk(
    'surveys/deleteSurvey',
    async (id, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/surveys/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const surveySlice = createSlice({
    name: 'surveys',
    initialState: {
        surveys: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchSurveys.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSurveys.fulfilled, (state, action) => {
                state.loading = false;
                state.surveys = action.payload;
            })
            .addCase(fetchSurveys.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create
            .addCase(createSurvey.fulfilled, (state, action) => {
                state.surveys.unshift(action.payload);
            })
            // Update
            .addCase(updateSurvey.fulfilled, (state, action) => {
                const index = state.surveys.findIndex(s => s._id === action.payload._id);
                if (index !== -1) {
                    state.surveys[index] = action.payload;
                }
            })
            // Status Update
            .addCase(updateSurveyStatus.fulfilled, (state, action) => {
                const index = state.surveys.findIndex(s => s._id === action.payload._id);
                if (index !== -1) {
                    state.surveys[index].status = action.payload.status;
                }
            })
            // Delete
            .addCase(deleteSurvey.fulfilled, (state, action) => {
                state.surveys = state.surveys.filter(s => s._id !== action.payload);
            });
    }
});

export default surveySlice.reducer;
