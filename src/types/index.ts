export type UserRole = 'teacher' | 'admin';
export type AccountStatus = 'pending_email_verification' | 'active' | 'disabled' | 'archived';

export interface User {
  uid: string;
  username?: string;
  usernameNormalized?: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  displayName: string;
  role: UserRole;
  status: AccountStatus;
  learningAreaIds: string[];
  learningAreaName?: string;
  subjects: Array<{ id?: string; name: string; code?: string }>;
  gradeLevels: string[];
  phone?: string;
  photo: { type: 'drive' | 'url'; fileId?: string; url?: string } | null;
  authProvider: 'google' | 'password' | 'mixed';
  password?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

// งานย่อยในแต่ละหัวข้อเรื่อง เช่น 1. แผนการสอน 2. กำหนดการสอน 3. แบบวัดประเมินผล
export interface TopicSubTask {
  id: string;
  title: string;                 // ชื่อรายการงานย่อย
  description?: string;          // คำอธิบายงานย่อย
  isRequired: boolean;           // จำเป็นต้องส่งหรือไม่
}

// หัวข้อเรื่องที่แอดมินสร้างขึ้น เพื่อให้ครูส่งตามกำหนด
export interface SubmissionTopic {
  id: string;
  title: string;                 // ชื่อหัวข้อเรื่อง เช่น "ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569"
  category: string;              // ประเภทงาน เช่น แผนการสอน, วิจัย, สื่อการสอน, งานธุรการ/ปพ., รายงานโครงการ, PA
  description: string;          // คำชี้แจง/คำสั่งจากแอดมิน
  academicYear: string;         // ปีการศึกษา เช่น "2569"
  semester: string;             // ภาคเรียน เช่น "1"
  dueDate: string;              // วันที่และเวลาครบกำหนดส่ง (Deadline)
  allowedFileExtensions: string[]; // e.g. ['.pdf', '.docx', '.jpg']
  maxFiles: number;             // จำนวนไฟล์สูงสุด
  allowExternalLinks: boolean;  // อนุญาตให้แนบลิงก์ภายนอกหรือไม่
  isActive: boolean;            // เปิดรับส่งงานอยู่หรือไม่
  createdAt: string;
  createdBy: string;            // Admin name
  subTasks?: TopicSubTask[];    // รายการงานย่อยที่แอดมินกำหนด
}

export type SubmissionStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'passed'
  | 'rejected'
  | 'revision_required'
  | 'not_submitted';

export interface SubmissionFile {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  driveFileId?: string;
  driveUrl?: string;
  downloadUrl?: string;
  previewUrl?: string;
  folderName?: string;       // ชื่องาน / โฟลเดอร์ที่เก็บไฟล์
  folderPath?: string;       // เส้นทางโฟลเดอร์ Google Drive
  subTaskId?: string;        // รหัสงานย่อยที่ไฟล์นี้ผูกอยู่ (ถ้ามี)
  subTaskTitle?: string;     // ชื่องานย่อย
  uploadedAt: string;
}

export interface SubmissionVersion {
  id: string;
  submissionId: string;
  versionNumber: number;
  note?: string;
  submittedAt: string;
  files: SubmissionFile[];
  externalLinks: string[];
  statusSnapshot: SubmissionStatus;
  subTaskFiles?: Record<string, string[]>; // subTaskId -> array of fileIds
}

export interface SubmissionType {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  active: boolean;
  allowedFileExtensions?: string[];
  maxFilesPerVersion?: number;
  allowExternalLinks?: boolean;
  sortOrder?: number;
  maxFileSizeBytes?: number;
  allowResubmitAfterRejected?: boolean;
  metadataFields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'select' | 'date';
    required: boolean;
    options?: string[];
  }>;
}

export interface SubmissionRound {
  id: string;
  title: string;
  academicYear: string;
  semester: string;
  dueAt: string;
  isActive: boolean;
  description?: string;
  submissionTypeIds?: string[];
  acceptLate?: boolean;
  targetMode?: string;
}

export interface Submission {
  id: string;
  topicId: string;              // ผูกกับหัวข้อเรื่องที่แอดมินสร้าง
  topicTitle?: string;
  roundId?: string;
  submissionTypeId?: string;
  teacherUid: string;
  teacherName: string;
  teacherEmail: string;
  teacherDepartment?: string;
  title: string;                // ชื่องานของครู
  status: SubmissionStatus;
  currentVersionNumber: number;
  isLate: boolean;              // ส่งหลังกำหนดหรือไม่
  submittedAt: string;
  updatedAt: string;
  latestReviewDecision?: 'passed' | 'rejected' | 'revision_required';
  metadata?: Record<string, any>;
  subTasksCount?: { total: number; completed: number; passed: number };
}

export interface ReviewRecord {
  id: string;
  submissionId: string;
  versionNumber: number;
  reviewerUid: string;
  reviewerName: string; // Admin who checked
  decision: 'passed' | 'rejected' | 'revision_required';
  comments: string;
  recommendations?: string;
  reviewedAt: string;
  subTaskReviews?: Record<string, {
    subTaskId: string;
    subTaskTitle: string;
    decision: 'passed' | 'revision_required';
    feedback?: string;
  }>;
}

export interface LibraryCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  allowedRoles: UserRole[];
}

export interface LibraryFile {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
  driveFileId?: string;
  downloadUrl: string;
  uploadedByName: string;
  uploadedAt: string;
  allowedRoles: UserRole[];
  downloadsCount: number;
}

export interface AppNotification {
  id: string;
  recipientUid: string;
  title: string;
  message: string;
  type: 'submission' | 'review' | 'announcement' | 'system';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface ActivityLog {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  timestamp: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export interface SystemSettings {
  systemName: string;
  schoolName: string;
  logoUrl?: string;
  academicYear: string;
  semester: string;
  footerText: string;
  welcomeText: string;
  timezone: string;
  googleDriveRootFolderId: string;
  googleSheetReportId: string;
  googleAppsScriptWebhookUrl?: string;
  lineNotifyEnabled: boolean;
}
