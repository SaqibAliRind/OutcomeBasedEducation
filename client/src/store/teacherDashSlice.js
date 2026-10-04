import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const hdrs = (getState) => ({ Authorization: `Bearer ${getState().auth.token}` });

export const fetchTeacherDashboard = createAsyncThunk(
    'teacherDash/fetchDashboard',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.get('/api/teachers/dashboard', { headers: hdrs(getState) });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const fetchAssignedCourses = createAsyncThunk(
    'teacherDash/fetchCourses',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { data } = await axios.get('/api/teachers/courses', { headers: hdrs(getState) });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

const teacherDashSlice = createSlice({
    name: 'teacherDash',
    initialState: {
        dashboard: null,
        courses: [],
        loading: false,
        coursesLoading: false,
        error: null
    },
    reducers: {},
    extraReducers: (b) => {
        b
            .addCase(fetchTeacherDashboard.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(fetchTeacherDashboard.fulfilled, (s, a) => { s.loading = false; s.dashboard = a.payload; })
            .addCase(fetchTeacherDashboard.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
            .addCase(fetchAssignedCourses.pending, (s) => { s.coursesLoading = true; })
            .addCase(fetchAssignedCourses.fulfilled, (s, a) => { s.coursesLoading = false; s.courses = a.payload; })
            .addCase(fetchAssignedCourses.rejected, (s) => { s.coursesLoading = false; });
    }
});

export default teacherDashSlice.reducer;
