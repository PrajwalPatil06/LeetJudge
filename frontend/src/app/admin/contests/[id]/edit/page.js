"use client";

import { useState, useEffect, use } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import Button from '../../../../components/Button';
import Input from '../../../../components/Input';
import toast from 'react-hot-toast';

export default function EditContestProblems({ params }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [contest, setContest] = useState(null);
  const [contestProblems, setContestProblems] = useState([]);
  const [allProblems, setAllProblems] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contestRes, contestProbsRes, allProbsRes] = await Promise.all([
          api.get(`/contests/${id}`),
          api.get(`/contests/${id}/problems`),
          api.get('/problems')
        ]);
        
        setContest(contestRes.data);
        setContestProblems(contestProbsRes.data);
        setAllProblems(allProbsRes.data.problems);
      } catch (err) {
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'ADMIN' || user?.role === 'PROBLEM_SETTER') {
      fetchData();
    }
  }, [id, user]);

  if (authLoading || loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROBLEM_SETTER')) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>You do not have permission.</div>;
  }

  const addProblem = (problemId) => {
    if (contestProblems.some(cp => cp.id === problemId)) return;
    const problem = allProblems.find(p => p.id === problemId);
    if (!problem) return;
    
    setContestProblems([
      ...contestProblems,
      {
        ...problem,
        problem_id: problem.id,
        problem_order: contestProblems.length + 1,
        max_score: 100
      }
    ]);
  };

  const removeProblem = (problemId) => {
    setContestProblems(contestProblems.filter(cp => cp.id !== problemId));
  };

  const updateProblem = (problemId, field, value) => {
    setContestProblems(contestProblems.map(cp => {
      if (cp.id === problemId || cp.problem_id === problemId) {
        return { ...cp, [field]: Number(value) };
      }
      return cp;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const toastId = toast.loading('Saving contest problems...');
    try {
      const payload = contestProblems.map(cp => ({
        problem_id: cp.problem_id || cp.id,
        problem_order: cp.problem_order,
        max_score: cp.max_score
      }));
      await api.put(`/contests/${id}/problems`, { problems: payload });
      toast.success('Contest problems updated!', { id: toastId });
      router.push('/admin/contests');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const availableProblems = allProblems.filter(p => !contestProblems.some(cp => cp.id === p.id || cp.problem_id === p.id));

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>Edit Contest Problems</h1>
          {contest && <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{contest.name}</p>}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={() => router.push('/admin/contests')} variant="secondary">Cancel</Button>
          <Button onClick={handleSave} variant="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Current Contest Problems */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Contest Problems</h2>
          {contestProblems.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)' }}>
              No problems added yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {contestProblems.map((cp, index) => (
                <div key={cp.id || cp.problem_id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{cp.title}</h3>
                    <Button onClick={() => removeProblem(cp.id || cp.problem_id)} variant="secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--status-wrong)' }}>
                      Remove
                    </Button>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <Input 
                      label="Order (e.g. 1, 2, 3)" 
                      id={`order-${cp.id}`} 
                      type="number" 
                      value={cp.problem_order || ''} 
                      onChange={(e) => updateProblem(cp.id || cp.problem_id, 'problem_order', e.target.value)} 
                    />
                    <Input 
                      label="Max Score" 
                      id={`score-${cp.id}`} 
                      type="number" 
                      value={cp.max_score || ''} 
                      onChange={(e) => updateProblem(cp.id || cp.problem_id, 'max_score', e.target.value)} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Problems Pool */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Available Problems</h2>
          <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface)', maxHeight: '600px', overflowY: 'auto' }}>
            {availableProblems.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>No more problems available.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {availableProblems.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {p.difficulty} • {p.is_hidden ? 'Hidden' : 'Public'}
                      </div>
                    </div>
                    <Button onClick={() => addProblem(p.id)} variant="secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
