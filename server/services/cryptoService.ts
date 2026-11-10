import crypto from 'node:crypto';
import {
  buildCanonicalAgreement,
  buildCanonicalReceipt,
  deterministicStringify,
  type CanonicalAgreementPayload,
  type CanonicalReceiptPayload,
} from '../../src/utils/canonical';
import type { SignedReceipt } from '../../src/types';

export interface VerificationResult {
  isValid: boolean;
  code:
    | 'VALID_SIGNATURE'
    | 'PAYLOAD_MODIFIED'
    | 'INVALID_SIGNATURE'
    | 'UNKNOWN_KEY'
    | 'INCOMPLETE_RECEIPT'
    | 'MALFORMED_RECEIPT';
  message: string;
  recomputedHash: string;
  storedHash: string;
  keyIdMatch: boolean;
  keyId: string;
  signatureVerified: boolean;
  agreementFingerprint: string;
  verifiedAt: string;
}

class CryptoService {
  private keyPair: { publicKey: crypto.KeyObject; privateKey: crypto.KeyObject };
  private publicKeyHex: string;
  private keyId: string;

  constructor() {
    // Generate an in-memory Ed25519 keypair for ScopeSnap Server
    // Node.js 16+ has native ed25519 key generation
    this.keyPair = crypto.generateKeyPairSync('ed25519');
    
    // Export SPKI DER encoded public key as hex
    const spkiDer = this.keyPair.publicKey.export({ type: 'spki', format: 'der' });
    this.publicKeyHex = spkiDer.toString('hex');
    
    // Fingerprint of the public key serves as keyId
    const keyHash = crypto.createHash('sha256').update(spkiDer).digest('hex').substring(0, 16);
    this.keyId = `key_ed25519_${keyHash}`;
  }

  public getPublicKeyInfo() {
    return {
      keyId: this.keyId,
      algorithm: 'Ed25519',
      format: 'SPKI-DER-HEX',
      publicKeyHex: this.publicKeyHex,
    };
  }

  /**
   * Generates deterministic SHA-256 fingerprint for an agreement version
   */
  public generateAgreementFingerprint(agreementData: Parameters<typeof buildCanonicalAgreement>[0]): {
    fingerprint: string;
    canonicalPayload: CanonicalAgreementPayload;
    canonicalJson: string;
  } {
    const canonicalPayload = buildCanonicalAgreement(agreementData);
    const canonicalJson = deterministicStringify(canonicalPayload);
    const fingerprint = crypto.createHash('sha256').update(canonicalJson, 'utf8').digest('hex');
    return {
      fingerprint,
      canonicalPayload,
      canonicalJson,
    };
  }

  /**
   * Hashes canonical receipt payload using SHA-256
   */
  public hashReceiptPayload(receiptData: Parameters<typeof buildCanonicalReceipt>[0]): {
    payloadHash: string;
    canonicalPayload: CanonicalReceiptPayload;
    canonicalJson: string;
  } {
    const canonicalPayload = buildCanonicalReceipt(receiptData);
    const canonicalJson = deterministicStringify(canonicalPayload);
    const payloadHash = crypto.createHash('sha256').update(canonicalJson, 'utf8').digest('hex');
    return {
      payloadHash,
      canonicalPayload,
      canonicalJson,
    };
  }

  /**
   * Signs a canonical receipt with Ed25519
   */
  public signReceipt(receiptData: Parameters<typeof buildCanonicalReceipt>[0]): {
    payloadHash: string;
    signature: string;
    signingKeyId: string;
    verificationPublicKeyRef: string;
    canonicalPayload: CanonicalReceiptPayload;
  } {
    const { payloadHash, canonicalPayload, canonicalJson } = this.hashReceiptPayload(receiptData);
    const dataBuffer = Buffer.from(canonicalJson, 'utf8');

    // Ed25519 signing (sign data directly without prehash)
    const signatureBuffer = crypto.sign(null, dataBuffer, this.keyPair.privateKey);
    const signature = signatureBuffer.toString('hex');

    return {
      payloadHash,
      signature,
      signingKeyId: this.keyId,
      verificationPublicKeyRef: `/api/crypto/public-key?keyId=${this.keyId}`,
      canonicalPayload,
    };
  }

