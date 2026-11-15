# F1 World Championship Survey

A bilingual (5-language) survey web application that asks one research question: **what matters more for winning the F1 World Championship — driver skill, or team performance?** Respondents answer 8 questions on any device; every submission is stored in a cloud database with technical metadata (IP address, timestamp), and the organizer reviews results live in a password-protected admin dashboard.

> Class project — built to demonstrate a complete, real-world data-collection pipeline: frontend → REST API → managed Postgres → aggregation → export.

**Live site:** https://shreyashrestha094-coder.github.io/F1-survey/
**Source:** https://github.com/shreyashrestha094-coder/F1-survey

---

## 1. Tech Stack

| Layer | Technology | Role |
|---|---|---|
| UI framework | **React 18** | Component-based single-page app (SPA). One component per survey stage (Intro → Survey → Done → Admin). |
| Build tool | **Vite 6** | Dev server + production bundler. Produces static files (HTML/CSS/JS) that need no server to run. |
| Styling | **Tailwind CSS 4** | Utility-first CSS. Brand tokens (F1 Red `#E10600`, Carbon `#15151E`) defined in `src/index.css`. |
| Typography | **Chakra Petch** (Google Fonts) | Open display font standing in for F1's proprietary brand typeface (see `docs/design.md`). |
| Charts | **Custom SVG/HTML** (no chart library) | Horizontal bar charts for nominal questions, diverging stacked bars for Likert questions. Palette validated for color-blind safety. |
| Database | **Supabase (managed PostgreSQL)** | Stores every response. Free tier. Accessed directly from the browser over HTTPS REST (PostgREST). |
| Hosting | **GitHub Pages + GitHub Actions** | Every push to `main` automatically builds with Vite and deploys the `dist/` folder. |
| Language support | Korean, English, 中文 (Chinese), Tiếng Việt, Mongolian | All strings live in two files: `src/data/questions.js` and `src/i18n.js`. |

**Why a static site + Backend-as-a-Service?** GitHub Pages can only serve files — it cannot run server code or store data. Instead of operating our own server, the browser talks to Supabase's REST API directly, secured by Row Level Security (Section 5).

---

## 2. System Architecture

```
 Respondent's browser                    GitHub Cloud                 Supabase Cloud
┌─────────────────────┐  git push   ┌──────────────┐  deploy   ┌─────────────────────┐
│  React SPA (Vite)   │───────────▶│ GitHub Actions│─────────▶│  GitHub Pages (CDN) │
│  - Survey form      │            │  npm build    │          │  serves static files │
│  - Race-track SVG   │            └──────────────┘           └──────────┬──────────┘
│  - Admin dashboard  │                                                  │ URL of site
└──────────┬──────────┘                                                  ▼
           │  fetch() over HTTPS                                          ▼
           │  (anon key in header)                              Respondent loads the SPA
           ▼
┌──────────────────────────────────────────┐      ┌───────────────────────────┐
│ Supabase REST API (PostgREST)            │      │ ipify.org API             │
│  POST /rest/v1/responses  ← insert row   │      │  returns respondent's     │
│  GET  /rest/v1/responses  ← admin reads  │      │  public IP address        │
│  Enforces Row Level Security policies    │      └───────────────────────────┘
└───────────────┬──────────────────────────┘
                ▼
┌──────────────────────────────────────────┐
│ PostgreSQL table: public.responses       │
│  id | created_at | ip_address |          │
│  user_agent | q1…q8                      │
└──────────────────────────────────────────┘
```

---

## 3. The Survey Flow (what the respondent experiences)

1. **Intro** — research purpose, instructions, anonymity notice. Language dropdown (5 languages) in the header; choice is saved to `localStorage`.
2. **Survey** — one question per screen:
   - An SVG **race-track progress indicator** shows a car driving one corner per question (done corners fill red, the current corner pulses).
   - Answers are single-choice; picking one auto-advances after 180 ms.
   - Keyboard support: number keys select, ←/→ navigate, Enter submits.
   - Motion respects the OS `prefers-reduced-motion` setting.
   - Progress (current question + answers) is saved to `localStorage`, so an accidental reload resumes at the first unanswered question instead of restarting.
3. **Submit** — the browser assembles the payload and writes it to Supabase (Section 4).
4. **Done** — checkered-flag animation + "FINISH" stamp. A copy of the respondent's own answers can be downloaded as JSON. Nothing identifiable is shown or asked.

