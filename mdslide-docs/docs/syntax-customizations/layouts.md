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

## 3. Auto-Split Heuristic (Text & Image)

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
