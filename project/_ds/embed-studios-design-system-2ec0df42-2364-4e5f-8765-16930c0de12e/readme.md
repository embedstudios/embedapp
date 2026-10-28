# Embed Studios — Design System

A brand-identity system for **Embed Studios**, a UX/UI design studio for
digital products ("We embed user experience with your digital products").
This system captures the studio's *brand* foundations — logo, colour, type
and voice — plus the small set of UI primitives the brand collateral uses.

## Scope & sources

Built from the **`Final-Logo-2`** page of the attached Figma file
*"Hello Embed – Partial file saved 29-07-2026.fig"* (the frames the user
scoped this build to), plus two uploaded logo lockups:

- `uploads/black.svg` → `assets/logo-dark.svg` (full lockup, #333)
- `uploads/White.svg` → `assets/logo-light.svg` (full lockup, #FAFAFA)
- Logo mark + wordmark SVGs extracted from `Final-Logo-2`

> **Two layers live here.** (1) The **Embed Studios studio brand** — logo,
> palette, DM Sans / DM Mono type, the code-tag voice, and the mint pill
> `Button` — drawn from the scoped `Final-Logo-2` page. (2) The **product
> UI kit** the studio designed inside the file (a bot-builder / travel
> product with its own Nunito Sans + blue `#003CFF` system), materialised
> into `components/product/` and `components/icons/`. The two systems keep
> separate palettes and typefaces on purpose — use the brand layer for
> Embed's own marketing, the product layer for product screens.

Contact seen in the file: `hello@embed.design`, `careers@embed.design`,
`arnav@embeddesign.in`.

## Index

- **`styles.css`** — entry point; `@import`s every token + font file.
- **`tokens/`** — `colors.css`, `typography.css`, `spacing.css`, `fonts.css`.
- **`assets/`** — logo lockups (`logo-dark`, `logo-light`), `logomark.svg`, `wordmark.svg`.
- **`components/`** — brand primitives `Button`, `Logo`, `CodeTag` (each `.jsx` + `.d.ts` + `.prompt.md` + card).
- **`components/icons/`** — `Icon` + `icon-data.js` (46 product glyphs).
- **`components/product/`** — the materialised product UI kit (~109 components).
- **`ui_kits/brand-collateral/`** — website hero, hiring story, tagline card.
- **`guidelines/`** — foundation specimen cards (Colors, Type, Spacing, Brand).
- **`SKILL.md`** — Agent-Skill wrapper.

### Brand components (`components/`)
- **Button** — mint pill CTA; `primary` / `secondary` / `link`, three sizes.
- **Logo** — brand lockup, mark, or wordmark in `dark` / `light` / `mint`.
- **CodeTag** — the signature `<tag>…</tag>` voice line in DM Mono.

### Icons (`components/icons/`)
- **Icon** — one component over `icon-data.js` (46 product glyphs; `currentColor`).
  Names: ActionCloseStroke, ActionFavorite, ActionSearch24px, ActionSearchStroke,
  ArrowsExpand, ArrowsLogout, AuthoringAttach, AuthoringImageAlt, AuthoringText,
  Basics* (Add, AddSmall, ArrowLeft, ArrowLeftSmall, ArrowRightSmall,
  CaretVerticalSmall, DownSmall, Heart, Left, Minus, MinusCircle, PlusCircle,
  Question, RightSmall, Search, Star, Tick, TickSmall, Up, UpSmall, XCircle,
  XSmall), Essentials* (Bell, Bookmark, Chat, Cog, Flag, FlagAlt, Home, Send,
  Share, UserCircle, UserPlus), Interface* (AdjustVerticalAlt, GridLayout,
  MoreHorizontal).

### Product UI kit (`components/product/`)
Materialized from the source file's product component library (a bot-builder /
travel product; Nunito Sans, blue `#003CFF`). Full inventory:

ActionCards, ActionCloseStrokeSmall, ActionListBotBuilder, ActionListLanding,
AuthoringImageAlt, AuthoringText, Avatar, Avatar3, Avatar5, Avatar6, BOTActions,
Badge, Badge3, BasicsAdd, BasicsAdd2, BasicsAddSmall, BasicsAddSmall2,
BasicsMinus, BasicsQuestion, BasicsTick, Breadcrumb, BreadcrumbDivider,
BreadcrumbDivider2, BreadcrumbItem, Button2, Button5, ButtonLarge, ButtonMedium,
ButtonSmall, ButtonSmall2, ButtonUnfilled, ChatListItem, Checkbox, Checkbox3,
Component1, DescriptiveArrowReloadHorizontal, DescriptiveDiamond02,
DescriptiveDocumentValidation, DescriptiveExploreColor, DescriptiveExploreStroke,
DescriptiveGlobe, DescriptiveHomeStroke, DescriptiveHotelsThin,
DescriptiveInboxColor, DescriptiveInboxStroke, DescriptiveMoonSlowWind,
DescriptivePassport, DescriptivePeopleColor, DescriptivePeopleStroke,
DescriptivePreference, DescriptiveProfileColor, DescriptiveProfileStroke,
DescriptiveSearchColor, DescriptiveSearchStroke, DescriptiveSparkles,
DescriptiveStars, DescriptiveTickStroke, DescriptiveTicketStar,
DescriptiveTimer02, DescriptiveTripsColor, DescriptiveTripsStroke,
DescriptiveUserStatus, DescriptiveViewOff, DescriptiveWifiDisconnected01,
DirectionDown, DirectionsCar, Divider, EditionStampMedium,
EssentialsUserCircle, EssentialsUserCircle2, HighlightStamp, IOSHomeIndicator,
IPhoneBezel, IconGrid, IconPlaceholder2, Inclusions, NavigationTab, NumberBadge,
Option, Photo, ProductButton,
SegmentItemActive, SegmentItemDefault, SegmentedControlItem,
SegmentedControlTemplate, Slider, StampCategories, StatusBarTime, TabConfirm,
TableCell, TableCell3, TabsItem, Tag, Tag2, TagSize4, TechnologyKeyboard,
Testimonials, TextInput, TextInput2, TimeQuarterPass, Toggle, Toggle4, Tooltip,
TooltipTopBottom, VariationsInviteStamps, Verfied, Voice.

> Names with numeric suffixes (`Avatar3`, `Badge3`, `Checkbox3`…) are alternate
> variant masters of the same family that carry different baked overrides.
> `ProductButton` is the product's own button family (renamed to avoid a clash
> with the brand `Button`). Some materialized sources are large (variant trees
> baked inline) — treat them as faithful references rather than lean primitives.

