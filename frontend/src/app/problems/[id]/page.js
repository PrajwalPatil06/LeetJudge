"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../lib/api';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import CodeEditor from '../../components/CodeEditor';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
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
  const { user } = useAuth();

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

  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case 'ACCEPTED': return { color: 'var(--status-accepted)', fontWeight: '600' };
      case 'WRONG_ANSWER': return { color: 'var(--status-wrong)', fontWeight: '600' };
      case 'TIME_LIMIT_EXCEEDED': return { color: 'var(--status-tle)', fontWeight: '600' };
      case 'PENDING': case 'COMPILING': case 'RUNNING': return { color: 'var(--text-secondary)', fontWeight: '500' };
      default: return { color: 'var(--status-wrong)', fontWeight: '600' };
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
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{problem.title}</h1>
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Badge 
              color={problem.difficulty === 'EASY' ? 'var(--status-accepted)' : problem.difficulty === 'MEDIUM' ? 'var(--status-tle)' : 'var(--status-wrong)'}
              border={problem.difficulty === 'EASY' ? 'var(--status-accepted)' : problem.difficulty === 'MEDIUM' ? 'var(--status-tle)' : 'var(--status-wrong)'}
            >
              {problem.difficulty}
            </Badge>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Time Limit: {problem.timelimit} ms</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Memory Limit: {Math.round(problem.memorylimit / 1024)} MB</span>
          </div>
          {problem.tags && problem.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {problem.tags.map(tag => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}
        </div>
        
        <MarkdownRenderer content={problem.description || ''} />
      </div>

      {/* Right Pane - Editor & Console */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Editor Toolbar */}
        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)' }}>
          <select 
            value={lang} 
            onChange={(e) => handleLangChange(e.target.value)}
            style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.875rem', fontFamily: 'var(--font-ui)' }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <Button variant="primary" style={{ padding: '0.25rem 1rem' }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>

        {/* Code Editor */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CodeEditor language={LANGUAGES.find(l => l.id === lang)?.monacoId || 'python'} value={code} onChange={(val) => setCode(val)} />
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
