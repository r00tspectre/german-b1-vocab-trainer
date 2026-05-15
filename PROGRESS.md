# Deutsch B1 Vocabulary Trainer — Project Progress

**Canonical app file:** `german_b1_app.html`
**Design reference:** `stitch_design_upgrade_principles_questions/grammatik_geist/DESIGN.md`
**Baseline status:** Batch 2 content pipeline ready
**Last updated:** 2026-05-15

> Baseline lock: `german_b1_app.html` is the app to keep developing. Older references to `german_b1_dev.html`, `german_b1_trainer.html`, and `design_mockup.html` are legacy only unless those files are restored intentionally.

---

## What This App Is

A single-file HTML/JS/CSS German B1 vocabulary trainer with:
- SM-2+ spaced repetition (custom-tuned)
- Three exercise modes: Typing, Recognition (MC), Cloze
- Progressive word unlock gated by retention performance
- Leech + fragile word system
- Article drill, hesitation tracking, confused-state detection
- Session crash recovery via localStorage
- Export/import backup (JSON, version-validated)
- Streak tracking, session history, weak words panel

---

## Architecture

- **Single HTML file** — no build tools, no frameworks
- **localStorage keys:** `gvt_srs`, `gvt_stats`, `gvt_settings`, `gvt_session`, `gvt_history`
- **Runtime WORDS array** — inline 50-word baseline set across 5 levels (needs expansion to full B1 bank)
- **Canonical content editing surface** — `content/words.baseline.json`, validated by `tools/validate_words.mjs`
- **Sync workflow** — `tools/sync_words.mjs` injects validated JSON into the runtime `WORDS` array
- **SRS object per word** — interval, easeFactor, repetitions, lapses, isLeech, isFragile, isNew, mastered, articleDrills, avgResponseMs, mcExposures, leechCorrect, recentLapses, articleCorrectStreak

---

## CSS / Design Tokens (existing)

```
--bg: #F9F9F9        --surface: #EEEEEE     --card: #FFFFFF
--accent: #414141    --green: #49617f       --red: #6b2e2a
--orange: #8B5E3C    --yellow: #b08A3E      --blue: #48607e
--pink: #6b2e2a      --cyan: #49617f        --text: #1A1C1C
--text-dim: #42474F  --text-muted: #737780
```

