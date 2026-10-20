import {
  EventRecord,
  BudgetItem,
  TimelineTask,
  GuestRecord,
  VendorProfile,
  VendorEnquiry,
  VenueDesignRecord,
  AuditLogRecord,
  UserProfile,
  Venue3DConfig,
} from '@/types';
import { db as firestoreDb, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

// Storage Keys for persistent local engine
const KEYS = {
  EVENTS: 'eventverse_db_events',
  EXPENSES: 'eventverse_db_expenses',
  TASKS: 'eventverse_db_tasks',
  GUESTS: 'eventverse_db_guests',
  VENDORS: 'eventverse_db_vendors',
  ENQUIRIES: 'eventverse_db_enquiries',
  VENUE_DESIGNS: 'eventverse_db_venue_designs',
  AUDIT_LOGS: 'eventverse_db_audit_logs',
  SETTINGS: 'eventverse_db_settings',
  USERS: 'eventverse_users_v2',
};

function readLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// AUDIT LOGGING
// ---------------------------------------------------------------------------
export async function logAuditEvent(entry: Omit<AuditLogRecord, 'id' | 'timestamp'>): Promise<void> {
  const record: AuditLogRecord = {
    ...entry,
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  if (isFirebaseConfigured && firestoreDb) {
    try {
      await setDoc(doc(firestoreDb, 'auditLogs', record.id), {
        ...record,
        serverTime: serverTimestamp(),
      });
      return;
    } catch (e) {
      console.warn('Could not write audit log to Firestore:', e);
    }
  }

  const logs = readLocal<AuditLogRecord>(KEYS.AUDIT_LOGS);
  logs.unshift(record);
  writeLocal(KEYS.AUDIT_LOGS, logs.slice(0, 500)); // Maintain bounded history
}

export async function listAuditLogs(user: UserProfile): Promise<AuditLogRecord[]> {
  if (user.role !== 'admin') throw new Error('Unauthorized: Admin privilege required.');

  if (isFirebaseConfigured && firestoreDb) {
    const snap = await getDocs(
      query(collection(firestoreDb, 'auditLogs'), orderBy('timestamp', 'desc'))
    );
    return snap.docs.map((d) => d.data() as AuditLogRecord);
  }

  return readLocal<AuditLogRecord>(KEYS.AUDIT_LOGS);
}

// ---------------------------------------------------------------------------
// EVENTS CRUD & AUTHORIZATION
// ---------------------------------------------------------------------------
export async function createEvent(
  data: Omit<EventRecord, 'id' | 'ownerId' | 'status' | 'moderationStatus' | 'createdAt' | 'updatedAt'>,
  user: UserProfile
): Promise<EventRecord> {
  if (!user || user.status === 'suspended') {
    throw new Error('Unauthorized: Active account required.');
  }

  const newEvent: EventRecord = {
    ...data,
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ownerId: user.uid,
    ownerEmail: user.email,
    status: 'planning',
    moderationStatus: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && firestoreDb) {
    await setDoc(doc(firestoreDb, 'events', newEvent.id), newEvent);
  } else {
    const events = readLocal<EventRecord>(KEYS.EVENTS);
    events.unshift(newEvent);
    writeLocal(KEYS.EVENTS, events);
  }

  await logAuditEvent({
    actorId: user.uid,
    actorEmail: user.email,
    action: 'CREATE_EVENT',
    targetType: 'event',
    targetId: newEvent.id,
    reason: 'User created new event',
    metadata: { title: newEvent.title, budget: newEvent.totalBudget },
  });

  return newEvent;
}

export async function listEvents(user: UserProfile): Promise<EventRecord[]> {
  if (!user) return [];

  if (isFirebaseConfigured && firestoreDb) {
    const col = collection(firestoreDb, 'events');
    const q = user.role === 'admin' ? col : query(col, where('ownerId', '==', user.uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as EventRecord);
  }

  const events = readLocal<EventRecord>(KEYS.EVENTS);
  if (user.role === 'admin') return events;
  return events.filter((e) => e.ownerId === user.uid);
}

export async function getEventById(eventId: string, user: UserProfile): Promise<EventRecord | null> {
  if (!user) throw new Error('Unauthorized');

  if (isFirebaseConfigured && firestoreDb) {
    const snap = await getDoc(doc(firestoreDb, 'events', eventId));
    if (!snap.exists()) return null;
    const ev = snap.data() as EventRecord;
    if (ev.ownerId !== user.uid && user.role !== 'admin') {
      throw new Error('Access denied: You do not have permission to view this event.');
    }
    return ev;
  }

  const events = readLocal<EventRecord>(KEYS.EVENTS);
  const ev = events.find((e) => e.id === eventId);
  if (!ev) return null;
  if (ev.ownerId !== user.uid && user.role !== 'admin') {
    throw new Error('Access denied: You do not have permission to view this event.');
  }
  return ev;
}

export async function updateEvent(
  eventId: string,
  updates: Partial<EventRecord>,
  user: UserProfile
): Promise<EventRecord> {
  const existing = await getEventById(eventId, user);
  if (!existing) throw new Error('Event not found.');

  if (existing.ownerId !== user.uid && user.role !== 'admin') {
    throw new Error('Unauthorized to modify this event.');
  }

  const updated: EventRecord = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && firestoreDb) {
    await setDoc(doc(firestoreDb, 'events', eventId), updated);
  } else {
    const events = readLocal<EventRecord>(KEYS.EVENTS);
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx !== -1) {
      events[idx] = updated;
      writeLocal(KEYS.EVENTS, events);
    }
  }

  return updated;
}

export async function deleteEvent(eventId: string, user: UserProfile): Promise<void> {
  const existing = await getEventById(eventId, user);
  if (!existing) throw new Error('Event not found');

  if (existing.ownerId !== user.uid && user.role !== 'admin') {
    throw new Error('Unauthorized to delete this event.');
  }

  if (isFirebaseConfigured && firestoreDb) {
    await deleteDoc(doc(firestoreDb, 'events', eventId));
  } else {
    const events = readLocal<EventRecord>(KEYS.EVENTS).filter((e) => e.id !== eventId);
    writeLocal(KEYS.EVENTS, events);

    // Cascade delete related records
    writeLocal(KEYS.EXPENSES, readLocal<BudgetItem>(KEYS.EXPENSES).filter((e) => e.eventId !== eventId));
    writeLocal(KEYS.TASKS, readLocal<TimelineTask>(KEYS.TASKS).filter((t) => t.eventId !== eventId));
    writeLocal(KEYS.GUESTS, readLocal<GuestRecord>(KEYS.GUESTS).filter((g) => g.eventId !== eventId));
  }

  await logAuditEvent({
    actorId: user.uid,
    actorEmail: user.email,
    action: 'DELETE_EVENT',
    targetType: 'event',
    targetId: eventId,
    reason: 'Event deleted by user or administrator',
  });
}

export async function moderateEvent(
  eventId: string,
  moderationStatus: 'approved' | 'flagged' | 'suspended',
  reason: string,
  adminUser: UserProfile
): Promise<EventRecord> {
  if (adminUser.role !== 'admin') throw new Error('Unauthorized: Admin privileges required.');

  const existing = await getEventById(eventId, adminUser);
  if (!existing) throw new Error('Event not found.');

  const updated: EventRecord = {
    ...existing,
    moderationStatus,
    moderationReason: reason,
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && firestoreDb) {
    await setDoc(doc(firestoreDb, 'events', eventId), updated);
  } else {
    const events = readLocal<EventRecord>(KEYS.EVENTS);
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx !== -1) {
      events[idx] = updated;
      writeLocal(KEYS.EVENTS, events);
    }
  }

  await logAuditEvent({
    actorId: adminUser.uid,
    actorEmail: adminUser.email,
    action: `MODERATE_EVENT_${moderationStatus.toUpperCase()}`,
    targetType: 'event',
    targetId: eventId,
    reason,
  });

  return updated;
}

