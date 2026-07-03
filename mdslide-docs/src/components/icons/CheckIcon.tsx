import React from 'react';

// green checkmark indicating action completion.
export const CheckIcon = ({ className }: { className?: string }): React.ReactElement => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
