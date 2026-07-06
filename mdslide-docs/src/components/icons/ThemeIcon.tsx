import React from 'react';

// theme layout color palette icon.  
export const ThemeIcon = ({ className = 'w-6 h-6 stroke-app-accent stroke-[1.5] fill-none' }: { className?: string }): React.ReactElement => (
  <svg className={className} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.03444 18.5555 5.3339 18.1561 5.72704 17.8576C6.54134 17.2393 7.5502 16.8889 8.625 16.8889H15.375C16.4498 16.8889 17.4587 17.2393 18.273 17.8576C18.6661 18.1561 18.9656 18.5555 19.1414 19C20.9097 17.1962 22 14.7255 22 12C22 7.58172 18.4183 4 14 4C9.58172 4 6 7.58172 6 12C6 13.13 6.22 14.21 6.62 15.2C6.26 15.65 6 16.21 6 16.83V18.5C6 19.88 7.12 21 8.5 21H12V22Z" />
  </svg>
);
