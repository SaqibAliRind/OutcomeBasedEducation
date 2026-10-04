import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/academic`;

const getConfig = (getState) => {
    const { auth: { token } } = getState();
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const fetchAcademicData = createAsyncThunk('academic/fetch', async (entity, { getState, rejectWithValue }) => {
    try {
        const { auth: { user } } = getState();
        let url = `${API_URL}/${entity}`;
        if (user && user.role === 'HOD' && user.department) {
            url += `?department=${user.department}`;
        } else if (user && user.role === 'ProgramCoordinator' && user.program) {
            url += `?program=${user.program}`;
        }
        const response = await axios.get(url, getConfig(getState));
        return { entity, data: response.data };
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const createAcademicData = createAsyncThunk('academic/create', async ({ entity, payload }, { getState, rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_URL}/${entity}`, payload, getConfig(getState));
        return { entity, data: response.data };
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const updateAcademicData = createAsyncThunk('academic/update', async ({ entity, id, payload }, { getState, rejectWithValue }) => {
    try {
        const response = await axios.put(`${API_URL}/${entity}/${id}`, payload, getConfig(getState));
        return { entity, data: response.data };
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const deleteAcademicData = createAsyncThunk('academic/delete', async ({ entity, id }, { getState, rejectWithValue }) => {
    try {
        await axios.delete(`${API_URL}/${entity}/${id}`, getConfig(getState));
        return { entity, id };
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const setActiveSession = createAsyncThunk('academic/setActiveSession', async (id, { getState, rejectWithValue }) => {
    try {
        const response = await axios.put(`${API_URL}/sessions/${id}/activate`, {}, getConfig(getState));
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});

const initialState = {
    records: {
        faculties: [],
        departments: [],
        programs: [],
        sessions: [],
        semesters: [],
        sections: [],
        batches: [],
        courses: [],
        courseofferings: [],
        calendar: [],
        timetables: []
    },
    loading: false,
    error: null
};

const academicSlice = createSlice({
    name: 'academic',
    initialState,
    reducers: {
        clearAcademicError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchAcademicData.pending, (state) => {
                state.loading = true; state.error = null;
            })
            .addCase(fetchAcademicData.fulfilled, (state, action) => {
                state.loading = false;
                state.records[action.payload.entity] = action.payload.data;
            })
            .addCase(fetchAcademicData.rejected, (state, action) => {
                state.loading = false; state.error = action.payload;
            })
            // Create
            .addCase(createAcademicData.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(createAcademicData.fulfilled, (state, action) => {
                state.loading = false;
                state.records[action.payload.entity].unshift(action.payload.data);
            })
            .addCase(createAcademicData.rejected, (state, action) => {
                state.loading = false; state.error = action.payload;
            })
            // Update
            .addCase(updateAcademicData.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(updateAcademicData.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.records[action.payload.entity].findIndex(r => r._id === action.payload.data._id);
                if (index !== -1) {
                    state.records[action.payload.entity][index] = action.payload.data;
                }
            })
            .addCase(updateAcademicData.rejected, (state, action) => {
                state.loading = false; state.error = action.payload;
            })
            // Delete
            .addCase(deleteAcademicData.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(deleteAcademicData.fulfilled, (state, action) => {
                state.loading = false;
                state.records[action.payload.entity] = state.records[action.payload.entity].filter(
                    record => record._id !== action.payload.id
                );
            })
            .addCase(deleteAcademicData.rejected, (state, action) => {
                state.loading = false; state.error = action.payload;
            })
            // Set Active Session
            .addCase(setActiveSession.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(setActiveSession.fulfilled, (state, action) => {
                state.loading = false;
                // Deactivate all others, activate the returned one
                state.records.sessions = state.records.sessions.map(session => 
                    session._id === action.payload._id 
                        ? action.payload 
                        : { ...session, isActive: false }
                );
            })
            .addCase(setActiveSession.rejected, (state, action) => {
                state.loading = false; state.error = action.payload;
            });
    }
});

export const { clearAcademicError } = academicSlice.actions;
export default academicSlice.reducer;
