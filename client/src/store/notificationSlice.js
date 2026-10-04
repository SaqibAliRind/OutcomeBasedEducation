import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            const { data } = await axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchAdminNotifications = createAsyncThunk(
    'notifications/fetchAdminNotifications',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            const { data } = await axios.get('/api/notifications/admin', { headers: { Authorization: `Bearer ${token}` } });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const sendNotification = createAsyncThunk(
    'notifications/sendNotification',
    async (notificationData, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            const { data } = await axios.post('/api/notifications', notificationData, { headers: { Authorization: `Bearer ${token}` } });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const cancelNotification = createAsyncThunk(
    'notifications/cancelNotification',
    async (id, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            const { data } = await axios.patch(`/api/notifications/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const resendNotification = createAsyncThunk(
    'notifications/resendNotification',
    async (id, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            const { data } = await axios.post(`/api/notifications/${id}/resend`, {}, { headers: { Authorization: `Bearer ${token}` } });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const markNotificationRead = createAsyncThunk(
    'notifications/markNotificationRead',
    async (id, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            const { data } = await axios.put(`/api/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        list: [], // For individual user notifications
        adminList: [], // For admin dashboard notifications
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearNotificationMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // User Fetch
            .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
            .addCase(fetchNotifications.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
            .addCase(fetchNotifications.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            // Admin Fetch
            .addCase(fetchAdminNotifications.pending, (state) => { state.loading = true; })
            .addCase(fetchAdminNotifications.fulfilled, (state, action) => { state.loading = false; state.adminList = action.payload; })
            .addCase(fetchAdminNotifications.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            // Send
            .addCase(sendNotification.pending, (state) => { state.loading = true; })
            .addCase(sendNotification.fulfilled, (state, action) => { 
                state.loading = false; 
                state.successMessage = "Notification scheduled/sent successfully.";
                state.adminList.unshift(action.payload);
            })
            .addCase(sendNotification.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            // Cancel
            .addCase(cancelNotification.fulfilled, (state, action) => {
                const idx = state.adminList.findIndex(n => n._id === action.payload._id);
                if (idx !== -1) state.adminList[idx] = action.payload;
            })

            // Resend
            .addCase(resendNotification.fulfilled, (state, action) => {
                state.adminList.unshift(action.payload);
            })

            // Mark Read
            .addCase(markNotificationRead.fulfilled, (state, action) => {
                const index = state.list.findIndex(n => n._id === action.payload._id);
                if (index !== -1) {
                    state.list[index].isRead = true;
                }
            });
    }
});

export const { clearNotificationMessages } = notificationSlice.actions;
export default notificationSlice.reducer;
