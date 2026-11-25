# Amibot design system — Atelier

This document is the source of truth for Amibot's visual direction. Read it
before changing UI. Enforceable short rules live in `AGENTS.md`.

Atelier replaces the Liquid Glass direction. The reference is a printed page and
a well-set form, not a translucent pane: surfaces are opaque, hierarchy comes
from type and space, and color is reserved for action.

> Status: this document defines the target system. The current build still uses
> the glass primitives; the migration section tracks the gap.

## Direction

**Atelier in one line: paper, ink, one signal.**

Three signature moves make the app recognizable:

1. A quiet app bar above a large editorial page title.
2. Hairlines and space instead of boxes.
3. One accent color, used sparingly.

Keywords: editorial, warm, precise, calm, confident.

Not: glass, gradients, glow, neon, playful, skeuomorphic, card soup.

## Principles

1. **Type carries hierarchy.** Size, weight, and measure establish order before
   borders or backgrounds do.
2. **Structure is drawn with lines and space.** A hairline and 24px of air
   separate better than a card.
3. **Opaque by default.** No blur, transparency, or material effects. The
   interface stays legible and cheap on every platform.
4. **One signal.** The accent marks action and state; it never becomes
   decoration. Neutral surfaces carry at least 90% of a screen.
5. **Content first, chrome quiet.** Navigation recedes; the page title and the
   content are the loudest things on screen.
6. **Calm motion.** Motion explains a state change or a location change,
   nothing else.
7. **One system everywhere.** Web, iOS, and Android share composition, type,
   and color. Platform conventions apply only to interaction feedback.

## Palette

All themes share one warm neutral canvas; a theme changes only the signal hue.
The page background never takes the accent tint.

### Neutral ramp (all themes)

| Role          | Light     | Dark      | Tokens                            |
| ------------- | --------- | --------- | --------------------------------- |
| Canvas        | `#F7F6F2` | `#0E0E10` | `background`                      |
| Raised        | `#FFFFFF` | `#17171A` | `card`, `popover`                 |
| Sunken        | `#ECE9E2` | `#1F1F23` | `surface`, `muted`                |
| Ink           | `#17171A` | `#F3F1EC` | `foreground`, `popoverForeground` |
| Ink secondary | `#5F5B54` | `#A6A29A` | `mutedForeground`                 |
| Hairline      | `#DCD8CF` | `#2E2E33` | `border`, `input`                 |
| Ink button    | `#26262B` | `#ECEAE4` | `secondary`                       |
| Selection     | `#E7E4DD` | `#26262B` | `accent`                          |
| Danger        | `#B42318` | `#FF6B61` | `destructive`                     |
| Danger ink    | `#FFFFFF` | `#1A0907` | `destructiveForeground` (new)     |

`secondaryForeground` is the inverse of `secondary`. `accent` is a neutral wash
for hover and selection, and `accentForeground` is ink; it is not a second
signal. The signal lives on text, icons, borders, and the primary button.

### Signal per theme

| Theme            | Light     | Dark      | `primaryForeground`   |
| ---------------- | --------- | --------- | --------------------- |
| `default` Cobalt | `#2A3CCB` | `#9BA6FF` | `#FFFFFF` / `#101018` |
| `ocean` Petrol   | `#0B6B72` | `#62D6DD` | `#FFFFFF` / `#04282B` |
| `forest` Moss    | `#3E6B2E` | `#A8D98A` | `#FFFFFF` / `#10230A` |

`ring` equals `primary`. The listed text/action pairs are at or above 6:1 in
both modes; re-check if any value changes.

### Color rules

- Neutral surfaces: 90% of the screen. Accent: at most 5%. Semantic color:
  the rest.
- `primary` is for the primary action, the active item, focus, and selection.
  Never for body text and never for a large background fill outside a primary
  button.
- `destructive` is for errors and destructive actions only. Destructive
  buttons use `destructiveForeground`, not white by default.
- `surface`, `muted`, and `accent` are for insets, wells, hover, and selection.
  They are not page backgrounds and never a second signal.
