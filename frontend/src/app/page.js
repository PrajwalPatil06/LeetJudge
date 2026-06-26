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
    const pageParam = parseInt(searchParams.get('page')) || 1;
    let next = [];
    if (tagsParam) {
      next = tagsParam.split(',').map(decodeURIComponent).filter(Boolean);
    } else if (tagParam) {
      next = [decodeURIComponent(tagParam)];
    }
    setSelectedFilters(next);
    setPage(pageParam);
    sessionStorage.setItem('leetjudge_tag_filters', JSON.stringify(next));
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

  const syncFiltersToUrl = (tags, newPage = page) => {
    sessionStorage.setItem('leetjudge_tag_filters', JSON.stringify(tags));
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
                syncFiltersToUrl(selectedFilters, nextP);
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
                syncFiltersToUrl(selectedFilters, nextP);
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
