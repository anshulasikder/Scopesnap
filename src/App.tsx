import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { OnboardingTour } from './components/OnboardingTour';
import { AuthModal } from './pages/AuthModal';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { AgreementIntakePage } from './pages/AgreementIntakePage';
import { AgreementDetailPage } from './pages/AgreementDetailPage';
import { ClientReviewPage } from './pages/ClientReviewPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { VerificationPage } from './pages/VerificationPage';
import { ScopeSentinelPage } from './pages/ScopeSentinelPage';
import { SettingsPage } from './pages/SettingsPage';
import type { UserProfile, SignedReceipt } from './types';

// Default synthetic demo user: Alex Morgan (Freelancer)
const DEFAULT_DEMO_USER: UserProfile = {
  id: 'usr_alex_demo',
  email: 'alex@alexmorgandesign.com',
  displayName: 'Alex Morgan',
  role: 'FREELANCER',
  onboardingCompleted: true,
  createdAt: '2026-11-01T08:00:00Z',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(DEFAULT_DEMO_USER);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeAgreementId, setActiveAgreementId] = useState<string>('agmt_logo_design_2026');
  const [selectedReviewToken, setSelectedReviewToken] = useState<string>('tok_demo_elena_review_2026');
  const [verifyReceiptPayload, setVerifyReceiptPayload] = useState<SignedReceipt | undefined>(undefined);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    // Check if query param specifies tab or autostart
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab')) {
      setActiveTab(urlParams.get('tab')!);
    }
    if (urlParams.get('reviewToken')) {
      setSelectedReviewToken(urlParams.get('reviewToken')!);
      setActiveTab('client-review');
    }

    // Check stored user
    const storedUser = localStorage.getItem('scopesnap_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }

    // Check onboarding completion status
    const tourDone = localStorage.getItem('scopesnap_onboarding_completed');
    if (!tourDone && !urlParams.get('autostart')) {
      // Prompt onboarding tour on first visit
      setTourOpen(true);
    }
  }, []);

  const handleNavigateTab = (tab: string, meta?: Record<string, unknown>) => {
    if (meta?.agreementId) {
      setActiveAgreementId(meta.agreementId as string);
    }
    if (meta?.token) {
      setSelectedReviewToken(meta.token as string);
    }
    if (meta?.receipt) {
      setVerifyReceiptPayload(meta.receipt as SignedReceipt);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    localStorage.removeItem('scopesnap_user');
    setCurrentUser(null);
    setActiveTab('landing');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#151C1B] text-[#F4F1E8] antialiased selection:bg-[#D9F36A] selection:text-[#151C1B]">
      {/* Top Application Shell Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleNavigateTab}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onStartTour={() => setTourOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col">
        {activeTab === 'landing' && (
          <LandingPage
            onGetStarted={() => {
              if (currentUser) handleNavigateTab('dashboard');
              else setAuthModalOpen(true);
            }}
            onExploreDemo={() => handleNavigateTab('dashboard')}
            onOpenVerify={() => handleNavigateTab('verification')}
          />
        )}

        {activeTab === 'dashboard' && currentUser && (
          <DashboardPage
            currentUser={currentUser}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsPage
            onSelectProject={id => handleNavigateTab('agreements', { projectId: id })}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'intake' && (
          <AgreementIntakePage
            onAgreementCreated={id => {
              setActiveAgreementId(id);
              handleNavigateTab('agreements', { agreementId: id });
            }}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'agreements' && (
          <AgreementDetailPage
            agreementId={activeAgreementId}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'client-review' && (
          <ClientReviewPage
            token={selectedReviewToken}
            onBackToDashboard={() => handleNavigateTab('dashboard')}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsPage
            agreementId={activeAgreementId}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'verification' && (
          <VerificationPage
            initialReceipt={verifyReceiptPayload}
          />
        )}

        {activeTab === 'scope' && (
          <ScopeSentinelPage
            agreementId={activeAgreementId}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'settings' && currentUser && (
          <SettingsPage
            currentUser={currentUser}
            onReplayTour={() => setTourOpen(true)}
          />
        )}
      </main>

      {/* Global Application Footer */}
      <Footer />

      {/* Interactive Walkthrough Tour */}
      <OnboardingTour
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        onNavigateTab={handleNavigateTab}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={user => {
          setCurrentUser(user);
          handleNavigateTab('dashboard');
        }}
      />
    </div>
  );
}
