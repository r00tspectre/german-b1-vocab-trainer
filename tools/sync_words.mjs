#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { validateWordFile, formatValidationResult } from './validate_words.mjs';

const DEFAULT_HTML = 'german_b1_app.html';

function appWord(word) {
  return {
    id: word.id,
    de: word.de,
    en: word.en,
    gender: word.gender,
    cat: word.cat,
    topic: word.topic,
    frequencyBand: word.frequencyBand,
    partOfSpeech: word.partOfSpeech,
    level: word.level,
    priorityRank: word.priorityRank,
    hint: word.hint || '',
    tags: word.tags || [],
    forms: word.forms || {},
    sourceStatus: word.sourceStatus,
    sourceRefs: word.sourceRefs,
    examples: word.examples
  };
}

function buildWordsBlock(words) {
  return `const WORDS = ${JSON.stringify(words.map(appWord), null, 2)};`;
}

function syncWords(contentPath, htmlPath) {
  const validation = validateWordFile(contentPath);
  if (validation.errors.length) {
    console.error(formatValidationResult(validation));
    process.exit(1);
  }

  const absoluteHtmlPath = path.resolve(htmlPath);
  const html = fs.readFileSync(absoluteHtmlPath, 'utf8');
  const nextBlock = buildWordsBlock(validation.data.words);

  const nextHtml = html.replace(
    /const WORDS = \[[\s\S]*?\n\];\n\nconst MAX_LEVEL = /,
    `${nextBlock}\n\nconst MAX_LEVEL = `
  );

  if (nextHtml === html) {
    throw new Error('Could not find inline WORDS block in app HTML.');
  }

  fs.writeFileSync(absoluteHtmlPath, nextHtml);
  console.log(formatValidationResult(validation));
  console.log('');
  console.log(`Synced ${validation.data.words.length} words into ${htmlPath}.`);
}

const args = process.argv.slice(2);
const contentPath = args[0];
const htmlPath = args[1] || DEFAULT_HTML;

if (!contentPath) {
  console.error('Usage: node tools/sync_words.mjs content/words.baseline.json [german_b1_app.html]');
  process.exit(2);
}

syncWords(contentPath, htmlPath);
