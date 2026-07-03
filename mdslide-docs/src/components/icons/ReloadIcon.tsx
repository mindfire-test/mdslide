import React from 'react';

// circular reload/watch loop \ icon.  
export const ReloadIcon = ({ className = 'w-6 h-6 stroke-app-accent stroke-[1.5] fill-none' }: { className?: string }): React.ReactElement => (
  <svg className={className} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
