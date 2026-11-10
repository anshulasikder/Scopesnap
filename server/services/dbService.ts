import type {
  Project,
  Conversation,
  ConversationMessage,
  Agreement,
  AgreementVersion,
  PaymentMilestone,
  PartyConfirmation,
  SignedReceipt,
  ScopeChangeAnalysis,
  Addendum,
  UserProfile,
} from '../../src/types';
import { OFFICIAL_DEMO_MESSAGES } from '../../src/utils/demoData';
import { cryptoService } from './cryptoService';

export interface AuditEvent {
  id: string;
  userId: string;
  entityType: 'PROJECT' | 'AGREEMENT' | 'CONFIRMATION' | 'PAYMENT' | 'RECEIPT' | 'SCOPE';
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

class DatabaseService {
  private users: Map<string, UserProfile> = new Map();
  private projects: Map<string, Project> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private agreements: Map<string, Agreement> = new Map();
  private milestones: Map<string, PaymentMilestone[]> = new Map(); // agreementId -> milestones
  private receipts: Map<string, SignedReceipt> = new Map();
  private reviewTokens: Map<string, { agreementId: string; versionId: string; expiresAt: number }> = new Map();
  private scopeAnalyses: Map<string, ScopeChangeAnalysis[]> = new Map(); // agreementId -> analyses
  private addenda: Map<string, Addendum[]> = new Map(); // agreementId -> addenda
  private auditEvents: AuditEvent[] = [];

  constructor() {
    this.seedOfficialDemoData();
  }

