import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchArchives = createAsyncThunk(
    'archive/fetchArchives',
    async (params, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            // params = { type, session, semester, search }
            const queryStrings = new URLSearchParams(params).toString();
            const { data } = await axios.get(`/api/archive?${queryStrings}`, { headers: { Authorization: `Bearer ${token}` } });
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const restoreArchive = createAsyncThunk(
    'archive/restoreArchive',
    async ({ id, type }, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            const { data } = await axios.put(`/api/archive/${id}/restore`, { type }, { headers: { Authorization: `Bearer ${token}` } });
            return data.id; // Return restored ID
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const permanentDeleteArchive = createAsyncThunk(
    'archive/permanentDeleteArchive',
    async ({ id, type }, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            const { data } = await axios.delete(`/api/archive/${id}/permanent?type=${type}`, { headers: { Authorization: `Bearer ${token}` } });
            return data.id; // Return deleted ID
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const archiveSlice = createSlice({
    name: 'archive',
    initialState: {
        list: [],
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearArchiveMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchArchives.pending, (state) => { state.loading = true; })
            .addCase(fetchArchives.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchArchives.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            .addCase(restoreArchive.pending, (state) => { state.loading = true; })
            .addCase(restoreArchive.fulfilled, (state, action) => {
                state.loading = false;
                state.list = state.list.filter(item => item._id !== action.payload);
                state.successMessage = 'Item restored successfully!';
            })
            .addCase(restoreArchive.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            
            .addCase(permanentDeleteArchive.pending, (state) => { state.loading = true; })
            .addCase(permanentDeleteArchive.fulfilled, (state, action) => {
                state.loading = false;
                state.list = state.list.filter(item => item._id !== action.payload);
                state.successMessage = 'Item permanently deleted!';
            })
            .addCase(permanentDeleteArchive.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    }
});

export const { clearArchiveMessages } = archiveSlice.actions;
export default archiveSlice.reducer;
