'use client';
import React from 'react';

export default function TourInfoIcon({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Re-open tour"
      aria-label="Re-open page tour"
      style={{
        width:        32,
        height:       32,
        borderRadius: '50%',
        border:       '1.5px solid rgba(155,93,229,0.35)',
        background:   'rgba(155,93,229,0.08)',
        color:        '#9B5DE5',
        fontSize:     14,
        fontWeight:   800,
        cursor:       'pointer',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        lineHeight:   1,
        fontFamily:   'inherit',
        flexShrink:   0,
        transition:   'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        const b = e.currentTarget as HTMLButtonElement;
        b.style.background   = 'rgba(155,93,229,0.18)';
        b.style.borderColor  = 'rgba(155,93,229,0.6)';
      }}
      onMouseLeave={e => {
        const b = e.currentTarget as HTMLButtonElement;
        b.style.background   = 'rgba(155,93,229,0.08)';
        b.style.borderColor  = 'rgba(155,93,229,0.35)';
      }}
    >
      ?
    </button>
  );
}
