import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/questions`;

const getConfig = (getState) => {
    const { auth: { token } } = getState();
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchQuestions = createAsyncThunk('questions/fetch', async (filters = {}, { getState, rejectWithValue }) => {
    try {
        const params = new URLSearchParams(filters).toString();
        const res = await axios.get(`${API}?${params}`, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const createQuestion = createAsyncThunk('questions/create', async (payload, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post(API, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const updateQuestion = createAsyncThunk('questions/update', async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
        const res = await axios.put(`${API}/${id}`, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const deleteQuestion = createAsyncThunk('questions/delete', async (id, { getState, rejectWithValue }) => {
    try {
        await axios.delete(`${API}/${id}`, getConfig(getState));
        return id;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const approveQuestion = createAsyncThunk('questions/approve', async ({ id, reviewNote }, { getState, rejectWithValue }) => {
    try {
        const res = await axios.put(`${API}/${id}/approve`, { reviewNote }, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const rejectQuestion = createAsyncThunk('questions/reject', async ({ id, reviewNote }, { getState, rejectWithValue }) => {
    try {
        const res = await axios.put(`${API}/${id}/reject`, { reviewNote }, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const importQuestions = createAsyncThunk('questions/import', async (questions, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post(`${API}/import`, { questions }, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

const updateInList = (list, updated) => {
    const idx = list.findIndex(q => q._id === updated._id);
    if (idx !== -1) list[idx] = updated;
};

const questionSlice = createSlice({
    name: 'questions',
    initialState: {
        questions: [],
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearQuestionMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchQuestions.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchQuestions.fulfilled, (state, action) => { state.loading = false; state.questions = action.payload; })
            .addCase(fetchQuestions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(createQuestion.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(createQuestion.fulfilled, (state, action) => {
                state.loading = false;
                state.questions.unshift(action.payload);
                state.successMessage = 'Question created successfully!';
            })
            .addCase(createQuestion.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(updateQuestion.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(updateQuestion.fulfilled, (state, action) => {
                state.loading = false;
                updateInList(state.questions, action.payload);
                state.successMessage = 'Question updated!';
            })
            .addCase(updateQuestion.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(deleteQuestion.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(deleteQuestion.fulfilled, (state, action) => {
                state.loading = false;
                state.questions = state.questions.filter(q => q._id !== action.payload);
                state.successMessage = 'Question deleted!';
            })
            .addCase(deleteQuestion.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(approveQuestion.fulfilled, (state, action) => {
                updateInList(state.questions, action.payload);
                state.successMessage = 'Question approved!';
            })
            .addCase(rejectQuestion.fulfilled, (state, action) => {
                updateInList(state.questions, action.payload);
                state.successMessage = 'Question rejected!';
            })

            .addCase(importQuestions.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(importQuestions.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
            })
            .addCase(importQuestions.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

export const { clearQuestionMessages } = questionSlice.actions;
export default questionSlice.reducer;
