const GAP_IN = 0.12;

const BASE_PT = {
  h1: 30,
  h2: 24,
  h3: 19,
  h4: 16,
  body: 15,
  code: 11,
  blockquote: 14,
  table: 11,
};

const slideDetails = {
  SLIDE_W: 10,
  SLIDE_H: 5.625,
  PAD_X: 0.78,
  PAD_TOP: 0.45,
  PAD_BOTTOM: 0.4,
  TITLE_GAP: 0.18,

  get CONTENT_X() {
    return this.PAD_X;
  },
  get CONTENT_W() {
    return this.SLIDE_W - this.PAD_X * 2;
  },
};

const DARK_THEMES = new Set(['dark', 'terminal', 'gradient']);

export { GAP_IN, BASE_PT, slideDetails, DARK_THEMES };
