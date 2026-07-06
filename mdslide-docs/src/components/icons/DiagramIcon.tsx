import React from 'react';

// split rectangle layout diagram icon.  
export const DiagramIcon = ({ className = 'w-6 h-6 stroke-app-accent stroke-[1.5] fill-none' }: { className?: string }): React.ReactElement => (
  <svg className={className} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <path d="M10 8h4M10 15h4" />
  </svg>
);
