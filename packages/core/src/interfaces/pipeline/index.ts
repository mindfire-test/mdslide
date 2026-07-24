import type { Slide } from '@mindfiredigital/mdslide-shared';
import { AssetUrls } from '../renderer/html/index.js';

export interface CompileOptions {
  theme?: string;
  assetUrls?: Partial<AssetUrls>;
}

export interface CompileResult {
  meta: Record<string, unknown>;
  slides: Slide[];
  html: string;
  warnings: string[];
}
