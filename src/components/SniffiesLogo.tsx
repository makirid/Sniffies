import React from 'react';

interface SniffiesLogoProps {
  className?: string;
}

// Standalone Sniffies wordmark — a radar pin over the brand name.
export const SniffiesLogo: React.FC<SniffiesLogoProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 300 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sniffiesGradient" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f9a8d4" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    </defs>

    {/* Radar pin mark */}
    <g transform="translate(6 8)">
      <circle cx="32" cy="32" r="30" stroke="url(#sniffiesGradient)" strokeWidth="4" fill="none" opacity="0.35" />
      <circle cx="32" cy="32" r="19" stroke="url(#sniffiesGradient)" strokeWidth="4" fill="none" opacity="0.6" />
      <circle cx="32" cy="32" r="6" fill="url(#sniffiesGradient)" />
      <path d="M32 32 L58 14" stroke="url(#sniffiesGradient)" strokeWidth="4" strokeLinecap="round" />
    </g>

    {/* Wordmark */}
    <text
      x="82"
      y="52"
      fontFamily="'Inter', sans-serif"
      fontWeight="800"
      fontSize="40"
      fill="url(#sniffiesGradient)"
      style={{ letterSpacing: '-1.5px' }}
    >
      Sniffies
    </text>
  </svg>
);
