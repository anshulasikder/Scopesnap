import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Shield, FileText, CreditCard, Search } from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

const TOUR_STEPS = [
  {
    title: 'Welcome to ScopeSnap',
    subtitle: 'Step 1 of 7 — Operational Command',
    targetTab: 'dashboard',
    icon: <Sparkles className="w-6 h-6 text-[#D9F36A]" />,
    content:
      'ScopeSnap transforms unstructured client conversations into clear, evidence-backed agreements. Your dashboard gives you real-time visibility into agreement confirmations, pending milestones, and verified receipts.',
  },
  {
    title: 'Project & Client Workspace',
    subtitle: 'Step 2 of 7 — Client Association',
    targetTab: 'projects',
    icon: <FileText className="w-6 h-6 text-[#648D83]" />,
    content:
      'Manage client details, project specifications, and track the full lifecycle of agreements. Each project maintains its own isolated audit trail and version history.',
  },
  {
    title: 'AI Agreement Intake & Extraction',
    subtitle: 'Step 3 of 7 — Conversational Parsing',
    targetTab: 'intake',
    icon: <Sparkles className="w-6 h-6 text-[#D9F36A]" />,
    content:
      'Paste informal messages from Slack, email, or chat. ScopeSnap’s server-side AI extracts material deliverables, pricing, revisions, and deadlines—while never inventing terms.',
  },
  {
    title: 'Deterministic Evidence Engine',
    subtitle: 'Step 4 of 7 — Verifiable Substrings',
    targetTab: 'agreements',
    icon: <CheckCircle2 className="w-6 h-6 text-[#D9F36A]" />,
    content:
      'Every single extracted term is verified verbatim against the original transcript. If a quote cannot be proven from the source messages, it is flagged as UNSUPPORTED.',
  },
  {
    title: 'Client Review & Two-Party Confirmation',
    subtitle: 'Step 5 of 7 — Cryptographic Fingerprint',
    targetTab: 'agreements',
    icon: <Shield className="w-6 h-6 text-[#648D83]" />,
    content:
      'Share a secure, time-limited review link with the client. When both parties confirm the exact same SHA-256 fingerprint, the version becomes immutable.',
  },
  {
    title: 'PayPal Milestone Integration',
    subtitle: 'Step 6 of 7 — Verified Reconciliation',
    targetTab: 'payments',
    icon: <CreditCard className="w-6 h-6 text-[#D9F36A]" />,
    content:
      'Connect agreed milestones to PayPal Orders v2. Payment releases occur strictly after server-side capture verification, preventing duplicate or premature releases.',
  },
  {
    title: 'Tamper-Evident Receipts & Scope Sentinel',
    subtitle: 'Step 7 of 7 — Cryptographic Integrity',
    targetTab: 'verification',
    icon: <Search className="w-6 h-6 text-[#D9F36A]" />,
    content:
      'Each settled milestone produces an Ed25519 digitally signed receipt. The Scope Sentinel monitors post-confirmation messages to identify unagreed scope changes before work proceeds.',
  },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, onNavigateTab }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (onNavigateTab) onNavigateTab(TOUR_STEPS[next].targetTab);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      if (onNavigateTab) onNavigateTab(TOUR_STEPS[prev].targetTab);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('scopesnap_onboarding_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#18201e] border border-stone-700/80 rounded-2xl p-6 shadow-2xl space-y-5 text-left">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#121716] border border-stone-800">
              {step.icon}
            </div>
            <div>
              <span className="text-xs font-mono font-medium text-[#648D83] uppercase tracking-wider">
                {step.subtitle}
              </span>
              <h3 className="font-heading font-bold text-xl text-[#F4F1E8]">
                {step.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            title="Skip tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <p className="text-stone-300 text-sm leading-relaxed">
          {step.content}
        </p>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 py-2">
          {TOUR_STEPS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCurrentStep(idx);
                if (onNavigateTab) onNavigateTab(TOUR_STEPS[idx].targetTab);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentStep ? 'w-6 bg-[#D9F36A]' : 'w-2 bg-stone-700 hover:bg-stone-600'
              }`}
              title={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-mono text-stone-400 hover:text-stone-200 transition cursor-pointer px-2 py-1"
          >
            Skip Walkthrough
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border border-stone-700 bg-stone-800 text-xs font-mono text-stone-300 hover:bg-stone-700 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#D9F36A] text-[#151C1B] text-xs font-mono font-semibold hover:bg-[#cbf046] transition cursor-pointer shadow"
            >
              <span>{currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
