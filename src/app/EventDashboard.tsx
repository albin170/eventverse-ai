import React, { useState } from 'react';
import { UserProfile } from '@/types';
import { getCurrentUser } from '@/services/auth';
import { UserDashboard } from './UserDashboard';
import { AdminDashboard } from './AdminDashboard';

export const EventDashboard: React.FC = () => {
  const [adminView, setAdminView] = useState(false);
  const defaultUser: UserProfile = getCurrentUser() || {
    uid: 'eval_user_default',
    email: 'user@eventverse.test',
    displayName: 'Alex Morgan',
    role: 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  if (adminView) {
    return (
      <AdminDashboard
        currentUser={{ ...defaultUser, role: 'admin', email: 'admin@eventverse.internal' }}
        onExitAdmin={() => setAdminView(false)}
      />
    );
  }

  return (
    <UserDashboard
      currentUser={defaultUser}
      onOpenAdminPortal={() => setAdminView(true)}
      onSignOut={() => {}}
    />
  );
};
