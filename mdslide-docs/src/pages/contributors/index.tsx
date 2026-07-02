import React, { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import type { GHContributor } from '../../types';
import ContributorCard from '../../components/contributors/ContributorCard';
import SkeletonCard from '../../components/contributors/SkeletonCard';

export default function Contributors(): React.ReactElement {
  const [contributors, setContributors] = useState<GHContributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCommits, setTotalCommits] = useState(0);

  useEffect(() => {
    fetch('https://api.github.com/repos/mindfiredigital/mdslide/contributors?per_page=100')
      .then(r => {
        if (!r.ok) throw new Error(`GitHub API responded with ${r.status}`);
        return r.json();
      })
      .then((data: GHContributor[]) => {
        const humans = data.filter(c => c.type !== 'Bot' && !c.login.includes('[bot]'));
        setContributors(humans);
        setTotalCommits(humans.reduce((sum, c) => sum + c.contributions, 0));
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load contributors. GitHub API rate limit may have been reached.');
        setLoading(false);
      });
  }, []);

  return (
    <Layout
      title="Contributors"
      description="The people who built mdslide - every commit, fix, and feature."
    >
      <main className="min-h-screen">
        <section className="py-20 md:py-12 px-6 md:px-10 border-b border-app-border bg-app-bg">
          <div className="max-w-[760px] mx-auto">
            <div className="inline-flex items-center font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-app-accent border border-currentColor rounded-full px-2.5 py-0.5 mb-6 opacity-80">
              Open Source
            </div>
            <h1 className="font-mono text-3xl md:text-5xl font-medium tracking-tight leading-tight text-app-text-primary mb-4">
              Built by the community
            </h1>
            <p className="font-sans text-base leading-relaxed text-app-text-secondary mb-10 max-w-[560px]">
              Every line of mdslide was written by real people. This page celebrates everyone who has contributed code, fixes, and ideas.
            </p>
            {!loading && !error && (
              <div className="flex items-center gap-4 md:gap-6 flex-wrap">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-3xl font-medium text-app-text-primary tracking-tight leading-none">
                    {contributors.length}
                  </span>
                  <span className="font-sans text-xs text-app-text-secondary">contributors</span>
                </div>
                <div className="w-[1px] h-8 md:h-10 bg-app-border" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-3xl font-medium text-app-text-primary tracking-tight leading-none">
                    {totalCommits.toLocaleString()}
                  </span>
                  <span className="font-sans text-xs text-app-text-secondary">total commits</span>
                </div>
                <div className="w-[1px] h-8 md:h-10 bg-app-border" />
                <div className="flex flex-col gap-0.5">
                  <a
                    href="https://github.com/mindfiredigital/mdslide"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[13px] text-app-accent no-underline font-medium transition-opacity duration-200 hover:opacity-75 hover:no-underline"
                  >
                    Contribute on GitHub →
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="py-14 md:py-10 px-6 md:px-10 bg-app-bg">
          <div className="max-w-[1200px] mx-auto">
            {error && (
              <div className="flex items-center gap-2.5 font-sans text-sm text-app-text-secondary bg-app-surface border border-app-border rounded-lg px-5 py-4 max-w-[600px]">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                  <path fillRule="evenodd" d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" />
                </svg>
                {error}
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {contributors.map(c => (
                  <ContributorCard key={c.id} contributor={c} />
                ))}
              </div>
            )}
          </div>
        </section>

        {!loading && !error && (
          <section className="border-t border-app-border py-16 px-6 md:px-10 bg-app-surface">
            <div className="max-w-[560px] mx-auto text-center">
              <h2 className="font-mono text-2xl font-medium tracking-tight text-app-text-primary mb-3">
                Want to see your name here?
              </h2>
              <p className="font-sans text-sm leading-relaxed text-app-text-secondary mb-8">
                mdslide is fully open source. Bug fixes, new themes, docs improvements, or entirely new features - all contributions are welcome.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <a
                  href="https://github.com/mindfiredigital/mdslide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center font-mono text-[13px] font-medium bg-app-accent text-white! rounded-md px-5 py-2.5 no-underline! transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                >
                  View the repository
                </a>
                <a
                  href="https://github.com/mindfiredigital/mdslide/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center font-mono text-[13px] font-medium bg-transparent text-app-text-primary! border border-app-border rounded-md px-5 py-2.5 no-underline! transition-all duration-200 hover:border-app-accent hover:-translate-y-0.5"
                >
                  Browse open issues
                </a>
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}
