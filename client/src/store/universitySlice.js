import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Create University
export const createUniversity = createAsyncThunk('universities/create', async (data, { getState }) => {
    const { token } = getState().auth;
    const res = await axios.post('/api/universities', data, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.data;
});

// Fetch Universities
export const fetchUniversities = createAsyncThunk('universities/fetchAll', async (_, { getState }) => {
    const { token } = getState().auth;
    const res = await axios.get('/api/universities', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.data;
});

// Update University
export const updateUniversity = createAsyncThunk('universities/update', async ({ id, data }, { getState }) => {
    const { token } = getState().auth;
    const res = await axios.put(`/api/universities/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return res.data;
});

// Delete University
export const deleteUniversity = createAsyncThunk('universities/delete', async ({ id, permanent }, { getState }) => {
    const { token } = getState().auth;
    const url = `/api/universities/${id}${permanent ? '?permanent=true' : ''}`;
    await axios.delete(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return id;
});

// Slice Setup
const universitySlice = createSlice({
    name: 'university',
    initialState: { list: [], loading: false, error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Create
            .addCase(createUniversity.pending, (state) => {
                state.loading = true;
            })
            .addCase(createUniversity.fulfilled, (state, action) => {
                state.loading = false;
                // Add the new university object (from payload.data) into the list
                if (action.payload?.data) {
                    state.list.unshift(action.payload.data);
                }
            })
            .addCase(createUniversity.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch
            .addCase(fetchUniversities.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUniversities.fulfilled, (state, action) => {
                state.loading = false;
                // Map the array of universities (from payload.data)
                state.list = action.payload?.data || [];
            })
            .addCase(fetchUniversities.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Update
            .addCase(updateUniversity.fulfilled, (state, action) => {
                if (action.payload?.data) {
                    const idx = state.list.findIndex(uni => uni._id === action.payload.data._id);
                    if (idx !== -1) {
                        state.list[idx] = action.payload.data;
                    }
                }
            })
            // Delete
            .addCase(deleteUniversity.fulfilled, (state, action) => {
                state.list = state.list.filter(uni => uni._id !== action.payload);
            });
    }
});

export default universitySlice.reducer;