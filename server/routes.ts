import { Router, Request, Response } from 'express';
import { dbService } from './services/dbService';
import { aiService } from './services/aiService';
import { cryptoService } from './services/cryptoService';
import { paypalService } from './services/paypalService';
import type { AgreementVersion, PaymentMilestone } from '../src/types';

export const apiRouter = Router();

// Middleware to extract/simulate authenticated user (default to Alex Morgan demo user if header absent)
const getUserContext = (req: Request) => {
  const authHeader = req.headers.authorization;
  const userId = req.headers['x-user-id'] as string;
  return userId || 'usr_alex_demo';
};

// ==========================================
// 1. SYSTEM & CONFIGURATION
// ==========================================
apiRouter.get('/system/health', (req: Request, res: Response) => {
  const paypalStatus = paypalService.getConfigStatus();
  const pubKeyInfo = cryptoService.getPublicKeyInfo();

  res.json({
    status: 'healthy',
    geminiConfigured: aiService.isGeminiConfigured(),
    geminiModel: 'gemini-2.5-flash',
    paypalConfigured: paypalStatus.isConfigured,
    paypalMode: paypalStatus.mode,
    firebaseConfigured: false, // Truthful status when external Firebase service account is not loaded
    cryptoKeysLoaded: true,
    signingKeyId: pubKeyInfo.keyId,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get('/crypto/public-key', (req: Request, res: Response) => {
  res.json(cryptoService.getPublicKeyInfo());
});

// ==========================================
// 2. PROJECTS
// ==========================================
apiRouter.get('/projects', (req: Request, res: Response) => {
  const userId = getUserContext(req);
  const projects = dbService.listProjects(userId);
  res.json({ projects });
});

apiRouter.get('/projects/:id', (req: Request, res: Response) => {
  const userId = getUserContext(req);
  const project = dbService.getProject(req.params.id, userId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found or unauthorized' });
  }
  const agreement = dbService.getAgreementByProject(project.id);
  const conversation = dbService.getConversation(project.id);
  res.json({ project, agreement, conversation });
});

apiRouter.post('/projects', (req: Request, res: Response) => {
  const userId = getUserContext(req);
  const { name, description, clientName, clientOrg, clientEmail } = req.body;

  if (!name || !clientName) {
    return res.status(400).json({ error: 'Project name and client name are required' });
  }

  const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const agreementId = `agmt_${projectId}`;

  const project = dbService.createProject({
    id: projectId,
    userId,
    name,
    description: description || '',
    client: {
      id: `client_${Date.now()}`,
      name: clientName,
      organization: clientOrg || '',
      email: clientEmail || '',
    },
    freelancer: {
      id: userId,
      name: 'Alex Morgan',
      email: 'alex@alexmorgandesign.com',
    },
    status: 'ACTIVE',
    agreementId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed conversation
  dbService.saveConversation({
    id: `conv_${projectId}`,
    projectId,
    title: `${name} Intake Conversation`,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json({ project });
});

// ==========================================
// 3. CONVERSATIONS
// ==========================================
apiRouter.get('/conversations/:projectId', (req: Request, res: Response) => {
  const conv = dbService.getConversation(req.params.projectId);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json({ conversation: conv });
});

apiRouter.post('/conversations/:projectId/messages', (req: Request, res: Response) => {
  const conv = dbService.getConversation(req.params.projectId);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const { speaker, speakerRole, text, sourceType } = req.body;
  if (!speaker || !text) {
    return res.status(400).json({ error: 'Speaker and text are required' });
  }

  const newMsg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    speaker,
    speakerRole: speakerRole || 'CLIENT',
    text,
    timestamp: new Date().toISOString(),
    sourceType: sourceType || 'SYNTHETIC_DEMO',
  };

  conv.messages.push(newMsg);
  conv.updatedAt = new Date().toISOString();
  dbService.saveConversation(conv);

  res.status(201).json({ message: newMsg, conversation: conv });
});

// ==========================================
// 4. AI EXTRACTION & EVIDENCE VALIDATION
// ==========================================
apiRouter.post('/ai/extract', async (req: Request, res: Response) => {
  try {
    const { projectId, messages } = req.body;
    let messageList = messages;

    if (!messageList && projectId) {
      const conv = dbService.getConversation(projectId);
      if (conv) messageList = conv.messages;
    }

    if (!messageList || messageList.length === 0) {
      return res.status(400).json({ error: 'No conversation messages provided for extraction' });
    }

    const extractionResult = await aiService.extractAgreementTerms(messageList);
    res.json(extractionResult);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Extraction error: ${msg}` });
  }
});

// ==========================================
// 5. AGREEMENTS & VERSIONING
// ==========================================
apiRouter.get('/agreements/:id', (req: Request, res: Response) => {
  const agmt = dbService.getAgreement(req.params.id);
  if (!agmt) {
    return res.status(404).json({ error: 'Agreement not found' });
  }
  const milestones = dbService.getMilestones(agmt.id);
  res.json({ agreement: agmt, milestones });
});

apiRouter.post('/agreements', (req: Request, res: Response) => {
  const userId = getUserContext(req);
  const {
    projectId,
    projectName,
    projectDescription,
    client,
    freelancer,
    deliverables,
    revisionLimit,
    totalPrice,
    advancePayment,
    remainingPayment,
    currency,
    timelineDays,
    timelineConditions,
    approvalRequirements,
    extractedTerms,
  } = req.body;

  if (!projectName || !client?.name || totalPrice === undefined) {
    return res.status(400).json({ error: 'Missing required agreement terms' });
  }

  const agreementId = `agmt_${projectId || Date.now()}`;
  const versionId = `ver_1_${Date.now()}`;

  // Deterministic Fingerprint
  const { fingerprint } = cryptoService.generateAgreementFingerprint({
    projectName,
    projectDescription,
    client,
    freelancer: freelancer || { name: 'Alex Morgan', email: 'alex@alexmorgandesign.com' },
    deliverables: deliverables || [],
    revisionLimit: revisionLimit || 2,
    totalPrice: totalPrice || 100,
    advancePayment: advancePayment || 50,
    remainingPayment: remainingPayment || 50,
    currency: currency || 'USD',
    timelineDays: timelineDays || 7,
    timelineConditions: timelineConditions || '',
    approvalRequirements: approvalRequirements || '',
  });

  const initialVersion: AgreementVersion = {
    id: versionId,
    agreementId,
    versionNumber: 1,
    client,
    freelancer: freelancer || { name: 'Alex Morgan', email: 'alex@alexmorgandesign.com' },
    projectName,
    projectDescription: projectDescription || '',
    deliverables: deliverables || [],
    revisionLimit: revisionLimit || 2,
    totalPrice: totalPrice || 100,
    advancePayment: advancePayment || 50,
    remainingPayment: remainingPayment || 50,
    currency: currency || 'USD',
    timelineDays: timelineDays || 7,
    timelineConditions: timelineConditions || '',
    approvalRequirements: approvalRequirements || '',
    extractedTerms: extractedTerms || [],
    canonicalFingerprint: fingerprint,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    createdBy: userId,
    isImmutable: false,
  };

  const reviewToken = dbService.createReviewToken(agreementId, versionId);

  const newAgreement = dbService.saveAgreement({
    id: agreementId,
    projectId: projectId || 'proj_unknown',
    userId,
    currentVersionId: versionId,
    status: 'DRAFT',
    versions: [initialVersion],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewToken,
    reviewTokenExpiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
  });

  // Create payment milestones linked to this agreement
  const advanceAmount = advancePayment || totalPrice / 2;
  const remainingAmount = remainingPayment || (totalPrice - advanceAmount);

  const milestones: PaymentMilestone[] = [
    {
      id: `ms-adv-${Date.now()}`,
      agreementId,
      versionId,
      title: 'Initial Advance Payment (Kickoff)',
      amount: advanceAmount,
      currency: currency || 'USD',
      condition: 'Due upon mutual agreement confirmation before kickoff.',
      status: 'PENDING_CONFIRMATION',
    },
    {
      id: `ms-rem-${Date.now()}`,
      agreementId,
      versionId,
      title: 'Remaining Balance (Approved Deliverables)',
      amount: remainingAmount,
      currency: currency || 'USD',
      condition: 'Due once final files are approved by client.',
      status: 'PENDING_CONFIRMATION',
    },
  ];
  dbService.setMilestones(agreementId, milestones);

  res.status(201).json({ agreement: newAgreement, milestones });
});

// Freelancer confirms an agreement version
apiRouter.post('/agreements/:id/confirm-freelancer', (req: Request, res: Response) => {
  const userId = getUserContext(req);
  const agmt = dbService.getAgreement(req.params.id, userId);
  if (!agmt) return res.status(404).json({ error: 'Agreement not found' });

  const currentVer = agmt.versions.find(v => v.id === agmt.currentVersionId);
  if (!currentVer) return res.status(400).json({ error: 'Current version not found' });

  currentVer.freelancerConfirmed = {
    id: `conf_free_${Date.now()}`,
    agreementId: agmt.id,
    versionId: currentVer.id,
    fingerprint: currentVer.canonicalFingerprint,
    party: 'FREELANCER',
    signerName: currentVer.freelancer.name,
    signerEmail: currentVer.freelancer.email,
    signerIdentity: userId,
    confirmedAt: new Date().toISOString(),
  };

  // If client also confirmed same version, mark mutually confirmed!
  if (currentVer.clientConfirmed) {
    currentVer.status = 'CONFIRMED';
    currentVer.isImmutable = true;
    agmt.status = 'CONFIRMED';

    // Unlock advance milestone to READY_TO_PAY
    const msList = dbService.getMilestones(agmt.id);
    if (msList.length > 0 && msList[0].status === 'PENDING_CONFIRMATION') {
      msList[0].status = 'READY_TO_PAY';
      dbService.setMilestones(agmt.id, msList);
    }
  } else {
    currentVer.status = 'WAITING_CLIENT_CONFIRMATION';
    agmt.status = 'WAITING_CLIENT_CONFIRMATION';
  }

  agmt.updatedAt = new Date().toISOString();
  dbService.saveAgreement(agmt);

  res.json({ agreement: agmt, currentVersion: currentVer });
});

// Generate fresh client review link
apiRouter.post('/agreements/:id/generate-review-link', (req: Request, res: Response) => {
  const userId = getUserContext(req);
  const agmt = dbService.getAgreement(req.params.id, userId);
  if (!agmt) return res.status(404).json({ error: 'Agreement not found' });

  const token = dbService.createReviewToken(agmt.id, agmt.currentVersionId);
  agmt.reviewToken = token;
  agmt.reviewTokenExpiresAt = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
  dbService.saveAgreement(agmt);

  res.json({ token, reviewUrl: `/review/${token}` });
});

// Create new version (e.g. from requested changes or addendum)
apiRouter.post('/agreements/:id/version', (req: Request, res: Response) => {
  const userId = getUserContext(req);
  const agmt = dbService.getAgreement(req.params.id, userId);
  if (!agmt) return res.status(404).json({ error: 'Agreement not found' });

  const {
    deliverables,
    revisionLimit,
    totalPrice,
    advancePayment,
    remainingPayment,
    timelineDays,
    timelineConditions,
    approvalRequirements,
    changeSummary,
  } = req.body;

  const currentVer = agmt.versions.find(v => v.id === agmt.currentVersionId);
  if (!currentVer) return res.status(400).json({ error: 'Current version not found' });

  const newVersionNumber = agmt.versions.length + 1;
  const newVersionId = `ver_${newVersionNumber}_${Date.now()}`;

  const updatedData = {
    projectName: currentVer.projectName,
    projectDescription: currentVer.projectDescription,
    client: currentVer.client,
    freelancer: currentVer.freelancer,
    deliverables: deliverables || currentVer.deliverables,
    revisionLimit: revisionLimit !== undefined ? revisionLimit : currentVer.revisionLimit,
    totalPrice: totalPrice !== undefined ? totalPrice : currentVer.totalPrice,
    advancePayment: advancePayment !== undefined ? advancePayment : currentVer.advancePayment,
    remainingPayment: remainingPayment !== undefined ? remainingPayment : currentVer.remainingPayment,
    currency: currentVer.currency,
    timelineDays: timelineDays !== undefined ? timelineDays : currentVer.timelineDays,
    timelineConditions: timelineConditions !== undefined ? timelineConditions : currentVer.timelineConditions,
    approvalRequirements: approvalRequirements !== undefined ? approvalRequirements : currentVer.approvalRequirements,
  };

  const { fingerprint } = cryptoService.generateAgreementFingerprint(updatedData);

  const newVersion: AgreementVersion = {
    ...updatedData,
    id: newVersionId,
    agreementId: agmt.id,
    versionNumber: newVersionNumber,
    canonicalFingerprint: fingerprint,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    createdBy: userId,
    changeSummary: changeSummary || `Version ${newVersionNumber} update`,
    isImmutable: false,
    extractedTerms: currentVer.extractedTerms,
  };

  agmt.versions.unshift(newVersion);
  agmt.currentVersionId = newVersionId;
  agmt.status = 'DRAFT';
  agmt.updatedAt = new Date().toISOString();

  // Create new review token for new version
  const reviewToken = dbService.createReviewToken(agmt.id, newVersionId);
  agmt.reviewToken = reviewToken;
  dbService.saveAgreement(agmt);

  res.status(201).json({ agreement: agmt, newVersion });
});

// ==========================================
// 6. CLIENT REVIEW (TOKEN AUTHENTICATED)
// ==========================================
apiRouter.get('/review/:token', (req: Request, res: Response) => {
  const token = req.params.token;
  const tokenData = dbService.validateReviewToken(token);

  if (!tokenData) {
    return res.status(403).json({
      error: 'Invalid or expired review link. Please request an updated link from the freelancer.',
    });
  }

  const agmt = dbService.getAgreement(tokenData.agreementId);
  if (!agmt) return res.status(404).json({ error: 'Agreement not found' });

  const targetVersion = agmt.versions.find(v => v.id === tokenData.versionId);
  if (!targetVersion) return res.status(404).json({ error: 'Target agreement version not found' });

  const milestones = dbService.getMilestones(agmt.id).filter(m => m.versionId === targetVersion.id);

  res.json({
    agreementId: agmt.id,
    version: targetVersion,
    milestones,
    freelancerConfirmed: !!targetVersion.freelancerConfirmed,
    clientConfirmed: !!targetVersion.clientConfirmed,
    isConfirmed: targetVersion.status === 'CONFIRMED',
  });
});

apiRouter.post('/review/:token/confirm', (req: Request, res: Response) => {
  const token = req.params.token;
  const tokenData = dbService.validateReviewToken(token);
  if (!tokenData) {
    return res.status(403).json({ error: 'Invalid or expired review link.' });
  }

  const agmt = dbService.getAgreement(tokenData.agreementId);
  if (!agmt) return res.status(404).json({ error: 'Agreement not found' });

  const targetVersion = agmt.versions.find(v => v.id === tokenData.versionId);
  if (!targetVersion) return res.status(404).json({ error: 'Version not found' });

  const { signerName, signerEmail } = req.body;
  if (!signerName) return res.status(400).json({ error: 'Signer name is required' });

  targetVersion.clientConfirmed = {
    id: `conf_client_${Date.now()}`,
    agreementId: agmt.id,
    versionId: targetVersion.id,
    fingerprint: targetVersion.canonicalFingerprint,
    party: 'CLIENT',
    signerName,
    signerEmail: signerEmail || targetVersion.client.email,
    signerIdentity: `token_${token.substring(0, 12)}`,
    confirmedAt: new Date().toISOString(),
    reviewTokenUsed: token,
  };

  // If freelancer has also confirmed this version, mark CONFIRMED!
  if (targetVersion.freelancerConfirmed) {
    targetVersion.status = 'CONFIRMED';
    targetVersion.isImmutable = true;
    agmt.status = 'CONFIRMED';

    // Unlock advance milestone to READY_TO_PAY
    const msList = dbService.getMilestones(agmt.id);
    if (msList.length > 0 && msList[0].status === 'PENDING_CONFIRMATION') {
      msList[0].status = 'READY_TO_PAY';
      dbService.setMilestones(agmt.id, msList);
    }
  }

  agmt.updatedAt = new Date().toISOString();
  dbService.saveAgreement(agmt);

  res.json({ success: true, version: targetVersion, status: targetVersion.status });
});

apiRouter.post('/review/:token/request-changes', (req: Request, res: Response) => {
  const token = req.params.token;
  const tokenData = dbService.validateReviewToken(token);
  if (!tokenData) return res.status(403).json({ error: 'Invalid or expired review link' });

  const agmt = dbService.getAgreement(tokenData.agreementId);
  if (!agmt) return res.status(404).json({ error: 'Agreement not found' });

  const targetVersion = agmt.versions.find(v => v.id === tokenData.versionId);
  if (!targetVersion) return res.status(404).json({ error: 'Version not found' });

  const { correctionNotes } = req.body;
  targetVersion.status = 'CHANGES_REQUESTED';
  agmt.status = 'CHANGES_REQUESTED';
  agmt.updatedAt = new Date().toISOString();
  dbService.saveAgreement(agmt);

  dbService.logAudit({
    userId: agmt.userId,
    entityType: 'AGREEMENT',
    entityId: agmt.id,
    action: 'CLIENT_REQUESTED_CHANGES',
    metadata: { notes: correctionNotes, version: targetVersion.versionNumber },
  });

  res.json({ success: true, message: 'Changes requested successfully' });
});

// ==========================================
// 7. PAYMENTS & RECONCILIATION
// ==========================================
apiRouter.get('/payments/milestones/:agreementId', (req: Request, res: Response) => {
  const milestones = dbService.getMilestones(req.params.agreementId);
  res.json({ milestones });
});

apiRouter.post('/payments/create-order', async (req: Request, res: Response) => {
  try {
    const { agreementId, milestoneId, isSyntheticDemo } = req.body;
    const agmt = dbService.getAgreement(agreementId);
    if (!agmt) return res.status(404).json({ error: 'Agreement not found' });

    const currentVer = agmt.versions.find(v => v.id === agmt.currentVersionId);
    if (!currentVer) return res.status(400).json({ error: 'Current agreement version not found' });

    // Check mutual confirmation rule: agreement must be confirmed!
    if (currentVer.status !== 'CONFIRMED' && !isSyntheticDemo) {
      return res.status(400).json({
        error: 'Payment orders can only be created for mutually confirmed agreements.',
      });
    }

    const milestones = dbService.getMilestones(agreementId);
    const ms = milestones.find(m => m.id === milestoneId);
    if (!ms) return res.status(404).json({ error: 'Milestone not found' });

    if (ms.status === 'PAID') {
      return res.status(400).json({ error: 'Milestone is already paid' });
    }

    const orderRes = await paypalService.createOrder({
      milestoneId: ms.id,
      milestoneTitle: ms.title,
      amount: ms.amount,
      currency: ms.currency,
      agreementId: agmt.id,
      versionId: currentVer.id,
      projectId: agmt.projectId,
      isSyntheticDemo: !!isSyntheticDemo,
    });

    ms.paypalOrderId = orderRes.orderId;
    ms.status = 'AWAITING_APPROVAL';
    dbService.updateMilestone(agreementId, ms.id, ms);

    res.json(orderRes);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/payments/capture-order', async (req: Request, res: Response) => {
  try {
    const { agreementId, milestoneId, orderId } = req.body;
    const agmt = dbService.getAgreement(agreementId);
    if (!agmt) return res.status(404).json({ error: 'Agreement not found' });

    const currentVer = agmt.versions.find(v => v.id === agmt.currentVersionId);
    if (!currentVer) return res.status(400).json({ error: 'Current version not found' });

    const milestones = dbService.getMilestones(agreementId);
    const ms = milestones.find(m => m.id === milestoneId);
    if (!ms) return res.status(404).json({ error: 'Milestone not found' });

    if (ms.status === 'PAID') {
      return res.status(400).json({ error: 'Milestone already captured and paid.' });
    }

    // Capture & reconcile server-side
    const captureResult = await paypalService.captureOrder(orderId, ms);

    if (!captureResult.success || !captureResult.reconciled) {
      return res.status(400).json({
        error: captureResult.message,
        details: captureResult,
      });
    }

    // Update milestone state
    ms.status = 'PAID';
    ms.paypalCaptureId = captureResult.captureId;
    ms.paidAt = new Date().toISOString();
    dbService.updateMilestone(agreementId, ms.id, ms);

    // If advance milestone was paid, unlock the next milestone (Remaining balance) to READY_TO_PAY or PENDING_APPROVAL
    const nextMilestone = milestones.find(m => m.id !== ms.id && m.status === 'PENDING_CONFIRMATION');
    if (nextMilestone) {
      nextMilestone.status = 'READY_TO_PAY';
      dbService.updateMilestone(agreementId, nextMilestone.id, nextMilestone);
    }

    // Generate Tamper-Evident Ed25519 Signed Digital Receipt
    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const signedData = cryptoService.signReceipt({
      receiptId,
      projectId: agmt.projectId,
      agreementId: agmt.id,
      versionNumber: currentVer.versionNumber,
      agreementFingerprint: currentVer.canonicalFingerprint,
      milestoneId: ms.id,
      milestoneTitle: ms.title,
      amount: ms.amount,
      currency: ms.currency,
      payerName: captureResult.payerName || currentVer.client.name,
      payerEmail: captureResult.payerEmail || currentVer.client.email,
      paypalOrderId: captureResult.orderId,
      paypalCaptureId: captureResult.captureId,
      paymentTimestamp: ms.paidAt,
    });

    const receipt = dbService.saveReceipt({
      receiptId,
      projectId: agmt.projectId,
      agreementId: agmt.id,
      versionId: currentVer.id,
      versionNumber: currentVer.versionNumber,
      agreementFingerprint: currentVer.canonicalFingerprint,
      milestoneId: ms.id,
      milestoneTitle: ms.title,
      amount: ms.amount,
      currency: ms.currency,
      payerName: captureResult.payerName || currentVer.client.name,
      payerEmail: captureResult.payerEmail || currentVer.client.email,
      paypalOrderId: captureResult.orderId,
      paypalCaptureId: captureResult.captureId,
      paymentTimestamp: ms.paidAt,
      receiptCreatedAt: new Date().toISOString(),
      signingKeyId: signedData.signingKeyId,
      signature: signedData.signature,
      payloadHash: signedData.payloadHash,
      verificationPublicKeyRef: signedData.verificationPublicKeyRef,
      isSyntheticDemo: orderId.startsWith('SYNTH_PP_'),
    });

    res.json({
      success: true,
      capture: captureResult,
      milestone: ms,
      receipt,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: msg });
  }
});

// ==========================================
// 8. RECEIPTS & INDEPENDENT VERIFICATION
// ==========================================
apiRouter.get('/payments/receipts', (req: Request, res: Response) => {
  const agreementId = req.query.agreementId as string;
  const receipts = dbService.listReceipts(agreementId);
  res.json({ receipts });
});

apiRouter.get('/payments/receipts/:receiptId', (req: Request, res: Response) => {
  const receipt = dbService.getReceipt(req.params.receiptId);
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
  res.json({ receipt });
});

apiRouter.post('/receipts/verify', (req: Request, res: Response) => {
  const { receipt, externalPublicKeyHex } = req.body;
  if (!receipt) {
    return res.status(400).json({ error: 'Receipt payload required' });
  }

  const result = cryptoService.verifyReceipt(receipt, externalPublicKeyHex);
  res.json(result);
});

// ==========================================
// 9. SCOPE CHANGE SENTINEL
// ==========================================
apiRouter.post('/scope/analyze', async (req: Request, res: Response) => {
  try {
    const { agreementId, messageText } = req.body;
    if (!messageText) {
      return res.status(400).json({ error: 'Message text is required for analysis' });
    }

    const agmt = dbService.getAgreement(agreementId);
    let currentVer = agmt ? agmt.versions.find(v => v.id === agmt.currentVersionId) : null;

    const deliverables = currentVer ? currentVer.deliverables : ['Three distinct initial logo concepts'];
    const revisions = currentVer ? currentVer.revisionLimit : 2;
    const price = currentVer ? currentVer.totalPrice : 100;
    const days = currentVer ? currentVer.timelineDays : 7;

    const analysis = await aiService.analyzeScopeChange(messageText, deliverables, revisions, price, days);
    if (agmt) {
      analysis.agreementId = agmt.id;
      analysis.versionId = currentVer?.id || '';
      dbService.addScopeAnalysis(agmt.id, analysis);
    }

    res.json(analysis);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/scope/addendum', (req: Request, res: Response) => {
  const { agreementId, scopeAnalysisId, title, termsAdded, additionalPrice, additionalDays } = req.body;

  const agmt = dbService.getAgreement(agreementId);
  if (!agmt) return res.status(404).json({ error: 'Agreement not found' });

  const currentVer = agmt.versions.find(v => v.id === agmt.currentVersionId);
  if (!currentVer) return res.status(400).json({ error: 'Current version not found' });

  const addendum = {
    id: `addendum_${Date.now()}`,
    agreementId,
    baseVersionId: currentVer.id,
    scopeAnalysisId: scopeAnalysisId || '',
    title: title || 'Scope Addendum',
    termsAdded: termsAdded || [],
    additionalPrice: Number(additionalPrice) || 0,
    additionalDays: Number(additionalDays) || 0,
    status: 'PROPOSED' as const,
    createdAt: new Date().toISOString(),
  };

  dbService.addAddendum(agreementId, addendum);

  // If approved/applied, create new agreement version preserving previous version!
  const newDeliverables = [...currentVer.deliverables, ...(termsAdded || [])];
  const newTotalPrice = currentVer.totalPrice + (Number(additionalPrice) || 0);
  const newTimelineDays = currentVer.timelineDays + (Number(additionalDays) || 0);

  const updatedData = {
    projectName: currentVer.projectName,
    projectDescription: currentVer.projectDescription,
    client: currentVer.client,
    freelancer: currentVer.freelancer,
    deliverables: newDeliverables,
    revisionLimit: currentVer.revisionLimit,
    totalPrice: newTotalPrice,
    advancePayment: currentVer.advancePayment,
    remainingPayment: currentVer.remainingPayment + (Number(additionalPrice) || 0),
    currency: currentVer.currency,
    timelineDays: newTimelineDays,
    timelineConditions: currentVer.timelineConditions,
    approvalRequirements: currentVer.approvalRequirements,
  };

  const { fingerprint } = cryptoService.generateAgreementFingerprint(updatedData);

  const newVersionNumber = agmt.versions.length + 1;
  const newVersionId = `ver_${newVersionNumber}_addendum_${Date.now()}`;

  const newVersion: AgreementVersion = {
    ...updatedData,
    id: newVersionId,
    agreementId: agmt.id,
    versionNumber: newVersionNumber,
    canonicalFingerprint: fingerprint,
    status: 'WAITING_CLIENT_CONFIRMATION',
    createdAt: new Date().toISOString(),
    createdBy: agmt.userId,
    changeSummary: `Addendum Applied: ${title}. Added: ${(termsAdded || []).join(', ')}. Price +$${additionalPrice}, Days +${additionalDays}`,
    isImmutable: false,
    extractedTerms: currentVer.extractedTerms,
  };

  agmt.versions.unshift(newVersion);
  agmt.currentVersionId = newVersionId;
  agmt.status = 'WAITING_CLIENT_CONFIRMATION';
  agmt.updatedAt = new Date().toISOString();

  // If additional milestone fee applies, create an addendum payment milestone
  if (additionalPrice > 0) {
    const milestones = dbService.getMilestones(agmt.id);
    milestones.push({
      id: `ms-addendum-${Date.now()}`,
      agreementId: agmt.id,
      versionId: newVersionId,
      title: `Addendum Milestone: ${title}`,
      amount: Number(additionalPrice),
      currency: currentVer.currency,
      condition: 'Due upon client confirmation of scope addendum.',
      status: 'PENDING_CONFIRMATION',
    });
    dbService.setMilestones(agmt.id, milestones);
  }

  // Issue new review token for updated version
  const reviewToken = dbService.createReviewToken(agmt.id, newVersionId);
  agmt.reviewToken = reviewToken;
  dbService.saveAgreement(agmt);

  res.status(201).json({ addendum, newVersion, agreement: agmt });
});

// ==========================================
// 10. AUDIT EVENTS
// ==========================================
apiRouter.get('/audit', (req: Request, res: Response) => {
  const events = dbService.getAuditEvents(50);
  res.json({ auditEvents: events });
});
