"use client";

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Input from '../components/Input';
import Button from '../components/Button';
import GoogleLoginButton from '../components/GoogleLoginButton';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to login');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 60px)' }}>
      <div style={{ backgroundColor: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)', width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>Sign In to LeetJudge</h1>
        {error && <div style={{ color: 'var(--status-wrong)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <Input label="Email Address" id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '1rem' }}>Sign In</Button>
        </form>
        <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
        </div>
        <GoogleLoginButton />
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: '500' }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
