---
sidebar_position: 1
---

# Interactive Wizard

`mdslide` features an interactive, CLI-guided wizard designed to help you quickly build, configure, and preview your presentations without memorizing syntax or command-line flags.

The wizard asks a series of simple questions (e.g. choosing your theme, selecting the export format, deciding whether to launch a watch server) and then compiles or serves the presentation based on your choices.

---

## Running the Wizard

You can launch the interactive wizard in three different ways:

### 1. Default Command (Recommended)

If you run `mdslide` with only the input presentation file and no flags, it launches the wizard automatically:

```bash
mdslide slides.md
```

### 2. Explicit Interactive Option

Specify the `-i` or `--interactive` flag on the default command or on `compile`:

```bash
mdslide slides.md -i
# or
mdslide compile slides.md -i
```

### 3. Explicit Interactive Command

Run the dedicated `interactive` subcommand:

```bash
mdslide interactive slides.md
```

---

## Interactive Wizard Steps

When you launch the wizard, you will be guided through the following prompt options in your terminal:

```
? Choose slide theme (Use arrow keys)
❯ gradient
  light
  dark
  notion
  terminal
  corporate
  solarized
```

### Prompt Questionnaire flow:

1. **Choose Slide Theme**: Select from the built-in themes.
2. **Choose Output Format**: Choose the export format:
   - `html` (Interactive web deck)
   - `pdf` (Headless browser printed page)
   - `pptx` (PowerPoint presentation)
3. **Specify Output File**: Enter a file path or accept the auto-detected path (e.g., `output.html`).
4. **Choose Action Mode**:
   - `Compile only` (Build static presentation files immediately)
   - `Watch and preview` (Launch live hot-reloading dev server)
5. **Auto-Open Web Browser**: Decide if the browser should open automatically after compiling or starting watch mode.
