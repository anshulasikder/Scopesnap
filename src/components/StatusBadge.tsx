import React from 'react';
import type { AgreementStatus, MilestoneStatus, ScopeChangeStatus } from '../types';

interface StatusBadgeProps {
  status: AgreementStatus | MilestoneStatus | ScopeChangeStatus | string;
  isSyntheticDemo?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isSyntheticDemo, size = 'sm' }) => {
  let bg = 'bg-stone-800 text-stone-300 border-stone-700';
  let label = status.replace(/_/g, ' ');

  switch (status) {
    case 'CONFIRMED':
    case 'PAID':
    case 'VALID_SIGNATURE':
      bg = 'bg-[#152e24] text-[#D9F36A] border-[#D9F36A]/30';
      break;
    case 'READY_TO_PAY':
    case 'POTENTIAL_CHANGE':
    case 'WAITING_CLIENT_CONFIRMATION':
      bg = 'bg-[#2a2415] text-[#facc15] border-[#facc15]/30';
      break;
    case 'DRAFT':
    case 'PENDING_CONFIRMATION':
    case 'AWAITING_APPROVAL':
      bg = 'bg-[#1a2327] text-[#648D83] border-[#648D83]/30';
      break;
    case 'CHANGES_REQUESTED':
    case 'FAILED':
    case 'PAYLOAD_MODIFIED':
    case 'INVALID_SIGNATURE':
      bg = 'bg-[#2b1717] text-[#E77B64] border-[#E77B64]/30';
      break;
    case 'SUPERSEDED':
      bg = 'bg-stone-900 text-stone-500 border-stone-800';
      break;
    default:
      break;
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className="inline-flex items-center gap-1.5 font-medium">
      <span className={`inline-flex items-center rounded border ${px} ${bg} font-mono uppercase tracking-wider`}>
        {label}
      </span>
      {isSyntheticDemo && (
        <span className="inline-flex items-center rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] font-mono font-medium text-amber-400 uppercase tracking-tight">
          SYNTHETIC DEMO DATA
        </span>
      )}
    </span>
  );
};
