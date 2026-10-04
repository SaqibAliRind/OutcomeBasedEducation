import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/academic-record`;
const getConfig = (getState) => {
    const { auth: { token } } = getState();
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const fetchStudentGPA = createAsyncThunk('academicRecord/gpa', async (studentId, { getState, rejectWithValue }) => {
    try {
        const res = await axios.get(`${API}/gpa/${studentId}`, getConfig(getState));
        return res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
});

export const fetchStudentCGPA = createAsyncThunk('academicRecord/cgpa', async (studentId, { getState, rejectWithValue }) => {
    try {
        const res = await axios.get(`${API}/cgpa/${studentId}`, getConfig(getState));
        return res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
});

export const fetchStudentTranscript = createAsyncThunk('academicRecord/transcript', async (studentId, { getState, rejectWithValue }) => {
    try {
        const res = await axios.get(`${API}/transcript/${studentId}`, getConfig(getState));
        return res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
});

const academicRecordSlice = createSlice({
    name: 'academicRecord',
    initialState: {
        gpaList: [],
        cgpa: null,
        totalCredits: 0,
        transcript: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearAcademicRecord: (state) => {
            state.gpaList = [];
            state.cgpa = null;
            state.transcript = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        const pending = (state) => { state.loading = true; state.error = null; };
        const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(fetchStudentGPA.pending, pending)
            .addCase(fetchStudentGPA.fulfilled, (state, action) => {
                state.loading = false;
                state.gpaList = action.payload;
            })
            .addCase(fetchStudentGPA.rejected, rejected)

            .addCase(fetchStudentCGPA.pending, pending)
            .addCase(fetchStudentCGPA.fulfilled, (state, action) => {
                state.loading = false;
                state.cgpa = action.payload.cgpa;
                state.totalCredits = action.payload.totalCredits;
            })
            .addCase(fetchStudentCGPA.rejected, rejected)

            .addCase(fetchStudentTranscript.pending, pending)
            .addCase(fetchStudentTranscript.fulfilled, (state, action) => {
                state.loading = false;
                state.transcript = action.payload;
            })
            .addCase(fetchStudentTranscript.rejected, rejected);
    }
});

export const { clearAcademicRecord } = academicRecordSlice.actions;
export default academicRecordSlice.reducer;
