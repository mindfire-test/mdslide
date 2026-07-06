// Formats a size in bytes to KB or MB.
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(0) + ' KB';
  }
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Formats an ISO date string to a locale specific long format.
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) {
    return 'Unknown date';
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Computes a human-friendly relative time string (e.g. "3 days ago").
export function timeAgo(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) {
    return 'Unknown date';
  }
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}
