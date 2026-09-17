---
name: CondoFlow
description: A calm, AI-native operations platform that runs a condominium's reservations, maintenance and communication so the síndico doesn't have to.
colors:
  signal-indigo: "oklch(0.32 0.13 258)"
  indigo-glow: "oklch(0.55 0.18 258)"
  paper: "oklch(0.99 0.003 240)"
  ink: "oklch(0.18 0.04 250)"
  card-white: "oklch(1 0 0)"
  quiet-lavender: "oklch(0.965 0.01 250)"
  fog: "oklch(0.965 0.008 250)"
  hairline: "oklch(0.93 0.01 250)"
  confirmed-green: "oklch(0.65 0.16 155)"
  attention-amber: "oklch(0.78 0.16 70)"
  alert-red: "oklch(0.62 0.2 22)"
  blue-graphite: "oklch(0.165 0.018 256)"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  sm: "10px"
  md: "12px"
  lg: "14px"
  xl: "18px"
  2xl: "22px"
  3xl: "26px"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.signal-indigo}"
    textColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: "0 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.indigo-glow}"
  button-secondary:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0 24px"
    height: "44px"
  badge-pill:
    backgroundColor: "{colors.signal-indigo}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  card:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.2xl}"
    padding: "24px"
---

# Design System: CondoFlow

## Overview

**Creative North Star: "The Quiet Operations Room"**

CondoFlow's whole pitch is that automation replaces the WhatsApp group chaos — "o condomínio que se administra sozinho." The interface earns that claim by staying calm where a typical ops dashboard gets loud: a near-white paper canvas in light mode, a deliberately blue-tinted graphite (never pure black) in dark mode, one indigo signal color spent sparingly, and generous rounded geometry that reads as software you can trust to run unattended. Density is moderate — cards breathe with 24px padding and comfortable line-height — because the audience (síndicos, often non-technical) needs to scan calmly, not parse a data-dense console.

The one deliberate flourish is the indigo gradient (`--gradient-hero`), reserved for the handful of moments the product wants to feel alive: the hero headline's accent word, primary CTA buttons, and the ambient glow behind hero visuals. Everywhere else, color recedes and hairline borders plus soft shadows do the work of separating content.