  /**
   * Initializes the official synthetic demo scenario as specified in Section 2 of Prompt
   */
  public seedOfficialDemoData() {
    const demoUserId = 'usr_alex_demo';
    const demoProjectId = 'proj_atelier_monolith';
    const demoAgreementId = 'agmt_logo_design_2026';
    const demoVersionId = 'agmt_ver_1';

    // 1. User
    this.users.set(demoUserId, {
      id: demoUserId,
      email: 'alex@alexmorgandesign.com',
      displayName: 'Alex Morgan',
      role: 'FREELANCER',
      onboardingCompleted: true,
      createdAt: '2026-11-01T08:00:00Z',
    });

    // 2. Project
    this.projects.set(demoProjectId, {
      id: demoProjectId,
      userId: demoUserId,
      name: 'Logo Design Project',
      description: 'Brand identity refresh and logo design for Atelier Monolith',
      client: {
        id: 'client_elena_reyes',
        name: 'Elena Reyes',
        organization: 'Atelier Monolith',
        email: 'elena@ateliermonolith.com',
      },
      freelancer: {
        id: 'freelancer_alex_morgan',
        name: 'Alex Morgan',
        email: 'alex@alexmorgandesign.com',
      },
      status: 'ACTIVE',
      agreementId: demoAgreementId,
      isSyntheticDemo: true,
      createdAt: '2026-11-01T08:30:00Z',
      updatedAt: '2026-11-01T10:30:00Z',
    });

    // 3. Conversation
    const conversationId = `conv_${demoProjectId}`;
    this.conversations.set(conversationId, {
      id: conversationId,
      projectId: demoProjectId,
      title: 'Initial Scope & Pricing Discussion',
      messages: [...OFFICIAL_DEMO_MESSAGES],
      createdAt: '2026-11-01T09:00:00Z',
      updatedAt: '2026-11-01T10:25:00Z',
    });

    // 4. Initial Agreement Version terms & fingerprint
    const agreementPayload = {
      projectName: 'Logo Design Project',
      projectDescription: 'Brand identity refresh and logo design for Atelier Monolith',
      client: {
        name: 'Elena Reyes',
        organization: 'Atelier Monolith',
        email: 'elena@ateliermonolith.com',
      },
      freelancer: {
        name: 'Alex Morgan',
        email: 'alex@alexmorgandesign.com',
      },
      deliverables: [
        'Three distinct initial logo concepts',
        'Transparent PNG files',
        'Adobe Illustrator AI master files',
      ],
      revisionLimit: 2,
      totalPrice: 100,
      advancePayment: 50,
      remainingPayment: 50,
      currency: 'USD',
      timelineDays: 7,
      timelineConditions: '7 calendar days from receipt of the initial deposit to first concept presentation',
      approvalRequirements: 'The remaining USD 50 is due once the final files are approved, according to the confirmed agreement.',
    };

    const { fingerprint } = cryptoService.generateAgreementFingerprint(agreementPayload);

    const initialVersion: AgreementVersion = {
      id: demoVersionId,
      agreementId: demoAgreementId,
      versionNumber: 1,
      client: {
        id: 'client_elena_reyes',
        name: 'Elena Reyes',
        organization: 'Atelier Monolith',
        email: 'elena@ateliermonolith.com',
      },
      freelancer: {
        name: 'Alex Morgan',
        email: 'alex@alexmorgandesign.com',
      },
      projectName: agreementPayload.projectName,
      projectDescription: agreementPayload.projectDescription,
      deliverables: agreementPayload.deliverables,
      revisionLimit: agreementPayload.revisionLimit,
      totalPrice: agreementPayload.totalPrice,
      advancePayment: agreementPayload.advancePayment,
      remainingPayment: agreementPayload.remainingPayment,
      currency: agreementPayload.currency,
      timelineDays: agreementPayload.timelineDays,
      timelineConditions: agreementPayload.timelineConditions,
      approvalRequirements: agreementPayload.approvalRequirements,
      canonicalFingerprint: fingerprint,
      status: 'WAITING_CLIENT_CONFIRMATION',
      createdAt: '2026-11-01T10:30:00Z',
      createdBy: demoUserId,
      isImmutable: false,
      freelancerConfirmed: {
        id: 'conf_freelancer_v1',
        agreementId: demoAgreementId,
        versionId: demoVersionId,
        fingerprint,
        party: 'FREELANCER',
        signerName: 'Alex Morgan',
        signerEmail: 'alex@alexmorgandesign.com',
        signerIdentity: 'auth_uid_alex_demo',
        confirmedAt: '2026-11-01T10:32:00Z',
      },
      extractedTerms: [
        {
          id: 'term-1',
          category: 'DELIVERABLE',
          label: 'Initial Concepts',
          extractedValue: 'Three distinct initial logo concepts',
          sourceMessageId: 'msg-03',
          speaker: 'Elena Reyes',
          supportingQuote: 'We require you to deliver three distinct initial logo concepts to start.',
          evidenceStatus: 'EXACT_MATCH',
          confidence: 1.0,
        },
        {
          id: 'term-2',
          category: 'REVISIONS',
          label: 'Revision Limits',
          extractedValue: 'Up to two revision rounds',
          sourceMessageId: 'msg-03',
          speaker: 'Elena Reyes',
          supportingQuote: 'We also need up to two revision rounds included.',
          evidenceStatus: 'EXACT_MATCH',
          confidence: 1.0,
        },
        {
          id: 'term-3',
          category: 'DELIVERABLE',
          label: 'Final Deliverables',
          extractedValue: 'Transparent PNG files and Adobe Illustrator AI master files',
          sourceMessageId: 'msg-05',
          speaker: 'Elena Reyes',
          supportingQuote: 'Our final deliverables must be transparent PNG files and Adobe Illustrator AI master files.',
          evidenceStatus: 'EXACT_MATCH',
          confidence: 1.0,
        },
        {
          id: 'term-4',
          category: 'PRICE',
          label: 'Total Project Price',
          extractedValue: 'USD 100',
          sourceMessageId: 'msg-06',
          speaker: 'Alex Morgan',
          supportingQuote: 'The total project price will be USD 100.',
          evidenceStatus: 'EXACT_MATCH',
          confidence: 1.0,
        },
        {
          id: 'term-5',
          category: 'ADVANCE',
          label: 'Initial Advance Payment',
          extractedValue: 'USD 50',
          sourceMessageId: 'msg-06',
          speaker: 'Alex Morgan',
          supportingQuote: 'initial advance payment of USD 50 before kickoff',
          evidenceStatus: 'EXACT_MATCH',
          confidence: 1.0,
        },
        {
          id: 'term-6',
          category: 'REMAINING',
          label: 'Remaining Balance Payment',
          extractedValue: 'USD 50',
          sourceMessageId: 'msg-06',
          speaker: 'Alex Morgan',
          supportingQuote: 'remaining payment of USD 50 due once the final files are approved',
          evidenceStatus: 'EXACT_MATCH',
          confidence: 1.0,
        },
        {
          id: 'term-7',
          category: 'TIMELINE',
          label: 'Concept Presentation Deadline',
          extractedValue: '7 calendar days from receipt of initial deposit',
          sourceMessageId: 'msg-08',
          speaker: 'Alex Morgan',
          supportingQuote: 'First concept presentation deadline will be 7 calendar days from receipt of the initial deposit.',
          evidenceStatus: 'EXACT_MATCH',
          confidence: 1.0,
        },
      ],
    };

    // 5. Agreement container
    const demoReviewToken = 'tok_demo_elena_review_2026';
    this.agreements.set(demoAgreementId, {
      id: demoAgreementId,
      projectId: demoProjectId,
      userId: demoUserId,
      currentVersionId: demoVersionId,
      status: 'WAITING_CLIENT_CONFIRMATION',
      versions: [initialVersion],
      createdAt: '2026-11-01T10:30:00Z',
      updatedAt: '2026-11-01T10:32:00Z',
      reviewToken: demoReviewToken,
      reviewTokenExpiresAt: '2026-12-01T00:00:00Z',
    });

    this.reviewTokens.set(demoReviewToken, {
      agreementId: demoAgreementId,
      versionId: demoVersionId,
      expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
    });

    // 6. Payment Milestones
    this.milestones.set(demoAgreementId, [
      {
        id: 'ms-advance-50',
        agreementId: demoAgreementId,
        versionId: demoVersionId,
        title: 'Initial Advance Deposit (Kickoff)',
        amount: 50,
        currency: 'USD',
        condition: 'Due upon mutual confirmation of agreement before kickoff.',
        status: 'READY_TO_PAY',
        isSyntheticDemo: true,
      },
      {
        id: 'ms-remaining-50',
        agreementId: demoAgreementId,
        versionId: demoVersionId,
        title: 'Remaining Balance (Approved Final Files)',
        amount: 50,
        currency: 'USD',
        condition: 'Due once final logo files (PNG + AI) are approved by client.',
        status: 'PENDING_CONFIRMATION',
        isSyntheticDemo: true,
      },
    ]);

    this.logAudit({
      userId: demoUserId,
      entityType: 'AGREEMENT',
      entityId: demoAgreementId,
      action: 'INITIALIZED_SYNTHETIC_DEMO_AGREEMENT',
      metadata: { fingerprint, version: 1 },
    });
  }

