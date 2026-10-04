import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchCoordinatorDashboard = createAsyncThunk('coordinatorDash/fetchDashboard', async (_, { getState, rejectWithValue }) => {
    try {
        const { auth } = getState();
        const config = { headers: { Authorization: `Bearer ${auth.token}` } };
        const { data } = await axios.get('/api/coordinator/dashboard', config);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

const coordinatorDashSlice = createSlice({
    name: 'coordinatorDash',
    initialState: {
        dashboard: null,
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCoordinatorDashboard.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCoordinatorDashboard.fulfilled, (state, action) => {
                state.loading = false;
                state.dashboard = action.payload;
            })
            .addCase(fetchCoordinatorDashboard.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default coordinatorDashSlice.reducer;
