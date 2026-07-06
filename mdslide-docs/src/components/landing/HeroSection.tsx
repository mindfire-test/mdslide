import React from 'react';
import Link from '@docusaurus/Link';
import TypingTerminal from './TypingTerminal';


export default function HeroSection(): React.ReactElement {
  return (
    <header className="pt-[140px] pb-[100px] px-10 relative overflow-hidden bg-app-bg">
      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center text-center lg:text-left gap-12 lg:gap-[60px] z-10 relative">
        <div className="flex-1 flex flex-col items-center lg:items-start">
          {/* <div className="inline-flex items-center font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-app-accent border border-current rounded-full px-3 py-1 mb-6 bg-app-accent/5">
            Command-Line Tool
          </div> */}
          <h1 className="font-mono text-[38px] md:text-[52px] font-medium tracking-tight leading-[1.15] md:leading-[1.1] text-app-text-primary mb-5">
            Markdown to Presentation
          </h1>
          <p className="text-lg leading-relaxed text-app-text-secondary mb-9 max-w-[540px]">
            Build, watch, and export beautiful custom slide decks using simple Markdown and CSS variables. High performance standalone outputs.
          </p>
          <div className="flex gap-4">
            <Link
              to="/docs/intro"
              className="font-mono text-sm font-medium bg-app-accent text-app-bg! border border-app-accent rounded px-6 py-3 no-underline! transition-all duration-200 cursor-pointer hover:bg-app-text-primary hover:border-app-text-primary hover:-translate-y-0.5 hover:shadow-md"
            >
              Read Docs
            </Link>
            <a
              href="https://github.com/mindfiredigital/mdslide"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm font-medium bg-transparent text-app-text-primary! border border-app-border rounded px-6 py-3 no-underline! transition-all duration-200 cursor-pointer hover:border-app-accent hover:-translate-y-0.5"
            >
              View GitHub
            </a>
          </div>
        </div>

        <TypingTerminal />
      </div>
    </header>
  );
}
