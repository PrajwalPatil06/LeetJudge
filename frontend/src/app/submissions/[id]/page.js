"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../lib/api';
import CodeEditor from '../../components/CodeEditor';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import AiAnalysisSection from '../../components/AiAnalysisSection';

const LANG_MAP = {
  54: { name: 'C++', monacoId: 'cpp' },
  62: { name: 'Java', monacoId: 'java' },
  71: { name: 'Python 3', monacoId: 'python' },
  93: { name: 'Node.js', monacoId: 'javascript' },
};

export default function SubmissionDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchSubmission = async () => {
      try {
        const res = await api.get(`/submissions/${id}`);
        setSubmission(res.data.submission || res.data);
      } catch (err) {
        console.error("Failed to load submission", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [id, user, authLoading, router]);

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case 'ACCEPTED': return 'var(--status-accepted)';
      case 'WRONG_ANSWER': return 'var(--status-wrong)';
      case 'TIME_LIMIT_EXCEEDED': case 'MEMORY_LIMIT_EXCEEDED': return 'var(--status-tle)';
      case 'PENDING': case 'COMPILING': case 'RUNNING': return 'var(--text-secondary)';
      default: return 'var(--status-wrong)';
    }
  };

  if (authLoading || loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading submission...</div>;
  }

  if (!submission) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Submission not found or unauthorized.</div>;
  }

  const langInfo = LANG_MAP[submission.lang] || { name: 'Unknown', monacoId: 'text' };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/submissions" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          ← Back to Submissions
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Submission Details</h1>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span>Problem: <Link href={`/problems/${submission.problem_id}`} style={{ color: 'var(--primary)', fontWeight: '500' }}>{submission.problem_title || submission.problem_id.substring(0, 8)}</Link></span>
              <span>Language: <strong style={{ color: 'var(--text-main)' }}>{langInfo.name}</strong></span>
              <span>Submitted: {new Date(submission.timestamp || submission.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', padding: '1rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: getVerdictColor(submission.verdict), marginBottom: '0.25rem' }}>
              {submission.verdict?.replace(/_/g, ' ')}
            </div>
            {submission.execution_time_ms != null && (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Runtime: {submission.execution_time_ms} ms
                {submission.memory_used_kb != null ? ` | Memory: ${Math.round(submission.memory_used_kb / 1024)} MB` : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <AiAnalysisSection submissionId={id} />
      </div>

      {submission.verdict_message && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Message</h3>
          <pre style={{ 
            padding: '1rem', 
            backgroundColor: 'var(--surface)', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius)', 
            fontSize: '0.875rem', 
            fontFamily: 'var(--font-code)', 
            overflowX: 'auto', 
            color: submission.verdict === 'ACCEPTED' ? 'var(--status-accepted)' : 'var(--status-wrong)' 
          }}>
            {submission.verdict_message}
          </pre>
        </div>
      )}

      {submission.error_test_case != null && submission.expected_output != null && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}>
            <h4 style={{ padding: '0.75rem 1rem', margin: 0, borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', fontSize: '0.875rem' }}>Expected Output</h4>
            <pre style={{ padding: '1rem', margin: 0, fontSize: '0.875rem', fontFamily: 'var(--font-code)', overflowX: 'auto', color: 'var(--status-accepted)' }}>
              {submission.expected_output}
            </pre>
          </div>
          <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}>
            <h4 style={{ padding: '0.75rem 1rem', margin: 0, borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', fontSize: '0.875rem' }}>Actual Output</h4>
            <pre style={{ padding: '1rem', margin: 0, fontSize: '0.875rem', fontFamily: 'var(--font-code)', overflowX: 'auto', color: 'var(--status-wrong)' }}>
              {submission.actual_output || '<empty output>'}
            </pre>
          </div>
        </div>
      )}

      <div>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Submitted Code</h3>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', overflow: 'hidden', height: '600px' }}>
          <CodeEditor 
            language={langInfo.monacoId} 
            value={submission.code} 
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
}
