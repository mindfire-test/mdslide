import type { GHRelease } from '../types/github';
import { GITHUB_REPO, GITHUB_API_BASE } from '../constants/github';

export function parseNextLink(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

export async function fetchAllReleases(): Promise<GHRelease[]> {
  let url: string | null = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/releases?per_page=100`;
  const all: GHRelease[] = [];

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`GitHub API responded with status ${res.status}`);
    }
    const page: GHRelease[] = await res.json();
    all.push(...page);
    url = parseNextLink(res.headers.get('Link'));
  }

  return all;
}

export function groupByYear(releases: GHRelease[]): Array<{ year: number; items: GHRelease[] }> {
  const map = new Map<number, GHRelease[]>();
  for (const r of releases) {
    const yr = new Date(r.published_at).getFullYear();
    if (!map.has(yr)) {
      map.set(yr, []);
    }
    map.get(yr)!.push(r);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, items]) => ({ year, items }));
}

export async function fetchStars(): Promise<string> {
  const res = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}`);
  if (!res.ok) {
    throw new Error('Failed to fetch repository metadata');
  }
  const data = await res.json();
  if (data && data.stargazers_count !== undefined) {
    const count = data.stargazers_count;
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  }
  return '1';
}