**Key Characteristics:**
- One accent (signal indigo), spent on primary actions and the hero moment only — never as generic decoration.
- Generous, consistent rounding (14px base, scaling from 10px to 26px) — nothing sharp-cornered.
- Soft, colored (not grey) shadows: `shadow-card` for resting surfaces, `shadow-elegant` for anything that should feel premium or interactive-on-hover.
- A genuinely designed dark mode — "premium graphite with blue undertones, not pure black" (the codebase's own words) — not an inverted afterthought.
- Status communicated through color + icon pairs (success/warning/destructive) rather than through layout changes.

## Colors

The palette is a single indigo signal color over a near-monochrome neutral scale, with three semantic accents for state. Every color is defined in OKLCH so lightness stays perceptually consistent across the light/dark pair.

### Primary
- **Signal Indigo** (`oklch(0.32 0.13 258)` light / `oklch(0.7 0.17 258)` dark): the one accent color. Primary buttons, active nav states, focus rings, the hero gradient. Deliberately rare — most screens show it only on the single most important action.
- **Indigo Glow** (`oklch(0.55 0.18 258)`): the light end of `--gradient-hero` and the hover state of Signal Indigo. Also drives the ambient ~20%-opacity blur glow behind hero visuals and premium cards.

### Neutral
- **Paper** (`oklch(0.99 0.003 240)`): light-mode background. Warmer and softer than pure white.
- **Card White** (`oklch(1 0 0)`): card/popover surface — one step brighter than the page behind it.
- **Ink** (`oklch(0.18 0.04 250)`): primary text in light mode. Not pure black — carries the same blue undertone as every other neutral.
- **Quiet Lavender** (`oklch(0.965 0.01 250)`): secondary surfaces (secondary buttons, subtle fills).
- **Fog** (`oklch(0.965 0.008 250)`): muted backgrounds (`bg-muted/30`, `bg-muted/40`) for section banding and toolbars.
- **Hairline** (`oklch(0.93 0.01 250)`): the universal border color — every border on the site resolves to this one token in light mode.
- **Blue Graphite** (`oklch(0.165 0.018 256)`): dark-mode background. Named directly in the source as "premium graphite with blue undertones — not pure black."

### Semantic
- **Confirmed Green** (`oklch(0.65 0.16 155)`): success states — confirmed reservations, completed tasks, "zero manutenções atrasadas."
- **Attention Amber** (`oklch(0.78 0.16 70)`): warning states — pending approval, upcoming deadlines, "em breve" badges.
- **Alert Red** (`oklch(0.62 0.2 22)`): destructive/urgent states — overdue maintenance, cancel actions, urgent-task priority.

### Named Rules
**The One Signal Rule.** Signal Indigo appears on at most one element per view that isn't navigation — the primary CTA, the active tab, the one accent word in a headline. If two elements compete for it, one loses.

**The No-Grey-Shadow Rule.** Shadows are never neutral grey; they're `color-mix()`'d from the foreground or primary color (see Elevation & Depth), so elevation carries the same blue undertone as everything else.

## Typography

**Display / Body / Label Font:** Inter (`ui-sans-serif, system-ui, sans-serif` fallback) — a single family for the entire product, differentiated by size, weight, and tracking rather than a second face.

**Character:** Confident and slightly compressed at large sizes (tight -0.02em tracking on every heading), relaxed and generously spaced at small sizes (uppercase labels get +0.05em tracking to stay legible at 12px). No serif, no display face — the typography's job is clarity, not personality.

### Hierarchy
- **Display** (600, `clamp(2.25rem, 5vw, 3.75rem)`, 1.05 line-height): the landing page's one hero headline. Uses `text-wrap: balance`; the accent word is clipped to the indigo gradient.
- **Headline** (600, 2.25rem / `text-4xl`, -0.02em): marketing section titles ("Tudo que o seu condomínio precisa…") and app page `<h1>`s at the 2xl step.
- **Title** (600, 1.5rem–1.25rem, -0.02em): card and dialog headings, feature-card titles.
- **Body** (400, 0.875rem, 1.6 line-height): the default text size across the entire product — descriptions, table cells, form labels' companion copy.
- **Label** (600, 0.75rem, uppercase, +0.05em tracking): section eyebrows and field labels (`text-xs font-semibold uppercase tracking-wider text-muted-foreground`) — the recurring "quiet caption" pattern above almost every form field and card group. On the landing page, every section-kicker `Badge` also carries `uppercase tracking-wide` for the same reason — the pill shape alone doesn't read as a label without it.
- **Data** (600, one step above the Headline it sits near, tabular): live or counted numerals — animated stats, prices, in-app metric mockups. Always paired with `tabular-nums` so digits don't reflow neighboring text while counting up or down.

### Named Rules
**The Tight-Heading Rule.** Every heading level (`h1`–`h4`) carries `-0.02em` letter-spacing globally — never opt out per-component.

**The Data-Outranks-Headline Rule.** A number that is the point of its own row (a stat, a price) sits one type step above the section Headline next to it, never the same size — a metric and a title are different roles and must not collide. A decorative background numeral (e.g. a step count) stays at or below Headline size regardless of how faint its color is; low opacity alone doesn't demote it.

## Layout

The marketing page is a classic centered-container marketing layout: `max-w-7xl` outer shell, `px-6` gutter, section rhythm at `py-24` (`py-10`/`py-16` for tighter bands like the logo strip). Text columns inside hero sections clamp to `max-w-2xl`–`max-w-3xl` for readability.

The app (post-login) shell is a fixed sidebar + scrollable content region, with page content padded `px-4 lg:px-8 py-8` and a `max-w-3xl` cap on long-form settings pages. Cards and lists use `gap-2`–`gap-6` from Tailwind's default spacing scale rather than a custom spacing token set — there is no bespoke spacing scale to preserve, just consistent, conventional Tailwind steps.

Responsive behavior is mobile-first and conventional: grids collapse from 3/4 columns to 2 to 1 (`md:grid-cols-3` → base 1-col), nav links hide under `md:`, and filter/tab bars wrap (`flex-wrap`) rather than scroll.

## Elevation & Depth

Hybrid: mostly flat, hairline-bordered surfaces at rest, with two purpose-built colored shadows reserved for moments that should feel lifted or premium. Depth is conveyed by shadow softness and blue tint, never by grey drop-shadows or z-index stacking tricks.

### Shadow Vocabulary
- **`shadow-card`** (`0 1px 2px oklch(0 0 0/0.04), 0 4px 24px -8px oklch(0.18 0.04 250/0.06)`): the everyday resting shadow for cards, dialogs, and list rows. Barely visible at rest — its job is separation, not drama.
- **`shadow-elegant`** (`0 10px 40px -12px color-mix(in oklab, {signal-indigo} 25%, transparent)`): the "this matters" shadow — primary CTA buttons, the hero dashboard mockup, cards on hover. Indigo-tinted, not grey.
- **`shadow-glow`** (`0 0 60px -10px color-mix(in oklab, {indigo-glow} 40%, transparent)`): ambient background bloom behind hero art and premium panels — ornamental, never on interactive elements.

### Named Rules
**The Elegant Lift Rule.** Interactive cards go from `shadow-card` to `shadow-elegant` plus a `-translate-y-0.5` nudge on hover — never a scale transform, never a grey shadow.

## Shapes

Rounding is generous and consistent, built off one base radius (`--radius: 14px`) that every other step derives from via `calc()`: 10px (sm) → 12px (md) → 14px (lg) → 18px (xl) → 22px (2xl) → 26px (3xl). Cards and dialogs sit at `xl`/`2xl`; buttons and inputs at `lg`/`xl`; badges, avatars, and status dots are always fully round (`rounded-full`). Nothing in the product uses a sharp (0px) corner.

Borders are 1px, always the single `Hairline` token, and used as the default separator between surfaces (`bg-card` + `border` beats a shadow-only card almost everywhere in the app shell). Left-edge color bars (a 4px `w-1` strip) appear on list rows to encode urgency/priority at a glance — a functional color-code, not decoration.

## Components

### Buttons
- **Shape:** `rounded-lg`–`rounded-xl` (12–18px), height 36–44px depending on context (marketing CTAs run larger).
- **Primary:** `bg-gradient-hero` (or flat Signal Indigo) with `Paper`-colored text, `shadow-elegant`, `hover:opacity-95`.
- **Secondary / Outline:** `Card White` background, `Hairline` border, hover fills to `Fog`.
- **Ghost:** no fill or border at rest; text-only, hover fills to `Fog`.
- **Destructive:** same shape language, `Alert Red` fill, reserved for cancel/urgent actions.

### Badges / Pills
- **Style:** fully rounded (`rounded-full`), small (`text-[10px]`–`text-xs`), tone-colored solid fill with white text (`Badge` component: default/success/warning/destructive/primary), or a soft 10–20%-opacity tint with matching-hue text for status chips inline in lists (e.g. the "IA", "Diária", "Em execução" tags across task rows).

### Cards
- **Corner Style:** `rounded-2xl` (22px) is the default for content cards; `rounded-xl` for tighter inline cards.
- **Background:** `Card White`, always paired with a `Hairline` border.
- **Shadow Strategy:** `shadow-card` at rest, `shadow-elegant` + lift on hover for anything clickable.
- **Internal Padding:** 16–24px (`p-4`–`p-6`).

### Icon Chips
- **Style:** 36–40px square, `rounded-xl`, soft tint background at 10% opacity of the relevant color (usually `bg-primary/10`), icon at 16–20px in the full-strength color. The recurring way every feature/stat/section leads with an icon.

### Inputs / Fields
- **Style:** `rounded-lg`, `Hairline` border, `bg-background`, height 40px (`h-10`).
- **Focus:** `ring-2 ring-ring/40` plus a border color shift — a soft indigo halo, no hard outline.

### Navigation
- **Marketing header:** sticky, `bg-background/80` + `backdrop-blur` (the deliberate, chrome-only use of glassmorphism in the whole product), `border-b` hairline, logo + inline text links + a solid dark "Começar grátis" pill CTA.
- **App shell:** dark sidebar (`Blue Graphite`-family tokens even in light mode — the sidebar is intentionally always-dark) with active items on `sidebar-accent`.

### Priority/Urgency Rail (signature component)
A 4px-wide colored vertical bar on the left edge of task/reservation rows (red = urgent, blue = normal, slate = low). It's a status encoding, not a border-as-decoration flourish — the color is the only signal, there's no matching border elsewhere on the row.

### Painel do Interfone (landing page only)
The marketing landing page (`src/routes/index.tsx`) carries one additional, scoped material on top of the tokens above — it does not apply to the logged-in app. Cards and buttons read as a physical intercom/doorbell panel: instead of a flat 1px `Hairline` border, surfaces get a subtle metal-plate bevel (`--shadow-plate` / `--shadow-plate-hover`, a light inset top edge and dark inset bottom edge replacing the border entirely — never both). Icon chips become fully round "buzzer" buttons, recessed at rest (`--shadow-buzzer`) and lighting up with an indigo LED glow on hover/focus (`--shadow-buzzer-lit`) — reserved for Signal Indigo–toned chips only, per the One Signal Rule; semantic-colored chips (destructive, etc.) get the recessed bevel without the lit glow. Primary buttons get the same bevel plus a pressed-in state on `:active` (`--shadow-btn-plate` / `--shadow-btn-plate-pressed`), so clicking reads as pressing a physical button. Utility classes: `.panel-plate`, `.panel-plate-hover`, `.buzzer-chip`, `.btn-plate`. See `.impeccable/surfaces/src-routes-index-tsx.md` for the full direction contract.

## Do's and Don'ts

### Do:
- **Do** spend Signal Indigo on exactly one focal element per screen; let neutrals carry everything else.
- **Do** use the indigo-tinted shadows (`shadow-card` / `shadow-elegant`), never a flat grey `box-shadow`.
- **Do** keep every corner rounded from the shared radius scale (10–26px) — no sharp corners, no ad-hoc radius values.
- **Do** treat dark mode as a first-class blue-graphite palette, not an inverted/desaturated copy of light mode.
- **Do** pair every icon-led card or stat with a tinted (10–20% opacity) icon chip in that item's semantic color.
- **Do** nudge a forward-pointing icon (`ArrowRight`) a couple pixels toward its direction on button hover (`group-hover:translate-x-0.5`, ~200ms) — feedback tied to what the icon means, not a generic hover flourish.
- **Do** respect `prefers-reduced-motion`: every transition/animation duration collapses to near-zero and smooth scroll turns off, so state and content changes still land, just without the movement.
- **Do** treat a status indicator (the 3 browser-chrome dots) as a small panel powering on, not a static decoration: a quick staggered fade+scale (`.dot-power-on`, ~130ms apart) the first time it appears — once, never looping. A completed process (the AI demo) gets a quiet, exact confirmation of what actually happened (a real count, not an invented number), not a celebration.

### Don't:
- **Don't** apply `.glass`/backdrop-blur to content surfaces — it's reserved for the two fixed navigation bars in the whole product.
- **Don't** introduce a second typeface; weight, size, and tracking are how this system creates hierarchy.
- **Don't** use scale-transform hover effects on cards; lift with `translate-y` + shadow escalation instead.
- **Don't** render status as plain colored text alone — pair color with an icon and, on list rows, the urgency rail.
