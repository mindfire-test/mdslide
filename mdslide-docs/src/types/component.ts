import { GHContributor, GHRelease } from './github';

export interface NavbarProps {
  scrolled: boolean;
  isDark: boolean;
  starsCount: string;
  navbarCopied: boolean;
  onCopy: (text: string, setCopied: (val: boolean) => void) => void;
  setNavbarCopied: (val: boolean) => void;
  onToggleTheme: () => void;
}

export interface CommandSeq {
  input: string;
  output: string;
}

export interface DemoWidgetProps {
  isDark: boolean;
}

export interface ReleaseCardProps {
  release: GHRelease;
  isLatest: boolean;
}

export interface ContributorCardProps {
  contributor: GHContributor;
}
