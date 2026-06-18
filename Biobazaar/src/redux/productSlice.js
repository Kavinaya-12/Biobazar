
import { createSlice } from '@reduxjs/toolkit';
import {
  ORGANICFOODS,
  ORGANICHEALTH,
  ORGANICHOUSEHOLD,
  ORGANICLIFESTYLE,
} from '../constants';

const initialState = {
  foods: ORGANICFOODS || [],
  personalCare: ORGANICHEALTH || [],
  household: ORGANICHOUSEHOLD || [],
  lifestyle: ORGANICLIFESTYLE || [],
  filteredProducts: [],
  searchQuery: '',
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    addProduct: (state, action) => {
      const { category, product } = action.payload;
      if (state[category]) state[category].push(product);
    },
    removeProduct: (state, action) => {
      const { category, productId } = action.payload;
      if (state[category]) {
        state[category] = state[category].filter(
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
      if (category && state[category]) {
        state.filteredProducts = [...state[category]];
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
});

export const { addProduct, removeProduct, searchProduct, filterByCategory, clearSearch } =
  productSlice.actions;

export default productSlice.reducer;
