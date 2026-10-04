import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/students`;

const getToken = (getState) => getState().auth.token;

// ── Fetch Profile ─────────────────────────────────────────────────────────────
export const fetchStudentProfile = createAsyncThunk(
    'studentProfile/fetch',
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
export const updateStudentPersonal = createAsyncThunk(
    'studentProfile/updatePersonal',
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

// ── Update Guardian Info ──────────────────────────────────────────────────────
export const updateStudentGuardian = createAsyncThunk(
    'studentProfile/updateGuardian',
    async ({ userId, data: payload }, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.put(`${API}/${userId}/guardian`, payload, {
                headers: { Authorization: `Bearer ${getToken(getState)}` }
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update guardian info');
        }
    }
);

// ── Update Academic Info ──────────────────────────────────────────────────────
export const updateStudentAcademic = createAsyncThunk(
    'studentProfile/updateAcademic',
    async ({ userId, data: payload }, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.put(`${API}/${userId}/academic`, payload, {
                headers: { Authorization: `Bearer ${getToken(getState)}` }
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update academic info');
        }
    }
);

// ── Documents ─────────────────────────────────────────────────────────────────
export const uploadStudentDocument = createAsyncThunk(
    'studentProfile/uploadDocument',
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

export const deleteStudentDocument = createAsyncThunk(
    'studentProfile/deleteDocument',
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
const studentProfileSlice = createSlice({
    name: 'studentProfile',
    initialState: {
        profile: null,
        loading: false,
        saving: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearStudentMessages(state) {
            state.error = null;
            state.successMessage = null;
        },
        resetStudentProfile(state) {
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
            .addCase(fetchStudentProfile.pending,   setLoading)
            .addCase(fetchStudentProfile.fulfilled,  (state, a) => { state.loading = false; state.profile = a.payload; })
            .addCase(fetchStudentProfile.rejected,   setError)

            .addCase(updateStudentPersonal.pending,     setSaving)
            .addCase(updateStudentPersonal.fulfilled,   setProfile)
            .addCase(updateStudentPersonal.rejected,    setError)

            .addCase(updateStudentGuardian.pending,   setSaving)
            .addCase(updateStudentGuardian.fulfilled, setProfile)
            .addCase(updateStudentGuardian.rejected,  setError)

            .addCase(updateStudentAcademic.pending,   setSaving)
            .addCase(updateStudentAcademic.fulfilled, setProfile)
            .addCase(updateStudentAcademic.rejected,  setError)

            .addCase(uploadStudentDocument.pending,    setSaving)
            .addCase(uploadStudentDocument.fulfilled,  setProfile)
            .addCase(uploadStudentDocument.rejected,   setError)

            .addCase(deleteStudentDocument.pending,    setSaving)
            .addCase(deleteStudentDocument.fulfilled,  setProfile)
            .addCase(deleteStudentDocument.rejected,   setError);
    }
});

export const { clearStudentMessages, resetStudentProfile } = studentProfileSlice.actions;
export default studentProfileSlice.reducer;