// ---------------------------------------------------------------------------
// EXPENSES & BUDGET ITEMS
// ---------------------------------------------------------------------------
export async function listExpenses(eventId: string, user: UserProfile): Promise<BudgetItem[]> {
  await getEventById(eventId, user); // Validates permission

  if (isFirebaseConfigured && firestoreDb) {
    const q = query(collection(firestoreDb, 'expenses'), where('eventId', '==', eventId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as BudgetItem);
  }

  return readLocal<BudgetItem>(KEYS.EXPENSES).filter((e) => e.eventId === eventId);
}

export async function addExpense(
  item: Omit<BudgetItem, 'id' | 'ownerId'>,
  user: UserProfile
): Promise<BudgetItem> {
  if (item.eventId) {
    await getEventById(item.eventId, user);
  }

  const newItem: BudgetItem = {
    ...item,
    id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ownerId: user.uid,
  };

  if (isFirebaseConfigured && firestoreDb) {
    await setDoc(doc(firestoreDb, 'expenses', newItem.id), newItem);
  } else {
    const items = readLocal<BudgetItem>(KEYS.EXPENSES);
    items.push(newItem);
    writeLocal(KEYS.EXPENSES, items);
  }

  return newItem;
}

export async function updateExpense(item: BudgetItem, user: UserProfile): Promise<BudgetItem> {
  if (item.eventId) {
    await getEventById(item.eventId, user);
  }

  if (isFirebaseConfigured && firestoreDb) {
    await setDoc(doc(firestoreDb, 'expenses', item.id), item);
  } else {
    const items = readLocal<BudgetItem>(KEYS.EXPENSES);
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      items[idx] = item;
      writeLocal(KEYS.EXPENSES, items);
    }
  }

  return item;
}