#### Intentional additions
- **Logo** and **CodeTag** encode the two things that make the studio brand
  recognisable — the mark and the code-tag voice. Faithful to the source (real
  mark SVG; the exact `<hi>` / `<hiring>` device), not invented UI.
- **Icon**, **Ic24Fire**, **Ic24OutlinedChevronRight** are the file's
  own glyphs, kept under tidy wrapper names.

#### Intentionally not built
A handful of source items are one-off campaign artwork or layout frames, not
reusable primitives, so they are skipped: `Boarding Pass`, `16 - Ecommerce
card`, `Featured cards`, `carousel-slider`, `border`, `Edition Stamp - Small`,
and assorted `Group …` / `Frame …` wrappers. Ask if you want any of these
recreated as a component.

---

## CONTENT FUNDAMENTALS

**Voice is the whole brand.** Every headline is written as if it were a line
of markup — the message wrapped in an angle-bracket tag:

- `<hi> We embed user experience with your digital products </hi>`
- `<hiring> We are looking for UI Designers — Design Systems to join us </hiring>`

The tag word names the *intent* of the line (`hi`, `hiring`, `about`). This
is the design-meets-code positioning made literal, and it always appears in
**DM Mono**, never DM Sans.

- **Casing:** sentence case in the message; the tag word is lowercase.
- **Person:** first-person plural — "**We** embed…", "**We** are looking for…".
  Warm and direct; the studio speaks as a team, to a "you".
- **Length:** short. One idea per tag. No marketing padding.
- **Punctuation:** minimal. Em dash for the aside ("UI Designers — Design Systems").
- **Emoji:** none. The angle-bracket tag *is* the ornament.
- **Vibe:** confident, craft-led, a little playful; developer-adjacent but
  human. Product-focused ("digital products", "design systems").
