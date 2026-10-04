import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/curriculums`; // Adjust base URL if using Vite env proxy

const getConfig = (getState) => {
  const { auth: { token } } = getState();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const fetchCurriculums = createAsyncThunk('curriculum/fetchAll', async (_, { getState, rejectWithValue }) => {
  try {
    const res = await axios.get(API, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createCurriculum = createAsyncThunk('curriculum/create', async (payload, { getState, rejectWithValue }) => {
  try {
    const res = await axios.post(API, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updateCurriculum = createAsyncThunk('curriculum/update', async ({ id, payload }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${API}/${id}`, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const cloneCurriculum = createAsyncThunk('curriculum/clone', async ({ id, payload }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.post(`${API}/${id}/clone`, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deleteCurriculum = createAsyncThunk('curriculum/delete', async (id, { getState, rejectWithValue }) => {
  try {
    await axios.delete(`${API}/${id}`, getConfig(getState));
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const addCurriculumCourse = createAsyncThunk('curriculum/addCourse', async ({ id, payload }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.post(`${API}/${id}/courses`, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const removeCurriculumCourse = createAsyncThunk('curriculum/removeCourse', async ({ id, courseId }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.delete(`${API}/${id}/courses/${courseId}`, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updateCurriculumPrerequisites = createAsyncThunk('curriculum/updatePrerequisites', async ({ id, courseId, payload }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${API}/${id}/courses/${courseId}/prerequisites`, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updateCourseType = createAsyncThunk('curriculum/updateCourseType', async ({ id, courseId, payload }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${API}/${id}/courses/${courseId}/type`, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const reorderSemesterCourses = createAsyncThunk('curriculum/reorderSemesterCourses', async ({ id, semesterNumber, payload }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${API}/${id}/semesters/${semesterNumber}/reorder`, payload, getConfig(getState));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const curriculumSlice = createSlice({
  name: 'curriculum',
  initialState: {
    curriculums: [],
    loading: false,
    error: null,
    successMessage: null
  },
  reducers: {
    clearCurriculumMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCurriculums.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCurriculums.fulfilled, (state, action) => { state.loading = false; state.curriculums = action.payload; })
      .addCase(fetchCurriculums.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Create
      .addCase(createCurriculum.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createCurriculum.fulfilled, (state, action) => {
        state.loading = false;
        state.curriculums.unshift(action.payload);
        state.successMessage = 'Curriculum created successfully!';
      })
      .addCase(createCurriculum.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Update
      .addCase(updateCurriculum.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateCurriculum.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.curriculums.findIndex(c => c._id === action.payload._id);
        if (index !== -1) state.curriculums[index] = action.payload;
        state.successMessage = 'Curriculum updated successfully!';
      })
      .addCase(updateCurriculum.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Clone
      .addCase(cloneCurriculum.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(cloneCurriculum.fulfilled, (state, action) => {
        state.loading = false;
        state.curriculums.unshift(action.payload);
        state.successMessage = 'Curriculum cloned successfully!';
      })
      .addCase(cloneCurriculum.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Delete
      .addCase(deleteCurriculum.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteCurriculum.fulfilled, (state, action) => {
        state.loading = false;
        state.curriculums = state.curriculums.filter(c => c._id !== action.payload);
        state.successMessage = 'Curriculum deleted successfully!';
      })
      .addCase(deleteCurriculum.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Add Course
      .addCase(addCurriculumCourse.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addCurriculumCourse.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.curriculums.findIndex(c => c._id === action.payload._id);
        if (index !== -1) state.curriculums[index] = action.payload;
        state.successMessage = 'Course added successfully!';
      })
      .addCase(addCurriculumCourse.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Remove Course
      .addCase(removeCurriculumCourse.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(removeCurriculumCourse.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.curriculums.findIndex(c => c._id === action.payload._id);
        if (index !== -1) state.curriculums[index] = action.payload;
        state.successMessage = 'Course removed successfully!';
      })
      .addCase(removeCurriculumCourse.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Update Prerequisites
      .addCase(updateCurriculumPrerequisites.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateCurriculumPrerequisites.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.curriculums.findIndex(c => c._id === action.payload._id);
        if (index !== -1) state.curriculums[index] = action.payload;
        state.successMessage = 'Prerequisites updated successfully!';
      })
      .addCase(updateCurriculumPrerequisites.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Update Course Type
      .addCase(updateCourseType.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateCourseType.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.curriculums.findIndex(c => c._id === action.payload._id);
        if (index !== -1) state.curriculums[index] = action.payload;
        state.successMessage = 'Course type updated successfully!';
      })
      .addCase(updateCourseType.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Reorder Courses
      .addCase(reorderSemesterCourses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(reorderSemesterCourses.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.curriculums.findIndex(c => c._id === action.payload._id);
        if (index !== -1) state.curriculums[index] = action.payload;
        state.successMessage = 'Courses reordered successfully!';
      })
      .addCase(reorderSemesterCourses.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export const { clearCurriculumMessages } = curriculumSlice.actions;
export default curriculumSlice.reducer;