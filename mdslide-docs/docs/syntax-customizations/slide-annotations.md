---
sidebar_position: 2
---

# Slide Separators & Local Annotations

You can structure your presentation and apply fine-grained overrides to individual slides using simple Markdown separators and HTML comment annotations.

---

## 1. Dividing Your Slides

`mdslide` offers three ways to split your Markdown file into separate slides:

### Explicit Dividers (Recommended)

Place three dashes (`---`) on an empty line to start a new slide:

```markdown
# Slide One Content

Some text here.

---

# Slide Two Content

More text here.
```

### The `<!-- slide -->` Marker (Recommended for AI Agents)

Place `<!-- slide -->` on its own line, with a blank line before and after it, to always start a new slide:

```markdown
# Slide One Content

Some text here.

<!-- slide -->

# Slide Two Content

More text here.
```

Unlike `---` or the `##` auto-separation heuristic below, `<!-- slide -->` always starts a new slide regardless of the heading structure elsewhere in the document — its meaning never depends on document context. This makes it the safest choice for AI agents (or scripts) generating one slide at a time, since it can't be accidentally affected by how many headings a neighboring slide happens to contain.

### Auto-Separation

If you do not write any three-dash (`---`) dividers or `<!-- slide -->` markers, the compiler automatically starts a new slide at every **Level-2 Heading (`##`)**. This is useful for rapidly converting existing text notes into a slide presentation.

### Mixing Methods

`---`, `<!-- slide -->`, and `##` can all be used in the same file. Either explicit form (`---` or `<!-- slide -->`) always takes precedence over the `##` auto-separation heuristic wherever it appears in the document — so once a file contains any explicit divider, `##` headings stop starting new slides on their own and are only used for slide splitting where an explicit divider says so.

---

## 2. Slide-Level Comment Annotations

You can customize slide layouts, title positioning, animations, and backgrounds on a per-slide basis. Add these overrides inside standard HTML comment blocks at the top of the slide:

```markdown
# Target Metrics

<!-- titleAlign: center -->
<!-- animation: zoom -->

- Metric A
- Metric B
```

### Supported Annotations

| Comment Annotation                    | Allowed Values                                                                          | Description                                                                |
| :------------------------------------ | :-------------------------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| **`<!-- layout: value -->`**          | `title`, `bullets`, `content`, `code`, `visual`, `quote`, `table`, `statement`, `split` | Force a specific content layout style for the current slide.               |
| **`<!-- titleAlign: value -->`**      | `left`, `center`, `right`                                                               | Horizontal title text alignment for this slide.                            |
| **`<!-- titlePosition: value -->`**   | `top`, `center`, `bottom`                                                               | Vertical title text placement for this slide.                              |
| **`<!-- align: value -->`**           | `top`, `center`, `bottom`                                                               | Vertical packing of the body content only, independent of `titlePosition`. |
| **`<!-- columns: N ratio:a:b:c -->`** | `N` = column count; `ratio` optional                                                    | Declares the expected column count/widths for an `::col::` split.          |
| **`<!-- animation: value -->`**       | `fade`, `slide-up`, `slide-left`, `slide-right`, `zoom`                                 | Specify an element transition animation for this slide.                    |
| **`<!-- fontSize: value -->`**        | `xs`, `sm`, `md`, `lg`, `xl`, `xxl`                                                     | Typography scale override for this slide only.                             |
| **`<!-- overflow: value -->`**        | `split`, `none`                                                                         | Override global slide-splitting for this slide.                            |
| **`<!-- imageFit: value -->`**        | `contain`, `cover`                                                                      | Override `object-fit` for every image/video on this slide.                 |
| **`<!-- imagePosition: value -->`**   | `left`, `right`                                                                         | Which side the image sits on in the auto-detected image+text split layout. |
| **`<!-- accentColor: value -->`**     | Any CSS color (hex, `rgb()`/`hsl()`, or a keyword)                                      | Override the theme's accent color for this slide only.                     |

### Body Alignment vs. Title Position

`<!-- align: value -->` and `<!-- titlePosition: value -->` both accept `top`, `center`, or `bottom`, but they control different things:

