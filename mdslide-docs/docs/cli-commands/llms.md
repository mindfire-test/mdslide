---
sidebar_position: 8
sidebar_label: 'mdslide llms'
---

# Print the LLM Syntax Reference (`mdslide llms`)

The `llms` command prints the complete `SYNTAX.md` reference — the canonical, authoritative specification of mdslide's Markdown syntax, layouts, annotations, and CLI commands — as plain markdown to stdout. It's built for piping straight into an AI coding assistant's context window, or saving to a file for later reference.

---

## Usage

```bash
mdslide llms
```

### Examples

```bash
# Print the full syntax reference to the terminal
mdslide llms

# Save it to a file so an AI agent can read it as context
mdslide llms > SYNTAX.md
```

---

## Options & Flags Reference

`llms` takes no command-specific flags. Only the shared [Global Flags](./global-flags.md) are accepted, and in practice only `--timeout` has any real effect on this command — the output is a fixed, already-compiled markdown string, so `--json`, `--no-input`, `--yes`, and `--dry-run` are accepted (they won't be rejected) but change nothing about what gets printed.

| Flag                 | Type     | Default Value | Description                                                                                                  |
| :------------------- | :------- | :------------ | :----------------------------------------------------------------------------------------------------------- |
| **`--timeout <ms>`** | `number` | none          | Abort the command after `<ms>` milliseconds (exit code `124`). The only global flag with a real effect here. |

There is no `--json` mode for this command: the output is already plain, machine-readable markdown, so there is nothing additional a JSON envelope would add — `llms` always writes the same reference text to stdout regardless of flags passed.

---

## Why This Command Exists

Modern AI coding assistants write better mdslide decks when the exact syntax rules — layout auto-detection heuristics, comment annotation syntax, frontmatter keys, CLI flags, and error codes — are loaded directly into their context instead of guessed at or hallucinated from partial examples. `mdslide llms` exists to make that trivial:

1. **No network access required.** The reference is bundled into the CLI package itself at build time, so `mdslide llms` works completely offline and returns instantly — no fetching docs from a website.
2. **Always matches the installed version.** Because the text is bundled with the CLI binary, the syntax reference you get always matches the exact behavior of the `mdslide` version installed, rather than documentation that may have drifted from an older or newer release.
3. **Typical agent workflow**: run `mdslide llms > SYNTAX.md` once at the start of a session and add the resulting file to the AI assistant's context (or pipe it directly into a prompt). From then on, the agent knows the exact rules for slide separators, layouts (`title`, `bullets`, `split`, `code`, `quote`, `visual`, `table`, `statement`), comment annotations, admonitions, charts, image overrides, speaker notes, and every CLI command and flag — without needing to open a browser or read the Docusaurus site.
4. **Plain, undecorated output.** Unlike other commands, `llms` never applies ANSI colors or spinners — the output is always the raw markdown text, safe to redirect straight into a file or another tool.

If you're building an AI-agent-driven workflow around mdslide, running `mdslide llms > SYNTAX.md` and referencing that file is the fastest way to make sure the agent's understanding of the syntax stays current with the installed CLI.
