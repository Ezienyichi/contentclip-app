'use client';
import React from 'react';

interface ErrorBannerProps {
  message: string;
  onClose?: () => void;
  style?: React.CSSProperties;
}

export default function ErrorBanner({ message, onClose, style }: ErrorBannerProps) {
  return (
    <div style={{
      background: '#111111',
      borderLeft: '4px solid #FF4D4D',
      borderRadius: '8px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      ...style,
    }}>
      <span style={{ flexShrink: 0, color: '#FF4D4D', marginTop: 1 }}>⚠</span>
      <span style={{ flex: 1, color: '#FF4D4D', fontWeight: 600, fontSize: '13px', lineHeight: 1.5 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#FF4D4D', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}
          aria-label="Dismiss"
        >×</button>
      )}
    </div>
  );
}
