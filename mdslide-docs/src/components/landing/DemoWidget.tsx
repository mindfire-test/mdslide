import React, { useState } from 'react';
import { DEMO_TABS, THEMES } from '../../constants/landing';
import { DemoWidgetProps } from '@site/src/types/index';

export default function DemoWidget({ isDark }: DemoWidgetProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState(DEMO_TABS[0].id);
  const [activeTheme, setActiveTheme] = useState('gradient');

  const currentTab = DEMO_TABS.find(t => t.id === activeTab) || DEMO_TABS[0];

  return (
    <section className="py-20 px-10 bg-app-bg border-t border-app-border">
      <h2 className="font-mono text-3xl font-medium text-app-text-primary text-center mb-2.5">
        Interactive Preview
      </h2>
      <p className="text-base text-app-text-secondary text-center mb-12">
        Compare Markdown sources side-by-side with hot compiles outputting live presentation designs.
      </p>

      <div className="max-w-[1440px] mx-auto mb-12 flex flex-col md:flex-row bg-app-surface border border-app-border rounded-xl overflow-hidden shadow-sm">
        <div className="flex-[1.1] border-b md:border-b-0 md:border-r border-app-border flex flex-col bg-app-bg">
          <div className="h-12 border-b border-app-border flex items-center justify-between px-4 bg-app-surface">
            <div className="flex gap-2 overflow-x-auto">
              {DEMO_TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`font-mono text-xs font-medium text-app-text-secondary bg-none border border-transparent px-3 py-1.5 rounded cursor-pointer whitespace-nowrap transition-all duration-200 hover:text-app-text-primary hover:bg-app-bg ${activeTab === tab.id ? 'text-app-accent! border-app-border bg-app-bg!' : ''
                    }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-app-text-secondary font-mono">
              {currentTab.filename}
            </span>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <pre className="font-mono text-[13px] leading-relaxed m-0 text-app-text-primary">
              <code>
                {typeof currentTab.code === 'function'
                  ? currentTab.code(activeTheme)
                  : currentTab.code}
              </code>
            </pre>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="h-12 border-b border-app-border flex items-center px-4 bg-app-surface">
            <span className="font-mono text-xs font-medium text-app-text-secondary">
              RENDERED SLIDE PREVIEW
            </span>
          </div>
          <div className="p-6 bg-app-bg flex-1 flex items-center justify-center">
            <div className="w-full aspect-[16/10] rounded-lg overflow-hidden border border-app-border shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex flex-col">
              <div className="flex-1 relative">
                <div className="absolute top-3 right-3 font-mono text-[9px] font-medium bg-black/40 text-white px-1.5 py-0.5 rounded pointer-events-none z-10">
                  SLIDE 1
                </div>
                <div className="h-full w-full">
                  {currentTab.preview(isDark, activeTheme)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto">
        <span className="text-[11px] font-medium text-app-text-secondary font-mono uppercase tracking-[0.05em]">
          Choose Presentation Theme
        </span>

        <div className="flex gap-3 overflow-x-auto py-2.5 px-1 mt-4 w-full">
          {THEMES.map(theme => (
            <div
              key={theme.id}
              className={`min-w-[110px] p-3 rounded border border-app-border cursor-pointer flex flex-col gap-1 items-center justify-center transition-all duration-200 bg-app-surface hover:-translate-y-0.5 ${activeTheme === theme.id ? 'border-app-accent!' : ''
                }`}
              onClick={() => setActiveTheme(theme.id)}
            >
              <span className="text-[11px] font-medium text-app-text-primary">{theme.name}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-app-border text-app-text-secondary">
                Preset
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
