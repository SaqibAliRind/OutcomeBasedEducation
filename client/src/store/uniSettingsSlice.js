import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getHeaders = (getState) => {
    const { auth: { token } } = getState();
    return { Authorization: `Bearer ${token}` };
};

export const fetchUniversitySettings = createAsyncThunk('uniSettings/fetch', async (_, { getState, rejectWithValue }) => {
    try {
        const { data } = await axios.get('/api/university-settings', { headers: getHeaders(getState) });
        return data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const updateGeneralSettings = createAsyncThunk('uniSettings/updateGeneral', async (payload, { getState, rejectWithValue }) => {
    try {
        const { data } = await axios.put('/api/university-settings/general', payload, { headers: getHeaders(getState) });
        return data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const updateSettingsSection = createAsyncThunk('uniSettings/updateSection', async ({ section, data: payload }, { getState, rejectWithValue }) => {
    try {
        const { data } = await axios.put(`/api/university-settings/section/${section}`, payload, { headers: getHeaders(getState) });
        return { section, settings: data.settings };
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const uploadUniversityAsset = createAsyncThunk('uniSettings/uploadAsset', async ({ type, formData }, { getState, rejectWithValue }) => {
    try {
        const { data } = await axios.post(`/api/university-settings/upload/${type}`, formData, {
            headers: { ...getHeaders(getState), 'Content-Type': 'multipart/form-data' }
        });
        return { type, url: data.url };
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const fetchAcademicOptions = createAsyncThunk('uniSettings/academicOptions', async (_, { getState, rejectWithValue }) => {
    try {
        const { data } = await axios.get('/api/university-settings/academic-options', { headers: getHeaders(getState) });
        return data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

const uniSettingsSlice = createSlice({
    name: 'uniSettings',
    initialState: {
        university: null,
        academicOptions: { sessions: [], semesters: [] },
        loading: false,
        saving: false,
        successMessage: null,
        error: null
    },
    reducers: {
        clearUniSettingsMessages: (state) => {
            state.successMessage = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUniversitySettings.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchUniversitySettings.fulfilled, (state, action) => { state.loading = false; state.university = action.payload; })
            .addCase(fetchUniversitySettings.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            .addCase(updateGeneralSettings.pending, (state) => { state.saving = true; state.error = null; })
            .addCase(updateGeneralSettings.fulfilled, (state, action) => {
                state.saving = false;
                state.university = action.payload.university;
                state.successMessage = 'General settings saved!';
            })
            .addCase(updateGeneralSettings.rejected, (state, action) => { state.saving = false; state.error = action.payload; })

            .addCase(updateSettingsSection.pending, (state) => { state.saving = true; state.error = null; })
            .addCase(updateSettingsSection.fulfilled, (state, action) => {
                state.saving = false;
                if (state.university) state.university.settings = action.payload.settings;
                state.successMessage = 'Settings saved!';
            })
            .addCase(updateSettingsSection.rejected, (state, action) => { state.saving = false; state.error = action.payload; })

            .addCase(uploadUniversityAsset.fulfilled, (state, action) => {
                if (state.university) state.university[action.payload.type] = action.payload.url;
                state.successMessage = `${action.payload.type} updated!`;
            })
            .addCase(uploadUniversityAsset.rejected, (state, action) => { state.error = action.payload; })

            .addCase(fetchAcademicOptions.fulfilled, (state, action) => { state.academicOptions = action.payload; });
    }
});

export const { clearUniSettingsMessages } = uniSettingsSlice.actions;
export default uniSettingsSlice.reducer;