  // --- Audit Events ---
  public logAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>) {
    this.auditEvents.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...event,
    });
  }

  public getAuditEvents(limit = 20): AuditEvent[] {
    return this.auditEvents.slice(0, limit);
  }

  // --- Users ---
  public getUser(id: string): UserProfile | undefined {
    return this.users.get(id);
  }

  public upsertUser(user: UserProfile) {
    this.users.set(user.id, user);
  }

  // --- Projects ---
  public listProjects(userId: string): Project[] {
    return Array.from(this.projects.values()).filter(p => p.userId === userId);
  }

  public getProject(id: string, userId?: string): Project | undefined {
    const proj = this.projects.get(id);
    if (!proj) return undefined;
    if (userId && proj.userId !== userId) return undefined;
    return proj;
  }

  public createProject(proj: Project): Project {
    this.projects.set(proj.id, proj);
    this.logAudit({
      userId: proj.userId,
      entityType: 'PROJECT',
      entityId: proj.id,
      action: 'PROJECT_CREATED',
      metadata: { name: proj.name },
    });
    return proj;
  }

  public updateProject(id: string, userId: string, updates: Partial<Project>): Project {
    const existing = this.getProject(id, userId);
    if (!existing) throw new Error('Project not found or unauthorized');
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.projects.set(id, updated);
    return updated;
  }

  // --- Conversations ---
  public getConversation(projectId: string): Conversation | undefined {
    return this.conversations.get(`conv_${projectId}`);
  }

  public saveConversation(conv: Conversation): Conversation {
    this.conversations.set(conv.id, conv);
    return conv;
  }

  // --- Agreements ---
  public getAgreement(id: string, userId?: string): Agreement | undefined {
    const agmt = this.agreements.get(id);
    if (!agmt) return undefined;
    if (userId && agmt.userId !== userId) return undefined;
    return agmt;
  }

  public getAgreementByProject(projectId: string): Agreement | undefined {
    return Array.from(this.agreements.values()).find(a => a.projectId === projectId);
  }

  public saveAgreement(agmt: Agreement): Agreement {
    this.agreements.set(agmt.id, agmt);
    return agmt;
  }

  // --- Milestones ---
  public getMilestones(agreementId: string): PaymentMilestone[] {
    return this.milestones.get(agreementId) || [];
  }

  public setMilestones(agreementId: string, items: PaymentMilestone[]) {
    this.milestones.set(agreementId, items);
  }

  public updateMilestone(agreementId: string, milestoneId: string, updates: Partial<PaymentMilestone>): PaymentMilestone {
    const list = this.getMilestones(agreementId);
    const idx = list.findIndex(m => m.id === milestoneId);
    if (idx === -1) throw new Error(`Milestone '${milestoneId}' not found.`);
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    this.milestones.set(agreementId, list);
    return updated;
  }

  // --- Receipts ---
  public saveReceipt(receipt: SignedReceipt): SignedReceipt {
    this.receipts.set(receipt.receiptId, receipt);
    this.logAudit({
      userId: receipt.projectId,
      entityType: 'RECEIPT',
      entityId: receipt.receiptId,
      action: 'RECEIPT_SIGNED_AND_STORED',
      metadata: {
        hash: receipt.payloadHash,
        fingerprint: receipt.agreementFingerprint,
        amount: receipt.amount,
      },
    });
    return receipt;
  }

  public getReceipt(receiptId: string): SignedReceipt | undefined {
    return this.receipts.get(receiptId);
  }

  public listReceipts(agreementId?: string): SignedReceipt[] {
    const all = Array.from(this.receipts.values());
    if (agreementId) return all.filter(r => r.agreementId === agreementId);
    return all;
  }

  // --- Review Tokens ---
  public createReviewToken(agreementId: string, versionId: string, ttlHours = 72): string {
    const token = `ss_rev_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = Date.now() + ttlHours * 3600 * 1000;
    this.reviewTokens.set(token, { agreementId, versionId, expiresAt });
    return token;
  }

  public validateReviewToken(token: string): { agreementId: string; versionId: string } | null {
    const entry = this.reviewTokens.get(token);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) return null;
    return { agreementId: entry.agreementId, versionId: entry.versionId };
  }

  // --- Scope Analyses & Addenda ---
  public getScopeAnalyses(agreementId: string): ScopeChangeAnalysis[] {
    return this.scopeAnalyses.get(agreementId) || [];
  }

  public addScopeAnalysis(agreementId: string, analysis: ScopeChangeAnalysis) {
    const list = this.getScopeAnalyses(agreementId);
    list.unshift(analysis);
    this.scopeAnalyses.set(agreementId, list);
  }

  public getAddenda(agreementId: string): Addendum[] {
    return this.addenda.get(agreementId) || [];
  }

  public addAddendum(agreementId: string, addendum: Addendum) {
    const list = this.getAddenda(agreementId);
    list.push(addendum);
    this.addenda.set(agreementId, list);
  }
}

export const dbService = new DatabaseService();
