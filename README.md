# mdslide

`mdslide` is a modular, high-performance compiler and presentation tool that converts Markdown documents into gorgeous interactive slide decks in HTML, PDF, or PowerPoint (PPTX) formats.

---

## Installation

### Standalone Binary (Recommended)

Install `mdslide` as a standalone binary without needing Node.js or Bun installed:

**macOS & Linux (Shell Script):**

```bash
curl -fsSL https://mindfiredigital.github.io/mdslide/installer | bash
```

**Windows (PowerShell):**

```powershell
irm https://mindfiredigital.github.io/mdslide/installer.ps1 | iex
```

### Package Managers

Alternatively, install the CLI globally using your preferred package manager:

```bash
npm install -g @mindfiredigital/mdslide-cli
# or
bun add -g @mindfiredigital/mdslide-cli
```

---

## Using the CLI (Quick Start)

Once installed, you can use the `mdslide` command to compile and preview presentations:

- **Interactive Wizard**: Launches a guided prompt to choose themes, formats, and outputs.
  ```bash
  mdslide slides.md
  ```
- **Compile Slides**: Build a static presentation file.
  ```bash
  mdslide compile slides.md --theme gradient --open
  ```
- **Live Watch Server**: Starts a local development server with hot-reloading on file save.
  ```bash
  mdslide watch slides.md --port 3500 --open
  ```
- **Initialize Template**: Scaffold a sample presentation and configuration file.
  ```bash
  mdslide init
  ```
- **Validate & Lint Layouts**: Scan your presentation for warnings or slide content overflows (add `--fix` to auto-repair mechanical issues, `--json` for machine-readable output).
  ```bash
  mdslide validate slides.md
  ```
- **Inspect Resolved Structure**: Dump each slide's resolved layout, why it was chosen, and its estimated content height, without a full render.
  ```bash
  mdslide inspect slides.md --json
  ```
- **Screenshot Slides**: Render each slide to a standalone PNG — useful for AI agents (or CI) that can't open a browser to visually confirm a deck.
  ```bash
  mdslide screenshot slides.md --json
  ```
- **Print the Full Syntax Reference**: Reprint the complete, self-contained syntax/CLI reference (the same one AI agents are pointed at).
  ```bash
  mdslide llms
  ```

---

## Exporting Presentations (PDF & PPTX)

`mdslide` compiles your presentation directly to offline document formats via CLI arguments.

### **1. PDF Export**

Compiles the slide deck to a standard presentation PDF document using a headless browser to print the slides to a PDF file:

```bash
mdslide compile slides.md -o presentation.pdf
# or explicitly specifying the format
mdslide compile slides.md --format pdf
```

### **2. PowerPoint (PPTX) Export**

`mdslide` offers two modes for generating PowerPoint slides:

- **Screenshot Mode (Default / Pixel-Perfect)**:
  Runs a headless browser in the background to capture a high-resolution snapshot of each HTML slide and inserts them as images into your PPTX deck. This preserves all theme styling, colors, custom fonts, layouts, and custom CSS exactly as they appear in the web browser.

  ```bash
  mdslide compile slides.md -o presentation.pptx --pptx-mode screenshot
  ```

- **Editable Mode (Native PowerPoint Elements)**:
  Uses the native presentation generator to map Markdown headings, lists, tables, and code blocks to native, editable PowerPoint shapes and text boxes. This allows you to open the deck in PowerPoint or Google Slides and directly edit text, move cards, or resize elements.
  ```bash
  mdslide compile slides.md -o presentation.pptx --pptx-mode editable
  ```

---

## Presentation Syntax & Feature Customizations

`mdslide` compiles standard Markdown files. You control structure, layout, typography, animations, and overflow behaviors using YAML frontmatter (for global defaults) and HTML comment annotations (for slide-specific overrides).

> This section is a quick overview. Run `mdslide llms` (or read `packages/cli/src/docs/SYNTAX.md`) for the complete, self-contained syntax and CLI reference — the same one AI agents are pointed at.

