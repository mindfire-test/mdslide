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

# Auto-repair mechanical issues in place, then report
mdslide validate slides.md --fix

# Machine-readable report
mdslide validate slides.md --json

# Read from stdin (not combinable with --fix)
cat slides.md | mdslide validate - --json
```

---

## Options & Flags Reference

Below are the flags available for the `validate` command:

| Flag            | Type      | Default Value | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| :-------------- | :-------- | :------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`--strict`**  | `boolean` | `false`       | Treat all lint warnings as hard errors, causing the command to exit with an error code (`1`).                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **`--fix`**     | `boolean` | `false`       | Auto-repairs mechanical, unambiguous issues in place before reporting: an unclosed code fence or notes block is closed, and a stray closing `<!-- /notes -->` tag with no matching open is removed. The file is only rewritten if something actually changed. Issues that need judgment (invalid layout override values, nested notes, multiple layout overrides per slide/column) are left untouched and still reported. Not combinable with stdin (`-` input) — there is no file to write the fix back to, so it exits with `ERR_STDIN_UNSUPPORTED`. |
| **`--json`**    | `boolean` | `false`       | Prints a single JSON object to stdout instead of the human-formatted report (exit codes are unchanged). See shape below.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **`--verbose`** | `boolean` | `false`       | Outputs detailed compiler check logs in the console.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **`--silent`**  | `boolean` | `false`       | Suppresses all logging output.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

This command also accepts the [global flags](./global-flags.md) (`--json`, `--no-input`, `--yes`, `--dry-run`, `--timeout`).

`<input-file>` also accepts `-` to read the Markdown from stdin (as shown above); this cannot be combined with `--fix`.

---

## What the Linter Checks

When you run `validate`, it performs several static analysis steps on your presentation:

1. **Frontmatter Integrity**: Ensures global keys (like `theme`, `titleAlign`, etc.) have valid names and correct value formats.
2. **Comment Overrides**: Verifies slide-specific HTML comment annotations use valid syntax and correct values, including per-column `<!-- layout: -->` overrides, `> [!KIND]` admonition markers, `<!-- chart: bar|line|pie -->` directives, and `<!-- imageFit: -->` / `<!-- imagePosition: -->` / `<!-- accentColor: -->` values.
3. **Layout Compatibility**: Warns you if you are using incompatible features (e.g. attempting to split a title-layout slide, or multiple per-column layout overrides in the same column).
4. **Visual Overflow Check**: Estimates rendered content height for each slide using the same per-node height model the compiler's auto-split engine uses (not a line-count guess). If slide content exceeds the standard dimensions, it flags a warning suggesting you enable the [Overflow Splitting Engine](../syntax-customizations/slide-annotations.md#supported-annotations).

Every reported issue includes a `slide` number and, when it can be located precisely in the source, a 1-based `line` field pointing at the exact source line. Issues that `--fix` is able to repair automatically also carry `"fixable": true` (omitted otherwise).

### JSON Output (`--json`)

````json
{
  "file": "/abs/path/slides.md",
  "valid": false,
  "slides": 3,
  "errors": 1,
  "warnings": 1,
  "issues": [
    {
      "type": "error",
      "slide": 3,
      "line": 42,
      "message": "Unclosed code fence (```).",
      "hint": "Make sure every opening ``` has a matching closing ```.",
      "fixable": true
    }
  ]
}
````

When `--fix` is also passed, a `fixed` array of human-readable descriptions of each applied repair is added to the object (present only when `--fix` was used).

### Output Encoding

All CLI output is plain text without ANSI color codes whenever stdout is not a TTY (piped/captured) or the `NO_COLOR` environment variable is set, so captured output never needs escape-code stripping. Set `FORCE_COLOR=1` to override.
