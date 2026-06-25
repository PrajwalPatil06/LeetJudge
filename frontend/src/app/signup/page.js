"use client";

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Input from '../components/Input';
import Button from '../components/Button';
import GoogleLoginButton from '../components/GoogleLoginButton';
import Link from 'next/link';

export default function Signup() {
  const [step, setStep] = useState(1); // 1 = Details, 2 = OTP
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup, sendOtp, verifyOtp } = useAuth();
  const router = useRouter();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await sendOtp(email);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpAndSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await verifyOtp(email, otp);
      await signup(name, username, email, password);
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Verification or signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 60px)' }}>
      <div style={{ backgroundColor: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)', width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          {step === 1 ? 'Join LeetJudge' : 'Verify Your Email'}
        </h1>
        {error && <div style={{ color: 'var(--status-wrong)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <Input label="Name" id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Username" id="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input label="Email Address" id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
              {isLoading ? 'Sending OTP...' : 'Next'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtpAndSignup}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>
              We've sent a code to <strong>{email}</strong>
            </p>
            <Input label="One-Time Password" id="otp" type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} />
            <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify & Create Account'}
            </Button>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button type="button" onClick={() => setStep(1)} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer' }}>
                Back to edit details
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '500' }}>Sign in</Link>
          </div>
        )}

        {step === 1 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
            </div>
            <GoogleLoginButton />
          </>
        )}
      </div>
    </div>
  );
}