### 1. Settings Inheritance & Overrides

Settings can be defined both globally and locally:

- **Global Defaults**: Defined at the very top of your presentation file using YAML frontmatter. These settings apply to all slides.
- **Slide-Specific Overrides**: Declared inside individual slides using HTML comment annotations. When a slide-specific setting is present, it **overrides the global default** for that slide only.

#### **Settings Reference Table**

| Property / Feature     | Frontmatter Key (Global) | Comment Override (Slide-Specific)                     | Allowed Values                                                              | Description                                                                       |
| :--------------------- | :----------------------- | :---------------------------------------------------- | :-------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| **Theme**              | `theme`                  | _N/A (Global only)_                                   | `light`, `dark`, `notion`, `terminal`, `gradient`, `corporate`, `solarized` | Overall aesthetic theme styling and color scheme.                                 |
| **Title Alignment**    | `titleAlign`             | `<!-- titleAlign: value -->`                          | `left`, `center`, `right`                                                   | Horizontal alignment for the slide title.                                         |
| **Title Position**     | `titlePosition`          | `<!-- titlePosition: value -->`                       | `top`, `center`, `bottom`                                                   | Vertical positioning for the slide title.                                         |
| **Content Alignment**  | `align`                  | `<!-- align: value -->`                               | `top`, `center`, `bottom`                                                   | Vertical packing of the body content itself, independent of where the title sits. |
| **Bullet Animation**   | `animation` / `build`    | `<!-- animation: value -->` / `<!-- build: value -->` | `fade`, `slide-up`, `slide-left`, `slide-right`, `zoom`                     | Step-by-step reveal animation for list items and images.                          |
| **Overflow Splitting** | `overflow`               | `<!-- overflow: value -->`                            | `split`, `none`                                                             | Enables or disables the visual overflow auto-splitting engine.                    |

---

### 2. Frontmatter Example (Global Defaults)

Configure global presentation defaults at the very top of your file between `---` boundaries:

```yaml
---
title: My Executive Presentation
theme: gradient
titleAlign: center
titlePosition: top
animation: slide-up
overflow: split
---
```

---

### 3. Slide Separation

- **`<!-- slide -->` (recommended for AI agents)**: Always starts a new slide, regardless of heading structure elsewhere in the file — the safest marker to emit when generating one slide at a time.
- **Explicit Dividers**: Slides are separated by three dashes (`---`) on empty lines.
- **Auto-Separation**: If neither of the above is present, the compiler automatically starts a new slide at each Level-2 Heading (`##`).

All three can be mixed in one file; either explicit form (`---` or `<!-- slide -->`) always takes precedence over the `##` heuristic.

---

### 4. Slide-Level Customizations & Annotations

You can override layouts, alignments, animations, background styling, and notes on a per-slide basis using standard HTML comment annotations:

#### **Layout Overrides**

Force layout styling for a specific slide:

- `<!-- layout: title -->` — Main presentation cover layout.
- `<!-- layout: bullets -->` — Enhances text lists and bumps font sizing.
- `<!-- layout: code -->` — Optimizes rendering for full-screen code blocks.
- `<!-- layout: visual -->` — Fits images prominently within slide boundaries.
- `<!-- layout: quote -->` — Places quotes inside a styled highlighted card box.
- `<!-- layout: table -->` — Centers comparison grids.
- `<!-- layout: statement -->` — Displays single main highlights in a massive font.
- `<!-- layout: split -->` — Standardizes two-column content layouts.

#### **Slide Title Positioning & Alignment**

- `<!-- titleAlign: center -->` — Horizontal alignment for this slide's title (`left`, `center`, or `right`).
- `<!-- titlePosition: bottom -->` — Vertical position for this slide's title (`top`, `center`, or `bottom`).

#### **Bullet Reveal Animations**

Make lists, images, or elements build sequentially with transition effects. You can specify a different animation type for a slide:

