import React, { useEffect, useState } from 'react';
import {
  FolderPlus,
  Sparkles,
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Activity,
  AlertCircle,
} from 'lucide-react';
import type { Project, Agreement, SignedReceipt, UserProfile } from '../types';
import { fetchProjects, fetchAgreement, fetchReceipts, fetchAuditLogs } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { FingerprintBox } from '../components/FingerprintBox';

interface DashboardPageProps {
  currentUser: UserProfile;
  onNavigateTab: (tab: string, meta?: Record<string, unknown>) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, onNavigateTab }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [receipts, setReceipts] = useState<SignedReceipt[]>([]);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; action: string; timestamp: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const projs = await fetchProjects();
        setProjects(projs);

        // Load primary demo agreement
        if (projs.length > 0 && projs[0].agreementId) {
          const agmtData = await fetchAgreement(projs[0].agreementId);
          setAgreement(agmtData.agreement);
        }

        const rcpts = await fetchReceipts();
        setReceipts(rcpts);

        const logs = await fetchAuditLogs();
        setAuditLogs(logs.auditEvents || []);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
  const pendingConfirmations = agreement?.status === 'WAITING_CLIENT_CONFIRMATION' ? 1 : 0;
  const currentVer = agreement?.versions.find(v => v.id === agreement.currentVersionId);

  return (
    <div className="w-full space-y-8 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#F4F1E8]">
              Welcome back, {currentUser.displayName}
            </h1>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400 font-semibold uppercase">
              SYNTHETIC DEMO DATA
            </span>
          </div>
          <p className="text-xs font-mono text-stone-400">
            Account Role: <strong className="text-stone-300">{currentUser.role}</strong> • User ID: <code className="text-stone-400">{currentUser.id}</code>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('projects', { action: 'create' })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 text-xs font-mono hover:bg-stone-700 transition cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('intake')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#D9F36A] text-[#151C1B] text-xs font-mono font-semibold hover:bg-[#cbf046] transition cursor-pointer shadow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Intake</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('verification')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 text-xs font-mono hover:bg-stone-700 transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Verify Receipt</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-stone-400">Total Projects</span>
          <div className="text-2xl font-heading font-bold text-[#F4F1E8]">{totalProjects}</div>
          <span className="text-[11px] font-mono text-stone-500">1 synthetic demo project</span>
        </div>

        <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-stone-400">Active Projects</span>
          <div className="text-2xl font-heading font-bold text-[#D9F36A]">{activeProjects}</div>
          <span className="text-[11px] font-mono text-stone-500">Logo Design Project</span>
        </div>

        <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-stone-400">Confirmations</span>
          <div className="text-2xl font-heading font-bold text-[#facc15]">
            {agreement?.status === 'CONFIRMED' ? 'Mutual' : '1 Pending'}
          </div>
          <span className="text-[11px] font-mono text-stone-500">
            {agreement?.status === 'CONFIRMED' ? 'Version locked' : 'Awaiting client token review'}
          </span>
        </div>

        <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs font-mono text-stone-400">Receipts Verified</span>
          <div className="text-2xl font-heading font-bold text-[#648D83]">
            {receipts.length}
          </div>
          <span className="text-[11px] font-mono text-stone-500">Ed25519 signed</span>
        </div>
      </div>

      {/* Main Grid: Active Agreement Status & Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Agreement & Version */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <span className="text-xs font-mono text-[#648D83] uppercase tracking-wider">
                  Active Agreement
                </span>
                <h3 className="font-heading font-bold text-lg text-[#F4F1E8]">
                  {currentVer?.projectName || 'Logo Design Project'}
                </h3>
              </div>
              {agreement && <StatusBadge status={agreement.status} isSyntheticDemo={true} />}
            </div>

            {currentVer ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-[#121716] p-3 rounded-xl border border-stone-800/80">
                    <span className="text-stone-400 text-[11px]">Client:</span>
                    <p className="font-semibold text-stone-200 mt-0.5">{currentVer.client.name}</p>
                    <p className="text-stone-400 text-[10px]">{currentVer.client.organization}</p>
                  </div>
                  <div className="bg-[#121716] p-3 rounded-xl border border-stone-800/80">
                    <span className="text-stone-400 text-[11px]">Settlement Amount:</span>
                    <p className="font-semibold text-[#D9F36A] mt-0.5 text-sm">
                      {currentVer.currency} ${currentVer.totalPrice}
                    </p>
                    <p className="text-stone-400 text-[10px]">
                      Deposit: ${currentVer.advancePayment} • Final: ${currentVer.remainingPayment}
                    </p>
                  </div>
                </div>

                {/* Fingerprint */}
                <FingerprintBox
                  fingerprint={currentVer.canonicalFingerprint}
                  versionNumber={currentVer.versionNumber}
                />

                {/* Deliverables summary */}
                <div className="bg-[#121716] p-3 rounded-xl border border-stone-800/80 text-xs font-mono space-y-1">
                  <span className="text-stone-400 text-[11px]">Agreed Deliverables ({currentVer.deliverables.length}):</span>
                  <ul className="list-disc list-inside text-stone-300 space-y-0.5 pt-1">
                    {currentVer.deliverables.map((d, idx) => (
                      <li key={idx} className="truncate">{d}</li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigateTab('agreements')}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-[#D9F36A] hover:underline cursor-pointer"
                  >
                    <span>Open Full Agreement & Evidence</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateTab('payments')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D9F36A] text-[#151C1B] text-xs font-mono font-semibold hover:bg-[#cbf046] transition cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>View Payments</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-2 text-xs font-mono text-stone-400">
                <p>No active agreements found.</p>
                <button
                  type="button"
                  onClick={() => onNavigateTab('intake')}
                  className="text-[#D9F36A] hover:underline cursor-pointer"
                >
                  Create your first agreement with AI Intake →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Audits & Payments */}
        <div className="lg:col-span-5 space-y-6">
          {/* Audit Events */}
          <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#D9F36A]" />
                <h3 className="font-heading font-semibold text-base text-[#F4F1E8]">
                  Audit Event Trail
                </h3>
              </div>
              <span className="text-[11px] font-mono text-stone-500">Live Log</span>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 5).map(log => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-[#121716] border border-stone-800 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between text-stone-400 text-[10px]">
                    <span className="text-[#D9F36A]">{log.action}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-stone-300 text-[11px] truncate">
                    Audit ID: {log.id}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Scope Sentinel Link */}
          <div className="bg-[#18201e] border border-stone-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#D9F36A] uppercase tracking-wider">
                Scope Change Sentinel
              </span>
              <span className="text-[10px] font-mono text-stone-500">Post-Confirmation Monitor</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Did the client send a new request? Test messages against confirmed agreement terms to detect scope creep before work starts.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('scope')}
              className="w-full py-2 rounded-lg bg-stone-800 border border-stone-700 text-xs font-mono text-stone-200 hover:text-white hover:bg-stone-700 transition cursor-pointer"
            >
              Analyze New Client Message →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
