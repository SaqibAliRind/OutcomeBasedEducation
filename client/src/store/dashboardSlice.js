import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Fetch Dashboard Metrics
export const fetchDashboardMetrics = createAsyncThunk('dashboard/fetchMetrics', async (_, { getState, rejectWithValue }) => {
    try {
        const { auth: { token } } = getState();
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard/metrics`, config);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || { message: 'Network error occurred' });
    }
});

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState: {
        data: null, // This will now hold academicStats, systemHealth, etc.
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardMetrics.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
                state.loading = false;
                // Assign the entire backend response to 'data'
                state.data = action.payload; 
            })
            .addCase(fetchDashboardMetrics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch dashboard metrics';
            });
    }
});

export default dashboardSlice.reducer;