import React from 'react';
import Link from '@docusaurus/Link';

export default function FooterSection(): React.ReactElement {
  return (
    <footer className="border-t border-app-border py-16 px-10 relative overflow-hidden bg-app-bg mt-[100px]">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-0 z-10 relative">
        <div className="flex flex-col gap-2">
          <div className="text-base font-medium text-app-text-primary">mdslide</div>
          <div className="text-xs text-app-text-secondary">
            Designed and built with passion by Mindfire Digital.
          </div>
        </div>

        <div className="flex flex-wrap gap-4 md:gap-6">
          <Link to="/docs/intro" className="text-[13px] text-app-text-secondary no-underline transition-colors duration-200 hover:text-app-text-primary">Docs</Link>
          <Link to="/contributors" className="text-[13px] text-app-text-secondary no-underline transition-colors duration-200 hover:text-app-text-primary">Contributors</Link>
          <Link to="/releases" className="text-[13px] text-app-text-secondary no-underline transition-colors duration-200 hover:text-app-text-primary">Releases</Link>
          <a href="https://github.com/mindfiredigital/mdslide" target="_blank" rel="noopener noreferrer" className="text-[13px] text-app-text-secondary no-underline transition-colors duration-200 hover:text-app-text-primary">
            GitHub
          </a>
        </div>

        <div className="text-xs text-app-text-secondary">
          © {new Date().getFullYear()} Mindfire Digital. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
