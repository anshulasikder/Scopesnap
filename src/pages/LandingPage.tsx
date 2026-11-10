import React from 'react';
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Search,
  Lock,
  Layers,
  FileCheck,
  AlertTriangle,
  CreditCard,
  Radar,
  Quote,
} from 'lucide-react';
import { FingerprintBox } from '../components/FingerprintBox';
import { StatusBadge } from '../components/StatusBadge';

interface LandingPageProps {
  onGetStarted: () => void;
  onExploreDemo: () => void;
  onOpenVerify: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onExploreDemo,
  onOpenVerify,
}) => {
  return (
    <div className="w-full space-y-24 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      {/* HERO SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e2624] border border-[#D9F36A]/30 text-xs font-mono font-medium text-[#D9F36A]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-POWERED AGREEMENT CLARITY</span>
          </div>

          <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-[#F4F1E8] tracking-tight leading-[1.1]">
            Turn conversations into <span className="text-[#D9F36A]">clear agreements.</span>
          </h1>

          <p className="text-stone-300 text-base sm:text-lg leading-relaxed max-w-2xl">
            Convert informal client messages into structured, evidence-backed agreements. Connect confirmed deliverables to PayPal milestones, generate tamper-evident cryptographic receipts, and detect unagreed scope changes before work proceeds.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D9F36A] text-[#151C1B] font-heading font-semibold text-sm hover:bg-[#cbf046] transition shadow-lg shadow-[#D9F36A]/10 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onExploreDemo}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-stone-700 bg-stone-800/80 text-stone-200 font-heading font-semibold text-sm hover:bg-stone-700 transition cursor-pointer"
            >
              <span>See How It Works (Official Demo)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-mono text-stone-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#D9F36A]" />
              Verbatim Evidence Validation
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#D9F36A]" />
              Two-Party SHA-256 Confirmations
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#D9F36A]" />
              Ed25519 Tamper-Evident Receipts
            </span>
          </div>
        </div>

        {/* Hero Right: Realistic Product Preview (Explicitly Labeled SYNTHETIC DEMO DATA) */}
        <div className="lg:col-span-5">
          <div className="relative rounded-2xl border border-stone-700/80 bg-[#18201e] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9F36A]"></span>
                <span className="font-heading font-semibold text-sm text-[#F4F1E8]">
                  Agreement Preview
                </span>
              </div>
              <StatusBadge status="CONFIRMED" isSyntheticDemo={true} />
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Project:</span>
                <span className="text-stone-200 font-medium">Logo Design Project</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Client:</span>
                <span className="text-stone-200">Elena Reyes (Atelier Monolith)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Freelancer:</span>
                <span className="text-stone-200">Alex Morgan</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Confirmed Deliverables:</span>
                <span className="text-[#D9F36A] text-right">3 Initial Concepts + PNG & AI files</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Milestone Settlement:</span>
                <span className="text-stone-200">$50 Deposit + $50 Final ($100 USD)</span>
              </div>
            </div>

            {/* Verbatim quote evidence badge preview */}
            <div className="p-3 rounded-lg bg-[#121716] border border-stone-800 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-stone-400 text-[11px]">
                <span className="flex items-center gap-1 text-[#D9F36A]">
                  <Quote className="w-3 h-3" />
                  Exact Verbatim Proof:
                </span>
                <span>Source #msg-03</span>
              </div>
              <p className="text-stone-300 italic font-serif text-[12px]">
                &ldquo;We require you to deliver three distinct initial logo concepts to start. We also need up to two revision rounds included.&rdquo;
              </p>
            </div>

            {/* Canonical Fingerprint Box */}
            <FingerprintBox
              fingerprint="034fc4828b122e1ca66847cbb650f9798ca7efb6d19ca71a6ca6cfc07bbdd8a6"
              versionNumber={1}
              compact={true}
            />

            <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-stone-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#648D83]" />
                Ed25519 Signed Receipt
              </span>
              <button
                type="button"
                onClick={onOpenVerify}
                className="text-[#D9F36A] hover:underline cursor-pointer"
              >
                Verify Receipt →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: THE CENTRAL PROBLEM */}
      <section className="space-y-8 pt-8 border-t border-stone-800/80">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-mono font-medium text-[#648D83] uppercase tracking-wider">
            The Industry Challenge
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#F4F1E8]">
            Informal chats leave boundaries blurry.
          </h2>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Freelancers and clients frequently agree on scope, deliverable formats, revisions, and payment conditions across fragmented Slack threads, WhatsApp messages, and email chains.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#18201e] p-6 rounded-2xl border border-stone-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#2b1717] border border-[#E77B64]/30 flex items-center justify-center text-[#E77B64]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-[#F4F1E8]">Scattered Scope Terms</h3>
            <p className="text-stone-400 text-xs leading-relaxed">
              Revision limits and deliverable file formats are mentioned offhand and lost in conversation histories, sparking disputes at project completion.
            </p>
          </div>

          <div className="bg-[#18201e] p-6 rounded-2xl border border-stone-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#2a2415] border border-[#facc15]/30 flex items-center justify-center text-[#facc15]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-[#F4F1E8]">Uncontrolled Scope Creep</h3>
            <p className="text-stone-400 text-xs leading-relaxed">
              Clients request &ldquo;just five more variations&rdquo; or &ldquo;one more quick layout&rdquo; without an agreed mechanism for adjusting pricing and deadlines.
            </p>
          </div>

          <div className="bg-[#18201e] p-6 rounded-2xl border border-stone-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#152e24] border border-[#D9F36A]/30 flex items-center justify-center text-[#D9F36A]">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-[#F4F1E8]">Payment Disconnect</h3>
            <p className="text-stone-400 text-xs leading-relaxed">
              Payment platforms process transactions with zero verifiable connection to the agreed deliverable terms or signed acceptance records.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW SCOPESNAP WORKS */}
      <section className="space-y-8 pt-8 border-t border-stone-800/80">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-mono font-medium text-[#D9F36A] uppercase tracking-wider">
            Engineered Workflow
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#F4F1E8]">
            From chat to verifiable settlement in four clear steps.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#18201e] p-5 rounded-2xl border border-stone-800 space-y-3 relative">
            <div className="text-xs font-mono text-[#648D83] font-bold">01</div>
            <h4 className="font-heading font-semibold text-base text-[#F4F1E8]">Conversational Intake</h4>
            <p className="text-stone-400 text-xs leading-relaxed">
              Paste message threads. AI identifies deliverables, revisions, pricing, and deadlines without altering source text.
            </p>
          </div>

          <div className="bg-[#18201e] p-5 rounded-2xl border border-stone-800 space-y-3 relative">
            <div className="text-xs font-mono text-[#D9F36A] font-bold">02</div>
            <h4 className="font-heading font-semibold text-base text-[#F4F1E8]">Verbatim Evidence</h4>
            <p className="text-stone-400 text-xs leading-relaxed">
              Every term is matched against the transcript. If a quote cannot be verified verbatim, it is flagged as UNSUPPORTED.
            </p>
          </div>

          <div className="bg-[#18201e] p-5 rounded-2xl border border-stone-800 space-y-3 relative">
            <div className="text-xs font-mono text-[#648D83] font-bold">03</div>
            <h4 className="font-heading font-semibold text-base text-[#F4F1E8]">Mutual Confirmation</h4>
            <p className="text-stone-400 text-xs leading-relaxed">
              Client reviews via secure link. Both parties confirm the deterministic SHA-256 fingerprint, locking version immutability.
            </p>
          </div>

          <div className="bg-[#18201e] p-5 rounded-2xl border border-stone-800 space-y-3 relative">
            <div className="text-xs font-mono text-[#D9F36A] font-bold">04</div>
            <h4 className="font-heading font-semibold text-base text-[#F4F1E8]">Reconciled Receipts</h4>
            <p className="text-stone-400 text-xs leading-relaxed">
              Milestones settle via PayPal Orders v2. Captures generate Ed25519 digitally signed, tamper-evident receipts.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: CORE PRODUCT FEATURES */}
      <section className="space-y-8 pt-8 border-t border-stone-800/80">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-mono font-medium text-[#648D83] uppercase tracking-wider">
            Key Architecture
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#F4F1E8]">
            Built with rigorous cryptographic and evidence standards.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#18201e] p-6 rounded-2xl border border-stone-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#121716] border border-stone-700">
                <Radar className="w-5 h-5 text-[#D9F36A]" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-[#F4F1E8]">
                Scope Change Sentinel
              </h3>
            </div>
            <p className="text-stone-300 text-xs leading-relaxed">
              After an agreement is confirmed, paste incoming client messages. The Sentinel evaluates requests against confirmed deliverables and alerts both parties to deliverable, revision, or deadline alterations—proposing clean addenda rather than accusations.
            </p>
          </div>

          <div className="bg-[#18201e] p-6 rounded-2xl border border-stone-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#121716] border border-stone-700">
                <FileCheck className="w-5 h-5 text-[#648D83]" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-[#F4F1E8]">
                Independent Public Verification
              </h3>
            </div>
            <p className="text-stone-300 text-xs leading-relaxed">
              Anyone with a signed digital receipt can verify its authenticity on the verification portal. The server recalculates canonical payload SHA-256 hashes and verifies Ed25519 signatures against our public key.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="rounded-3xl border border-stone-700 bg-gradient-to-r from-[#18201e] to-[#121716] p-8 sm:p-12 text-center space-y-6">
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#F4F1E8] max-w-2xl mx-auto">
          Start your freelance agreements with clarity and evidence.
        </h2>
        <p className="text-stone-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Experience the official synthetic demo scenario: Elena Reyes (Atelier Monolith) and Alex Morgan (Logo Design Project).
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={onExploreDemo}
            className="px-6 py-3 rounded-xl bg-[#D9F36A] text-[#151C1B] font-heading font-semibold text-sm hover:bg-[#cbf046] transition cursor-pointer shadow-lg"
          >
            Launch Official Demo Scenario
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            className="px-6 py-3 rounded-xl border border-stone-700 bg-stone-800 text-stone-200 font-heading font-semibold text-sm hover:bg-stone-700 transition cursor-pointer"
          >
            Create New Project
          </button>
        </div>
      </section>
    </div>
  );
};
