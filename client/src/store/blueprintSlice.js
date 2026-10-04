import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/blueprints`;

const getConfig = (getState) => {
    const { auth: { token } } = getState();
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchBlueprints = createAsyncThunk('blueprints/fetch', async (filters = {}, { getState, rejectWithValue }) => {
    try {
        const params = new URLSearchParams(filters).toString();
        const res = await axios.get(`${API}?${params}`, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const createBlueprint = createAsyncThunk('blueprints/create', async (payload, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post(API, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const updateBlueprint = createAsyncThunk('blueprints/update', async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
        const res = await axios.put(`${API}/${id}`, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const deleteBlueprint = createAsyncThunk('blueprints/delete', async (id, { getState, rejectWithValue }) => {
    try {
        await axios.delete(`${API}/${id}`, getConfig(getState));
        return id;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const copyBlueprint = createAsyncThunk('blueprints/copy', async (payload, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post(`${API}/copy`, payload, getConfig(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

const blueprintSlice = createSlice({
    name: 'blueprints',
    initialState: {
        blueprints: [],
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearBlueprintMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBlueprints.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchBlueprints.fulfilled, (state, action) => { state.loading = false; state.blueprints = action.payload; })
            .addCase(fetchBlueprints.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(createBlueprint.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(createBlueprint.fulfilled, (state, action) => {
                state.loading = false;
                state.blueprints.unshift(action.payload);
                state.successMessage = 'Blueprint created successfully!';
            })
            .addCase(createBlueprint.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(updateBlueprint.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(updateBlueprint.fulfilled, (state, action) => {
                state.loading = false;
                const idx = state.blueprints.findIndex(m => m._id === action.payload._id);
                if (idx !== -1) state.blueprints[idx] = action.payload;
                state.successMessage = 'Blueprint updated!';
            })
            .addCase(updateBlueprint.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(deleteBlueprint.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(deleteBlueprint.fulfilled, (state, action) => {
                state.loading = false;
                state.blueprints = state.blueprints.filter(m => m._id !== action.payload);
                state.successMessage = 'Blueprint deleted!';
            })
            .addCase(deleteBlueprint.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(copyBlueprint.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(copyBlueprint.fulfilled, (state, action) => {
                state.loading = false;
                state.blueprints.unshift(action.payload);
                state.successMessage = 'Blueprint copied successfully!';
            })
            .addCase(copyBlueprint.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

export const { clearBlueprintMessages } = blueprintSlice.actions;
export default blueprintSlice.reducer;
