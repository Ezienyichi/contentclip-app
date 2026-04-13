'use client';
import React from 'react';
export default function Icon({ name, filled, size = 24, style, className }: { name: string; filled?: boolean; size?: number; style?: React.CSSProperties; className?: string }) {
  return <span className={`material-symbols-outlined ${className || ''}`} style={{ fontSize: size, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`, userSelect: 'none', ...style }}>{name}</span>;
}