## 4. Data Collection & Processing Flow (step by step)

Each submission goes through this exact pipeline:

```
[1] Respondent answers all 8 questions
        │  answers = { q1: 2, q2: 5, ... }   (values are 1-based option numbers)
        ▼
[2] Browser fetches the public IP
        │  GET https://api.ipify.org?format=json  →  "203.0.113.45"
        ▼
[3] Browser builds one database row
        │  { q1: 2, ..., q8: 5,
        │    ip_address: "203.0.113.45",
        │    user_agent: "<browser string>" }
        │  (created_at is set by the database itself, see Section 6)
        ▼
[4] HTTPS POST to Supabase REST endpoint
        │  POST https://<project>.supabase.co/rest/v1/responses
        │  headers: apikey + Authorization: Bearer <anon key>
        │  Supabase checks Row Level Security (RLS) policies → allows INSERT
        ▼
[5] Row is stored in PostgreSQL
        │  id (auto-increment) | created_at (server clock, UTC)
        ▼
[6] Respondent sees the Done screen; the JSON copy they may download
    is generated purely in the browser (never sent anywhere else).
```

**How the admin reads the data:**

```
[7] Organizer opens the hidden dashboard URL:
        …/F1-survey/#/admin   (or …/F1-survey/admin — a 404-page
        shim redirects it into the hash route)
    There is no visible button; only the organizer knows the URL.
        ▼
[8] Password gate — compared against a constant in the app bundle,
    success stored in sessionStorage (dies when the tab closes)
        ▼
[9] GET /rest/v1/responses?order=created_at.desc&limit=1000
        │  RLS SELECT policy allows the anon role to read
        ▼
[10] Aggregation happens client-side (plain JS over the rows):
         - Stat tiles: total responses, last 24 h, last 7 days, unique IPs
         - Q1–Q4, Q8 → horizontal bar chart of option counts + %
         - Q5–Q7 (Likert agree/disagree) → diverging stacked bar
           centered on "neutral" (red = disagree, gray = neutral, blue = agree)
         - Respondents table: timestamp | IP | answers Q1–Q8
        ▼
[11] "Export CSV" builds a UTF-8 CSV in the browser and downloads it.
     Columns: created_at, ip_address, q1..q8 (numeric option codes for
     analysis), then q1_en..q8_en and q1_kr..q8_kr (the answer text in
     English and Korean) so the file is readable without a codebook.
     Analysis (e.g., SPSS / Excel / Python) uses this file.
```

### Question design

| # | Question (EN) | Scale type | Chart used in admin |
|---|---|---|---|
| Q1 | How much do you know about F1? | Nominal, 4 options | Bar |
| Q2 | What interests you most in F1? | Nominal, 5 options | Bar |
| Q3 | Most important factor to become champion? | Nominal, 5 options | Bar |
| Q4 | Driver skill vs car performance? | Ordinal (5-point bipolar) | Bar |
| Q5 | Can a great driver win in a bad car? | **Likert** (strongly agree → strongly disagree) | Diverging stacked bar |
| Q6 | Can a good car carry an average driver? | **Likert** | Diverging stacked bar |
| Q7 | Do results change after a team switch? | **Likert** | Diverging stacked bar |
| Q8 | What matters when supporting a team? | Nominal, 6 options | Bar |

## 5. Data Storage Schema

```sql
create table responses (
  id          bigint generated by default as identity primary key,
  created_at  timestamptz not null default now(),  -- server clock, not respondent's
  ip_address  text,        -- public IP via ipify (may be null if the lookup fails)
  user_agent  text,        -- browser/device string (for identifying bot/duplicate entries)
  q1 int, q2 int, q3 int, q4 int,          -- 1-based option numbers
  q5 int, q6 int, q7 int, q8 int
);
```

**Row Level Security** — the `anon` (public) key ships with the app, so the database must assume *anyone* holds it:

| Policy | Effect |
|---|---|
| `anon can insert` (with check true) | Anyone may submit a response. |
| `anon can select` (using true) | Anyone may read rows — required because the admin dashboard runs entirely in the browser. |
| *(no update / delete policy)* | Submitted rows **cannot be edited or deleted** through the public API. Corrections happen only from the Supabase dashboard (organizer-only, behind Supabase login). |

