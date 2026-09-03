import React, { useState } from 'react';
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

const NAV_LINK_CLASSES =
  "text-sm font-medium text-app-text-secondary no-underline relative py-1.5 transition-colors duration-200 cursor-pointer hover:text-app-text-primary group after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-app-accent after:transition-all after:duration-250 hover:after:w-full";

function NavLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Link to={to} className={NAV_LINK_CLASSES}>
      {children}
    </Link>
  );
}

export default function Navbar({
  scrolled,
  isDark,
  starsCount,
  navbarCopied,
  onCopy,
  setNavbarCopied,
  onToggleTheme
}: NavbarProps): React.ReactElement {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b border-transparent transition-all duration-300 ${scrolled || isMobileMenuOpen ? 'bg-app-bg/95 backdrop-blur-md border-app-border' : ''
        }`}
    >
      <div className="max-w-[1440px] mx-auto h-16 flex items-center justify-between px-6 md:px-10">
        <Link to="/" className="text-lg font-medium tracking-tight text-app-text-primary no-underline cursor-pointer flex items-center">
          <img src={useBaseUrl('/img/logo.png')} alt="mdslide logo" className="h-6 w-auto mr-2.5" />
          mdslide
          <span className="text-[10px] font-normal text-app-text-secondary ml-2 px-1.5 py-0.5 border border-app-border rounded tracking-wider opacity-70">
            by Mindfire
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          <NavLink to="/docs/intro">Docs</NavLink>
          <NavLink to="/contributors">Contributors</NavLink>
          <NavLink to="/releases">Releases</NavLink>
          <a
            href="https://github.com/mindfiredigital/mdslide"
            target="_blank"
            rel="noopener noreferrer"
            className={`${NAV_LINK_CLASSES} flex items-center gap-1`}
          >
            GitHub <ExternalLinkIcon />
          </a>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="hidden md:flex items-center gap-2 bg-app-surface border border-app-border px-3 py-1.5 rounded-full font-mono text-xs text-app-text-secondary cursor-pointer select-none relative transition-all duration-200 hover:border-app-accent hover:bg-primary/5 hover:text-app-text-primary"
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
            className="hidden lg:flex items-center gap-1.5 bg-app-surface border border-app-border px-3 py-1.5 rounded-full no-underline text-app-text-secondary text-xs transition-all duration-200 hover:border-app-accent hover:bg-primary/5 hover:text-app-text-primary"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 16 16" width="14" height="14">
              <path fillRule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694z" />
            </svg>
            <span>Star</span>
            {starsCount !== null && (
              <span style={{ borderLeft: '1px solid var(--app-border)', paddingLeft: '6px', marginLeft: '2px' }}>
                {starsCount}
              </span>
            )}
          </a>

          <button 
            className="lg:hidden bg-transparent border-none p-1 cursor-pointer text-app-text-primary hover:text-app-accent transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-app-bg border-b border-app-border lg:hidden flex flex-col px-6 py-4 gap-4 shadow-xl">
          <Link to="/docs/intro" className={NAV_LINK_CLASSES} onClick={() => setIsMobileMenuOpen(false)}>Docs</Link>
          <Link to="/contributors" className={NAV_LINK_CLASSES} onClick={() => setIsMobileMenuOpen(false)}>Contributors</Link>
          <Link to="/releases" className={NAV_LINK_CLASSES} onClick={() => setIsMobileMenuOpen(false)}>Releases</Link>
          <a
            href="https://github.com/mindfiredigital/mdslide"
            target="_blank"
            rel="noopener noreferrer"
            className={`${NAV_LINK_CLASSES} flex items-center gap-1`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            GitHub <ExternalLinkIcon />
          </a>
          
          <a
            href="https://github.com/mindfiredigital/mdslide"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-app-surface border border-app-border px-4 py-2.5 rounded-lg no-underline text-app-text-primary text-sm transition-all duration-200 hover:border-app-accent mt-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 fill-current text-app-text-secondary" viewBox="0 0 16 16" width="16" height="16">
                <path fillRule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694z" />
              </svg>
              <span>Star on GitHub</span>
            </div>
            {starsCount !== null && (
              <span className="text-app-text-secondary text-xs">
                {starsCount}
              </span>
            )}
          </a>
        </div>
      )}
    </nav>
  );
}
