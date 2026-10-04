import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Get token config helper
const tokenConfig = (getState) => {
    const { auth: { token } } = getState();
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const admitNewStudent = createAsyncThunk(
    'admission/admitNewStudent',
    async (admissionData, { getState, rejectWithValue }) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admissions/new`, admissionData, tokenConfig(getState));
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to admit student' });
        }
    }
);

const admissionSlice = createSlice({
    name: 'admission',
    initialState: {
        loading: false,
        error: null,
        successMessage: null,
        lastAdmissionDetails: null // to show the generated ID/password to the admin
    },
    reducers: {
        clearAdmissionMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        },
        resetAdmissionState: (state) => {
            state.loading = false;
            state.error = null;
            state.successMessage = null;
            state.lastAdmissionDetails = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(admitNewStudent.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(admitNewStudent.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload.message || 'Student admitted successfully!';
                state.lastAdmissionDetails = {
                    studentId: action.payload.studentId,
                    rollNumber: action.payload.rollNumber,
                    generatedPassword: action.payload.generatedPassword
                };
            })
            .addCase(admitNewStudent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Error admitting student';
            });
    }
});

export const { clearAdmissionMessages, resetAdmissionState } = admissionSlice.actions;
export default admissionSlice.reducer;