- No gradients, tinted page backgrounds, colored shadows, or glows.
- Themes differ by signal, not by mood: the canvas stays warm in all of them.

## Typography

Families are fixed: **Archivo** for display and large metrics, **Public Sans**
for everything else. Loaded weights only; never synthesize bold or italic.

| Token     | Size / line | Tracking | Face                            | Use                                      |
| --------- | ----------- | -------- | ------------------------------- | ---------------------------------------- |
| `display` | 36 / 40     | -0.03em  | Archivo Bold                    | Page title, hero metric. One per screen. |
| `title`   | 26 / 32     | -0.02em  | Archivo SemiBold                | Section landing, empty state, sheet      |
| `heading` | 19 / 26     | -0.01em  | Public Sans SemiBold            | Block heading, app bar title             |
| `body`    | 16 / 24     | 0        | Public Sans Regular             | Default text, inputs                     |
| `small`   | 14 / 20     | 0        | Public Sans Regular/Medium      | Meta, helper, secondary row              |
| `label`   | 12 / 16     | +0.08em  | Public Sans SemiBold, uppercase | Eyebrow, column head, tag                |

Rules:

- At most three sizes per view, and exactly one `display`.
- Titles are sentence case. Uppercase is reserved for `label`, short and
  never a sentence.
- Never letterspace body text; never use `display` for paragraphs.
- Body measure is 60–75 characters; cap reading content at 640.
- Body text is never below 16, labels never below 12.
- Numbers in a column are right-aligned. Standalone metrics may use `display`.

## Space, grid, layout

Use one 4pt ladder: 2, 4, 8, 12, 16, 20, 24, 32, 48, 64. Expose it once in
`theme.ts`; a gap that is not on the ladder is a design bug, not a style
choice.

- **Page gutters:** 20 on mobile, 32 from `md`, 48 from `lg`.
- **Vertical rhythm:** 48 between sections, 24 between blocks, 12 from a label
  to its content, 8 inside a control cluster.
- **Widths:** content 800, prose 640, forms 560. Containers are left-aligned
  inside the page; no centered body copy except empty and loading states.
- **Alignment:** one shared left edge per screen; actions on the right;
  numeric values on the right. Forms are never centered.
- **Density:** comfortable. Rows are at least 56 high; touch targets at least
  44×44 with an 8 gap.

### Screen composition

```text
AppBar          56 + safe area, opaque canvas, hairline bottom
PageHeader      display title, optional one-line description, optional action
Section         label + optional action + content
Section         ...
```

The app bar holds a back control or the wordmark (never both), and global
actions. It does not hold the page title. The page title lives in content, in
`display`, and scrolls with the page.

No tabs, sidebar, or drawer until the modules that need them land.

## Shape, line, elevation

- **Radii:** 6 for controls, 10 for cards and inline panels, 16 for modal
  sheets, `full` only for status dots and tags. Buttons are not pills.
- **Lines:** 1px hairline for structure. Never box every group; prefer space,
  then a single line, then a surface.
- **Elevation:** none on content. Chrome separates with a hairline, not a
  shadow. Overlays get one soft shadow plus a scrim.
- **No nested cards.** A card inside a card is a bug, not a style.

## Icons

- `lucide-react-native` only, 1.75 stroke, 20 default, 16 inline, 24 maximum.
- Icons inherit `foreground` or `mutedForeground`; accent only for an active
  state.
- No emoji, no mixed icon families, no filled and outline in the same view.
- An icon-only control is 44×44 and has an `accessibilityLabel`.

## Components

### App bar

Opaque `background`, bottom hairline, 56 high plus safe area. Leading element:
back control or wordmark. Trailing: at most two ghost actions. Slot
contributions inside it return plain text or icon actions, never a surface.

### Page header

32 from the app bar, `display` title, optional `small` description in
`mutedForeground` capped at 60ch, optional primary action. Below 640, the
action stacks under the title.

### Buttons

