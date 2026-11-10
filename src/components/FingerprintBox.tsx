import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, Binary } from 'lucide-react';

interface FingerprintBoxProps {
  fingerprint: string;
  versionNumber?: number;
  label?: string;
  compact?: boolean;
}

export const FingerprintBox: React.FC<FingerprintBoxProps> = ({
  fingerprint,
  versionNumber = 1,
  label = 'Canonical Agreement Fingerprint (SHA-256)',
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!fingerprint) return;
    navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border border-stone-800 bg-[#121716] ${compact ? 'p-3' : 'p-4'} text-left`}>
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800/80">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#D9F36A]" />
          <span className="text-xs font-mono font-medium text-stone-300 uppercase tracking-wider">
            {label}
          </span>
          <span className="px-1.5 py-0.2 rounded bg-stone-800 text-[11px] font-mono text-stone-400">
            v{versionNumber}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-xs font-mono text-stone-400 hover:text-[#D9F36A] transition px-2 py-0.5 rounded hover:bg-stone-800/60 cursor-pointer"
          title="Copy canonical SHA-256 hash"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#D9F36A]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Hash'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 bg-[#0d1211] p-2.5 rounded-lg border border-stone-800/50">
        <Binary className="w-4 h-4 text-stone-500 shrink-0" />
        <code className="text-xs font-mono text-[#D9F36A] tracking-wider break-all select-all leading-relaxed">
          {fingerprint || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
        </code>
      </div>

      {!compact && (
        <p className="mt-2 text-[11px] text-stone-400/90 font-mono flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9F36A]"></span>
          Deterministically computed from normalized material terms (deliverables, prices, timeline, parties).
        </p>
      )}
    </div>
  );
};
