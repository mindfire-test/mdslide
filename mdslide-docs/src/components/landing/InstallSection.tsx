import React, { useState } from 'react';
import { CopyIcon } from '../icons/CopyIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { copyToClipboard } from '../../utils';

const AppleIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
  </svg>
);

const LinuxIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.69 2 6 4.69 6 8c0 .87.21 1.69.58 2.42C5.64 11.23 5 12.54 5 14c0 1.95 1.09 3.65 2.72 4.54C7.29 19.34 7 20.14 7 21c0 .55.45 1 1 1h8c.55 0 1-.45 1-1 0-.86-.29-1.66-.72-2.46C17.91 17.65 19 15.95 19 14c0-1.46-.64-2.77-1.58-3.58.37-.73.58-1.55.58-2.42 0-3.31-2.69-6-6-6zm-1.5 5.5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm3 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
  </svg>
);

const WindowsIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM11.25 1.899L24 0v11.55H11.25V1.899zM11.25 12.45H24v11.55l-12.75-1.9v-9.65z" />
  </svg>
);

const INSTALL_OPTIONS = [
  { id: 'unix', label: 'macOS / Linux', cmd: 'curl -fsSL https://mindfiredigital.github.io/mdslide/installer | bash' },
  { id: 'windows', label: 'Windows', cmd: 'irm https://mindfiredigital.github.io/mdslide/installer.ps1 | iex' },
  { id: 'bun', label: 'bun', cmd: 'bun add -g @mindfiredigital/mdslide-cli' },
  { id: 'npm', label: 'npm', cmd: 'npm install -g @mindfiredigital/mdslide-cli' },
  { id: 'pnpm', label: 'pnpm', cmd: 'pnpm add -g @mindfiredigital/mdslide-cli' },
  { id: 'yarn', label: 'yarn', cmd: 'yarn global add @mindfiredigital/mdslide-cli' },
];

export default function InstallSection(): React.ReactElement {
  const [activeTab, setActiveTab] = useState('unix');
  const [copied, setCopied] = useState(false);

  const activeOption = INSTALL_OPTIONS.find((opt) => opt.id === activeTab) || INSTALL_OPTIONS[0];

  const handleCopy = () => {
    copyToClipboard(activeOption.cmd, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const tabClass = (id: string) =>
    `font-mono text-[11px] font-medium px-2.5 py-1.5 rounded cursor-pointer flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 ${activeTab === id
      ? 'text-app-accent bg-app-bg border border-app-border shadow-sm'
      : 'text-app-text-secondary hover:text-app-text-primary bg-none border border-transparent'
    }`;

  return (
    <section className="py-24 px-10 bg-app-bg border-t border-app-border">
      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center text-center lg:text-left gap-12 lg:gap-[60px] z-10 relative">

        <div className="flex-1 flex flex-col items-center lg:items-start w-full">
          <h2 className="font-mono text-3xl font-medium text-app-text-primary mb-3">
            Install mdslide
          </h2>
          <p className="text-base text-app-text-secondary max-w-[520px]">
            Get up and running instantly using our standalone zero-dependency installer or via your preferred package manager.
          </p>
        </div>

        <div className="flex-[1.1] w-full flex flex-col">
          <div className="bg-[#121211] border border-app-border rounded-xl p-5 shadow-lg flex flex-col gap-5">

            {/* Header: two aligned columns, divider between them, copy button on the right */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-app-border/40 pb-4 gap-4">

              <div className="flex items-start gap-6 overflow-x-auto scrollbar-none">

                {/* Standalone column */}
                <div className="flex flex-col gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-app-text-secondary uppercase tracking-wider select-none">
                    Standalone
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => { setActiveTab('unix'); setCopied(false); }} className={tabClass('unix')}>
                      <AppleIcon className="w-3.5 h-3.5" />
                      <LinuxIcon className="w-3.5 h-3.5" />
                      <span>macOS / Linux</span>
                    </button>
                    <button onClick={() => { setActiveTab('windows'); setCopied(false); }} className={tabClass('windows')}>
                      <WindowsIcon className="w-3 h-3" />
                      <span>Windows</span>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px bg-app-border/40 self-stretch mt-6" />

                {/* Packages column */}
                <div className="flex flex-col gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-app-text-secondary uppercase tracking-wider select-none">
                    Packages
                  </span>
                  <div className="flex gap-1">
                    {['bun', 'npm', 'pnpm', 'yarn'].map((pm) => (
                      <button key={pm} onClick={() => { setActiveTab(pm); setCopied(false); }} className={`${tabClass(pm)} lowercase`}>
                        {pm}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className={`font-mono text-[10px] font-medium px-3.5 py-2 border rounded cursor-pointer transition-all duration-200 flex items-center gap-1.5 shrink-0 self-start ${copied
                  ? 'border-green-500/30 text-green-500 bg-green-500/5'
                  : 'border-app-border text-app-text-secondary hover:text-app-text-primary hover:border-app-text-primary bg-white/5'
                  }`}
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-3 h-3 text-green-500" />
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Command Display Body */}
            <div className="bg-[#080807] border border-app-border rounded-lg p-4 pl-5 relative group">
              <div className="font-mono text-xs md:text-sm overflow-x-auto whitespace-nowrap scrollbar-thin select-all flex items-center">
                <span className="text-[#4F7FD4] mr-3 select-none font-bold">$</span>
                <span className="text-[#F0EFE9] font-medium">{activeOption.cmd}</span>
              </div>
            </div>

            <span className="font-mono text-[9px] text-app-text-secondary uppercase tracking-wider block select-none px-1">
              Run command in {activeOption.id === 'windows' ? 'PowerShell' : 'Terminal'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}