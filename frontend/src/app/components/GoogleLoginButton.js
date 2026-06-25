"use client";

import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GoogleLoginButton() {
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return null;
  }

  const handleSuccess = async (response) => {
    setError('');
    try {
      await loginWithGoogle(response.credential);
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sign in with Google');
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      {error && (
        <div style={{ color: 'var(--status-wrong)', marginBottom: '0.75rem', fontSize: '0.875rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => setError('Google sign-in was cancelled or failed')}
          theme="outline"
          size="large"
          text="signin_with"
          width="100%"
        />
      </div>
    </div>
  );
}
