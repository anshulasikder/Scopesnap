import React from 'react';
import {
  FileText,
  CreditCard,
  Search,
  Settings,
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  Radar,
  LogOut,
  User,
} from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onStartTour: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenAuth,
  onLogout,
  onStartTour,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FileText },
    { id: 'intake', label: 'AI Intake', icon: Sparkles },
    { id: 'agreements', label: 'Agreements', icon: ShieldCheck },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'verification', label: 'Verification', icon: Search },
    { id: 'scope', label: 'Scope Sentinel', icon: Radar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800 bg-[#151C1B]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTab('landing')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D9F36A] to-[#648D83] flex items-center justify-center p-0.5 shadow-md shadow-[#D9F36A]/10 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#151C1B] rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[#D9F36A]" />
                </div>
              </div>
              <div>
                <span className="font-heading font-bold text-lg text-[#F4F1E8] tracking-tight group-hover:text-[#D9F36A] transition-colors">
                  ScopeSnap
                </span>
                <span className="block text-[10px] font-mono text-[#648D83] tracking-widest uppercase">
                  Agreement Clarity
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-[#1e2624] text-[#D9F36A] border border-[#D9F36A]/30 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D9F36A]' : 'text-stone-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Area: User / Tour / Auth */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onStartTour}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono text-stone-400 hover:text-[#D9F36A] hover:bg-stone-800/60 border border-stone-800 transition cursor-pointer"
              title="Tour walkthrough"
            >
              <Sparkles className="w-3 h-3 text-[#D9F36A]" />
              <span>Tour</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-mono font-medium text-stone-200">
                    {currentUser.displayName}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    {currentUser.role}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-xs font-mono font-semibold text-[#D9F36A]">
                  {currentUser.displayName.charAt(0)}
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-[#E77B64] hover:bg-stone-800/80 transition cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D9F36A] text-[#151C1B] text-xs font-mono font-semibold hover:bg-[#cbf046] transition cursor-pointer shadow"
              >
                <User className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile secondary navigation bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-stone-800/60 no-scrollbar">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-[#1e2624] text-[#D9F36A] border border-[#D9F36A]/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
