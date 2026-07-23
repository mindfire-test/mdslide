import { defineConfig } from 'tsup';
import { baseConfig } from '../../tsup.config.base.js'; // Adjust path to root

export default defineConfig({
  ...baseConfig,
  entry: ['src/cli.ts', 'src/index.ts'],
  splitting: true,
  dts: true,
  loader: { '.md': 'text' },
});
