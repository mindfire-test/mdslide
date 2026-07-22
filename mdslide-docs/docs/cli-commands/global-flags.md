---
sidebar_position: 0
sidebar_label: 'Global Flags'
---

# Global Flags

Every `mdslide` command — `compile`, `watch`, `init`, `validate`, `inspect`, `screenshot`, `llms`, and the interactive wizard — accepts the same five global flags, registered once for the whole CLI. They control machine-readability, prompting behavior, side effects, and timeouts, and are especially useful when driving `mdslide` from scripts, CI, or an AI coding agent.

---

## Usage

```bash
mdslide <command> <input> [options] [--json] [--no-input] [--yes] [--dry-run] [--timeout <ms>]
```

### Examples

```bash
# Get a machine-readable result instead of colored terminal output
mdslide compile slides.md --json

# Never prompt, and never write files - just prove the deck compiles
mdslide compile slides.md --no-input --dry-run

# Abort the command if it runs longer than 60 seconds
mdslide compile slides.md --timeout 60000
```

---

## Options & Flags Reference

Below are the flags available on every `mdslide` command:

| Flag                 | Type      | Default Value | Description                                                                                                                                              |
| :------------------- | :-------- | :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`--json`**         | `boolean` | `false`       | Prints one machine-readable JSON object to stdout instead of human-formatted logs. Human logs are silenced; exit codes are unchanged.                    |
| **`--no-input`**     | `boolean` | `false`       | Never prompts. Skips the interactive wizard everywhere and uses defaults plus whatever flags were explicitly passed.                                     |
| **`--yes`**          | `boolean` | `false`       | Auto-accepts every interactive prompt with its default answer, so the wizard can run hands-free.                                                         |
| **`--dry-run`**      | `boolean` | `false`       | Runs the full compile/validation pipeline, but writes nothing to disk, opens nothing, and starts no server.                                              |
| **`--timeout <ms>`** | `number`  | none          | Aborts the whole command after `<ms>` milliseconds with exit code `124`. An invalid (non-positive or non-numeric) value exits immediately with code `1`. |

---

## Stdin / Stdout Piping

`mdslide` supports the conventional `-` placeholder for streaming Markdown in or HTML out, so a deck never has to touch disk when it doesn't need to:

- **Stdin** (`-` as `<input>`): supported by [`compile`](./compile.md), [`validate`](./validate.md), [`inspect`](./inspect.md), and [`screenshot`](./screenshot.md). Each of these reads the Markdown source from stdin instead of a file path.
- **`watch` does not accept stdin.** It needs a real file on disk to hand to its filesystem watcher, so it always rejects `-` with `ERR_STDIN_UNSUPPORTED`.
- **Stdout** (`-o -` / `--output -`): supported by `compile` only, and only for the `html` format. The compiled HTML is streamed directly to stdout instead of being written to a file.
  - `pdf` and `pptx` formats reject `-o -` with `ERR_STDOUT_OUTPUT`, since both need a real file target (Chrome's PDF writer / the PPTX writer can't stream to a pipe).
  - Combining `-o -` with `--json` is also rejected with `ERR_STDOUT_OUTPUT`, since both want to own stdout and interleaving a JSON envelope with raw HTML would corrupt both.

```bash
# Read Markdown from stdin, stream compiled HTML to stdout
cat slides.md | mdslide compile - -o - -f html > deck.html
```

---

## Error Codes

Most errors `mdslide` throws carry a stable `code` string, present both in the `--json` error shape (`{ "success": false, "error": "...", "code": "ERR_*", "hint": "..." }`) and next to the human-readable message. Scripts and agents should match on `code`, not on the message text, which may be reworded between versions. A handful of failure paths (see the `ERR_CHROME_NOT_FOUND` row below) currently throw a plain error with no `code` attached — the field is simply omitted from the JSON output in those cases, so fall back to matching on `error` text there.

| Code                         | Fires when...                                                                                                                                                                                                                                                                                                                                                          |
| :--------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ERR_INPUT_NOT_FOUND`**    | The `<input>` file path does not exist on disk.                                                                                                                                                                                                                                                                                                                        |
| **`ERR_INVALID_FORMAT`**     | `--format`/`-f` on `compile` was not one of `html`, `pdf`, `pptx`.                                                                                                                                                                                                                                                                                                     |
| **`ERR_CHROME_NOT_FOUND`**   | Documented for a PDF export, `--pptx-mode screenshot`, or `screenshot` needing Chrome/Chromium when none was found locally. As of this writing, those code paths actually throw a plain error with no `code` field set (a pre-existing wiring gap, not something this doc introduced) — the command still fails with a clear message, just without a matchable `code`. |
| **`ERR_PORT_IN_USE`**        | Every port in the scan range starting at `watch`'s requested `--port` is already busy.                                                                                                                                                                                                                                                                                 |
| **`ERR_COMPILE`**            | The Markdown failed to compile - a parser or renderer error.                                                                                                                                                                                                                                                                                                           |
| **`ERR_STDOUT_OUTPUT`**      | An unsupported stdout-piping combination was requested (non-`html` format with `-o -`, or `-o -` combined with `--json`).                                                                                                                                                                                                                                              |
| **`ERR_STDIN_UNSUPPORTED`**  | Stdin (`-`) was used somewhere it can't work - `watch` (no file to watch) or `validate --fix` (no file to write the fix back to).                                                                                                                                                                                                                                      |
| **`ERR_VALIDATION_FAILED`**  | `validate` found errors, or found warnings while `--strict` was passed.                                                                                                                                                                                                                                                                                                |
| **`ERR_INVALID_TIMEOUT`**    | `--timeout` was not a positive number of milliseconds. Exits immediately with code `1`.                                                                                                                                                                                                                                                                                |
| **`ERR_TIMEOUT`**            | The command ran longer than `--timeout` allowed. Exits with code `124`.                                                                                                                                                                                                                                                                                                |
| **`ERR_INVALID_ASSET_URLS`** | `--asset-urls` on `compile` was not valid JSON, or was valid JSON that wasn't a plain object of string values.                                                                                                                                                                                                                                                         |

---

## Recommended for AI Agents

For unattended/CI/agent use, combine `--no-input`, `--json`, and `--timeout` so the command never blocks on a prompt, always emits a parseable result, and always terminates:

```bash
mdslide compile slides.md --no-input --json --timeout 60000
```
