import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const _storedUser = localStorage.getItem('user');
const user = (_storedUser && _storedUser !== 'undefined') ? (() => { try { return JSON.parse(_storedUser); } catch { return null; } })() : null;
const token = localStorage.getItem('token');

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials, thunkAPI) => {
        try {
            const { data } = await axios.post('/api/auth/login', credentials);
            // Backend returns flat: { _id, name, email, role, token }
            const { token, ...userObj } = data;
            localStorage.setItem('user', JSON.stringify(userObj));
            localStorage.setItem('token', token);
            return { user: userObj, token };
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const updateMe = createAsyncThunk(
    'auth/updateMe',
    async (profileData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.token;
            const { data } = await axios.put('/api/profile/me', profileData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            localStorage.setItem('user', JSON.stringify(data));
            return data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const forgotPasswordUser = createAsyncThunk(
    'auth/forgotPasswordUser',
    async (email, thunkAPI) => {
        try {
            const { data } = await axios.post('/api/auth/forgotpassword', { email });
            return data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const resetPasswordUser = createAsyncThunk(
    'auth/resetPasswordUser',
    async (resetData, thunkAPI) => {
        try {
            const { data } = await axios.put('/api/auth/resetpassword', resetData);
            return data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const initialState = {
    user: user || null,
    token: token || null,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            state.user = null;
            state.token = null;
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateMe.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateMe.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(updateMe.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(forgotPasswordUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(forgotPasswordUser.fulfilled, (state) => { state.loading = false; })
            .addCase(forgotPasswordUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(resetPasswordUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(resetPasswordUser.fulfilled, (state) => { state.loading = false; })
            .addCase(resetPasswordUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
