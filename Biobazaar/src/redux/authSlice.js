import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api";

export const restoreSession = createAsyncThunk("auth/restoreSession", async (_, { rejectWithValue }) => {
  const token = localStorage.getItem("token");
  if (!token) return rejectWithValue({ status: 401 });
  try {
    const { data } = await api.get("/user/me");
    return { token, userId: data.user.id, email: data.user.email };
  } catch (error) {
    return rejectWithValue({ status: error.response?.status || 0 });
  }
}, {
  condition: (_, { getState }) => ["checking", "unavailable"].includes(getState().auth.status) && Boolean(localStorage.getItem("token")),
});

const readStoredValue = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};

// Initial State
const initialState = {
  token: readStoredValue("token"),
  userId: readStoredValue("userId"),
  email: readStoredValue("userEmail"),
  isAuthenticated: false,
  status: readStoredValue("token") ? "checking" : "anonymous",
  restoreError: null,
  onboardingRegistrationUserId: null,
};

const clearStoredSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
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
      state.email = action.payload.email || state.email;
      state.isAuthenticated = true;
      state.status = "authenticated";
      state.restoreError = null;
      state.onboardingRegistrationUserId = action.payload.isNewRegistration ? String(userId) : null;

      // Persist Authentication
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      if (action.payload.email) localStorage.setItem("userEmail", action.payload.email);
    },

    // Logout
    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.email = null;
      state.isAuthenticated = false;
      state.status = "anonymous";
      state.restoreError = null;
      state.onboardingRegistrationUserId = null;

      clearStoredSession();
    },
    sessionChecking: (state) => {
      state.token = readStoredValue("token");
      state.userId = readStoredValue("userId");
      state.email = readStoredValue("userEmail");
      state.isAuthenticated = false;
      state.status = state.token ? "checking" : "anonymous";
      state.restoreError = null;
      state.onboardingRegistrationUserId = null;
    },
    consumeOnboardingRegistration: (state) => {
      state.onboardingRegistrationUserId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.pending, (state) => {
        state.status = "verifying";
        state.restoreError = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.userId = action.payload.userId;
        state.email = action.payload.email;
        state.isAuthenticated = true;
        state.status = "authenticated";
        state.restoreError = null;
        state.onboardingRegistrationUserId = null;
        localStorage.setItem("userId", action.payload.userId);
        localStorage.setItem("userEmail", action.payload.email);
      })
      .addCase(restoreSession.rejected, (state, action) => {
        if (action.payload?.status === 401) {
          state.token = null;
          state.userId = null;
          state.email = null;
          state.isAuthenticated = false;
          state.status = "anonymous";
          state.onboardingRegistrationUserId = null;
          clearStoredSession();
        } else if (state.status !== "anonymous") {
          state.isAuthenticated = false;
          state.status = "unavailable";
          state.restoreError = "We couldn't verify your session. Check your connection and retry.";
        }
      });
  },
});

export const { loginSuccess, logout, sessionChecking, consumeOnboardingRegistration } = authSlice.actions;

export default authSlice.reducer;