import { UserProfile, UserRole } from '@/types';
import { auth as firebaseAuth, isFirebaseConfigured } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  deleteUser as firebaseDeleteUser,
} from 'firebase/auth';

const STORAGE_USERS_KEY = 'eventverse_users_v2';
const STORAGE_CURRENT_USER_KEY = 'eventverse_current_user_v2';

// In-memory auth state listeners
type AuthListener = (user: UserProfile | null) => void;
const authListeners: Set<AuthListener> = new Set();

let currentUser: UserProfile | null = null;

// Initialize state from local persistent store
function initLocalUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

currentUser = initLocalUser();

function notifyListeners() {
  authListeners.forEach((listener) => listener(currentUser));
}

export function getPersistenceMode(): 'cloud_firebase' | 'local_persistent' {
  return isFirebaseConfigured && firebaseAuth ? 'cloud_firebase' : 'local_persistent';
}

export function subscribeToAuth(callback: AuthListener): () => void {
  authListeners.add(callback);
  callback(currentUser);

  if (isFirebaseConfigured && firebaseAuth) {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (fbUser) {
        // Construct user profile
        currentUser = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          role: fbUser.email?.endsWith('@eventverse.admin') ? 'admin' : 'user',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
      } else {
        currentUser = null;
      }
      notifyListeners();
    });

    return () => {
      authListeners.delete(callback);
      unsubscribe();
    };
  }

  return () => {
    authListeners.delete(callback);
  };
}

export function getCurrentUser(): UserProfile | null {
  return currentUser;
}

export function isAuthenticated(): boolean {
  return currentUser !== null && currentUser.status === 'active';
}

export function isAdmin(): boolean {
  return currentUser !== null && currentUser.role === 'admin' && currentUser.status === 'active';
}

/**
 * Register a new user account.
 */
export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'user'
): Promise<UserProfile> {
  const normalizedEmail = email.trim().toLowerCase();

  if (isFirebaseConfigured && firebaseAuth) {
    const userCredential = await createUserWithEmailAndPassword(
      firebaseAuth,
      normalizedEmail,
      password
    );
    await firebaseUpdateProfile(userCredential.user, { displayName });

    const profile: UserProfile = {
      uid: userCredential.user.uid,
      email: normalizedEmail,
      displayName,
      role: normalizedEmail.endsWith('@eventverse.admin') ? 'admin' : role,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    currentUser = profile;
    notifyListeners();
    return profile;
  }

  // Local persistent registration
  const allUsersRaw = localStorage.getItem(STORAGE_USERS_KEY);
  const users: Record<string, UserProfile & { passwordHash: string }> = allUsersRaw
    ? JSON.parse(allUsersRaw)
    : {};

  if (users[normalizedEmail]) {
    throw new Error('An account with this email address already exists.');
  }

  const profile: UserProfile = {
    uid: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmail,
    displayName,
    role,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  users[normalizedEmail] = {
    ...profile,
    passwordHash: btoa(password), // Deterministic encoding for offline validation
  };

  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(profile));

  currentUser = profile;
  notifyListeners();
  return profile;
}

/**
 * Sign in with email and password.
 */
export async function loginUser(email: string, password: string): Promise<UserProfile> {
  const normalizedEmail = email.trim().toLowerCase();

  if (isFirebaseConfigured && firebaseAuth) {
    const userCredential = await signInWithEmailAndPassword(
      firebaseAuth,
      normalizedEmail,
      password
    );
    const profile: UserProfile = {
      uid: userCredential.user.uid,
      email: normalizedEmail,
      displayName: userCredential.user.displayName || normalizedEmail.split('@')[0],
      role: normalizedEmail.endsWith('@eventverse.admin') ? 'admin' : 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    currentUser = profile;
    notifyListeners();
    return profile;
  }

  // Local persistent sign in
  const allUsersRaw = localStorage.getItem(STORAGE_USERS_KEY);
  const users: Record<string, UserProfile & { passwordHash: string }> = allUsersRaw
    ? JSON.parse(allUsersRaw)
    : {};

  const record = users[normalizedEmail];
  if (!record || record.passwordHash !== btoa(password)) {
    throw new Error('Invalid email or password. Please verify credentials.');
  }

  if (record.status === 'suspended') {
    throw new Error(
      `Your account has been suspended: ${record.suspensionReason || 'Violation of terms.'}`
    );
  }

  const profile: UserProfile = {
    uid: record.uid,
    email: record.email,
    displayName: record.displayName,
    role: record.role,
    status: record.status,
    createdAt: record.createdAt,
    lastLoginAt: new Date().toISOString(),
  };

  users[normalizedEmail] = { ...record, lastLoginAt: profile.lastLoginAt };
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(profile));

  currentUser = profile;
  notifyListeners();
  return profile;
}

/**
 * Sign out current session.
 */
export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && firebaseAuth) {
    await firebaseSignOut(firebaseAuth);
  }
  localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  currentUser = null;
  notifyListeners();
}

/**
 * Delete current user account.
 */
export async function deleteAccount(): Promise<void> {
  if (!currentUser) throw new Error('No authenticated user session found.');

  if (isFirebaseConfigured && firebaseAuth && firebaseAuth.currentUser) {
    await firebaseDeleteUser(firebaseAuth.currentUser);
  }

  const allUsersRaw = localStorage.getItem(STORAGE_USERS_KEY);
  if (allUsersRaw) {
    const users = JSON.parse(allUsersRaw);
    delete users[currentUser.email];
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  }

  await logoutUser();
}

/**
 * Administrator account provisioner (offline and cloud helper).
 */
export async function provisionAdminAccount(
  email: string = 'admin@eventverse.internal',
  password: string = 'AdminSecure2026!',
  displayName: string = 'Platform Administrator'
): Promise<UserProfile> {
  return registerUser(email, password, displayName, 'admin');
}
