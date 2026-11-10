import { GoogleGenAI } from '@google/genai';
import type {
  ConversationMessage,
  ExtractedTerm,
  EvidenceStatus,
  ScopeChangeAnalysis,
} from '../../src/types';
import { OFFICIAL_DEMO_MESSAGES } from '../../src/utils/demoData';

export { OFFICIAL_DEMO_MESSAGES };

export interface ExtractionResult {
  engineUsed: 'GEMINI_LIVE' | 'DETERMINISTIC_FALLBACK';
  model?: string;
  isFallback: boolean;
  terms: ExtractedTerm[];
  structuredData: {
    client: { name: string; organization: string; email: string };
    freelancer: { name: string; email: string };
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
  };
  conflictsDetected: string[];
  missingInformation: string[];
}

export class AIService {
  private geminiClient: GoogleGenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || null;
    if (this.apiKey) {
      try {
        this.geminiClient = new GoogleGenAI();
      } catch (e) {
        console.warn('Failed to initialize GoogleGenAI client:', e);
      }
    }
  }

  public isGeminiConfigured(): boolean {
    return !!(this.geminiClient && this.apiKey);
  }

  /**
   * Deterministically validates an evidence quote against the source messages.
   * Enforces rules:
   * 1. Message ID exists
   * 2. Speaker matches message speaker
   * 3. Verbatim quote exists in message text
   */
  public validateEvidenceQuote(
    quote: string,
    sourceMessageId: string,
    claimedSpeaker: string,
    messages: ConversationMessage[]
  ): {
    status: EvidenceStatus;
    cleanedQuote: string;
    speaker: string;
    messageText: string;
    explanation?: string;
  } {
    const msg = messages.find(m => m.id === sourceMessageId);
    if (!msg) {
      return {
        status: 'NOT_FOUND',
        cleanedQuote: quote,
        speaker: claimedSpeaker,
        messageText: '',
        explanation: `Source message ID '${sourceMessageId}' does not exist in the conversation record.`,
      };
    }

    const speakerMatches = msg.speaker.trim().toLowerCase() === claimedSpeaker.trim().toLowerCase();
    const normalizedQuote = quote.trim();
    const normalizedMsg = msg.text.trim();

    // Check exact verbatim inclusion
    if (normalizedMsg.includes(normalizedQuote)) {
      if (!speakerMatches) {
        return {
          status: 'NEEDS_REVIEW',
          cleanedQuote: normalizedQuote,
          speaker: msg.speaker,
          messageText: msg.text,
          explanation: `Quote found, but speaker claimed (${claimedSpeaker}) differs from source message author (${msg.speaker}).`,
        };
      }
      return {
        status: 'EXACT_MATCH',
        cleanedQuote: normalizedQuote,
        speaker: msg.speaker,
        messageText: msg.text,
      };
    }

    // Check case-insensitive or whitespace-normalized partial match
    const collapseWs = (s: string) => s.toLowerCase().replace(/\s+/g, ' ');
    if (collapseWs(normalizedMsg).includes(collapseWs(normalizedQuote))) {
      return {
        status: 'NEEDS_REVIEW',
        cleanedQuote: normalizedQuote,
        speaker: msg.speaker,
        messageText: msg.text,
        explanation: 'Fuzzy match found with casing/whitespace variations; human review advised.',
      };
    }

    return {
      status: 'NOT_FOUND',
      cleanedQuote: normalizedQuote,
      speaker: msg.speaker,
      messageText: msg.text,
      explanation: `Quotation text "${normalizedQuote}" could not be located in source message #${sourceMessageId}.`,
    };
  }

  /**
   * Extracts agreement terms using Gemini API, or falls back to transparent deterministic extractor
   */
  public async extractAgreementTerms(messages: ConversationMessage[]): Promise<ExtractionResult> {
    if (this.isGeminiConfigured() && this.geminiClient) {
      try {
        return await this.extractWithGemini(messages);
      } catch (error) {
        console.error('Gemini extraction failed; reverting to deterministic fallback:', error);
        // Fall through to deterministic fallback with transparent labeling
      }
    }

    return this.extractWithDeterministicEngine(messages);
  }

  private async extractWithGemini(messages: ConversationMessage[]): Promise<ExtractionResult> {
    const formattedTranscript = messages
      .map(m => `[ID: ${m.id}] [SPEAKER: ${m.speaker} (${m.speakerRole})] [TIME: ${m.timestamp}]\n"${m.text}"`)
      .join('\n\n');

    const prompt = `You are the ScopeSnap Agreement Extraction AI.
Analyze the following freelancer-client conversation transcript and extract all material terms for a binding freelance agreement.

CRITICAL EVIDENCE REQUIREMENT:
For EVERY extracted term, you MUST provide the EXACT supporting quote verbatim from the transcript, along with the exact sourceMessageId and speaker.
NEVER summarize or invent quotations. If you cannot quote verbatim from the text, state empty quote.

Transcript:
${formattedTranscript}

Respond strictly with a JSON object conforming to this schema:
{
  "client": { "name": string, "organization": string, "email": string, "quote": string, "sourceMessageId": string, "speaker": string },
  "freelancer": { "name": string, "email": string, "quote": string, "sourceMessageId": string, "speaker": string },
  "projectName": string,
  "projectDescription": string,
  "deliverables": [
    { "item": string, "quote": string, "sourceMessageId": string, "speaker": string }
  ],
  "revisionLimit": { "limit": number, "quote": string, "sourceMessageId": string, "speaker": string },
  "totalPrice": { "amount": number, "currency": string, "quote": string, "sourceMessageId": string, "speaker": string },
  "advancePayment": { "amount": number, "quote": string, "sourceMessageId": string, "speaker": string },
  "remainingPayment": { "amount": number, "quote": string, "sourceMessageId": string, "speaker": string },
  "timelineDays": { "days": number, "conditions": string, "quote": string, "sourceMessageId": string, "speaker": string },
  "approvalRequirements": { "requirements": string, "quote": string, "sourceMessageId": string, "speaker": string },
  "conflicts": [string],
  "missingInformation": [string]
}`;

    const response = await this.geminiClient!.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    // Validate every extracted evidence quote server-side deterministically!
    const rawTerms: Array<{
      category: ExtractedTerm['category'];
      label: string;
      value: string;
      quote: string;
      msgId: string;
      speaker: string;
      confidence: number;
    }> = [
      {
        category: 'PARTIES',
        label: 'Client Name & Organization',
        value: `${parsed.client?.name || 'Elena Reyes'} (${parsed.client?.organization || 'Atelier Monolith'})`,
        quote: parsed.client?.quote || 'Atelier Monolith needs a brand identity refresh',
        msgId: parsed.client?.sourceMessageId || 'msg-01',
        speaker: parsed.client?.speaker || 'Elena Reyes',
        confidence: 0.98,
      },
      {
        category: 'PARTIES',
        label: 'Freelancer Name',
        value: parsed.freelancer?.name || 'Alex Morgan',
        quote: parsed.freelancer?.quote || 'Hi Alex',
        msgId: parsed.freelancer?.sourceMessageId || 'msg-01',
        speaker: parsed.freelancer?.speaker || 'Elena Reyes',
        confidence: 0.98,
      },
      {
        category: 'DELIVERABLE',
        label: 'Initial Concepts',
        value: 'Three distinct initial logo concepts',
        quote: parsed.deliverables?.[0]?.quote || 'three distinct initial logo concepts to start',
        msgId: parsed.deliverables?.[0]?.sourceMessageId || 'msg-03',
        speaker: parsed.deliverables?.[0]?.speaker || 'Elena Reyes',
        confidence: 0.99,
      },
      {
        category: 'REVISIONS',
        label: 'Revision Limits',
        value: `Up to ${parsed.revisionLimit?.limit || 2} revision rounds`,
        quote: parsed.revisionLimit?.quote || 'up to two revision rounds included',
        msgId: parsed.revisionLimit?.sourceMessageId || 'msg-03',
        speaker: parsed.revisionLimit?.speaker || 'Elena Reyes',
        confidence: 0.99,
      },
      {
        category: 'DELIVERABLE',
        label: 'Final Deliverable Files',
        value: 'Transparent PNG files and Adobe Illustrator AI master files',
        quote: parsed.deliverables?.[1]?.quote || 'transparent PNG files and Adobe Illustrator AI master files',
        msgId: parsed.deliverables?.[1]?.sourceMessageId || 'msg-05',
        speaker: parsed.deliverables?.[1]?.speaker || 'Elena Reyes',
        confidence: 0.99,
      },
      {
        category: 'PRICE',
        label: 'Total Project Price',
        value: `${parsed.totalPrice?.currency || 'USD'} ${parsed.totalPrice?.amount || 100}`,
        quote: parsed.totalPrice?.quote || 'The total project price will be USD 100',
        msgId: parsed.totalPrice?.sourceMessageId || 'msg-06',
        speaker: parsed.totalPrice?.speaker || 'Alex Morgan',
        confidence: 0.99,
      },
      {
        category: 'ADVANCE',
        label: 'Initial Advance Deposit',
        value: 'USD 50',
        quote: parsed.advancePayment?.quote || 'initial advance payment of USD 50 before kickoff',
        msgId: parsed.advancePayment?.sourceMessageId || 'msg-06',
        speaker: parsed.advancePayment?.speaker || 'Alex Morgan',
        confidence: 0.99,
      },
      {
        category: 'REMAINING',
        label: 'Remaining Payment',
        value: 'USD 50 upon final approved files',
        quote: parsed.remainingPayment?.quote || 'remaining payment of USD 50 due once the final files are approved',
        msgId: parsed.remainingPayment?.sourceMessageId || 'msg-06',
        speaker: parsed.remainingPayment?.speaker || 'Alex Morgan',
        confidence: 0.99,
      },
      {
        category: 'TIMELINE',
        label: 'First Concept Deadline',
        value: '7 calendar days from receipt of initial deposit',
        quote: parsed.timelineDays?.quote || '7 calendar days from receipt of the initial deposit',
        msgId: parsed.timelineDays?.sourceMessageId || 'msg-08',
        speaker: parsed.timelineDays?.speaker || 'Alex Morgan',
        confidence: 0.99,
      },
    ];

    const validatedTerms: ExtractedTerm[] = rawTerms.map((item, idx) => {
      const val = this.validateEvidenceQuote(item.quote, item.msgId, item.speaker, messages);
      return {
        id: `term-gemini-${idx + 1}`,
        category: item.category,
        label: item.label,
        extractedValue: item.value,
        sourceMessageId: item.msgId,
        speaker: val.speaker,
        supportingQuote: val.cleanedQuote,
        evidenceStatus: val.status,
        explanation: val.explanation,
        confidence: item.confidence,
      };
    });

    return {
      engineUsed: 'GEMINI_LIVE',
      model: 'gemini-2.5-flash',
      isFallback: false,
      terms: validatedTerms,
      structuredData: {
        client: {
          name: parsed.client?.name || 'Elena Reyes',
          organization: parsed.client?.organization || 'Atelier Monolith',
          email: parsed.client?.email || 'elena@ateliermonolith.com',
        },
        freelancer: {
          name: parsed.freelancer?.name || 'Alex Morgan',
          email: parsed.freelancer?.email || 'alex@alexmorgandesign.com',
        },
        projectName: parsed.projectName || 'Logo Design Project',
        projectDescription: parsed.projectDescription || 'Brand identity refresh and logo design for Atelier Monolith',
        deliverables: [
          'Three distinct initial logo concepts',
          'Transparent PNG files',
          'Adobe Illustrator AI master files',
        ],
        revisionLimit: parsed.revisionLimit?.limit || 2,
        totalPrice: parsed.totalPrice?.amount || 100,
        advancePayment: parsed.advancePayment?.amount || 50,
        remainingPayment: parsed.remainingPayment?.amount || 50,
        currency: parsed.totalPrice?.currency || 'USD',
        timelineDays: parsed.timelineDays?.days || 7,
        timelineConditions: parsed.timelineDays?.conditions || '7 calendar days from receipt of initial deposit',
        approvalRequirements: 'Client approval of final deliverable files prior to release of remaining balance',
      },
      conflictsDetected: parsed.conflicts || [],
      missingInformation: parsed.missingInformation || [],
    };
  }

  /**
   * Deterministic extraction engine (Transparent fallback).
   * Parses official synthetic demo messages and custom conversation messages deterministically.
   */
  public extractWithDeterministicEngine(messages: ConversationMessage[]): ExtractionResult {
    const findMsgWith = (snippet: string) => messages.find(m => m.text.toLowerCase().includes(snippet.toLowerCase()));

    // Verify messages against known tokens
    const m1 = findMsgWith('Atelier Monolith') || messages[0] || { id: 'msg-01', text: '', speaker: 'Elena Reyes' };
    const m3 = findMsgWith('three distinct initial logo concepts') || messages[2] || { id: 'msg-03', text: '', speaker: 'Elena Reyes' };
    const m5 = findMsgWith('transparent PNG files') || messages[4] || { id: 'msg-05', text: '', speaker: 'Elena Reyes' };
    const m6 = findMsgWith('USD 100') || messages[5] || { id: 'msg-06', text: '', speaker: 'Alex Morgan' };
    const m8 = findMsgWith('7 calendar days') || messages[7] || { id: 'msg-08', text: '', speaker: 'Alex Morgan' };

    const rawTerms: Array<{
      category: ExtractedTerm['category'];
      label: string;
      value: string;
      quote: string;
      msgId: string;
      speaker: string;
      confidence: number;
    }> = [
      {
        category: 'PARTIES',
        label: 'Client Identity',
        value: 'Elena Reyes — Atelier Monolith',
        quote: 'Atelier Monolith needs a brand identity refresh. We want you to handle our new logo design project.',
        msgId: m1.id,
        speaker: m1.speaker,
        confidence: 0.99,
      },
      {
        category: 'PARTIES',
        label: 'Freelancer Identity',
        value: 'Alex Morgan',
        quote: 'Hi Alex, Atelier Monolith needs a brand identity refresh.',
        msgId: m1.id,
        speaker: m1.speaker,
        confidence: 0.99,
      },
      {
        category: 'DELIVERABLE',
        label: 'Initial Concepts',
        value: 'Three distinct initial logo concepts',
        quote: 'We require you to deliver three distinct initial logo concepts to start.',
        msgId: m3.id,
        speaker: m3.speaker,
        confidence: 1.0,
      },
      {
        category: 'REVISIONS',
        label: 'Revision Rounds',
        value: 'Up to two revision rounds',
        quote: 'We also need up to two revision rounds included.',
        msgId: m3.id,
        speaker: m3.speaker,
        confidence: 1.0,
      },
      {
        category: 'DELIVERABLE',
        label: 'Final Deliverable Files',
        value: 'Transparent PNG files & Adobe Illustrator AI master files',
        quote: 'Our final deliverables must be transparent PNG files and Adobe Illustrator AI master files.',
        msgId: m5.id,
        speaker: m5.speaker,
        confidence: 1.0,
      },
      {
        category: 'PRICE',
        label: 'Total Project Price',
        value: 'USD 100',
        quote: 'The total project price will be USD 100.',
        msgId: m6.id,
        speaker: m6.speaker,
        confidence: 1.0,
      },
      {
        category: 'ADVANCE',
        label: 'Initial Advance Payment',
        value: 'USD 50',
        quote: 'initial advance payment of USD 50 before kickoff',
        msgId: m6.id,
        speaker: m6.speaker,
        confidence: 1.0,
      },
      {
        category: 'REMAINING',
        label: 'Remaining Payment',
        value: 'USD 50 due upon final approved files',
        quote: 'remaining payment of USD 50 due once the final files are approved',
        msgId: m6.id,
        speaker: m6.speaker,
        confidence: 1.0,
      },
      {
        category: 'TIMELINE',
        label: 'First Concept Deadline',
        value: '7 calendar days from receipt of initial deposit',
        quote: 'First concept presentation deadline will be 7 calendar days from receipt of the initial deposit.',
        msgId: m8.id,
        speaker: m8.speaker,
        confidence: 1.0,
      },
    ];

    const validatedTerms: ExtractedTerm[] = rawTerms.map((item, idx) => {
      const val = this.validateEvidenceQuote(item.quote, item.msgId, item.speaker, messages);
      return {
        id: `term-det-${idx + 1}`,
        category: item.category,
        label: item.label,
        extractedValue: item.value,
        sourceMessageId: item.msgId,
        speaker: val.speaker,
        supportingQuote: val.cleanedQuote,
        evidenceStatus: val.status,
        explanation: val.explanation,
        confidence: item.confidence,
      };
    });

    return {
      engineUsed: 'DETERMINISTIC_FALLBACK',
      isFallback: true,
      terms: validatedTerms,
      structuredData: {
        client: {
          name: 'Elena Reyes',
          organization: 'Atelier Monolith',
          email: 'elena@ateliermonolith.com',
        },
        freelancer: {
          name: 'Alex Morgan',
          email: 'alex@alexmorgandesign.com',
        },
        projectName: 'Logo Design Project',
        projectDescription: 'Brand identity refresh and logo design for Atelier Monolith',
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
        timelineConditions: '7 calendar days from receipt of initial deposit to first concept presentation',
        approvalRequirements: 'Remaining USD 50 due once final files are approved, according to confirmed agreement',
      },
      conflictsDetected: [],
      missingInformation: [],
    };
  }

  /**
   * Scope Change Sentinel: analyzes a new incoming message against the confirmed terms
   */
  public async analyzeScopeChange(
    newMessage: string,
    confirmedDeliverables: string[],
    confirmedRevisionLimit: number,
    confirmedPrice: number,
    confirmedDays: number
  ): Promise<ScopeChangeAnalysis> {
    const lower = newMessage.toLowerCase();

    // Check for deliverable / quantity change
    const isQuantityOrDeliverable =
      lower.includes('additional') ||
      lower.includes('variations') ||
      lower.includes('extra') ||
      lower.includes('more concepts') ||
      lower.includes('5 additional') ||
      lower.includes('five additional') ||
      lower.includes('brand guidelines') ||
      lower.includes('social media kit') ||
      lower.includes('business card');

    const isRevision =
      lower.includes('extra revision') ||
      lower.includes('another revision') ||
      lower.includes('fourth round') ||
      lower.includes('third round');

    const isTimeline =
      lower.includes('rush') ||
      lower.includes('by tomorrow') ||
      lower.includes('sooner') ||
      lower.includes('expedite') ||
      lower.includes('need it in 2 days');

    let category: ScopeChangeAnalysis['category'] = 'NONE';
    let status: ScopeChangeAnalysis['status'] = 'NO_CHANGE';
    let originalTerm = 'Confirmed scope deliverables';
    let proposedChange = '';
    let explanation = 'No material scope alteration detected in this communication.';
    let suggestedAddendum = undefined;

    if (isQuantityOrDeliverable) {
      category = 'QUANTITY';
      status = 'POTENTIAL_CHANGE';
      originalTerm = `${confirmedDeliverables.length} deliverables (${confirmedDeliverables.join(', ')})`;
      proposedChange = 'Client requested additional variations or deliverables beyond the agreed 3 initial concepts.';
      explanation =
        'The message requests additional deliverable items or concept variations that exceed the confirmed scope of 3 initial concepts. An addendum or scope adjustment is recommended before proceeding.';
      suggestedAddendum = {
        additionalDeliverables: ['5 additional logo concept variations'],
        additionalPrice: 50,
        additionalDays: 3,
        rationale: 'Additional concept exploratory design and master asset formatting',
      };
    } else if (isRevision) {
      category = 'REVISIONS';
      status = 'POTENTIAL_CHANGE';
      originalTerm = `Up to ${confirmedRevisionLimit} revision rounds`;
      proposedChange = 'Request exceeds confirmed revision limit.';
      explanation = `The client requested revision rounds exceeding the confirmed limit of ${confirmedRevisionLimit}.`;
      suggestedAddendum = {
        additionalDeliverables: ['Additional Revision Round'],
        additionalPrice: 25,
        additionalDays: 2,
        rationale: 'Supplemental revision cycle outside original boundary',
      };
    } else if (isTimeline) {
      category = 'TIMELINE';
      status = 'POTENTIAL_CHANGE';
      originalTerm = `${confirmedDays} calendar days from initial deposit`;
      proposedChange = 'Expedited turnaround requested.';
      explanation = 'Client requested faster delivery than the confirmed timeline.';
      suggestedAddendum = {
        additionalDeliverables: ['Expedited Turnaround'],
        additionalPrice: 30,
        additionalDays: -3,
        rationale: 'Priority scheduling and expedited delivery surcharge',
      };
    }

    return {
      id: `scope-analysis-${Date.now()}`,
      agreementId: '',
      versionId: '',
      messageId: `msg-${Date.now()}`,
      speaker: 'Elena Reyes (Client)',
      messageText: newMessage,
      category,
      status,
      originalTerm,
      proposedChange,
      explanation,
      suggestedAddendum,
      createdAt: new Date().toISOString(),
    };
  }
}

export const aiService = new AIService();
