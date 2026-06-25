"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import MarkdownEditor from '../../components/MarkdownEditor';

export default function CreateProblem() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('EASY');
  const [timelimit, setTimelimit] = useState(1000);
  const [memorylimit, setMemorylimit] = useState(262144);
  const [tags, setTags] = useState('');
  const [testCases, setTestCases] = useState([{ input: '', output: '' }]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const DRAFT_KEY = 'leetjudge_create_problem_draft';

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.difficulty) setDifficulty(parsed.difficulty);
        if (parsed.timelimit) setTimelimit(parsed.timelimit);
        if (parsed.memorylimit) setMemorylimit(parsed.memorylimit);
        if (parsed.tags) setTags(parsed.tags);
        if (parsed.testCases) setTestCases(parsed.testCases);
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, []);

  useEffect(() => {
    const draft = { title, description, difficulty, timelimit, memorylimit, tags, testCases };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [title, description, difficulty, timelimit, memorylimit, tags, testCases]);

  if (authLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROBLEM_SETTER')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        You do not have permission to create problems.
      </div>
    );
  }

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', output: '' }]);
  };

  const removeTestCase = (index) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const updateTestCase = (index, field, value) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Step 1: Create the problem
      const problemRes = await api.post('/problems', {
        title,
        description,
        difficulty,
        timelimit: Number(timelimit),
        memorylimit: Number(memorylimit),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });

      const problem = problemRes.data.problem;

      // Step 2: Add test cases if any
      const validTestCases = testCases.filter(tc => tc.input.trim() || tc.output.trim());
      if (validTestCases.length > 0) {
        await api.post(`/problems/${problem.id}/testcases`, {
          testCases: validTestCases,
        });
      }

      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(`${DRAFT_KEY}_images`);
      router.push(`/problems/${problem.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create problem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Create Problem</h1>

      <div style={{
        backgroundColor: 'var(--bg-color)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius)',
        padding: '1.5rem',
        marginBottom: '2rem',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)'
      }}>
        <h3 style={{ color: 'var(--text-main)', marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          Guidelines for Problem Setters
        </h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <li><strong>Formatting:</strong> Use Markdown for structure (headings, lists, code blocks).</li>
          <li><strong>Math/Formulas:</strong> Use <code>$...$</code> for inline LaTeX math (e.g., $O(n)$) and <code>$$...$$</code> for block LaTeX. <em>Note: standard LaTeX delimiters like <code>\\[ ... \\]</code> and <code>\\( ... \\)</code> are <strong>not</strong> supported by the markdown parser.</em></li>
          <li><strong>Images:</strong> Use the "Upload Image" button. You can manage uploaded images in the "Session Uploads" gallery below the editor. Delete any mistakes to save server space!</li>
          <li><strong>Examples:</strong> Clearly define at least 2 Example test cases within the Markdown description so users know what to expect.</li>
          <li><strong>Constraints:</strong> Always provide clear constraints (e.g., $1 \\le nums.length \\le 10^5$) at the bottom of the description.</li>
        </ul>
      </div>

      {error && (
        <div style={{ color: 'var(--status-wrong)', marginBottom: '1rem', fontSize: '0.875rem', padding: '0.75rem', border: '1px solid var(--status-wrong)', borderRadius: 'var(--radius)', backgroundColor: '#fef2f2' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input label="Title" id="title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Two Sum" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <label htmlFor="description" style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>
            Description (Markdown + LaTeX supported)
          </label>
          <MarkdownEditor 
            value={description}
            onChange={setDescription}
            placeholder="Write your problem statement here using Markdown. Use $...$ for inline LaTeX and $$...$$ for block LaTeX. Use the Upload Image button to include images."
            storageKey={DRAFT_KEY}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="difficulty" style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>Difficulty</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="timelimit" style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>Time Limit</label>
            <select
              id="timelimit"
              value={timelimit}
              onChange={(e) => setTimelimit(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
            >
              <option value="500">500 ms</option>
              <option value="1000">1000 ms (1s)</option>
              <option value="2000">2000 ms (2s)</option>
              <option value="5000">5000 ms (5s)</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="memorylimit" style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>Memory Limit</label>
            <select
              id="memorylimit"
              value={memorylimit}
              onChange={(e) => setMemorylimit(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
            >
              <option value="65536">64 MB</option>
              <option value="131072">128 MB</option>
              <option value="262144">256 MB</option>
              <option value="524288">512 MB</option>
            </select>
          </div>
        </div>

        <Input label="Tags (comma-separated)" id="tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="arrays, hash-map, two-pointers" />

        {/* Test Cases */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>Test Cases</label>
            <button type="button" onClick={addTestCase} style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '500', cursor: 'pointer', background: 'none', border: 'none' }}>
              + Add Test Case
            </button>
          </div>
          {testCases.map((tc, i) => (
            <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '0.75rem', backgroundColor: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Test Case {i + 1}</span>
                {testCases.length > 1 && (
                  <button type="button" onClick={() => removeTestCase(i)} style={{ fontSize: '0.75rem', color: 'var(--status-wrong)', cursor: 'pointer', background: 'none', border: 'none' }}>
                    Remove
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Input</label>
                  <textarea
                    value={tc.input}
                    onChange={(e) => updateTestCase(i, 'input', e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem', fontFamily: 'var(--font-code)', resize: 'vertical' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Expected Output</label>
                  <textarea
                    value={tc.output}
                    onChange={(e) => updateTestCase(i, 'output', e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem', fontFamily: 'var(--font-code)', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" variant="primary" style={{ width: '100%' }} disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Problem'}
        </Button>
      </form>
    </div>
  );
}
