import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-stone-800 bg-[#0e1413] text-stone-400 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#151C1B] border border-stone-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#D9F36A]" />
            </div>
            <div>
              <span className="font-heading font-bold text-base text-[#F4F1E8]">ScopeSnap</span>
              <p className="text-xs text-stone-400 font-mono">
                AI-Powered Agreement & Payment Clarity Platform
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-mono">
            <span>Deterministic SHA-256 Fingerprints</span>
            <span>Ed25519 Cryptographic Signatures</span>
            <span>PayPal Orders v2 Reconciliation</span>
          </div>
        </div>

        {/* Legal Clarity Disclaimer Banner (Prompt Section 1 Mandatory) */}
        <div className="bg-[#151C1B] border border-stone-800 rounded-xl p-4 text-xs font-mono space-y-2 text-stone-400">
          <div className="flex items-center gap-2 text-stone-300 font-medium">
            <Info className="w-4 h-4 text-[#648D83]" />
            <span>Platform Definition & Regulatory Boundary</span>
          </div>
          <p className="leading-relaxed text-stone-400 text-[11px]">
            ScopeSnap is an agreement clarity, milestone verification, and scope change detection system. ScopeSnap is <strong>NOT</strong> an escrow service, bank, or payment processor. It is <strong>NOT</strong> a law firm and does not provide legal advice, dispute resolution guarantees, or warranties against fraud. Extracted terms and cryptographic receipts provide verifiable factual evidence of communication and settlement events, without independent legal adjudication.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-stone-400 pt-2 border-t border-stone-800/80">
          <p>© 2026 ScopeSnap. Built for freelance clarity and payment transparency.</p>
          <p className="mt-2 sm:mt-0">All demo records strictly labeled SYNTHETIC DEMO DATA.</p>
        </div>
      </div>
    </footer>
  );
};
