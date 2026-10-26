import { 
  User, 
  SubmissionTopic,
  TopicSubTask,
  Submission, 
  SubmissionVersion, 
  SubmissionFile,
  SubmissionType, 
  SubmissionRound, 
  ReviewRecord, 
  LibraryCategory, 
  LibraryFile, 
  AppNotification, 
  ActivityLog, 
  SystemSettings,
  UserRole,
  SubmissionStatus
} from '../types';
import { db } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

import {
  initialUsers,
  initialSubmissionTopics,
  initialSubmissions,
  initialVersions,
  initialSubmissionTypes,
  initialSubmissionRounds,
  initialReviews,
  initialLibraryCategories,
  initialLibraryFiles,
  initialNotifications,
  initialActivityLogs,
  initialSettings
} from './mockData';

const STORAGE_KEYS = {
  USERS: 'sent_work_users_v5',
  TOPICS: 'sent_work_submission_topics_v5',
  SUBMISSIONS: 'sent_work_submissions_v5',
  VERSIONS: 'sent_work_versions_v5',
  SUBMISSION_TYPES: 'sent_work_submission_types_v5',
  SUBMISSION_ROUNDS: 'sent_work_submission_rounds_v5',
  REVIEWS: 'sent_work_reviews_v5',
  LIBRARY_CATS: 'sent_work_library_cats_v5',
  LIBRARY_FILES: 'sent_work_library_files_v5',
  NOTIFICATIONS: 'sent_work_notifications_v5',
  LOGS: 'sent_work_activity_logs_v5',
  SETTINGS: 'sent_work_settings_v5',
  CURRENT_USER: 'sent_work_current_user_v5'
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage`, err);
  }
}

// Notification helper for real-time background sync
function notifyDataChanged(action: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sent_work_data_changed', { detail: { action } }));
  }
}


// System Settings
export function getSettings(): SystemSettings {
  const current = getItem<SystemSettings>(STORAGE_KEYS.SETTINGS, initialSettings);
  let changed = false;
  if (!current.googleAppsScriptWebhookUrl || !current.googleAppsScriptWebhookUrl.includes('/exec')) {
    current.googleAppsScriptWebhookUrl = 'https://script.google.com/macros/s/AKfycbwWXslp2PkyGAeAL1YGWe84sc6czzRMOZaJdxYI7sScXGbgg8eCayu82sL2-INeujErDQ/exec';
    changed = true;
  }
  if (!current.googleSheetReportId || current.googleSheetReportId !== '1N5t1SP33BkvUrc00lrjEvnRbfi1cf1JuesNJezVyZqU') {
    current.googleSheetReportId = '1N5t1SP33BkvUrc00lrjEvnRbfi1cf1JuesNJezVyZqU';
    changed = true;
  }
  if (!current.googleDriveRootFolderId || current.googleDriveRootFolderId !== '1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd') {
    current.googleDriveRootFolderId = '1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd';
    changed = true;
  }
  if (changed) {
    setItem(STORAGE_KEYS.SETTINGS, current);
  }
  return current;
}

export function saveSettings(settings: SystemSettings, actor?: User): SystemSettings {
  setItem(STORAGE_KEYS.SETTINGS, settings);
  if (actor) {
    logActivity('UPDATE_SETTINGS', 'SystemSettings', 'main', actor, { systemName: settings.systemName });
  }
  notifyDataChanged('SETTINGS_SAVED');
  return settings;
}

// Users
export function getUsers(): User[] {
  return getItem<User[]>(STORAGE_KEYS.USERS, initialUsers);
}

export function getUserById(uid: string): User | undefined {
  return getUsers().find(u => u.uid === uid);
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function getUserByUsername(username: string): User | undefined {
  const normalized = username.trim().toLowerCase();
  return getUsers().find(u => u.usernameNormalized === normalized || u.username?.toLowerCase() === normalized);
}

export function updateUser(uid: string, updates: Partial<User>, actor?: User): User | null {
  const users = getUsers();
  const index = users.findIndex(u => u.uid === uid);
  if (index === -1) return null;

  // Auto-compose displayName if firstName/lastName provided
  if (updates.firstName !== undefined || updates.lastName !== undefined) {
    const f = (updates.firstName !== undefined ? updates.firstName : users[index].firstName) || '';
    const l = (updates.lastName !== undefined ? updates.lastName : users[index].lastName) || '';
    if (!updates.displayName || updates.displayName === users[index].displayName) {
      const prefix = users[index].role === 'admin' ? '' : (f.startsWith('ครู') || f.startsWith('ม.') || f.startsWith('มิส') ? '' : 'ครู');
      updates.displayName = `${prefix}${f} ${l}`.trim();
    }
  }

  const updatedUser: User = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
  users[index] = updatedUser;
  setItem(STORAGE_KEYS.USERS, users);

  // CRITICAL: Cascade new teacherName to all submissions made by this user!
  if (updatedUser.displayName) {
    const submissions = getSubmissions();
    let subChanged = false;
    submissions.forEach(s => {
      if (s.teacherUid === uid && s.teacherName !== updatedUser.displayName) {
        s.teacherName = updatedUser.displayName;
        subChanged = true;
      }
    });
    if (subChanged) {
      setItem(STORAGE_KEYS.SUBMISSIONS, submissions);
    }
  }

  // Also update stored current user if this is the active user
  const storedCurrent = getStoredCurrentUser();
  if (storedCurrent && storedCurrent.uid === uid) {
    setStoredCurrentUser(updatedUser);
  }

  // Real-time Cloud Firestore sync
  try {
    setDoc(doc(db, 'users', uid), updatedUser, { merge: true }).catch(err => {
      console.warn('Firestore updateUser sync error:', err);
    });
  } catch (e) {}

  if (actor) {
    logActivity('UPDATE_USER', 'User', uid, actor, updates);
  }
  notifyDataChanged('UPDATE_USER');
  return updatedUser;
}

export function createUser(user: User, actor?: User): User {
  const users = getUsers();
  const index = users.findIndex(u => u.uid === user.uid || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()));
  if (index >= 0) {
    users[index] = { ...users[index], ...user, updatedAt: new Date().toISOString() };
  } else {
    users.push(user);
  }
  setItem(STORAGE_KEYS.USERS, users);

  // Real-time Cloud Firestore sync
  try {
    const finalUser = users[index >= 0 ? index : users.length - 1];
    setDoc(doc(db, 'users', finalUser.uid), finalUser, { merge: true }).catch(err => {
      console.warn('Firestore createUser sync error:', err);
    });
  } catch (e) {}

  if (actor) {
    logActivity('CREATE_USER', 'User', user.uid, actor, { role: user.role, email: user.email });
  }
  notifyDataChanged('CREATE_USER');
  return users[index >= 0 ? index : users.length - 1];
}

export function deleteUser(uid: string, actor?: User): boolean {
  const users = getUsers();
  const index = users.findIndex(u => u.uid === uid);
  if (index === -1) return false;

  const deletedUser = users[index];
  const newUsers = users.filter(u => u.uid !== uid);
  setItem(STORAGE_KEYS.USERS, newUsers);

  // Clean their submissions from storage
  const submissions = getSubmissions();
  const newSubmissions = submissions.filter(s => s.teacherUid !== uid);
  setItem(STORAGE_KEYS.SUBMISSIONS, newSubmissions);

  // Real-time Cloud Firestore delete
  try {
    deleteDoc(doc(db, 'users', uid)).catch(err => {
      console.warn('Firestore deleteUser sync error:', err);
    });
  } catch (e) {}

  if (actor) {
    logActivity('DELETE_USER', 'User', uid, actor, { 
      name: deletedUser.displayName, 
      email: deletedUser.email,
      role: deletedUser.role 
    });
  }

  notifyDataChanged('USER_DELETED');
  return true;
}

export function hasDemoSubmissions(): boolean {
  const submissions = getSubmissions();
  return submissions.some(s => 
    s.id.startsWith('sub-2026-') ||
    s.teacherUid.startsWith('teacher-') ||
    (s.teacherEmail && s.teacherEmail.endsWith('@school.ac.th')) ||
    s.teacherName.includes('ครูสมศรี') ||
    s.teacherName.includes('ครูสมชาย') ||
    s.teacherName.includes('ครูอภิสิทธิ์') ||
    s.teacherName.includes('ครูมานะ') ||
    s.teacherName.includes('ครูสุดา')
  );
}

export function deleteDemoSubmissions(actor?: User): { count: number; ids: string[] } {
  const submissions = getSubmissions();
  const demoSubs = submissions.filter(s => 
    s.id.startsWith('sub-2026-') ||
    s.teacherUid.startsWith('teacher-') ||
    (s.teacherEmail && s.teacherEmail.endsWith('@school.ac.th')) ||
    s.teacherName.includes('ครูสมศรี') ||
    s.teacherName.includes('ครูสมชาย') ||
    s.teacherName.includes('ครูอภิสิทธิ์') ||
    s.teacherName.includes('ครูมานะ') ||
    s.teacherName.includes('ครูสุดา')
  );

  const demoSubIds = new Set(demoSubs.map(s => s.id));
  const remainingSubmissions = submissions.filter(s => !demoSubIds.has(s.id));
  setItem(STORAGE_KEYS.SUBMISSIONS, remainingSubmissions);

  // Clean versions & reviews for these submissions
  const allVersions = getItem<Record<string, SubmissionVersion[]>>(STORAGE_KEYS.VERSIONS, initialVersions);
  demoSubIds.forEach(id => {
    delete allVersions[id];
  });
  setItem(STORAGE_KEYS.VERSIONS, allVersions);

  const allReviews = getItem<Record<string, ReviewRecord[]>>(STORAGE_KEYS.REVIEWS, initialReviews);
  demoSubIds.forEach(id => {
    delete allReviews[id];
  });
  setItem(STORAGE_KEYS.REVIEWS, allReviews);

  // Delete from Cloud Firestore if any exists
  demoSubIds.forEach(id => {
    try {
      deleteDoc(doc(db, 'submissions', id)).catch(() => {});
    } catch (e) {}
  });

  if (actor) {
    logActivity('DELETE_DEMO_SUBMISSIONS', 'Submission', 'batch', actor, {
      count: demoSubs.length,
      purgedIds: Array.from(demoSubIds)
    });
  }

  notifyDataChanged('DEMO_SUBMISSIONS_DELETED');
  return { count: demoSubs.length, ids: Array.from(demoSubIds) };
}

export function deleteDemoTeachers(actor?: User): { count: number; names: string[] } {
  const users = getUsers();
  // Demo teachers are teacher accounts with mock IDs or names
  const demoUsers = users.filter(u => 
    u.role === 'teacher' && (
      u.uid.startsWith('teacher-') || 
      u.email.endsWith('@school.ac.th') ||
      u.displayName.includes('ครูสมศรี') ||
      u.displayName.includes('ครูสมชาย') ||
      u.displayName.includes('ครูมานะ') ||
      u.displayName.includes('ครูสุดา') ||
      u.displayName.includes('ครูอภิสิทธิ์')
    )
  );

  const demoUids = new Set(demoUsers.map(u => u.uid));
  const remainingUsers = users.filter(u => !demoUids.has(u.uid));
  setItem(STORAGE_KEYS.USERS, remainingUsers);

  // Clean demo users from Firestore
  demoUids.forEach(uid => {
    try {
      deleteDoc(doc(db, 'users', uid)).catch(() => {});
    } catch (e) {}
  });

  // Clean demo submissions completely
  deleteDemoSubmissions(actor);

  if (actor) {
    logActivity('DELETE_DEMO_TEACHERS', 'User', 'batch', actor, {
      count: demoUsers.length,
      names: demoUsers.map(u => u.displayName)
    });
  }

  notifyDataChanged('DEMO_USERS_DELETED');
  return {
    count: demoUsers.length,
    names: demoUsers.map(u => u.displayName)
  };
}

// Submissions
export function getSubmissions(): Submission[] {
  return getItem<Submission[]>(STORAGE_KEYS.SUBMISSIONS, initialSubmissions);
}

export function getSubmissionById(id: string): Submission | undefined {
  return getSubmissions().find(s => s.id === id);
}

export function getVersionsBySubmissionId(submissionId: string): SubmissionVersion[] {
  const allVersions = getItem<Record<string, SubmissionVersion[]>>(STORAGE_KEYS.VERSIONS, initialVersions);
  const versions = allVersions[submissionId] || [];
  versions.forEach(v => {
    v.files?.forEach(f => {
      if (!f.driveUrl || f.driveUrl === '#') {
        if (f.driveFileId && !f.driveFileId.includes('_p') && f.driveFileId.length > 15) {
          f.driveUrl = `https://drive.google.com/file/d/${f.driveFileId}/view`;
        } else {
          f.driveUrl = `https://drive.google.com/drive/folders/1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd`;
        }
      }
      if (!f.downloadUrl || f.downloadUrl === '#') {
        if (f.driveFileId && !f.driveFileId.includes('_p') && f.driveFileId.length > 15) {
          f.downloadUrl = `https://drive.google.com/uc?export=download&id=${f.driveFileId}`;
        }
      }
    });
  });
  return versions;
}

