export class MdSlideError extends Error {
  readonly code: string;
  readonly hint?: string;
  readonly file?: string;
  readonly line?: number;

  constructor(opts: {
    code: string;
    message: string;
    hint?: string;
    file?: string;
    line?: number;
  }) {
    super(opts.message);
    this.code = opts.code;
    this.hint = opts.hint;
    this.file = opts.file;
    this.line = opts.line;
    this.name = 'MdSlideError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InputNotFoundError extends MdSlideError {
  constructor(path: string) {
    super({
      code: 'ERR_INPUT_NOT_FOUND',
      message: `Input file not found: "${path}"`,
      hint: 'Check the path and try again.',
    });
    this.name = 'InputNotFoundError';
  }
}

export class InvalidFormatError extends MdSlideError {
  constructor(format: string) {
    super({
      code: 'ERR_INVALID_FORMAT',
      message: `Unknown output format: "${format}"`,
      hint: 'Valid formats are: html, pdf, pptx',
    });
    this.name = 'InvalidFormatError';
  }
}

export class InvalidAssetUrlsError extends MdSlideError {
  constructor(reason: string) {
    super({
      code: 'ERR_INVALID_ASSET_URLS',
      message: `Invalid --asset-urls value: ${reason}`,
      hint: 'Pass a JSON object mapping asset keys to URLs, e.g. --asset-urls \'{"katexCss":"/vendor/katex.css"}\'',
    });
    this.name = 'InvalidAssetUrlsError';
  }
}

export class ChromeNotFoundError extends MdSlideError {
  constructor() {
    super({
      code: 'ERR_CHROME_NOT_FOUND',
      message: 'PDF export requires Google Chrome or Chromium to be installed.',
      hint: 'Install Chrome/Chromium or set CHROME_PATH environment variable.',
    });
    this.name = 'ChromeNotFoundError';
  }
}

export class PortInUseError extends MdSlideError {
  constructor(port: number) {
    super({
      code: 'ERR_PORT_IN_USE',
      message: `Port ${port} is already in use.`,
      hint: `Try a different port: mdslide watch --port ${port + 1}`,
    });
    this.name = 'PortInUseError';
  }
}

export class CompileError extends MdSlideError {
  constructor(message: string, opts?: { file?: string; line?: number }) {
    super({
      code: 'ERR_COMPILE',
      message,
      hint: 'Check your Markdown syntax.',
      ...opts,
    });
    this.name = 'CompileError';
  }
}

export class StdoutOutputError extends MdSlideError {
  constructor(message: string) {
    super({
      code: 'ERR_STDOUT_OUTPUT',
      message,
      hint: 'Piping to stdout (-o -) only supports --format html.',
    });
    this.name = 'StdoutOutputError';
  }
}

export class ValidationError extends MdSlideError {
  constructor(message = 'Validation failed') {
    super({
      code: 'ERR_VALIDATION_FAILED',
      message,
      hint: 'Fix the validation errors/warnings.',
    });
    this.name = 'ValidationError';
  }
}

export class StdinUnsupportedError extends MdSlideError {
  constructor(message: string, hint: string) {
    super({ code: 'ERR_STDIN_UNSUPPORTED', message, hint });
    this.name = 'StdinUnsupportedError';
  }
}

export const ERROR_CODES = [
  'ERR_INPUT_NOT_FOUND',
  'ERR_INVALID_FORMAT',
  'ERR_CHROME_NOT_FOUND',
  'ERR_PORT_IN_USE',
  'ERR_COMPILE',
  'ERR_STDOUT_OUTPUT',
  'ERR_STDIN_UNSUPPORTED',
  'ERR_VALIDATION_FAILED',
  'ERR_INVALID_TIMEOUT',
  'ERR_TIMEOUT',
  'ERR_INVALID_ASSET_URLS',
] as const;
