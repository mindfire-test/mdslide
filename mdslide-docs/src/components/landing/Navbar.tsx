import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
  SunIcon,
  MoonIcon
} from '../icons';
import { NavbarProps } from '@site/src/types/index';

export default function Navbar({
  scrolled,
  isDark,
  starsCount,
  navbarCopied,
  onCopy,
  setNavbarCopied,
  onToggleTheme
}: NavbarProps): React.ReactElement {
  return (
    <nav
      className={`fixed top-0 left-0 right-0 h-16 z-50 border-b border-transparent transition-all duration-300 ${scrolled ? 'bg-app-bg/70 backdrop-blur-md border-app-border' : ''
        }`}
    >
      <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between px-10">
        <Link to="/" className="text-lg font-medium tracking-tight text-app-text-primary no-underline cursor-pointer flex items-center">
          <img src={useBaseUrl('/img/logo.png')} alt="mdslide logo" className="h-6 w-auto mr-2.5" />
          mdslide
          <span className="text-[10px] font-normal text-app-text-secondary ml-2 px-1.5 py-0.5 border border-app-border rounded tracking-wider opacity-70">
            by Mindfire
          </span>
        </Link>

        <div className="flex items-center gap-8">
          <Link
            to="/docs/intro"
            className="text-sm font-medium text-app-text-secondary no-underline relative py-1.5 transition-colors duration-200 cursor-pointer hover:text-app-text-primary group after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-app-accent after:transition-all after:duration-250 hover:after:w-full"
          >
            Docs
          </Link>
          <Link
            to="/contributors"
            className="text-sm font-medium text-app-text-secondary no-underline relative py-1.5 transition-colors duration-200 cursor-pointer hover:text-app-text-primary group after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-app-accent after:transition-all after:duration-250 hover:after:w-full"
          >
            Contributors
          </Link>
          <Link
            to="/releases"
            className="text-sm font-medium text-app-text-secondary no-underline relative py-1.5 transition-colors duration-200 cursor-pointer hover:text-app-text-primary group after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-app-accent after:transition-all after:duration-250 hover:after:w-full"
          >
            Releases
          </Link>
          <a
            href="https://github.com/mindfiredigital/mdslide"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-app-text-secondary no-underline relative py-1.5 transition-colors duration-200 cursor-pointer hover:text-app-text-primary group after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-app-accent after:transition-all after:duration-250 hover:after:w-full flex items-center gap-1"
          >
            GitHub <ExternalLinkIcon />
          </a>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 bg-app-surface border border-app-border px-3 py-1.5 rounded-full font-mono text-xs text-app-text-secondary cursor-pointer select-none relative transition-all duration-200 hover:border-app-accent hover:bg-primary/5 hover:text-app-text-primary"
            onClick={() => onCopy('npm install -g @mindfiredigital/mdslide-cli', setNavbarCopied)}
          >
            <span>npm install -g @mindfiredigital/mdslide-cli</span>
            {navbarCopied ? (
              <CheckIcon className="w-3 h-3 stroke-current stroke-2 fill-none" />
            ) : (
              <CopyIcon className="w-3 h-3 stroke-current stroke-2 fill-none" />
            )}
            <div
              className={`absolute -bottom-8 left-1/2 -translate-x-1/2 bg-app-text-primary text-app-bg px-2 py-1 rounded text-[10px] whitespace-nowrap pointer-events-none transition-opacity duration-200 ${navbarCopied ? 'opacity-100' : 'opacity-0'
                }`}
            >
              Copied!
            </div>
          </div>

          <button
            className="bg-none border border-app-border rounded-full w-8 h-8 flex items-center justify-center cursor-pointer text-app-text-secondary transition-all duration-200 hover:border-app-accent hover:text-app-text-primary hover:bg-app-surface"
            onClick={onToggleTheme}
            aria-label="Toggle Color Mode"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <a
            href="https://github.com/mindfiredigital/mdslide"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-app-surface border border-app-border px-3 py-1.5 rounded-full no-underline text-app-text-secondary text-xs transition-all duration-200 hover:border-app-accent hover:bg-primary/5 hover:text-app-text-primary"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 16 16" width="14" height="14">
              <path fillRule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694z" />
            </svg>
            <span>Star</span>
            <span style={{ borderLeft: '1px solid var(--app-border)', paddingLeft: '6px', marginLeft: '2px' }}>
              {starsCount}
            </span>
          </a>
        </div>
      </div>
    </nav>
  );
}
