import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchQECDashboard = createAsyncThunk(
    'qec/fetchQECDashboard',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            const { data } = await axios.get('/api/qec/dashboard', { headers: { Authorization: `Bearer ${token}` } });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const qecSlice = createSlice({
    name: 'qec',
    initialState: {
        dashboardData: null,
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchQECDashboard.pending, (state) => { state.loading = true; })
            .addCase(fetchQECDashboard.fulfilled, (state, action) => {
                state.loading = false;
                state.dashboardData = action.payload;
            })
            .addCase(fetchQECDashboard.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default qecSlice.reducer;