| Variant       | Fill          | Text                    | Use                        |
| ------------- | ------------- | ----------------------- | -------------------------- |
| `primary`     | `primary`     | `primaryForeground`     | One per view               |
| `outline`     | transparent   | `foreground` + hairline | Alternative, cancel        |
| `ghost`       | transparent   | `foreground`            | App bar, back, row action  |
| `destructive` | `destructive` | `destructiveForeground` | Confirm destructive action |

- Height 44 (36 for compact rows), padding 16, radius 6, `small` semibold text.
- Pressed shifts background or opacity over 120ms. **No scale bounce.**
- Disabled is 40% opacity and non-interactive.
- Focus is a 2px `ring` with a 2px offset on web.

### Inputs

44 high minimum, `card` fill, 1px hairline, radius 6, 12 horizontal padding,
16 text. Label above in `small` medium; helper below in `small` muted. Focus
adds a 2px `ring`. Error changes the border to `destructive` and adds a
`small` message below. Placeholders are examples, never labels.

### Cards

Use only for a discrete object that benefits from grouping. `card` fill, 1px
hairline, radius 10, 20 padding (24 on desktop), no shadow, no nesting. Lists
and settings do not use cards.

### List rows and settings

56 high minimum, 1px separator between rows, label plus optional meta on the
left, value or chevron on the right. Hover and press use `surface`; the whole
row is the target. Settings group rows under a `label` heading with a single
hairline between groups; a destructive action sits apart and says what it does.

### Empty, loading, error

One `title`, one `small` sentence, one action. Centered is allowed only here.
Page loading is a small `primary` spinner on the canvas; local loading never
takes the full screen. Errors use `destructive` for the message and offer a
retry. No shimmer, no skeleton animation.

### Overlays

Sheets and dialogs use `card`, radius 16 (top corners only on mobile), 1px
hairline, and a 40% ink scrim. Title, body, then actions aligned right. No blur
behind the overlay. Escape and the scrim close it.

### Toasts

One at a time, bottom with 16 inset, inverse surface (`secondary`), 4s, no
bounce. Never the only place an error is reported.

## Motion

- 120ms for press feedback, 180ms for state and overlay, 240ms for navigation.
- Ease-out `cubic-bezier(0.2, 0, 0, 1)`; no spring overshoot.
- Motion only communicates state or location. No entrance choreography, no
  parallax, no shimmer, no looping animation, no animated color or shadow.
- Press feedback is a background or opacity shift, not a scale.
- With reduced motion, transitions are instant. Read
  `useAccessibilityPreferences().reduceMotion`.

## Voice

Sentence case. Verbs for actions ("Connect", not "Connection"). One idea per
sentence. No exclamation marks, no "Oops", no filler. An error says what
happened and what to do next. All copy lives in
`src/i18n/locales/{en,fr}.json`.

## Platform notes

- **Web:** hover and `focus-visible` states are required; show a pointer on
  interactive rows; respect the max widths.
- **iOS:** safe-area insets, 44pt targets, native stack transitions.
- **Android:** same layout and colors. A bounded ripple tinted with `primary`
  at 8% may replace the pressed fill; it never adds a second effect.
- **Type scaling:** support up to 200% without clipping; no fixed heights
  around text.
- The status bar follows the color mode.

## Accessibility

- WCAG AA: 4.5:1 for body, 3:1 for large text and UI boundaries. Focus rings
  must reach 3:1 against both the control and the canvas.
- Color is never the only signal: pair it with text, an icon, or weight.
- Target size 44×44 with 8 spacing; icon-only controls have labels.
- Web focus is always visible and follows DOM order. Overlays trap focus and
  close on Escape.
- Never truncate critical text; allow wrapping and dynamic type.
- `reduceMotion` disables transitions and any non-essential animation.
- Keep `testID` and `nativeID` stable so Maestro flows survive redesigns.

## Anti-patterns

- Glass, blur, translucency, or any material effect.
- Gradients, glows, noise, colored shadows, decorative shapes.
- Accent-tinted page backgrounds or more than one accent hue.
- Accent body text or large accent fills outside the primary button.
- Cards inside cards, boxed sections, shadows on content.
- Pill-shaped everything; buttons are 6px, not pills.
- Centered forms or centered body copy.
- Uppercase sentences or letterspaced body text.
- More than three type sizes on a screen, or `display` for body copy.
- Synthetic bold or italic, emoji as icons, mixed icon families.
- Scale, pulse, shimmer, parallax, or animated decoration.
- Raw hex, arbitrary Tailwind values, or inline type sizes in components.
- Editing Gluestack vendor files under `src/shared/components/ui/**`.

