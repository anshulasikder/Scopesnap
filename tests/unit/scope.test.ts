import test from 'node:test';
import assert from 'node:assert/strict';
import { aiService } from '../../server/services/aiService';

test('Scope Change Sentinel detects quantity and deliverable changes', async () => {
  const deliverables = [
    'Three distinct initial logo concepts',
    'Transparent PNG files',
    'Adobe Illustrator AI master files',
  ];

  const analysis = await aiService.analyzeScopeChange(
    'Can you also prepare five additional variations?',
    deliverables,
    2,
    100,
    7
  );

  assert.equal(analysis.status, 'POTENTIAL_CHANGE');
  assert.equal(analysis.category, 'QUANTITY');
  assert.ok(analysis.suggestedAddendum, 'Should propose addendum details');
  assert.ok(analysis.suggestedAddendum!.additionalPrice > 0, 'Should suggest additional price');
});

test('Scope Change Sentinel detects revision boundary changes', async () => {
  const deliverables = ['Three distinct initial logo concepts'];

  const analysis = await aiService.analyzeScopeChange(
    'We would like a fourth round of revisions on the color scheme.',
    deliverables,
    2,
    100,
    7
  );

  assert.equal(analysis.status, 'POTENTIAL_CHANGE');
  assert.equal(analysis.category, 'REVISIONS');
});

test('Scope Change Sentinel does not flag ordinary conversational greetings as scope changes', async () => {
  const deliverables = ['Three distinct initial logo concepts'];

  const analysis = await aiService.analyzeScopeChange(
    'Thanks Alex, looking forward to reviewing the concepts next week!',
    deliverables,
    2,
    100,
    7
  );

  assert.equal(analysis.status, 'NO_CHANGE');
  assert.equal(analysis.category, 'NONE');
});