export function createSubmission(
  submissionData: Omit<Submission, 'id' | 'currentVersionNumber' | 'submittedAt' | 'updatedAt' | 'status' | 'isLate'>,
  initialFiles: Array<{ fileName: string; fileSizeBytes: number; mimeType: string; previewUrl?: string; downloadUrl?: string; driveFileId?: string; driveUrl?: string; subTaskId?: string; subTaskTitle?: string }>,
  note: string,
  externalLinks: string[],
  actor: User
): Submission {
  const submissions = getSubmissions();
  const newId = `sub-${Date.now()}`;
  const now = new Date().toISOString();

  // Check if late based on topic due date (or round due date as fallback)
  const topics = getSubmissionTopics();
  const topic = topics.find(t => t.id === submissionData.topicId);
  const isLate = topic?.dueDate ? new Date(now) > new Date(topic.dueDate) : false;

  // Sub-tasks tracking
  const topicSubTasks = topic?.subTasks || [];
  const assignedSubTasks = new Set(initialFiles.map(f => f.subTaskId).filter(Boolean));
  const subTasksCount = topicSubTasks.length > 0 ? {
    total: topicSubTasks.length,
    completed: assignedSubTasks.size,
    passed: 0
  } : undefined;

  const newSubmission: Submission = {
    ...submissionData,
    id: newId,
    topicTitle: submissionData.topicTitle || topic?.title || 'ผลงานครู',
    status: 'submitted',
    currentVersionNumber: 1,
    isLate,
    submittedAt: now,
    updatedAt: now,
    subTasksCount
  };

  submissions.unshift(newSubmission);
  setItem(STORAGE_KEYS.SUBMISSIONS, submissions);

  // Save Version 1
  const allVersions = getItem<Record<string, SubmissionVersion[]>>(STORAGE_KEYS.VERSIONS, initialVersions);
  const folderName = newSubmission.topicTitle || topic?.title || 'ผลงานครู';
  const folderPath = `Google Drive / ${folderName} /`;

  const newVersion: SubmissionVersion = {
    id: `ver-${newId}-v1`,
    submissionId: newId,
    versionNumber: 1,
    note,
    submittedAt: now,
    statusSnapshot: 'submitted',
    files: initialFiles.map((f, i) => ({
      id: `file-${Date.now()}-${i}`,
      fileName: f.fileName,
      fileSizeBytes: f.fileSizeBytes,
      mimeType: f.mimeType,
      driveFileId: f.driveFileId,
      driveUrl: f.driveUrl,
      previewUrl: f.previewUrl || f.driveUrl,
      downloadUrl: f.downloadUrl || f.driveUrl || '#',
      folderName,
      folderPath,
      subTaskId: f.subTaskId,
      subTaskTitle: f.subTaskTitle,
      uploadedAt: now,
    })),
    externalLinks,
  };

  allVersions[newId] = [newVersion];
  setItem(STORAGE_KEYS.VERSIONS, allVersions);

  // Notify Admins
  const users = getUsers();
  const admins = users.filter(u => u.role === 'admin');
  admins.forEach(adm => {
    addNotification({
      recipientUid: adm.uid,
      title: 'มีงานส่งเข้ามาใหม่รอการตรวจ',
      message: `${actor.displayName} ส่งงาน: ${newSubmission.title}`,
      type: 'submission',
      link: `/submissions/${newId}`
    });
  });

  // Sync to Cloud Firestore
  try {
    setDoc(doc(db, 'submissions', newId), newSubmission, { merge: true }).catch(err => {
      console.warn('Failed to save submission to Firestore:', err);
    });
    setDoc(doc(db, 'versions', newVersion.id), newVersion, { merge: true }).catch(() => {});
  } catch (e) {
    console.warn('Firestore submission save error:', e);
  }

  logActivity('SUBMIT_WORK', 'Submission', newId, actor, {
    title: newSubmission.title,
    versionNumber: 1,
    filesCount: initialFiles.length,
    isLate
  });

  notifyDataChanged('SUBMISSION_CREATED');

  return newSubmission;
}

