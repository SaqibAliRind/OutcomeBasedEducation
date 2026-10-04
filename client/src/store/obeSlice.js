import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const PEO_API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/peos`;
const PLO_API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/plos`;
const CLO_API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/clos`;
const GA_API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/gas`;
const TARGET_API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/targets`;

const getConfig = (getState) => {
  const { auth: { token } } = getState();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// ─────────────────────────────────────────────────────
// PEO Thunks
// ─────────────────────────────────────────────────────
export const fetchPEOs = createAsyncThunk('obe/fetchPEOs', async (_, { getState, rejectWithValue }) => {
  try {
    const res = await axios.get(PEO_API, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createPEO = createAsyncThunk('obe/createPEO', async (payload, { getState, rejectWithValue }) => {
  try {
    const res = await axios.post(PEO_API, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updatePEO = createAsyncThunk('obe/updatePEO', async ({ id, payload }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${PEO_API}/${id}`, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deletePEO = createAsyncThunk('obe/deletePEO', async (id, { getState, rejectWithValue }) => {
  try {
    await axios.delete(`${PEO_API}/${id}`, getConfig(getState));
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const mapPEOtoPLOs = createAsyncThunk('obe/mapPEOtoPLOs', async ({ id, ploIds }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${PEO_API}/${id}/map-plos`, { ploIds }, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// ─────────────────────────────────────────────────────
// PLO Thunks
// ─────────────────────────────────────────────────────
export const fetchPLOs = createAsyncThunk('obe/fetchPLOs', async (programId, { getState, rejectWithValue }) => {
  try {
    const url = programId ? `${PLO_API}?program=${programId}` : PLO_API;
    const res = await axios.get(url, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createPLO = createAsyncThunk('obe/createPLO', async (payload, { getState, rejectWithValue }) => {
  try {
    const res = await axios.post(PLO_API, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updatePLO = createAsyncThunk('obe/updatePLO', async ({ id, payload }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${PLO_API}/${id}`, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deletePLO = createAsyncThunk('obe/deletePLO', async (id, { getState, rejectWithValue }) => {
  try {
    await axios.delete(`${PLO_API}/${id}`, getConfig(getState));
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const mapPLOtoPEOs = createAsyncThunk('obe/mapPLOtoPEOs', async ({ id, peos }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${PLO_API}/${id}/map-peos`, { peos }, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const mapPLOtoGAs = createAsyncThunk('obe/mapPLOtoGAs', async ({ id, gas }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${PLO_API}/${id}/map-gas`, { gas }, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// ─────────────────────────────────────────────────────
// CLO Thunks
// ─────────────────────────────────────────────────────
export const fetchCLOs = createAsyncThunk('obe/fetchCLOs', async (courseId, { getState, rejectWithValue }) => {
  try {
    const url = courseId ? `${CLO_API}?course=${courseId}` : CLO_API;
    const res = await axios.get(url, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createCLO = createAsyncThunk('obe/createCLO', async (payload, { getState, rejectWithValue }) => {
  try {
    const res = await axios.post(CLO_API, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updateCLO = createAsyncThunk('obe/updateCLO', async ({ id, payload }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${CLO_API}/${id}`, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deleteCLO = createAsyncThunk('obe/deleteCLO', async (id, { getState, rejectWithValue }) => {
  try {
    await axios.delete(`${CLO_API}/${id}`, getConfig(getState));
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const mapCLOtoPLOs = createAsyncThunk('obe/mapCLOtoPLOs', async ({ id, plos }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${CLO_API}/${id}/map-plos`, { plos }, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const mapCLOtoGAs = createAsyncThunk('obe/mapCLOtoGAs', async ({ id, gas }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${CLO_API}/${id}/map-gas`, { gas }, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// ─────────────────────────────────────────────────────
// GA Thunks
// ─────────────────────────────────────────────────────
export const fetchGAs = createAsyncThunk('obe/fetchGAs', async (programId, { getState, rejectWithValue }) => {
  try {
    const url = programId ? `${GA_API}?program=${programId}` : GA_API;
    const res = await axios.get(url, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createGA = createAsyncThunk('obe/createGA', async (payload, { getState, rejectWithValue }) => {
  try {
    const res = await axios.post(GA_API, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updateGA = createAsyncThunk('obe/updateGA', async ({ id, payload }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${GA_API}/${id}`, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deleteGA = createAsyncThunk('obe/deleteGA', async (id, { getState, rejectWithValue }) => {
  try {
    await axios.delete(`${GA_API}/${id}`, getConfig(getState));
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const mapGAtoPLOs = createAsyncThunk('obe/mapGAtoPLOs', async ({ id, ploIds }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${GA_API}/${id}/map-plos`, { ploIds }, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const bulkInitGAs = createAsyncThunk('obe/bulkInitGAs', async (programId, { getState, rejectWithValue }) => {
  try {
    const res = await axios.post(`${GA_API}/bulk-init`, { programId }, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// ─────────────────────────────────────────────────────
// Target Thunks
// ─────────────────────────────────────────────────────
export const fetchTargets = createAsyncThunk('obe/fetchTargets', async (_, { getState, rejectWithValue }) => {
  try {
    const res = await axios.get(TARGET_API, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updateTargets = createAsyncThunk('obe/updateTargets', async (payload, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(TARGET_API, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// ─────────────────────────────────────────────────────
// OBE Slice
// ─────────────────────────────────────────────────────
const obeSlice = createSlice({
  name: 'obe',
  initialState: {
    peos: [],
    plos: [],
    clos: [],
    gas: [],
    targets: null,
    loading: false,
    error: null,
    successMessage: null
  },
  reducers: {
    clearObeMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // ── PEOs ──
      .addCase(fetchPEOs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPEOs.fulfilled, (state, action) => { state.loading = false; state.peos = action.payload; })
      .addCase(fetchPEOs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createPEO.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createPEO.fulfilled, (state, action) => {
        state.loading = false;
        state.peos.unshift(action.payload);
        state.successMessage = 'PEO created successfully!';
      })
      .addCase(createPEO.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updatePEO.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updatePEO.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.peos.findIndex(p => p._id === action.payload._id);
        if (idx !== -1) state.peos[idx] = action.payload;
        state.successMessage = 'PEO updated successfully!';
      })
      .addCase(updatePEO.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(deletePEO.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deletePEO.fulfilled, (state, action) => {
        state.loading = false;
        state.peos = state.peos.filter(p => p._id !== action.payload);
        state.successMessage = 'PEO deleted successfully!';
      })
      .addCase(deletePEO.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(mapPEOtoPLOs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(mapPEOtoPLOs.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.peos.findIndex(p => p._id === action.payload.peo._id);
        if (idx !== -1) state.peos[idx] = action.payload.peo;
        state.successMessage = 'PEO mapped to PLOs successfully!';
      })
      .addCase(mapPEOtoPLOs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // ── PLOs ──
      .addCase(fetchPLOs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPLOs.fulfilled, (state, action) => { state.loading = false; state.plos = action.payload; })
      .addCase(fetchPLOs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createPLO.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createPLO.fulfilled, (state, action) => {
        state.loading = false;
        state.plos.unshift(action.payload);
        state.successMessage = 'PLO created successfully!';
      })
      .addCase(createPLO.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updatePLO.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updatePLO.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.plos.findIndex(p => p._id === action.payload._id);
        if (idx !== -1) state.plos[idx] = action.payload;
        state.successMessage = 'PLO updated successfully!';
      })
      .addCase(updatePLO.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(deletePLO.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deletePLO.fulfilled, (state, action) => {
        state.loading = false;
        state.plos = state.plos.filter(p => p._id !== action.payload);
        state.successMessage = 'PLO deleted successfully!';
      })
      .addCase(deletePLO.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(mapPLOtoPEOs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(mapPLOtoPEOs.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.plos.findIndex(p => p._id === action.payload._id);
        if (idx !== -1) state.plos[idx] = action.payload;
        state.successMessage = 'PLO mapped to PEOs successfully!';
      })
      .addCase(mapPLOtoPEOs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(mapPLOtoGAs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(mapPLOtoGAs.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.plos.findIndex(p => p._id === action.payload._id);
        if (idx !== -1) state.plos[idx] = action.payload;
        state.successMessage = 'PLO mapped to GAs successfully!';
      })
      .addCase(mapPLOtoGAs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // ── CLOs ──
      .addCase(fetchCLOs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCLOs.fulfilled, (state, action) => { state.loading = false; state.clos = action.payload; })
      .addCase(fetchCLOs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createCLO.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createCLO.fulfilled, (state, action) => {
        state.loading = false;
        state.clos.push(action.payload);
        // Sort by course then code
        state.clos.sort((a, b) => a.code.localeCompare(b.code));
        state.successMessage = 'CLO created successfully!';
      })
      .addCase(createCLO.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updateCLO.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateCLO.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.clos.findIndex(c => c._id === action.payload._id);
        if (idx !== -1) state.clos[idx] = action.payload;
        state.successMessage = 'CLO updated successfully!';
      })
      .addCase(updateCLO.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(deleteCLO.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteCLO.fulfilled, (state, action) => {
        state.loading = false;
        state.clos = state.clos.filter(c => c._id !== action.payload);
        state.successMessage = 'CLO deleted successfully!';
      })
      .addCase(deleteCLO.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(mapCLOtoPLOs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(mapCLOtoPLOs.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.clos.findIndex(c => c._id === action.payload._id);
        if (idx !== -1) state.clos[idx] = action.payload;
        state.successMessage = 'CLO mapped to PLOs successfully!';
      })
      .addCase(mapCLOtoPLOs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(mapCLOtoGAs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(mapCLOtoGAs.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.clos.findIndex(c => c._id === action.payload._id);
        if (idx !== -1) state.clos[idx] = action.payload;
        state.successMessage = 'CLO mapped to GAs successfully!';
      })
      .addCase(mapCLOtoGAs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // ── GAs ──
      .addCase(fetchGAs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchGAs.fulfilled, (state, action) => { state.loading = false; state.gas = action.payload; })
      .addCase(fetchGAs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createGA.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createGA.fulfilled, (state, action) => {
        state.loading = false;
        state.gas.push(action.payload);
        state.successMessage = 'GA created successfully!';
      })
      .addCase(createGA.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updateGA.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateGA.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.gas.findIndex(g => g._id === action.payload._id);
        if (idx !== -1) state.gas[idx] = action.payload;
        state.successMessage = 'GA updated successfully!';
      })
      .addCase(updateGA.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(deleteGA.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteGA.fulfilled, (state, action) => {
        state.loading = false;
        state.gas = state.gas.filter(g => g._id !== action.payload);
        state.successMessage = 'GA deleted successfully!';
      })
      .addCase(deleteGA.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(mapGAtoPLOs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(mapGAtoPLOs.fulfilled, (state, action) => {
        state.loading = false;
        // Update the GA in state (PLOs updated on backend, refresh PLOs separately)
        const idx = state.gas.findIndex(g => g._id === action.payload.ga._id);
        if (idx !== -1) state.gas[idx] = action.payload.ga;
        state.successMessage = 'GA mapped to PLOs successfully!';
      })
      .addCase(mapGAtoPLOs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(bulkInitGAs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(bulkInitGAs.fulfilled, (state, action) => {
        state.loading = false;
        state.gas.push(...action.payload.created);
        state.successMessage = action.payload.message;
      })
      .addCase(bulkInitGAs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Targets
      .addCase(fetchTargets.pending, (state) => { state.loading = true; })
      .addCase(fetchTargets.fulfilled, (state, action) => {
        state.loading = false;
        state.targets = action.payload;
      })
      .addCase(fetchTargets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTargets.fulfilled, (state, action) => {
        state.targets = action.payload;
      });
  }
});

export const { clearObeMessages } = obeSlice.actions;
export default obeSlice.reducer;
