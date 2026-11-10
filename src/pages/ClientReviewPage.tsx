import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  Layers,
  Clock,
  DollarSign,
  User,
  Quote,
} from 'lucide-react';
import type { AgreementVersion, PaymentMilestone } from '../types';
import { fetchClientReview, submitClientConfirmation, submitClientChanges } from '../services/api';
import { FingerprintBox } from '../components/FingerprintBox';
import { StatusBadge } from '../components/StatusBadge';
import { EvidenceBadge } from '../components/EvidenceBadge';

interface ClientReviewPageProps {
  token?: string;
  onBackToDashboard: () => void;
}

export const ClientReviewPage: React.FC<ClientReviewPageProps> = ({
  token = 'tok_demo_elena_review_2026',
  onBackToDashboard,
}) => {
  const [version, setVersion] = useState<AgreementVersion | null>(null);
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([]);
  const [freelancerConfirmed, setFreelancerConfirmed] = useState(false);
  const [clientConfirmed, setClientConfirmed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [clientSignerName, setClientSignerName] = useState('Elena Reyes');
  const [clientSignerEmail, setClientSignerEmail] = useState('elena@ateliermonolith.com');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReview = async (t: string) => {
    try {
      setErrorMessage(null);
      const data = await fetchClientReview(t);
      setVersion(data.version);
      setMilestones(data.milestones || []);
      setFreelancerConfirmed(data.freelancerConfirmed);
      setClientConfirmed(data.clientConfirmed);
      setIsConfirmed(data.isConfirmed);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage(msg);
    }
  };

  useEffect(() => {
    loadReview(token);
  }, [token]);

  const handleConfirmAgreement = async () => {
    if (!clientSignerName) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await submitClientConfirmation(token, clientSignerName, clientSignerEmail);
      if (res.success) {
        setSuccessMessage('Agreement confirmed successfully. Canonical fingerprint locked.');
        setClientConfirmed(true);
        if (freelancerConfirmed) setIsConfirmed(true);
        await loadReview(token);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionNotes) return;
    setSubmitting(true);
    try {
      await submitClientChanges(token, correctionNotes);
      setSuccessMessage('Correction request submitted to freelancer Alex Morgan.');
      setShowCorrectionForm(false);
      await loadReview(token);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (errorMessage) {
    return (
      <div className="py-20 max-w-lg mx-auto text-center space-y-4 px-4 font-mono">
        <AlertTriangle className="w-10 h-10 text-[#E77B64] mx-auto" />
        <h2 className="font-heading font-bold text-xl text-[#F4F1E8]">Review Link Error</h2>
        <p className="text-xs text-stone-400">{errorMessage}</p>
        <button
          type="button"
          onClick={onBackToDashboard}
          className="px-4 py-2 rounded-lg bg-stone-800 text-stone-200 text-xs hover:bg-stone-700 transition cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!version) {
    return (
      <div className="py-20 text-center text-xs font-mono text-stone-500">
        Loading client review agreement...
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-left">
      {/* Top Banner: Client Portal context */}
      <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#121716] border border-stone-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#D9F36A]" />
            </div>
            <div>
              <span className="text-xs font-mono text-[#648D83] uppercase tracking-wider">
                Client Review Portal • Atelier Monolith
              </span>
              <h1 className="font-heading font-bold text-2xl text-[#F4F1E8]">
                {version.projectName}
              </h1>
            </div>
          </div>

          <StatusBadge status={version.status} isSyntheticDemo={true} />
        </div>

        <p className="text-xs font-mono text-stone-300 leading-relaxed">
          Review the structured terms and supporting verbatim quotes extracted from your conversation with freelancer <strong>{version.freelancer.name}</strong>.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-[#152e24] border border-[#D9F36A]/40 text-xs font-mono text-[#D9F36A] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* SHA-256 Fingerprint */}
      <FingerprintBox
        fingerprint={version.canonicalFingerprint}
        versionNumber={version.versionNumber}
        label="Exact Version Canonical Fingerprint"
      />

      {/* Deliverables & Scope Review */}
      <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-6 space-y-5">
        <h3 className="font-heading font-bold text-lg text-[#F4F1E8] flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#D9F36A]" />
          Agreed Scope & Deliverables
        </h3>

        <div className="space-y-3">
          {version.deliverables.map((d, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-[#121716] rounded-xl border border-stone-800 text-xs font-mono flex items-center justify-between"
            >
              <span className="text-stone-200">{d}</span>
              <EvidenceBadge
                status="EXACT_MATCH"
                quote={d}
                sourceMessageId="msg-03"
                speaker="Elena Reyes"
              />
            </div>
          ))}
        </div>

        {/* Pricing & Milestones */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-2">
          <div className="p-3 bg-[#121716] rounded-xl border border-stone-800">
            <span className="text-stone-400 text-[11px]">Total Price:</span>
            <div className="text-base font-heading font-bold text-[#D9F36A] mt-0.5">
              {version.currency} ${version.totalPrice}
            </div>
          </div>

          <div className="p-3 bg-[#121716] rounded-xl border border-stone-800">
            <span className="text-stone-400 text-[11px]">Advance Kickoff Deposit:</span>
            <div className="text-base font-heading font-bold text-stone-200 mt-0.5">
              {version.currency} ${version.advancePayment}
            </div>
          </div>

          <div className="p-3 bg-[#121716] rounded-xl border border-stone-800">
            <span className="text-stone-400 text-[11px]">Remaining Balance:</span>
            <div className="text-base font-heading font-bold text-stone-200 mt-0.5">
              {version.currency} ${version.remainingPayment}
            </div>
          </div>
        </div>

        {/* Timeline & Revisions */}
        <div className="p-4 bg-[#121716] rounded-xl border border-stone-800 text-xs font-mono space-y-1">
          <span className="text-stone-400 font-semibold">Timeline & Approval Terms:</span>
          <p className="text-stone-300">
            {version.timelineConditions} (first concept presentation within {version.timelineDays} days of deposit).
          </p>
          <p className="text-stone-400 text-[11px] pt-1">
            Includes up to {version.revisionLimit} rounds of revisions. Remaining payment is due once final PNG and AI files are approved.
          </p>
        </div>
      </div>

      {/* Confirmation Actions or Status */}
      <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-6 space-y-5">
        <h3 className="font-heading font-bold text-lg text-[#F4F1E8]">
          Client Confirmation & Sign-Off
        </h3>

        {clientConfirmed ? (
          <div className="p-4 rounded-xl bg-[#152e24] border border-[#D9F36A]/40 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2 text-[#D9F36A] font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Version {version.versionNumber} Confirmed by Elena Reyes</span>
            </div>
            <p className="text-stone-300 text-[11px]">
              Fingerprint {version.canonicalFingerprint.substring(0, 16)}... confirmed and bound to mutual record.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs font-mono">
            <p className="text-stone-300 leading-relaxed">
              By confirming, you verify that the extracted terms accurately reflect the agreed project scope. Your confirmation binds only this exact version.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-400 mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={clientSignerName}
                  onChange={e => setClientSignerName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#121716] border border-stone-700 text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Organization / Title</label>
                <input
                  type="text"
                  value={clientSignerEmail}
                  onChange={e => setClientSignerEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#121716] border border-stone-700 text-stone-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmAgreement}
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-[#D9F36A] text-[#151C1B] font-bold hover:bg-[#cbf046] transition cursor-pointer shadow flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Confirming...' : `Confirm & Accept Version v${version.versionNumber}`}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCorrectionForm(!showCorrectionForm)}
                className="px-4 py-3 rounded-xl border border-stone-700 bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-750 transition cursor-pointer"
              >
                Request Corrections
              </button>
            </div>
          </div>
        )}

        {/* Correction Request Form */}
        {showCorrectionForm && !clientConfirmed && (
          <form onSubmit={handleRequestCorrection} className="p-4 bg-[#121716] rounded-xl border border-stone-800 space-y-3 text-xs font-mono">
            <span className="font-semibold text-stone-300 block">Specify Requested Revisions or Corrections:</span>
            <textarea
              rows={3}
              required
              value={correctionNotes}
              onChange={e => setCorrectionNotes(e.target.value)}
              placeholder="e.g. Please clarify that SVG vector format is also included..."
              className="w-full p-2.5 rounded-lg bg-[#0e1312] border border-stone-700 text-stone-100"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition cursor-pointer"
            >
              Submit Correction Request
            </button>
          </form>
        )}
      </div>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="text-xs font-mono text-stone-500 hover:text-stone-300 underline cursor-pointer"
        >
          ← Return to ScopeSnap Platform
        </button>
      </div>
    </div>
  );
};
