import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Binary,
  Key,
  Copy,
  RefreshCw,
  Bug,
  FileCheck,
} from 'lucide-react';
import type { SignedReceipt } from '../types';
import { verifyReceiptPayload, fetchReceipts } from '../services/api';

interface VerificationPageProps {
  initialReceipt?: SignedReceipt;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({ initialReceipt }) => {
  const [receiptJson, setReceiptJson] = useState('');
  const [availableReceipts, setAvailableReceipts] = useState<SignedReceipt[]>([]);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const loadReceipts = async () => {
    try {
      const list = await fetchReceipts();
      setAvailableReceipts(list);
      if (initialReceipt) {
        setReceiptJson(JSON.stringify(initialReceipt, null, 2));
        runVerification(initialReceipt);
      } else if (list.length > 0) {
        setReceiptJson(JSON.stringify(list[0], null, 2));
        runVerification(list[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, [initialReceipt]);

  const runVerification = async (payloadToVerify?: unknown) => {
    setVerifying(true);
    try {
      let payload = payloadToVerify;
      if (!payload) {
        payload = JSON.parse(receiptJson);
      }
      const res = await verifyReceiptPayload(payload);
      setVerificationResult(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setVerificationResult({
        isValid: false,
        code: 'MALFORMED_RECEIPT',
        message: `JSON parse or verification error: ${msg}`,
      });
    } finally {
      setVerifying(false);
    }
  };

  // Tamper Simulation: Injects a malicious edit into the receipt to prove cryptographic detection
  const handleTamperAmount = () => {
    try {
      const parsed = JSON.parse(receiptJson);
      parsed.amount = parsed.amount + 450; // Modify $50 to $500!
      setReceiptJson(JSON.stringify(parsed, null, 2));
      runVerification(parsed);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTamperSignature = () => {
    try {
      const parsed = JSON.parse(receiptJson);
      parsed.signature = 'deadbeef'.repeat(16); // Fake signature!
      setReceiptJson(JSON.stringify(parsed, null, 2));
      runVerification(parsed);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSample = (rcpt: SignedReceipt) => {
    setReceiptJson(JSON.stringify(rcpt, null, 2));
    runVerification(rcpt);
  };

  return (
    <div className="w-full space-y-8 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#F4F1E8]">
              Independent Receipt Verification
            </h1>
            <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px] font-mono text-stone-300 font-semibold uppercase">
              PUBLIC PORTAL
            </span>
          </div>
          <p className="text-xs font-mono text-stone-400">
            Verify SHA-256 canonical hash integrity and Ed25519 digital signatures without private keys
          </p>
        </div>

        {/* Tamper simulation controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTamperAmount}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2b1717] border border-[#E77B64]/40 text-[#E77B64] text-xs font-mono hover:bg-[#2b1717]/80 transition cursor-pointer"
            title="Inject $50 -> $500 modification to test tamper detection"
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Test Tamper (Amount)</span>
          </button>

          <button
            type="button"
            onClick={handleTamperSignature}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2b1717] border border-[#E77B64]/40 text-[#E77B64] text-xs font-mono hover:bg-[#2b1717]/80 transition cursor-pointer"
            title="Inject forged signature to test cryptographic rejection"
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Test Tamper (Signature)</span>
          </button>
        </div>
      </div>

      {/* Available Receipts quick picker */}
      {availableReceipts.length > 0 && (
        <div className="p-4 bg-[#18201e] border border-stone-800 rounded-2xl space-y-2 text-xs font-mono">
          <span className="text-stone-400">Select an Issued Receipt to Verify:</span>
          <div className="flex flex-wrap gap-2">
            {availableReceipts.map(r => (
              <button
                key={r.receiptId}
                type="button"
                onClick={() => handleSelectSample(r)}
                className="px-3 py-1.5 rounded-lg bg-[#121716] border border-stone-700 text-stone-200 hover:border-[#D9F36A] hover:text-[#D9F36A] transition cursor-pointer"
              >
                {r.receiptId} — ${r.amount} ({r.milestoneTitle})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Verification Result Card */}
      {verificationResult && (
        <div className={`p-6 rounded-2xl border space-y-4 text-xs font-mono text-left animate-in fade-in duration-150 ${
          verificationResult.isValid
            ? 'bg-[#152e24] border-[#D9F36A]/50 text-stone-200'
            : 'bg-[#2b1717] border-[#E77B64]/50 text-stone-200'
        }`}>
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
            <div className="flex items-center gap-3">
              {verificationResult.isValid ? (
                <div className="w-9 h-9 rounded-xl bg-[#121c18] border border-[#D9F36A]/60 flex items-center justify-center text-[#D9F36A]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-[#231212] border border-[#E77B64]/60 flex items-center justify-center text-[#E77B64]">
                  <XCircle className="w-5 h-5" />
                </div>
              )}

              <div>
                <h3 className="font-heading font-bold text-lg text-[#F4F1E8]">
                  {verificationResult.isValid
                    ? 'Cryptographically Verified Authentic'
                    : `Verification Failed: ${verificationResult.code}`}
                </h3>
                <p className="text-[11px] text-stone-400">
                  {verificationResult.message}
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
              verificationResult.isValid
                ? 'bg-[#D9F36A] text-[#151C1B]'
                : 'bg-[#E77B64] text-[#151C1B]'
            }`}>
              {verificationResult.code}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[#0e1312] rounded-xl border border-stone-800/80 space-y-1">
              <span className="text-stone-400 text-[11px]">Recomputed SHA-256 Hash:</span>
              <p className="font-mono text-[#648D83] break-all">{verificationResult.recomputedHash || 'N/A'}</p>
            </div>

            <div className="p-3 bg-[#0e1312] rounded-xl border border-stone-800/80 space-y-1">
              <span className="text-stone-400 text-[11px]">Stored Payload Hash:</span>
              <p className="font-mono text-stone-300 break-all">{verificationResult.storedHash || 'N/A'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-800/80">
            <span>Signing Key: <code className="text-stone-200">{verificationResult.keyId}</code></span>
            <span>Ed25519 Verified: <strong className={verificationResult.signatureVerified ? 'text-[#D9F36A]' : 'text-[#E77B64]'}>{verificationResult.signatureVerified ? 'YES' : 'NO'}</strong></span>
            <span>Verified At: {verificationResult.verifiedAt}</span>
          </div>
        </div>
      )}

      {/* JSON Payload Inspector & Editor */}
      <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-heading font-semibold text-sm text-[#F4F1E8] flex items-center gap-2">
            <Binary className="w-4 h-4 text-[#D9F36A]" />
            Receipt Canonical JSON Payload
          </span>
          <span className="text-[11px] font-mono text-stone-500">Edit payload to test tamper resistance</span>
        </div>

        <textarea
          rows={14}
          value={receiptJson}
          onChange={e => setReceiptJson(e.target.value)}
          placeholder="Paste signed receipt JSON here..."
          className="w-full p-4 rounded-xl bg-[#121716] border border-stone-800 text-stone-200 font-mono text-xs focus:outline-none focus:border-[#D9F36A] leading-relaxed resize-y"
        />

        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] font-mono text-stone-400">
            Public verification relies strictly on server-side public Ed25519 key; private signing keys are never exposed.
          </p>

          <button
            type="button"
            onClick={() => runVerification()}
            disabled={verifying}
            className="px-6 py-2.5 rounded-xl bg-[#D9F36A] text-[#151C1B] font-mono font-bold text-xs hover:bg-[#cbf046] transition cursor-pointer shadow flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{verifying ? 'Evaluating Cryptography...' : 'Verify Receipt Payload'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
