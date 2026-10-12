import { createSlice } from "@reduxjs/toolkit";
import { loginSuccess, logout, sessionChecking } from "./authSlice";

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishlist(state, action) {
      state.items = action.payload;
    },

    addToWishlist(state, action) {
      state.items.push(action.payload);
    },

    removeFromWishlist(state, action) {
      state.items = state.items.filter(
        (item) => item.productId._id !== action.payload
      );
    },

    clearWishlist(state) {
      state.items = [];
    },

    setLoading(state, action) {
      state.loading = action.payload;
    },

    setError(state, action) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginSuccess, (state) => { state.items = []; state.error = null; })
      .addCase(logout, (state) => { state.items = []; state.error = null; })
      .addCase(sessionChecking, (state) => { state.items = []; state.error = null; });
  },
});

export const {
  setWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  setLoading,
  setError,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
