#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PARTS_OF_SPEECH = new Set([
  'noun',
  'verb',
  'adjective',
  'adverb',
  'phrase',
  'connector',
  'preposition',
  'pronoun',
  'determiner',
  'number',
  'interjection'
]);

const GENDERS = new Set(['m', 'f', 'n', '']);
const CATEGORIES = new Set([
  'people',
  'family',
  'home',
  'places',
  'food',
  'health',
  'travel',
  'transport',
  'shopping',
  'work',
  'education',
  'bureaucracy',
  'digital',
  'time',
  'nature',
  'emotions',
  'social',
  'media',
  'abstract',
  'verbs',
  'adjectives',
  'adverbs',
  'connectors',
  'grammar',
  'exam',
  'daily'
]);
const FREQUENCY_BANDS = new Set(['core_daily', 'high_daily', 'goethe_b1', 'exam_topic', 'extension']);
const SOURCE_STATUSES = new Set(['seed', 'candidate', 'needs_review', 'verified', 'rejected']);
const SOURCE_TYPES = new Set([
  'internal_seed',
  'goethe_b1',
  'frequency_list',
  'corpus',
  'dictionary',
  'human_review',
  'generated'
]);

function normalizeGerman(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:"'()[\]{}]/g, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

function stripArticle(value) {
  return String(value || '').replace(/^(der|die|das|ein|eine|einen|einem|einer)\s+/i, '').trim();
}

function expectedArticle(gender) {
  if (gender === 'm') return 'der';
  if (gender === 'f') return 'die';
  if (gender === 'n') return 'das';
  return '';
}

function hasExactClozeCandidate(word) {
  const target = normalizeGerman(stripArticle(word.de));
  if (!target || target.includes(' ')) return false;
  return word.examples.some(example => normalizeGerman(example.de).split(' ').includes(target));
}

function pushIssue(target, word, message) {
  const id = word && Number.isInteger(word.id) ? `#${word.id}` : '#?';
  target.push(`${id} ${message}`);
}

export function validateWordBank(data, options = {}) {
  const errors = [];
  const warnings = [];
  const strict = Boolean(options.strict);

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { errors: ['Top-level content must be an object.'], warnings, summary: null };
  }

  if (data.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (!data.meta || typeof data.meta !== 'object') errors.push('meta object is required.');
  if (!Array.isArray(data.words)) errors.push('words must be an array.');

  if (errors.length) return { errors, warnings, summary: null };

  const meta = data.meta;
  if (meta.targetLanguage !== 'de') errors.push('meta.targetLanguage must be "de".');
  if (meta.nativeLanguage !== 'en') errors.push('meta.nativeLanguage must be "en".');
  if (meta.cefr !== 'B1') errors.push('meta.cefr must be "B1".');
  if (!meta.targetWordCount || meta.targetWordCount.min < 1200 || meta.targetWordCount.max > 1500) {
    errors.push('meta.targetWordCount must stay inside the 1200-1500 target range.');
  }
  if (!meta.sourcePolicy || typeof meta.sourcePolicy !== 'string') {
    errors.push('meta.sourcePolicy is required.');
  }

  const ids = new Map();
  const deKeys = new Map();
  const levels = new Map();
  const statusCounts = {};
  const frequencyCounts = {};
  const categoryCounts = {};

  data.words.forEach((word, index) => {
    if (!word || typeof word !== 'object' || Array.isArray(word)) {
      errors.push(`words[${index}] must be an object.`);
      return;
    }

    const label = Number.isInteger(word.id) ? `#${word.id}` : `words[${index}]`;
    const required = [
      'id',
      'de',
      'en',
      'partOfSpeech',
      'gender',
      'cat',
      'topic',
      'frequencyBand',
      'level',
      'sourceStatus',
      'sourceRefs',
      'examples'
    ];

    required.forEach(field => {
      if (!(field in word)) errors.push(`${label} missing required field "${field}".`);
    });

    if (!Number.isInteger(word.id) || word.id < 1) errors.push(`${label} id must be a positive integer.`);
    else if (ids.has(word.id)) errors.push(`#${word.id} duplicate id also used by index ${ids.get(word.id)}.`);
    else ids.set(word.id, index);

    if (typeof word.de !== 'string' || !word.de.trim()) errors.push(`${label} de must be a non-empty string.`);
    if (typeof word.en !== 'string' || !word.en.trim()) errors.push(`${label} en must be a non-empty string.`);
    if (!PARTS_OF_SPEECH.has(word.partOfSpeech)) errors.push(`${label} invalid partOfSpeech "${word.partOfSpeech}".`);
    if (!GENDERS.has(word.gender)) errors.push(`${label} invalid gender "${word.gender}".`);
    if (!CATEGORIES.has(word.cat)) errors.push(`${label} invalid cat "${word.cat}".`);
    if (typeof word.topic !== 'string' || !word.topic.trim()) errors.push(`${label} topic must be a non-empty string.`);
    if (!FREQUENCY_BANDS.has(word.frequencyBand)) errors.push(`${label} invalid frequencyBand "${word.frequencyBand}".`);
    if (!Number.isInteger(word.level) || word.level < 1) errors.push(`${label} level must be a positive integer.`);
    if (!SOURCE_STATUSES.has(word.sourceStatus)) errors.push(`${label} invalid sourceStatus "${word.sourceStatus}".`);

    if (word.partOfSpeech === 'noun') {
      if (!['m', 'f', 'n'].includes(word.gender)) errors.push(`${label} noun must have gender m/f/n.`);
      const article = expectedArticle(word.gender);
      if (article && typeof word.de === 'string' && !word.de.toLowerCase().startsWith(`${article} `)) {
        errors.push(`${label} noun "${word.de}" must start with "${article}".`);
      }
    } else if (word.gender !== '') {
      errors.push(`${label} non-noun must use empty gender.`);
    }

    if (Array.isArray(word.sourceRefs)) {
      if (word.sourceRefs.length === 0) errors.push(`${label} sourceRefs must include at least one source.`);
      word.sourceRefs.forEach((source, sourceIndex) => {
        if (!source || typeof source !== 'object' || Array.isArray(source)) {
          errors.push(`${label} sourceRefs[${sourceIndex}] must be an object.`);
          return;
        }
        if (!SOURCE_TYPES.has(source.type)) errors.push(`${label} invalid source type "${source.type}".`);
        if (typeof source.ref !== 'string' || !source.ref.trim()) errors.push(`${label} source ref must be non-empty.`);
      });
    } else {
      errors.push(`${label} sourceRefs must be an array.`);
    }

    if (Array.isArray(word.examples)) {
      if (word.examples.length !== 3) errors.push(`${label} must have exactly three examples.`);
      word.examples.forEach((example, exampleIndex) => {
        if (!example || typeof example !== 'object' || Array.isArray(example)) {
          errors.push(`${label} examples[${exampleIndex}] must be an object.`);
          return;
        }
        ['de', 'en', 'grammar'].forEach(field => {
          if (typeof example[field] !== 'string' || !example[field].trim()) {
            errors.push(`${label} examples[${exampleIndex}].${field} must be non-empty.`);
          }
        });
      });
    } else {
      errors.push(`${label} examples must be an array.`);
    }

    const deKey = normalizeGerman(word.de);
    if (deKey) {
      if (deKeys.has(deKey)) errors.push(`${label} duplicate German entry also used by #${deKeys.get(deKey)}.`);
      else deKeys.set(deKey, word.id);
    }

    if (word.sourceStatus === 'verified') {
      const sourceTypes = Array.isArray(word.sourceRefs) ? word.sourceRefs.map(source => source.type) : [];
      if (!sourceTypes.includes('goethe_b1') && !sourceTypes.includes('human_review')) {
        pushIssue(warnings, word, 'is verified without goethe_b1 or human_review source evidence.');
      }
    }

    if (word.sourceStatus === 'candidate' || word.sourceStatus === 'needs_review') {
      pushIssue(warnings, word, `still has sourceStatus "${word.sourceStatus}".`);
    }

    if (!hasExactClozeCandidate(word)) {
      pushIssue(warnings, word, 'has no exact cloze match in examples; cloze may be skipped for this word.');
    }

    levels.set(word.level, (levels.get(word.level) || 0) + 1);
    statusCounts[word.sourceStatus] = (statusCounts[word.sourceStatus] || 0) + 1;
    frequencyCounts[word.frequencyBand] = (frequencyCounts[word.frequencyBand] || 0) + 1;
    categoryCounts[word.cat] = (categoryCounts[word.cat] || 0) + 1;
  });

  const levelSize = data.meta?.build?.levelSize;
  if (Number.isInteger(levelSize)) {
    for (const [level, count] of levels) {
      if (count > levelSize) {
        warnings.push(`Level ${level} has ${count} words, above configured levelSize ${levelSize}.`);
      }
    }
  }

  if (strict) {
    const nonVerified = data.words.filter(word => !['verified', 'seed'].includes(word.sourceStatus));
    if (nonVerified.length) {
      errors.push(`Strict mode found ${nonVerified.length} non-verified/non-seed words.`);
    }
    if (warnings.length) {
      errors.push(`Strict mode treats ${warnings.length} warning(s) as blocking.`);
    }
  }

  const summary = {
    words: data.words.length,
    levels: levels.size,
    statusCounts,
    frequencyCounts,
    categoryCounts
  };

  return { errors, warnings, summary };
}

export function validateWordFile(filePath, options = {}) {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    return {
      data: null,
      errors: [`Could not parse JSON: ${error.message}`],
      warnings: [],
      summary: null
    };
  }
  const result = validateWordBank(data, options);
  return { data, ...result };
}

export function formatValidationResult(result) {
  const lines = [];
  if (result.summary) {
    lines.push(`Words: ${result.summary.words}`);
    lines.push(`Levels: ${result.summary.levels}`);
    lines.push(`Source status: ${JSON.stringify(result.summary.statusCounts)}`);
    lines.push(`Frequency bands: ${JSON.stringify(result.summary.frequencyCounts)}`);
  }
  if (result.errors.length) {
    lines.push('');
    lines.push(`Errors (${result.errors.length}):`);
    result.errors.forEach(error => lines.push(`- ${error}`));
  }
  if (result.warnings.length) {
    lines.push('');
    lines.push(`Warnings (${result.warnings.length}):`);
    result.warnings.forEach(warning => lines.push(`- ${warning}`));
  }
  if (!result.errors.length) {
    lines.push('');
    lines.push('Validation passed.');
  }
  return lines.join('\n');
}

function runCli() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const filePath = args.find(arg => arg !== '--strict');
  if (!filePath) {
    console.error('Usage: node tools/validate_words.mjs [--strict] content/words.baseline.json');
    process.exit(2);
  }
  const result = validateWordFile(filePath, { strict });
  console.log(formatValidationResult(result));
  process.exit(result.errors.length ? 1 : 0);
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) runCli();
