import type { ReactNode } from 'react';

export interface DemoTab {
  id: string;
  label: string;
  filename: string;
  code: ReactNode | ((activeTheme: string) => ReactNode);
  preview: (isDark: boolean, activeTheme?: string) => ReactNode;
}

// A single feature card shown in the features grid section.
export interface Feature {
  title: string;
  desc: string;
  icon: ReactNode;
}

// A single row in the CLI terminal showcase section.
export interface CliCommand {
  cmd: string;
  desc: string;
}

// The background/foreground color pair for a slide theme preview.
export interface ThemePreview {
  background: string;
  color: string;
}

// Metadata for a single built-in slide theme card.
export interface ThemeEntry {
  id: string;
  name: string;
  desc: string[];
  style: string;
}
