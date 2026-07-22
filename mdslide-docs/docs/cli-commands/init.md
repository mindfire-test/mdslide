---
sidebar_position: 4
sidebar_label: 'mdslide init'
---

# Initialize Project (`mdslide init`)

The `init` command bootstraps a brand new presentation in the current directory, generating a starter Markdown slide deck and a default configuration file.

---

## Usage

```bash
mdslide init [options]
```

### Examples

```bash
# Bootstrap files in the current folder
mdslide init

# Bootstrap and force overwrite existing files
mdslide init --force

# Preview what would be created, without writing anything
mdslide init --dry-run --json
```

---

## Options & Flags Reference

Below are the flags available for the `init` command:

| Flag            | Type      | Default Value | Description                                                                                                                                                                                                                                                              |
| :-------------- | :-------- | :------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`--force`**   | `boolean` | `false`       | Forcefully overwrites any existing `slides.md` or `mdslide.config.ts` files in the current directory. This behavior is unchanged by `--dry-run`: with both flags set, `init` reports what it _would_ overwrite instead of overwriting it.                                |
| **`--dry-run`** | `boolean` | `false`       | Reports what would be created or skipped without writing any files (or adding `package.json` scripts). Human-mode output prints lines like `[dry-run] would create slides.md` / `[dry-run] would add "dev" and "build" scripts to package.json` for each pending action. |
| **`--silent`**  | `boolean` | `false`       | Suppresses all logging output.                                                                                                                                                                                                                                           |

This command also accepts the [global flags](./global-flags.md) (`--json`, `--no-input`, `--yes`, `--dry-run`, `--timeout`); `--dry-run` has init-specific behavior described above, and `--json` has the shape below.

### JSON Output (`--json`)

```json
{
  "success": true,
  "dryRun": false,
  "created": ["slides.md", "mdslide.config.ts"],
  "skipped": [],
  "scriptsAdded": true
}
```

`created`/`skipped` list the scaffolded file names (not full paths); `scriptsAdded` is `true` only when a `package.json` in the current directory existed and didn't already define a `dev` script (a `dev`/`build` script pair is then added). All fields reflect what _would_ happen when `dryRun` is `true` — no files are actually written in that case.

---

## Scaffolding Details

Running `mdslide init` creates the following files in your current working directory:

1. **`slides.md`**: A comprehensive, annotated sample presentation. It contains examples of layouts, animations, split columns, math equations, code blocks, and slide annotations to serve as a reference template.
2. **`mdslide.config.ts`**: The TypeScript compilation configuration file, preloaded with default values.