export function addSubmissionVersion(
  submissionId: string,
  files: Array<{ fileName: string; fileSizeBytes: number; mimeType: string; previewUrl?: string; downloadUrl?: string; driveFileId?: string; driveUrl?: string; subTaskId?: string; subTaskTitle?: string }>,
  note: string,
  externalLinks: string[],
  actor: User
): Submission | null {
  const submissions = getSubmissions();
  const subIndex = submissions.findIndex(s => s.id === submissionId);
  if (subIndex === -1) return null;

  const currentSub = submissions[subIndex];
  const newVersionNumber = currentSub.currentVersionNumber + 1;
  const now = new Date().toISOString();

  submissions[subIndex] = {
    ...currentSub,
    status: 'submitted',
    currentVersionNumber: newVersionNumber,
    updatedAt: now,
  };
  setItem(STORAGE_KEYS.SUBMISSIONS, submissions);

  const allVersions = getItem<Record<string, SubmissionVersion[]>>(STORAGE_KEYS.VERSIONS, initialVersions);
  const subVersions = allVersions[submissionId] || [];
  const folderName = currentSub.topicTitle || 'ผลงานครู';
  const folderPath = `Google Drive / ${folderName} /`;

  const newVersion: SubmissionVersion = {
    id: `ver-${submissionId}-v${newVersionNumber}`,
    submissionId,
    versionNumber: newVersionNumber,
    note,
    submittedAt: now,
    statusSnapshot: 'submitted',
    files: files.map((f, i) => ({
      id: `file-${Date.now()}-${i}`,
      fileName: f.fileName,
      fileSizeBytes: f.fileSizeBytes,
      mimeType: f.mimeType,
      driveFileId: f.driveFileId,
      driveUrl: f.driveUrl,
      previewUrl: f.previewUrl || f.driveUrl,
      downloadUrl: f.downloadUrl || f.driveUrl || '#',
      folderName,
      folderPath,
      subTaskId: f.subTaskId,
      subTaskTitle: f.subTaskTitle,
      uploadedAt: now,
    })),
    externalLinks,
  };

  subVersions.unshift(newVersion);
  allVersions[submissionId] = subVersions;
  setItem(STORAGE_KEYS.VERSIONS, allVersions);

  // Notify Admins
  const users = getUsers();
  const admins = users.filter(u => u.role === 'admin');
  admins.forEach(adm => {
    addNotification({
      recipientUid: adm.uid,
      title: 'งานได้รับการแก้ไขและส่งเวอร์ชันใหม่',
      message: `${actor.displayName} ส่งเวอร์ชัน ${newVersionNumber} สำหรับงาน: ${currentSub.title}`,
      type: 'submission',
      link: `/submissions/${submissionId}`
    });
  });

  // Sync to Cloud Firestore
  try {
    setDoc(doc(db, 'submissions', submissionId), submissions[subIndex], { merge: true }).catch(() => {});
    setDoc(doc(db, 'versions', newVersion.id), newVersion, { merge: true }).catch(() => {});
  } catch (e) {}

  logActivity('SUBMIT_NEW_VERSION', 'Submission', submissionId, actor, {
    versionNumber: newVersionNumber,
    filesCount: files.length,
  });

  notifyDataChanged('VERSION_SUBMITTED');

  return submissions[subIndex];
}

