import React, { useEffect, useState } from 'react';
import Layout from '@theme/Layout';

import type { GHRelease } from '../../types';
import { fetchAllReleases, groupByYear } from '../../utils';
import ReleaseCard from '../../components/releases/ReleaseCard';
import SkeletonRelease from '../../components/releases/SkeletonRelease';

export default function Releases(): React.ReactElement {
  const [releases, setReleases] = useState<GHRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllReleases()
      .then(data => {
        setReleases(data.filter(r => !r.draft));
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load releases. GitHub API rate limit may have been reached - try again in a minute.');
        setLoading(false);
      });
  }, []);

  const latestRelease = releases[0];
  const totalDownloads = releases
    .flatMap(r => r.assets)
    .reduce((s, a) => s + a.download_count, 0);

  const yearGroups = groupByYear(releases);
  const showYearGroups = yearGroups.length > 1;

  return (
    <Layout title="Releases" description="All mdslide release versions, binary downloads, and changelogs.">
      <main className="min-h-screen bg-app-bg">
        <section className="py-18 md:py-14 px-10 border-b border-app-border">
          <div className="max-w-[860px] mx-auto">
            <div className="inline-flex items-center font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-app-accent border border-currentColor rounded-full px-2.5 py-0.5 mb-5 opacity-80">
              Releases
            </div>
            <h1 className="font-mono text-3xl md:text-5xl font-medium tracking-tight text-app-text-primary mb-3.5">
              Download mdslide
            </h1>
            <p className="font-sans text-base leading-relaxed text-app-text-secondary mb-9 max-w-[580px]">
              Pre-built binaries for macOS, Linux, and Windows. Every release includes a full changelog and all binary artifacts built by CI.
            </p>

            {!loading && !error && releases.length > 0 && (
              <div className="flex items-center gap-6 flex-wrap mb-8">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[26px] font-medium text-app-text-primary tracking-tight leading-none">
                    {latestRelease.tag_name}
                  </span>
                  <span className="font-sans text-[11.5px] text-app-text-secondary tracking-wide">latest release</span>
                </div>
                <div className="w-[1px] h-9 bg-app-border" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[26px] font-medium text-app-text-primary tracking-tight leading-none">
                    {releases.length}
                  </span>
                  <span className="font-sans text-[11.5px] text-app-text-secondary tracking-wide">
                    total release{releases.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="w-[1px] h-9 bg-app-border" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[26px] font-medium text-app-text-primary tracking-tight leading-none">
                    {totalDownloads.toLocaleString()}
                  </span>
                  <span className="font-sans text-[11.5px] text-app-text-secondary tracking-wide">total downloads</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 p-3 px-4 bg-app-surface border border-app-border rounded-lg w-fit max-w-full">
              <span className="font-mono text-[11px] font-medium tracking-wide uppercase text-app-text-secondary">npm</span>
              <code className="font-mono text-[12.5px] text-app-accent bg-transparent border-0 p-0">
                npm install -g @mindfiredigital/mdslide-cli
              </code>
              <span className="text-app-border text-lg hidden sm:inline">·</span>
              <span className="font-mono text-[11px] font-medium tracking-wide uppercase text-app-text-secondary">bun</span>
              <code className="font-mono text-[12.5px] text-app-accent bg-transparent border-0 p-0">
                bun add -g @mindfiredigital/mdslide-cli
              </code>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-10 px-10">
          <div className="max-w-[860px] mx-auto flex flex-col gap-8">
            {error && (
              <div className="flex items-start gap-3 font-sans text-sm text-app-text-secondary bg-app-surface border border-app-border rounded-lg p-[18px_22px]">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                  <path fillRule="evenodd" d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" />
                </svg>
                {error}
              </div>
            )}

            {loading && (
              <>
                <SkeletonRelease />
                <SkeletonRelease />
              </>
            )}

            {!loading && !error && releases.length === 0 && (
              <div className="text-center py-20 px-10">
                <div className="text-5xl mb-4">🚀</div>
                <h2 className="font-mono text-xl font-medium text-app-text-primary mb-2.5">No releases yet</h2>
                <p className="font-sans text-sm.5 text-app-text-secondary mb-6">
                  The first release is coming soon. Watch the repository to be notified.
                </p>
                <a
                  href="https://github.com/mindfiredigital/mdslide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex font-mono text-[13px] font-medium bg-app-accent text-white! rounded-md px-5 py-2.5 no-underline! transition-opacity duration-200 hover:opacity-85"
                >
                  Watch on GitHub
                </a>
              </div>
            )}

            {!loading && !error && !showYearGroups && releases.map((release, i) => (
              <ReleaseCard key={release.id} release={release} isLatest={i === 0} />
            ))}

            {!loading && !error && showYearGroups && yearGroups.map(({ year, items }) => (
              <div key={year} className="flex flex-col gap-5">
                <div className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-app-text-secondary flex items-center gap-3 py-2 after:content-[''] after:flex-1 after:h-[1px] after:bg-app-border">
                  {year}
                </div>
                {items.map(release => (
                  <ReleaseCard
                    key={release.id}
                    release={release}
                    isLatest={release.id === releases[0].id}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
