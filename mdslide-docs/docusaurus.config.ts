import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

const config: Config = {
  title: 'mdslide',
  tagline: 'Markdown to HTML/PDF/PPTX Presentation Slide Compiler',
  favicon: 'img/logo.ico',

  future: {
    v4: true,
  },

  url: 'https://mindfiredigital.github.io',
  baseUrl: '/mdslide/',

  organizationName: 'mindfiredigital',
  projectName: 'mdslide',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/mindfiredigital/mdslide/tree/main/mdslide-docs/',
        },
        blog: false, // Disabling blog since mdslide is a technical utility
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'mdslide',
      logo: {
        alt: 'mdslide Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/contributors',
          label: 'Contributors',
          position: 'left',
        },
        {
          to: '/releases',
          label: 'Releases',
          position: 'left',
        },
        {
          href: 'https://github.com/mindfiredigital/mdslide',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Contributors',
              to: '/contributors',
            },
            {
              label: 'GitHub Issues',
              href: 'https://github.com/mindfiredigital/mdslide/issues',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Releases',
              to: '/releases',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/mindfiredigital/mdslide',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Mindfire Digital. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
  plugins: [
    async function tailwindPlugin() {
      return {
        name: 'tailwind-plugin',
        configurePostCss(postcssOptions) {
          postcssOptions.plugins.push(tailwindcss);
          postcssOptions.plugins.push(autoprefixer);
          return postcssOptions;
        },
      };
    },
  ],
};

export default config;
