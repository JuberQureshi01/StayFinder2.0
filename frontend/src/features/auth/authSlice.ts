import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: "user" | "host" | "admin";
  wishlist?: string[];
  profile?: { name?: string; profilePicture?: string; verified?: boolean };
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
}

interface CredentialsPayload {
  user: UserProfile;
  token: string | null;
}

// Check local storage on app boot
const storedToken = localStorage.getItem("stayfinder_token");
const storedUser = localStorage.getItem("stayfinder_user");

const initialState: AuthState = {
  isAuthenticated: !!storedToken,
  token: storedToken || null,
  user: storedUser ? JSON.parse(storedUser) : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    setCredentials: (state, action: PayloadAction<CredentialsPayload>) => {
      state.isAuthenticated = true;

      state.user = action.payload.user;

      state.token = action.payload.token;

      // Save in local storage
      localStorage.setItem(
        "stayfinder_user",
        JSON.stringify(action.payload.user),
      );

      if (action.payload.token) {
        localStorage.setItem("stayfinder_token", action.payload.token);
      }
    },

    logout: (state) => {
      state.isAuthenticated = false;

      state.user = null;

      state.token = null;

      localStorage.removeItem("stayfinder_token");

      localStorage.removeItem("stayfinder_user");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;