  /**
   * Independent verification of a signed receipt
   */
  public verifyReceipt(receipt: Partial<SignedReceipt>, externalPublicKeyHex?: string): VerificationResult {
    const verifiedAt = new Date().toISOString();

    // Check completeness
    if (!receipt || !receipt.receiptId || !receipt.amount || !receipt.signature || !receipt.payloadHash) {
      return {
        isValid: false,
        code: 'INCOMPLETE_RECEIPT',
        message: 'Receipt is missing mandatory fields (receiptId, amount, signature, or payloadHash).',
        recomputedHash: '',
        storedHash: receipt.payloadHash || '',
        keyIdMatch: false,
        keyId: receipt.signingKeyId || 'UNKNOWN',
        signatureVerified: false,
        agreementFingerprint: receipt.agreementFingerprint || '',
        verifiedAt,
      };
    }

    // Reconstruct canonical payload to verify hash
    const canonicalPayload = buildCanonicalReceipt({
      receiptId: receipt.receiptId,
      projectId: receipt.projectId || '',
      agreementId: receipt.agreementId || '',
      versionNumber: receipt.versionNumber || 1,
      agreementFingerprint: receipt.agreementFingerprint || '',
      milestoneId: receipt.milestoneId || '',
      milestoneTitle: receipt.milestoneTitle || '',
      amount: receipt.amount,
      currency: receipt.currency || 'USD',
      payerName: receipt.payerName || '',
      payerEmail: receipt.payerEmail || '',
      paypalOrderId: receipt.paypalOrderId,
      paypalCaptureId: receipt.paypalCaptureId,
      paymentTimestamp: receipt.paymentTimestamp || '',
    });

    const canonicalJson = deterministicStringify(canonicalPayload);
    const recomputedHash = crypto.createHash('sha256').update(canonicalJson, 'utf8').digest('hex');

    // 1. Payload hash check
    if (recomputedHash !== receipt.payloadHash) {
      return {
        isValid: false,
        code: 'PAYLOAD_MODIFIED',
        message: `Tamper detected: Recomputed payload hash (${recomputedHash.substring(0, 12)}...) does not match stored hash (${receipt.payloadHash.substring(0, 12)}...).`,
        recomputedHash,
        storedHash: receipt.payloadHash,
        keyIdMatch: receipt.signingKeyId === this.keyId,
        keyId: receipt.signingKeyId || '',
        signatureVerified: false,
        agreementFingerprint: receipt.agreementFingerprint || '',
        verifiedAt,
      };
    }

    // 2. Key matching
    const pubKeyToUseHex = externalPublicKeyHex || (receipt.signingKeyId === this.keyId ? this.publicKeyHex : null);
    if (!pubKeyToUseHex) {
      return {
        isValid: false,
        code: 'UNKNOWN_KEY',
        message: `Unknown signing key ID '${receipt.signingKeyId}'. Server does not have this public key in its trust store.`,
        recomputedHash,
        storedHash: receipt.payloadHash,
        keyIdMatch: false,
        keyId: receipt.signingKeyId || '',
        signatureVerified: false,
        agreementFingerprint: receipt.agreementFingerprint || '',
        verifiedAt,
      };
    }

    // 3. Signature verification
    try {
      const pubKeyDer = Buffer.from(pubKeyToUseHex, 'hex');
      const publicKeyObj = crypto.createPublicKey({
        key: pubKeyDer,
        type: 'spki',
        format: 'der',
      });

      const dataBuffer = Buffer.from(canonicalJson, 'utf8');
      const sigBuffer = Buffer.from(receipt.signature, 'hex');
      const signatureVerified = crypto.verify(null, dataBuffer, publicKeyObj, sigBuffer);

      if (!signatureVerified) {
        return {
          isValid: false,
          code: 'INVALID_SIGNATURE',
          message: 'Cryptographic signature is invalid for the specified public key and payload.',
          recomputedHash,
          storedHash: receipt.payloadHash,
          keyIdMatch: receipt.signingKeyId === this.keyId,
          keyId: receipt.signingKeyId || '',
          signatureVerified: false,
          agreementFingerprint: receipt.agreementFingerprint || '',
          verifiedAt,
        };
      }

      return {
        isValid: true,
        code: 'VALID_SIGNATURE',
        message: 'Digital signature is cryptographically valid and authentic. The receipt content is unmodified.',
        recomputedHash,
        storedHash: receipt.payloadHash,
        keyIdMatch: receipt.signingKeyId === this.keyId,
        keyId: receipt.signingKeyId || '',
        signatureVerified: true,
        agreementFingerprint: receipt.agreementFingerprint || '',
        verifiedAt,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        isValid: false,
        code: 'MALFORMED_RECEIPT',
        message: `Signature verification threw error: ${errMsg}`,
        recomputedHash,
        storedHash: receipt.payloadHash,
        keyIdMatch: false,
        keyId: receipt.signingKeyId || '',
        signatureVerified: false,
        agreementFingerprint: receipt.agreementFingerprint || '',
        verifiedAt,
      };
    }
  }
}

export const cryptoService = new CryptoService();