- **CTA copy:** plain and imperative — "Join Us", "Start a project", "Let's talk".

## VISUAL FOUNDATIONS

- **Colour:** a tight, high-contrast palette, dark-first for the AI-studio
  direction. **Ink `#0B0F0E`** is the primary canvas with **`#141A18`** as the
  raised surface; **off-white `#FAFAFA` / white** is the light paper. Legacy
  **charcoal `#333333`** is retained for imported product tokens. **Mint
  `#AFFCCE`** is the *single* accent — reserved for CTAs and the occasional
  highlighted word; use it sparingly so it stays loud. Greys (`#999`, `#DADADA`,
  `#505050`) carry meta text and hairlines. A set of deep **blues** (`#2D4EBF`,
  `#110B86`, sky `#3E98D4`) appears only on social/creative collateral.
- **Type:** three families. **Space Grotesk** for display + headings — the
  wordmark is Space Grotesk Medium (500) with tight **−0.04em** tracking, a look
  worth echoing in big headings. **Inter** for body / UI text. **DM Mono** is
  the voice font for all tag-wrapped copy and small meta labels (line-height ~1.44).
- **Backgrounds:** mostly flat, full-bleed fields of charcoal or white; some
  collateral sits full-bleed photography or a flat blue. No gradients, no
  noise, no repeating patterns in the brand system itself.
- **Shape & radius:** CTAs are **fully-rounded pills**; cards use a soft **10px**
  corner (seen on the collateral). Otherwise geometry is square and calm.
- **Borders:** 1px hairlines in `#DADADA` on light, `rgba(255,255,255,.12)` on
  dark. Secondary buttons use a **2px mint inset outline** (from the source's
  6.3px stroke on the large poster button, scaled to UI size).
- **Elevation:** essentially flat. One soft shadow (`0 8px 24px rgba(0,0,0,.08)`)
  is available for lifted cards; most surfaces have none.
- **Animation:** restrained. Buttons **press to 0.97 scale** with a ~120ms
  ease; hovers are gentle opacity shifts (~0.7). No bounces or elaborate motion.
- **Hover / press:** hover → slight opacity drop or fill shift; press → scale
  down. Links underline with a 4px offset.
- **Imagery vibe:** where photography is used it's clean and neutral; the mark
  sits on top in white. The brand mostly prefers type-on-colour over imagery.
- **Cards:** flat, 10px corners, 1px hairline or no border, minimal/no shadow.

## ICONOGRAPHY

The scoped brand page is **icon-light** — it carries the **logo mark** (a
woven-"E" knot) and the **wordmark**, not a UI icon set. Approach:

- The **mark** (`assets/logomark.svg`, and inlined in `components/Logo`) uses
  `fill="currentColor"`, so it recolours via CSS `color` — use it for
  favicons, avatars and tight spaces.
- **No emoji, no unicode glyphs** are used as icons anywhere in the brand.
- The one recurring "glyph" is typographic: the **angle-bracket `< >`** of the
  code-tag voice (see `CodeTag`) — treat it as the brand's ornament.
- The wider Figma file *does* contain a ~160-glyph product icon set (Basics /
  Arrows / Authoring families), but those live on the out-of-scope product
  pages. If you need them, re-scope the import and they can be materialised as
  an icon-data set. For now, if a UI needs generic icons, use a CDN set with a
  **thin, rounded** stroke to match DM Sans' geometry (e.g. Lucide) and flag it.

---

## Iterate with me

The full source component inventory is now imported (112 built vs 97 kit
families — brand primitives + the product UI kit + the icon set). Open items:

- The materialised product components bake their variant trees inline, so a
  few files are large (`Button5`, `Avatar`). If you rely on a specific one
  heavily, I can hand-slim it into a lean prop-driven primitive.
- The product kit ships its own multi-theme token file (28 theme scopes:
  light/dark + colour modes). Tell me which theme is the default and I'll
  pin it.
- Happy to add self-hosted font files (DM Sans / DM Mono / Nunito Sans)
  instead of Google Fonts if you'd prefer.
