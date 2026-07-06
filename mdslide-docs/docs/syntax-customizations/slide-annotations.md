---
sidebar_position: 2
---

# Slide Separators & Local Annotations

You can structure your presentation and apply fine-grained overrides to individual slides using simple Markdown separators and HTML comment annotations.

---

## 1. Dividing Your Slides

`mdslide` offers two ways to split your Markdown file into separate slides:

### Explicit Dividers (Recommended)

Place three dashes (`---`) on an empty line to start a new slide:

```markdown
# Slide One Content

Some text here.

---

# Slide Two Content

More text here.
```

### Auto-Separation

If you do not write any three-dash (`---`) dividers, the compiler automatically starts a new slide at every **Level-2 Heading (`##`)**. This is useful for rapidly converting existing text notes into a slide presentation.

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

| Comment Annotation                  | Allowed Values                                                               | Description                                                  |
| :---------------------------------- | :--------------------------------------------------------------------------- | :----------------------------------------------------------- |
| **`<!-- layout: value -->`**        | `title`, `bullets`, `code`, `visual`, `quote`, `table`, `statement`, `split` | Force a specific content layout style for the current slide. |
| **`<!-- titleAlign: value -->`**    | `left`, `center`, `right`                                                    | Horizontal title text alignment for this slide.              |
| **`<!-- titlePosition: value -->`** | `top`, `center`, `bottom`                                                    | Vertical title text placement for this slide.                |
| **`<!-- animation: value -->`**     | `fade`, `slide-up`, `slide-left`, `slide-right`, `zoom`                      | Specify an element transition animation for this slide.      |
| **`<!-- overflow: value -->`**      | `split`, `none`                                                              | Override global slide-splitting for this slide.              |

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
