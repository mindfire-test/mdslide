---
sidebar_position: 2
sidebar_label: 'mdslide compile'
---

# Compile Command (`mdslide compile`)

The `compile` command compiles a Markdown presentation file into a standalone, distribution-ready output file in **HTML**, **PDF**, or **PowerPoint (PPTX)** format.

By default, the command runs in manual mode, bypassing the interactive wizard unless explicitly requested.

---

## Usage

```bash
mdslide compile <input-file> [options]
```

### Examples

```bash
# Compile to default HTML file (output.html)
mdslide compile slides.md

# Compile using a dark theme and custom output path
mdslide compile slides.md --theme dark --output dist/presentation.html

# Compile directly to a PDF document and open it
mdslide compile slides.md -o slides.pdf --open

# Compile to PowerPoint with native, editable text boxes
mdslide compile slides.md -f pptx --pptx-mode editable

# Read from stdin, stream compiled HTML to stdout
cat slides.md | mdslide compile - -o - -f html > deck.html

# Self-host CDN assets for offline/CSP-restricted embedding
mdslide compile slides.md --asset-urls '{"katexCss":"/vendor/katex.css"}'

# Abort the PDF export if Chrome takes longer than 60s
mdslide compile slides.md -f pdf --pdf-timeout 60000
```

---

## Options & Flags Reference

Below is the complete list of flags available for the `compile` command:

| Flag                      | Short | Type            | Default Value       | Description                                                                                                                                                                                          |
| :------------------------ | :---- | :-------------- | :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`--theme <theme>`**     | `-t`  | `string`        | `'light'`           | Select theme style: `light`, `dark`, `notion`, `terminal`, `gradient`, `corporate`, or `solarized`.                                                                                                  |
| **`--output <file>`**     | `-o`  | `string`        | `'output.<format>'` | Output file path for the compiled presentation.                                                                                                                                                      |
| **`--format <format>`**   | `-f`  | `string`        | _Auto-detected_     | Target output format: `html`, `pdf`, or `pptx`. If omitted, the compiler detects the format from the `--output` file extension.                                                                      |
| **`--pptx-mode <mode>`**  | -     | `string`        | `'screenshot'`      | PowerPoint export mode: `screenshot` (pixel-perfect slides as images) or `editable` (native editable PPTX elements).                                                                                 |
| **`--pdf-timeout <ms>`**  | -     | `number`        | `30000`             | Aborts the PDF export if headless Chrome takes longer than `<ms>` milliseconds to render.                                                                                                            |
| **`--asset-urls <json>`** | -     | `string` (JSON) | _Built-in CDNs_     | JSON object overriding the Prism/KaTeX/Mermaid CDN URLs, e.g. to self-host assets for offline or CSP-restricted embedding. Malformed JSON or a non-object value exits with `ERR_INVALID_ASSET_URLS`. |
| **`--interactive`**       | `-i`  | `boolean`       | `false`             | Runs compilation interactively using the CLI wizard.                                                                                                                                                 |
| **`--open`**              | -     | `boolean`       | `false`             | Automatically opens the compiled file in your default browser or viewer.                                                                                                                             |
| **`--strict`**            | -     | `boolean`       | `false`             | Fails compilation and exits with an error code if validation warnings are found.                                                                                                                     |
| **`--verbose`**           | -     | `boolean`       | `false`             | Outputs detailed compiler logs in the console.                                                                                                                                                       |
| **`--silent`**            | -     | `boolean`       | `false`             | Suppresses all logging output.                                                                                                                                                                       |

This command also accepts the [global flags](./global-flags.md) (`--json`, `--no-input`, `--yes`, `--dry-run`, `--timeout`).

---

## Exporting Formats Deep Dive

### 1. HTML Output (Standalone Interactive Deck)

Compiles your slides into a single, dependency-free HTML file containing all stylesheet layers and script controllers. The file can be opened offline in any modern browser, and includes features like:

- **Presenter View** (`P`)
- **Fullscreen Mode** (`F`)
- **Keyboard Shortcuts Help Guide** (`?`)
- **Animations & reveals**

### 2. PDF Output (Print-Ready Document)

Uses a headless browser in the background to load your HTML presentation, render elements, and print them directly to a standard vector PDF page.

- Ensure Chrome or Chromium is installed.
- Can customize print settings and Chromium paths inside [mdslide.config.ts](../configuration-file.md).

### 3. PowerPoint Output (PPTX Deck)

`mdslide` offers two modes for PowerPoint exports via the `--pptx-mode` flag:

- **`screenshot` (Default)**: Runs a headless browser to capture pixel-perfect PNG images of each slide, inserting them into your PPTX deck. This preserves all theme styling, custom fonts, grids, and layouts exactly as they look in the browser.
- **`editable`**: Uses the native presentation generator to map Markdown headings, lists, tables, and code blocks to native, editable PowerPoint shapes and text boxes. Allows you to open the deck and directly edit text or resize containers in PowerPoint/Keynote.

---

## Stdin / Stdout Piping

`<input-file>` accepts `-` to read the Markdown from stdin, and `-o -` /
`--output -` streams the compiled file to stdout instead of writing it to
disk. Stdout streaming only works for the `html` format — `pdf` and `pptx`
need a real file target for Chrome/the PPTX writer, and reject `-o -` with
`ERR_STDOUT_OUTPUT`. Combining `-o -` with `--json` is also rejected (both
want to own stdout).

```bash
cat slides.md | mdslide compile - -o - -f html > deck.html
```

---

## Machine-Readable Output (`--json`)

Passing `--json` silences the human logs and prints a single JSON object to
stdout instead:

```json
{
  "file": "/abs/path/slides.md",
  "output": "/abs/path/output.html",
  "format": "html",
  "slides": 3,
  "warnings": [],
  "dryRun": false,
  "written": true,
  "success": true
}
```

- `dryRun` mirrors whether `--dry-run` was passed; `written` is `false` when it was (the compile still runs in full, so warnings/errors are real, but no file is written, nothing is opened, and no server is started).
- When `--strict` is combined with `--json` and warnings were found, `success` is `false` and an `error` field is added describing the warning-triggered failure — the process still exits non-zero.
- On failure (bad input, invalid format, compile error, etc.) the shape instead follows the shared error envelope: `{ "file", "success": false, "error", "code", "hint" }`. See the [global flags & error codes reference](./global-flags.md) for the full `code` catalog.
