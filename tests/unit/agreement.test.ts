import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCanonicalAgreement, deterministicStringify } from '../../src/utils/canonical';
import { cryptoService } from '../../server/services/cryptoService';

test('Canonical agreement normalizes and sorts fields deterministically', () => {
  const inputA = {
    projectName: '  Logo Design Project  ',
    projectDescription: 'Brand identity refresh',
    client: { name: 'Elena Reyes', organization: ' Atelier Monolith ', email: 'Elena@AtelierMonolith.COM' },
    freelancer: { name: 'Alex Morgan', email: 'Alex@AlexMorganDesign.com' },
    deliverables: ['Transparent PNG files', 'Adobe Illustrator AI master files', 'Three distinct initial logo concepts'],
    revisionLimit: 2,
    totalPrice: 100,
    advancePayment: 50,
    remainingPayment: 50,
    currency: 'usd',
    timelineDays: 7,
    timelineConditions: '7 calendar days from deposit',
    approvalRequirements: 'Final file approval',
  };

  const inputB = {
    // Deliverables provided in different order and different casing for currency
    deliverables: ['Three distinct initial logo concepts', 'Adobe Illustrator AI master files', 'Transparent PNG files'],
    projectName: 'Logo Design Project',
    projectDescription: 'Brand identity refresh',
    currency: 'USD',
    client: { organization: 'Atelier Monolith', name: 'Elena Reyes', email: 'elena@ateliermonolith.com' },
    freelancer: { name: 'Alex Morgan', email: 'alex@alexmorgandesign.com' },
    revisionLimit: 2,
    totalPrice: 100,
    advancePayment: 50,
    remainingPayment: 50,
    timelineDays: 7,
    timelineConditions: '7 calendar days from deposit',
    approvalRequirements: 'Final file approval',
  };

  const canonicalA = buildCanonicalAgreement(inputA);
  const canonicalB = buildCanonicalAgreement(inputB);

  assert.deepEqual(canonicalA, canonicalB);
  assert.equal(deterministicStringify(canonicalA), deterministicStringify(canonicalB));

  const fpA = cryptoService.generateAgreementFingerprint(inputA).fingerprint;
  const fpB = cryptoService.generateAgreementFingerprint(inputB).fingerprint;

  assert.equal(fpA, fpB, 'Fingerprints must match for logically identical agreements');
  assert.equal(fpA.length, 64, 'SHA-256 fingerprint should be 64-char hex string');
});

test('Fingerprint changes whenever any material term is modified', () => {
  const base = {
    projectName: 'Logo Design Project',
    client: { name: 'Elena Reyes', organization: 'Atelier Monolith', email: 'elena@ateliermonolith.com' },
    freelancer: { name: 'Alex Morgan', email: 'alex@alexmorgandesign.com' },
    deliverables: ['Three distinct initial logo concepts', 'Transparent PNG files'],
    revisionLimit: 2,
    totalPrice: 100,
    advancePayment: 50,
    remainingPayment: 50,
    currency: 'USD',
    timelineDays: 7,
    timelineConditions: '7 calendar days from deposit',
    approvalRequirements: 'Final file approval',
  };

  const baseFp = cryptoService.generateAgreementFingerprint(base).fingerprint;

  // Modify price
  const changedPriceFp = cryptoService.generateAgreementFingerprint({
    ...base,
    totalPrice: 150,
  }).fingerprint;
  assert.notEqual(baseFp, changedPriceFp, 'Price change must generate different fingerprint');

  // Modify deliverables
  const changedDeliverablesFp = cryptoService.generateAgreementFingerprint({
    ...base,
    deliverables: ['Three distinct initial logo concepts', 'Transparent PNG files', '5 additional variations'],
  }).fingerprint;
  assert.notEqual(baseFp, changedDeliverablesFp, 'Deliverables change must generate different fingerprint');

  // Modify revisions
  const changedRevisionsFp = cryptoService.generateAgreementFingerprint({
    ...base,
    revisionLimit: 3,
  }).fingerprint;
  assert.notEqual(baseFp, changedRevisionsFp, 'Revision limit change must generate different fingerprint');
});
