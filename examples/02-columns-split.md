---
title: Split Layout Test Cases
theme: light
---

# Split Layout Test Cases

### Regression + coverage deck for the two-column split renderer

---

## The Revenue Gap

### Spending

- ~$300–400B+ annual AI infrastructure capex
- Massive energy and land commitments
- Multi-year GPU supply contracts

::split::

### Earning

- AI software revenue is a fraction of the spend
- Consumer willingness to pay still unproven at scale
- Many pilots; fewer production deployments

---

## Unequal Column Lengths

### Short Side

- Just one point here

::split::

### Long Side

- First supporting detail
- Second supporting detail
- Third supporting detail
- Fourth supporting detail
- Fifth supporting detail with a longer sentence to test wrapping behavior

---

## No Headings, Just Lists

- Custom lists
- Code blocks
- Standard text paragraphs

::split::

- Parallel points
- Comparative summaries
- Secondary media descriptions

---

## Text vs Code

### Before

Plain prose explaining the old approach in a couple of sentences, to check
that paragraph text wraps and aligns correctly inside a split column.

::split::

### After

```js
function greet(name) {
  return `Hello, ${name}!`;
}
```

---

## List vs Image (manual)

### Highlights

- Works on any theme
- Scales to widescreen
- No manual CSS required

::split::

![Sample Landscape](https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800)

---

## Auto-Split (single image, no ::split::)

This slide has no layout override and no manual `::split::` marker. Since it
contains exactly one paragraph of text and exactly one image, the compiler
auto-detects a two-column split: text on the left, image on the right.

![Auto-detected Split](https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800)

---

## Prose vs Prose

### Before

The old pipeline compiled everything synchronously on a single thread,
which meant large decks could take several seconds to render.

::split::

### After

The new pipeline streams slides as they compile, so the first slide is
interactive well before the rest of the deck finishes.

---

## Table vs Bullets

### Comparison

| Metric | Old  | New  |
| :----- | :--- | :--- |
| Speed  | Slow | Fast |
| Memory | High | Low  |

::split::

### Takeaways

- Faster end-to-end compile
- Lower memory footprint
- Same output quality

---

## Nested Bullets Both Sides

### Frontend

- Framework
  - React
  - Next.js
- Styling
  - Tailwind CSS

::split::

### Backend

- Runtime
  - Node.js
  - Bun
- Storage
  - PostgreSQL
  - Redis
