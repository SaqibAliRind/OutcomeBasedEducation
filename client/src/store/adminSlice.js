import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getAuthHeader = (getState) => ({
    headers: { Authorization: `Bearer ${getState().auth.token}` }
});

// ── Thunks ──────────────────────────────────────────────────
export const fetchUniversityAdmins = createAsyncThunk(
    'admin/fetchAll',
    async (params = {}, { getState, rejectWithValue }) => {
        try {
            const { page = 1, limit = 10, search = '' } = params;
            const query = new URLSearchParams({ page, limit, ...(search && { search }) }).toString();
            const res = await axios.get(`/api/admins/university-admin?${query}`, getAuthHeader(getState));
            return res.data;
        } catch (err) { return rejectWithValue(err.response?.data); }
    }
);

export const createUniversityAdmin = createAsyncThunk(
    'admin/create',
    async (data, { getState, rejectWithValue }) => {
        try {
            const res = await axios.post('/api/admins/university-admin', data, getAuthHeader(getState));
            return res.data.data;
        } catch (err) { return rejectWithValue(err.response?.data); }
    }
);

export const updateUniversityAdmin = createAsyncThunk(
    'admin/update',
    async ({ id, data }, { getState, rejectWithValue }) => {
        try {
            const res = await axios.put(`/api/admins/university-admin/${id}`, data, getAuthHeader(getState));
            return res.data.data;
        } catch (err) { return rejectWithValue(err.response?.data); }
    }
);

export const deleteUniversityAdmin = createAsyncThunk(
    'admin/delete',
    async (id, { getState, rejectWithValue }) => {
        try {
            await axios.delete(`/api/admins/university-admin/${id}`, getAuthHeader(getState));
            return id;
        } catch (err) { return rejectWithValue(err.response?.data); }
    }
);

export const resetAdminPassword = createAsyncThunk(
    'admin/resetPassword',
    async (id, { getState, rejectWithValue }) => {
        try {
            const res = await axios.put(`/api/admins/university-admin/${id}/reset-password`, {}, getAuthHeader(getState));
            return res.data;
        } catch (err) { return rejectWithValue(err.response?.data); }
    }
);

export const toggleAdminStatus = createAsyncThunk(
    'admin/toggleStatus',
    async (id, { getState, rejectWithValue }) => {
        try {
            const res = await axios.patch(`/api/admins/university-admin/${id}/status`, {}, getAuthHeader(getState));
            return { id, isActive: res.data.isActive };
        } catch (err) { return rejectWithValue(err.response?.data); }
    }
);

// ── Slice ────────────────────────────────────────────────────
const adminSlice = createSlice({
    name: 'admin',
    initialState: {
        admins: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
        loading: false,
        error: null,
        successMessage: null,
        tempPassword: null
    },
    reducers: {
        clearAdminMessages: (state) => {
            state.error = null;
            state.successMessage = null;
            state.tempPassword = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchUniversityAdmins.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchUniversityAdmins.fulfilled, (state, action) => {
                state.loading = false;
                state.admins = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchUniversityAdmins.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })
            // Create
            .addCase(createUniversityAdmin.pending, (state) => { state.loading = true; })
            .addCase(createUniversityAdmin.fulfilled, (state, action) => {
                state.loading = false;
                state.admins.unshift(action.payload);
                state.successMessage = 'Admin created successfully';
            })
            .addCase(createUniversityAdmin.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })
            // Update
            .addCase(updateUniversityAdmin.fulfilled, (state, action) => {
                const idx = state.admins.findIndex(a => a._id === action.payload._id);
                if (idx !== -1) state.admins[idx] = action.payload;
                state.successMessage = 'Admin updated successfully';
            })
            .addCase(updateUniversityAdmin.rejected, (state, action) => { state.error = action.payload?.message; })
            // Delete
            .addCase(deleteUniversityAdmin.fulfilled, (state, action) => {
                state.admins = state.admins.filter(a => a._id !== action.payload);
                state.successMessage = 'Admin removed successfully';
            })
            .addCase(deleteUniversityAdmin.rejected, (state, action) => { state.error = action.payload?.message; })
            // Reset password
            .addCase(resetAdminPassword.fulfilled, (state, action) => {
                state.tempPassword = action.payload.tempPassword;
                state.successMessage = 'Temporary password generated';
            })
            .addCase(resetAdminPassword.rejected, (state, action) => { state.error = action.payload?.message; })
            // Toggle status
            .addCase(toggleAdminStatus.fulfilled, (state, action) => {
                const idx = state.admins.findIndex(a => a._id === action.payload.id);
                if (idx !== -1) state.admins[idx].isActive = action.payload.isActive;
            })
            .addCase(toggleAdminStatus.rejected, (state, action) => { state.error = action.payload?.message; });
    }
});

export const { clearAdminMessages } = adminSlice.actions;
export default adminSlice.reducer;