// Reviews by Admin (No scores, just decision and feedback)
export function getReviewsBySubmissionId(submissionId: string): ReviewRecord[] {
  const allReviews = getItem<Record<string, ReviewRecord[]>>(STORAGE_KEYS.REVIEWS, initialReviews);
  return allReviews[submissionId] || [];
}

export function submitAdminReview(
  submissionId: string,
  decision: 'passed' | 'revision_required' | 'rejected',
  comments: string,
  recommendations: string,
  actor: User,
  subTaskReviews?: Record<string, {
    subTaskId: string;
    subTaskTitle: string;
    decision: 'passed' | 'revision_required';
    feedback?: string;
  }>
): ReviewRecord | null {
  const submissions = getSubmissions();
  const subIndex = submissions.findIndex(s => s.id === submissionId);
  if (subIndex === -1) return null;

  const now = new Date().toISOString();
  const newReview: ReviewRecord = {
    id: `rev-${Date.now()}`,
    submissionId,
    versionNumber: submissions[subIndex].currentVersionNumber,
    reviewerUid: actor.uid,
    reviewerName: actor.displayName,
    decision,
    comments,
    recommendations,
    reviewedAt: now,
    subTaskReviews,
  };

  const allReviews = getItem<Record<string, ReviewRecord[]>>(STORAGE_KEYS.REVIEWS, initialReviews);
  const reviews = allReviews[submissionId] || [];
  reviews.unshift(newReview);
  allReviews[submissionId] = reviews;
  setItem(STORAGE_KEYS.REVIEWS, allReviews);

  // Update submission status and sub-tasks count
  if (subTaskReviews) {
    const total = Object.keys(subTaskReviews).length;
    const passed = Object.values(subTaskReviews).filter(r => r.decision === 'passed').length;
    submissions[subIndex].subTasksCount = {
      total,
      completed: total,
      passed,
    };
  } else if (decision === 'passed') {
    const topics = getSubmissionTopics();
    const topic = topics.find(t => t.id === submissions[subIndex].topicId);
    if (topic?.subTasks && topic.subTasks.length > 0) {
      const autoSubReviews: Record<string, {
        subTaskId: string;
        subTaskTitle: string;
        decision: 'passed' | 'revision_required';
        feedback?: string;
      }> = {};
      topic.subTasks.forEach(st => {
        autoSubReviews[st.id] = {
          subTaskId: st.id,
          subTaskTitle: st.title,
          decision: 'passed',
          feedback: 'อนุมัติผ่านเรียบร้อย'
        };
      });
      newReview.subTaskReviews = autoSubReviews;
      submissions[subIndex].subTasksCount = {
        total: topic.subTasks.length,
        completed: topic.subTasks.length,
        passed: topic.subTasks.length,
      };
    }
  }

  submissions[subIndex].status = decision;
  submissions[subIndex].latestReviewDecision = decision;
  submissions[subIndex].updatedAt = now;
  setItem(STORAGE_KEYS.SUBMISSIONS, submissions);

  // Notify teacher
  const teacherUid = submissions[subIndex].teacherUid;
  const decisionText = 
    decision === 'passed' ? 'ได้รับการอนุมัติผ่านเรียบร้อยแล้ว' :
    decision === 'revision_required' ? 'มีข้อเสนอแนะให้ส่งแก้ไขใหม่' : 'ไม่ผ่านการอนุมัติ';

  addNotification({
    recipientUid: teacherUid,
    title: `ผลการตรวจงาน: ${decisionText}`,
    message: `แอดมินได้ตรวจงาน "${submissions[subIndex].title}" เรียบร้อยแล้ว`,
    type: 'review',
    link: `/submissions/${submissionId}`
  });

  // Sync to Cloud Firestore
  try {
    setDoc(doc(db, 'submissions', submissionId), submissions[subIndex], { merge: true }).catch(() => {});
    setDoc(doc(db, 'reviews', newReview.id), newReview, { merge: true }).catch(() => {});
  } catch (e) {}

  logActivity('SUBMIT_REVIEW', 'ReviewRecord', newReview.id, actor, {
    submissionId,
    decision,
  });

  notifyDataChanged('REVIEW_SUBMITTED');

  return newReview;
}

