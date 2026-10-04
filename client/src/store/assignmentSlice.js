import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/assignments`;

const getConfig = (getState) => {
    const { auth: { token } } = getState();
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const fetchTeachersForAssignment = createAsyncThunk(
    'assignments/fetchTeachers',
    async (_, { getState, rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/teachers`, getConfig(getState));
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchAssignmentSummary = createAsyncThunk(
    'assignments/fetchSummary',
    async (_, { getState, rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/summary`, getConfig(getState));
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchTeacherWorkload = createAsyncThunk(
    'assignments/fetchWorkload',
    async (_, { getState, rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/workload`, getConfig(getState));
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const assignTeacherToDepartment = createAsyncThunk(
    'assignments/assignDepartment',
    async ({ departmentId, teacherId }, { getState, rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/department`, { departmentId, teacherId }, getConfig(getState));
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const assignTeacherToProgram = createAsyncThunk(
    'assignments/assignProgram',
    async ({ programId, teacherId }, { getState, rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/program`, { programId, teacherId }, getConfig(getState));
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const assignTeacherToSection = createAsyncThunk(
    'assignments/assignSection',
    async ({ sectionId, teacherId }, { getState, rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/section`, { sectionId, teacherId }, getConfig(getState));
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const initialState = {
    teachers: [],
    departments: [],
    programs: [],
    sections: [],
    workload: [],
    loading: false,
    error: null,
    successMessage: null
};

const assignmentSlice = createSlice({
    name: 'assignments',
    initialState,
    reducers: {
        clearAssignmentMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Teachers
            .addCase(fetchTeachersForAssignment.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchTeachersForAssignment.fulfilled, (state, action) => {
                state.loading = false;
                state.teachers = action.payload;
            })
            .addCase(fetchTeachersForAssignment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Summary
            .addCase(fetchAssignmentSummary.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAssignmentSummary.fulfilled, (state, action) => {
                state.loading = false;
                state.departments = action.payload.departments;
                state.programs = action.payload.programs;
                state.sections = action.payload.sections;
            })
            .addCase(fetchAssignmentSummary.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Workload
            .addCase(fetchTeacherWorkload.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchTeacherWorkload.fulfilled, (state, action) => {
                state.loading = false;
                state.workload = action.payload;
            })
            .addCase(fetchTeacherWorkload.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Assign Department
            .addCase(assignTeacherToDepartment.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(assignTeacherToDepartment.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
                const index = state.departments.findIndex(d => d._id === action.payload.data._id);
                if (index !== -1) {
                    state.departments[index] = action.payload.data;
                }
            })
            .addCase(assignTeacherToDepartment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Assign Program
            .addCase(assignTeacherToProgram.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(assignTeacherToProgram.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
                const index = state.programs.findIndex(p => p._id === action.payload.data._id);
                if (index !== -1) {
                    state.programs[index] = action.payload.data;
                }
            })
            .addCase(assignTeacherToProgram.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Assign Section
            .addCase(assignTeacherToSection.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(assignTeacherToSection.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message;
                const index = state.sections.findIndex(s => s._id === action.payload.data._id);
                if (index !== -1) {
                    state.sections[index] = action.payload.data;
                }
            })
            .addCase(assignTeacherToSection.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearAssignmentMessages } = assignmentSlice.actions;
export default assignmentSlice.reducer;
