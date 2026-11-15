# F1 Survey — Brand & Design Guidelines

Derived from the Formula 1 master brand (2017 rebrand by Wieden+Kennedy London /
Monotype) and adapted for this class-project survey app. The official F1 typefaces
(`F1 Regular`, `F1 Turbo`, `F1 Torque`) are proprietary and license-restricted, so
this project uses open alternatives that carry the same angular, speed-oriented
character.

Sources: [F1 Brand Guidelines (2018 deck)](https://www.deck.gallery/formula-1-brand-guidelines),
[Official PDF](https://ajansara.com/wp-content/uploads/F1-Master-Marka-rehberi.pdf),
[F1 trademark guidelines](https://www.formula1.com/en/information/guidelines).

## 1. Color

| Token | Hex | Role |
|---|---|---|
| `f1-red` | `#E10600` | Primary accent. CTA buttons, active states, progress bar, admin highlights. Red "whenever possible" per F1 guidelines. |
| `carbon` | `#15151E` | Page background. F1 Carbon Black — near-black with a steely blue tint. |
| `surface` | `#1C1C28` | Cards, chart surfaces, panels. One step above carbon. |
| `hairline` | `#2B2B3A` | Borders, dividers, input strokes. |
| `baseline` | `#3A3A4C` | Chart baselines, neutral (Likert midpoint) chart segment. |
| `ink` | `#FFFFFF` | Primary text. |
| `ink-2` | `#C8C8D2` | Secondary text, option labels. |
| `muted` | `#7A7A85` | Labels, captions, disabled states. |
| `chart-agree` | `#3987E5` | Chart pole: agree / positive arm. |
| `chart-red` | `#E66767` | Chart pole: disagree / negative arm; nominal bar fill. |

**Chart palette validation** (dataviz six-checks, dark surface `#1C1C28`):
`#E66767` + `#3987E5` — PASS all checks (CVD ΔE 19.2 protan, 29.0 normal-vision,
contrast ≥ 3:1). The Likert neutral midpoint uses `#3A3A4C` deliberately — it must
read as "nothing" (intentionally gray), and every diverging segment carries a
direct label so meaning never rides on color alone.

## 2. Typography

| Use | Font | Notes |
|---|---|---|
| Display / headings / buttons / numbers | **Chakra Petch** (Google Fonts, 600/700) | Angular cut terminals — closest open face to F1's bespoke type. Covers Latin + Vietnamese; CJK and Cyrillic (Mongolian) fall through the stack to system fonts. |
| Body / questions / options | System sans + `Malgun Gothic`, `Apple SD Gothic Neo`, `Microsoft YaHei` | Readability across all 5 survey languages. |

Rules:
- Headlines: **bold, uppercase, +2–4° italic** — the F1 "speed slant".
- Numbers (timer, stats, progress): `tabular-nums`, Chakra Petch.
- No display font on body text. No serif anywhere.

## 3. Shape language

- **Cut corners** (beveled `clip-path` polygon, 10–14px) on buttons and cards —
  the signature F1 angular motif. Two opposite corners cut, never all four.
- Thin hairline borders; no drop shadows on dark surfaces except the red glow
  on the primary CTA.
- Racing-line motif: a thin red diagonal line/skew accent on section headers.

## 4. Motion

| Element | Spec |
|---|---|
| Question change | Slide-in-right + fade, 280ms ease-out; back = slide-in-left. Heading focused + scrolled to top each step (a11y). |
| Option select | 180ms — border snaps to red, background washes `f1-red` at 10%, marker fills, `pop` scale 260ms. |
| Auto-advance | 180ms hold after select, then advance. |
| Invalid Next | Button grayed (`aria-disabled`) until an answer is chosen; clicking shakes it (200ms) + inline coral warning. |
| Finish screen | Checkered-flag wave + rotated "FINISH" stamp slam (450ms), passport-stamp style. |
| Resume | Stage + answers persisted to localStorage; reload resumes at first unanswered question. |
| Motion safety | All decorative motion guarded by `prefers-reduced-motion`. |
| Admin stat tiles | Count-up on load (600ms). |
| Admin bars | Grow from 0 width on mount (400ms ease-out). |
| All hover states | ≤ 200ms; never animate layout of text the user is reading. |

## 5. Interaction

- One question per screen; auto-advance on selection; number keys `1–9` select,
  `←`/`→` navigate, `Enter` = Next/Submit.
- Language switcher: dropdown, top-right, persists in `localStorage`; defaults to Korean (survey's origin language).
- Admin: top bar button → `#/admin`, password gate (`1234`, session-only).
- Every chart: direct labels + tooltip on hover; table view exists (respondents).

## 6. Language matrix

| Code | Name | Notes |
|---|---|---|
| `kr` | 한국어 | Source language (from original docx). Default. |
| `en` | English | Verbatim from docx. |
| `zh` | 中文 | Simplified; system font stack for CJK. |
| `vi` | Tiếng Việt | Chakra Petch covers Vietnamese subset. |
| `mn` | Монгол | Cyrillic; system font fallback. |

⚠ Mongolian and Chinese translations are AI-drafted — have a native speaker
review before distributing.
