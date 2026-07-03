
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api';

const categorizeProducts = (products) => ({
  foods: products.filter((product) => product.collec === 'Foods'),
  personalCare: products.filter((product) => product.collec === 'PersonalCare'),
  household: products.filter((product) => product.collec === 'Household'),
  lifestyle: products.filter((product) => product.collec === 'Lifestyle'),
});

const getCategoryKey = (category) => {
  const normalized = String(category || '').trim().toLowerCase();
  if (normalized === 'foods') return 'foods';
  if (normalized === 'personalcare' || normalized === 'personal care') return 'personalCare';
  if (normalized === 'household') return 'household';
  if (normalized === 'lifestyle') return 'lifestyle';
  return '';
};

export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
  const response = await api.get('/products');
  return response.data.products || [];
});

const initialState = {
  foods: [],
  personalCare: [],
  household: [],
  lifestyle: [],
  filteredProducts: [],
  searchQuery: '',
  status: 'idle',
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      const categorized = categorizeProducts(action.payload || []);
      state.foods = categorized.foods;
      state.personalCare = categorized.personalCare;
      state.household = categorized.household;
      state.lifestyle = categorized.lifestyle;
    },
    addProduct: (state, action) => {
      const { category, product } = action.payload;
      const key = getCategoryKey(category);
      if (key && state[key]) {
        state[key].push(product);
      }
    },
    removeProduct: (state, action) => {
      const { category, productId } = action.payload;
      const key = getCategoryKey(category);
      if (key && state[key]) {
        state[key] = state[key].filter(
          (product) => (product._id || product.id) !== productId
        );
      }
    },
    searchProduct: (state, action) => {
      const searchText =
        typeof action.payload === 'string' ? action.payload.trim().toLowerCase() : '';
      state.searchQuery = searchText;
      if (!searchText) {
        state.filteredProducts = [];
        return;
      }

      const allProducts = [
        ...state.foods,
        ...state.personalCare,
        ...state.household,
        ...state.lifestyle,
      ];

      state.filteredProducts = allProducts.filter((item) => {
        const name = (item.name || item.title || '').toString().toLowerCase();
        return name.includes(searchText);
      });
    },
    filterByCategory: (state, action) => {
      const category = typeof action.payload === 'string' ? action.payload : '';
      const key = getCategoryKey(category);
      if (key && state[key]) {
        state.filteredProducts = [...state[key]];
        state.searchQuery = '';
      } else {
        state.filteredProducts = [];
        state.searchQuery = '';
      }
    },
    clearSearch: (state) => {
      state.filteredProducts = [];
      state.searchQuery = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        const categorized = categorizeProducts(action.payload || []);
        state.foods = categorized.foods;
        state.personalCare = categorized.personalCare;
        state.household = categorized.household;
        state.lifestyle = categorized.lifestyle;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const {
  setProducts,
  addProduct,
  removeProduct,
  searchProduct,
  filterByCategory,
  clearSearch,
} = productSlice.actions;

export default productSlice.reducer;