```markdown
<!-- animation: zoom -->
```

#### **Visual Overflow Splitting (`overflow: split`)**

By default, long lists or code blocks that exceed slide heights do not split. To automatically split overflowing slides into continuation slides (e.g. `Title (Cont.)`), enable the overflow engine:

- **Globally**: Add `overflow: split` to your frontmatter.
- **Slide-Specific**: Add `<!-- overflow: split -->` to enable it on a single slide, or `<!-- overflow: none -->` to disable it on a slide when globally active.

#### **Background Images**

Set a background image using:

```markdown
<!-- backgroundImage: url('https://example.com/slide-bg.jpg') -->
```

- **Luminance Detection**: `mdslide` automatically analyzes the background image on load. If the image is dark, it inverts slide text to white; if light, it uses dark text with drop-shadows.
- **Manual Override**: Force contrast themes by appending `dark` or `light` inside the comment:
  ```markdown
  <!-- backgroundImage: url('bg.jpg') dark -->
  ```

#### **Presenter Speaker Notes**

Add presenter notes that sync automatically to the Presenter View window:

```markdown
<!-- notes -->

This text will be hidden on the presentation view but visible to the speaker in the presenter view panel.

<!-- /notes -->
```

#### **Presentation Navigation & Controls**

When presenting your compiled HTML slides in the browser, you can use the following keyboard shortcuts and interactive actions:

| Key / Control                | Action         | Description                                                                            |
| :--------------------------- | :------------- | :------------------------------------------------------------------------------------- |
| `Space` or `→` (Right Arrow) | Next           | Advance to the next slide (or reveal the next bullet list item/element).               |
| `←` (Left Arrow)             | Previous       | Return to the previous slide or sequential item.                                       |
| `f` / `F`                    | Fullscreen     | Toggle fullscreen mode.                                                                |
| `p` / `P`                    | Presenter View | Open a synced Presenter View window containing speaker notes and a presentation timer. |
| `?`                          | Help Guide     | Toggle the keyboard shortcuts overlay cheat sheet.                                     |

---

## Advanced Layouts & Styling

### Column Split Layouts (`::split::` / `::col::`)

To split content on a slide into two equal side-by-side columns:

```markdown
# Product Features Comparison

Left Column contents.

- High scalability
- Easy installation

::split::

Right Column contents.

- 24/7 technical support
- Extended warranty options
```

- **Auto-Split Heuristic**: If a slide contains exactly one image alongside text, `mdslide` automatically converts the layout into a split view, placing text on the left and the image on the right.

For more than two columns, use `::col::` (one fewer marker than the number of columns you want) plus an optional `<!-- columns: N ratio:a:b:c -->` annotation for unequal widths:

```markdown
# Build vs Test vs Deploy

<!-- columns: 3 ratio:2:1:1 -->

Build stuff

::col::

Test stuff

::col::

Deploy stuff
```

The declared count/ratio are validated against the actual `::col::` markers — `mdslide validate` warns (and falls back to equal-width columns) on a mismatch.

Each column resolves its own layout independently, just like a whole slide would — auto-detected from that column's own content, or forced with a `<!-- layout: xxx -->` comment placed inside that specific column's segment:

```markdown
# Build vs Test vs Deploy

<!-- columns: 3 ratio:2:1:1 -->
<!-- layout: code -->

\`\`\`bash
npm run build
\`\`\`

::col::

- Smoke tests
- Integration tests

::col::

Deploy stuff, no special layout here.
```

Here the Build column is forced to `code` styling while Test auto-detects `bullets` (it has a list) and Deploy auto-detects `content` — each independent of the others. Valid values are the same as the whole-slide `<!-- layout: -->` override, minus `title` and `split`.

### Content Alignment (`align`)

Independent of `titlePosition` (which moves the title + content block together), `<!-- align: top|center|bottom -->` controls how the body content packs within its own space — useful for a short slide that shouldn't glue to the top while the title stays there:

```markdown
# One Thing to Remember

<!-- align: center -->

Ship small, ship often.
```

### Mathematical Equations, GFM & Mermaid Diagrams

`mdslide` includes full support for GitHub Flavored Markdown (GFM), math formatting, and diagramming out of the box:

- **Mathematical Equations (KaTeX)**:
  - **Inline Math**: Wrap LaTeX formulas in single dollar signs `$`, e.g., `$E = mc^2$`.
  - **Block Math**: Wrap formulas in double dollar signs `$$` for centered display math:
    ```latex
    $$
    f(x) = \int_{-\infty}^{\infty} e^{-x^2} dx
    $$
    ```
- **Mermaid Diagrams**:
  - Render flowcharts, sequence diagrams, and class diagrams directly on slides using `mermaid` fenced code blocks:

    ````markdown
    ```mermaid
    graph TD
        A[Start] --> B(Process)
        B --> C{Decision}
        C -->|Yes| D[Success]
        C -->|No| E[Fail]
    ```
    ````

    ```

    ```

- **GitHub Flavored Markdown (GFM)**:
  - **Tables**: Design aligned comparison and data tables.
  - **Task Lists**: Create checkboxes with `- [ ]` and `- [x]`.
  - **Strikethrough**: Cross out text using `~~strikethrough~~`.

### Content Components (Admonitions, Stats Grid, Charts)

- **Admonitions / callouts**: a blockquote starting with `[!KIND]` (GitHub's
  own alert syntax — `note`, `tip`, `important`, `warning`, `caution`)
  renders as an icon + colored callout box:

  ```markdown
  > [!TIP]
  > Helpful advice for doing things better or more easily.
  ```

- **Stats / metric grid**: a fenced code block tagged `stats`, with one
  `Label: value` pair per line, renders as a row of big-number metric cards:

  ````markdown
  ```stats
  Revenue: +34%
  Deploys/wk: 12
  NPS: 68
  ```
  ````

- **Chart from a table**: `<!-- chart: bar -->` (or `line` / `pie`),
  placed immediately above a markdown table, renders it as an inline chart
  instead of a grid — the first column is the category axis, additional
  columns become chart series:

  ```markdown
  <!-- chart: bar -->

  | Month | Revenue |
  | ----- | ------- |
  | Jan   | 100     |
  | Feb   | 180     |
  | Mar   | 260     |
  ```

### Media Controls (Image Fit/Position, Video, Accent Color)

- **Image fit & position**: `<!-- imageFit: contain|cover -->` overrides how
  every image/video on a slide is scaled within its box. `<!-- imagePosition:
left|right -->` controls which side the image sits on in the
  auto-detected image+text split layout (default `right`):

  ```markdown
  <!-- imageFit: cover -->
  <!-- imagePosition: left -->

  The product does X, Y, and Z.

  ![Screenshot](screenshot.png)
  ```

- **Video / GIF embed**: ordinary image syntax pointing at a `.mp4`/`.webm`
  file renders as an autoplaying, looping, muted `<video>` instead of a
  broken `<img>` — great for embedding a short product demo clip:

  ```markdown
  ![Product demo](demo.mp4)
  ```

  `.gif` URLs are left untouched — they already autoplay/loop correctly as a
  plain `<img>`.

- **Per-slide accent color**: `<!-- accentColor: #f43f5e -->` overrides the
  theme's accent color (list markers, links, borders, chart palette) for
  just that one slide, without touching the global theme:

  ```markdown
  <!-- accentColor: #f43f5e -->

  - This slide pops with its own accent color
  ```

### Custom Typography, Colors & CSS Overrides

Since `mdslide` compiles your presentation directly to a standard web page, you can fully customize the look and feel using standard CSS variables inside a `<style>` block directly in your markdown file.

You can override the following configuration tokens inside a `:root` selector:

