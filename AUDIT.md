# Dashboard UI Audit — against the apple-design skill

Branch: `feature/dashboard-apple-ui` · file: `index.html` (single ~15k-line app).
Reference: Emil Kowalski's apple-design skill (`~/.claude/skills/apple-design/SKILL.md`).

The app is a **dark-only** neon dashboard (cyan `--accent: #00f0ff`, purple/pink/blue
glows). It is already reasonably polished — cubic-bezier transitions, translucent
sticky header, a genuinely nice "who's-who intake" overlay (`#asf-overlay`) that is the
most Apple-caliber component in the file (system fonts, tabular-nums, restrained
palette, light+dark, `prefers-reduced-motion`). The main dashboard, by contrast, leans
on decorative motion and lacks a considered load/reveal sequence, press feedback, and a
comprehensive reduced-motion story. Calibration target per the packet: a **utilitarian-
polished product dashboard**, not a flashy landing page — so the fixes below *subtract*
decoration and *add* responsiveness, rather than adding more glow.

Findings are ordered by value. Each has a concrete fix; ✅ = implemented in this pass.

---

## 1. Motion — decoration instead of behavior (skill §§4, 6, 11, 14)

**F1.1 — Full-viewport background animates forever.** `.bg-gradient::before` runs
`gradientMove` 25s infinite alternate over a 200% × 200% surface (index.html:82–107).
The skill (§14) explicitly says *avoid full-viewport moving backgrounds and slow
looping oscillations near 0.2 Hz* — this is a ~0.04 Hz full-screen oscillation. It also
never stops, costing GPU the whole session.
*Fix:* keep it as a static gradient by default; only allow the drift when the user
hasn't asked for reduced motion, and slow/again freeze it under `prefers-reduced-motion`.
✅ Frozen under reduced-motion; kept subtle otherwise.

**F1.2 — Infinite attention-grabbing loops.** `pulse` on `.step-label::before`
(index.html:272), `borderGlow`, `shimmer`, `vpulse`, `mc-blink`, `asf-pulse` all loop
indefinitely. Per §13 (Utility) and §14, perpetual motion trains users to ignore
feedback and is a vestibular problem. Live/"recording" dots earn a pulse; a static
section label does not.
*Fix:* halt all infinite loops under `prefers-reduced-motion`; keep purposeful ones
(live dot) at reduced amplitude. ✅ via a global reduced-motion block.

**F1.3 — No page-load reveal sequence.** Views (`.step`) fade in on *switch*
(`fadeInUp`, index.html:243) but the **first paint** dumps everything at once — no
staggered entrance for the header, feed cards, video grid, or player-view stat panels.
The skill (§8 hint-in-direction, §17 prototype-the-motion) wants an intentional arrival.
*Fix:* a lightweight staggered reveal of top-level sections on load and on view-switch,
using an Apple-ish ease-out curve. ✅ `data-reveal` + IntersectionObserver + load stagger.

**F1.4 — Nothing reveals on scroll.** Long lists (`.videos-grid`, `.pv-points-list`,
player stat cards) appear statically. A gentle in-view reveal adds life without
decoration and telegraphs "there's more here."
*Fix:* IntersectionObserver adds `.in-view` (opacity + 12px rise, once). ✅

**F1.5 — `transition: all` everywhere.** `.btn`, `.video-card`, `.upload-zone`, many
rows use `transition: all …` (index.html:408, 908, 2949, …). §11 says animate only
compositor-friendly `transform`/`opacity`. `all` transitions layout/paint props (e.g.
`border-color`, `box-shadow`) and risks jank.
*Fix:* not rewritten wholesale (risk), but new interactive states are scoped to
`transform`/`opacity`/`box-shadow` and `will-change` is hinted where motion is imminent.

---

## 2. Response & interactive states — feedback missing on press (skill §§1, 10, 16)

**F2.1 — No press-down feedback.** Buttons/cards animate on `:hover` (lift) but have no
`:active` state — §1 is explicit: *respond on pointer-down, not release*; feedback must
live on the press. On touch there is no hover, so today a tap has **zero** feedback
until navigation.
*Fix:* `:active { transform: scale(.97) }` (~100ms ease-out) on `.btn`, `.tabnav-btn`,
`.video-card`, `.bottomnav button`, chips, and the FAB. ✅

**F2.2 — Weak / inconsistent focus-visible.** Inputs get a focus ring
(index.html:680) but buttons, tabs, cards, and links have no keyboard focus indicator —
a wayfinding/accessibility gap (§16). Mouse users shouldn't see rings; keyboard users
must.
*Fix:* a unified `:focus-visible` ring (2px accent + soft `accent-dim` halo) across all
interactive elements. ✅

**F2.3 — Hover lift too aggressive on cards.** `.video-card:hover` rises 4px + big
shadow (index.html:3050) and `.btn-primary:hover` does `translateY(-2px) scale(1.02)`.
Reads slightly "web-flashy." §16 Craft favors restraint.
*Fix:* dial card lift to 2–3px with a tighter, context-aware shadow; keep primary lift
but drop the scale jump. ✅ (softened, not removed.)

---

## 3. Typography — fixed tracking, no optical sizing (skill §15)

