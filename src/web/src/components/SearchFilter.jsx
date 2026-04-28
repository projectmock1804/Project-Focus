import React, { useState } from 'react';

const F = {
  title: 'Fraunces, serif',
  ui: 'Inter, system-ui, sans-serif',
  mono: 'JetBrains Mono, monospace',
};

const C = {
  ink: '#0E0E0C',
  bone: '#F2F0EB',
  bone40: 'rgba(242,240,235,0.40)',
  bone20: 'rgba(242,240,235,0.20)',
  border: '#2A2A28',
  ember: '#E86B3A',
  ember10: 'rgba(232,107,58,0.10)',
  graphite: '#1C1C19',
};

/**
 * Search and filter bar for tasks
 */
export function SearchFilter({ value, onChange, onClear }) {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      padding: '8px 16px',
      background: C.graphite,
      borderBottom: `1px solid ${C.border}`,
      marginBottom: 8,
    }}>
      <span style={{
        fontFamily: F.ui,
        fontSize: 11,
        color: C.bone40,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        🔍
      </span>
      <input
        type="text"
        placeholder="제목 또는 설명 검색..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontFamily: F.ui,
          fontSize: 13,
          color: C.bone,
          '::placeholder': {
            color: C.bone40,
          },
        }}
      />
      {value && (
        <button
          onClick={onClear}
          style={{
            fontFamily: F.ui,
            fontSize: 11,
            color: C.bone40,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = C.bone}
          onMouseLeave={(e) => e.currentTarget.style.color = C.bone40}
        >
          × Clear
        </button>
      )}
    </div>
  );
}

/**
 * Status filter chips
 */
export function StatusFilter({ selectedStatus, onChange }) {
  const statuses = [
    { value: 'all', label: 'All', icon: '◎' },
    { value: 'pending', label: 'Pending', icon: '○' },
    { value: 'in_progress', label: 'In Progress', icon: '◉' },
    { value: 'completed', label: 'Completed', icon: '✓' },
    { value: 'deleted', label: 'Deleted', icon: '✗' },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: '8px 16px',
      background: C.graphite,
      borderBottom: `1px solid ${C.border}`,
      overflowX: 'auto',
    }}>
      {statuses.map(status => (
        <button
          key={status.value}
          onClick={() => onChange(status.value)}
          style={{
            padding: '4px 10px',
            fontFamily: F.ui,
            fontSize: 11,
            fontWeight: 500,
            background: selectedStatus === status.value ? C.ember : 'transparent',
            color: selectedStatus === status.value ? C.bone : C.bone40,
            border: `1px solid ${selectedStatus === status.value ? C.ember : C.border}`,
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
          onMouseEnter={(e) => {
            if (selectedStatus !== status.value) {
              e.currentTarget.style.borderColor = C.ember;
              e.currentTarget.style.color = C.bone;
            }
          }}
          onMouseLeave={(e) => {
            if (selectedStatus !== status.value) {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.bone40;
            }
          }}
        >
          {status.icon} {status.label}
        </button>
      ))}
    </div>
  );
}
