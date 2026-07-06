# mdslide

`mdslide` is a modular, high-performance compiler and presentation tool that converts Markdown documents into gorgeous interactive slide decks in HTML, PDF, or PowerPoint (PPTX) formats.

---

## Installation

Install the CLI globally using your preferred package manager:

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
- **Validate & Lint Layouts**: Scan your presentation for warnings or slide content overflows.
  ```bash
  mdslide validate slides.md
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

### 1. Settings Inheritance & Overrides

Settings can be defined both globally and locally:

- **Global Defaults**: Defined at the very top of your presentation file using YAML frontmatter. These settings apply to all slides.
- **Slide-Specific Overrides**: Declared inside individual slides using HTML comment annotations. When a slide-specific setting is present, it **overrides the global default** for that slide only.

#### **Settings Reference Table**

| Property / Feature     | Frontmatter Key (Global) | Comment Override (Slide-Specific)                     | Allowed Values                                                              | Description                                                    |
| :--------------------- | :----------------------- | :---------------------------------------------------- | :-------------------------------------------------------------------------- | :------------------------------------------------------------- |
| **Theme**              | `theme`                  | _N/A (Global only)_                                   | `light`, `dark`, `notion`, `terminal`, `gradient`, `corporate`, `solarized` | Overall aesthetic theme styling and color scheme.              |
| **Title Alignment**    | `titleAlign`             | `<!-- titleAlign: value -->`                          | `left`, `center`, `right`                                                   | Horizontal alignment for the slide title.                      |
| **Title Position**     | `titlePosition`          | `<!-- titlePosition: value -->`                       | `top`, `center`, `bottom`                                                   | Vertical positioning for the slide title.                      |
| **Bullet Animation**   | `animation` / `build`    | `<!-- animation: value -->` / `<!-- build: value -->` | `fade`, `slide-up`, `slide-left`, `slide-right`, `zoom`                     | Step-by-step reveal animation for list items and images.       |
| **Overflow Splitting** | `overflow`               | `<!-- overflow: value -->`                            | `split`, `none`                                                             | Enables or disables the visual overflow auto-splitting engine. |

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

- **Explicit Dividers**: Slides are separated by three dashes (`---`) on empty lines.
- **Auto-Separation**: If no dividers are present, the compiler automatically starts a new slide at each Level-2 Heading (`##`).

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

### Two-Column Split Layouts (`::split::`)

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

If you are a developer looking to contribute to `mdslide`, please read our [Contributing Guide](CONTRIBUTING.md) to set up your local development environment and start building or testing.

---

## License

Copyright (c) Mindfire Digital LLP. All rights reserved.

Licensed under the MIT license.
