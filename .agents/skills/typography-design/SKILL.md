---
name: typography-design
description: Provides typography design guidance for web and app UI — font pairing, type scale, line-height, letter-spacing, hierarchy, and accessible readable text. Use when choosing fonts, building a design system's type scale, styling headings/body text in React/TSX components, reviewing Tailwind/shadcn typography classes, or when the user asks about "typography", "font pairing", "type scale", "readability", or "text hierarchy".
---

# Typography Design Skill

## Overview
Typography is the primary driver of perceived design quality in SaaS UI. This skill guides font selection, scale, spacing, and accessibility decisions for React/TypeScript projects (Tailwind, shadcn/ui, CSS variables).

## When to Use
- Setting up a new design system or Tailwind theme's font scale
- Choosing/pairing fonts for a SaaS dashboard, marketing site, or docs
- Reviewing existing components for inconsistent text sizing/hierarchy
- Debugging readability issues (line length, contrast, line-height)
- Adapting typography for responsive/mobile breakpoints

## Process

1. **Establish the type scale first.** Use a modular scale (e.g., ratio 1.25–1.333) rather than arbitrary pixel values. Base size: 16px body text minimum for readability [web:12][web:8].
2. **Limit to 2 font families max**: one for headings, one for body (or one family with multiple weights). Pair a distinctive display font with a neutral, highly legible body font [web:10][web:12].
3. **Set line-height relative to size**: larger text (headings) gets tighter line-height (1.1–1.3), body text gets looser (1.5–1.7) for scanability [web:5][web:15].
4. **Constrain line length** to 50–75 characters (~ch unit in CSS) per line for body copy to avoid eye fatigue [web:5][web:8].
5. **Use letter-spacing sparingly**: slightly negative for large headings, slightly positive (0.02–0.05em) for all-caps or small labels [web:10].
6. **Verify contrast** meets WCAG AA (4.5:1 for body, 3:1 for large text) [web:5].
7. **Test responsively**: use `clamp()` for fluid type sizing between breakpoints instead of fixed media-query jumps.

## Implementation Pattern (Tailwind/shadcn)

Define scale as CSS variables or Tailwind theme tokens rather than inline sizes, so every component pulls from the same source:

```ts
// tailwind.config.ts fontSize scale (1.25 ratio, base 16px)
fontSize: {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5625rem',
  '3xl': '1.953rem',
  '4xl': '2.441rem',
}
```

```css
/* Fluid heading example */
h1 { font-size: clamp(1.75rem, 4vw + 1rem, 3rem); line-height: 1.15; }
```

## Common Rationalizations (Red Flags)
- "This font looks cool, I'll just add it" — reject if it lacks a full weight range (400/500/600/700) or has poor legibility below 14px.
- "I'll just eyeball the sizes" — reject; always derive from the defined scale.
- More than 2 typefaces in one interface — reject unless it's a marketing/hero exception clearly scoped.

## Verification Checklist
- [ ] All text sizes map to the defined scale tokens
- [ ] Body line-height ≥ 1.5, heading line-height ≤ 1.3
- [ ] Line length checked at max container width
- [ ] Contrast ratio verified against WCAG AA
- [ ] Font weights loaded match weights actually used (no unused font-face requests)