## Implementation

Token-first: a visual value is added to `src/constants/theme.ts` and
`src/global.css` with a semantic name before it is used. Components never own
one-off colors, radii, shadows, durations, or sizes.

### Tokens to add

```ts
export const Radii = { sm: 6, md: 10, lg: 16, full: 999 } as const;
export const Elevation = {
  none: {},
  overlay: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 12,
  },
} as const;
export const Motion = {
  fast: 120,
  base: 180,
  slow: 240,
  ease: [0.2, 0, 0, 1],
} as const;
export const Layout = {
  headerHeight: 56,
  gutter: 20,
  contentMaxWidth: 800,
  readingMaxWidth: 640,
  formMaxWidth: 560,
} as const;
```

Extend the unused `Spacing` export to the 4pt ladder above, and replace the
unused `MaxContentWidth` with `Layout.contentMaxWidth`. Add
`destructiveForeground` to `ThemeColors`. Mirror the type scale in
`global.css` as `--text-display`, `--text-title`, `--text-heading`,
`--text-body`, `--text-small`, `--text-label` with their line-height,
tracking, and weight modifiers, and in `theme.ts` for JS-only use. Confirm that
this NativeWind version resolves the `--text-*` modifiers; if it does not, keep
the single source in `theme.ts` and expose utilities from there.

### Components to build

Add app-level primitives under `src/shared/components/` (not under `ui/`):
`AppBar`, `PageHeader`, `Section`, `Card`, `ListRow`, `Field`, `EmptyState`,
`Sheet`, `Toast`, and a `Button` wrapper.

The `Button` wrapper composes the vendor button and enforces the Atelier
recipe: 44 height, radius 6, no scale on press, no outline shadow, four
variants, focus ring. Never edit the vendor source to achieve this.

Use `tailwind-variants` for variant maps. Keep props semantic
(`variant`, `tone`, `size`), not visual (`isBlue`, `bigPadding`).

### Migrating from glass

1. Replace `themePalettes` and the `:root` block in `global.css` with the
   palette above; add `destructiveForeground` and make every canvas neutral.
2. Replace `GlassSurface variant="navigation"` in `AppShell` with the opaque
   `AppBar`; remove `GlassTarget` and render content directly.
3. Introduce `PageHeader` in each screen and move the page title there; the
   app bar stops carrying it. Move `testID` values such as `settings-title` to
   the new title element.
4. Delete `GlassSurface`, `GlassTarget`, `GlassTint`, `GlassVariant`,
   `glassVariants`, `glassDepthContext`, and the reduced-transparency branch.
5. Remove the `expo-blur` dependency only after the last consumer is gone and
   with explicit approval, per the repository rules.
6. Update the UI section of `frontend/AGENTS.md` in the same change that lands
   this direction; it still points to Liquid Glass.
7. Keep existing `testID` values; update the affected Maestro flow only if the
   interaction order changes.

### Validation

For a visual change: from `frontend/`, run `npx expo lint`, `npx tsc --noEmit`,
`npm run format:check`, and `npm test`. Run the one Maestro flow covering the
changed screen. There is no visual regression suite; the review checklist is
the gate.

## Review checklist

- Is hierarchy carried by type and space rather than boxes and shadows?
- At most three type sizes, exactly one `display`?
- Accent under 5% and never used for body text or large fills?
- Fully opaque, with no blur, transparency, gradient, or glow?
- Hairlines and whitespace instead of nested cards?
- 44×44 targets, AA contrast, visible focus, labels, dynamic type?
- Motion only for state or location, and disabled under reduced motion?
- Only semantic tokens, no raw values, vendor files untouched?
- Correct in all three themes and both color modes?
- Stable `testID`s and the affected flow still passes?
