# German B1 Content Workflow

Batch 2 locks the content system, not the final word bank. The app still runs as a single HTML file, but future vocabulary work should happen in structured JSON first and only then be synced into the inline `WORDS` array.

## Canonical Files

- `content/word-schema.json` defines the target word-bank shape.
- `content/words.baseline.json` mirrors the current 50-word app seed in that shape.
- `tools/validate_words.mjs` validates content before it reaches the app.
- `tools/sync_words.mjs` injects a validated content file into `german_b1_app.html`.

The app file remains `german_b1_app.html`. The content JSON is the editing surface for future batches.

## Source Policy

Goethe alignment must be handled as source evidence, not as a label we casually attach.

- `sourceStatus: "seed"` means current internal starter content.
- `sourceStatus: "candidate"` means generated or drafted but not checked.
- `sourceStatus: "needs_review"` means a likely good entry with an unresolved issue.
- `sourceStatus: "verified"` means reviewed against an approved B1 source and checked for article, meaning, examples, and grammar.
- `sourceStatus: "rejected"` means do not sync into the app.

Do not paste a copyrighted Goethe wordlist into the repo unless the user explicitly provides a permitted source. For future batches, store source references as metadata such as `goethe_b1`, `frequency_list`, `dictionary`, `corpus`, or `human_review`.

## Required Word Fields

Each word must include:

- `id`: stable positive integer. Never recycle IDs once user progress may exist.
- `de`: German prompt. Nouns include the article, for example `der Termin`.
- `en`: English meaning. Slash-separated variants are allowed for answer classification.
- `partOfSpeech`: noun, verb, adjective, adverb, phrase, connector, preposition, pronoun, determiner, number, or interjection.
- `gender`: `m`, `f`, `n`, or empty string. Nouns must use `m/f/n`; non-nouns must use empty string.
- `cat`: broad app category used by multiple-choice distractors.
- `topic`: human learning topic, for example `doctor-appointments`, `work-email`, `housing`, or `travel`.
- `frequencyBand`: `core_daily`, `high_daily`, `goethe_b1`, `exam_topic`, or `extension`.
- `level`: unlock level. For the large bank, use about 25 words per level.
- `sourceStatus` and `sourceRefs`: evidence trail.
- `examples`: exactly three examples, each with `de`, `en`, and `grammar`.

Optional fields:

- `priorityRank`: lower number means earlier in the word bank.
- `hint`: short memory aid, usage note, or etymology.
- `forms`: plural, perfect, preterite, comparative, superlative, case behavior, fixed preposition.
- `tags`: fine-grained labels for filtering and future practice modes.

## Scaling Plan

Target: 1,200-1,500 words.

Recommended level model:

- 25 words per level.
- 48 levels = 1,200 words.
- 60 levels = 1,500 words.
- Levels 1-12: highest-frequency daily life.
- Levels 13-32: B1 breadth by topic.
- Levels 33-48: exam and formal-life coverage.
- Levels 49-60: extension buffer if the final source list reaches 1,500.

Recommended topic allocation:

- Daily survival: people, family, home, time, food, shopping, transport, health.
- Civic life: appointments, forms, insurance, housing, bank, work, school.
- Communication: opinions, explanations, problems, feelings, connectors.
- Exam tasks: describing images, giving reasons, making suggestions, agreeing/disagreeing, writing formal emails.
- Grammar-heavy words: prepositions, reflexive verbs, separable verbs, case-triggering verbs, adjective/adverb pairs.

## Validation Workflow

Run:

```bash
node tools/validate_words.mjs content/words.baseline.json
```

Use strict mode before syncing a release-sized bank:

```bash
node tools/validate_words.mjs --strict content/words.goethe-b1.json
```

Sync validated content into the app:

```bash
node tools/sync_words.mjs content/words.baseline.json german_b1_app.html
```

Future content batches should follow this order:

1. Draft words in JSON.
2. Mark them `candidate`.
3. Validate.
4. Review source evidence and language quality.
5. Mark accepted entries `verified`.
6. Sync into the app.
7. Smoke test the app.

## Acceptance Gate For Batch 3

Batch 3 can start only when:

- The validator passes on the baseline file.
- The user accepts this schema.
- A permitted Goethe B1-aligned source strategy is chosen.
- The first 250-word topic plan is agreed or explicitly delegated to Codex.
