---
sidebar_position: 3
---

# Slide Layouts & Column Splitting

`mdslide` includes an intelligent layout engine that formats slide content based on both manual annotations and content patterns.

---

## 1. Built-in Slide Layouts

You can manually force a specific layout on any slide using the `<!-- layout: name -->` comment annotation. Below are the available layouts:

### Cover / Title Layout (`<!-- layout: title -->`)

- **Use case**: Slide decks intro, section headers.
- **Style**: Centers the main title and subtitle vertically and horizontally, giving them extra large, prominent fonts.

```markdown
<!-- layout: title -->

# My Presentation Title

## A compelling subtitle
```

### Bullets Layout (`<!-- layout: bullets -->`)

- **Use case**: Bulleted summaries.
- **Style**: Enhances list items with larger, highly legible margins and custom marker colors.

```markdown
<!-- layout: bullets -->

# Key Takeaways

- First insight from the talk
- Second major finding
- Third point worth remembering
```

### Full-Screen Code Layout (`<!-- layout: code -->`)

- **Use case**: Highlighting source code scripts.
- **Style**: Maximizes the code block to fill the entire slide boundaries, disabling scrollbars and optimizing typography.

````markdown
<!-- layout: code -->

# Compiler Pipeline

```typescript
function compile(input: string): HTML {
  const ast = parse(input);
  return render(ast);
}
```
````

### Visual Image Layout (`<!-- layout: visual -->`)

- **Use case**: Prominent screenshots or graphics.
- **Style**: Stretches and fits images dynamically to cover maximum screen real estate while keeping headings neat.

```markdown
<!-- layout: visual -->

# Architecture Overview

![System diagram](./diagram.png)
```

### Quote Layout (`<!-- layout: quote -->`)

- **Use case**: Testimonials or key takeaways.
- **Style**: Centers text inside a custom-highlighted, glassmorphic quotation box.

```markdown
<!-- layout: quote -->

> "Make it work, make it right, make it fast."
>
> - Kent Beck
```

### Table Layout (`<!-- layout: table -->`)

- **Use case**: Comparison metrics.
- **Style**: Automatically centers Markdown tables vertically and horizontally.

```markdown
<!-- layout: table -->

# Format Comparison

| Format | File Size | Editable | Offline |
| ------ | --------- | -------- | ------- |
| HTML   | Small     | No       | Yes     |
| PDF    | Medium    | No       | Yes     |
| PPTX   | Large     | Yes      | Yes     |
```

### Statement Layout (`<!-- layout: statement -->`)

- **Use case**: Single major statistics or statements.
- **Style**: Displays single short sentences in a massive font.

```markdown
<!-- layout: statement -->

10× faster than traditional tools.
```

### Split Layout (`<!-- layout: split -->`)

- **Use case**: Two-column comparisons.
- **Style**: Creates a side-by-side content block.

```markdown
<!-- layout: split -->

# Before vs After

Left column content

::split::

Right column content
```

### Content Layout (`<!-- layout: content -->`)

- **Use case**: General mixed content that doesn't match any of the more specific patterns above — a heading followed by ordinary paragraphs, or a mix of blocks that isn't purely a list, a single image, a single code block, a single quote, or a table.
- **Style**: The default flowing layout — heading plus paragraphs/blocks with no special centering or emphasis treatment applied.

```markdown
<!-- layout: content -->

# Release Notes

This update focuses on stability and a handful of small quality-of-life
improvements requested by the community over the last few months.
```

`content` is also the automatic fallback: any slide whose content doesn't
trigger the `bullets`, `code`, `visual`, `quote`, `table`, or `statement`
auto-detection heuristics resolves to `content` without needing the
annotation at all.

---

## 2. Two-Column Split Layouts (`::split::`)

To manually partition a slide into two equal side-by-side columns, use the `::split::` divider tag on an empty line:

```markdown
# Front-end vs Back-end

### Front-end Technologies

- React / Next.js
- Tailwind CSS
- HTML/JS

::split::

### Back-end Technologies

- Node.js / Bun
- PostgreSQL / Redis
- Docker / K8s
```

:::tip
The `::split::` separator **must** be on its own blank line. If it appears directly adjacent to text without an empty line before and after it, the compiler will treat it as body text and the column split will not activate.
:::

---

## 3. N-Column Splits (`::col::`)

`::split::` (above) covers the common two-column case. For **three or more**
columns, place `<!-- columns: N -->` near the top of the slide, then use
`::col::` — one fewer marker than the number of columns you want — to divide
the content:

```markdown
# Frontend vs Backend vs Infra

<!-- columns: 3 ratio:2:1:1 -->

### Frontend

- React / Next.js

::col::

### Backend

- Node.js / Bun

::col::

### Infra

- Terraform
- Kubernetes
```

Optionally append `ratio:a:b:c` (one weight per column, colon-separated) to
the same `<!-- columns: -->` comment for unequal column widths — as shown
above, the first column gets twice the width of the other two.

:::tip
Just like `::split::`, every `::col::` divider **must** sit on its own blank
line — a blank line is required both before and after it, or the compiler
treats it as ordinary body text.
:::

If the declared `columns: N` count or the `ratio:` segment count doesn't
match the actual number of `::col::`-delimited columns, `mdslide validate`
emits a warning and the compiler falls back to rendering equal-width
columns.

### Per-Column Layout Override

Each column in a `::split::`/`::col::` slide auto-detects its own layout
independently from its own content — one column can resolve to `bullets`
while its neighbor resolves to `code` or `content`. To force a specific
column's layout, place a `<!-- layout: xxx -->` comment inside that column's
own segment (after the marker that starts it, before the next one):

````markdown
# Build vs Test vs Deploy

<!-- columns: 3 ratio:2:1:1 -->
<!-- layout: code -->

```bash
npm run build
```

::col::

- Smoke tests
- Integration tests

::col::

Deploy stuff, no special layout here — this column auto-detects `content`.
````

Here the first column is forced to `code` styling regardless of what it
would otherwise auto-detect to; the second column auto-detects `bullets`
(it contains a list); the third auto-detects `content` (plain flowing text).
Allowed values for a per-column override are the same set as the whole-slide
`<!-- layout: -->` annotation, minus `title` and `split` — a column can't be
its own title slide, and splits can't nest inside a column.

:::tip
`mdslide validate` warns if a per-column override uses an invalid layout
value, or if a single column contains more than one `<!-- layout: -->`
comment. [`mdslide inspect`](../cli-commands/inspect.md) lists each column's resolved
layout, which is useful for confirming an auto-detected column landed where
you expected.
:::

---

## 4. Auto-Split Heuristic (Text & Image)

`mdslide` makes designing slides faster by applying an **Auto-Split Heuristic**.

If a slide contains **exactly one image** along with text (paragraphs, headings, or lists) and no manual `::split::` tag is present, the compiler automatically converts the slide into a split two-column layout. It places the text content on the left column and the image on the right column.

```markdown
# Product Launch

Learn about our brand-new compiler architecture and download the binaries today.

- 10x faster execution
- Vector PDF output

![mdslide screenshot](https://example.com/screenshot.jpg)
```

The example above will automatically render with the text list on the left and the image fitted on the right.
