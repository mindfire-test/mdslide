---
sidebar_position: 5
sidebar_label: 'mdslide validate'
---

# Validate & Lint (`mdslide validate`)

The `validate` command acts as a linter for your presentation slide deck. It scans your Markdown file, analyzes frontmatter syntax, parses layouts, and inspects content to warn you about potential issues before you export or present.

---

## Usage

```bash
mdslide validate <input-file> [options]
```

### Examples

```bash
# Validate slide file contents
mdslide validate slides.md

# Validate and fail compilation on warnings
mdslide validate slides.md --strict
```

---

## Options & Flags Reference

Below are the flags available for the `validate` command:

| Flag            | Type      | Default Value | Description                                                                                   |
| :-------------- | :-------- | :------------ | :-------------------------------------------------------------------------------------------- |
| **`--strict`**  | `boolean` | `false`       | Treat all lint warnings as hard errors, causing the command to exit with an error code (`1`). |
| **`--verbose`** | `boolean` | `false`       | Outputs detailed compiler check logs in the console.                                          |
| **`--silent`**  | `boolean` | `false`       | Suppresses all logging output.                                                                |

---

## What the Linter Checks

When you run `validate`, the compilation engine performs several static analysis steps on your presentation:

1. **Frontmatter Integrity**: Ensures global keys (like `theme`, `titleAlign`, etc.) have valid names and correct value formats.
2. **Comment Overrides**: Verifies slide-specific HTML comment annotations use valid syntax and correct values.
3. **Layout Compatibility**: Warns you if you are using incompatible features (e.g. attempting to split a title-layout slide).
4. **Visual Overflow Check**: Analyzes text lengths, code blocks, images, and list elements within each slide container. If slide content exceeds the standard dimensions, it flags a warning suggesting you enable the [Overflow Splitting Engine](../syntax-customizations/slide-annotations.md#supported-annotations).