| CSS Variable                | Category       | Description / Default Value                                                   |
| :-------------------------- | :------------- | :---------------------------------------------------------------------------- |
| `--slide-font`              | **Typography** | Main font family for headings, lists, paragraphs, and cards.                  |
| `--slide-mono`              | **Typography** | Font family for inline code and code blocks.                                  |
| `--title-size`              | **Typography** | Font size for slide titles (default: `3.6rem`).                               |
| `--h2-size` / `--h3-size`   | **Typography** | Font sizes for content headings (default: `2.6rem` / `1.8rem`).               |
| `--body-size` / `--li-size` | **Typography** | Font sizes for paragraph text and list items (default: `1.35rem` / `1.3rem`). |
| `--code-size`               | **Typography** | Font size inside code blocks (default: `1.1rem`).                             |
| `--slide-bg`                | **Colors**     | Slide background color.                                                       |
| `--slide-surface`           | **Colors**     | Card/container background color (for quotes, columns).                        |
| `--slide-text`              | **Colors**     | Main body and heading text color.                                             |
| `--slide-muted`             | **Colors**     | Color for secondary metadata or muted text.                                   |
| `--slide-accent`            | **Colors**     | Accent color used for bullet markers, links, highlights, and borders.         |
| `--slide-border`            | **Colors**     | Color for dividing lines and card borders.                                    |
| `--slide-radius`            | **Styling**    | Border-radius styling for cards, code blocks, and images (default: `6px`).    |

#### **Example Styling Override**

Here is an example showing how to load custom Google Fonts, apply theme color modifications, and change accent coloring:

```html
<style>
  /* Import distinct display fonts: Creepster (spooky) and Press Start 2P (8-bit pixel) */
  @import url('https://fonts.googleapis.com/css2?family=Creepster&family=Press+Start+2P&display=swap');

  :root {
    /* Override default fonts */
    --slide-font: 'Creepster', cursive;
    --slide-mono: 'Press Start 2P', monospace;

    /* Customize colors and styling */
    --slide-accent: #ff007f; /* Bright neon pink */
    --slide-text: #111111; /* Dark charcoal */
    --slide-radius: 12px; /* Rounder borders */
  }
</style>
```

---

## Configuration File (`mdslide.config.ts`)

You can customize compilation defaults globally using a configuration file in your project folder.

Create a `mdslide.config.ts` file:

```typescript
import { defineConfig } from '@mindfiredigital/mdslide-cli';

export default defineConfig({
  theme: 'gradient',
  output: 'dist/presentation.html',
  watch: {
    port: 4200,
    open: true,
  },
  pdf: {
    printBackground: true,
  },
});
```

#### **Configuration Reference**

The configuration object passed to `defineConfig` supports the following properties:

| Property              | Type                        | Description                                                                                       |
| :-------------------- | :-------------------------- | :------------------------------------------------------------------------------------------------ |
| `theme`               | `string`                    | Default design theme for compilation (e.g. `'gradient'`, `'dark'`, `'notion'`).                   |
| `output`              | `string`                    | Default output filename or relative path (e.g. `'dist/deck.html'`).                               |
| `format`              | `'html' \| 'pdf' \| 'pptx'` | Default compilation export format.                                                                |
| `watch.port`          | `number`                    | Port for the live watch server (default: `3500`).                                                 |
| `watch.open`          | `boolean`                   | Automatically launch the web browser upon watch server startup (default: `true`).                 |
| `pdf.chromePath`      | `string`                    | Custom binary file path to the local Chrome/Chromium installation (for headless browser exports). |
| `pdf.printBackground` | `boolean`                   | Print CSS background colors/gradients during PDF export (default: `true`).                        |

---

## Contributing

If you are a developer looking to contribute to `mdslide`, please read our [Contributing Guide](CONTRIBUTING.md) to set up your local development environment and start building or test.

---

## License

Copyright (c) Mindfire Digital LLP. All rights reserved.

Licensed under the MIT license.
