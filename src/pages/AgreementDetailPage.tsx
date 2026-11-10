import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Share2,
  Copy,
  Check,
  Calendar,
  DollarSign,
  User,
  Layers,
  FileCheck,
  AlertCircle,
  ExternalLink,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { Agreement, AgreementVersion, PaymentMilestone } from '../types';
import { fetchAgreement, confirmFreelancer, generateReviewLink } from '../services/api';
import { FingerprintBox } from '../components/FingerprintBox';
import { StatusBadge } from '../components/StatusBadge';
import { EvidenceBadge } from '../components/EvidenceBadge';

interface AgreementDetailPageProps {
  agreementId?: string;
  onNavigateTab: (tab: string, meta?: Record<string, unknown>) => void;
}

export const AgreementDetailPage: React.FC<AgreementDetailPageProps> = ({
  agreementId = 'agmt_logo_design_2026',
  onNavigateTab,
}) => {
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reviewUrl, setReviewUrl] = useState<string>('');

  const loadAgreement = async (id: string) => {
    try {
      const data = await fetchAgreement(id);
      setAgreement(data.agreement);
      setMilestones(data.milestones || []);
      if (!selectedVersionId && data.agreement.currentVersionId) {
        setSelectedVersionId(data.agreement.currentVersionId);
      }
      if (data.agreement.reviewToken) {
        setReviewUrl(`${window.location.origin}/review/${data.agreement.reviewToken}`);
      }
    } catch (e) {
      console.error('Error fetching agreement:', e);
    }
  };

  useEffect(() => {
    loadAgreement(agreementId);
  }, [agreementId]);

  const currentVer = agreement?.versions.find(
    v => v.id === (selectedVersionId || agreement.currentVersionId)
  );

  const handleFreelancerConfirm = async () => {
    if (!agreement) return;
    setConfirming(true);
    try {
      const res = await confirmFreelancer(agreement.id);
      setAgreement(res.agreement);
    } catch (e) {
      console.error(e);
    } finally {
      setConfirming(false);
    }
  };

  const handleCopyReviewLink = async () => {
    if (!agreement) return;
    try {
      let url = reviewUrl;
      if (!url) {
        const linkRes = await generateReviewLink(agreement.id);
        url = `${window.location.origin}${linkRes.reviewUrl}`;
        setReviewUrl(url);
      }
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  if (!agreement || !currentVer) {
    return (
      <div className="py-20 text-center text-xs font-mono text-stone-500">
        Loading agreement data...
      </div>
    );
  }

  const isMutuallyConfirmed = currentVer.status === 'CONFIRMED';

  return (
    <div className="w-full space-y-8 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#F4F1E8]">
              {currentVer.projectName}
            </h1>
            <StatusBadge status={currentVer.status} isSyntheticDemo={true} />
            {currentVer.isImmutable && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px] font-mono text-stone-300">
                <Lock className="w-3 h-3 text-[#D9F36A]" />
                IMMUTABLE
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-stone-400">
            Agreement ID: <code className="text-stone-300">{agreement.id}</code> • Version: <strong className="text-stone-200">v{currentVer.versionNumber}</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopyReviewLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 text-xs font-mono hover:text-[#D9F36A] hover:bg-stone-750 transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#D9F36A]" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Review Link Copied!' : 'Copy Client Review Link'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('client-review', { token: agreement.reviewToken })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#648D83]/20 border border-[#648D83]/40 text-[#648D83] text-xs font-mono hover:text-white hover:bg-[#648D83]/30 transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Client Review View</span>
          </button>
        </div>
      </div>

      {/* Version Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-800/60">
        <span className="text-xs font-mono text-stone-400 shrink-0">Version History:</span>
        {agreement.versions.map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => setSelectedVersionId(v.id)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
              v.id === currentVer.id
                ? 'bg-[#D9F36A] text-[#151C1B] font-bold'
                : 'bg-[#18201e] border border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            v{v.versionNumber} {v.isImmutable ? '(Locked)' : ''}
          </button>
        ))}
      </div>

      {/* Canonical SHA-256 Fingerprint */}
      <FingerprintBox
        fingerprint={currentVer.canonicalFingerprint}
        versionNumber={currentVer.versionNumber}
      />

      {/* Two-Party Confirmation Status Panel */}
      <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D9F36A]" />
            <h3 className="font-heading font-semibold text-base text-[#F4F1E8]">
              Two-Party Confirmation Status
            </h3>
          </div>
          <span className="text-xs font-mono text-stone-400">
            {isMutuallyConfirmed ? 'Mutually Confirmed & Bound' : 'Pending Two-Party Signatures'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Freelancer Confirmation */}
          <div className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
            currentVer.freelancerConfirmed
              ? 'bg-[#121c18] border-[#D9F36A]/40 text-stone-200'
              : 'bg-[#121716] border-stone-800 text-stone-400'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-300">Freelancer Confirmation</span>
              {currentVer.freelancerConfirmed ? (
                <span className="text-[#D9F36A] flex items-center gap-1 text-[11px]">
                  <Check className="w-3.5 h-3.5" /> Confirmed
                </span>
              ) : (
                <span className="text-amber-400 text-[11px]">Unconfirmed</span>
              )}
            </div>
            <p className="text-stone-300">{currentVer.freelancer.name} ({currentVer.freelancer.email})</p>
            {currentVer.freelancerConfirmed ? (
              <p className="text-[10px] text-stone-500">
                Timestamp: {new Date(currentVer.freelancerConfirmed.confirmedAt).toLocaleString()}
              </p>
            ) : (
              <button
                type="button"
                onClick={handleFreelancerConfirm}
                disabled={confirming}
                className="mt-2 px-3 py-1.5 rounded-lg bg-[#D9F36A] text-[#151C1B] font-bold text-xs hover:bg-[#cbf046] transition cursor-pointer"
              >
                {confirming ? 'Signing...' : 'Sign & Confirm Version v' + currentVer.versionNumber}
              </button>
            )}
          </div>

          {/* Client Confirmation */}
          <div className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
            currentVer.clientConfirmed
              ? 'bg-[#121c18] border-[#D9F36A]/40 text-stone-200'
              : 'bg-[#121716] border-stone-800 text-stone-400'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-300">Client Confirmation</span>
              {currentVer.clientConfirmed ? (
                <span className="text-[#D9F36A] flex items-center gap-1 text-[11px]">
                  <Check className="w-3.5 h-3.5" /> Confirmed
                </span>
              ) : (
                <span className="text-amber-400 text-[11px]">Awaiting Client Review</span>
              )}
            </div>
            <p className="text-stone-300">{currentVer.client.name} — {currentVer.client.organization}</p>
            {currentVer.clientConfirmed ? (
              <p className="text-[10px] text-stone-500">
                Timestamp: {new Date(currentVer.clientConfirmed.confirmedAt).toLocaleString()}
              </p>
            ) : (
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReviewLink}
                  className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 text-stone-300 text-[11px] hover:text-white transition cursor-pointer"
                >
                  Copy Review Link
                </button>
                <span className="text-[10px] text-stone-500">Send link to Elena Reyes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agreement Terms Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Deliverables Section */}
          <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold text-base text-[#F4F1E8] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D9F36A]" />
              Agreed Deliverables & File Formats
            </h3>

            <div className="space-y-2">
              {currentVer.deliverables.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#121716] rounded-xl border border-stone-800 text-xs font-mono flex items-center justify-between"
                >
                  <span className="text-stone-200">{item}</span>
                  <EvidenceBadge
                    status="EXACT_MATCH"
                    quote={item}
                    sourceMessageId="msg-03"
                    speaker="Elena Reyes"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Timeline & Revisions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-5 space-y-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-stone-400">
                <Clock className="w-4 h-4 text-[#648D83]" />
                <span className="font-semibold">Presentation Timeline</span>
              </div>
              <p className="text-stone-100 font-medium text-sm">
                {currentVer.timelineDays} calendar days
              </p>
              <p className="text-stone-400 text-[11px]">{currentVer.timelineConditions}</p>
            </div>

            <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-5 space-y-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-stone-400">
                <Layers className="w-4 h-4 text-[#648D83]" />
                <span className="font-semibold">Revision Boundary</span>
              </div>
              <p className="text-stone-100 font-medium text-sm">
                Up to {currentVer.revisionLimit} revision rounds
              </p>
              <p className="text-stone-400 text-[11px]">Additional iterations require scope addendum</p>
            </div>
          </div>

          {/* Verbatim Supporting Evidence Drawer */}
          <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold text-base text-[#F4F1E8] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#D9F36A]" />
              Supporting Conversation Evidence ({currentVer.extractedTerms.length} terms)
            </h3>

            <div className="space-y-3">
              {currentVer.extractedTerms.map(term => (
                <div
                  key={term.id}
                  className="p-3.5 bg-[#121716] rounded-xl border border-stone-800 space-y-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-300">{term.label}</span>
                    <EvidenceBadge
                      status={term.evidenceStatus}
                      quote={term.supportingQuote}
                      sourceMessageId={term.sourceMessageId}
                      speaker={term.speaker}
                      explanation={term.explanation}
                    />
                  </div>
                  <p className="text-stone-100 font-medium">{term.extractedValue}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Payment Milestones */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#D9F36A]" />
                <h3 className="font-heading font-semibold text-base text-[#F4F1E8]">
                  Payment Milestones
                </h3>
              </div>
              <span className="text-xs font-heading font-bold text-[#D9F36A]">
                {currentVer.currency} ${currentVer.totalPrice} Total
              </span>
            </div>

            <div className="space-y-3">
              {milestones.map(ms => (
                <div
                  key={ms.id}
                  className="p-4 bg-[#121716] rounded-xl border border-stone-800 space-y-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-200">{ms.title}</span>
                    <StatusBadge status={ms.status} isSyntheticDemo={ms.isSyntheticDemo} />
                  </div>
                  <div className="text-base font-heading font-bold text-[#D9F36A]">
                    {ms.currency} ${ms.amount}
                  </div>
                  <p className="text-stone-400 text-[11px]">{ms.condition}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('payments')}
              className="w-full py-2.5 rounded-xl bg-[#D9F36A] text-[#151C1B] font-mono font-bold text-xs hover:bg-[#cbf046] transition cursor-pointer shadow flex items-center justify-center gap-1.5"
            >
              <span>Manage PayPal Milestones</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
