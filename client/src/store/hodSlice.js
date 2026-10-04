import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getHeaders = (getState) => ({
    Authorization: `Bearer ${getState().auth.token}`
});

export const fetchHodDashboard = createAsyncThunk('hod/fetchDashboard', async (_, { getState, rejectWithValue }) => {
    try {
        const { data } = await axios.get('/api/hod/dashboard', { headers: getHeaders(getState) });
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

const hodSlice = createSlice({
    name: 'hod',
    initialState: {
        data: null,
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchHodDashboard.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchHodDashboard.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
            .addCase(fetchHodDashboard.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

export default hodSlice.reducer;
