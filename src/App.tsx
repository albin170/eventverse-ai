import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { subscribeToAuth, getCurrentUser, logoutUser } from '@/services/auth';
import { LandingPage } from '@/components/LandingPage';
import { AuthModal } from '@/components/AuthModal';
import { UserDashboard } from '@/app/UserDashboard';
import { AdminDashboard } from '@/app/AdminDashboard';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getCurrentUser());
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'admin'>('landing');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user && currentView === 'landing') {
        setCurrentView('dashboard');
      }
    });
    return () => unsubscribe();
  }, [currentView]);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthInitialMode(mode);
    setShowAuthModal(true);
  };

  const handleGetStarted = () => {
    if (currentUser) {
      setCurrentView('dashboard');
    } else {
      handleOpenAuth('register');
    }
  };

  const handleOpenAdminPortal = () => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    setCurrentView('admin');
  };

  const handleSignOut = async () => {
    await logoutUser();
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-midnight-950 text-slate-100 font-sans selection:bg-violet-500/30">
      {currentView === 'landing' && (
        <LandingPage
          onGetStarted={handleGetStarted}
          onOpenAuth={handleOpenAuth}
          onOpenAdminPortal={handleOpenAdminPortal}
          isAuthenticated={currentUser !== null}
          userRole={currentUser?.role}
        />
      )}

      {currentView === 'dashboard' && currentUser && (
        <UserDashboard
          currentUser={currentUser}
          onOpenAdminPortal={handleOpenAdminPortal}
          onSignOut={handleSignOut}
        />
      )}

      {currentView === 'admin' && currentUser && (
        <AdminDashboard
          currentUser={currentUser}
          onExitAdmin={() => setCurrentView('dashboard')}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authInitialMode}
        onSuccess={() => {
          setCurrentView('dashboard');
        }}
      />
    </div>
  );
};