**F3.1 — One tracking value doesn't fit all sizes.** Large display type is set with
fixed px tracking: `.step-title` `-1px` at 32px (index.html:385), `.brand-word`
`-0.5px` at 21px (index.html:149), while many small uppercase labels use large positive
tracking. §15: *tracking is size-specific* — large text wants **negative em** tracking,
body near 0, small caps slightly positive. Fixed px doesn't scale with Dynamic Type.
*Fix:* move large headings to em-based negative tracking (`-0.02em`), add
`font-optical-sizing: auto`, keep body near 0, keep small-caps labels positive. ✅

**F3.2 — Leading not tuned to size (§15).** Headings and body share default leading;
large gradient titles read loose. *Fix:* tighten heading `line-height` (~1.05–1.1),
keep body comfortable (~1.5). ✅ on the display headings.

**F3.3 — `-webkit-text-fill-color: transparent` gradient headings** (index.html:386)
can vanish for forced-colors / high-contrast users. *Fix:* provide a solid text
fallback under `prefers-contrast: more` / `forced-colors`. ✅

---

## 4. Color & neutrals (skill §16 Craft, §12)

**F4.1 — Neutrals are pure-white alphas only.** All greys are `rgba(255,255,255,.03…)`
over near-black. Fine for dark, but text-dim at `rgba(255,255,255,.5)` (index.html:59)
is borderline for small labels on translucent surfaces — §12 vibrancy says use *higher
contrast + slightly heavier weight* over blur, not flat 50% grey.
*Fix:* nudge dim text weight/contrast on small labels sitting over glass. ✅ (targeted.)

**F4.2 — Accent glow overused as decoration.** `box-shadow: 0 0 …px var(--accent-glow)`
appears on many resting elements (nav upload, FAB, primary btn, dots). §16 Simplicity:
glow should mark *the* primary action, not everything. Left mostly as-is (brand
identity) but no *new* resting glow was added.

**F4.3 — Semantic stat colors ready for Phase 2.** `--red/--green/--yellow/--blue`
exist and the pv-stat components already color forehand/backhand etc. Good foundation
for the Phase-2 advanced-shot cards (short:long, closed:open, volley:bounce,
forced:unforced) — those should use **semantic** paired colors + an among-shots
(sparkline/among) treatment per §16, first-class cards. Scaffolded, not built (Phase 2).

---

## 5. Materials & depth (skill §12)

**F5.1 — Header is a hard-bordered translucent bar.** `.header` is `backdrop-filter:
blur(20px)` + a 1px bottom border (index.html:110–121). §12 prefers a **scroll-edge
effect** (a fade/mask where content meets floating chrome) over a hard divider, and a
bright top edge to read as real glass.
*Fix:* replace/soften the hard border with a subtle scroll-edge gradient mask; keep the
blur. ✅ (softened border + edge fade.)

**F5.2 — Shadows uniform regardless of surface size.** Small chips and large cards use
similar shadows. §12: bigger surfaces should read thicker (stronger blur + deeper
shadow). *Fix:* scale card shadow depth vs chips. ✅ (modest.)

---

## 6. Hierarchy, spacing & rhythm (skill §16 Simplicity)

**F6.1 — Spacing is fixed px, not a rhythmic scale.** Paddings/margins are ad-hoc
(14px, 20px, 32px, 28px…). Not broken, but no shared spacing scale, so vertical rhythm
drifts. §16 wants deliberate, defensible spacing. *Fix:* introduce spacing/duration/
easing **tokens** as CSS custom properties and use them for the new work, so future
iteration (Phase 2) has a scale to hang off. ✅ tokens added; existing values untouched.

**F6.2 — Layout not fully em/rem based (§15 Dynamic Type).** Fixed px spacing means a
larger OS font can crowd. Noted; broad conversion is out of scope for a polish pass.

---

## What was implemented in this pass (Phase 1)

A single appended `<style>` + small JS module (no existing rules deleted — additive and
reversible; validated with `node --check`). Highlights:

- **Design tokens**: `--ease-out`, `--ease-spring`, `--dur-*`, spacing scale, focus-ring.
- **Page-load reveal sequence** + **scroll reveal** (`data-reveal`, IntersectionObserver),
  Apple ease-out curve, staggered, once-only.
- **Press feedback** (`:active` scale) and a **unified `:focus-visible`** ring on all
  interactive elements.
- **Softened hover lifts**, context-aware card shadow, header **scroll-edge fade**.
- **Typographic tightening**: em-based negative tracking + optical sizing on display
  headings, tuned leading, solid-color fallback for contrast/forced-colors.
- **Comprehensive `prefers-reduced-motion`**: freezes the background drift and all
  infinite loops, converts reveals/springs to instant cross-fades; plus
  `prefers-reduced-transparency` and `prefers-contrast` handling.

## Deliberately left for Phase 2 (packet §Phase 2)
- Rendering `video-data/<gameKey>/stats/advanced_shot_stats.json` as first-class cards
  (short:long, closed:open, volley:bounce, forced:unforced, volley winners:errors) with
  semantic paired color + among-shots/sparkline treatment, populated with the real demo
  game `zane_patel_3ae803ab_2026-08-11_19-59-26__g1`. Scaffolded only.
