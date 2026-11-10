import React, { useState } from 'react';
import { ShieldCheck, Download, Copy, Check, FileCheck, ExternalLink } from 'lucide-react';
import type { SignedReceipt } from '../types';

interface ReceiptCardProps {
  receipt: SignedReceipt;
  onVerify?: (receipt: SignedReceipt) => void;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt, onVerify }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ScopeSnap_Receipt_${receipt.receiptId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-5 shadow-lg space-y-4 text-left">
      <div className="flex items-start justify-between border-b border-stone-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D9F36A]" />
            <h4 className="font-heading font-semibold text-[#F4F1E8] text-base">
              Digital Payment Receipt
            </h4>
            {receipt.isSyntheticDemo && (
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400 font-semibold uppercase">
                SYNTHETIC DEMO
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-stone-400 mt-0.5">
            Receipt ID: <span className="text-stone-300 font-medium">{receipt.receiptId}</span>
          </p>
        </div>

        <div className="text-right">
          <div className="text-lg font-heading font-bold text-[#D9F36A]">
            {receipt.currency} ${receipt.amount.toFixed(2)}
          </div>
          <span className="text-[11px] font-mono text-stone-400">
            {new Date(receipt.paymentTimestamp).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-[#121716] p-3 rounded-lg border border-stone-800/60 space-y-1">
          <span className="text-stone-400 font-mono text-[11px]">Milestone:</span>
          <p className="font-medium text-stone-200">{receipt.milestoneTitle}</p>
          <span className="text-stone-500 font-mono text-[10px]">Payer: {receipt.payerName} ({receipt.payerEmail})</span>
        </div>

        <div className="bg-[#121716] p-3 rounded-lg border border-stone-800/60 space-y-1">
          <span className="text-stone-400 font-mono text-[11px]">Provider Settlement:</span>
          <p className="font-mono text-stone-300 truncate">PayPal Order: {receipt.paypalOrderId || 'N/A'}</p>
          <p className="font-mono text-stone-400 text-[10px] truncate">Capture ID: {receipt.paypalCaptureId || 'N/A'}</p>
        </div>
      </div>

      {/* Cryptographic Signatures */}
      <div className="space-y-2 pt-1">
        <div>
          <span className="text-[11px] font-mono text-stone-400">SHA-256 Payload Hash:</span>
          <div className="bg-[#0e1312] p-2 rounded border border-stone-800 font-mono text-[11px] text-[#648D83] break-all">
            {receipt.payloadHash}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-mono text-stone-400">Ed25519 Server Signature:</span>
          <div className="bg-[#0e1312] p-2 rounded border border-stone-800 font-mono text-[10px] text-[#D9F36A] break-all max-h-16 overflow-y-auto">
            {receipt.signature}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 pt-1">
          <span>Key ID: <code className="text-stone-300">{receipt.signingKeyId}</code></span>
          <span>Agreement Fingerprint: <code className="text-stone-300">{receipt.agreementFingerprint.substring(0, 10)}...</code></span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-800/60 text-xs font-mono text-stone-300 hover:text-white hover:bg-stone-700/60 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#D9F36A]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-800/60 text-xs font-mono text-stone-300 hover:text-white hover:bg-stone-700/60 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>

        {onVerify && (
          <button
            type="button"
            onClick={() => onVerify(receipt)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D9F36A] text-[#151C1B] font-mono font-semibold text-xs hover:bg-[#cbf046] transition cursor-pointer shadow"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Verify Receipt</span>
          </button>
        )}
      </div>
    </div>
  );
};
