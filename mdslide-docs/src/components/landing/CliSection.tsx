import React from 'react';
import { CLI_COMMANDS } from '../../constants/landing';

export default function CliSection(): React.ReactElement {
  return (
    <section className="py-24 px-10 bg-app-bg border-t border-app-border">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-20">
        <div className="flex-1">
          <h2 className="font-mono text-3xl font-medium text-app-text-primary mb-4">
            Developer CLI
          </h2>
          <p className="text-base leading-relaxed text-app-text-secondary max-w-[480px]">
            A streamlined command-line interface makes it easy to integrate slide compiling, watching, or exports into local editing setups.
          </p>
        </div>

        <div className="flex-[1.2] w-full">
          <div className="bg-[#0E0E0D] border border-app-border rounded-lg overflow-hidden shadow-lg">
            <div className="h-9 bg-white/5 border-b border-app-border flex items-center px-4">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-app-border" />
                <div className="w-2 h-2 rounded-full bg-app-border" />
                <div className="w-2 h-2 rounded-full bg-app-border" />
              </div>
              <span className="text-[11px] text-[#7a7a72] font-mono ml-3">
                terminal
              </span>
            </div>
            <div className="p-6 font-mono text-xs flex flex-col gap-4">
              {CLI_COMMANDS.map((c, i) => {
                const parts = c.cmd.split(' ');
                const base = parts.slice(0, 2).join(' ');
                const flag = parts.slice(2).join(' ');
                return (
                  <div key={i} className="grid grid-cols-[20px_1fr_auto] gap-3 items-center">
                    <span className="text-[#7a7a72]">$</span>
                    <span className="text-[#f0efe9]">
                      {base} {flag && <span className="text-[#4f7fd4]">{flag}</span>}
                    </span>
                    <span className="text-[#7a7a72] text-right text-[11px]">{c.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