- **`titlePosition`** moves the **title and its content together as a group** — the whole block shifts as one unit.
- **`align`** only controls how the **body content** packs within its own space, leaving the title exactly where it is.

This matters most on a short slide, where the body would otherwise sit glued to the top right below the title instead of settling into the remaining space:

```markdown
# One Thing to Remember

<!-- align: center -->

Ship small, ship often.
```

Without `<!-- align: center -->`, the single line above would render directly under the title. With it, the title stays put and the line centers in the space beneath it.

### N-Column Splits (`columns`)

`<!-- columns: N ratio:a:b:c -->` declares the expected column count (and optional relative widths) for a `::col::` split. It's covered in full — including the worked example and the per-column layout override — in [N-Column Splits (`::col::`)](./layouts.md#3-n-column-splits-col):

```markdown
<!-- columns: 3 ratio:2:1:1 -->
```

### Per-Slide Font Size (`fontSize`)

`<!-- fontSize: value -->` overrides the typography scale for just this slide:

```markdown
# A Nearly Empty Slide

<!-- fontSize: xl -->

Bigger text fills the space better here.
```

`fontSize` also exists as a global frontmatter key that sets the default for every slide in the deck — see [Global Frontmatter Defaults](./frontmatter.md). The slide-level annotation always wins over the frontmatter default for that slide.

### Image Fit & Position (`imageFit`, `imagePosition`)

`<!-- imageFit: value -->` overrides how every image/video on the slide is scaled within its box:

```markdown
<!-- imageFit: cover -->

![Wide banner](banner.jpg)
```

`<!-- imagePosition: value -->` controls which side an **auto-detected** single-image-plus-text split layout puts the image on. The default is `right` (text left, image right):

```markdown
<!-- imagePosition: left -->

The product does X, Y, and Z, and here's what it looks like in action.

![Screenshot](screenshot.png)
```

Manual `::split::`/`::col::` layouts and the centered `visual` layout are unaffected by `imagePosition` — you already control column order via source order in those.

### Per-Slide Accent Color (`accentColor`)

`<!-- accentColor: value -->` overrides the theme's accent color (list markers, links, borders, chart palette, etc.) for just this one slide:

```markdown
<!-- accentColor: #f43f5e -->

- This slide gets its own rose accent color
- Every other slide keeps the deck's theme color
```

Any CSS color is accepted — hex, `rgb()`/`hsl()`, or a keyword — and the HTML, screenshot, and PDF export paths all honor it in full.

:::caution
The editable-PPTX export only supports **plain hex colors** for `accentColor`. This is a `pptxgenjs` limitation, not a bug: `rgb()`/`hsl()` values and named CSS colors (e.g. `rebeccapurple`) silently fail to change anything in the exported `.pptx` file, even though they work correctly everywhere else. Stick to hex (e.g. `#f43f5e`) if the editable-PPTX export matters to you.
:::

---

## 3. Background Images

Set a full-bleed background image for a specific slide:

```markdown
# Skyrocket Sales

<!-- backgroundImage: url('https://example.com/growth.jpg') -->
```

### Image Contrast Auto-Detection & Luminance

`mdslide` includes an intelligent **luminance detection engine**. When a slide loads, it reads the background image pixels:

- If the image is **dark**, the slide theme automatically inverts text colors to light white to maintain high contrast.
- If the image is **light**, the text remains dark and gains subtle drop shadows for legibility.

### Manual Overrides

If you want to manually force a text contrast theme, you can append `dark` or `light` inside the comment declaration:

```markdown
<!-- backgroundImage: url('dark-forest.jpg') dark -->
<!-- backgroundImage: url('snowy-mountain.jpg') light -->
```

---

## 4. Presenter Speaker Notes

Add speaker notes that sync with the **Presenter View (`P`)** window. Presenter notes are invisible in the main presentation tab, but show up on your control monitor along with a slide timer:

```markdown
# Q3 Financial Summary

- Revenue up 15%
- Net profit up 8%

<!-- notes -->

Make sure to emphasize that the profit increase was driven by our new licensing model. Be prepared for questions on marketing costs!

<!-- /notes -->
```
