import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getAuthHeader = (getState) => ({
    headers: { Authorization: `Bearer ${getState().auth.token}` }
});

export const fetchRoles = createAsyncThunk('roles/fetch', async (params = {}, { getState, rejectWithValue }) => {
    try {
        const { page = 1, limit = 10, search = '', status = '' } = params;
        const query = new URLSearchParams({ page, limit, ...(search && { search }), ...(status && { status }) }).toString();
        const res = await axios.get(`/api/roles?${query}`, getAuthHeader(getState));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data);
    }
});

export const createRole = createAsyncThunk('roles/create', async (data, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post('/api/roles', data, getAuthHeader(getState));
        return res.data.data;
    } catch (err) {
        return rejectWithValue(err.response?.data);
    }
});

export const updateRole = createAsyncThunk('roles/update', async ({ id, data }, { getState, rejectWithValue }) => {
    try {
        const res = await axios.put(`/api/roles/${id}`, data, getAuthHeader(getState));
        return res.data.data;
    } catch (err) {
        return rejectWithValue(err.response?.data);
    }
});

export const deleteRole = createAsyncThunk('roles/delete', async (id, { getState, rejectWithValue }) => {
    try {
        await axios.delete(`/api/roles/${id}`, getAuthHeader(getState));
        return id;
    } catch (err) {
        return rejectWithValue(err.response?.data);
    }
});

const roleSlice = createSlice({
    name: 'roles',
    initialState: {
        list: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearRoleMessages: (state) => { state.error = null; state.successMessage = null; }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRoles.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchRoles.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchRoles.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })
            .addCase(createRole.fulfilled, (state, action) => {
                state.list.unshift(action.payload);
                state.successMessage = 'Role created successfully';
            })
            .addCase(createRole.rejected, (state, action) => { state.error = action.payload?.message; })
            .addCase(updateRole.fulfilled, (state, action) => {
                const idx = state.list.findIndex(r => r._id === action.payload._id);
                if (idx !== -1) state.list[idx] = action.payload;
                state.successMessage = 'Role updated successfully';
            })
            .addCase(updateRole.rejected, (state, action) => { state.error = action.payload?.message; })
            .addCase(deleteRole.fulfilled, (state, action) => {
                state.list = state.list.filter(r => r._id !== action.payload);
                state.successMessage = 'Role deleted successfully';
            })
            .addCase(deleteRole.rejected, (state, action) => { state.error = action.payload?.message; });
    }
});

export const { clearRoleMessages } = roleSlice.actions;
export default roleSlice.reducer;
