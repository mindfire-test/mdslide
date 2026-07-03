import React, { useState } from 'react';
import { DEMO_TABS, THEMES, THEME_PREVIEWS } from '../../constants/landing';
import { DemoWidgetProps } from '@site/src/types/index';

function DemoTabCode({ tabId, activeTheme }: { tabId: string; activeTheme: string }): React.ReactElement | null {
  switch (tabId) {
    case 'reload':
      return (
        <>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">1</span><span className="text-app-text-primary"><span className="text-app-border">---</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">2</span><span className="text-app-text-primary"><span className="text-app-accent">theme</span>: <span className="text-app-accent">{activeTheme}</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">3</span><span className="text-app-text-primary"><span className="text-app-accent">titleAlign</span>: <span className="text-app-accent">center</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">4</span><span className="text-app-text-primary"><span className="text-app-border">---</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">5</span><span className="text-app-text-primary"></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">6</span><span className="text-app-text-primary"><span className="text-app-accent font-bold"># Live Compiles ⚡</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">7</span><span className="text-app-text-primary"></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">8</span><span className="text-app-text-primary">- Watch mode updates in <span className="text-app-accent">24ms</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">9</span><span className="text-app-text-primary">- Instant CSS hot-reload</span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">10</span><span className="text-app-text-primary">- Auto-refreshing layouts</span></div>
        </>
      );
    case 'math':
      return (
        <>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">1</span><span className="text-app-text-primary"><span className="text-app-accent font-bold"># Schrödinger Equation 📐</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">2</span><span className="text-app-text-primary"></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">3</span><span className="text-app-text-primary">Full support for equations:</span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">4</span><span className="text-app-text-primary"></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">5</span><span className="text-app-text-primary"><span className="text-app-border">$$</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">6</span><span className="text-app-text-primary"><span className="text-app-accent">{"i\\hbar \\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi"}</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">7</span><span className="text-app-text-primary"><span className="text-app-border">$$</span></span></div>
        </>
      );
    case 'mermaid':
      return (
        <>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">1</span><span className="text-app-text-primary"><span className="text-app-accent font-bold"># Pipeline 📊</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">2</span><span className="text-app-text-primary"></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">3</span><span className="text-app-text-primary"><span className="text-app-border">```mermaid</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">4</span><span className="text-app-text-primary"><span className="text-app-accent">graph LR</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">5</span><span className="text-app-text-primary">  <span className="text-app-accent">A[Markdown]</span> <span className="text-app-border">{"-->"}</span> <span className="text-app-accent">B(mdslide)</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">6</span><span className="text-app-text-primary">  <span className="text-app-accent">B</span> <span className="text-app-border">{"-->"}</span> <span className="text-app-accent">C[HTML/PDF/PPTX]</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">7</span><span className="text-app-text-primary"><span className="text-app-border">```</span></span></div>
        </>
      );
    case 'split':
      return (
        <>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">1</span><span className="text-app-text-primary"><span className="text-app-border">---</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">2</span><span className="text-app-text-primary"><span className="text-app-accent">layout</span>: <span className="text-app-accent">split</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">3</span><span className="text-app-text-primary"><span className="text-app-border">---</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">4</span><span className="text-app-text-primary"><span className="text-app-accent font-bold"># Dual Layout 📖</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">5</span><span className="text-app-text-primary"></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">6</span><span className="text-app-text-primary">Left column details</span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">7</span><span className="text-app-text-primary"></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">8</span><span className="text-app-text-primary"><span className="text-app-accent">::split::</span></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">9</span><span className="text-app-text-primary"></span></div>
          <div className="flex"><span className="w-6 text-app-border select-none shrink-0">10</span><span className="text-app-text-primary">Right column details</span></div>
        </>
      );
    default:
      return null;
  }
}

function DemoTabPreview({ tabId, activeTheme }: { tabId: string; activeTheme: string }): React.ReactElement | null {
  const themeStyle = THEME_PREVIEWS[activeTheme] || THEME_PREVIEWS.gradient;

  switch (tabId) {
    case 'reload':
      return (
        <div
          className="h-full flex flex-col justify-center items-center p-6 text-center"
          style={{ background: themeStyle.background, color: themeStyle.color }}
        >
          <div
            className="text-[9px] font-medium px-2 py-0.5 rounded mb-3 uppercase tracking-wider bg-app-accent text-white"
          >
            Live compiles active
          </div>
          <h3
            className="text-2xl font-medium m-0 mb-4"
            style={{ color: themeStyle.color }}
          >
            Live Compiles ⚡
          </h3>
          <ul className="text-left text-xs text-app-text-secondary m-0 pl-5">
            <li className="mb-1.5">
              Watch mode updates in <span className="text-app-accent">24ms</span>
            </li>
            <li className="mb-1.5">Instant CSS hot-reload</li>
            <li>Auto-refreshing layouts</li>
          </ul>
        </div>
      );

    case 'math':
      return (
        <div
          className="h-full flex flex-col justify-center p-8 bg-app-surface text-app-text-primary"
        >
          <h3
            className="text-lg font-medium m-0 mb-4 border-b border-app-border pb-2"
          >
            Schrödinger Equation 📐
          </h3>
          <p className="text-xs text-app-text-secondary m-0 mb-4">
            Full support for complex mathematical equations.
          </p>
          <div
            className="bg-app-bg border border-app-border p-4 rounded-md text-center text-base italic"
          >
            iℏ ∂/∂t Ψ = Ĥ Ψ
          </div>
        </div>
      );

    case 'mermaid':
      return (
        <div
          className="h-full flex flex-col justify-center p-8 bg-app-surface text-app-text-primary"
        >
          <h3 className="text-lg font-medium m-0 mb-6">
            Pipeline 📊
          </h3>
          <div className="flex items-center justify-center gap-3 text-[11px]">
            <div
              className="border border-app-accent/30 px-3 py-1.5 rounded bg-app-accent/10"
            >
              Markdown
            </div>
            <span className="text-app-text-secondary">→</span>
            <div
              className="border border-app-accent/30 px-3 py-1.5 rounded bg-app-accent/10 font-medium"
            >
              mdslide
            </div>
            <span className="text-app-text-secondary">→</span>
            <div
              className="border border-app-accent/30 px-3 py-1.5 rounded bg-app-accent/10"
            >
              HTML / PDF
            </div>
          </div>
        </div>
      );

    case 'split':
      return (
        <div
          className="h-full flex flex-col justify-center p-8 bg-app-surface text-app-text-primary"
        >
          <h3 className="text-lg font-medium m-0 mb-5">
            Dual Layout 📖
          </h3>
          <div className="grid grid-cols-2 gap-4 text-[11px] leading-relaxed">
            <div className="border-r border-app-border pr-3">
              <strong className="text-app-accent block mb-1">Column Left</strong>
              Left column content renders on the left half of the slide.
            </div>
            <div>
              <strong className="text-app-accent block mb-1">Column Right</strong>
              Right column content renders on the right half.
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

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
                <DemoTabCode tabId={activeTab} activeTheme={activeTheme} />
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
                  <DemoTabPreview tabId={activeTab} activeTheme={activeTheme} />
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
