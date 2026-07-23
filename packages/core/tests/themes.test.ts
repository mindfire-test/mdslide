import { describe, test, expect } from 'vitest';
import { ThemeEngine, BUILT_IN_THEME_NAMES } from '../src/themes/themeEngine.ts';
import { BUILT_IN_THEMES } from '../src/themes/builtInThemes.ts';
import { DEFAULT_THEME } from '../src/constants/index.ts';

describe('Theme Engine', () => {
  const engine = new ThemeEngine();

  test('lists all built-in themes', () => {
    expect(BUILT_IN_THEME_NAMES).toContain('light');
    expect(BUILT_IN_THEME_NAMES).toContain('dark');
    expect(BUILT_IN_THEME_NAMES).toContain('notion');
    expect(BUILT_IN_THEME_NAMES).toContain('terminal');
    expect(BUILT_IN_THEME_NAMES).toContain('gradient');
    expect(BUILT_IN_THEME_NAMES).toContain('corporate');
    expect(BUILT_IN_THEME_NAMES).toContain('solarized');
    expect(BUILT_IN_THEME_NAMES.length).toBe(7);
  });

  test('returns base CSS', () => {
    const baseCSS = engine.getBaseCSS();
    expect(baseCSS).toContain('body {');
    expect(baseCSS).toContain('.slide {');
    expect(baseCSS).toContain('.deck {');
    expect(baseCSS).toContain('.progressBar {');
  });

  test('resolves built-in themes to CSS', () => {
    const lightCSS = engine.resolveTheme('light');
    expect(lightCSS).toContain('--slide-bg:       #ffffff');
    expect(lightCSS).toBe(BUILT_IN_THEMES.light);

    const darkCSS = engine.resolveTheme('dark');
    expect(darkCSS).toContain('--slide-bg:       #09090b');
    expect(darkCSS).toBe(BUILT_IN_THEMES.dark);
  });

  test('falls back to the default theme CSS for an unrecognized theme name', () => {
    const customCSS = ':root { --slide-bg: red; }';
    const resolved = engine.resolveTheme(customCSS);
    expect(resolved).toBe(BUILT_IN_THEMES[DEFAULT_THEME]);
  });

  test('falls back to the default theme CSS for a theme name that attempts style injection', () => {
    const malicious = '</style><script>alert(1)</script>';
    const resolved = engine.resolveTheme(malicious);
    expect(resolved).toBe(BUILT_IN_THEMES[DEFAULT_THEME]);
    expect(resolved).not.toContain('<script>');
  });
});
