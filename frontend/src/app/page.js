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
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    const tagParam = searchParams.get('tag');
    const tagsParam = searchParams.get('tags');
    let next = [];
    if (tagsParam) {
      next = tagsParam.split(',').map(decodeURIComponent).filter(Boolean);
    } else if (tagParam) {
      next = [decodeURIComponent(tagParam)];
    }
    setSelectedFilters(next);
    sessionStorage.setItem('leetjudge_tag_filters', JSON.stringify(next));
  }, [searchParams]);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await api.get('/problems');
        const data = res.data.problems || res.data;
        setProblems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load problems", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  const syncFiltersToUrl = (tags) => {
    sessionStorage.setItem('leetjudge_tag_filters', JSON.stringify(tags));
    if (tags.length === 0) {
      router.replace('/');
    } else if (tags.length === 1) {
      router.replace(`/?tag=${encodeURIComponent(tags[0])}`);
    } else {
      router.replace(`/?tags=${tags.map(encodeURIComponent).join(',')}`);
    }
  };

  const toggleTagFilter = (tag) => {
    const next = selectedFilters.includes(tag)
      ? selectedFilters.filter((t) => t !== tag)
      : [...selectedFilters, tag];
    setSelectedFilters(next);
    syncFiltersToUrl(next);
  };

  const handleFilterChange = (tags) => {
    setSelectedFilters(tags);
    syncFiltersToUrl(tags);
  };

  const columns = [
    { header: '#', accessor: 'id', render: (row) => (
      <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        {row.id.substring(0, 8)}
      </span>
    )},
    { header: 'Title', accessor: 'title', render: (row) => (
      <span style={{ fontWeight: '500' }}>{row.title}</span>
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

  const filteredProblems = selectedFilters.length === 0
    ? problems
    : problems.filter((problem) =>
        problem.tags?.some((tag) => selectedFilters.includes(tag))
      );

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading problems...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0' }}>Problem Set</h1>
          <ProblemTagFilter selectedTags={selectedFilters} onChange={handleFilterChange} />
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
            onClick={() => handleFilterChange([])}
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
        <Table 
          columns={columns} 
          data={filteredProblems} 
          onRowClick={(row) => router.push(`/problems/${row.id}`)} 
        />
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