The full setup script is `supabase-setup.sql` — paste it into the Supabase SQL Editor to reproduce the database.

## 6. Privacy & Data-Protection Rules

This survey is run as an **anonymous** academic survey. The following rules are the project's privacy policy:

1. **No direct identifiers.** The survey never asks for name, email, phone, student ID, or any account login. Responses cannot be linked back to a person by the content of the answers.
2. **What technical data is kept, and why:**
   - **IP address** — captured to detect duplicate submissions and abuse (e.g., one person flooding the survey). Public IPs are routinely shared by many households/devices (NAT), so an IP is *not* proof of identity.
   - **User agent** — browser/device string, used to recognize obvious bot or test entries.
   - **Timestamp** — set by the server (UTC), used only in aggregate (responses per day).
3. **Proportionality.** Only fields the analysis needs are stored. Nothing else is logged — no cookies for tracking, no third-party analytics, no fingerprinting scripts, no referrer tagging.
4. **Purpose limitation.** Data is used solely for this class project's analysis. It will not be published per-row, shared with third parties, or used for any other purpose.
5. **Access control.** The admin dashboard (viewing raw rows including IPs) has no visible link on the survey site — it lives behind an unlisted route (`#/admin`, also reachable via `/admin` through the 404-page shim) and is password-gated; the password lives only with the organizer. Respondents can never see other respondents' data.
6. **Immutability for integrity, deletion by the organizer.** The public API cannot update or delete rows (protects data from tampering). The organizer can delete entries (e.g., test rows) from the Supabase dashboard.
7. **Retention.** Data is kept only as long as the project needs it (through grading); the table can then be dropped from the Supabase dashboard.
8. **Honest disclosure.** The intro screen tells respondents the survey is anonymous and used for a class project. IP capture is for duplicate/abuse detection and is disclosed here.

**Known limitations (stated openly):**
- The admin password is checked client-side, so it is visible in the public JavaScript bundle. It protects against casual access only. A production version would verify the password server-side (e.g., a Supabase Edge Function) and expose read access only after that check.
- IP capture is client-side (ipify) and therefore spoofable by a determined user.
- Because there is no login, true duplicate prevention is impossible — the IP/user-agent heuristics are the only signal.

## 7. Project Structure

```
app/
├── index.html                  # entry, loads fonts + root div
├── vite.config.js              # build config, base path for GitHub Pages
├── supabase-setup.sql          # database schema + RLS policies (run once)
├── public/404.html             # SPA shim: unknown paths redirect into the hash
│                               #   router — /F1-survey/admin → /F1-survey/#/admin
├── docs/design.md              # brand & design guidelines (colors, type, motion)
├── .github/workflows/deploy.yml# CI: build + deploy to GitHub Pages on push
├── public/images/              # static images (hero photo, texture)
└── src/
    ├── main.jsx                # React bootstrap
    ├── App.jsx                 # stage router: Intro → Survey → Done (+ hash route #/admin)
    ├── Survey (in App.jsx)     # one question per screen, keyboard + resume support
    ├── RaceProgress.jsx        # SVG race-track progress with moving car
    ├── Admin.jsx               # password gate + dashboard (tiles, charts, table, CSV)
    ├── components.jsx          # header, language dropdown
    ├── supabase.js             # all API calls (insert, select) + ipify lookup
    ├── i18n.js                 # UI strings × 5 languages
    └── data/questions.js       # 8 questions + options × 5 languages
```

## 8. Reproducing / Running the Project

```bash
npm install        # install dependencies
npm run dev        # local dev server (http://localhost:5173)
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

Backend setup: create a free Supabase project → run `supabase-setup.sql` in the SQL Editor → paste the project URL and publishable (anon) key into `src/supabase.js`. Deployment is automatic on push to `main` (GitHub Actions → GitHub Pages).

## 9. Design Reference

Visual identity follows `docs/design.md`: F1 Red `#E10600` on Carbon Black `#15151E`, angular cut-corner shapes, italic uppercase display type, and a race-track progress metaphor for question navigation. Chart colors were validated for color-vision-deficiency safety and contrast; the Likert neutral segment is deliberately gray with direct percentage labels so no meaning depends on color alone.

---

*Prepared as a course-project reference document. Questions about methodology: contact the survey organizer (repo owner).*
