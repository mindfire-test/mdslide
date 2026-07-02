---
sidebar_position: 5
---

# Typography, Colors & CSS Overrides

Because `mdslide` compiles your presentation into standard, semantic HTML pages, you can easily customize the typography, color themes, spacing, and borders of your slide decks using standard CSS variables inside a `<style>` block in your Markdown file.

---

## Example Override

Simply declare your overrides inside a `:root` selector at the bottom of your Markdown file:

```html
<style>
  /* Import Google Fonts */
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&family=Fira+Code&display=swap');

  :root {
    /* Font family overrides */
    --slide-font: 'Outfit', sans-serif;
    --slide-mono: 'Fira Code', monospace;

    /* Theme colors */
    --slide-bg: #0f172a; /* Deep slate background */
    --slide-text: #f8fafc; /* Off-white text */
    --slide-accent: #f43f5e; /* Rose accent highlight */

    /* Global border radius */
    --slide-radius: 10px;
  }
</style>
```

---

## CSS Variables Reference

Below is the list of custom CSS variables you can override to adjust your slides' styling:

### 1. Typography

| CSS Variable       | Default Value          | Description                                                  |
| :----------------- | :--------------------- | :----------------------------------------------------------- |
| **`--slide-font`** | _System UI Sans-Serif_ | Main font family for headings, lists, paragraphs, and cards. |
| **`--slide-mono`** | _System UI Monospace_  | Font family for code blocks and inline code tags.            |
| **`--title-size`** | `3.6rem`               | Font size for primary slide titles.                          |
| **`--h2-size`**    | `2.6rem`               | Font size for secondary headings.                            |
| **`--h3-size`**    | `1.8rem`               | Font size for tertiary headings.                             |
| **`--body-size`**  | `1.35rem`              | Font size for standard paragraph text.                       |
| **`--li-size`**    | `1.3rem`               | Font size for list bullet items.                             |
| **`--code-size`**  | `1.1rem`               | Font size inside code blocks.                                |

### 2. Colors

| CSS Variable          | Category         | Description                                                       |
| :-------------------- | :--------------- | :---------------------------------------------------------------- |
| **`--slide-bg`**      | Slide Background | Slide background color.                                           |
| **`--slide-surface`** | Block Background | Background color for quote boxes, code blocks, and card surfaces. |
| **`--slide-text`**    | Typography Color | Main body text and heading color.                                 |
| **`--slide-muted`**   | Typography Color | Color for secondary footnotes, captions, and muted elements.      |
| **`--slide-accent`**  | Brand/Highlights | Accent color for link underlines, bullet markers, and borders.    |
| **`--slide-border`**  | Boundaries       | Color for divider lines and card borders.                         |

### 3. Styling & Radii

| CSS Variable         | Default Value | Description                                                        |
| :------------------- | :------------ | :----------------------------------------------------------------- |
| **`--slide-radius`** | `6px`         | Border-radius styling for card boxes, code containers, and images. |
