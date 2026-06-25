"use client";

import { useState, useEffect, use } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import MarkdownEditor from '../../../components/MarkdownEditor';
import ProblemGuidelines from '../../../components/ProblemGuidelines';
import TagSelector from '../../../components/TagSelector';
import { useProblemTags } from '../../../contexts/ProblemTagsContext';
import { toast } from 'react-hot-toast';

export default function EditProblem({ params }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const { tags: allowedTags, loading: tagsLoading } = useProblemTags();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('EASY');
  const [timelimit, setTimelimit] = useState(1000);
  const [memorylimit, setMemorylimit] = useState(262144);
  const [tags, setTags] = useState([]);
  const [editorial, setEditorial] = useState('');
  const [isEditorialVisible, setIsEditorialVisible] = useState(true);
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editorEmail, setEditorEmail] = useState('');
  const [addingEditor, setAddingEditor] = useState(false);

  useEffect(() => {
    if (tagsLoading) return;
    const fetchProblem = async () => {
      try {
        const response = await api.get(`/problems/${id}`);
        const p = response.data.problem;
        setTitle(p.title);
        setDescription(p.description);
        setDifficulty(p.difficulty);
        setTimelimit(p.timelimit);
        setMemorylimit(p.memorylimit);
        setTags(p.tags ? p.tags.filter((t) => allowedTags.includes(t)) : []);
        setEditorial(p.editorial || '');
        setIsEditorialVisible(p.is_editorial_visible !== false);
      } catch (err) {
        setError('Failed to fetch problem data');
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id, tagsLoading, allowedTags]);

  if (authLoading || loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  // Basic client-side permission check (server will also check)
  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROBLEM_SETTER')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        You do not have permission to edit problems.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.put(`/problems/${id}`, {
        title,
        description,
        difficulty,
        timelimit: Number(timelimit),
        memorylimit: Number(memorylimit),
        tags,
        editorial,
        is_editorial_visible: isEditorialVisible,
      });

      router.push(`/problems/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update problem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEditor = async (e) => {
    e.preventDefault();
    if (!editorEmail) return;
    setAddingEditor(true);
    const toastId = toast.loading('Adding editor...');
    try {
      await api.post(`/problems/${id}/editors`, { email: editorEmail });
      toast.success(`Granted edit access to ${editorEmail}`, { id: toastId });
      setEditorEmail('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add editor', { id: toastId });
    } finally {
      setAddingEditor(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Edit Problem</h1>

      <ProblemGuidelines />

      {error && (
        <div style={{ color: 'var(--status-wrong)', marginBottom: '1rem', fontSize: '0.875rem', padding: '0.75rem', border: '1px solid var(--status-wrong)', borderRadius: 'var(--radius)', backgroundColor: '#fef2f2' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input label="Title" id="title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <label htmlFor="description" style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>
            Description (Markdown + LaTeX supported)
          </label>
          <MarkdownEditor 
            value={description}
            onChange={setDescription}
            placeholder="Write your problem statement here using Markdown. Use $...$ for inline LaTeX and $$...$$ for block LaTeX. Use the Upload Image button to include images."
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="editorial" style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>
              Editorial (Optional Markdown)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isEditorialVisible} 
                onChange={(e) => setIsEditorialVisible(e.target.checked)} 
                style={{ cursor: 'pointer' }}
              />
              Visible (Uncheck during contests)
            </label>
          </div>
          <MarkdownEditor 
            value={editorial}
            onChange={setEditorial}
            placeholder="Write the editorial or solution explanation here."
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

        <TagSelector selectedTags={tags} onChange={setTags} />

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem', marginBottom: '2rem' }}>
          <Button type="submit" variant="primary" style={{ flex: 1 }} disabled={submitting}>
            {submitting ? 'Updating...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push(`/problems/${id}`)} style={{ flex: 1 }}>
            Cancel
          </Button>
        </div>
      </form>

      <div style={{ backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Manage Access</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Grant other Problem Setters or Admins the ability to edit this problem.</p>
        
        <form onSubmit={handleAddEditor} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input 
              label="User Email" 
              id="editorEmail" 
              type="email" 
              placeholder="colleague@example.com" 
              value={editorEmail} 
              onChange={(e) => setEditorEmail(e.target.value)} 
              disabled={addingEditor}
            />
          </div>
          <Button type="submit" variant="secondary" disabled={addingEditor || !editorEmail} style={{ height: '42px', marginBottom: '1rem' }}>
            {addingEditor ? 'Adding...' : 'Grant Access'}
          </Button>
        </form>
      </div>
    </div>
  );
}
