import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchSearchResults = createAsyncThunk(
  'search/fetchSearchResults',
  async (query) => {
    const response = await fetch(`/api/search?q=${query}`);
    const data = await response.json();
    return data;
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    results: [],
    status: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSearchResults.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSearchResults.fulfilled, (state, action) => {
        state.results = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchSearchResults.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default searchSlice.reducer;
