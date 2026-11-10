import type {
  Project,
  Agreement,
  AgreementVersion,
  PaymentMilestone,
  SignedReceipt,
  ScopeChangeAnalysis,
  Conversation,
  SystemHealth,
} from '../types';

const BASE_URL = '/api';

export async function fetchHealth(): Promise<SystemHealth> {
  const res = await fetch(`${BASE_URL}/system/health`);
  return res.json();
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${BASE_URL}/projects`);
  const data = await res.json();
  return data.projects || [];
}

export async function fetchProject(id: string): Promise<{ project: Project; agreement?: Agreement; conversation?: Conversation }> {
  const res = await fetch(`${BASE_URL}/projects/${id}`);
  return res.json();
}

export async function createProject(data: {
  name: string;
  description: string;
  clientName: string;
  clientOrg?: string;
  clientEmail?: string;
}): Promise<{ project: Project }> {
  const res = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchConversation(projectId: string): Promise<Conversation> {
  const res = await fetch(`${BASE_URL}/conversations/${projectId}`);
  const data = await res.json();
  return data.conversation;
}

export async function addConversationMessage(projectId: string, message: {
  speaker: string;
  speakerRole: 'CLIENT' | 'FREELANCER';
  text: string;
}): Promise<void> {
  await fetch(`${BASE_URL}/conversations/${projectId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
}

export async function runAIExtraction(projectId?: string, messages?: unknown[]) {
  const res = await fetch(`${BASE_URL}/ai/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, messages }),
  });
  return res.json();
}

export async function fetchAgreement(id: string): Promise<{ agreement: Agreement; milestones: PaymentMilestone[] }> {
  const res = await fetch(`${BASE_URL}/agreements/${id}`);
  return res.json();
}

export async function createAgreement(data: unknown): Promise<{ agreement: Agreement; milestones: PaymentMilestone[] }> {
  const res = await fetch(`${BASE_URL}/agreements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function confirmFreelancer(agreementId: string): Promise<{ agreement: Agreement; currentVersion: AgreementVersion }> {
  const res = await fetch(`${BASE_URL}/agreements/${agreementId}/confirm-freelancer`, {
    method: 'POST',
  });
  return res.json();
}

export async function generateReviewLink(agreementId: string): Promise<{ token: string; reviewUrl: string }> {
  const res = await fetch(`${BASE_URL}/agreements/${agreementId}/generate-review-link`, {
    method: 'POST',
  });
  return res.json();
}

export async function fetchClientReview(token: string) {
  const res = await fetch(`${BASE_URL}/review/${token}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to load reviewable agreement');
  }
  return res.json();
}

export async function submitClientConfirmation(token: string, signerName: string, signerEmail?: string) {
  const res = await fetch(`${BASE_URL}/review/${token}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signerName, signerEmail }),
  });
  return res.json();
}

export async function submitClientChanges(token: string, correctionNotes: string) {
  const res = await fetch(`${BASE_URL}/review/${token}/request-changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correctionNotes }),
  });
  return res.json();
}

export async function createPaymentOrder(agreementId: string, milestoneId: string, isSyntheticDemo = true) {
  const res = await fetch(`${BASE_URL}/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agreementId, milestoneId, isSyntheticDemo }),
  });
  return res.json();
}

export async function capturePaymentOrder(agreementId: string, milestoneId: string, orderId: string) {
  const res = await fetch(`${BASE_URL}/payments/capture-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agreementId, milestoneId, orderId }),
  });
  return res.json();
}

export async function fetchReceipts(agreementId?: string): Promise<SignedReceipt[]> {
  const url = agreementId ? `${BASE_URL}/payments/receipts?agreementId=${agreementId}` : `${BASE_URL}/payments/receipts`;
  const res = await fetch(url);
  const data = await res.json();
  return data.receipts || [];
}

export async function verifyReceiptPayload(receipt: unknown, externalPublicKeyHex?: string) {
  const res = await fetch(`${BASE_URL}/receipts/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receipt, externalPublicKeyHex }),
  });
  return res.json();
}

export async function analyzeScope(agreementId: string, messageText: string): Promise<ScopeChangeAnalysis> {
  const res = await fetch(`${BASE_URL}/scope/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agreementId, messageText }),
  });
  return res.json();
}

export async function applyAddendum(data: {
  agreementId: string;
  scopeAnalysisId: string;
  title: string;
  termsAdded: string[];
  additionalPrice: number;
  additionalDays: number;
}) {
  const res = await fetch(`${BASE_URL}/scope/addendum`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${BASE_URL}/audit`);
  return res.json();
}
