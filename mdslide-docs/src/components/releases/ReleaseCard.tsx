import React, { useState } from 'react';
import type { GHRelease, GHAsset } from '../../types/github';
import {
  formatBytes,
  formatDate,
  timeAgo,
  platformInfo,
  renderMarkdown
} from '../../utils';
import { ReleaseCardProps } from '@site/src/types/component';

export default function ReleaseCard({ release, isLatest }: ReleaseCardProps): React.ReactElement {
  const [bodyExpanded, setBodyExpanded] = useState(isLatest);
  const bodyHtml = renderMarkdown(release.body || '');

  const grouped: Record<string, GHAsset[]> = {};
  for (const asset of release.assets) {
    const { os } = platformInfo(asset.name);
    if (!grouped[os]) {
      grouped[os] = [];
    }
    grouped[os].push(asset);
  }
  const osOrder = ['mac', 'linux', 'windows', 'other'];
  const sortedGroups = osOrder.filter(os => grouped[os]);
  const totalDownloads = release.assets.reduce((s, a) => s + a.download_count, 0);

  return (
    <article className={`bg-app-surface border border-app-border rounded-xl overflow-hidden transition-colors duration-200 ${isLatest ? 'border-app-accent!' : ''
      }`}>
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 p-7 pb-5 border-b border-app-border">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-medium text-app-text-primary bg-app-bg border border-app-border rounded-md px-2.5 py-0.5">
              {release.tag_name}
            </span>
            {isLatest && (
              <span className="font-mono text-[10px] font-medium tracking-wide uppercase text-white bg-app-accent rounded-full px-2.5 py-0.5">
                Latest
              </span>
            )}
            {release.prerelease && (
              <span className="font-mono text-[10px] font-medium tracking-wide uppercase text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-full px-2.5 py-0.5 dark:text-amber-300">
                Pre-release
              </span>
            )}
          </div>
          <h2 className="font-mono text-lg font-medium tracking-tight text-app-text-primary m-0 hover:text-app-accent">
            <a href={release.html_url} target="_blank" rel="noopener noreferrer" className="color-inherit no-underline hover:text-app-accent">
              {release.name || release.tag_name}
            </a>
          </h2>
          <div className="flex items-center gap-2 flex-wrap font-sans text-[12.5px] text-app-text-secondary [&_a]:text-app-text-primary [&_a]:no-underline [&_a]:font-medium hover:[&_a]:text-app-accent">
            <img src={release.author.avatar_url} alt={release.author.login} className="w-5 h-5 rounded-full border border-app-border" />
            <span>
              Released by{' '}
              <a href={release.author.html_url} target="_blank" rel="noopener noreferrer">
                {release.author.login}
              </a>
            </span>
            <span className="text-app-border text-base">·</span>
            <span title={formatDate(release.published_at)}>{timeAgo(release.published_at)}</span>
            <span className="text-app-border text-base">·</span>
            <span>{formatDate(release.published_at)}</span>
            {totalDownloads > 0 && (
              <>
                <span className="text-app-border text-base">·</span>
                <span>{totalDownloads.toLocaleString()} download{totalDownloads !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>

        <a
          href={release.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 shrink-0 font-mono text-xs font-medium text-app-text-secondary border border-app-border rounded-md p-[7px_12px] no-underline hover:border-app-accent hover:text-app-accent hover:no-underline self-start md:self-auto"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          View on GitHub
        </a>
      </div>

      {release.assets.length > 0 && (
        <div className="p-[20px_28px] border-b border-app-border md:p-5">
          <h3 className="flex items-center gap-1.75 font-mono text-[11px] font-medium tracking-wide uppercase text-app-text-secondary m-0 mb-4">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M7.47 10.78a.75.75 0 001.06 0l3.75-3.75a.75.75 0 00-1.06-1.06L8.75 8.44V1.75a.75.75 0 00-1.5 0v6.69L4.78 5.97a.75.75 0 00-1.06 1.06l3.75 3.75zM3.75 13a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5z" />
            </svg>
            Binary Downloads
          </h3>

          <div className="flex flex-col gap-4">
            {sortedGroups.map(os => (
              <div key={os} className="flex flex-col gap-1">
                <div className="font-sans text-[11.5px] font-semibold text-app-text-secondary tracking-wide mb-1">
                  {os === 'mac' ? '🍎 macOS' : os === 'linux' ? '🐧 Linux' : os === 'windows' ? '🪟 Windows' : '📦 Other'}
                </div>
                {grouped[os].map(asset => {
                  const { label } = platformInfo(asset.name);
                  return (
                    <a
                      key={asset.id}
                      href={asset.browser_download_url}
                      className="group flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-3 p-2.5 px-3.5 bg-app-bg border border-app-border rounded-md no-underline transition-all duration-150 cursor-pointer hover:border-app-accent hover:bg-app-surface hover:no-underline"
                      download
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-mono text-[12.5px] font-medium text-app-text-primary truncate">{asset.name}</span>
                        <span className="font-sans text-[11px] text-app-text-secondary">{label}</span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                        <span className="font-mono text-[11.5px] text-app-text-secondary whitespace-nowrap">{formatBytes(asset.size)}</span>
                        {asset.download_count > 0 && (
                          <span className="font-sans text-[11px] text-app-accent whitespace-nowrap">↓ {asset.download_count.toLocaleString()}</span>
                        )}
                        <span className="flex items-center justify-center w-6.5 h-6.5 rounded bg-app-surface border border-app-border text-app-text-secondary transition-colors duration-150 group-hover:border-app-accent group-hover:text-app-accent">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                            <path fillRule="evenodd" d="M7.47 10.78a.75.75 0 001.06 0l3.75-3.75a.75.75 0 00-1.06-1.06L8.75 8.44V1.75a.75.75 0 00-1.5 0v6.69L4.78 5.97a.75.75 0 00-1.06 1.06l3.75 3.75zM3.75 13a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5z" />
                          </svg>
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-dashed border-app-border font-sans text-xs">
            <span className="text-app-text-secondary text-xs">Source code</span>
            <a href={release.zipball_url} className="font-mono text-[11.5px] text-app-accent no-underline border border-app-border rounded px-2 py-0.5 transition-colors duration-150 hover:border-app-accent hover:no-underline">zip</a>
            <a href={release.tarball_url} className="font-mono text-[11.5px] text-app-accent no-underline border border-app-border rounded px-2 py-0.5 transition-colors duration-150 hover:border-app-accent hover:no-underline">tar.gz</a>
          </div>
        </div>
      )}

      {bodyHtml && (
        <div className="p-[0_28px_4px] md:p-[0_20px_4px]">
          <button className="flex items-center gap-2 w-full py-4.5 bg-transparent border-0 border-t border-app-border cursor-pointer font-mono text-[11px] font-medium tracking-wide uppercase text-app-text-secondary transition-colors duration-150 hover:text-app-text-primary" onClick={() => setBodyExpanded(v => !v)}>
            <span>Release Notes</span>
            <svg
              width="12" height="12" viewBox="0 0 16 16" fill="currentColor"
              style={{ transform: bodyExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 01.708 0L8 10.293l5.646-5.647a.5.5 0 01.708.708l-6 6a.5.5 0 01-.708 0l-6-6a.5.5 0 010-.708z" />
            </svg>
          </button>
          {bodyExpanded && (
            <div className="pb-6 font-sans text-sm leading-relaxed text-app-text-primary [&_h2]:font-mono [&_h2]:text-base [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h2]:text-app-text-primary [&_h3]:font-mono [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-app-text-primary [&_p]:text-[13.5px] [&_p]:mb-2 [&_p]:text-app-text-primary [&_ul]:mb-3 [&_ul]:pl-5 [&_li]:text-[13px] [&_li]:mb-1 [&_li]:text-app-text-secondary [&_li_a]:text-app-accent [&_li_a]:no-underline hover:[&_li_a]:underline [&_pre]:bg-app-bg [&_pre]:border [&_pre]:border-app-border [&_pre]:rounded-md [&_pre]:p-3.5 [&_pre]:px-4 [&_pre]:overflow-x-auto [&_pre]:my-3 [&_pre_code]:font-mono [&_pre_code]:text-[12.5px] [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0 [&_pre_code]:text-app-text-primary [&_code]:font-mono [&_code]:text-[85%] [&_code]:bg-app-surface [&_code]:border [&_code]:border-app-border [&_code]:rounded [&_code]:px-1.25 [&_code]:py-0.25 [&_code]:text-app-accent" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          )}
        </div>
      )}
    </article>
  );
}
