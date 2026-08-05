/**
 * testCSVSignatures.js
 *
 * Validates that all prompts in malicious_prompts.csv are correctly detected
 * by the guardrail rule engine after merging CSV-derived signatures.
 *
 * Run: node backend/scripts/testCSVSignatures.js
 *
 * Output:
 *   PASS  pi-001  jailbreaking
 *   PASS  pi-003  role_playing
 *   MISS  pi-999  obfuscation  ← prints rows the rule engine missed
 *   ...
 *   Summary: 171 / 172 prompts correctly detected (99.4%)
 */

'use strict';

// Load the guardrail service (CSV rules are merged at module load time)
const { runRuleScanner } = require('../services/guardrailService');
const { loadCSVSignatures } = require('../services/csvSignatureLoader');
const fs   = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'malicious_prompts.csv');

// ── Parse CSV ────────────────────────────────────────────────────────────────
function parseCsvLine(line) {
  const result = [];
  let current  = '';
  let inQuotes = false;

  for (let ci = 0; ci < line.length; ci++) {
    const ch = line[ci];
    if (ch === '"') {
      if (inQuotes && line[ci + 1] === '"') { current += '"'; ci++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function loadCSV(filePath) {
  const raw   = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);
  const header = lines[0].split(',');

  const idx = {
    id:         header.indexOf('id'),
    prompt:     header.indexOf('prompt'),
    label:      header.indexOf('label'),
    attack_type:header.indexOf('attack_type'),
  };

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCsvLine(line);
    rows.push({
      id:         (cols[idx.id]          || '').trim(),
      prompt:     (cols[idx.prompt]      || '').trim(),
      label:      (cols[idx.label]       || '').trim().toLowerCase(),
      attack_type:(cols[idx.attack_type] || '').trim().toLowerCase(),
    });
  }
  return rows;
}

// ── Run Tests ────────────────────────────────────────────────────────────────
const rows = loadCSV(CSV_PATH);
const malicious = rows.filter(r => r.label === 'malicious' && r.prompt);

let passCount = 0;
let missCount = 0;
const missed  = [];

console.log(`\n[CSVSignatureTest] Testing ${malicious.length} malicious prompts...\n`);

for (const row of malicious) {
  const result = runRuleScanner(row.prompt);
  const detected = result.ruleBlocked || result.riskScore >= 35;

  if (detected) {
    passCount++;
    console.log(`  PASS  ${row.id.padEnd(10)} ${row.attack_type}`);
  } else {
    missCount++;
    missed.push(row);
    console.log(`  MISS  ${row.id.padEnd(10)} ${row.attack_type}  → prompt: "${row.prompt.slice(0, 60)}..."`);
  }
}

const total = malicious.length;
const rate  = ((passCount / total) * 100).toFixed(1);

console.log('\n' + '─'.repeat(60));
console.log(`Summary: ${passCount} / ${total} prompts correctly detected (${rate}%)`);

if (missCount > 0) {
  console.log(`\n⚠  ${missCount} prompt(s) MISSED by rule engine (consider adding regex rules):\n`);
  for (const row of missed) {
    console.log(`  ID: ${row.id}  |  Attack: ${row.attack_type}`);
    console.log(`  Prompt: "${row.prompt}"\n`);
  }
}

console.log('');
process.exit(missCount > 0 ? 1 : 0);
