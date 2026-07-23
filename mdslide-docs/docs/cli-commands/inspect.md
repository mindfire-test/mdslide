---
sidebar_position: 6
sidebar_label: 'mdslide inspect'
---

# Inspect Slide Structure (`mdslide inspect`)

The `inspect` command compiles your presentation and reports detailed, per-slide diagnostics — resolved layout, estimated content height, element counts, and detected components — without rendering, writing, or opening anything. It's the fastest way to confirm the compiler did what you intended before spending a full `compile`/render cycle.

---

## Usage

```bash
mdslide inspect <input> [options]
```

### Examples

```bash
# Print a readable per-slide report
mdslide inspect slides.md

# Get the same report as machine-readable JSON
mdslide inspect slides.md --json

# Inspect Markdown piped in from stdin
cat slides.md | mdslide inspect -
```

---

## Options & Flags Reference

`inspect` has no command-specific flags of its own — only the flags shared by every `mdslide` command apply. See the [Global Flags](./global-flags.md) reference for the full list (`--json`, `--no-input`, `--yes`, `--dry-run`, `--timeout`).

| Flag                 | Type      | Default Value | Description                                                                        |
| :------------------- | :-------- | :------------ | :--------------------------------------------------------------------------------- |
| **`--json`**         | `boolean` | `false`       | Print the report as a single JSON object instead of a human-readable listing.      |
| **`--no-input`**     | `boolean` | `false`       | Global flag; has no additional effect on `inspect` since it never prompts.         |
| **`--yes`**          | `boolean` | `false`       | Global flag; has no additional effect on `inspect` since it never prompts.         |
| **`--dry-run`**      | `boolean` | `false`       | Global flag; has no additional effect on `inspect` since it never writes anything. |
| **`--timeout <ms>`** | `number`  | none          | Abort the command after `<ms>` milliseconds (exit code `124`).                     |

`inspect` accepts `-` as `<input>` to read Markdown from stdin instead of a file path.

---

## The JSON Report Shape

Running `mdslide inspect slides.md --json` prints one object:

```json
{
  "file": "/abs/path/slides.md",
  "slides": 2,
  "meta": { "theme": "gradient" },
  "warnings": [],
  "deck": [
    {
      "index": 1,
      "id": "…",
      "title": "Agenda",
      "layout": "bullets",
      "layoutSource": "auto",
      "layoutReason": "Auto-detected. Contains a list, so it uses the bulleted-summary layout.",
      "elementCounts": { "list": 1, "listItem": 3, "paragraph": 3, "text": 3 },
      "contentHeightPx": 135,
      "maxHeightPx": 650,
      "overflowing": false,
      "hasNotes": false
    }
  ]
}
```

For a `split` slide, each entry also carries a `columns` array (one `{ "layout": "..." }` per column, in the column's document order) reflecting each column's own resolved layout, including any per-column `<!-- layout: -->` override. A slide containing an admonition and/or a chart table also carries `admonitions`/`charts` arrays (the kinds found, in document order — e.g. `["tip", "warning"]` or `["bar"]`), omitted entirely when the slide has neither. A slide with an `imageFit`, `imagePosition`, or `accentColor` override reports that value under the matching field name, and a slide containing a `.mp4`/`.webm` video reports `"hasVideo": true`. All of these fields are omitted when not applicable — they never appear as `null` or `false`.

Without `--json`, the same information prints as a readable per-slide report to the terminal, including any compiler `warnings` at the end.

---

## What Each Report Field Means

1. **`layout` / `layoutSource` / `layoutReason`** — the slide's final resolved layout (`title`, `bullets`, `code`, `quote`, `visual`, `table`, `split`, `statement`, or the default flowing layout), whether it came from an explicit `<!-- layout: ... -->` [comment override](../syntax-customizations/slide-annotations.md#supported-annotations) or from auto-detection, and a plain-English reason. This is the field to check first if a slide didn't render with the layout you expected — for example, an explicit override on a slide that also matches the `split` auto-detection rules (a `::split::`/`::col::` marker, or a single image alongside text) is silently superseded, and `layoutReason` says so explicitly.
2. **`elementCounts`** — a count of every content-node type found in the slide (`paragraph`, `list`, `listItem`, `image`, `codeBlock`, `table`, etc.), useful for confirming a slide contains what you meant it to (e.g. verifying a code block actually parsed as `codeBlock` rather than plain text).
3. **`contentHeightPx` / `maxHeightPx` / `overflowing`** — the estimated rendered height of the slide's content versus the visible slide budget, using the same per-node height model the compiler's [overflow-splitting engine](../syntax-customizations/slide-annotations.md#supported-annotations) uses (not a line-count guess). `overflowing: true` means the slide's content exceeds the budget and would visually spill over unless split. Check this before running a full `compile` to catch overflow issues early.
4. **`hasNotes`** — whether the slide has an attached [speaker notes](../syntax-customizations/slide-annotations.md#4-presenter-speaker-notes) block.
5. **`columns`** — present only on `split`-layout slides: the resolved layout of each column, in order, reflecting per-column overrides.
6. **`admonitions` / `charts`** — the kinds of callout boxes and chart tables detected in the slide's content, in document order, so you can confirm the compiler recognized a `> [!TIP]` block or a `<!-- chart: bar -->` table the way you intended.
7. **`imageFit` / `imagePosition` / `accentColor`** — the resolved value of each per-slide image/accent override, when present.
8. **`hasVideo`** — `true` when the slide embeds a `.mp4`/`.webm` video URL.

Because `inspect` never renders HTML or launches a browser, it's the cheapest way for a developer or an AI agent to sanity-check layout detection and overflow risk across an entire deck before committing to a full `compile` or [`screenshot`](./screenshot.md) pass.
