---
sidebar_position: 7
sidebar_label: 'mdslide screenshot'
---

# Screenshot Slides (`mdslide screenshot`)

The `screenshot` command compiles your presentation and renders each slide (or a single chosen slide) to a standalone PNG file using headless Chrome/Chromium. It reuses the exact same capture pipeline as `compile --pptx-mode screenshot`, exposed directly as image files instead of being embedded in a PPTX — the fastest way for a human, a CI job, or an AI agent without a browser to visually confirm what a deck actually looks like.

---

## Usage

```bash
mdslide screenshot <input> [options]
```

### Examples

```bash
# Capture every slide to ./screenshots/slide-1.png, slide-2.png, ...
mdslide screenshot slides.md

# Capture into a custom directory
mdslide screenshot slides.md -o ./previews

# Capture only slide 3, and get the result as JSON
mdslide screenshot slides.md --slide 3 --json
```

---

## Options & Flags Reference

Below are the flags available for the `screenshot` command, in addition to the [Global Flags](./global-flags.md) shared by every command:

| Flag                      | Type      | Default Value   | Description                                                                                  |
| :------------------------ | :-------- | :-------------- | :------------------------------------------------------------------------------------------- |
| **`-t, --theme <theme>`** | `string`  | `light`         | Theme override: `light`, `dark`, `notion`, `terminal`, `gradient`, `corporate`, `solarized`. |
| **`-o, --output <dir>`**  | `string`  | `./screenshots` | Output directory the PNG files are written into.                                             |
| **`--slide <n>`**         | `number`  | every slide     | Capture only slide `<n>` (1-based) instead of the whole deck.                                |
| **`--width <px>`**        | `number`  | `1920`          | Viewport width, in pixels, used for the Chrome capture.                                      |
| **`--height <px>`**       | `number`  | `1080`          | Viewport height, in pixels, used for the Chrome capture.                                     |
| **`--verbose`**           | `boolean` | `false`         | Outputs detailed compiler check logs in the console.                                         |
| **`--silent`**            | `boolean` | `false`         | Suppresses all logging output.                                                               |

`screenshot` accepts `-` as `<input>` to read Markdown from stdin. Output files are always named `slide-<n>.png` (1-based), matching slide order.

---

## Requirements & Behavior

- **Requires local Chrome/Chromium.** Like PDF export and `--pptx-mode screenshot`, capturing a screenshot launches headless Chrome. If no Chrome/Chromium binary can be found (and `CHROME_PATH` isn't set), the command fails before capturing anything.
- **`--dry-run` skips the Chrome launch entirely.** The deck still fully compiles (so compile errors/warnings are real), but no browser is launched and no PNG files are written — only a summary line (or `dryRun: true` in `--json` mode) is printed.
- **`--slide` is validated against the deck.** If `--slide <n>` is out of range for the compiled deck's slide count, the command reports a `CompileError` instead of attempting to capture anything.

### `--json` output shape

```json
{
  "file": "/abs/path/slides.md",
  "outputDir": "/abs/path/screenshots",
  "slides": 3,
  "screenshots": [
    "/abs/path/screenshots/slide-1.png",
    "/abs/path/screenshots/slide-2.png",
    "/abs/path/screenshots/slide-3.png"
  ],
  "warnings": [],
  "dryRun": false,
  "success": true
}
```

`screenshots` lists the absolute paths of every PNG file written, in slide order (or a single path when `--slide <n>` was passed). After running this, an agent should read the PNG files at these paths directly to see the rendered slides.

---

## How Screenshot Capture Works

1. **Compile** — `screenshot` runs the same compile pipeline as `compile`, producing full HTML for the deck (respecting `--theme` and any config-file settings) without writing an output file.
2. **Locate Chrome** — it resolves a local Chrome/Chromium binary (`CHROME_PATH` env var, or an auto-detected system install). If none is found, it fails with a descriptive error rather than attempting a capture. (Note: unlike PDF export, this failure currently isn't tagged with a structured `code` field in `--json` mode — match on the message text if scripting around this specific case.)
3. **Serve & capture** — the compiled HTML is served from a short-lived local static server, and headless Chrome navigates to each slide (or only the one selected via `--slide`) at the requested `--width`/`--height` viewport, capturing a PNG per slide sequentially to avoid overloading system resources.
4. **Write files** — each PNG is written to the output directory (default `./screenshots`) as `slide-<n>.png`.

This makes `screenshot` especially useful for AI coding agents and CI environments that have no way to open a real browser: rather than trusting that a layout, an image placement, or an [overflow split](../syntax-customizations/slide-annotations.md#supported-annotations) worked as intended, the agent can capture PNGs and inspect them directly — the same visual truth a human reviewing the deck in a browser would see. It's commonly paired with [`inspect`](./inspect.md) (to check the compiler's structural report first) before spending the extra time to launch Chrome and render pixels.
