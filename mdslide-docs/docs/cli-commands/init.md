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
```

---

## Options & Flags Reference

Below are the flags available for the `init` command:

| Flag           | Type      | Default Value | Description                                                                                           |
| :------------- | :-------- | :------------ | :---------------------------------------------------------------------------------------------------- |
| **`--force`**  | `boolean` | `false`       | Forcefully overwrites any existing `slides.md` or `mdslide.config.ts` files in the current directory. |
| **`--silent`** | `boolean` | `false`       | Suppresses all logging output.                                                                        |

---

## Scaffolding Details

Running `mdslide init` creates the following files in your current working directory:

1. **`slides.md`**: A comprehensive, annotated sample presentation. It contains examples of layouts, animations, split columns, math equations, code blocks, and slide annotations to serve as a reference template.
2. **`mdslide.config.ts`**: The TypeScript compilation configuration file, preloaded with default values.
