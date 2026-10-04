import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getHeaders = (getState) => {
  const { auth: { token } } = getState();
  return { Authorization: `Bearer ${token}` };
};

export const fetchActivityLogs = createAsyncThunk('logs/fetchActivity', async (params = {}, { getState, rejectWithValue }) => {
  try {
    const query = new URLSearchParams({ type: 'activity', ...params }).toString();
    const { data } = await axios.get(`/api/logs?${query}`, { headers: getHeaders(getState) });
    return data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const fetchAuditLogs = createAsyncThunk('logs/fetchAudit', async (params = {}, { getState, rejectWithValue }) => {
  try {
    const query = new URLSearchParams(params).toString();
    const { data } = await axios.get(`/api/audit-logs?${query}`, { headers: getHeaders(getState) });
    return data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const fetchAiStats = createAsyncThunk('logs/fetchAiStats', async (_, { getState, rejectWithValue }) => {
  try {
    const { data } = await axios.get('/api/logs/ai-stats', { headers: getHeaders(getState) });
    return data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const fetchLogs = createAsyncThunk('logs/fetchAll', async (type, { getState, rejectWithValue }) => {
    try {
        const url = type ? `/api/logs?type=${type}` : `/api/logs`;
        const { data } = await axios.get(url, { headers: getHeaders(getState) });
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const clearOldLogs = createAsyncThunk('logs/clearOld', async (_, { getState, rejectWithValue }) => {
    try {
        const { data } = await axios.delete(`/api/logs`, { headers: getHeaders(getState) });
        return data.message;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

const logsSlice = createSlice({
  name: 'logs',
  initialState: {
    // New structures for University Admin
    activity: { data: [], total: 0, pages: 1, loading: false, error: null },
    audit: { data: [], total: 0, pages: 1, loading: false, error: null },
    aiStats: { total: 0, success: 0, errors: 0, byModule: [], loading: false, error: null },
    // Old structures for Super Admin
    logs: [],
    loading: false,
    error: null,
    successMessage: null
  },
  reducers: {
    clearLogMessages: (state) => {
        state.error = null;
        state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    // SuperAdmin Actions
    builder
        .addCase(fetchLogs.pending, (state) => { state.loading = true; state.error = null; })
        .addCase(fetchLogs.fulfilled, (state, action) => { state.loading = false; state.logs = action.payload; })
        .addCase(fetchLogs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
        .addCase(clearOldLogs.pending, (state) => { state.loading = true; state.error = null; })
        .addCase(clearOldLogs.fulfilled, (state, action) => { state.loading = false; state.successMessage = action.payload; })
        .addCase(clearOldLogs.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    // UniversityAdmin Actions
    builder
      .addCase(fetchActivityLogs.pending, (s) => { s.activity.loading = true; s.activity.error = null; })
      .addCase(fetchActivityLogs.fulfilled, (s, a) => { s.activity.loading = false; s.activity.data = a.payload.data; s.activity.total = a.payload.total; s.activity.pages = a.payload.pages; })
      .addCase(fetchActivityLogs.rejected, (s, a) => { s.activity.loading = false; s.activity.error = a.payload; });
    builder
      .addCase(fetchAuditLogs.pending, (s) => { s.audit.loading = true; s.audit.error = null; })
      .addCase(fetchAuditLogs.fulfilled, (s, a) => { s.audit.loading = false; s.audit.data = a.payload.data; s.audit.total = a.payload.total; s.audit.pages = a.payload.pages; })
      .addCase(fetchAuditLogs.rejected, (s, a) => { s.audit.loading = false; s.audit.error = a.payload; });
    builder
      .addCase(fetchAiStats.pending, (s) => { s.aiStats.loading = true; })
      .addCase(fetchAiStats.fulfilled, (s, a) => { s.aiStats.loading = false; Object.assign(s.aiStats, a.payload); })
      .addCase(fetchAiStats.rejected, (s, a) => { s.aiStats.loading = false; s.aiStats.error = a.payload; });
  }
});

export const { clearLogMessages } = logsSlice.actions;
export default logsSlice.reducer;
