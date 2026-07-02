import React, { useEffect, useState } from 'react';
import { type ContributorDetail } from '../../types/github';
import { ContributorCardProps } from '@site/src/types/component';

export default function ContributorCard({ contributor }: ContributorCardProps): React.ReactElement {
  const [detail, setDetail] = useState<ContributorDetail | null>(null);

  useEffect(() => {
    fetch(`https://api.github.com/users/${contributor.login}`)
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(() => { });
  }, [contributor.login]);

  return (
    <a
      href={contributor.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-0 bg-app-surface border border-app-border rounded-lg p-[22px] no-underline! text-inherit transition-all duration-200 cursor-pointer hover:border-app-accent hover:-translate-y-[3px] hover:shadow-lg dark:hover:shadow-black/40"
    >
      <div className="flex items-center gap-3.5 mb-3">
        <img
          src={contributor.avatar_url}
          alt={contributor.login}
          className="w-12 h-12 rounded-full border-2 border-app-border shrink-0 object-cover transition-colors duration-200 group-hover:border-app-accent"
          loading="lazy"
        />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-sans text-[14.5px] font-semibold text-app-text-primary truncate">
            {detail?.name || contributor.login}
          </span>
          <span className="font-mono text-xs text-app-text-secondary truncate">@{contributor.login}</span>
        </div>
      </div>

      {detail?.bio && (
        <p className="font-sans text-xs leading-relaxed text-app-text-secondary mb-3 line-clamp-2 grow">{detail.bio}</p>
      )}

      <div className="flex flex-wrap gap-2.5 mb-3.5">
        {detail?.location && (
          <span className="flex items-center gap-1.25 font-sans text-xs text-app-text-secondary truncate max-w-full [&>svg]:shrink-0 [&>svg]:opacity-60">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M11.536 3.464a5 5 0 010 7.072L8 14.07l-3.536-3.534a5 5 0 117.072-7.072v.001zm1.06 8.132a6.5 6.5 0 10-9.192 0l3.535 3.536a1.5 1.5 0 002.122 0l3.535-3.536zM8 9a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            {detail.location}
          </span>
        )}
        {detail?.company && (
          <span className="flex items-center gap-1.25 font-sans text-xs text-app-text-secondary truncate max-w-full [&>svg]:shrink-0 [&>svg]:opacity-60">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M1.5 14.25c0 .138.112.25.25.25H4v-1.25a.75.75 0 01.75-.75h2.5a.75.75 0 01.75.75v1.25h2.25a.25.25 0 00.25-.25V1.75a.25.25 0 00-.25-.25h-8.5a.25.25 0 00-.25.25v12.5zM1.75 16A1.75 1.75 0 010 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 00.25-.25V8.285a.25.25 0 00-.111-.208l-1.055-.703a.75.75 0 11.832-1.248l1.055.703c.487.325.779.871.779 1.456v5.965A1.75 1.75 0 0114.25 16h-3.5a.75.75 0 01-.75-.75V14h-1v1.25a.75.75 0 01-.75.75H1.75zM3 3.75A.75.75 0 013.75 3h.5a.75.75 0 010 1.5h-.5A.75.75 0 013 3.75zM3.75 6a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zM3 9.75A.75.75 0 013.75 9h.5a.75.75 0 010 1.5h-.5A.75.75 0 013 9.75zM7.75 9a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zM7 6.75A.75.75 0 017.75 6h.5a.75.75 0 010 1.5h-.5A.75.75 0 017 6.75zM7.75 3a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5z" />
            </svg>
            {detail.company.replace(/^@/, '')}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-app-border mt-auto">
        <span className="flex items-center gap-1.25 font-mono text-[11.5px] font-medium text-app-accent [&>svg]:opacity-75">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z" />
          </svg>
          {contributor.contributions.toLocaleString()} commit{contributor.contributions !== 1 ? 's' : ''}
        </span>
        {detail?.followers !== undefined && (
          <span className="font-sans text-[11.5px] text-app-text-secondary">
            {detail.followers.toLocaleString()} followers
          </span>
        )}
      </div>
    </a>
  );
}
