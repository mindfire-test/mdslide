---
sidebar_position: 1
---

# Introduction & Getting Started

`mdslide` is a modular, high-performance compiler and presentation tool that converts standard Markdown files into stunning, interactive slide decks in **HTML**, **PDF**, or **PowerPoint (PPTX)** formats.

Built with developer-first experience in mind, it allows you to focus purely on writing markdown while handling theme styling, layouts, transitions, mathematical formatting, code highlighting, and slide-splitting rules automatically.

---

## Key Features

- **Fast Compilation**: Instant build times powered by Bun.
- **Multiple Formats**: Export slide decks to standalone interactive HTML, offline PDF, or fully editable/screenshot PowerPoint presentations.
- **Live Watch Server**: Launch a development server with instant hot-reload.
- **Sleek Themes**: Choose from beautifully designed out-of-the-box themes (`gradient`, `dark`, `notion`, `terminal`, etc.) and customize styling via CSS variables.
- **Advanced Support**: Full native support for KaTeX (mathematical equations), Mermaid (diagrams), and GitHub Flavored Markdown (tables, task-lists).
- **Auto-Layouts & Splitting**: Automatically splits overflowing lists/code blocks and determines optimal layouts.

---

## Installation

Install `mdslide` globally using your preferred package manager:

```bash
# Using Bun (Recommended)
bun add -g @mindfiredigital/mdslide-cli

# Using NPM
npm install -g @mindfiredigital/mdslide-cli

# Using Yarn
yarn global add @mindfiredigital/mdslide-cli
```

---

## Quick Start (3 Steps)

### Step 1: Initialize a new presentation

Create a template presentation file and global configuration file in your directory:

```bash
mdslide init
```

### Step 2: Start the live watch server

Open the template slide in your browser with hot-reload enabled. Save changes to see them instantly:

```bash
mdslide watch slides.md --open
```

### Step 3: Compile for distribution

Build a standalone offline HTML, PDF, or PowerPoint presentation:

```bash
mdslide compile slides.md --theme gradient --open
```
