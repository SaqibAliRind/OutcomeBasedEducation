import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rubrics`;

const getConfig = (getState) => {
    const { auth: { token } } = getState();
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchRubrics = createAsyncThunk('rubrics/fetch', async (filters = {}, { getState, rejectWithValue }) => {
    try {
        const params = new URLSearchParams(filters).toString();
        const res = await axios.get(`${API}?${params}`, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const createRubric = createAsyncThunk('rubrics/create', async (payload, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post(API, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const updateRubric = createAsyncThunk('rubrics/update', async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
        const res = await axios.put(`${API}/${id}`, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const deleteRubric = createAsyncThunk('rubrics/delete', async (id, { getState, rejectWithValue }) => {
    try {
        await axios.delete(`${API}/${id}`, getConfig(getState));
        return id;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const copyRubric = createAsyncThunk('rubrics/copy', async (payload, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post(`${API}/copy`, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

const rubricSlice = createSlice({
    name: 'rubrics',
    initialState: {
        rubrics: [],
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearRubricMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRubrics.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchRubrics.fulfilled, (state, action) => { state.loading = false; state.rubrics = action.payload; })
            .addCase(fetchRubrics.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(createRubric.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(createRubric.fulfilled, (state, action) => {
                state.loading = false;
                state.rubrics.unshift(action.payload);
                state.successMessage = 'Rubric created successfully!';
            })
            .addCase(createRubric.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(updateRubric.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(updateRubric.fulfilled, (state, action) => {
                state.loading = false;
                const idx = state.rubrics.findIndex(m => m._id === action.payload._id);
                if (idx !== -1) state.rubrics[idx] = action.payload;
                state.successMessage = 'Rubric updated!';
            })
            .addCase(updateRubric.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(deleteRubric.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(deleteRubric.fulfilled, (state, action) => {
                state.loading = false;
                state.rubrics = state.rubrics.filter(m => m._id !== action.payload);
                state.successMessage = 'Rubric deleted!';
            })
            .addCase(deleteRubric.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(copyRubric.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(copyRubric.fulfilled, (state, action) => {
                state.loading = false;
                state.rubrics.unshift(action.payload);
                state.successMessage = 'Rubric copied successfully!';
            })
            .addCase(copyRubric.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

export const { clearRubricMessages } = rubricSlice.actions;
export default rubricSlice.reducer;
