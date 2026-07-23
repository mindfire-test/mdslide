export const COMPILE_CONFIG = {
  DEFAULT_FORMAT: 'html' as const,
  SUPPORTED_FORMATS: ['html', 'pdf', 'pptx'] as const,
  CHROME_CANDIDATES: [
    process.env['CHROME_PATH'],
    [
      // Google Chrome
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome-beta',
      '/usr/bin/google-chrome-unstable',
      '/opt/google/chrome/google-chrome',

      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',

      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Users\\<User>\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',

      // Chromium
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
      '/opt/chromium/chromium',

      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '~/Applications/Chromium.app/Contents/MacOS/Chromium',

      'C:\\Program Files\\Chromium\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe',
      'C:\\Users\\<User>\\AppData\\Local\\Chromium\\Application\\chrome.exe',

      // Microsoft Edge
      '/usr/bin/microsoft-edge',
      '/usr/bin/microsoft-edge-stable',
      '/opt/microsoft/msedge/msedge',

      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '~/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',

      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Users\\<User>\\AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe',

      // Brave Browser
      '/usr/bin/brave-browser',
      '/usr/bin/brave-browser-stable',
      '/usr/bin/brave-browser-beta',
      '/opt/brave.com/brave/brave-browser',

      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '~/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',

      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Users\\<User>\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    ],
  ].filter(Boolean) as string[],
  CHROME_FLAGS: '--headless --disable-gpu --no-sandbox',
} as const;

export const COMPILE_MESSAGES = {
  CORE_NOT_FOUND: 'Cannot find @mindfiredigital/mdslide-core. Make sure the core package is built.',
  SPINNER_START: (filename: string, format: string) =>
    `Compiling ${filename} → ${format.toUpperCase()}`,
  SPINNER_LAUNCHING_CHROME: 'Launching Chrome for PDF export...',
  SUCCESS_SUMMARY: (relativePath: string, slideCount: number, warningCount: number) => {
    const summaryText =
      warningCount > 0
        ? `(${warningCount} warning${warningCount > 1 ? 's' : ''})`
        : `  ${slideCount} slide${slideCount !== 1 ? 's' : ''}`;
    return `${relativePath}  ${summaryText}`;
  },
  DRY_RUN_SUMMARY: (relativePath: string, slideCount: number, warningCount: number) =>
    `[dry-run] would write ${relativePath}  (${slideCount} slide${slideCount !== 1 ? 's' : ''}, ${warningCount} warning${warningCount !== 1 ? 's' : ''})`,
} as const;
