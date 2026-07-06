---
sidebar_position: 4
---

# Configuration File (`mdslide.config.ts`)

Instead of specifying long command-line flags every time you build your presentation, you can configure project-wide compilation defaults in a configuration file named `mdslide.config.ts` in the root of your project directory.

## Scaffolding the Config File

You can automatically generate a pre-configured `mdslide.config.ts` file by running the initialization command:

```bash
mdslide init
```

---

## Configuration Example

Here is an example showing the TypeScript structure of the configuration file. It uses the `defineConfig` helper function to provide automatic IntelliSense completions inside your IDE:

```typescript
import { defineConfig } from '@mindfiredigital/mdslide-cli';

export default defineConfig({
  // Global design theme
  theme: 'gradient',

  // Default output location
  output: 'dist/presentation.html',

  // Live Watch Server configuration
  watch: {
    port: 4200,
    open: true,
  },

  // PDF Compilation configuration
  pdf: {
    printBackground: true,
  },
});
```

---

## Configuration Reference

The configuration object passed to `defineConfig` supports the following properties:

| Property                  | Type                        | Default             | Description                                                                                    |
| :------------------------ | :-------------------------- | :------------------ | :--------------------------------------------------------------------------------------------- |
| **`theme`**               | `string`                    | `'light'`           | Default design theme for compilation (e.g. `'gradient'`, `'dark'`, `'notion'`, `'solarized'`). |
| **`output`**              | `string`                    | `'output.<format>'` | Default output filename or relative file path (e.g. `'dist/deck.html'`).                       |
| **`format`**              | `'html' \| 'pdf' \| 'pptx'` | `'html'`            | Default compilation export format.                                                             |
| **`watch.port`**          | `number`                    | `3500`              | Port for the live watch preview server.                                                        |
| **`watch.open`**          | `boolean`                   | `true`              | Automatically launch the web browser when the watch server starts.                             |
| **`pdf.chromePath`**      | `string`                    | `undefined`         | Custom binary file path to the local Chrome/Chromium installation.                             |
| **`pdf.printBackground`** | `boolean`                   | `true`              | Prints CSS background colors/gradients during PDF export.                                      |
