export interface RenderDeckOptions {
  theme?: string;
  assetUrls?: Partial<AssetUrls>;
}

export interface AssetUrls {
  prismCssLight: string;
  prismCssDark: string;
  prismLineNumbersCss: string;
  katexCss: string;
  prismCoreJs: string;
  prismAutoloaderJs: string;
  prismLineNumbersJs: string;
  mermaidJs: string;
}

export interface ChartData {
  categories: string[];
  series: { name: string; values: number[] }[];
}

export interface StatEntry {
  label: string;
  value: string;
}
