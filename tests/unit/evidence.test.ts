import test from 'node:test';
import assert from 'node:assert/strict';
import { aiService, OFFICIAL_DEMO_MESSAGES } from '../../server/services/aiService';

test('Evidence validation: EXACT_MATCH when verbatim quote and speaker match', () => {
  const result = aiService.validateEvidenceQuote(
    'three distinct initial logo concepts to start',
    'msg-03',
    'Elena Reyes',
    OFFICIAL_DEMO_MESSAGES
  );

  assert.equal(result.status, 'EXACT_MATCH');
  assert.equal(result.speaker, 'Elena Reyes');
});

test('Evidence validation: NEEDS_REVIEW when quote exists but claimed speaker does not match', () => {
  const result = aiService.validateEvidenceQuote(
    'three distinct initial logo concepts to start',
    'msg-03',
    'Alex Morgan', // Claiming Alex said it, when Elena said it
    OFFICIAL_DEMO_MESSAGES
  );

  assert.equal(result.status, 'NEEDS_REVIEW');
  assert.match(result.explanation || '', /speaker claimed/i);
});

test('Evidence validation: NOT_FOUND when quote does not exist in message', () => {
  const result = aiService.validateEvidenceQuote(
    'We also agree to build a full 10-page e-commerce website for free',
    'msg-03',
    'Elena Reyes',
    OFFICIAL_DEMO_MESSAGES
  );

  assert.equal(result.status, 'NOT_FOUND');
  assert.match(result.explanation || '', /could not be located/i);
});

test('Evidence validation: NOT_FOUND when source message ID does not exist', () => {
  const result = aiService.validateEvidenceQuote(
    'three distinct initial logo concepts',
    'msg-999-invalid',
    'Elena Reyes',
    OFFICIAL_DEMO_MESSAGES
  );

  assert.equal(result.status, 'NOT_FOUND');
  assert.match(result.explanation || '', /does not exist/i);
});

test('Official demo extraction parses all agreed terms with verified quotes', () => {
  const extracted = aiService.extractWithDeterministicEngine(OFFICIAL_DEMO_MESSAGES);

  assert.equal(extracted.structuredData.totalPrice, 100);
  assert.equal(extracted.structuredData.advancePayment, 50);
  assert.equal(extracted.structuredData.remainingPayment, 50);
  assert.equal(extracted.structuredData.revisionLimit, 2);
  assert.equal(extracted.structuredData.timelineDays, 7);

  // Every single term must have EXACT_MATCH evidence
  for (const term of extracted.terms) {
    assert.equal(
      term.evidenceStatus,
      'EXACT_MATCH',
      `Term '${term.label}' must have status EXACT_MATCH, but got ${term.evidenceStatus}`
    );
    assert.ok(term.supportingQuote.length > 0, `Term '${term.label}' must have supporting quote`);
  }
});