// Submission Types
export function getSubmissionTypes(): SubmissionType[] {
  return getItem<SubmissionType[]>(STORAGE_KEYS.SUBMISSION_TYPES, initialSubmissionTypes);
}

export function saveSubmissionType(item: SubmissionType, actor: User): SubmissionType {
  const list = getSubmissionTypes();
  const idx = list.findIndex(i => i.id === item.id);
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.push(item);
  }
  setItem(STORAGE_KEYS.SUBMISSION_TYPES, list);
  logActivity('SAVE_SUBMISSION_TYPE', 'SubmissionType', item.id, actor, { name: item.name });
  return item;
}

// Submission Topics (หัวข้อเรื่องที่แอดมินสร้างขึ้นเพื่อให้ครูส่งตามกำหนด)
export function getSubmissionTopics(): SubmissionTopic[] {
  return getItem<SubmissionTopic[]>(STORAGE_KEYS.TOPICS, initialSubmissionTopics);
}

export function getSubmissionTopicById(id: string): SubmissionTopic | undefined {
  return getSubmissionTopics().find(t => t.id === id);
}

export function saveSubmissionTopic(item: SubmissionTopic, actor: User): SubmissionTopic {
  const list = getSubmissionTopics();
  const idx = list.findIndex(i => i.id === item.id);
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.unshift(item);
  }
  setItem(STORAGE_KEYS.TOPICS, list);

  // Sync to Cloud Firestore so topics are instantly accessible across all computers and devices
  try {
    setDoc(doc(db, 'topics', item.id), item, { merge: true }).catch(err => {
      console.warn('Failed to save topic to Firestore:', err);
    });
  } catch (e) {
    console.warn('Firestore topic save error:', e);
  }

  logActivity('SAVE_SUBMISSION_TOPIC', 'SubmissionTopic', item.id, actor, { title: item.title, dueDate: item.dueDate });
  notifyDataChanged('TOPIC_SAVED');
  return item;
}

export function deleteSubmissionTopic(id: string, actor: User): boolean {
  let list = getSubmissionTopics();
  list = list.filter(i => i.id !== id);
  setItem(STORAGE_KEYS.TOPICS, list);

  // Delete from Cloud Firestore
  try {
    deleteDoc(doc(db, 'topics', id)).catch(err => {
      console.warn('Failed to delete topic from Firestore:', err);
    });
  } catch (e) {
    console.warn('Firestore topic delete error:', e);
  }

  logActivity('DELETE_SUBMISSION_TOPIC', 'SubmissionTopic', id, actor);
  notifyDataChanged('TOPIC_DELETED');
  return true;
}

