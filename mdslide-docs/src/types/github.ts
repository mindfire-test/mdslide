export interface GHContributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

// Extended GitHub user profile returned by the
export interface ContributorDetail {
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
}

// A binary artifact attached to a GitHub release.
export interface GHAsset {
  id: number;
  name: string;
  size: number;
  download_count: number;
  browser_download_url: string;
  content_type: string;
}

// A full GitHub release object returned by the releases endpoint.
export interface GHRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
  assets: GHAsset[];
  tarball_url: string;
  zipball_url: string;
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}
