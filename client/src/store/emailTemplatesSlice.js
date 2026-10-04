import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getHeaders = (getState) => {
  const { auth: { token } } = getState();
  return { Authorization: `Bearer ${token}` };
};

export const fetchEmailTemplates = createAsyncThunk('emailTemplates/fetch', async (_, { getState, rejectWithValue }) => {
  try {
    const { data } = await axios.get('/api/email-templates', { headers: getHeaders(getState) });
    return data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const updateEmailTemplate = createAsyncThunk('emailTemplates/update', async ({ id, subject, body }, { getState, rejectWithValue }) => {
  try {
    const { data } = await axios.put(`/api/email-templates/${id}`, { subject, body }, { headers: getHeaders(getState) });
    return data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const sendTestEmailThunk = createAsyncThunk('emailTemplates/sendTest', async (id, { getState, rejectWithValue }) => {
  try {
    const { data } = await axios.post(`/api/email-templates/${id}/send-test`, {}, { headers: getHeaders(getState) });
    return data.message;
  } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

const emailTemplatesSlice = createSlice({
  name: 'emailTemplates',
  initialState: { list: [], loading: false, error: null, testMsg: null },
  reducers: { clearTestMsg: (s) => { s.testMsg = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmailTemplates.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchEmailTemplates.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchEmailTemplates.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    builder
      .addCase(updateEmailTemplate.fulfilled, (s, a) => {
        const idx = s.list.findIndex(t => t._id === a.payload._id);
        if (idx !== -1) s.list[idx] = a.payload;
      });
    builder
      .addCase(sendTestEmailThunk.fulfilled, (s, a) => { s.testMsg = a.payload; })
      .addCase(sendTestEmailThunk.rejected, (s, a) => { s.testMsg = `Error: ${a.payload}`; });
  }
});

export const { clearTestMsg } = emailTemplatesSlice.actions;
export default emailTemplatesSlice.reducer;