**Gender color system (strict):**
- `der` masculine = `--blue` (#48607e)
- `die` feminine  = `--pink` / `--red` (#6b2e2a)
- `das` neuter    = `--cyan` / `--green` (#49617f)

---

## SRS Logic

### Grading (gradeWord)
- Grade 0–5 based on answer type + response time
- `correct` → 5/4/3/2 by time tier (fast/normal/slow/very_slow)
- `typo`    → 4/3/2
- `article` → 3 always; increments `articleDrills`; resets `articleCorrectStreak`
- `confused`→ 0 or 1 (full fail — same as wrong; changed from grade 2)
- `wrong`   → 0 or 1 by time

### EF formula (capped)
```
efDelta = 0.1 - (5-grade)*(0.08+(5-grade)*0.02)
fastBonus = ok && fast ? 0.05 : 0
totalDelta = min(efDelta + fastBonus, 0.1)   ← capped at +0.1
EF = max(1.3, EF + totalDelta)
slow correct: EF -= 0.05 (EF only, no interval penalty)
```

### Intervals
- rep 0 → 1 day, rep 1 → 3 days, rep 2+ → interval × EF

### Leech detection
- 3 lapses in any 10-day window → isLeech = true, EF reset to 2.0
- 2 consecutive correct answers → isLeech = false, isFragile = true
- Leech micro-drill: re-inserted 3–5 cards ahead, max 3 total per word per session

### Fragile
- lapses ≥ 1 AND EF < 2.2 AND not leech

### Article mastery
- 2 consecutive correct non-article answers resets `articleDrills` to 0
- Article drill button hidden again once `articleDrills === 0`

---

## Session Flow

```
buildQueue() → startSession()
  └── showCard()
        ├── isNew + not introduced → showIntro()   [all 3 examples shown]
        ├── in mcMode              → showMCCard()  [diff→same category]
        ├── shouldCloze() (35%)    → showClozeCard()
        └── default                → typing mode
```

### Queue building (adaptive)
- Time-based cap: `sessionMins × 60 / 25s per card`
- Leeches: always included, capped at 5
- Review ratio: 70–85% depending on backlog
- New words: 1 (high load) / 7 (medium) / 10 (low)
- Total queue hard-capped at `2× effectiveCap`

### Progressive unlock
- Gate: avg retention ≥ 80% over last 3 sessions AND min 8 words reviewed
- Fallback: 2-day gap → partial unlock (3 words from next level, stored in `SETTINGS.partialUnlockIds`)
- `partialUnlockIds` capped at 10, pruned on full level unlock

---

## Error Classification (classifyAnswer)

Order of checks:
1. **correct** — exact or umlaut-normalised match
2. **confused** — English answer detected (Levenshtein ≤ 1 vs stripped EN variants)
3. **article** — correct core, wrong/missing article (noun only)
4. **typo** — Levenshtein ≤ 2, min 3 chars
5. **wrong** — everything else

---

## Features Implemented

| Feature | Status |
|---|---|
| SM-2+ SRS core | Complete |
| EF cap (+0.1 max) | Complete |
| Slow penalty (EF only) | Complete |
| Confused = full fail | Complete |
| Leech detection + recovery | Complete |
| Fragile state | Complete |
| Article drills + mastery reset | Complete |
| Hesitation tracking | Partial (no dedicated drill) |
| Typing mode | Complete |
| MC mode (2 rounds) | Complete |
| Cloze mode | Complete |
| Intro card (all 3 examples) | Complete |
| Known word skip | Complete |
| Hard button (throttled 25%) | Complete |
| Progressive unlock | Complete (partial fallback) |
| Crash recovery | Complete + passive save |
| Export/import (validated) | Complete |
| Streak + milestones | Complete |
| Weak words panel | Complete |
| Practice hub screen | Complete |
| Content schema + validator | Complete |
| JSON-to-HTML word sync workflow | Complete |
| Article drill button | Complete |
| Session results screen | Complete |
| Duplicate result guard | Complete |
| Capitalisation soft warning | Complete |
| QuotaExceededError handling | Complete |
| UTC/local date fix | Complete |
| daysBetween floor fix | Complete |
| visibilitychange crash save | Complete |
| Full B1 word bank | **Missing** |
| Audio/TTS | **Missing** |
| Grammar reference screen | Partial (article/preposition tables only) |
| Interactive grammar layer | **Missing** |
| PWA/offline | **Missing** |
| Exam readiness mode | **Missing** |

---

## Known Remaining Risks (minor)

1. Full content bank is still inline in the HTML; scaling to 1,200-1,500 words needs a maintainable content workflow.
2. Word content is not yet validated against a Goethe B1-aligned source list.
3. `partialUnlockIds` is capped at 10 and works for the current 5-level baseline; the unlock model needs redesign before large content expansion.
4. PWA/offline and audio are still missing.
5. Validator warnings currently flag 8 baseline verbs with no exact cloze match; this is acceptable because the app already skips cloze where no exact match exists.

---

## All Fixes Applied (chronological)

### Phase 1 — Critical Fixes
- Timer restore exploit: `elapsedMs` saved + used on restore
- articleDrills reset: 2 consecutive correct non-article answers → reset
- Import validation: version ≥ 2, required fields checked
- EF cap: total delta capped at +0.1
- Double slow penalty removed: EF only, interval untouched
- Confused grade: changed from 2 → 0/1 (full fail)
- clozeTarget cleared in advanceCard()

### Phase 2 — Learning Flow
- Intro card: all 3 examples shown before first quiz
- hlWord() applied to all intro examples
- Gender label (Maskulin/Feminin/Neutrum) shown in intro
- "Already know it" button → markKnown() sets mid-level SRS state
- "Hard" button in feedback → markHard() -0.15 EF, ×0.6 interval

### Phase 3 — Adaptive Session
- Time-based session cap
- Review-first 70–85% ratio
- Leech cap at 5
- Adaptive new word count
- Queue overflow cap (2× effectiveCap)

### Phase 4 — Stability
- gradedIndices Set: persisted in crash save/restore
- checkCloze: duplicate grade guard added
- capWarn: rawAns captured before inp.disabled
- Progressive unlock: partial fallback (3 words, not full level)
- QuotaExceededError: clears history and retries

### Phase 5 — Final Fixes
- microDrillCount persisted in crash snapshot
- markHard: hardApplied Set prevents double-apply per card index
- partialUnlockIds: pruned before adding, capped at 10
- today(): local YYYY-MM-DD (was UTC — broke streak at night)
- daysBetween(): local midnight + Math.floor (was Math.round)
- visibilitychange + pagehide → passive saveCrash()

### Batch 1 — Baseline Stabilization
- Canonical app file locked to `german_b1_app.html`
- Header and code comments moved from preview language to baseline language
- Bottom-nav Practice tab now opens a dedicated Practice screen
- Practice screen exposes Daily, Review Only, Hard Words, Article Drill, and Weak Word Drill entry points
- Dashboard utility spacing corrected so the first utility row no longer reserves bottom-nav padding
- Lexicon top count now reflects the active word count / filtered count
- Dashboard and practice counts now include partial-unlock words consistently
- Crash recovery now persists `hardApplied`, preventing repeat Hard penalties after restore

### Batch 2 — Content Schema + Validation Workflow
- Added `content/word-schema.json` for the target B1 word-bank shape
- Added `content/CONTENT_WORKFLOW.md` with source policy, required fields, level sizing, and batch gates
- Added `content/words.baseline.json`, generated from the current 50 app words with metadata fields
- Added `tools/validate_words.mjs` for no-dependency validation
- Added `tools/sync_words.mjs` to sync validated content JSON into `german_b1_app.html`
- App now exposes `CONTENT_SCHEMA_VERSION` and dynamic `MAX_LEVEL`
- Lexicon search now includes future metadata fields: `topic`, `frequencyBand`, and `tags`
- Export JSON now records `contentSchemaVersion`

---

## Design System

`stitch_design_upgrade_principles_questions/grammatik_geist/DESIGN.md` — current design direction with:
- Fonts: Manrope (display) + Inter (body)
- Integrated surfaces: Dashboard, Lexicon, Practice, Progress reference, Intro, Typing, MC, Cloze, Feedback, Results
- Gender color system, state badges, animation keyframes

Stitch screen references exist under `stitch_design_upgrade_principles_questions/` and have been partially integrated into the canonical app.

---

## Next Phases

| Phase | Description | Priority |
|---|---|---|
| 6 | Content batch 1: first 250 high-frequency daily-life B1 words | High |
| 7 | Content batches 2-6: scale to 1,200-1,500 vetted words | High |
| 8 | Content QA: source verification, duplicate checks, topic balance, sync smoke test | High |
| 9 | Audio: Web Speech API, pronunciation on intro + feedback | Medium |
| 10 | Interactive grammar layer: case drills, verb conjugation, adjective endings | Medium |
| 11 | PWA: service worker, installable, offline | Medium |
| 12 | Exam readiness: Goethe B1 topic map, mock exam mode, readiness score | Low |
| 12 | Exam readiness: Goethe B1 topic map, mock exam mode, readiness score | Low |
