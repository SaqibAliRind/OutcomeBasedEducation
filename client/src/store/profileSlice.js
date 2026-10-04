import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getHeaders = (getState) => {
    const { auth: { token } } = getState();
    return { Authorization: `Bearer ${token}` };
};

export const fetchMyProfile = createAsyncThunk('profile/fetchMe', async (_, { getState, rejectWithValue }) => {
    try {
        const { data } = await axios.get('/api/profile/me', { headers: getHeaders(getState) });
        return data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const updateMyProfile = createAsyncThunk('profile/update', async (updates, { getState, rejectWithValue }) => {
    try {
        const { data } = await axios.put('/api/profile/me', updates, { headers: getHeaders(getState) });
        return data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const changePassword = createAsyncThunk('profile/changePassword', async (passwords, { getState, rejectWithValue }) => {
    try {
        const { data } = await axios.put('/api/profile/change-password', passwords, { headers: getHeaders(getState) });
        return data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const uploadProfilePicture = createAsyncThunk('profile/uploadPicture', async (formData, { getState, rejectWithValue }) => {
    try {
        const { data } = await axios.post('/api/profile/upload-picture', formData, {
            headers: { ...getHeaders(getState), 'Content-Type': 'multipart/form-data' }
        });
        return data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const fetchLoginSessions = createAsyncThunk('profile/sessions', async (_, { getState, rejectWithValue }) => {
    try {
        const { data } = await axios.get('/api/profile/sessions', { headers: getHeaders(getState) });
        return data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

const profileSlice = createSlice({
    name: 'profile',
    initialState: {
        myProfile: null,
        sessions: [],
        loading: false,
        successMessage: null,
        error: null
    },
    reducers: {
        clearProfileMessages: (state) => {
            state.successMessage = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        const setLoading = (state) => { state.loading = true; state.error = null; state.successMessage = null; };
        const setError = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(fetchMyProfile.pending, setLoading)
            .addCase(fetchMyProfile.fulfilled, (state, action) => { state.loading = false; state.myProfile = action.payload; })
            .addCase(fetchMyProfile.rejected, setError)

            .addCase(updateMyProfile.pending, setLoading)
            .addCase(updateMyProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.myProfile = action.payload.user;
                state.successMessage = 'Profile updated successfully!';
            })
            .addCase(updateMyProfile.rejected, setError)

            .addCase(changePassword.pending, setLoading)
            .addCase(changePassword.fulfilled, (state) => {
                state.loading = false;
                state.successMessage = 'Password changed successfully!';
            })
            .addCase(changePassword.rejected, setError)

            .addCase(uploadProfilePicture.pending, setLoading)
            .addCase(uploadProfilePicture.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = 'Profile picture updated!';
                if (state.myProfile) state.myProfile.profilePicture = action.payload.url;
            })
            .addCase(uploadProfilePicture.rejected, setError)

            .addCase(fetchLoginSessions.fulfilled, (state, action) => { state.sessions = action.payload; });
    }
});

export const { clearProfileMessages } = profileSlice.actions;
export default profileSlice.reducer;
