import test from 'node:test';
import assert from 'node:assert/strict';
import { cryptoService } from '../../server/services/cryptoService';

test('Ed25519 digital signature generation and successful verification', () => {
  const receiptData = {
    receiptId: 'rcpt_test_1001',
    projectId: 'proj_atelier_monolith',
    agreementId: 'agmt_logo_design_2026',
    versionNumber: 1,
    agreementFingerprint: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    milestoneId: 'ms-advance-50',
    milestoneTitle: 'Initial Advance Deposit (Kickoff)',
    amount: 50.00,
    currency: 'USD',
    payerName: 'Elena Reyes',
    payerEmail: 'elena@ateliermonolith.com',
    paypalOrderId: 'ORDER_12345',
    paypalCaptureId: 'CAPTURE_67890',
    paymentTimestamp: '2026-11-01T12:00:00Z',
  };

  const signed = cryptoService.signReceipt(receiptData);

  assert.ok(signed.signature.length > 0, 'Signature should be non-empty hex string');
  assert.ok(signed.payloadHash.length === 64, 'Payload hash should be 64-char hex SHA-256');

  // Verify intact receipt
  const verification = cryptoService.verifyReceipt({
    ...receiptData,
    signature: signed.signature,
    payloadHash: signed.payloadHash,
    signingKeyId: signed.signingKeyId,
  });

  assert.equal(verification.isValid, true);
  assert.equal(verification.code, 'VALID_SIGNATURE');
  assert.equal(verification.signatureVerified, true);
});

test('Tamper detection: modifying payment amount triggers PAYLOAD_MODIFIED', () => {
  const receiptData = {
    receiptId: 'rcpt_test_tamper',
    projectId: 'proj_atelier_monolith',
    agreementId: 'agmt_logo_design_2026',
    versionNumber: 1,
    agreementFingerprint: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    milestoneId: 'ms-advance-50',
    milestoneTitle: 'Initial Advance Deposit',
    amount: 50.00,
    currency: 'USD',
    payerName: 'Elena Reyes',
    payerEmail: 'elena@ateliermonolith.com',
    paymentTimestamp: '2026-11-01T12:00:00Z',
  };

  const signed = cryptoService.signReceipt(receiptData);

  // An attacker attempts to alter the amount from 50 to 500 without updating or by updating amount
  const tamperedReceipt = {
    ...receiptData,
    amount: 500.00, // Tampered!
    signature: signed.signature,
    payloadHash: signed.payloadHash,
    signingKeyId: signed.signingKeyId,
  };

  const verification = cryptoService.verifyReceipt(tamperedReceipt);

  assert.equal(verification.isValid, false);
  assert.equal(verification.code, 'PAYLOAD_MODIFIED');
  assert.match(verification.message, /tamper detected/i);
});

test('Tamper detection: forged signature triggers INVALID_SIGNATURE', () => {
  const receiptData = {
    receiptId: 'rcpt_test_fake_sig',
    projectId: 'proj_atelier_monolith',
    agreementId: 'agmt_logo_design_2026',
    versionNumber: 1,
    agreementFingerprint: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    milestoneId: 'ms-advance-50',
    milestoneTitle: 'Initial Advance Deposit',
    amount: 50.00,
    currency: 'USD',
    payerName: 'Elena Reyes',
    payerEmail: 'elena@ateliermonolith.com',
    paymentTimestamp: '2026-11-01T12:00:00Z',
  };

  const { payloadHash } = cryptoService.hashReceiptPayload(receiptData);

  // A 64-byte fake Ed25519 signature
  const fakeSig = 'aa'.repeat(64);

  const verification = cryptoService.verifyReceipt({
    ...receiptData,
    signature: fakeSig,
    payloadHash,
    signingKeyId: cryptoService.getPublicKeyInfo().keyId,
  });

  assert.equal(verification.isValid, false);
  assert.equal(verification.code, 'INVALID_SIGNATURE');
});

test('Unknown key detection triggers UNKNOWN_KEY', () => {
  const receiptData = {
    receiptId: 'rcpt_test_unknown_key',
    projectId: 'proj_atelier_monolith',
    agreementId: 'agmt_logo_design_2026',
    versionNumber: 1,
    agreementFingerprint: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    milestoneId: 'ms-advance-50',
    milestoneTitle: 'Initial Advance Deposit',
    amount: 50.00,
    currency: 'USD',
    payerName: 'Elena Reyes',
    payerEmail: 'elena@ateliermonolith.com',
    paymentTimestamp: '2026-11-01T12:00:00Z',
  };

  const { payloadHash } = cryptoService.hashReceiptPayload(receiptData);

  const verification = cryptoService.verifyReceipt({
    ...receiptData,
    signature: 'aa'.repeat(64),
    payloadHash,
    signingKeyId: 'key_ed25519_unknown_9999',
  });

  assert.equal(verification.isValid, false);
  assert.equal(verification.code, 'UNKNOWN_KEY');
});
