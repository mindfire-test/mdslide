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

export const DEMO_TABS: DemoTab[] = [
  {
    id: 'reload',
    label: '⚡ Hot Reload',
    filename: 'presentation.md',
  },
  {
    id: 'math',
    label: '📐 Math (KaTeX)',
    filename: 'math.md',
  },
  {
    id: 'mermaid',
    label: '📊 Mermaid',
    filename: 'diagrams.md',
  },
  {
    id: 'split',
    label: '📖 Two Column',
    filename: 'layout.md',
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
