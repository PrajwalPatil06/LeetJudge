"use client";

import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";

export function Providers({ children }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      <AuthProvider>
        <Toaster position="top-right" />
        {children}
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