// Rounds
export function getSubmissionRounds(): SubmissionRound[] {
  return getItem<SubmissionRound[]>(STORAGE_KEYS.SUBMISSION_ROUNDS, initialSubmissionRounds);
}

export function saveSubmissionRound(item: SubmissionRound, actor: User): SubmissionRound {
  const list = getSubmissionRounds();
  const idx = list.findIndex(i => i.id === item.id);
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.push(item);
  }
  setItem(STORAGE_KEYS.SUBMISSION_ROUNDS, list);
  logActivity('SAVE_SUBMISSION_ROUND', 'SubmissionRound', item.id, actor, { title: item.title });
  return item;
}

// Central Library
export function getLibraryCategories(): LibraryCategory[] {
  return getItem<LibraryCategory[]>(STORAGE_KEYS.LIBRARY_CATS, initialLibraryCategories);
}

export function saveLibraryCategories(categories: LibraryCategory[]): void {
  setItem(STORAGE_KEYS.LIBRARY_CATS, categories);
  window.dispatchEvent(new CustomEvent('sent_work_data_changed', { detail: { action: 'UPDATE_LIBRARY_CATEGORIES' } }));
}

export function updateLibraryCategoryName(id: string, newName: string, actor?: User): LibraryCategory[] {
  const cats = getLibraryCategories();
  const cat = cats.find(c => c.id === id);
  if (cat) {
    cat.name = newName.trim();
    setItem(STORAGE_KEYS.LIBRARY_CATS, cats);
    if (actor) {
      logActivity('UPDATE_LIBRARY_CATEGORY', 'LibraryCategory', id, actor, { newName: cat.name });
    }
    try {
      setDoc(doc(db, 'libraryCategories', id), cat, { merge: true }).catch(() => {});
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('sent_work_data_changed', { detail: { action: 'UPDATE_LIBRARY_CATEGORY', categoryId: id } }));
  }
  return cats;
}

export function addLibraryCategory(name: string, description: string = '', actor?: User): LibraryCategory {
  const cats = getLibraryCategories();
  const newCat: LibraryCategory = {
    id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    description: description.trim(),
    allowedRoles: ['teacher', 'admin']
  };
  cats.push(newCat);
  setItem(STORAGE_KEYS.LIBRARY_CATS, cats);
  if (actor) {
    logActivity('CREATE_LIBRARY_CATEGORY', 'LibraryCategory', newCat.id, actor, { name: newCat.name });
  }
  try {
    setDoc(doc(db, 'libraryCategories', newCat.id), newCat, { merge: true }).catch(() => {});
  } catch (e) {}
  window.dispatchEvent(new CustomEvent('sent_work_data_changed', { detail: { action: 'CREATE_LIBRARY_CATEGORY', categoryId: newCat.id } }));
  return newCat;
}

export function deleteLibraryCategory(id: string, actor?: User): boolean {
  let cats = getLibraryCategories();
  cats = cats.filter(c => c.id !== id);
  setItem(STORAGE_KEYS.LIBRARY_CATS, cats);
  if (actor) {
    logActivity('DELETE_LIBRARY_CATEGORY', 'LibraryCategory', id, actor);
  }
  try {
    deleteDoc(doc(db, 'libraryCategories', id)).catch(() => {});
  } catch (e) {}
  window.dispatchEvent(new CustomEvent('sent_work_data_changed', { detail: { action: 'DELETE_LIBRARY_CATEGORY', categoryId: id } }));
  return true;
}

export function getLibraryFiles(): LibraryFile[] {
  return getItem<LibraryFile[]>(STORAGE_KEYS.LIBRARY_FILES, initialLibraryFiles);
}

export function addLibraryFile(file: Omit<LibraryFile, 'id' | 'uploadedAt' | 'downloadsCount'>, actor: User): LibraryFile {
  const list = getLibraryFiles();
  const newFile: LibraryFile = {
    ...file,
    id: `lib-${Date.now()}`,
    uploadedAt: new Date().toISOString(),
    downloadsCount: 0,
  };
  list.unshift(newFile);
  setItem(STORAGE_KEYS.LIBRARY_FILES, list);
  try {
    setDoc(doc(db, 'libraryFiles', newFile.id), newFile, { merge: true }).catch(() => {});
  } catch (e) {}
  logActivity('UPLOAD_LIBRARY_FILE', 'LibraryFile', newFile.id, actor, { title: newFile.title });
  window.dispatchEvent(new CustomEvent('sent_work_data_changed', { detail: { action: 'UPLOAD_LIBRARY_FILE', fileId: newFile.id } }));
  return newFile;
}

export function deleteLibraryFile(id: string, actor: User): boolean {
  let list = getLibraryFiles();
  list = list.filter(f => f.id !== id);
  setItem(STORAGE_KEYS.LIBRARY_FILES, list);
  try {
    deleteDoc(doc(db, 'libraryFiles', id)).catch(() => {});
  } catch (e) {}
  logActivity('DELETE_LIBRARY_FILE', 'LibraryFile', id, actor);
  window.dispatchEvent(new CustomEvent('sent_work_data_changed', { detail: { action: 'DELETE_LIBRARY_FILE', fileId: id } }));
  return true;
}

// Notifications
export function getNotifications(recipientUid: string): AppNotification[] {
  const list = getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  return list.filter(n => n.recipientUid === recipientUid);
}

export function addNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification {
  const list = getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  const newNotification: AppNotification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  list.unshift(newNotification);
  setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  return newNotification;
}

export function markNotificationAsRead(id: string): void {
  const list = getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  const item = list.find(n => n.id === id);
  if (item) {
    item.read = true;
    setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  }
}

