import React from 'react';
import type { DemoTab, Feature, CliCommand, ThemeEntry, ThemePreview } from '../types/landing';
import {
  ExportIcon,
  MathIcon,
  DiagramIcon,
  ThemeIcon,
  ReloadIcon,
  SettingsIcon
} from '../components/icons';

// Color palettes for each of the built-in themes for preview generation.  
export const THEME_PREVIEWS: Record<string, ThemePreview> = {
  light: { background: '#F7F6F3', color: '#1A1A18' },
  dark: { background: '#161614', color: '#F0EFE9' },
  gradient: { background: 'linear-gradient(135deg, #1A1C29 0%, #301B2E 100%)', color: '#F0EFE9' },
  terminal: { background: '#050505', color: '#39FF14' },
  notion: { background: '#FFFFFF', color: '#37352F' },
  corporate: { background: '#0A192F', color: '#CCD6F6' },
  solarized: { background: '#002B36', color: '#839496' },
};

// Interactive demo tab definition containing simulated Markdown code and HTML preview factories.  
export const DEMO_TABS: DemoTab[] = [
  {
    id: 'reload',
    label: '⚡ Hot Reload',
    filename: 'presentation.md',
    code: (activeTheme: string) => (
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
    ),
    preview: (isDark: boolean, activeTheme?: string) => {
      const themeStyle = THEME_PREVIEWS[activeTheme || 'gradient'];
      return (
        <div style={{
          background: themeStyle.background,
          color: themeStyle.color,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: '#4F7FD4',
            color: '#0E0E0D',
            fontSize: '9px',
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: '4px',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Live compiles active
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 500, margin: '0 0 16px 0', color: themeStyle.color }}>
            Live Compiles ⚡
          </h3>
          <ul style={{ textAlign: 'left', fontSize: '13px', color: '#7A7A72', margin: 0, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '6px' }}>Watch mode updates in <span style={{ color: '#4F7FD4' }}>24ms</span></li>
            <li style={{ marginBottom: '6px' }}>Instant CSS hot-reload</li>
            <li>Auto-refreshing layouts</li>
          </ul>
        </div>
      );
    }
  },
  {
    id: 'math',
    label: '📐 Math (KaTeX)',
    filename: 'math.md',
    code: (
      <>
        <div className="flex"><span className="w-6 text-app-border select-none shrink-0">1</span><span className="text-app-text-primary"><span className="text-app-accent font-bold"># Schrödinger Equation 📐</span></span></div>
        <div className="flex"><span className="w-6 text-app-border select-none shrink-0">2</span><span className="text-app-text-primary"></span></div>
        <div className="flex"><span className="w-6 text-app-border select-none shrink-0">3</span><span className="text-app-text-primary">Full support for equations:</span></div>
        <div className="flex"><span className="w-6 text-app-border select-none shrink-0">4</span><span className="text-app-text-primary"></span></div>
        <div className="flex"><span className="w-6 text-app-border select-none shrink-0">5</span><span className="text-app-text-primary"><span className="text-app-border">$$</span></span></div>
        <div className="flex"><span className="w-6 text-app-border select-none shrink-0">6</span><span className="text-app-text-primary"><span className="text-app-accent">{"i\\hbar \\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi"}</span></span></div>
        <div className="flex"><span className="w-6 text-app-border select-none shrink-0">7</span><span className="text-app-text-primary"><span className="text-app-border">$$</span></span></div>
      </>
    ),
    preview: (isDark: boolean) => (
      <div style={{
        backgroundColor: isDark ? '#161614' : '#EFEDE8',
        color: isDark ? '#F0EFE9' : '#1A1A18',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '32px'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 16px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`, paddingBottom: '8px' }}>
          Schrödinger Equation 📐
        </h3>
        <p style={{ fontSize: '12px', color: isDark ? '#7A7A72' : '#6B6B63', margin: '0 0 16px 0' }}>
          Full support for complex mathematical equations.
        </p>
        <div style={{
          backgroundColor: isDark ? '#0E0E0D' : '#F7F6F3',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
          padding: '16px',
          borderRadius: '6px',
          textAlign: 'center',
          fontSize: '16px',
          fontStyle: 'italic'
        }}>
          iℏ ∂/∂t Ψ = Ĥ Ψ
        </div>
      </div>
    )
  },
  {
    id: 'mermaid',
    label: '📊 Mermaid',
    filename: 'diagrams.md',
    code: (
      <>
        <div className="flex"><span className="w-6 text-app-border select-none shrink-0">1</span><span className="text-app-text-primary"><span className="text-app-accent font-bold"># Pipeline 📊</span></span></div>
        <div className="flex"><span className="w-6 text-app-border select-none shrink-0">2</span><span className="text-app-text-primary"></span></div>
        <div className="flex"><span className="w-6 text-app-border select-none shrink-0">3</span><span className="text-app-text-primary"><span className="text-app-border">```mermaid</span></span></div>
        <div className="flex"><span className="w-6 text-app-border select-none shrink-0">4</span><span className="text-app-text-primary"><span className="text-app-accent">graph LR</span></span></div>
        <div className="flex"><span className="w-6 text-app-border select-none shrink-0">5</span><span className="text-app-text-primary">  <span className="text-app-accent">A[Markdown]</span> <span className="text-app-border">{"-->"}</span> <span className="text-app-accent">B(mdslide)</span></span></div>
        <div className="flex"><span className="w-6 text-app-border select-none shrink-0">6</span><span className="text-app-text-primary">  <span className="text-app-accent">B</span> <span className="text-app-border">{"-->"}</span> <span className="text-app-accent">C[HTML/PDF/PPTX]</span></span></div>
        <div className="flex"><span className="w-6 text-app-border select-none shrink-0">7</span><span className="text-app-text-primary"><span className="text-app-border">```</span></span></div>
      </>
    ),
    preview: (isDark: boolean) => (
      <div style={{
        backgroundColor: isDark ? '#161614' : '#EFEDE8',
        color: isDark ? '#F0EFE9' : '#1A1A18',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '32px'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 24px 0' }}>
          Pipeline 📊
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '11px'
        }}>
          <div style={{
            border: `1px solid ${isDark ? '#4F7FD4' : '#D63B2F'}`,
            padding: '6px 12px',
            borderRadius: '4px',
            backgroundColor: isDark ? 'rgba(79,127,212,0.1)' : 'rgba(214,59,47,0.1)'
          }}>
            Markdown
          </div>
          <span style={{ color: isDark ? '#7A7A72' : '#6B6B63' }}>→</span>
          <div style={{
            border: `1px solid ${isDark ? '#4F7FD4' : '#D63B2F'}`,
            padding: '6px 12px',
            borderRadius: '4px',
            backgroundColor: isDark ? 'rgba(79,127,212,0.1)' : 'rgba(214,59,47,0.1)',
            fontWeight: 500
          }}>
            mdslide
          </div>
          <span style={{ color: isDark ? '#7A7A72' : '#6B6B63' }}>→</span>
          <div style={{
            border: `1px solid ${isDark ? '#4F7FD4' : '#D63B2F'}`,
            padding: '6px 12px',
            borderRadius: '4px',
            backgroundColor: isDark ? 'rgba(79,127,212,0.1)' : 'rgba(214,59,47,0.1)'
          }}>
            HTML / PDF
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'split',
    label: '📖 Two Column',
    filename: 'layout.md',
    code: (
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
    ),
    preview: (isDark: boolean) => (
      <div style={{
        backgroundColor: isDark ? '#161614' : '#EFEDE8',
        color: isDark ? '#F0EFE9' : '#1A1A18',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '32px'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 20px 0' }}>
          Dual Layout 📖
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          fontSize: '11px',
          lineHeight: 1.5
        }}>
          <div style={{
            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
            paddingRight: '12px'
          }}>
            <strong style={{ color: isDark ? '#4F7FD4' : '#D63B2F', display: 'block', marginBottom: '4px' }}>Column Left</strong>
            Left column content renders on the left half of the slide.
          </div>
          <div>
            <strong style={{ color: isDark ? '#4F7FD4' : '#D63B2F', display: 'block', marginBottom: '4px' }}>Column Right</strong>
            Right column content renders on the right half.
          </div>
        </div>
      </div>
    )
  }
];

// Highlights metadata features.  
export const FEATURES: Feature[] = [
  {
    title: 'Multi-format Export',
    desc: 'Compile slides to high-performance standalone HTML slideshows, pixel-perfect print ready vector PDFs, or native PowerPoint (PPTX) presentations.',
    icon: <ExportIcon />
  },
  {
    title: 'KaTeX Math',
    desc: 'Write LaTeX styled equations natively inside Markdown. Get lightning fast renders for complex mathematical formulas and fractions.',
    icon: <MathIcon />
  },
  {
    title: 'Mermaid Diagrams',
    desc: 'Render flowcharts, sequence diagrams, and Gantt charts using simple inline text descriptions without leaving your Markdown document.',
    icon: <DiagramIcon />
  },
  {
    title: 'Custom Themes',
    desc: 'Choose from 7 built-in developer focused themes, or build custom layouts from scratch to align with your personal or brand styles.',
    icon: <ThemeIcon />
  },
  {
    title: 'Hot Reload Dev Server',
    desc: 'Start watch mode to automatically compile and update your slideshow in milliseconds whenever you save modifications to the source files.',
    icon: <ReloadIcon />
  },
  {
    title: 'CSS Variables Override',
    desc: 'Modify fonts, background colors, and slide transitions easily on-the-fly using global or per-slide CSS variables overrides.',
    icon: <SettingsIcon />
  }
];

// Showcase CLI command definitions.  
export const CLI_COMMANDS: CliCommand[] = [
  { cmd: 'mdslide init', desc: 'Scaffold a new presentation workspace' },
  { cmd: 'mdslide compile slides.md', desc: 'Compile Markdown to standalone HTML' },
  { cmd: 'mdslide compile slides.md --pdf', desc: 'Export slide deck to vector PDF' },
  { cmd: 'mdslide compile slides.md --pptx', desc: 'Export slide deck to editable PowerPoint' },
  { cmd: 'mdslide watch slides.md', desc: 'Start hot-reload local preview server' }
];

// Showcase slide themes.  
export const THEMES: ThemeEntry[] = [
  { id: 'light', name: 'Light', desc: ['Warm off-white background', 'High contrast text', 'Elegant spacing'], style: 'themePreview_light' },
  { id: 'dark', name: 'Dark', desc: ['Deep charcoal canvas', 'Soft light typography', 'Neon syntax styling'], style: 'themePreview_dark' },
  { id: 'gradient', name: 'Gradient', desc: ['Vibrant violet & indigo', 'Polished glass cards', 'Glow drop-shadows'], style: 'themePreview_gradient' },
  { id: 'terminal', name: 'Terminal', desc: ['Pure black canvas', 'Cyberpunk green text', 'Monospace terminals'], style: 'themePreview_terminal' },
  { id: 'notion', name: 'Notion', desc: ['Pristine white backdrop', 'Minimalist aesthetics', 'Clean modern borders'], style: 'themePreview_notion' },
  { id: 'corporate', name: 'Corporate', desc: ['Sleek deep navy blue', 'Silver text accents', 'Polished presentations'], style: 'themePreview_corporate' },
  { id: 'solarized', name: 'Solarized', desc: ['Gentle warm cyan canvas', 'Amber accent borders', 'Solarized color palettes'], style: 'themePreview_solarized' },
];