export async function deleteExpense(itemId: string, eventId: string, user: UserProfile): Promise<void> {
  await getEventById(eventId, user);

  if (isFirebaseConfigured && firestoreDb) {
    await deleteDoc(doc(firestoreDb, 'expenses', itemId));
  } else {
    const items = readLocal<BudgetItem>(KEYS.EXPENSES).filter((i) => i.id !== itemId);
    writeLocal(KEYS.EXPENSES, items);
  }
}

// ---------------------------------------------------------------------------
// TASKS
// ---------------------------------------------------------------------------
export async function listTasks(eventId: string, user: UserProfile): Promise<TimelineTask[]> {
  await getEventById(eventId, user);

  if (isFirebaseConfigured && firestoreDb) {
    const q = query(collection(firestoreDb, 'tasks'), where('eventId', '==', eventId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as TimelineTask);
  }

  return readLocal<TimelineTask>(KEYS.TASKS).filter((t) => t.eventId === eventId);
}

export async function addTask(
  task: Omit<TimelineTask, 'id' | 'ownerId'>,
  user: UserProfile
): Promise<TimelineTask> {
  if (task.eventId) {
    await getEventById(task.eventId, user);
  }

  const newTask: TimelineTask = {
    ...task,
    id: `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ownerId: user.uid,
  };

  if (isFirebaseConfigured && firestoreDb) {
    await setDoc(doc(firestoreDb, 'tasks', newTask.id), newTask);
  } else {
    const tasks = readLocal<TimelineTask>(KEYS.TASKS);
    tasks.push(newTask);
    writeLocal(KEYS.TASKS, tasks);
  }

  return newTask;
}

export async function updateTask(task: TimelineTask, user: UserProfile): Promise<TimelineTask> {
  if (task.eventId) {
    await getEventById(task.eventId, user);
  }

  if (isFirebaseConfigured && firestoreDb) {
    await setDoc(doc(firestoreDb, 'tasks', task.id), task);

  } else {
    const tasks = readLocal<TimelineTask>(KEYS.TASKS);
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx !== -1) {
      tasks[idx] = task;
      writeLocal(KEYS.TASKS, tasks);
    }
  }

  return task;
}

export async function deleteTask(taskId: string, eventId: string, user: UserProfile): Promise<void> {
  await getEventById(eventId, user);

  if (isFirebaseConfigured && firestoreDb) {
    await deleteDoc(doc(firestoreDb, 'tasks', taskId));
  } else {
    const tasks = readLocal<TimelineTask>(KEYS.TASKS).filter((t) => t.id !== taskId);
    writeLocal(KEYS.TASKS, tasks);
  }
}

// ---------------------------------------------------------------------------
// GUESTS
// ---------------------------------------------------------------------------
export async function listGuests(eventId: string, user: UserProfile): Promise<GuestRecord[]> {
  await getEventById(eventId, user);

  if (isFirebaseConfigured && firestoreDb) {
    const q = query(collection(firestoreDb, 'guests'), where('eventId', '==', eventId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as GuestRecord);
  }

  return readLocal<GuestRecord>(KEYS.GUESTS).filter((g) => g.eventId === eventId);
}

export async function addGuest(
  guest: Omit<GuestRecord, 'id' | 'ownerId' | 'invitedAt'>,
  user: UserProfile
): Promise<GuestRecord> {
  await getEventById(guest.eventId, user);

  const newGuest: GuestRecord = {
    ...guest,
    id: `gst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ownerId: user.uid,
    invitedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && firestoreDb) {
    await setDoc(doc(firestoreDb, 'guests', newGuest.id), newGuest);
  } else {
    const guests = readLocal<GuestRecord>(KEYS.GUESTS);
    guests.push(newGuest);
    writeLocal(KEYS.GUESTS, guests);
  }

  return newGuest;
}

export async function updateGuest(guest: GuestRecord, user: UserProfile): Promise<GuestRecord> {
  await getEventById(guest.eventId, user);

  if (isFirebaseConfigured && firestoreDb) {
    await setDoc(doc(firestoreDb, 'guests', guest.id), guest);
  } else {
    const guests = readLocal<GuestRecord>(KEYS.GUESTS);
    const idx = guests.findIndex((g) => g.id === guest.id);
    if (idx !== -1) {
      guests[idx] = guest;
      writeLocal(KEYS.GUESTS, guests);
    }
  }

  return guest;
}

export async function deleteGuest(guestId: string, eventId: string, user: UserProfile): Promise<void> {
  await getEventById(eventId, user);

  if (isFirebaseConfigured && firestoreDb) {
    await deleteDoc(doc(firestoreDb, 'guests', guestId));
  } else {
    const guests = readLocal<GuestRecord>(KEYS.GUESTS).filter((g) => g.id !== guestId);
    writeLocal(KEYS.GUESTS, guests);
  }
}

// ---------------------------------------------------------------------------
// VENDORS & DIRECTORY
// ---------------------------------------------------------------------------
export async function listVerifiedVendors(): Promise<VendorProfile[]> {
  if (isFirebaseConfigured && firestoreDb) {
    const q = query(
      collection(firestoreDb, 'vendorProfiles'),
      where('verificationStatus', '==', 'verified')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as VendorProfile);
  }

  const vendors = readLocal<VendorProfile>(KEYS.VENDORS);
  return vendors.filter((v) => v.verificationStatus === 'verified');
}

export async function listAllVendorsForAdmin(adminUser: UserProfile): Promise<VendorProfile[]> {
  if (adminUser.role !== 'admin') throw new Error('Unauthorized: Admin access required');

  if (isFirebaseConfigured && firestoreDb) {
    const snap = await getDocs(collection(firestoreDb, 'vendorProfiles'));
    return snap.docs.map((d) => d.data() as VendorProfile);
  }

  return readLocal<VendorProfile>(KEYS.VENDORS);
}

export async function createVendorProfile(
  data: Omit<VendorProfile, 'id' | 'createdAt'>,
  adminUser: UserProfile
): Promise<VendorProfile> {
  if (adminUser.role !== 'admin') throw new Error('Unauthorized: Admin access required');

  const vendor: VendorProfile = {
    ...data,
    id: `vnd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    verifiedBy: adminUser.email,
    verifiedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && firestoreDb) {
    await setDoc(doc(firestoreDb, 'vendorProfiles', vendor.id), vendor);
  } else {
    const list = readLocal<VendorProfile>(KEYS.VENDORS);
    list.push(vendor);
    writeLocal(KEYS.VENDORS, list);
  }

  await logAuditEvent({
    actorId: adminUser.uid,
    actorEmail: adminUser.email,
    action: 'CREATE_VENDOR_PROFILE',
    targetType: 'vendor',
    targetId: vendor.id,
    reason: 'Administrator registered verified vendor profile',
    metadata: { name: vendor.name, category: vendor.category },
  });

  return vendor;
}

export async function updateVendorStatus(
  vendorId: string,
  verificationStatus: 'verified' | 'pending_review' | 'suspended',
  reason: string,
  adminUser: UserProfile
): Promise<void> {
  if (adminUser.role !== 'admin') throw new Error('Unauthorized: Admin access required');

  if (isFirebaseConfigured && firestoreDb) {
    const ref = doc(firestoreDb, 'vendorProfiles', vendorId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await setDoc(
        ref,
        {
          verificationStatus,
          verifiedBy: adminUser.email,
          verifiedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } else {
    const list = readLocal<VendorProfile>(KEYS.VENDORS);
    const idx = list.findIndex((v) => v.id === vendorId);
    if (idx !== -1) {
      list[idx].verificationStatus = verificationStatus;
      writeLocal(KEYS.VENDORS, list);
    }
  }

  await logAuditEvent({
    actorId: adminUser.uid,
    actorEmail: adminUser.email,
    action: `UPDATE_VENDOR_STATUS_${verificationStatus.toUpperCase()}`,
    targetType: 'vendor',
    targetId: vendorId,
    reason,
  });
}

// ---------------------------------------------------------------------------
// VENDOR ENQUIRIES
// ---------------------------------------------------------------------------
export async function submitVendorEnquiry(
  data: Omit<VendorEnquiry, 'id' | 'userId' | 'userEmail' | 'userName' | 'status' | 'createdAt' | 'updatedAt'>,
  user: UserProfile
): Promise<VendorEnquiry> {
  if (!user) throw new Error('Unauthorized');

  const enquiry: VendorEnquiry = {
    ...data,
    id: `enq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: user.uid,
    userEmail: user.email,
    userName: user.displayName,
    status: 'submitted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && firestoreDb) {
    await setDoc(doc(firestoreDb, 'vendorEnquiries', enquiry.id), enquiry);
  } else {
    const list = readLocal<VendorEnquiry>(KEYS.ENQUIRIES);
    list.unshift(enquiry);
    writeLocal(KEYS.ENQUIRIES, list);
  }

  return enquiry;
}

export async function listUserEnquiries(user: UserProfile): Promise<VendorEnquiry[]> {
  if (!user) return [];

  if (isFirebaseConfigured && firestoreDb) {
    const q = query(
      collection(firestoreDb, 'vendorEnquiries'),
      where('userId', '==', user.uid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as VendorEnquiry);
  }

  return readLocal<VendorEnquiry>(KEYS.ENQUIRIES).filter((e) => e.userId === user.uid);
}

export async function listAllEnquiriesForAdmin(adminUser: UserProfile): Promise<VendorEnquiry[]> {
  if (adminUser.role !== 'admin') throw new Error('Unauthorized');

  if (isFirebaseConfigured && firestoreDb) {
    const snap = await getDocs(collection(firestoreDb, 'vendorEnquiries'));
    return snap.docs.map((d) => d.data() as VendorEnquiry);
  }

  return readLocal<VendorEnquiry>(KEYS.ENQUIRIES);
}

export async function updateEnquiryStatus(
  enquiryId: string,
  status: VendorEnquiry['status'],
  adminNotes: string,
  adminUser: UserProfile
): Promise<void> {
  if (adminUser.role !== 'admin') throw new Error('Unauthorized');

  if (isFirebaseConfigured && firestoreDb) {
    const ref = doc(firestoreDb, 'vendorEnquiries', enquiryId);
    await setDoc(
      ref,
      {
        status,
        adminNotes,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } else {
    const list = readLocal<VendorEnquiry>(KEYS.ENQUIRIES);
    const idx = list.findIndex((e) => e.id === enquiryId);
    if (idx !== -1) {
      list[idx].status = status;
      list[idx].adminNotes = adminNotes;
      list[idx].updatedAt = new Date().toISOString();
      writeLocal(KEYS.ENQUIRIES, list);
    }
  }

  await logAuditEvent({
    actorId: adminUser.uid,
    actorEmail: adminUser.email,
    action: `UPDATE_ENQUIRY_${status.toUpperCase()}`,
    targetType: 'enquiry',
    targetId: enquiryId,
    reason: `Enquiry status changed to ${status}`,
    metadata: { adminNotes },
  });
}

// ---------------------------------------------------------------------------
// 3D VENUE DESIGNS
// ---------------------------------------------------------------------------
export async function saveVenueDesign(
  eventId: string,
  sceneConfig: Venue3DConfig,
  user: UserProfile
): Promise<VenueDesignRecord> {
  await getEventById(eventId, user);

  const design: VenueDesignRecord = {
    id: `ven_${eventId}`,
    eventId,
    ownerId: user.uid,
    sceneConfig,
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && firestoreDb) {
    await setDoc(doc(firestoreDb, 'venueDesigns', design.id), design);
  } else {
    const designs = readLocal<VenueDesignRecord>(KEYS.VENUE_DESIGNS);
    const idx = designs.findIndex((d) => d.eventId === eventId);
    if (idx !== -1) {
      designs[idx] = design;
    } else {
      designs.push(design);
    }
    writeLocal(KEYS.VENUE_DESIGNS, designs);
  }

  return design;
}

export async function getVenueDesign(
  eventId: string,
  user: UserProfile
): Promise<VenueDesignRecord | null> {
  await getEventById(eventId, user);

  if (isFirebaseConfigured && firestoreDb) {
    const snap = await getDoc(doc(firestoreDb, 'venueDesigns', `ven_${eventId}`));
    return snap.exists() ? (snap.data() as VenueDesignRecord) : null;
  }

  const designs = readLocal<VenueDesignRecord>(KEYS.VENUE_DESIGNS);
  return designs.find((d) => d.eventId === eventId) || null;
}

// ---------------------------------------------------------------------------
// ADMIN OVERVIEW METRICS (DERIVED FROM REAL RECORDS)
// ---------------------------------------------------------------------------
export async function getAdminPlatformMetrics(adminUser: UserProfile) {
  if (adminUser.role !== 'admin') throw new Error('Unauthorized');

  const events = await listEvents(adminUser);
  const vendors = await listAllVendorsForAdmin(adminUser);
  const enquiries = await listAllEnquiriesForAdmin(adminUser);
  const auditLogs = await listAuditLogs(adminUser);

  // Accounts from local users store or firebase
  let totalAccounts = 1;
  const rawUsers = localStorage.getItem(KEYS.USERS);
  if (rawUsers) {
    totalAccounts = Object.keys(JSON.parse(rawUsers)).length;
  }

  const eventsByCategory = events.reduce((acc, ev) => {
    acc[ev.category] = (acc[ev.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const upcomingEvents = events.filter((ev) => new Date(ev.eventDate) >= new Date()).length;
  const openEnquiries = enquiries.filter(
    (e) => e.status === 'submitted' || e.status === 'under_review'
  ).length;

  return {
    totalAccounts,
    totalEvents: events.length,
    upcomingEvents,
    totalVendors: vendors.length,
    openEnquiries,
    eventsByCategory,
    recentAuditsCount: auditLogs.length,
  };
}

// ---------------------------------------------------------------------------
// ADMIN USER ACCOUNTS MANAGEMENT
// ---------------------------------------------------------------------------
export async function listAllUsersForAdmin(adminUser: UserProfile): Promise<UserProfile[]> {
  if (adminUser.role !== 'admin') throw new Error('Unauthorized: Admin access required');

  const rawUsers = localStorage.getItem(KEYS.USERS);
  if (!rawUsers) return [adminUser];

  const map = JSON.parse(rawUsers);
  return Object.values(map).map((u: any) => ({
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
    suspensionReason: u.suspensionReason,
  }));
}

export async function suspendUserAccount(
  targetEmail: string,
  reason: string,
  adminUser: UserProfile
): Promise<void> {
  if (adminUser.role !== 'admin') throw new Error('Unauthorized');

  const rawUsers = localStorage.getItem(KEYS.USERS);
  if (rawUsers) {
    const map = JSON.parse(rawUsers);
    if (map[targetEmail]) {
      map[targetEmail].status = 'suspended';
      map[targetEmail].suspensionReason = reason;
      localStorage.setItem(KEYS.USERS, JSON.stringify(map));
    }
  }

  await logAuditEvent({
    actorId: adminUser.uid,
    actorEmail: adminUser.email,
    action: 'SUSPEND_USER_ACCOUNT',
    targetType: 'user',
    targetId: targetEmail,
    reason,
  });
}

export async function restoreUserAccount(
  targetEmail: string,
  reason: string,
  adminUser: UserProfile
): Promise<void> {
  if (adminUser.role !== 'admin') throw new Error('Unauthorized');

  const rawUsers = localStorage.getItem(KEYS.USERS);
  if (rawUsers) {
    const map = JSON.parse(rawUsers);
    if (map[targetEmail]) {
      map[targetEmail].status = 'active';
      delete map[targetEmail].suspensionReason;
      localStorage.setItem(KEYS.USERS, JSON.stringify(map));
    }
  }

  await logAuditEvent({
    actorId: adminUser.uid,
    actorEmail: adminUser.email,
    action: 'RESTORE_USER_ACCOUNT',
    targetType: 'user',
    targetId: targetEmail,
    reason,
  });
}
