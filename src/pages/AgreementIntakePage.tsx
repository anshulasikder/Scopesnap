import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Clock,
  DollarSign,
  FileText,
  User,
  Quote,
  RefreshCw,
  Copy,
} from 'lucide-react';
import type { ExtractedTerm, Project } from '../types';
import { runAIExtraction, createAgreement, fetchProjects } from '../services/api';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { OFFICIAL_DEMO_MESSAGES } from '../utils/demoData';

interface AgreementIntakePageProps {
  onAgreementCreated: (agreementId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const AgreementIntakePage: React.FC<AgreementIntakePageProps> = ({
  onAgreementCreated,
  onNavigateTab,
}) => {
  const [inputText, setInputText] = useState(
    OFFICIAL_DEMO_MESSAGES.map(m => `${m.speaker}: ${m.text}`).join('\n\n')
  );
  const [clientName, setClientName] = useState('Elena Reyes');
  const [clientOrg, setClientOrg] = useState('Atelier Monolith');
  const [clientEmail, setClientEmail] = useState('elena@ateliermonolith.com');
  const [freelancerName, setFreelancerName] = useState('Alex Morgan');
  const [freelancerEmail, setFreelancerEmail] = useState('alex@alexmorgandesign.com');
  const [projectName, setProjectName] = useState('Logo Design Project');

  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [editableDeliverables, setEditableDeliverables] = useState<string[]>([]);
  const [editablePrice, setEditablePrice] = useState<number>(100);
  const [editableAdvance, setEditableAdvance] = useState<number>(50);
  const [editableRemaining, setEditableRemaining] = useState<number>(50);
  const [editableRevisions, setEditableRevisions] = useState<number>(2);
  const [editableDays, setEditableDays] = useState<number>(7);
  const [saving, setSaving] = useState(false);

  const handleLoadOfficialDemo = () => {
    setInputText(OFFICIAL_DEMO_MESSAGES.map(m => `${m.speaker}: ${m.text}`).join('\n\n'));
    setClientName('Elena Reyes');
    setClientOrg('Atelier Monolith');
    setClientEmail('elena@ateliermonolith.com');
    setFreelancerName('Alex Morgan');
    setFreelancerEmail('alex@alexmorgandesign.com');
    setProjectName('Logo Design Project');
  };

  const handleRunExtraction = async () => {
    setLoading(true);
    try {
      // Parse plain transcript lines into structured conversation messages
      const lines = inputText.split('\n\n').filter(Boolean);
      const parsedMessages = lines.map((block, idx) => {
        const colonIdx = block.indexOf(':');
        const speaker = colonIdx > -1 ? block.substring(0, colonIdx).trim() : 'Participant';
        const text = colonIdx > -1 ? block.substring(colonIdx + 1).trim() : block.trim();
        return {
          id: `msg-${String(idx + 1).padStart(2, '0')}`,
          speaker,
          speakerRole: speaker.toLowerCase().includes('alex') ? 'FREELANCER' : 'CLIENT',
          text,
          timestamp: new Date(Date.now() - (lines.length - idx) * 60000).toISOString(),
          sourceType: 'SYNTHETIC_DEMO' as const,
        };
      });

      const res = await runAIExtraction(undefined, parsedMessages);
      setExtractedData(res);

      if (res.structuredData) {
        setEditableDeliverables(res.structuredData.deliverables || []);
        setEditablePrice(res.structuredData.totalPrice || 100);
        setEditableAdvance(res.structuredData.advancePayment || 50);
        setEditableRemaining(res.structuredData.remainingPayment || 50);
        setEditableRevisions(res.structuredData.revisionLimit || 2);
        setEditableDays(res.structuredData.timelineDays || 7);
      }
    } catch (e) {
      console.error('Extraction failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraftAgreement = async () => {
    setSaving(true);
    try {
      const payload = {
        projectId: 'proj_atelier_monolith',
        projectName,
        projectDescription: `Logo design and brand identity refresh for ${clientOrg}`,
        client: {
          id: 'client_elena_reyes',
          name: clientName,
          organization: clientOrg,
          email: clientEmail,
        },
        freelancer: {
          name: freelancerName,
          email: freelancerEmail,
        },
        deliverables: editableDeliverables,
        revisionLimit: editableRevisions,
        totalPrice: editablePrice,
        advancePayment: editableAdvance,
        remainingPayment: editableRemaining,
        currency: 'USD',
        timelineDays: editableDays,
        timelineConditions: `${editableDays} calendar days from receipt of initial deposit`,
        approvalRequirements: 'Client approval of final deliverable files before release of remaining payment.',
        extractedTerms: extractedData?.terms || [],
      };

      const res = await createAgreement(payload);
      if (res?.agreement?.id) {
        onAgreementCreated(res.agreement.id);
        onNavigateTab('agreements');
      }
    } catch (e) {
      console.error('Failed to create agreement:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-8 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#F4F1E8]">
              AI Agreement Intake
            </h1>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400 font-semibold uppercase">
              SYNTHETIC DEMO READY
            </span>
          </div>
          <p className="text-xs font-mono text-stone-400">
            Convert informal client messages into deterministic, evidence-backed agreement terms
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadOfficialDemo}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 text-xs font-mono hover:text-[#D9F36A] hover:bg-stone-750 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Load Official Synthetic Scenario</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input conversation & party details */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-heading font-semibold text-sm text-[#F4F1E8] flex items-center gap-2">
                <Quote className="w-4 h-4 text-[#D9F36A]" />
                Client Conversation Transcript
              </span>
              <span className="text-[11px] font-mono text-stone-500">Unfiltered Evidence Source</span>
            </div>

            <textarea
              rows={12}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Paste chat history from Slack, email, or WhatsApp..."
              className="w-full p-3 rounded-xl bg-[#121716] border border-stone-800 text-stone-200 font-mono text-xs focus:outline-none focus:border-[#D9F36A] leading-relaxed resize-y"
            />

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label className="block text-stone-400 mb-1">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#121716] border border-stone-800 text-stone-200"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Client Organization</label>
                <input
                  type="text"
                  value={clientOrg}
                  onChange={e => setClientOrg(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#121716] border border-stone-800 text-stone-200"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunExtraction}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#D9F36A] text-[#151C1B] font-mono font-bold text-xs hover:bg-[#cbf046] transition cursor-pointer shadow flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Validating Evidence with Gemini / Fallback...' : 'Extract Agreement Terms & Verify Evidence'}</span>
            </button>
          </div>
        </div>

        {/* Right: Extracted Terms & Deterministic Evidence Results */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="text-xs font-mono text-[#648D83] uppercase tracking-wider">
                  Extraction Output
                </span>
                <h3 className="font-heading font-bold text-lg text-[#F4F1E8]">
                  Evidence-Backed Terms
                </h3>
              </div>

              {extractedData && (
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                  extractedData.isFallback ? 'bg-[#2a2415] text-[#facc15] border border-[#facc15]/30' : 'bg-[#152e24] text-[#D9F36A] border border-[#D9F36A]/30'
                }`}>
                  {extractedData.isFallback ? 'DETERMINISTIC FALLBACK (VERIFIED)' : 'GEMINI 2.5 FLASH'}
                </span>
              )}
            </div>

            {extractedData ? (
              <div className="space-y-4">
                {/* Extracted terms list with evidence badges */}
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {extractedData.terms?.map((term: ExtractedTerm) => (
                    <div
                      key={term.id}
                      className="p-3 bg-[#121716] rounded-xl border border-stone-800/80 space-y-2 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 font-semibold">{term.label}</span>
                        <EvidenceBadge
                          status={term.evidenceStatus}
                          quote={term.supportingQuote}
                          sourceMessageId={term.sourceMessageId}
                          speaker={term.speaker}
                          explanation={term.explanation}
                        />
                      </div>

                      <p className="text-stone-100 font-medium text-sm">
                        {term.extractedValue}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Editable review controls */}
                <div className="p-4 bg-[#141b1a] rounded-xl border border-stone-800 space-y-3 text-xs font-mono">
                  <span className="font-semibold text-stone-300 block">Editable Review Summary</span>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-stone-400 text-[11px]">Total Price ($)</label>
                      <input
                        type="number"
                        value={editablePrice}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setEditablePrice(val);
                          setEditableAdvance(val / 2);
                          setEditableRemaining(val / 2);
                        }}
                        className="w-full p-2 rounded bg-[#0f1413] border border-stone-700 text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="text-stone-400 text-[11px]">Deposit ($)</label>
                      <input
                        type="number"
                        value={editableAdvance}
                        onChange={e => setEditableAdvance(Number(e.target.value))}
                        className="w-full p-2 rounded bg-[#0f1413] border border-stone-700 text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="text-stone-400 text-[11px]">Remaining ($)</label>
                      <input
                        type="number"
                        value={editableRemaining}
                        onChange={e => setEditableRemaining(Number(e.target.value))}
                        className="w-full p-2 rounded bg-[#0f1413] border border-stone-700 text-stone-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-stone-400 text-[11px]">Max Revision Rounds</label>
                      <input
                        type="number"
                        value={editableRevisions}
                        onChange={e => setEditableRevisions(Number(e.target.value))}
                        className="w-full p-2 rounded bg-[#0f1413] border border-stone-700 text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="text-stone-400 text-[11px]">Timeline (Days)</label>
                      <input
                        type="number"
                        value={editableDays}
                        onChange={e => setEditableDays(Number(e.target.value))}
                        className="w-full p-2 rounded bg-[#0f1413] border border-stone-700 text-stone-100"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveDraftAgreement}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-[#D9F36A] text-[#151C1B] font-mono font-bold text-xs hover:bg-[#cbf046] transition cursor-pointer shadow flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saving ? 'Computing SHA-256 Fingerprint...' : 'Save Agreement Draft & Generate Canonical Fingerprint'}</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-16 space-y-3 text-xs font-mono text-stone-500">
                <Sparkles className="w-8 h-8 text-stone-600 mx-auto" />
                <p>Click &ldquo;Extract Agreement Terms&rdquo; to analyze the conversation and validate verbatim evidence quotes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
