/**
 * Deterministic canonical agreement serialization and hashing helpers.
 */

export interface CanonicalAgreementPayload {
  projectName: string;
  projectDescription: string;
  client: {
    name: string;
    organization: string;
    email: string;
  };
  freelancer: {
    name: string;
    email: string;
  };
  deliverables: string[];
  revisionLimit: number;
  totalPrice: number;
  advancePayment: number;
  remainingPayment: number;
  currency: string;
  timelineDays: number;
  timelineConditions: string;
  approvalRequirements: string;
}

export interface CanonicalReceiptPayload {
  receiptId: string;
  projectId: string;
  agreementId: string;
  versionNumber: number;
  agreementFingerprint: string;
  milestoneId: string;
  milestoneTitle: string;
  amount: number;
  currency: string;
  payerName: string;
  payerEmail: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paymentTimestamp: string;
}

/**
 * Normalizes an agreement into a deterministic canonical structure
 * Sorted fields, trimmed strings, normalized numbers and sorted arrays.
 */
export function buildCanonicalAgreement(data: {
  projectName: string;
  projectDescription?: string;
  client: { name: string; organization?: string; email?: string };
  freelancer: { name: string; email?: string };
  deliverables: string[];
  revisionLimit: number;
  totalPrice: number;
  advancePayment: number;
  remainingPayment: number;
  currency: string;
  timelineDays: number;
  timelineConditions?: string;
  approvalRequirements?: string;
}): CanonicalAgreementPayload {
  return {
    projectName: (data.projectName || '').trim(),
    projectDescription: (data.projectDescription || '').trim(),
    client: {
      name: (data.client?.name || '').trim(),
      organization: (data.client?.organization || '').trim(),
      email: (data.client?.email || '').trim().toLowerCase(),
    },
    freelancer: {
      name: (data.freelancer?.name || '').trim(),
      email: (data.freelancer?.email || '').trim().toLowerCase(),
    },
    deliverables: [...(data.deliverables || [])]
      .map(d => d.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)),
    revisionLimit: Number(data.revisionLimit) || 0,
    totalPrice: Number(Number(data.totalPrice || 0).toFixed(2)),
    advancePayment: Number(Number(data.advancePayment || 0).toFixed(2)),
    remainingPayment: Number(Number(data.remainingPayment || 0).toFixed(2)),
    currency: (data.currency || 'USD').trim().toUpperCase(),
    timelineDays: Number(data.timelineDays) || 0,
    timelineConditions: (data.timelineConditions || '').trim(),
    approvalRequirements: (data.approvalRequirements || '').trim(),
  };
}

/**
 * Deterministic JSON stringifier that sorts object keys recursively
 */
export function deterministicStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(item => deterministicStringify(item)).join(',') + ']';
  }

  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    key => `${JSON.stringify(key)}:${deterministicStringify((obj as Record<string, unknown>)[key])}`
  );
  return '{' + pairs.join(',') + '}';
}

/**
 * Builds the canonical receipt payload
 */
export function buildCanonicalReceipt(data: {
  receiptId: string;
  projectId: string;
  agreementId: string;
  versionNumber: number;
  agreementFingerprint: string;
  milestoneId: string;
  milestoneTitle: string;
  amount: number;
  currency: string;
  payerName: string;
  payerEmail: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paymentTimestamp: string;
}): CanonicalReceiptPayload {
  return {
    receiptId: (data.receiptId || '').trim(),
    projectId: (data.projectId || '').trim(),
    agreementId: (data.agreementId || '').trim(),
    versionNumber: Number(data.versionNumber) || 1,
    agreementFingerprint: (data.agreementFingerprint || '').trim().toLowerCase(),
    milestoneId: (data.milestoneId || '').trim(),
    milestoneTitle: (data.milestoneTitle || '').trim(),
    amount: Number(Number(data.amount || 0).toFixed(2)),
    currency: (data.currency || 'USD').trim().toUpperCase(),
    payerName: (data.payerName || '').trim(),
    payerEmail: (data.payerEmail || '').trim().toLowerCase(),
    paypalOrderId: data.paypalOrderId ? data.paypalOrderId.trim() : undefined,
    paypalCaptureId: data.paypalCaptureId ? data.paypalCaptureId.trim() : undefined,
    paymentTimestamp: (data.paymentTimestamp || '').trim(),
  };
}