export function markAllNotificationsAsRead(recipientUid: string): void {
  const list = getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  list.forEach(n => {
    if (n.recipientUid === recipientUid) {
      n.read = true;
    }
  });
  setItem(STORAGE_KEYS.NOTIFICATIONS, list);
}

// Activity Logs
export function getActivityLogs(): ActivityLog[] {
  return getItem<ActivityLog[]>(STORAGE_KEYS.LOGS, initialActivityLogs);
}

export function logActivity(
  action: string,
  entityType: string,
  entityId: string | undefined,
  actor: User,
  details?: Record<string, any>
): ActivityLog {
  const logs = getActivityLogs();
  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    actorUid: actor.uid,
    actorName: actor.displayName,
    actorRole: actor.role,
    action,
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
    details,
  };
  logs.unshift(newLog);
  setItem(STORAGE_KEYS.LOGS, logs);
  return newLog;
}

// Current User Session
export function getStoredCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw || raw === 'null' || raw === 'undefined') return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredCurrentUser(user: User | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Error saving current user to localStorage', err);
  }
}

// Dashboard Tracking Matrix Helper (ใครส่งอะไร / ยังไม่ได้ส่ง)
export interface TeacherSubmissionStatus {
  teacher: User;
  submittedWorks: Submission[];
  hasSubmitted: boolean;
  status: 'passed' | 'revision_required' | 'submitted' | 'not_submitted';
}

export function getTeacherSubmissionMatrix(topicId?: string): TeacherSubmissionStatus[] {
  const teachers = getUsers().filter(u => u.role === 'teacher' && u.status === 'active');
  const allSubmissions = getSubmissions();

  return teachers.map(teacher => {
    const works = allSubmissions.filter(s => {
      const matchTeacher = s.teacherUid === teacher.uid;
      const matchTopic = topicId && topicId !== 'all' ? (s.topicId === topicId || s.roundId === topicId) : true;
      return matchTeacher && matchTopic;
    });

    const hasSubmitted = works.length > 0;
    let status: 'passed' | 'revision_required' | 'submitted' | 'not_submitted' = 'not_submitted';

    if (hasSubmitted) {
      if (works.some(w => w.status === 'revision_required')) {
        status = 'revision_required';
      } else if (works.every(w => w.status === 'passed')) {
        status = 'passed';
      } else {
        status = 'submitted';
      }
    }

    return {
      teacher,
      submittedWorks: works,
      hasSubmitted,
      status
    };
  });
}

// Multi-Topic Cross-Matrix Grid (ตารางแนวตั้งเรียงทุกหัวข้อเรื่อง เผื่องานต่างๆ ถัดไป)
export interface MatrixCellStatus {
  topicId: string;
  topicTitle: string;
  category: string;
  hasSubmitted: boolean;
  status: 'passed' | 'revision_required' | 'submitted' | 'not_submitted';
  submission?: Submission;
  isLate?: boolean;
  subTasks?: TopicSubTask[];
  subTasksCount?: { total: number; completed: number; passed: number };
  latestFiles?: SubmissionFile[];
  subTaskFilesMap?: Record<string, SubmissionFile[]>;
  is100PercentSubTasks?: boolean;
  subTasksCompletionRate?: number;
}

export interface TeacherMatrixRow {
  teacher: User;
  cells: Record<string, MatrixCellStatus>;
  submittedCount: number;
  totalTopics: number;
  completionRate: number;
}

export interface FullSubmissionMatrix {
  topics: SubmissionTopic[];
  rows: TeacherMatrixRow[];
  totalTeachers: number;
  topicStats: Record<string, { submittedCount: number; passedCount: number; completionRate: number }>;
}

