import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/enrollments`;
const getConfig = (getState) => {
    const { auth: { token } } = getState();
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const fetchEnrollments = createAsyncThunk('enrollment/fetchAll', async (params = {}, { getState, rejectWithValue }) => {
    try {
        const query = new URLSearchParams(params).toString();
        const res = await axios.get(`${API}?${query}`, getConfig(getState));
        return res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
});

export const fetchAvailableOfferings = createAsyncThunk('enrollment/fetchOfferings', async (semesterId, { getState, rejectWithValue }) => {
    try {
        const query = semesterId ? `?semesterId=${semesterId}` : '';
        const res = await axios.get(`${API}/offerings${query}`, getConfig(getState));
        return res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
});

export const enrollInCourse = createAsyncThunk('enrollment/enrollCourse', async (payload, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post(`${API}/course`, payload, getConfig(getState));
        return res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
});

export const dropCourse = createAsyncThunk('enrollment/drop', async (enrollmentId, { getState, rejectWithValue }) => {
    try {
        const res = await axios.patch(`${API}/${enrollmentId}/drop`, {}, getConfig(getState));
        return res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
});

export const enrollInSemester = createAsyncThunk('enrollment/enrollSemester', async (payload, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post(`${API}/semester`, payload, getConfig(getState));
        return res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
});

const enrollmentSlice = createSlice({
    name: 'enrollment',
    initialState: {
        enrollments: [],
        offerings: [],
        loading: false,
        error: null,
        successMessage: null,
    },
    reducers: {
        clearEnrollmentMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        const pending = (state) => { state.loading = true; state.error = null; };
        const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(fetchEnrollments.pending, pending)
            .addCase(fetchEnrollments.fulfilled, (state, action) => {
                state.loading = false;
                state.enrollments = action.payload;
            })
            .addCase(fetchEnrollments.rejected, rejected)

            .addCase(fetchAvailableOfferings.pending, pending)
            .addCase(fetchAvailableOfferings.fulfilled, (state, action) => {
                state.loading = false;
                state.offerings = action.payload;
            })
            .addCase(fetchAvailableOfferings.rejected, rejected)

            .addCase(enrollInCourse.pending, pending)
            .addCase(enrollInCourse.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
                state.enrollments.unshift(action.payload.enrollment);
            })
            .addCase(enrollInCourse.rejected, rejected)

            .addCase(dropCourse.pending, pending)
            .addCase(dropCourse.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
                const idx = state.enrollments.findIndex(e => e._id === action.payload.enrollment._id);
                if (idx !== -1) state.enrollments[idx] = action.payload.enrollment;
            })
            .addCase(dropCourse.rejected, rejected)

            .addCase(enrollInSemester.pending, pending)
            .addCase(enrollInSemester.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
            })
            .addCase(enrollInSemester.rejected, rejected);
    }
});

export const { clearEnrollmentMessages } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;
