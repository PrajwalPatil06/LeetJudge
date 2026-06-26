"use client";

import { useEffect, useState, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../lib/api';
import MarkdownRenderer from '../../../../components/MarkdownRenderer';
import CodeEditor from '../../../../components/CodeEditor';
import Button from '../../../../components/Button';
import DifficultyBadge from '../../../../components/DifficultyBadge';
import ClickableProblemTag from '../../../../components/ClickableProblemTag';
import { useAuth } from '../../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import SubmissionDetailView from '../../../../components/SubmissionDetailView';

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

export default function ContestProblemWorkspace() {
  const params = useParams();
  const contestId = params?.id;
  const problemId = params?.problemId;
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState(71); // default Python
  const [code, setCode] = useState(DEFAULT_CODE[71]);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);
  const [shortcut, setShortcut] = useState('Ctrl Enter');
  const [activeTab, setActiveTab] = useState('description'); // 'description', 'submissions'
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loadingSubmissionDetail, setLoadingSubmissionDetail] = useState(false);
  
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
    if (!problemId) return;
    const fetchProblem = async () => {
      try {
        // Fetch problem details
        const res = await api.get(`/problems/${problemId}`);
        setProblem(res.data.problem || res.data);
      } catch (err) {
        console.error("Failed to load problem", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [problemId]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  // Fetch submissions when tab changes to 'submissions'
  useEffect(() => {
    if (activeTab === 'submissions' && user && contestId) {
      const fetchMySubmissions = async () => {
        setLoadingSubmissions(true);
        try {
          const res = await api.get(`/contests/${contestId}/submissions`);
          const allSubmissions = res.data || [];
          // Filter to only this problem
          setMySubmissions(allSubmissions.filter(sub => sub.problem_id === problemId));
        } catch (e) {
          console.error("Failed to load submissions", e);
        } finally {
          setLoadingSubmissions(false);
        }
      };
      fetchMySubmissions();
    }
  }, [activeTab, contestId, problemId, user]);

  // Fetch submission detail when selected in left pane
  useEffect(() => {
    if (selectedSubmissionId) {
      const fetchSubmissionDetail = async () => {
        setLoadingSubmissionDetail(true);
        try {
          const res = await api.get(`/submissions/${selectedSubmissionId}`);
          setSelectedSubmission(res.data.submission || res.data);
        } catch (e) {
          console.error("Failed to load submission detail", e);
        } finally {
          setLoadingSubmissionDetail(false);
        }
      };
      fetchSubmissionDetail();
    } else {
      setSelectedSubmission(null);
    }
  }, [selectedSubmissionId]);

  const handleLangChange = (newLang) => {
    const languageId = Number(newLang);
    setLang(languageId);
    setCode(DEFAULT_CODE[languageId]);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to submit");
      return;
    }
    setSubmitting(true);
    setSubmissionResult(null);
    try {
      const res = await api.post(`/contests/${contestId}/problems/${problemId}/submit`, {
        lang: lang,
        code: code,
      });
      const submission = res.data.submission || res.data;
      setSubmissionResult(submission);

      // Poll for verdict updates
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
      {/* Left Pane - Tabs & Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
        
        {/* Contest Header Link */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--badge-bg)' }}>
          <Link href={`/contests/${contestId}`} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ← Back to Contest Dashboard
          </Link>
        </div>

        {/* Tabs Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface)' }}>
          <button 
            onClick={() => setActiveTab('description')} 
            style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'description' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'description' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Description
          </button>
          <button 
            onClick={() => { setActiveTab('submissions'); setSelectedSubmissionId(null); }} 
            style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'submissions' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'submissions' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            My Submissions
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          
          {/* DESCRIPTION TAB */}
          {activeTab === 'description' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-main)', margin: 0 }}>{problem.title}</h1>
              </div>
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <DifficultyBadge difficulty={problem.difficulty} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Time Limit: {problem.timelimit} ms</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Memory Limit: {Math.round(problem.memorylimit / 1024)} MB</span>
                </div>
              </div>
              
              <MarkdownRenderer content={problem.description || ''} />
            </>
          )}

          {/* SUBMISSIONS TAB */}
          {activeTab === 'submissions' && (
            <>
              {!user ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                  Please log in to view your submissions.
                </div>
              ) : selectedSubmissionId ? (
                <div>
                  <button 
                    onClick={() => setSelectedSubmissionId(null)} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    ← Back to submissions
                  </button>
                  
                  {loadingSubmissionDetail ? (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Loading submission...</div>
                  ) : selectedSubmission ? (
                    <SubmissionDetailView submission={selectedSubmission} isFullScreen={false} />
                  ) : (
                    <div style={{ color: 'var(--status-wrong)' }}>Failed to load submission.</div>
                  )}
                </div>
              ) : (
                <div>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Contest Submissions</h2>
                  {loadingSubmissions ? (
                    <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
                  ) : mySubmissions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                      You have no submissions for this problem in this contest.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {mySubmissions.map(sub => (
                        <div 
                          key={sub.id} 
                          onClick={() => setSelectedSubmissionId(sub.id)}
                          style={{ padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.2s' }}
                        >
                          <div>
                            <span style={{ fontWeight: '600', fontSize: '0.875rem', color: getVerdictStyle(sub.verdict).color }}>{sub.verdict?.replace(/_/g, ' ')}</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              {LANGUAGES.find(l => l.id === sub.lang)?.name || 'Unknown'} • {new Date(sub.timestamp || sub.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          {sub.execution_time_ms != null && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                              {sub.execution_time_ms} ms
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
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
