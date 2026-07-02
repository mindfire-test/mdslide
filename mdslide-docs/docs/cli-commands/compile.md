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
```

---

## Options & Flags Reference

Below is the complete list of flags available for the `compile` command:

| Flag                     | Short | Type      | Default Value       | Description                                                                                                                     |
| :----------------------- | :---- | :-------- | :------------------ | :------------------------------------------------------------------------------------------------------------------------------ |
| **`--theme <theme>`**    | `-t`  | `string`  | `'light'`           | Select theme style: `light`, `dark`, `notion`, `terminal`, `gradient`, `corporate`, or `solarized`.                             |
| **`--output <file>`**    | `-o`  | `string`  | `'output.<format>'` | Output file path for the compiled presentation.                                                                                 |
| **`--format <format>`**  | `-f`  | `string`  | _Auto-detected_     | Target output format: `html`, `pdf`, or `pptx`. If omitted, the compiler detects the format from the `--output` file extension. |
| **`--pptx-mode <mode>`** | -     | `string`  | `'screenshot'`      | PowerPoint export mode: `screenshot` (pixel-perfect slides as images) or `editable` (native editable PPTX elements).            |
| **`--interactive`**      | `-i`  | `boolean` | `false`             | Runs compilation interactively using the CLI wizard.                                                                            |
| **`--open`**             | -     | `boolean` | `false`             | Automatically opens the compiled file in your default browser or viewer.                                                        |
| **`--strict`**           | -     | `boolean` | `false`             | Fails compilation and exits with an error code if validation warnings are found.                                                |
| **`--verbose`**          | -     | `boolean` | `false`             | Outputs detailed compiler logs in the console.                                                                                  |
| **`--silent`**           | -     | `boolean` | `false`             | Suppresses all logging output.                                                                                                  |

---

## Exporting Formats Deep Dive

### 1. HTML Output (Standalone Interactive Deck)

Compiles your slides into a single, dependency-free HTML file containing all stylesheet layers and script controllers. The file can be opened offline in any modern browser, and includes features like:

- **Presenter View** (`P`)
- **Fullscreen Mode** (`F`)
- **Animations & reveals**

### 2. PDF Output (Print-Ready Document)

Uses a headless browser in the background to load your HTML presentation, render elements, and print them directly to a standard vector PDF page.

- Ensure Chrome or Chromium is installed.
- Can customize print settings and Chromium paths inside [mdslide.config.ts](../configuration-file.md).

### 3. PowerPoint Output (PPTX Deck)

`mdslide` offers two modes for PowerPoint exports via the `--pptx-mode` flag:

- **`screenshot` (Default)**: Runs a headless browser to capture pixel-perfect PNG images of each slide, inserting them into your PPTX deck. This preserves all theme styling, custom fonts, grids, and layouts exactly as they look in the browser.
- **`editable`**: Uses the native presentation generator to map Markdown headings, lists, tables, and code blocks to native, editable PowerPoint shapes and text boxes. Allows you to open the deck and directly edit text or resize containers in PowerPoint/Keynote.
