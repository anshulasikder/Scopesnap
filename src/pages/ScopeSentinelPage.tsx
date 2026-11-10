import React, { useState } from 'react';
import {
  Radar,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Layers,
  Clock,
  DollarSign,
  FilePlus2,
  RefreshCw,
} from 'lucide-react';
import type { ScopeChangeAnalysis, Agreement } from '../types';
import { analyzeScope, applyAddendum, fetchAgreement } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface ScopeSentinelPageProps {
  agreementId?: string;
  onNavigateTab: (tab: string, meta?: Record<string, unknown>) => void;
}

export const ScopeSentinelPage: React.FC<ScopeSentinelPageProps> = ({
  agreementId = 'agmt_logo_design_2026',
  onNavigateTab,
}) => {
  const [messageText, setMessageText] = useState('Can you also prepare five additional variations?');
  const [analysis, setAnalysis] = useState<ScopeChangeAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Addendum Proposal Form state
  const [addendumTitle, setAddendumTitle] = useState('5 Additional Logo Variations');
  const [additionalTerms, setAdditionalTerms] = useState('5 additional logo concept variations in transparent PNG format');
  const [additionalPrice, setAdditionalPrice] = useState<number>(50);
  const [additionalDays, setAdditionalDays] = useState<number>(3);
  const [applyingAddendum, setApplyingAddendum] = useState(false);
  const [addendumSuccess, setAddendumSuccess] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    if (!messageText) return;
    setAnalyzing(true);
    setAddendumSuccess(null);
    try {
      const res = await analyzeScope(agreementId, messageText);
      setAnalysis(res);
      if (res.suggestedAddendum) {
        setAdditionalPrice(res.suggestedAddendum.additionalPrice);
        setAdditionalDays(res.suggestedAddendum.additionalDays);
        setAdditionalTerms(res.suggestedAddendum.additionalDeliverables.join(', '));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyAddendum = async () => {
    if (!analysis) return;
    setApplyingAddendum(true);
    try {
      const res = await applyAddendum({
        agreementId,
        scopeAnalysisId: analysis.id,
        title: addendumTitle,
        termsAdded: [additionalTerms],
        additionalPrice,
        additionalDays,
      });

      setAddendumSuccess(
        `Scope Addendum applied! Created immutable Agreement Version v${res.newVersion.versionNumber} with fingerprint ${res.newVersion.canonicalFingerprint.substring(0, 16)}... and separate payment milestone.`
      );
    } catch (e) {
      console.error(e);
    } finally {
      setApplyingAddendum(false);
    }
  };

  return (
    <div className="w-full space-y-8 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#F4F1E8]">
              Scope Change Sentinel
            </h1>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400 font-semibold uppercase">
              POST-CONFIRMATION DETECTOR
            </span>
          </div>
          <p className="text-xs font-mono text-stone-400">
            Compare incoming client communications against confirmed deliverables to prevent untracked scope creep
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMessageText('Can you also prepare five additional variations?')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-700 bg-stone-800 text-stone-300 text-xs font-mono hover:text-[#D9F36A] transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Load Official Test Message</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Message */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-heading font-semibold text-sm text-[#F4F1E8] flex items-center gap-2">
                <Radar className="w-4 h-4 text-[#D9F36A]" />
                New Client Communication
              </span>
              <span className="text-[11px] font-mono text-stone-500">Incoming Request</span>
            </div>

            <textarea
              rows={5}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Paste new client message received after confirmation..."
              className="w-full p-3 rounded-xl bg-[#121716] border border-stone-800 text-stone-200 font-mono text-xs focus:outline-none focus:border-[#D9F36A] leading-relaxed resize-y"
            />

            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="text-stone-500 text-[11px]">Quick Tests:</span>
              <button
                type="button"
                onClick={() => setMessageText('Can you also prepare five additional variations?')}
                className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
              >
                &ldquo;5 additional variations&rdquo;
              </button>
              <button
                type="button"
                onClick={() => setMessageText('We would like a fourth round of revisions on the colors.')}
                className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
              >
                &ldquo;Fourth round of revisions&rdquo;
              </button>
              <button
                type="button"
                onClick={() => setMessageText('Thanks Alex! The initial draft looks great.')}
                className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
              >
                &ldquo;Looks great! (No change)&rdquo;
              </button>
            </div>

            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="w-full py-3 rounded-xl bg-[#D9F36A] text-[#151C1B] font-mono font-bold text-xs hover:bg-[#cbf046] transition cursor-pointer shadow flex items-center justify-center gap-2"
            >
              <Radar className="w-4 h-4" />
              <span>{analyzing ? 'Evaluating Scope Impact against Confirmed Terms...' : 'Analyze Message Against Confirmed Scope'}</span>
            </button>
          </div>
        </div>

        {/* Right: Sentinel Analysis Result */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-heading font-bold text-lg text-[#F4F1E8]">
                Sentinel Scope Evaluation
              </h3>
              {analysis && <StatusBadge status={analysis.status} isSyntheticDemo={true} />}
            </div>

            {addendumSuccess && (
              <div className="p-4 rounded-xl bg-[#152e24] border border-[#D9F36A]/40 text-xs font-mono text-[#D9F36A] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{addendumSuccess}</span>
              </div>
            )}

            {analysis ? (
              <div className="space-y-4 text-xs font-mono">
                <div className="p-3.5 bg-[#121716] rounded-xl border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between text-stone-400 text-[11px]">
                    <span className="text-[#D9F36A] font-semibold">Change Category:</span>
                    <span>{analysis.category}</span>
                  </div>
                  <p className="text-stone-300 leading-relaxed text-[13px]">
                    {analysis.explanation}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#121716] rounded-xl border border-stone-800 space-y-1">
                    <span className="text-stone-400 text-[11px]">Confirmed Baseline:</span>
                    <p className="text-stone-200 font-medium">{analysis.originalTerm}</p>
                  </div>
                  <div className="p-3 bg-[#121716] rounded-xl border border-stone-800 space-y-1">
                    <span className="text-stone-400 text-[11px]">Requested Change:</span>
                    <p className="text-stone-200 font-medium">{analysis.proposedChange || 'None detected'}</p>
                  </div>
                </div>

                {/* Addendum Proposal Drawer (if scope change detected) */}
                {analysis.status === 'POTENTIAL_CHANGE' && (
                  <div className="p-4 bg-[#141c1a] border border-[#D9F36A]/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-sm text-[#F4F1E8] flex items-center gap-1.5">
                        <FilePlus2 className="w-4 h-4 text-[#D9F36A]" />
                        Scope Addendum Proposal
                      </span>
                      <span className="text-[10px] text-[#D9F36A]">Recommended Adjustment</span>
                    </div>

                    <div>
                      <label className="text-stone-400 text-[11px] block mb-1">Addendum Title</label>
                      <input
                        type="text"
                        value={addendumTitle}
                        onChange={e => setAddendumTitle(e.target.value)}
                        className="w-full p-2 rounded bg-[#0f1413] border border-stone-700 text-stone-100"
                      />
                    </div>

                    <div>
                      <label className="text-stone-400 text-[11px] block mb-1">New Deliverables Added</label>
                      <input
                        type="text"
                        value={additionalTerms}
                        onChange={e => setAdditionalTerms(e.target.value)}
                        className="w-full p-2 rounded bg-[#0f1413] border border-stone-700 text-stone-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-stone-400 text-[11px] block mb-1">Additional Fee ($ USD)</label>
                        <input
                          type="number"
                          value={additionalPrice}
                          onChange={e => setAdditionalPrice(Number(e.target.value))}
                          className="w-full p-2 rounded bg-[#0f1413] border border-stone-700 text-stone-100"
                        />
                      </div>
                      <div>
                        <label className="text-stone-400 text-[11px] block mb-1">Timeline Extension (Days)</label>
                        <input
                          type="number"
                          value={additionalDays}
                          onChange={e => setAdditionalDays(Number(e.target.value))}
                          className="w-full p-2 rounded bg-[#0f1413] border border-stone-700 text-stone-100"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyAddendum}
                      disabled={applyingAddendum}
                      className="w-full py-2.5 rounded-lg bg-[#D9F36A] text-[#151C1B] font-bold text-xs hover:bg-[#cbf046] transition cursor-pointer shadow flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{applyingAddendum ? 'Generating Version v2...' : 'Apply Scope Addendum & Issue v2'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 space-y-2 text-xs font-mono text-stone-500">
                <Radar className="w-8 h-8 text-stone-600 mx-auto" />
                <p>Click &ldquo;Analyze Message&rdquo; to test against confirmed deliverables and revision limits.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
