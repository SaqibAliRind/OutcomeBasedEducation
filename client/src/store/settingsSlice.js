import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getAuthHeader = (getState) => ({
    headers: { Authorization: `Bearer ${getState().auth.token}` }
});

export const fetchSettings = createAsyncThunk('settings/fetch', async (_, { getState, rejectWithValue }) => {
    try {
        const res = await axios.get('/api/settings', getAuthHeader(getState));
        return res.data.data;
    } catch (err) {
        return rejectWithValue(err.response?.data);
    }
});

export const updateSettingsCategory = createAsyncThunk('settings/updateCategory', async ({ category, data }, { getState, rejectWithValue }) => {
    try {
        const res = await axios.put(`/api/settings/${category}`, data, getAuthHeader(getState));
        return { category, data: res.data.data[category], message: res.data.message };
    } catch (err) {
        return rejectWithValue(err.response?.data);
    }
});

export const testSmtp = createAsyncThunk('settings/testSmtp', async (data, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post('/api/settings/test-smtp', data, getAuthHeader(getState));
        return res.data.message;
    } catch (err) {
        return rejectWithValue(err.response?.data);
    }
});

export const testCloudinary = createAsyncThunk('settings/testCloudinary', async (data, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post('/api/settings/test-cloudinary', data, getAuthHeader(getState));
        return res.data.message;
    } catch (err) {
        return rejectWithValue(err.response?.data);
    }
});

export const triggerBackup = createAsyncThunk('settings/triggerBackup', async (_, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post('/api/settings/backup', {}, getAuthHeader(getState));
        return res.data.message;
    } catch (err) {
        return rejectWithValue(err.response?.data);
    }
});

export const restoreDatabaseFromBackup = createAsyncThunk('settings/restoreDatabase', async (file, { getState, rejectWithValue }) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const headers = { ...getAuthHeader(getState).headers, 'Content-Type': 'multipart/form-data' };
        
        const res = await axios.post('/api/settings/restore', formData, { headers });
        return res.data.message;
    } catch (err) {
        return rejectWithValue(err.response?.data);
    }
});

const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        config: null,
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearSettingsMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSettings.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchSettings.fulfilled, (state, action) => {
                state.loading = false;
                state.config = action.payload;
            })
            .addCase(fetchSettings.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })
            
            .addCase(updateSettingsCategory.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(updateSettingsCategory.fulfilled, (state, action) => {
                state.loading = false;
                if (state.config) {
                    state.config[action.payload.category] = action.payload.data;
                }
                state.successMessage = action.payload.message;
            })
            .addCase(updateSettingsCategory.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })
            
            .addCase(testSmtp.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(testSmtp.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload; // Usually "SMTP connection successful!"
            })
            .addCase(testSmtp.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })

            .addCase(testCloudinary.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(testCloudinary.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload;
            })
            .addCase(testCloudinary.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })

            .addCase(triggerBackup.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(triggerBackup.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload;
            })
            .addCase(triggerBackup.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })
            
            .addCase(restoreDatabaseFromBackup.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(restoreDatabaseFromBackup.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload;
            })
            .addCase(restoreDatabaseFromBackup.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; });
    }
});

export const { clearSettingsMessages } = settingsSlice.actions;
export default settingsSlice.reducer;
