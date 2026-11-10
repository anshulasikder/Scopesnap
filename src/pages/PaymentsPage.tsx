import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Lock,
  Layers,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import type { PaymentMilestone, SignedReceipt, SystemHealth } from '../types';
import {
  fetchAgreement,
  createPaymentOrder,
  capturePaymentOrder,
  fetchReceipts,
  fetchHealth,
} from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { ReceiptCard } from '../components/ReceiptCard';

interface PaymentsPageProps {
  agreementId?: string;
  onNavigateTab: (tab: string, meta?: Record<string, unknown>) => void;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({
  agreementId = 'agmt_logo_design_2026',
  onNavigateTab,
}) => {
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([]);
  const [receipts, setReceipts] = useState<SignedReceipt[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isAgreementConfirmed, setIsAgreementConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const agmtData = await fetchAgreement(agreementId);
      setMilestones(agmtData.milestones || []);
      const currentVer = agmtData.agreement.versions.find(v => v.id === agmtData.agreement.currentVersionId);
      setIsAgreementConfirmed(currentVer?.status === 'CONFIRMED');

      const rcpts = await fetchReceipts(agreementId);
      setReceipts(rcpts);

      const h = await fetchHealth();
      setHealth(h);
    } catch (e) {
      console.error('Error loading payment data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [agreementId]);

  const handlePayMilestone = async (milestone: PaymentMilestone) => {
    setProcessingId(milestone.id);
    setActionMessage(null);

    try {
      // 1. Create PayPal Order server-side
      const isSynthetic = !health?.paypalConfigured;
      const orderRes = await createPaymentOrder(agreementId, milestone.id, isSynthetic);

      if (!orderRes.orderId) {
        throw new Error(orderRes.error || 'Failed to create payment order');
      }

      // 2. Server-side capture & reconciliation
      const captureRes = await capturePaymentOrder(agreementId, milestone.id, orderRes.orderId);

      if (!captureRes.success) {
        setActionMessage({
          type: 'error',
          text: captureRes.error || 'Payment capture failed reconciliation check.',
        });
      } else {
        setActionMessage({
          type: 'success',
          text: `Payment of ${milestone.currency} $${milestone.amount} reconciled successfully! Ed25519 digitally signed receipt generated.`,
        });
        await loadData();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="w-full space-y-8 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#F4F1E8]">
              Payment Milestones & Settlement
            </h1>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400 font-semibold uppercase">
              SYNTHETIC DEMO SCENARIO
            </span>
          </div>
          <p className="text-xs font-mono text-stone-400">
            PayPal Orders v2 integration • Server-side capture reconciliation • Ed25519 tamper-evident receipts
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-700 bg-stone-800 text-stone-300 text-xs font-mono hover:text-white hover:bg-stone-750 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Integration Status Banner */}
      <div className={`p-4 rounded-2xl border text-xs font-mono space-y-1.5 ${
        health?.paypalConfigured
          ? 'bg-[#152e24] border-[#D9F36A]/40 text-[#D9F36A]'
          : 'bg-[#1e2321] border-stone-800 text-stone-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#D9F36A]" />
            <span className="font-semibold">
              PayPal Provider Status: {health?.paypalConfigured ? 'LIVE SANDBOX CONNECTED' : 'SANDBOX UNCONFIGURED (DEMO SIMULATION ACTIVE)'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-stone-400">
            {health?.paypalConfigured ? 'Direct PayPal REST API' : 'Synthetic Sandbox Simulator'}
          </span>
        </div>
        <p className="text-stone-400 text-[11px] leading-relaxed">
          {health?.paypalConfigured
            ? 'Server is actively linked to PayPal Orders v2 sandbox endpoint with credentials.'
            : 'PayPal API credentials (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) not set in environment. ScopeSnap enables full simulated capture reconciliation with authentic Ed25519 cryptographic receipts, clearly labeled SYNTHETIC DEMO DATA.'}
        </p>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl border text-xs font-mono flex items-center gap-2 ${
          actionMessage.type === 'success'
            ? 'bg-[#152e24] border-[#D9F36A]/40 text-[#D9F36A]'
            : 'bg-[#2b1717] border-[#E77B64]/40 text-[#E77B64]'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Agreed Payment Milestones Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-xl text-[#F4F1E8]">
            Agreement Milestones (Total: USD $100.00)
          </h2>
          <span className="text-xs font-mono text-stone-400">
            {isAgreementConfirmed ? 'Mutually Confirmed Agreement' : 'Awaiting Client Sign-off'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {milestones.map((ms, idx) => {
            const isAdvance = idx === 0;
            const isPaid = ms.status === 'PAID';
            const isProcessing = processingId === ms.id;

            return (
              <div
                key={ms.id}
                className="bg-[#18201e] border border-stone-800 rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4 text-left"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-stone-500">Milestone #{idx + 1}</span>
                    <StatusBadge status={ms.status} isSyntheticDemo={ms.isSyntheticDemo} />
                  </div>

                  <h3 className="font-heading font-bold text-lg text-[#F4F1E8]">
                    {ms.title}
                  </h3>

                  <div className="text-2xl font-heading font-bold text-[#D9F36A]">
                    {ms.currency} ${ms.amount.toFixed(2)}
                  </div>

                  <div className="p-3 bg-[#121716] rounded-xl border border-stone-800 text-xs font-mono space-y-1">
                    <span className="text-stone-400 text-[11px]">Payment Condition:</span>
                    <p className="text-stone-200">{ms.condition}</p>
                  </div>

                  {ms.paypalCaptureId && (
                    <div className="p-2.5 bg-[#0e1312] rounded border border-stone-800 text-[11px] font-mono text-stone-400 space-y-0.5">
                      <div>PayPal Order: <span className="text-stone-300">{ms.paypalOrderId}</span></div>
                      <div>Capture ID: <span className="text-stone-300">{ms.paypalCaptureId}</span></div>
                      {ms.paidAt && <div>Settled: <span className="text-stone-300">{new Date(ms.paidAt).toLocaleString()}</span></div>}
                    </div>
                  )}
                </div>

                {/* Milestone Payment Action */}
                <div className="pt-3 border-t border-stone-800">
                  {isPaid ? (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-[#D9F36A]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Reconciled & Paid • Tamper-Evident Receipt Issued</span>
                    </div>
                  ) : (
                    <div>
                      {!isAgreementConfirmed && (
                        <p className="text-[11px] font-mono text-amber-400/90 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Payment unlocked after mutual agreement confirmation.
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => handlePayMilestone(ms)}
                        disabled={isProcessing}
                        className="w-full py-2.5 rounded-xl bg-[#D9F36A] text-[#151C1B] font-mono font-bold text-xs hover:bg-[#cbf046] transition cursor-pointer shadow flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>
                          {isProcessing
                            ? 'Processing Server Capture & Reconciliation...'
                            : health?.paypalConfigured
                            ? `Pay with PayPal Sandbox (${ms.currency} $${ms.amount})`
                            : `Simulate Sandbox Capture (${ms.currency} $${ms.amount})`}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Issued Digital Receipts Section */}
      <div className="space-y-4 pt-4 border-t border-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D9F36A]" />
            <h2 className="font-heading font-bold text-xl text-[#F4F1E8]">
              Issued Digital Receipts ({receipts.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('verification')}
            className="text-xs font-mono text-[#D9F36A] hover:underline cursor-pointer"
          >
            Independent Verification Portal →
          </button>
        </div>

        {receipts.length === 0 ? (
          <div className="p-8 bg-[#18201e] border border-stone-800 rounded-2xl text-center text-xs font-mono text-stone-500 space-y-2">
            <Lock className="w-6 h-6 mx-auto text-stone-600" />
            <p>No payment receipts issued yet. Reconcile a milestone to produce a signed receipt.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {receipts.map(rcpt => (
              <ReceiptCard
                key={rcpt.receiptId}
                receipt={rcpt}
                onVerify={r => onNavigateTab('verification', { receipt: r })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
