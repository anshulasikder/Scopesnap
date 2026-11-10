export type EvidenceStatus = 
  | 'EXACT_MATCH'
  | 'NEEDS_REVIEW'
  | 'NOT_FOUND'
  | 'CONFLICTING_EVIDENCE';

export type AgreementStatus =
  | 'DRAFT'
  | 'WAITING_CLIENT_CONFIRMATION'
  | 'CONFIRMED'
  | 'CHANGES_REQUESTED'
  | 'SUPERSEDED';

export type MilestoneStatus =
  | 'PENDING_CONFIRMATION'
  | 'READY_TO_PAY'
  | 'AWAITING_APPROVAL'
  | 'CAPTURING'
  | 'PAID'
  | 'FAILED';

export type ScopeChangeStatus =
  | 'NO_CHANGE'
  | 'POTENTIAL_CHANGE'
  | 'NEEDS_HUMAN_REVIEW'
  | 'ADDENDUM_PROPOSED'
  | 'ADDENDUM_CONFIRMED'
  | 'ADDENDUM_REJECTED';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'FREELANCER' | 'CLIENT';
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface ClientParty {
  id: string;
  name: string;
  organization: string;
  email: string;
}

export interface FreelancerParty {
  id?: string;
  name: string;
  email: string;
}

export interface PaymentOrder {
  orderId: string;
  agreementId: string;
  milestoneId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  speaker: string;
  speakerRole: 'CLIENT' | 'FREELANCER';
  text: string;
  timestamp: string;
  sourceType: 'EMAIL' | 'SLACK' | 'UPWORK' | 'WHATSAPP' | 'SYNTHETIC_DEMO';
}

export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedTerm {
  id: string;
  category: 'PARTIES' | 'DELIVERABLE' | 'REVISIONS' | 'PRICE' | 'ADVANCE' | 'REMAINING' | 'TIMELINE' | 'APPROVAL' | 'CONDITIONS';
  label: string;
  extractedValue: string;
  sourceMessageId: string;
  speaker: string;
  supportingQuote: string;
  evidenceStatus: EvidenceStatus;
  explanation?: string;
  confidence: number;
}

export interface PaymentMilestone {
  id: string;
  agreementId: string;
  versionId: string;
  title: string;
  amount: number;
  currency: string;
  condition: string;
  status: MilestoneStatus;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paidAt?: string;
  isSyntheticDemo?: boolean;
}

export interface PartyConfirmation {
  id: string;
  agreementId: string;
  versionId: string;
  fingerprint: string;
  party: 'FREELANCER' | 'CLIENT';
  signerName: string;
  signerEmail: string;
  signerIdentity: string;
  confirmedAt: string;
  reviewTokenUsed?: string;
}

export interface AgreementVersion {
  id: string;
  agreementId: string;
  versionNumber: number;
  client: ClientParty;
  freelancer: FreelancerParty;
  projectName: string;
  projectDescription: string;
  deliverables: string[];
  revisionLimit: number;
  totalPrice: number;
  advancePayment: number;
  remainingPayment: number;
  currency: string;
  timelineDays: number;
  timelineConditions: string;
  approvalRequirements: string;
  extractedTerms: ExtractedTerm[];
  canonicalFingerprint: string;
  status: AgreementStatus;
  createdAt: string;
  createdBy: string;
  freelancerConfirmed?: PartyConfirmation;
  clientConfirmed?: PartyConfirmation;
  changeSummary?: string;
  isImmutable: boolean;
}

export interface Agreement {
  id: string;
  projectId: string;
  userId: string;
  currentVersionId: string;
  status: AgreementStatus;
  versions: AgreementVersion[];
  createdAt: string;
  updatedAt: string;
  reviewToken?: string;
  reviewTokenExpiresAt?: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  client: ClientParty;
  freelancer: FreelancerParty;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  agreementId?: string;
  isSyntheticDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SignedReceipt {
  receiptId: string;
  projectId: string;
  agreementId: string;
  versionId: string;
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
  receiptCreatedAt: string;
  signingKeyId: string;
  signature: string;
  payloadHash: string;
  verificationPublicKeyRef: string;
  isSyntheticDemo?: boolean;
}

export interface ScopeChangeAnalysis {
  id: string;
  agreementId: string;
  versionId: string;
  messageId: string;
  speaker: string;
  messageText: string;
  category: 'DELIVERABLE' | 'QUANTITY' | 'REVISIONS' | 'PRICE' | 'TIMELINE' | 'APPROVAL' | 'NONE';
  status: ScopeChangeStatus;
  originalTerm: string;
  proposedChange: string;
  explanation: string;
  suggestedAddendum?: {
    additionalDeliverables: string[];
    additionalPrice: number;
    additionalDays: number;
    rationale: string;
  };
  createdAt: string;
}

export interface Addendum {
  id: string;
  agreementId: string;
  baseVersionId: string;
  newVersionId?: string;
  scopeAnalysisId: string;
  title: string;
  termsAdded: string[];
  additionalPrice: number;
  additionalDays: number;
  status: 'PROPOSED' | 'CONFIRMED' | 'REJECTED';
  createdAt: string;
  confirmedAt?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  geminiConfigured: boolean;
  geminiModel: string;
  paypalConfigured: boolean;
  paypalMode: 'sandbox' | 'live' | 'unconfigured';
  firebaseConfigured: boolean;
  cryptoKeysLoaded: boolean;
  signingKeyId: string;
  uptimeSeconds: number;
}
