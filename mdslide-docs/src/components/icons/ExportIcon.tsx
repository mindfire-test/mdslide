import React from 'react';

// Renders an arrow-down box/export feature icon.  
export const ExportIcon = ({ className = 'w-6 h-6 stroke-app-accent stroke-[1.5] fill-none' }: { className?: string }): React.ReactElement => (
  <svg className={className} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
