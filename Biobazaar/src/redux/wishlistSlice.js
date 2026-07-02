import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishlist: (state, action) => {
      state.items = action.payload;
    },

    addToWishlist: (state, action) => {
      const exists = state.items.find(
        (item) => item.productId._id === action.payload.productId._id
      );

      if (!exists) {
        state.items.push(action.payload);
      }
    },

    removeFromWishlist: (state, action) => {
      state.items = state.items.filter(
        (item) => item.productId._id !== action.payload
      );
    },

    clearWishlist: (state) => {
      state.items = [];
    },
  },
});

export const {
  setWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;