import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/teachers`;

const getToken = (getState) => getState().auth.token;

// ── Fetch Profile ─────────────────────────────────────────────────────────────
export const fetchTeacherProfile = createAsyncThunk(
    'teacherProfile/fetch',
    async (userId, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.get(`${API}/${userId}`, {
                headers: { Authorization: `Bearer ${getToken(getState)}` }
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
        }
    }
);

// ── Update Personal Info ──────────────────────────────────────────────────────
export const updatePersonalInfo = createAsyncThunk(
    'teacherProfile/updatePersonal',
    async ({ userId, data: payload }, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.put(`${API}/${userId}/personal`, payload, {
                headers: { Authorization: `Bearer ${getToken(getState)}` }
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update personal info');
        }
    }
);

// ── Update Professional Info ──────────────────────────────────────────────────
export const updateProfessionalInfo = createAsyncThunk(
    'teacherProfile/updateProfessional',
    async ({ userId, data: payload }, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.put(`${API}/${userId}/professional`, payload, {
                headers: { Authorization: `Bearer ${getToken(getState)}` }
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update professional info');
        }
    }
);

// ── Qualifications ────────────────────────────────────────────────────────────
export const addQualification = createAsyncThunk(
    'teacherProfile/addQualification',
    async ({ userId, data: payload }, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.post(`${API}/${userId}/qualifications`, payload, {
                headers: { Authorization: `Bearer ${getToken(getState)}` }
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to add qualification');
        }
    }
);

export const deleteQualification = createAsyncThunk(
    'teacherProfile/deleteQualification',
    async ({ userId, qualId }, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.delete(`${API}/${userId}/qualifications/${qualId}`, {
                headers: { Authorization: `Bearer ${getToken(getState)}` }
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to delete qualification');
        }
    }
);

// ── Experience ────────────────────────────────────────────────────────────────
export const addExperience = createAsyncThunk(
    'teacherProfile/addExperience',
    async ({ userId, data: payload }, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.post(`${API}/${userId}/experience`, payload, {
                headers: { Authorization: `Bearer ${getToken(getState)}` }
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to add experience');
        }
    }
);

export const deleteExperience = createAsyncThunk(
    'teacherProfile/deleteExperience',
    async ({ userId, expId }, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.delete(`${API}/${userId}/experience/${expId}`, {
                headers: { Authorization: `Bearer ${getToken(getState)}` }
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to delete experience');
        }
    }
);

// ── Documents ─────────────────────────────────────────────────────────────────
export const uploadDocument = createAsyncThunk(
    'teacherProfile/uploadDocument',
    async ({ userId, formData }, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.post(`${API}/${userId}/documents`, formData, {
                headers: {
                    Authorization: `Bearer ${getToken(getState)}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to upload document');
        }
    }
);

export const deleteDocument = createAsyncThunk(
    'teacherProfile/deleteDocument',
    async ({ userId, docId }, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.delete(`${API}/${userId}/documents/${docId}`, {
                headers: { Authorization: `Bearer ${getToken(getState)}` }
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to delete document');
        }
    }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const teacherProfileSlice = createSlice({
    name: 'teacherProfile',
    initialState: {
        profile: null,
        loading: false,
        saving: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearMessages(state) {
            state.error = null;
            state.successMessage = null;
        },
        resetProfile(state) {
            state.profile = null;
            state.loading = false;
            state.saving = false;
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        const setLoading = (state) => { state.loading = true; state.error = null; };
        const setSaving  = (state) => { state.saving  = true; state.error = null; };
        const setProfile = (state, action) => {
            state.loading = false;
            state.saving  = false;
            state.profile = action.payload;
            state.successMessage = 'Saved successfully!';
        };
        const setError = (state, action) => {
            state.loading = false;
            state.saving  = false;
            state.error   = action.payload;
        };

        builder
            .addCase(fetchTeacherProfile.pending,   setLoading)
            .addCase(fetchTeacherProfile.fulfilled,  (state, a) => { state.loading = false; state.profile = a.payload; })
            .addCase(fetchTeacherProfile.rejected,   setError)

            .addCase(updatePersonalInfo.pending,     setSaving)
            .addCase(updatePersonalInfo.fulfilled,   setProfile)
            .addCase(updatePersonalInfo.rejected,    setError)

            .addCase(updateProfessionalInfo.pending,   setSaving)
            .addCase(updateProfessionalInfo.fulfilled, setProfile)
            .addCase(updateProfessionalInfo.rejected,  setError)

            .addCase(addQualification.pending,     setSaving)
            .addCase(addQualification.fulfilled,   setProfile)
            .addCase(addQualification.rejected,    setError)

            .addCase(deleteQualification.pending,  setSaving)
            .addCase(deleteQualification.fulfilled, setProfile)
            .addCase(deleteQualification.rejected,  setError)

            .addCase(addExperience.pending,     setSaving)
            .addCase(addExperience.fulfilled,   setProfile)
            .addCase(addExperience.rejected,    setError)

            .addCase(deleteExperience.pending,  setSaving)
            .addCase(deleteExperience.fulfilled, setProfile)
            .addCase(deleteExperience.rejected,  setError)

            .addCase(uploadDocument.pending,    setSaving)
            .addCase(uploadDocument.fulfilled,  setProfile)
            .addCase(uploadDocument.rejected,   setError)

            .addCase(deleteDocument.pending,    setSaving)
            .addCase(deleteDocument.fulfilled,  setProfile)
            .addCase(deleteDocument.rejected,   setError);
    }
});

export const { clearMessages, resetProfile } = teacherProfileSlice.actions;
export default teacherProfileSlice.reducer;
