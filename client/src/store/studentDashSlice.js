import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchStudentDashboard = createAsyncThunk('studentDash/fetchDashboard', async (_, { getState, rejectWithValue }) => {
    try {
        const { auth } = getState();
        const config = { headers: { Authorization: `Bearer ${auth.token}` } };
        const { data } = await axios.get('/api/students/dashboard', config);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

const studentDashSlice = createSlice({
    name: 'studentDash',
    initialState: {
        dashboard: null,
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchStudentDashboard.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStudentDashboard.fulfilled, (state, action) => {
                state.loading = false;
                state.dashboard = action.payload;
            })
            .addCase(fetchStudentDashboard.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default studentDashSlice.reducer;
