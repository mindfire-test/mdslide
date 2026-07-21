import fs from 'fs';
import { spawn } from 'child_process';

export async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

export function screenshotSlide(
  chromeBin: string,
  url: string,
  outputPng: string,
  width: number,
  height: number,
  timeoutMs: number,
  extraArgs: string[] = []
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--run-all-compositor-stages-before-draw',
      '--virtual-time-budget=10000',
      `--window-size=${width},${height}`,
      ...extraArgs,
      `--screenshot=${outputPng}`,
      url,
    ];

    const child = spawn(chromeBin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    const stderr: Buffer[] = [];

    child.stderr?.on('data', (d: Buffer) => stderr.push(d));

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Screenshot timed out for: ${url}`));
    }, timeoutMs);

    child.on('close', async (code) => {
      clearTimeout(timer);
      const exists = code === 0 && (await fileExists(outputPng));
      if (exists) {
        resolve();
      } else {
        reject(
          new Error(
            `Chrome screenshot failed (code ${code}) for ${url}\n` +
              Buffer.concat(stderr).toString().slice(0, 500)
          )
        );
      }
    });

    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

// injects a slide selector script into the HTML so a single ?slide=<n> query
// param can drive which slide is instantly visible for a headless capture
export function injectSlideSelector(html: string): string {
  const css = `
<style>
  /* Disable all animations, transitions, and hide controls for screenshot mode */
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
    transition-duration: 0s !important;
    animation-duration: 0s !important;
  }
  .dokContainer, .progressBarContainer {
    display: none !important;
  }
  /* Ensure the active slide is instantly visible and positioned at 0,0 */
  .slide.active {
    opacity: 1 !important;
    transform: none !important;
    display: flex !important;
  }
  .slide:not(.active) {
    opacity: 0 !important;
    display: none !important;
  }
  /* Enforce fragment visibility in screenshots */
  .fragment {
    opacity: 1 !important;
  }
</style>
`;

  const script = `
<script>
(function() {
  var idx = parseInt(new URLSearchParams(location.search).get('slide') || '0', 10);

  function activate() {
    var slides = document.querySelectorAll('.slide');
    if (!slides.length) return;
    idx = Math.max(0, Math.min(idx, slides.length - 1));
    slides.forEach(function(s, i) {
      if (i === idx) {
        s.classList.add('active');
        s.classList.remove('past');
      } else {
        s.classList.remove('active');
        s.classList.add('past');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', activate);
  } else {
    activate();
  }
})();
</script>`;

  // Inject right before </head>
  return html.replace('</head>', `${css}\n${script}\n</head>`);
}
