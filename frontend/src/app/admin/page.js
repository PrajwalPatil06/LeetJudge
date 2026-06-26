"use client";

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../lib/api';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState('USER');
  const [updating, setUpdating] = useState(false);

  if (authLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        You do not have permission to view the Admin Panel.
      </div>
    );
  }

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setUpdating(true);
    const toastId = toast.loading('Updating role...');

    try {
      const response = await api.put('/admin/role', { email, newRole });
      toast.success(`Role updated successfully to ${response.data.user.role}`, { id: toastId });
      setEmail(''); // Reset email after success
    } catch (error) {
      console.error('Role update failed:', error);
      toast.error(error.response?.data?.error || 'Failed to update role', { id: toastId });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Admin Panel</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <Button onClick={() => router.push('/admin/contests')} variant="primary">
          Manage Contests
        </Button>
      </div>
      
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius)',
        padding: '1.5rem',
      }}>
        <h2 style={{ fontSize: '1.125rem', marginTop: 0, marginBottom: '1rem', color: 'var(--text-main)' }}>Role Management</h2>
        
        <form onSubmit={handleUpdateRole}>
          <Input 
            label="User Email" 
            id="email" 
            type="email" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="user@example.com" 
          />
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="newRole" style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>
              Assign New Role
            </label>
            <select
              id="newRole"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: 'var(--radius)', 
                border: '1px solid var(--border-color)', 
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            >
              <option value="USER">User (Standard)</option>
              <option value="PROBLEM_SETTER">Problem Setter</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <Button type="submit" variant="primary" style={{ width: '100%' }} disabled={updating}>
            {updating ? 'Updating Role...' : 'Update Role'}
          </Button>
        </form>
      </div>
    </div>
  );
}
