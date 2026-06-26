"use client";

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import MarkdownEditor from '../../../components/MarkdownEditor';
import toast from 'react-hot-toast';

export default function CreateContest() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState('STANDARD');
  const [isPublic, setIsPublic] = useState(true);
  
  // Set default times (start: 1 hour from now, end: 3 hours from now)
  const defaultStart = new Date();
  defaultStart.setHours(defaultStart.getHours() + 1);
  const defaultEnd = new Date();
  defaultEnd.setHours(defaultEnd.getHours() + 3);

  // Format to YYYY-MM-DDTHH:mm for datetime-local inputs
  const toLocalISOString = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [startTime, setStartTime] = useState(toLocalISOString(defaultStart));
  const [endTime, setEndTime] = useState(toLocalISOString(defaultEnd));
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROBLEM_SETTER')) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>You do not have permission.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await api.post('/contests', {
        name,
        description,
        format,
        is_public: isPublic,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString()
      });
      toast.success('Contest created successfully!');
      router.push(`/admin/contests/${response.data.id}/edit`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create contest');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', m: 0 }}>Create Contest</h1>
        <Button onClick={() => router.push('/admin/contests')} variant="secondary">
          Cancel
        </Button>
      </div>

      {error && (
        <div style={{ color: 'var(--status-wrong)', marginBottom: '1rem', padding: '0.75rem', border: '1px solid var(--status-wrong)', borderRadius: 'var(--radius)', backgroundColor: '#fef2f2' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Input 
          label="Contest Name" 
          id="name" 
          type="text" 
          required 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Weekly Contest 1" 
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>
            Description (Markdown)
          </label>
          <MarkdownEditor 
            value={description}
            onChange={setDescription}
            placeholder="Describe the rules and details of the contest."
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>Start Time</label>
            <input 
              type="datetime-local" 
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>End Time</label>
            <input 
              type="datetime-local" 
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
            >
              <option value="STANDARD">Standard</option>
              <option value="ICPC">ICPC</option>
              <option value="IOI">IOI</option>
            </select>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '1.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Public Contest
            </label>
          </div>
        </div>

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create & Add Problems'}
        </Button>
      </form>
    </div>
  );
}
