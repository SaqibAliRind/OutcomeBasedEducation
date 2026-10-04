import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/question-mappings`;

const getConfig = (getState) => {
    const { auth: { token } } = getState();
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchMappings = createAsyncThunk('questionMappings/fetch', async (filters = {}, { getState, rejectWithValue }) => {
    try {
        const params = new URLSearchParams(filters).toString();
        const res = await axios.get(`${API}?${params}`, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const createMapping = createAsyncThunk('questionMappings/create', async (payload, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post(API, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const updateMapping = createAsyncThunk('questionMappings/update', async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
        const res = await axios.put(`${API}/${id}`, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const deleteMapping = createAsyncThunk('questionMappings/delete', async (id, { getState, rejectWithValue }) => {
    try {
        await axios.delete(`${API}/${id}`, getConfig(getState));
        return id;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const copyMapping = createAsyncThunk('questionMappings/copy', async (payload, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post(`${API}/copy`, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

const mappingSlice = createSlice({
    name: 'questionMappings',
    initialState: {
        mappings: [],
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearMappingMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMappings.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchMappings.fulfilled, (state, action) => { state.loading = false; state.mappings = action.payload; })
            .addCase(fetchMappings.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(createMapping.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(createMapping.fulfilled, (state, action) => {
                state.loading = false;
                state.mappings.unshift(action.payload);
                state.successMessage = 'Mapping created successfully!';
            })
            .addCase(createMapping.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(updateMapping.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(updateMapping.fulfilled, (state, action) => {
                state.loading = false;
                const idx = state.mappings.findIndex(m => m._id === action.payload._id);
                if (idx !== -1) state.mappings[idx] = action.payload;
                state.successMessage = 'Mapping updated!';
            })
            .addCase(updateMapping.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(deleteMapping.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(deleteMapping.fulfilled, (state, action) => {
                state.loading = false;
                state.mappings = state.mappings.filter(m => m._id !== action.payload);
                state.successMessage = 'Mapping deleted!';
            })
            .addCase(deleteMapping.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(copyMapping.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(copyMapping.fulfilled, (state, action) => {
                state.loading = false;
                state.mappings.unshift(action.payload);
                state.successMessage = 'Mapping copied successfully!';
            })
            .addCase(copyMapping.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

export const { clearMappingMessages } = mappingSlice.actions;
export default mappingSlice.reducer;
