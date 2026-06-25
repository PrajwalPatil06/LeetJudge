"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import CodeEditor from '../../components/CodeEditor';
import Button from '../../components/Button';
import DifficultyBadge from '../../components/DifficultyBadge';
import ClickableProblemTag from '../../components/ClickableProblemTag';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

// Language IDs must match backend models/language.js
const LANGUAGES = [
  { id: 54, name: 'C++', monacoId: 'cpp' },
  { id: 62, name: 'Java', monacoId: 'java' },
  { id: 71, name: 'Python 3', monacoId: 'python' },
  { id: 93, name: 'Node.js', monacoId: 'javascript' },
];

const DEFAULT_CODE = {
  54: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}',
  62: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
  71: '# Your code here\n',
  93: '// Your code here\n',
};

export default function ProblemWorkspace() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState(71); // default Python
  const [code, setCode] = useState(DEFAULT_CODE[71]);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);
  const [shortcut, setShortcut] = useState('Ctrl Enter');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      if (navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.userAgent.toUpperCase().indexOf('MAC') >= 0) {
        setShortcut('⌘ Enter');
      }
    }
  }, []);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await api.get(`/problems/${id}`);
        // Backend returns { problem: {...} }
        setProblem(res.data.problem || res.data);
      } catch (err) {
        console.error("Failed to load problem", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  const handleLangChange = (newLang) => {
    const langId = Number(newLang);
    setLang(langId);
    setCode(DEFAULT_CODE[langId]);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to submit");
      return;
    }
    setSubmitting(true);
    setSubmissionResult(null);
    try {
      const res = await api.post('/submissions', {
        problemId: id,
        lang: lang,
        code: code,
      });
      const submission = res.data.submission;
      setSubmissionResult(submission);

      // Poll for verdict updates since judging is async
      if (submission && submission.id) {
        const interval = setInterval(async () => {
          try {
            const pollRes = await api.get(`/submissions/${submission.id}`);
            const updated = pollRes.data.submission || pollRes.data;
            setSubmissionResult(updated);
            if (updated.verdict && updated.verdict !== 'PENDING' && updated.verdict !== 'COMPILING' && updated.verdict !== 'RUNNING') {
              clearInterval(interval);
              setPollInterval(null);
            }
          } catch (e) {
            clearInterval(interval);
            setPollInterval(null);
          }
        }, 2000);
        setPollInterval(interval);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to submit';
      setSubmissionResult({ verdict: 'ERROR', verdict_message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this problem?')) return;
    try {
      await api.delete(`/problems/${id}`);
      toast.success('Problem deleted successfully');
      router.push('/');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to delete problem');
    }
  };

  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case 'ACCEPTED': return { color: 'var(--status-accepted)', backgroundColor: 'var(--status-accepted-bg)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius)', fontWeight: '600', fontSize: '0.875rem' };
      case 'WRONG_ANSWER': return { color: 'var(--status-wrong)', backgroundColor: 'var(--status-wrong-bg)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius)', fontWeight: '600', fontSize: '0.875rem' };
      case 'TIME_LIMIT_EXCEEDED': return { color: 'var(--status-tle)', backgroundColor: 'var(--status-tle-bg)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius)', fontWeight: '600', fontSize: '0.875rem' };
      case 'PENDING': case 'COMPILING': case 'RUNNING': return { color: 'var(--text-secondary)', backgroundColor: 'var(--badge-bg)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius)', fontWeight: '600', fontSize: '0.875rem' };
      default: return { color: 'var(--status-wrong)', backgroundColor: 'var(--status-wrong-bg)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius)', fontWeight: '600', fontSize: '0.875rem' };
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading workspace...</div>;
  }

  if (!problem) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Problem not found.</div>;
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
      {/* Left Pane - Description */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', borderRight: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-main)', margin: 0 }}>{problem.title}</h1>
          
          {(user?.role === 'ADMIN' || (user?.role === 'PROBLEM_SETTER' && user?.id === problem?.created_by)) && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link href={`/problems/edit/${problem.id}`}>
                <Button variant="secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Edit</Button>
              </Link>
              <Button variant="danger" onClick={handleDelete} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}>Delete</Button>
            </div>
          )}
        </div>
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <DifficultyBadge difficulty={problem.difficulty} />
            <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Time Limit: {problem.timelimit} ms</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Memory Limit: {Math.round(problem.memorylimit / 1024)} MB</span>
          </div>
          {problem.tags && problem.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {problem.tags.map(tag => (
                <ClickableProblemTag key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>
        
        <MarkdownRenderer content={problem.description || ''} />
      </div>

      {/* Right Pane - Editor & Console */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Editor Toolbar */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <select 
            value={lang} 
            onChange={(e) => handleLangChange(e.target.value)}
            style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.875rem', fontFamily: 'var(--font-ui)' }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <Button 
            variant="primary" 
            style={{ padding: '0.4rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }} 
            onClick={handleSubmit} 
            disabled={submitting}
            title={`Submit Code (${shortcut})`}
          >
            {submitting ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
            <span>{submitting ? 'Running...' : 'Submit'}</span>
          </Button>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}} />

        {/* Code Editor */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CodeEditor 
            language={LANGUAGES.find(l => l.id === lang)?.monacoId || 'python'} 
            value={code} 
            onChange={(val) => setCode(val)} 
            onSubmit={handleSubmit}
          />
        </div>

        {/* Console / Result Panel */}
        {submissionResult && (
          <div style={{ height: '200px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--surface)', padding: '1rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.875rem', marginBottom: '0', color: 'var(--text-secondary)' }}>Verdict</h3>
              <span style={getVerdictStyle(submissionResult.verdict)}>
                {submissionResult.verdict?.replace(/_/g, ' ')}
              </span>
            </div>
            {submissionResult.execution_time_ms !== null && submissionResult.execution_time_ms !== undefined && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Runtime: {submissionResult.execution_time_ms} ms | Memory: {submissionResult.memory_used_kb || '—'} KB
              </div>
            )}
            {submissionResult.verdict_message && (
              <pre style={{ fontSize: '0.8rem', fontFamily: 'var(--font-code)', whiteSpace: 'pre-wrap', color: 'var(--text-main)', marginTop: '0.5rem', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
                {submissionResult.verdict_message}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
