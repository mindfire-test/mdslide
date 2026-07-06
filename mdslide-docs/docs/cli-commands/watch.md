---
sidebar_position: 3
sidebar_label: 'mdslide watch'
---

# Live Watch Server (`mdslide watch`)

The `watch` command launches a local development server with a built-in live preview client. Whenever you save changes to your Markdown source file, the compiler automatically rebuilds the slides and reloads your browser instantly.

---

## Usage

```bash
mdslide watch <input-file> [options]
```

### Examples

```bash
# Start watch server (hosts on http://localhost:3500)
mdslide watch slides.md

# Start server on port 4000 and open the browser automatically
mdslide watch slides.md --port 4000 --open

# Override default theme settings during preview
mdslide watch slides.md --theme Notion
```

---

## Options & Flags Reference

Below is the list of flags available for the `watch` command:

| Flag                  | Short | Type      | Default Value    | Description                                                                                                          |
| :-------------------- | :---- | :-------- | :--------------- | :------------------------------------------------------------------------------------------------------------------- |
| **`--theme <theme>`** | `-t`  | `string`  | _Config default_ | Override theme style during preview: `light`, `dark`, `notion`, `terminal`, `gradient`, `corporate`, or `solarized`. |
| **`--port <port>`**   | `-p`  | `number`  | `3500`           | Port for the live-reload development server.                                                                         |
| **`--open`**          | -     | `boolean` | `false`          | Automatically launch the web browser and open the preview page on startup.                                           |
| **`--verbose`**       | -     | `boolean` | `false`          | Outputs detailed compiler and web socket logs in the console.                                                        |
| **`--silent`**        | -     | `boolean` | `false`          | Suppresses all logging output.                                                                                       |

---

## How It Works

1. **File Watcher**: `mdslide` uses a file watcher on the input Markdown file.
2. **Local Server**: Starts a lightweight HTTP server on the designated port (default `3500`).
3. **Websocket Sync**: Inserts a small live-reload script into the temporary HTML slide deck. This script maintains a WebSocket connection to the CLI watcher.
4. **Instant Reload**: Saving your Markdown file compiles the deck, saves the temporary build, and signals the active browser tab via WebSocket to refresh the slides immediately.
