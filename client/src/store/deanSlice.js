import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getHeaders = (getState) => ({
    Authorization: `Bearer ${getState().auth.token}`
});

export const fetchDeanDashboard = createAsyncThunk('dean/fetchDashboard', async (_, { getState, rejectWithValue }) => {
    try {
        const { data } = await axios.get('/api/dean/dashboard', { headers: getHeaders(getState) });
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

const deanSlice = createSlice({
    name: 'dean',
    initialState: {
        data: null,
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDeanDashboard.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchDeanDashboard.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
            .addCase(fetchDeanDashboard.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

export default deanSlice.reducer;
