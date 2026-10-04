import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Get config with auth token
const getConfig = (thunkAPI) => {
    const token = thunkAPI.getState().auth.token;
    return { headers: { Authorization: `Bearer ${token}` } };
};

// Async Thunks
export const fetchUsers = createAsyncThunk('users/fetchUsers', async (_, thunkAPI) => {
    try {
        const { data } = await axios.get('/api/users', getConfig(thunkAPI));
        return data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const createUser = createAsyncThunk('users/createUser', async (userData, thunkAPI) => {
    try {
        const { data } = await axios.post('/api/users', userData, getConfig(thunkAPI));
        return data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const importUsers = createAsyncThunk('users/importUsers', async (usersData, thunkAPI) => {
    try {
        const { data } = await axios.post('/api/users/bulk', usersData, getConfig(thunkAPI));
        return data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const updateUser = createAsyncThunk('users/updateUser', async ({ id, userData }, thunkAPI) => {
    try {
        const { data } = await axios.put(`/api/users/${id}`, userData, getConfig(thunkAPI));
        return data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const deleteUser = createAsyncThunk('users/deleteUser', async (id, thunkAPI) => {
    try {
        await axios.delete(`/api/users/${id}`, getConfig(thunkAPI));
        return id;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const toggleUserStatus = createAsyncThunk('users/toggleUserStatus', async (id, thunkAPI) => {
    try {
        const { data } = await axios.put(`/api/users/${id}/status`, {}, getConfig(thunkAPI));
        return data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const adminResetUserPassword = createAsyncThunk('users/adminResetUserPassword', async ({ id, newPassword }, thunkAPI) => {
    try {
        const { data } = await axios.put(`/api/users/${id}/reset-password`, { newPassword }, getConfig(thunkAPI));
        return data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

const initialState = {
    usersList: [],
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearUserMessages: (state) => {
            state.error = null;
            // Add state.message = null if needed in future
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Users
            .addCase(fetchUsers.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchUsers.fulfilled, (state, action) => { state.loading = false; state.usersList = action.payload; })
            .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            // Create User
            .addCase(createUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(createUser.fulfilled, (state, action) => { state.loading = false; state.usersList.push(action.payload); })
            .addCase(createUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            // Bulk Create / Import
            .addCase(importUsers.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(importUsers.fulfilled, (state, action) => { state.loading = false; state.usersList = [...state.usersList, ...action.payload]; })
            .addCase(importUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            // Update User
            .addCase(updateUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.usersList.findIndex(u => u._id === action.payload._id);
                if (index !== -1) state.usersList[index] = action.payload;
            })
            .addCase(updateUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            // Toggle Status
            .addCase(toggleUserStatus.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(toggleUserStatus.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.usersList.findIndex(u => u._id === action.payload._id);
                if (index !== -1) state.usersList[index] = action.payload;
            })
            .addCase(toggleUserStatus.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            // Delete User
            .addCase(deleteUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.loading = false;
                state.usersList = state.usersList.filter(u => u._id !== action.payload);
            })
            .addCase(deleteUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            // Reset Password
            .addCase(adminResetUserPassword.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(adminResetUserPassword.fulfilled, (state) => { state.loading = false; })
            .addCase(adminResetUserPassword.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    },
});

export const { clearError, clearUserMessages } = userSlice.actions;
export default userSlice.reducer;
