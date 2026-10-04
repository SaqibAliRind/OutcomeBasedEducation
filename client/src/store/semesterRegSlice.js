import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/semester-registration`;
const getConfig = (getState) => {
    const { auth: { token } } = getState();
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const fetchRegistrations = createAsyncThunk('semesterReg/fetchAll', async (params = {}, { getState, rejectWithValue }) => {
    try {
        const query = new URLSearchParams(params).toString();
        const res = await axios.get(`${API}?${query}`, getConfig(getState));
        return res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
});

export const registerSemester = createAsyncThunk('semesterReg/register', async (payload, { getState, rejectWithValue }) => {
    try {
        const res = await axios.post(API, payload, getConfig(getState));
        return res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
});

export const freezeRegistration = createAsyncThunk('semesterReg/freeze', async (id, { getState, rejectWithValue }) => {
    try {
        const res = await axios.patch(`${API}/${id}/freeze`, {}, getConfig(getState));
        return res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
});

export const dropRegistration = createAsyncThunk('semesterReg/drop', async (id, { getState, rejectWithValue }) => {
    try {
        const res = await axios.patch(`${API}/${id}/drop`, {}, getConfig(getState));
        return res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message || err.message); }
});

const semesterRegSlice = createSlice({
    name: 'semesterReg',
    initialState: {
        registrations: [],
        loading: false,
        error: null,
        successMessage: null,
    },
    reducers: {
        clearSemRegMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        const pending = (state) => { state.loading = true; state.error = null; };
        const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

        builder
            .addCase(fetchRegistrations.pending, pending)
            .addCase(fetchRegistrations.fulfilled, (state, action) => {
                state.loading = false;
                state.registrations = action.payload;
            })
            .addCase(fetchRegistrations.rejected, rejected)

            .addCase(registerSemester.pending, pending)
            .addCase(registerSemester.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
                state.registrations.unshift(action.payload.registration);
            })
            .addCase(registerSemester.rejected, rejected)

            .addCase(freezeRegistration.pending, pending)
            .addCase(freezeRegistration.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
                const idx = state.registrations.findIndex(r => r._id === action.payload.registration._id);
                if (idx !== -1) state.registrations[idx] = action.payload.registration;
            })
            .addCase(freezeRegistration.rejected, rejected)

            .addCase(dropRegistration.pending, pending)
            .addCase(dropRegistration.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
                const idx = state.registrations.findIndex(r => r._id === action.payload.registration._id);
                if (idx !== -1) state.registrations[idx] = action.payload.registration;
            })
            .addCase(dropRegistration.rejected, rejected);
    }
});

export const { clearSemRegMessages } = semesterRegSlice.actions;
export default semesterRegSlice.reducer;
