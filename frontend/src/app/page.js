"use client";

import { Suspense, useEffect, useState } from 'react';
import api from './lib/api';
import Table from './components/Table';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import Link from 'next/link';
import DifficultyBadge from './components/DifficultyBadge';
import ProblemTagFilter from './components/ProblemTagFilter';
import ClickableProblemTag from './components/ClickableProblemTag';

function HomeContent() {
  const [problems, setProblems] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    const tagParam = searchParams.get('tag');
    const tagsParam = searchParams.get('tags');
    const diffParam = searchParams.get('difficulty');
    const pageParam = parseInt(searchParams.get('page')) || 1;
    let next = [];
    if (tagsParam) {
      next = tagsParam.split(',').map(decodeURIComponent).filter(Boolean);
    } else if (tagParam) {
      next = [decodeURIComponent(tagParam)];
    }
    setSelectedFilters(next);
    setSelectedDifficulty(diffParam || '');
    setPage(pageParam);
    sessionStorage.setItem('leetjudge_tag_filters', JSON.stringify(next));
    sessionStorage.setItem('leetjudge_difficulty_filter', diffParam || '');
  }, [searchParams]);

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const offset = (page - 1) * limit;
        const res = await api.get(`/problems?limit=${limit}&offset=${offset}`);
        const data = res.data.problems || res.data;
        setProblems(Array.isArray(data) ? data : []);
        setHasMore(res.data.hasMore || false);
        if (res.data.total) {
          setTotalPages(Math.max(1, Math.ceil(res.data.total / limit)));
        }
      } catch (err) {
        console.error("Failed to load problems", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, [page]);

  const syncFiltersToUrl = (tags, difficulty, newPage = page) => {
    sessionStorage.setItem('leetjudge_tag_filters', JSON.stringify(tags));
    sessionStorage.setItem('leetjudge_difficulty_filter', difficulty);
    const params = new URLSearchParams(searchParams);
    if (tags.length === 0) {
      params.delete('tag');
      params.delete('tags');
    } else if (tags.length === 1) {
      params.delete('tags');
      params.set('tag', tags[0]);
    } else {
      params.delete('tag');
      params.set('tags', tags.join(','));
    }
    if (difficulty) {
      params.set('difficulty', difficulty);
    } else {
      params.delete('difficulty');
    }
    if (newPage > 1) {
      params.set('page', newPage.toString());
    } else {
      params.delete('page');
    }
    router.replace(`/?${params.toString()}`);
  };

  const toggleTagFilter = (tag) => {
    const next = selectedFilters.includes(tag)
      ? selectedFilters.filter((t) => t !== tag)
      : [...selectedFilters, tag];
    setSelectedFilters(next);
    syncFiltersToUrl(next, selectedDifficulty);
  };

  const handleFilterChange = (tags) => {
    setSelectedFilters(tags);
    syncFiltersToUrl(tags, selectedDifficulty);
  };

  const handleDifficultyChange = (e) => {
    const diff = e.target.value;
    setSelectedDifficulty(diff);
    syncFiltersToUrl(selectedFilters, diff);
  };

  const columns = [
    { header: '#', accessor: 'id', render: (row) => (
      <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        {row.id.substring(0, 8)}
      </span>
    )},
    { header: 'Title', accessor: 'title', render: (row) => (
      <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {row.title}
        {row.is_hidden && (
          <span style={{ 
            fontSize: '0.7rem', 
            padding: '0.15rem 0.4rem', 
            backgroundColor: 'var(--status-wrong)', 
            color: 'white', 
            borderRadius: '4px',
            fontWeight: '600'
          }}>
            Hidden
          </span>
        )}
      </span>
    )},
    { header: 'Difficulty', accessor: 'difficulty', render: (row) => (
        <DifficultyBadge difficulty={row.difficulty} />
      ) 
    },
    { header: 'Tags', accessor: 'tags', render: (row) => (
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
        {row.tags && row.tags.length > 0 ? row.tags.map(tag => (
          <ClickableProblemTag
            key={tag}
            tag={tag}
            isActive={selectedFilters.includes(tag)}
            onFilter={toggleTagFilter}
          />
        )) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>None</span>}
      </div>
    )},
    { header: 'Time Limit', accessor: 'timelimit', render: (row) => `${row.timelimit} ms` },
    { header: 'Memory Limit', accessor: 'memorylimit', render: (row) => `${Math.round(row.memorylimit / 1024)} MB` },
  ];

  const filteredProblems = problems.filter((problem) => {
    const tagMatch = selectedFilters.length === 0 || problem.tags?.some((tag) => selectedFilters.includes(tag));
    const difficultyMatch = !selectedDifficulty || problem.difficulty === selectedDifficulty;
    return tagMatch && difficultyMatch;
  });

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading problems...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0' }}>Problem Set</h1>
          <ProblemTagFilter selectedTags={selectedFilters} onChange={handleFilterChange} />
          <select 
            value={selectedDifficulty} 
            onChange={handleDifficultyChange}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius)',
              border: `1px solid ${selectedDifficulty ? 'var(--primary)' : 'var(--border-color)'}`,
              backgroundColor: selectedDifficulty ? 'rgba(0, 122, 255, 0.05)' : 'var(--surface)',
              color: selectedDifficulty ? 'var(--primary)' : 'var(--text-main)',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
            }}
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
        {user && (user.role === 'ADMIN' || user.role === 'PROBLEM_SETTER') && (
          <Link href="/problems/create" style={{
            backgroundColor: 'var(--primary)',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius)',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}>
            + New Problem
          </Link>
        )}
      </div>
      {problems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)' }}>
          No problems available yet.
        </div>
      ) : filteredProblems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)' }}>
          No problems match the selected filters.
          <button
            type="button"
            onClick={() => {
              handleFilterChange([]);
              handleDifficultyChange({ target: { value: '' } });
            }}
            style={{
              display: 'block',
              margin: '0.75rem auto 0',
              color: 'var(--primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <Table 
            columns={columns} 
            data={filteredProblems} 
            onRowClick={(row) => router.push(`/problems/${row.id}`)} 
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={() => {
                const nextP = Math.max(1, page - 1);
                setPage(nextP);
                syncFiltersToUrl(selectedFilters, selectedDifficulty, nextP);
              }}
              disabled={page === 1}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border-color)',
                backgroundColor: page === 1 ? 'var(--bg-color)' : 'var(--surface)',
                color: page === 1 ? 'var(--text-secondary)' : 'var(--text-main)',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <span style={{ color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
            <button
              onClick={() => {
                const nextP = page + 1;
                setPage(nextP);
                syncFiltersToUrl(selectedFilters, selectedDifficulty, nextP);
              }}
              disabled={!hasMore}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border-color)',
                backgroundColor: !hasMore ? 'var(--bg-color)' : 'var(--surface)',
                color: !hasMore ? 'var(--text-secondary)' : 'var(--text-main)',
                cursor: !hasMore ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading problems...</div>}>
      <HomeContent />
    </Suspense>
  );
}
