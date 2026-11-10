import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ChevronDown, ChevronUp, Quote } from 'lucide-react';
import type { EvidenceStatus } from '../types';

interface EvidenceBadgeProps {
  status: EvidenceStatus;
  quote?: string;
  sourceMessageId?: string;
  speaker?: string;
  explanation?: string;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({
  status,
  quote,
  sourceMessageId,
  speaker,
  explanation,
}) => {
  const [expanded, setExpanded] = useState(false);

  let icon = <CheckCircle2 className="w-3.5 h-3.5 text-[#D9F36A]" />;
  let badgeStyle = 'bg-[#152e24] text-[#D9F36A] border-[#D9F36A]/30';
  let label = 'VERIFIED VERBATIM';

  if (status === 'NEEDS_REVIEW') {
    icon = <AlertTriangle className="w-3.5 h-3.5 text-[#facc15]" />;
    badgeStyle = 'bg-[#2a2415] text-[#facc15] border-[#facc15]/30';
    label = 'NEEDS REVIEW';
  } else if (status === 'NOT_FOUND') {
    icon = <XCircle className="w-3.5 h-3.5 text-[#E77B64]" />;
    badgeStyle = 'bg-[#2b1717] text-[#E77B64] border-[#E77B64]/30';
    label = 'UNSUPPORTED / NOT FOUND';
  } else if (status === 'CONFLICTING_EVIDENCE') {
    icon = <HelpCircle className="w-3.5 h-3.5 text-[#E77B64]" />;
    badgeStyle = 'bg-[#2b1717] text-[#E77B64] border-[#E77B64]/30';
    label = 'CONFLICTING EVIDENCE';
  }

  return (
    <div className="inline-block text-left">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono font-medium transition hover:brightness-110 cursor-pointer ${badgeStyle}`}
        title="Click to view underlying source evidence"
      >
        {icon}
        <span>{label}</span>
        {quote && (
          expanded ? <ChevronUp className="w-3 h-3 ml-0.5 opacity-70" /> : <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
        )}
      </button>

      {expanded && quote && (
        <div className="mt-2 p-3 bg-[#1e2624] border border-stone-700/80 rounded-lg text-xs space-y-1.5 shadow-xl max-w-md animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between text-stone-400 font-mono text-[11px] pb-1 border-b border-stone-800">
            <span className="flex items-center gap-1">
              <Quote className="w-3 h-3 text-[#648D83]" />
              Source Message: <strong className="text-stone-300">#{sourceMessageId}</strong>
            </span>
            <span>Speaker: <strong className="text-stone-300">{speaker}</strong></span>
          </div>

          <p className="text-stone-200 italic font-serif text-[13px] leading-relaxed pl-2 border-l-2 border-[#D9F36A]/50 bg-black/20 py-1.5 pr-2 rounded-r">
            &ldquo;{quote}&rdquo;
          </p>

          {explanation && (
            <p className="text-[11px] text-amber-300/90 font-mono pt-1">
              Note: {explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