export function getFullSubmissionMatrix(): FullSubmissionMatrix {
  const teachers = getUsers().filter(u => u.role === 'teacher' && u.status === 'active');
  const topics = getSubmissionTopics();
  const allSubmissions = getSubmissions();
  const allReviews = getItem<Record<string, ReviewRecord[]>>(STORAGE_KEYS.REVIEWS, initialReviews);
  const allVersions = getItem<Record<string, SubmissionVersion[]>>(STORAGE_KEYS.VERSIONS, initialVersions);

  const rows: TeacherMatrixRow[] = teachers.map(teacher => {
    const cells: Record<string, MatrixCellStatus> = {};
    let submittedCount = 0;

    topics.forEach(topic => {
      const sub = allSubmissions.find(s => s.teacherUid === teacher.uid && (s.topicId === topic.id || s.roundId === topic.id));
      const subTasks = topic.subTasks || [];

      if (sub) {
        submittedCount++;
        const reviews = allReviews[sub.id] || [];
        const latestReview = reviews[0];
        const versions = allVersions[sub.id] || [];
        const latestVersion = versions[0];
        const latestFiles = latestVersion?.files || [];

        // Build mapping: subTaskId -> SubmissionFile[]
        const subTaskFilesMap: Record<string, SubmissionFile[]> = {};
        latestFiles.forEach(f => {
          if (f.subTaskId) {
            if (!subTaskFilesMap[f.subTaskId]) subTaskFilesMap[f.subTaskId] = [];
            subTaskFilesMap[f.subTaskId].push(f);
          }
        });

        // Count completed subtasks
        let completedSubTasks = 0;
        if (subTasks.length > 0) {
          subTasks.forEach(st => {
            if (subTaskFilesMap[st.id] && subTaskFilesMap[st.id].length > 0) {
              completedSubTasks++;
            }
          });
          // Fallback if files were not explicitly tagged in older versions
          if (completedSubTasks === 0 && sub.subTasksCount?.completed) {
            completedSubTasks = Math.min(sub.subTasksCount.completed, subTasks.length);
          }
        }

        const passedCount = latestReview?.subTaskReviews
          ? Object.values(latestReview.subTaskReviews).filter(r => r.decision === 'passed').length
          : sub.status === 'passed' ? subTasks.length : 0;

        const is100PercentSubTasks = subTasks.length > 0 ? completedSubTasks >= subTasks.length : true;
        const subTasksCompletionRate = subTasks.length > 0 ? Math.round((completedSubTasks / subTasks.length) * 100) : 100;

        cells[topic.id] = {
          topicId: topic.id,
          topicTitle: topic.title,
          category: topic.category,
          hasSubmitted: true,
          status: sub.status === 'passed' ? 'passed' : sub.status === 'revision_required' ? 'revision_required' : 'submitted',
          submission: sub,
          isLate: sub.isLate,
          subTasks,
          subTasksCount: subTasks.length > 0 ? {
            total: subTasks.length,
            completed: completedSubTasks,
            passed: passedCount
          } : undefined,
          latestFiles,
          subTaskFilesMap,
          is100PercentSubTasks,
          subTasksCompletionRate
        };
      } else {
        cells[topic.id] = {
          topicId: topic.id,
          topicTitle: topic.title,
          category: topic.category,
          hasSubmitted: false,
          status: 'not_submitted',
          subTasks,
          subTasksCount: subTasks.length > 0 ? {
            total: subTasks.length,
            completed: 0,
            passed: 0
          } : undefined,
          latestFiles: [],
          subTaskFilesMap: {},
          is100PercentSubTasks: false,
          subTasksCompletionRate: 0
        };
      }
    });

    const completionRate = topics.length > 0 ? Math.round((submittedCount / topics.length) * 100) : 0;

    return {
      teacher,
      cells,
      submittedCount,
      totalTopics: topics.length,
      completionRate
    };
  });

  const topicStats: Record<string, { submittedCount: number; passedCount: number; completionRate: number }> = {};
  topics.forEach(topic => {
    const subs = allSubmissions.filter(s => s.topicId === topic.id || s.roundId === topic.id);
    const submittedCount = new Set(subs.map(s => s.teacherUid)).size;
    const passedCount = subs.filter(s => s.status === 'passed').length;
    const completionRate = teachers.length > 0 ? Math.round((submittedCount / teachers.length) * 100) : 0;
    topicStats[topic.id] = { submittedCount, passedCount, completionRate };
  });

  return {
    topics,
    rows,
    totalTeachers: teachers.length,
    topicStats
  };
}

export interface TopicFolderFileItem {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  previewUrl?: string;
  downloadUrl?: string;
  driveFileId?: string;
  driveUrl?: string;
  folderName: string;
  folderPath: string;
  subTaskId?: string;
  subTaskTitle?: string;
  uploadedAt: string;
  submissionId: string;
  submissionTitle: string;
  teacherName: string;
  teacherUid: string;
  teacherDepartment?: string;
  status: SubmissionStatus;
  versionNumber: number;
}

export interface TopicFolderItem {
  topicId: string;
  topicTitle: string;
  category: string;
  description?: string;
  dueDate: string;
  totalFiles: number;
  totalSubmissions: number;
  files: TopicFolderFileItem[];
}

export function getSubmissionFilesGroupedByTopic(): TopicFolderItem[] {
  const topics = getSubmissionTopics();
  const submissions = getSubmissions();
  const versions = getItem<Record<string, SubmissionVersion[]>>(STORAGE_KEYS.VERSIONS, initialVersions);

  return topics.map(topic => {
    const topicSubmissions = submissions.filter(s => s.topicId === topic.id || s.roundId === topic.id);
    const filesInTopic: TopicFolderFileItem[] = [];

    topicSubmissions.forEach(sub => {
      const subVers = versions[sub.id] || [];
      const latestVer = subVers[0] || subVers[subVers.length - 1];
      if (latestVer && latestVer.files) {
        latestVer.files.forEach(f => {
          filesInTopic.push({
            id: f.id,
            fileName: f.fileName,
            fileSizeBytes: f.fileSizeBytes,
            mimeType: f.mimeType,
            previewUrl: f.previewUrl,
            downloadUrl: f.downloadUrl,
            driveFileId: f.driveFileId,
            driveUrl: f.driveUrl || (f.driveFileId ? `https://drive.google.com/file/d/${f.driveFileId}/view` : `https://drive.google.com/drive/folders/1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd`),
            folderName: f.folderName || topic.title,
            folderPath: f.folderPath || `Google Drive / ${topic.title} /`,
            subTaskId: f.subTaskId,
            subTaskTitle: f.subTaskTitle,
            uploadedAt: f.uploadedAt || sub.submittedAt,
            submissionId: sub.id,
            submissionTitle: sub.title,
            teacherName: sub.teacherName,
            teacherUid: sub.teacherUid,
            teacherDepartment: sub.teacherDepartment,
            status: sub.status,
            versionNumber: latestVer.versionNumber
          });
        });
      }
    });

    return {
      topicId: topic.id,
      topicTitle: topic.title,
      category: topic.category,
      description: topic.description,
      dueDate: topic.dueDate,
      totalFiles: filesInTopic.length,
      totalSubmissions: topicSubmissions.length,
      files: filesInTopic
    };
  });
}

