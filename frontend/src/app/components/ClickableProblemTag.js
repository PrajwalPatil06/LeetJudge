"use client";

import { useRouter } from 'next/navigation';

export default function ClickableProblemTag({ tag, onFilter, isActive = false }) {
  const router = useRouter();

  const handleClick = (e) => {
    e.stopPropagation();
    if (onFilter) {
      onFilter(tag);
      return;
    }
    const stored = JSON.parse(sessionStorage.getItem('leetjudge_tag_filters') || '[]');
    const next = stored.includes(tag) ? stored : [...stored, tag];
    sessionStorage.setItem('leetjudge_tag_filters', JSON.stringify(next));
    if (next.length === 1) {
      router.push(`/?tag=${encodeURIComponent(next[0])}`);
    } else {
      router.push(`/?tags=${next.map(encodeURIComponent).join(',')}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.6rem',
        borderRadius: 'var(--radius)',
        fontSize: '0.75rem',
        fontWeight: '600',
        letterSpacing: '0.02em',
        color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
        backgroundColor: isActive ? 'rgba(0, 122, 255, 0.05)' : 'var(--badge-bg)',
        border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border-color)'}`,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.color = 'var(--primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      {tag}
    </button>
  );
}
