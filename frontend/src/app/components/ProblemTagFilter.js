"use client";

import { useState, useEffect, useRef } from 'react';
import { useProblemTags } from '../contexts/ProblemTagsContext';

export default function ProblemTagFilter({ selectedTags, onChange }) {
  const { tags, loading } = useProblemTags();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    onChange([]);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.5rem 0.875rem',
          borderRadius: 'var(--radius)',
          border: `1px solid ${selectedTags.length > 0 ? 'var(--primary)' : 'var(--border-color)'}`,
          backgroundColor: selectedTags.length > 0 ? 'rgba(0, 122, 255, 0.05)' : 'var(--surface)',
          color: selectedTags.length > 0 ? 'var(--primary)' : 'var(--text-main)',
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        Filters
        {selectedTags.length > 0 && (
          <span style={{
            backgroundColor: 'rgba(255,255,255,0.25)',
            borderRadius: '999px',
            padding: '0 0.375rem',
            fontSize: '0.75rem',
            minWidth: '1.25rem',
            textAlign: 'center',
          }}>
            {selectedTags.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 0.5rem)',
          left: 0,
          zIndex: 50,
          minWidth: '240px',
          padding: '1rem',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>Filter by topic</span>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Clear all
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.5rem 0.625rem',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    backgroundColor: isSelected ? 'var(--bg-color)' : 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    width: '1rem',
                    height: '1rem',
                    borderRadius: '3px',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                    backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
