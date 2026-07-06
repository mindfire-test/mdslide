---
sidebar_position: 1
---

# Global Frontmatter Defaults

At the very top of your Markdown presentation file, you can specify global default configurations between triple-dash (`---`) boundaries. This block uses YAML syntax and configures default settings that apply to all slides unless overridden locally.

---

## Example Frontmatter

```yaml
---
title: Product Kickoff 2026
theme: gradient
titleAlign: center
titlePosition: top
animation: slide-up
overflow: split
---
```

---

## Inheritance & Local Overrides

Settings defined in the frontmatter act as the default fallback for all slides in the deck.

If you want to customize settings for a single, specific slide (e.g., center aligning the title of only your cover slide, or disabling animations on a busy slide), you can declare a **Slide-Specific Annotation** inside that slide using HTML comment syntax. The slide-level setting will override the global default for that slide only.

---

## Frontmatter Reference Table

Below is the list of configuration keys supported in the frontmatter:

| YAML Key                      | Type     | Allowed Values                                                              | Description                                                                           |
| :---------------------------- | :------- | :-------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| **`title`**                   | `string` | Any text                                                                    | The main title of your presentation (used in the metadata of the compiled HTML page). |
| **`theme`**                   | `string` | `light`, `dark`, `notion`, `terminal`, `gradient`, `corporate`, `solarized` | Overall aesthetic theme styling and color scheme.                                     |
| **`titleAlign`**              | `string` | `left`, `center`, `right`                                                   | Default horizontal alignment for slide titles.                                        |
| **`titlePosition`**           | `string` | `top`, `center`, `bottom`                                                   | Default vertical positioning for slide titles.                                        |
| **`animation`** / **`build`** | `string` | `fade`, `slide-up`, `slide-left`, `slide-right`, `zoom`                     | Default build-in transition style for list items and images.                          |
| **`overflow`**                | `string` | `split`, `none`                                                             | Default setting for the visual overflow slide-splitting engine.                       |
