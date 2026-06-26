"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import Button from '../../components/Button';

export default function AdminContests() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await api.get('/contests');
        setContests(response.data);
      } catch (err) {
        console.error('Failed to fetch contests', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'ADMIN' || user?.role === 'PROBLEM_SETTER') {
      fetchContests();
    }
  }, [user]);

  if (authLoading || loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROBLEM_SETTER')) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>You do not have permission.</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', m: 0 }}>Manage Contests</h1>
        <Button onClick={() => router.push('/admin/contests/create')} variant="primary">
          Create Contest
        </Button>
      </div>

      {contests.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}>
          No contests found.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {contests.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface)' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{c.name}</h3>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem' }}>
                  <span>Starts: {new Date(c.start_time).toLocaleString()}</span>
                  <span>Ends: {new Date(c.end_time).toLocaleString()}</span>
                  <span>Format: {c.format}</span>
                </div>
              </div>
              <Button onClick={() => router.push(`/admin/contests/${c.id}/edit`)} variant="secondary">
                Edit Problems
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
