import React, { useState } from 'react';
import { CopyIcon } from '../icons/CopyIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { copyToClipboard } from '../../utils';
import { AppleIcon } from '../icons/AppleIcon';
import { LinuxIcon } from '../icons/LinuxIcon';
import { WindowsIcon } from '../icons/WindowsIcon';
import { INSTALL_OPTIONS } from '@site/src/constants';

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