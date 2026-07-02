import { createSlice } from "@reduxjs/toolkit";

// Initial State
const initialState = {
  token: localStorage.getItem("token") || null,
  userId: localStorage.getItem("userId") || null,
  isAuthenticated: !!localStorage.getItem("token"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    // Login / Auto Login after Signup
    loginSuccess: (state, action) => {
      const { token, userId } = action.payload;

      state.token = token;
      state.userId = userId;
      state.isAuthenticated = true;

      // Persist Authentication
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
    },

    // Logout
    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.isAuthenticated = false;

      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;