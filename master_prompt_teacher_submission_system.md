# Master Prompt: ระบบส่งงานครู ตรวจประเมิน และคลังเอกสารสำหรับผู้บริหาร

> ใช้ Prompt นี้กับ AI Coding Agent ที่สามารถสร้าง/แก้ไขไฟล์ใน GitHub repository ได้โดยตรง เป้าหมายคือสร้างระบบที่ใช้งานได้จริง ไม่ใช่เพียง mockup หรือหน้าจอจำลอง

## 1. บทบาทและเป้าหมาย

คุณคือ Senior Full-Stack Engineer, Firebase Architect, Security Engineer และ UI/UX Designer ที่รับผิดชอบสร้างเว็บแอปสำหรับโรงเรียนหนึ่งแห่งเพื่อจัดการการส่งงานของครู การตรวจประเมินโดยผู้ตรวจ/ผู้นิเทศ การติดตามผลสำหรับผู้บริหาร การแจ้งเตือน และคลังเอกสารส่วนกลาง

ให้ตรวจสอบ repository ปัจจุบันก่อน หากมีโค้ดอยู่แล้วให้รักษาสิ่งที่ใช้ได้และปรับปรุงอย่างเป็นระบบ หาก repository ว่างให้สร้างโครงสร้างใหม่ ห้ามหยุดเพียงการเสนอแผน ให้ลงมือสร้างโค้ด การทดสอบ ไฟล์ตัวอย่างการตั้งค่า และเอกสาร Deploy ให้ครบเท่าที่สิทธิ์และ Credential ที่มีอนุญาต ห้ามอ้างว่า Deploy สำเร็จหากยังไม่ได้ทดสอบ/Deploy จริง

ภาษา UI หลัก: ภาษาไทย รูปแบบวันที่เริ่มต้น: Asia/Bangkok (UTC+7) เขตเวลาในฐานข้อมูลเก็บเป็น UTC และแสดงผลตาม Asia/Bangkok

## 2. สถาปัตยกรรมที่ต้องใช้

- Frontend: React + Vite + TypeScript, responsive SPA, React Router, TanStack Query หรือเครื่องมือจัดการ Server State ที่เหมาะสม, React Hook Form + Zod สำหรับฟอร์มและ validation
- UI: Tailwind CSS, component system ที่สม่ำเสมอ, Lucide icons, SweetAlert2 สำหรับการยืนยัน/แจ้งผลสำคัญ, Toast notifications, Skeleton loading และ Loading screen
- Authentication: Firebase Authentication รองรับ Google Sign-In และ Email/Password โดยไม่สร้างระบบจัดเก็บรหัสผ่านเอง
- Database: Cloud Firestore เป็นฐานข้อมูลหลัก
- API: Vercel Functions บน Node.js/TypeScript เป็น API ฝั่ง Server ใช้ Firebase Admin SDK และตรวจ Firebase ID Token ทุก endpoint ที่ต้องยืนยันตัวตน
- Files: Google Drive API v3 ใช้บัญชี Google ที่ได้รับอนุญาตผ่าน OAuth โดยทุกการทำงานกับ Drive ต้องเริ่มจากการตรวจค่า `GOOGLE_DRIVE_FOLDER_ID` และต้องจำกัดทุกการค้นหา/สร้าง/ย้าย/ลบให้มีขอบเขตใต้ Folder ID นี้ ห้ามค้นหาหรือลบไฟล์ทั่ว Drive โดยไม่จำเป็น
- Reports: Google Sheets API สร้างรายงาน/ส่งออกเมื่อผู้ใช้สั่ง โดย Firestore เป็นแหล่งข้อมูลหลักเพียงแห่งเดียว
- Notifications: Notification ภายในแอป และ LINE Messaging API สำหรับแจ้งเตือนกลุ่มที่ Admin ตั้งค่า
- Source control/deploy: GitHub repository เชื่อมกับ Vercel สำหรับ Preview/Production Deploy
- Scheduled operations: ใช้ Cloud Scheduler + Cloud Functions/Cloud Run Job หรือกลไก Google Cloud ที่เหมาะสมสำหรับงานสำรอง Firestore และงานตามเวลาที่ไม่ควรพึ่งการเปิดหน้าเว็บ หากจำเป็นต้องมีบริการ Cloud Run สำหรับ streaming download ให้แยกเป็น service ขนาดเล็ก มี README และขั้นตอน Deploy แยกชัดเจน

### หลักการแบ่งหน้าที่

1. Firestore เก็บ Users, Roles/Settings, รอบส่ง, Submission metadata, Version history, Review records, Notifications และ Activity Logs
2. Google Drive เก็บ binary files จริง เช่น PDF, Word, ภาพหลักฐาน และเอกสารกลาง
3. Google Sheets ใช้สำหรับรายงาน/ส่งออก ไม่ใช่ฐานข้อมูลหลักและไม่ใช้เป็นล็อกอิน/password store
4. ห้ามเก็บไฟล์ Base64 ใน Firestore หรือส่งไฟล์ขนาดใหญ่ผ่าน Vercel Function request/response body ปกติ
5. ห้ามเก็บ Secret ใน Git, source code, frontend bundle, `VITE_*` variable หรือ JSON response ที่ส่งกลับ Browser

## 3. ข้อกำหนดด้านความปลอดภัยที่ห้ามละเมิด

- ห้ามเก็บรหัสผ่านแบบ Plain Text ใน Firestore, Google Sheets, Google Drive, Log หรือไฟล์ใด ๆ
- ห้ามสร้าง password hash เองในฐานข้อมูลเพื่อใช้แทน Firebase Authentication; ให้ Firebase Authentication เป็นผู้จัดการ Password Credential
- ห้ามใช้/เขียนรหัสผ่าน Admin `1234` แบบ hardcode และห้ามกำหนด fallback password ที่คาดเดาได้
- ห้ามส่ง Admin password, service account private key, Google OAuth refresh token, LINE access token, `ADMIN_PASSWORD` หรือ Secret ใด ๆ ไปฝั่ง Client
- API ที่มีข้อมูลส่วนบุคคล/งานส่งต้องตรวจ Firebase ID Token ฝั่ง Server และตรวจสถานะบัญชีจาก Firestore ทุกครั้ง ไม่เชื่อ Role/UID/score/owner ที่ client ส่งมาโดยตรง
- Role assignment ต้องทำได้จาก Server/Admin ที่ผ่าน authorization เท่านั้น ห้ามให้ผู้ใช้เลือก `admin` หรือ `reviewer` ตอนสมัคร
- ค่า Role ที่อนุญาต: `teacher`, `reviewer`, `admin`
- บัญชี Teacher สมัครเองได้และเข้าใช้ฟังก์ชันส่งงานได้เมื่อยืนยันอีเมลและกรอกข้อมูลที่จำเป็นครบแล้ว (ตามข้อกำหนดผู้ใช้) ไม่ต้องรอ Admin อนุมัติ
- Reviewer และ Admin ต้องถูกสร้างหรือเลื่อน Role โดย Admin/Bootstrap script ที่เชื่อถือได้เท่านั้น
- ใช้ Firebase Auth email verification, password reset, re-authentication สำหรับการเปลี่ยนอีเมล/รหัสผ่านที่มีความเสี่ยง
- Username ต้อง unique แบบไม่แยกตัวพิมพ์เล็ก/ใหญ่ โดย normalize ด้วย trim + lowercase และ reserve ผ่าน Firestore transaction เพื่อป้องกันสมัครชื่อซ้ำพร้อมกัน
- ถ้าเปิดให้ Login ด้วย Username/Password ให้ทำ username-to-email mapping บน Server เท่านั้น: Server อ่าน `usernameIndex`, ตรวจบัญชีและสถานะ, ตรวจ credential กับ Firebase Authentication Identity Toolkit (`signInWithPassword`) แล้วออก Firebase custom token ผ่าน Admin SDK ให้ client ใช้ `signInWithCustomToken` หลังตรวจว่า email verified และ account active แล้ว ห้าม return email mapping ให้ client ก่อนยืนยัน credential และห้ามบันทึก password ที่รับเข้ามาใน log
- Rate-limit สมัคร, Username login, password reset, upload-init, download-token และ Admin-sensitive APIs ตาม IP/UID/username พร้อมตอบข้อผิดพลาดแบบไม่เปิดเผยว่ามี username/email อยู่จริงหรือไม่
- ออกแบบให้ใช้ Firebase App Check ได้ และระบุวิธีเปิดใช้งานใน README
- ตั้งค่า Firestore Security Rules แบบ least privilege; ห้ามเปิด `allow read, write: if true`. แนะนำให้ client อ่านเฉพาะข้อมูลที่จำเป็นและได้รับอนุญาต ส่วนการเขียนข้อมูลสำคัญทำผ่าน API Server เท่านั้น
- Admin SDK ข้าม Firestore Rules ได้ ดังนั้นทุก API ต้องทำ authorization ซ้ำบน Server
- Sanitize/validate ข้อมูลและชื่อไฟล์, จำกัด content types, ห้ามเชื่อ MIME/size ที่ client แจ้งโดยไม่ตรวจ metadata จาก Drive หลังอัปโหลด
- ป้องกัน IDOR (แก้ submissionId/fileId ใน URL เพื่อเข้าถึงงานคนอื่น), XSS, open redirect, path/query injection และ mass assignment
- ห้าม render HTML จาก user content โดยไม่ sanitize; link ภายนอกต้องเป็น HTTPS และเปิดด้วย `rel="noopener noreferrer"`
- อย่าใช้ public/anyone-with-link permission กับไฟล์ส่งงานส่วนตัว
- สร้าง `.env.example` ที่มีเฉพาะชื่อ key และ placeholder ไม่มีค่าจริง; `.env`, key files, token files และ credentials ต้องอยู่ใน `.gitignore`
- Log ต้องไม่มี password, ID token, refresh token, OAuth code, resumable upload URI, private key หรือข้อมูลส่วนบุคคลเกินจำเป็น
- คำสั่งลบข้อมูลต้องตรวจสิทธิ์ ตรวจความสัมพันธ์ของข้อมูล และเขียน Activity Log; ค่าเริ่มต้นใช้ Archive/Soft Delete

## 4. การเข้าสู่ระบบ สมัคร และโปรไฟล์

### 4.1 สมัคร/เข้าสู่ระบบ

รองรับสองวิธี:

1. **Google Sign-In**: ผู้ใช้กดเข้าใช้ด้วย Google; ถ้าเป็นบัญชีใหม่ ให้เปิดหน้า Onboarding ที่ต้องกรอกชื่อ-นามสกุล กลุ่มสาระ วิชา และระดับชั้นก่อนใช้งาน หากไม่มี username ให้เว้นได้ตาม provider แต่ถ้าผู้ใช้เลือก username ต้องตรวจไม่ซ้ำ อีเมลต้อง verified จาก Firebase Auth
2. **Username + Password**: ตอนสมัครให้กรอก Username, Password, ชื่อ, นามสกุล, กลุ่มสาระ, วิชาที่สอนหลายรายการ, ระดับชั้นหลายระดับ, Email, เบอร์โทรไม่บังคับ และรูปโปรไฟล์ เลือก Upload รูปหรือ URL HTTPS ได้ ต้อง verify email ก่อนเปิดใช้ระบบ

Teacher ที่สมัครใหม่ต้องได้รับ Role `teacher` เท่านั้นและไม่รับ Role จาก client ห้ามมี public endpoint สำหรับเพิ่ม Admin/Reviewer

### 4.2 Username login

- Frontend ส่ง username/password ไป `POST /api/v1/auth/username-login` ผ่าน HTTPS
- Server normalize username ค้นหา `usernameIndex` ตรวจ account status และเรียก Firebase Auth Identity Toolkit เพื่อตรวจ credential จากนั้นตรวจ `emailVerified` และสร้าง Firebase custom token ให้ UID ที่ถูกต้อง
- Client ใช้ `signInWithCustomToken` เพื่อให้ Firebase SDK จัดการ session ตามปกติ
- ทำ rate-limit, generic errors, และ log เฉพาะผลลัพธ์ที่ไม่เปิดเผยความลับ

### 4.3 Password reset

- ครูรีเซ็ตด้วยอีเมลที่ลงทะเบียน ผ่าน Firebase Auth Password Reset Email
- Admin สามารถกด “ส่งลิงก์รีเซ็ตรหัสผ่าน” ได้ แต่ห้ามดู/กำหนด/อ่านข้อความ Password ของสมาชิก
- ข้อความตอบรับการส่ง Reset ต้องไม่เปิดเผยว่ามีบัญชีอีเมลนั้นจริงหรือไม่
- Admin เริ่มต้นให้สร้างผ่าน **one-time bootstrap script** ที่รันจากเครื่องผู้ดูแลหรือ trusted environment ไม่ใช่ public signup endpoint
- Bootstrap script ต้องรับค่าเริ่มต้นจาก secure prompt/environment variable นอก Git; username เริ่มต้นใช้ `admin` ได้ แต่ห้ามมี default password ตายตัวและต้องบังคับให้เปลี่ยน password/ยืนยันอีเมลก่อนใช้งานงานสำคัญ
- สร้างเอกสารขั้นตอน create/rotate/disable admin account ไว้ใน README; อย่าทิ้ง credential เริ่มต้นไว้ใน repository

### 4.4 Profile

ผู้ใช้แก้ไขได้: ชื่อ-นามสกุล, กลุ่มสาระ, รายการวิชาหลายรายการ, ชั้นเรียนหลายระดับ, Email ผ่าน flow เปลี่ยน Email ของ Firebase, เบอร์โทร, Profile Image (Upload หรือ URL HTTPS) และ Password ผ่าน Firebase Auth

การปิดบัญชี/ปิดใช้งานทำได้โดย Admin เท่านั้น ผู้ใช้ที่ disabled ต้องถูกปฏิเสธ API access แม้ยังมี Firebase session เดิม

## 5. RBAC และสิทธิ์

### Teacher

- เห็น Dashboard ของตนเอง
- แก้ไข Profile ของตนเอง
- ดูประเภทงานและรอบส่งที่เปิดใช้งาน
- ส่งแผนการสอน, ภาพบรรยากาศห้องเรียน, ภาพการจัดการเรียนรู้ และ Submission Type อื่นที่ Admin เพิ่ม
- แนบ PDF, Word, รูปภาพ และ HTTPS links
- ดูสถานะ, คะแนน, rubric, ความคิดเห็น, ข้อเสนอแนะ, ผู้ตรวจ และประวัติ Version ของงานตนเอง
- ดู/ดาวน์โหลดเอกสารส่วนกลางตามสิทธิ์
- อ่านและ mark-read Notifications ของตนเอง
- ห้ามดู submission หรือไฟล์ส่วนตัวของครูคนอื่น

### Reviewer

- เข้าสู่ระบบด้วยบัญชีที่ Admin สร้าง/กำหนด Role
- เห็นเฉพาะงานที่มอบหมายให้ตน
- เปิดดู metadata, PDF/Word, ภาพ, ลิงก์ และ Version history ของงานที่ได้รับมอบหมาย
- ตรวจ rubric, ให้คะแนน, บันทึก `passed`, `rejected`, หรือ `revision_required` พร้อมความคิดเห็น
- ดูประวัติการตรวจของงานที่ได้รับมอบหมายและรายงานตามสิทธิ์
- ห้ามจัดการ Admin, เปลี่ยน Role, ตั้งค่า Secret หรือดูงานที่ไม่ได้รับมอบหมาย

### Admin

- เห็น Dashboard รวม
- จัดการสมาชิก, สถานะบัญชี, การกำหนด Reviewer, Role, Settings, Submission Types, Rubrics, Submission Rounds, Logo/Favicon, เว็บไซต์, คลังเอกสาร, LINE groups/events, Reports, Activity Logs และสถานะ Backup
- มอบหมาย/เปลี่ยน Reviewer หลักของแต่ละ submission
- Archive สมาชิกและเอกสารเป็นค่าเริ่มต้น; การลบถาวรต้องมี confirm และ log
- ห้ามอ่าน Password ของสมาชิกเพราะไม่มี Password อยู่ในฐานข้อมูล

### Server-side authorization helper

สร้าง helper กลาง เช่น `requireAuth`, `requireVerifiedEmail`, `requireActiveAccount`, `requireRole`, `requireSubmissionOwnerOrReviewerOrAdmin` ให้ใช้ซ้ำในทุก API ห้ามกระจาย authorization checks แบบไม่สม่ำเสมอ

ใช้ `users/{uid}.role/status` ที่ควบคุมโดย Server เป็นข้อมูลแหล่งจริง และใช้ Firebase custom claims เป็นตัวช่วยในการอ่านสิทธิ์ ไม่เชื่อค่า role ที่ client ส่งมา ตรวจสถานะ active จาก Firestore เสมอเมื่อเข้าถึงข้อมูลอ่อนไหว

## 6. หน้าจอและ Navigation

สร้าง Modern Dashboard แบบ Responsive SPA รองรับคอมพิวเตอร์ แท็บเล็ต และมือถือ

- Sidebar ด้านซ้าย ย่อ/ขยายได้; บนมือถือเป็น Hamburger Drawer
- Topbar ด้านบนแสดง Logo/ชื่อระบบ, context ของสถานศึกษา, Notification bell พร้อม unread count, รูป Profile, ชื่อผู้ใช้ และเมนูบัญชี
- ใช้ฟอนต์ไทยอ่านง่าย เช่น Noto Sans Thai หรือ IBM Plex Sans Thai โดยโหลดอย่างเหมาะสม
- มี Loading screen, Skeleton states, Empty states, Error states, Toast notifications และ SweetAlert2 สำหรับการยืนยันการเปลี่ยนสถานะ/ลบข้อมูล
- เปลี่ยนหน้าใน SPA โดยไม่ full reload ยกเว้น flow ที่ Firebase OAuth จำเป็นต้อง redirect
- ใช้ Card, Table ที่ค้นหา/เรียง/แบ่งหน้าได้, Filter chips, Modal, Gallery สำหรับภาพ และ chart สำหรับ Dashboard
- รองรับ keyboard navigation, visible focus, label ของ form, contrast และ mobile touch targets
- หลีกเลี่ยงการแสดงข้อมูลทุกอย่างในหน้าเดียว; ใช้ pagination/server-side filtering สำหรับรายการจำนวนมาก
- ใช้ Logo ที่ Admin ตั้งค่า; ถ้ายังไม่มีใช้ fallback logo ที่จัดเตรียมใน repository

### Topbar/section routes

**Teacher:** Dashboard, ส่งงาน, งานของฉัน, ผลตรวจ/คะแนน/ข้อเสนอแนะ, ประวัติ Version, คลังเอกสาร, Notifications, Profile

**Reviewer:** Dashboard, งานรอตรวจ, งานที่ได้รับมอบหมาย, ตรวจงาน, ประวัติการตรวจ, รายงาน, Notifications, Profile

**Admin:** Dashboard, สมาชิก, ผู้ตรวจ, ประเภทงาน, รอบส่ง, เกณฑ์ประเมิน, คลังเอกสาร, รายงาน, Activity Log, Settings, LINE integration, Backup status

## 7. Data model ของ Firestore

จัด schema ให้ normalize เท่าที่เหมาะสม ไม่เก็บ Array ที่โตไม่จำกัดใน document เดียว ใช้ server timestamps และ pagination ด้วย cursor

### `users/{uid}`

```ts
{
  uid: string;
  username?: string;             // required for username/password accounts, optional for Google-only accounts
  usernameNormalized?: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  displayName: string;
  role: 'teacher' | 'reviewer' | 'admin';
  status: 'pending_email_verification' | 'active' | 'disabled' | 'archived';
  learningAreaIds: string[];
  subjects: Array<{ id?: string; name: string; code?: string }>;
  gradeLevels: string[];
  phone?: string;
  photo: { type: 'drive' | 'url'; fileId?: string; url?: string } | null;
  authProvider: 'google' | 'password' | 'mixed';
  mustChangePassword?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  archivedAt?: Timestamp;
  createdBy?: string;
}
```

### `usernameIndex/{usernameNormalized}`

```ts
{ uid: string; createdAt: Timestamp; status: 'reserved' | 'active' }
```

Private server-only mapping, reserve/update/release via transaction; never readable by unauthenticated client.

### `systemSettings/main`

Non-secret settings only: systemName, schoolName, logo file ref/URL, favicon, academicYear, semester, theme tokens, footerText, welcomeText, timezone, file policy, LINE event toggles, lastUpdatedBy, updatedAt. ห้ามเก็บ OAuth tokens / LINE token / Firebase service-account key ไว้ใน Firestore settings ที่ client อ่านได้

### `learningAreas/{id}` and `subjects/{id}` (optional reference data)

Reference data for school subject areas/subjects; allow Admin to manage or use free-form values if the school has no official reference list yet.

### `submissionTypes/{typeId}`

```ts
{
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  sortOrder: number;
  allowedFileExtensions: string[];
  maxFileSizeBytes: number;        // default 50 MiB
  maxFilesPerVersion: number;      // default 20
  maxTotalBytesPerVersion?: number; // configurable protective cap, choose a safe documented default
  allowExternalLinks: boolean;
  metadataFields: Array<{ key: string; label: string; type: 'text'|'textarea'|'select'|'date'; required: boolean; options?: string[] }>;
  rubricId?: string;
  allowResubmitAfterRejected: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

Admin can add, edit, enable/disable and reorder types without code changes. Seed defaults: แผนการสอน, ภาพบรรยากาศห้องเรียน, ภาพการจัดการเรียนรู้.

### `submissionRounds/{roundId}`

```ts
{
  title: string;
  academicYear: string;
  semester: string;
  submissionTypeIds: string[];
  opensAt?: Timestamp;
  dueAt?: Timestamp;
  isActive: boolean;
  acceptLate: true;                // required product decision: accept late while round remains active
  targetMode: 'all_teachers';      // required product decision: every teacher can submit
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

Default behavior: a due date is used to label a submission as late; do not reject solely because `dueAt` passed. A round may be paused/closed by an Admin explicitly. The late flag must be calculated from server timestamp, not client clock.

### `rubrics/{rubricId}`

```ts
{
  name: string;
  description?: string;
  active: boolean;
  criteria: Array<{ id: string; title: string; description?: string; maxScore: number; weight?: number; required: boolean }>;
  maxScore: number;
  passScore: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

Validate `maxScore > 0`, each criterion maximum >= 0, and `0 <= passScore <= maxScore`. Copy the rubric schema/version into each review snapshot so later Admin edits do not rewrite old results.

### `submissions/{submissionId}`

One logical submission record; use a transaction/reservation key to prevent unintended duplicates for the configured uniqueness policy. Support configurable metadata (e.g. subject/grade/lesson) when a teacher must submit multiple items in the same round/type.

```ts
{
  teacherUid: string;
  teacherNameSnapshot: string;
  submissionTypeId: string;
  submissionTypeNameSnapshot: string;
  roundId: string;
  academicYear: string;
  semester: string;
  metadata: Record<string, string | number | boolean | null>;
  currentVersionId?: string;
  currentVersionNumber: number;
  overallStatus: 'draft'|'pending_upload'|'pending_review'|'passed'|'rejected'|'revision_required'|'archived';
  reviewerUid?: string;
  reviewerNameSnapshot?: string;
  dueAtSnapshot?: Timestamp;
  isLate: boolean;
  firstSubmittedAt?: Timestamp;
  lastSubmittedAt?: Timestamp;
  lastReviewedAt?: Timestamp;
  latestScore?: number;
  latestMaxScore?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt?: Timestamp;
}
```

Reviewer assignment is one primary reviewer per item by default. Admin can reassign it, preserving previous reviewer info in the audit trail.

### `submissions/{submissionId}/versions/{versionId}`

Immutable version record; a teacher resubmission creates a new version and never overwrites the previous version.

```ts
{
  versionNumber: number;
  submittedBy: string;
  submittedAt: Timestamp;
  isLate: boolean;
  statusAtSubmission: 'pending_review';
  metadataSnapshot: Record<string, unknown>;
  typeSnapshot: Record<string, unknown>;
  rubricIdSnapshot?: string;
  fileCount: number;
  totalBytes: number;
  externalLinks: Array<{ title: string; url: string }>;
  createdAt: Timestamp;
}
```

### `submissions/{submissionId}/versions/{versionId}/files/{fileId}`

```ts
{
  driveFileId: string;
  originalFileName: string;
  safeFileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256?: string;
  driveParentFolderId: string;
  uploadStatus: 'initiated'|'uploading'|'completed'|'failed'|'quarantined';
  uploadedBy: string;
  uploadedAt?: Timestamp;
  createdAt: Timestamp;
}
```

Never expose direct public URLs to private Drive files. Frontend uses an authenticated download service that rechecks teacher ownership, assigned reviewer, or Admin privileges before issuing a short-lived download grant.

### `reviews/{reviewId}`

```ts
{
  submissionId: string;
  versionId: string;
  versionNumber: number;
  reviewerUid: string;
  reviewerNameSnapshot: string;
  result: 'passed'|'rejected'|'revision_required';
  rubricScores: Array<{ criterionId: string; titleSnapshot: string; score: number; maxScore: number; comment?: string }>;
  totalScore: number;
  maxScore: number;
  passScoreSnapshot: number;
  generalComment?: string;
  privateInternalNote?: string; // reviewer/admin-only; never shown to teacher
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

A review must be transactionally tied to the current assigned reviewer and the expected current version. Validate each score against its criterion maximum. `passed` should be consistent with the configured pass rule; if an authorized reviewer can override the rule, require an explicit reason and log it. The policy for `rejected` resubmission is configured by Submission Type.

### `notifications/{notificationId}`

```ts
{
  recipientUid: string;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  route?: string;
  isRead: boolean;
  readAt?: Timestamp;
  createdAt: Timestamp;
}
```

Only recipient/Admin may read the relevant notifications; recipients can mark their own as read, but cannot change title/body/recipient.

### `notificationOutbox/{outboxId}`

Use an outbox for LINE event delivery with status `pending|processing|sent|retry|failed`, attemptCount, nextAttemptAt, sanitized payload, idempotencyKey, targetGroupIds, lastErrorCode, createdAt, sentAt. Do not include private scores/comments or file contents in LINE messages.

### `activityLogs/{logId}`

Append-only audit event: actorUid, actorUsernameSnapshot, actorRoleSnapshot, action, entityType, entityId, details (redacted/minimal), result, requestId, timestamp server-side. Log login/logout (best effort), register, profile update, upload initiate/complete/fail, submit, new version, assignment/reassignment, review/score/status, settings changes, member create/disable/archive/reset-email, downloads of protected files, report export, backup actions and permanent delete. Never let ordinary clients update/delete logs.

### `libraryCategories/{categoryId}` and `libraryFiles/{libraryFileId}`

Categories are Admin-managed. File metadata contains Drive File ID, category ID, title, description, original name, mimeType, sizeBytes, visibility/allowed roles, published status, uploader UID, createdAt, updatedAt, archivedAt. Default access is all active signed-in users; Admin may restrict a category/file by Role. Store actual files in Drive under the root's `library/` tree and gate every download.

### `backupRuns/{backupRunId}`

Metadata only: backup type (`daily|monthly|manual`), startedAt, completedAt, destination path/URI, status, size/manifest if available, triggeredBy, error summary redacted. Never save credentials or backup contents here.

## 8. Google Drive file architecture and file workflow

### Root structure

All folders must be descendants of `GOOGLE_DRIVE_FOLDER_ID`:

```text
FOLDER_ID/
  submissions/{academicYear}/{semester}/{submissionTypeSlug}/{teacherUid}/{submissionId}/v{versionNumber}/
  library/{categoryId}/
  reports/{academicYear}/{month}/
  profile-images/{uid}/
```

Implement a shared `assertDriveRootConfigured()`/`getDriveRootFolderId()` helper. Every Drive service function must invoke it before API operations. Confirm parent IDs belong under the configured root; never delete or move the root folder. Never accept arbitrary `parentFolderId` from client.

### Upload constraints and mechanics

- Default maximum file size: 50 MiB per file
- Default maximum: 20 files per version
- Allowed extensions/MIME types are configured by Submission Type; sensible defaults: PDF, DOC, DOCX, JPG/JPEG, PNG, WEBP, and optionally XLS/XLSX/PPT/PPTX if Admin enables them
- External links are allowed if enabled, HTTPS only; validate allowed URL protocols and render safely
- Use Google Drive API v3 Resumable Upload. The request to create the resumable session is authenticated and authorized by the Server. Return a session URI only to the currently authenticated uploader and keep it transient in memory; never log it or persist it in Firestore
- Upload binary data directly to Drive using resumable chunks so the file bytes do not pass through Vercel Function payloads. Show progress, pause/retry/resume where API allows, handle expired sessions gracefully, and implement `POST /uploads/complete` for server verification of the Drive file ID, size, MIME type, parent folder and user/session ownership
- If browser CORS prevents direct resumable requests in the target environment, implement a small authenticated Cloud Run streaming upload gateway; do not fall back to passing 50 MiB bodies through Vercel Functions
- Treat upload initiate/complete as a state machine; incomplete or failed uploads must not count as submitted. A version becomes submitted only after all selected file uploads complete and server-side validation passes
- Use UUID/opaque IDs and sanitized filenames; do not use raw names as Firestore IDs or paths
- Check actual Drive metadata after upload and optionally verify file signature/magic bytes for supported file types; mark suspicious files `quarantined` and prevent download until Admin action
- Create each version in its own Drive folder so earlier files are not overwritten. Do not hard-delete the previous version when a teacher resubmits
- File deletion is soft-delete by default and must be logged. Physical deletion is an explicit admin-only process and cannot target the root folder

### Secure downloads

Vercel Functions have a 4.5 MB response-body limit, so do not proxy a 50 MiB file through a normal Vercel API response. Implement secure download by one of these approved patterns:

1. Preferred when viable: a small authenticated Vercel API issues a short-lived, single-purpose download grant; a separate Cloud Run streaming service validates the grant, rechecks Firestore permission, fetches file bytes from Drive with the server-side OAuth token, and streams the response without buffering the whole file. Grant is bound to UID, file ID, expiry, nonce and allowed action; consume nonce once. Store signing secret only in Cloud Run/Vercel secrets.
2. Alternatively, use Drive per-user permissions and native Drive links only if every authorized recipient can authenticate into Google Drive with the correct account and the permission lifecycle (add/remove people) is implemented and tested. Never set `anyone` or public permissions for private submission files.

The coding agent must select and implement one complete tested option, document the trade-off, and not leave a fake `/download` endpoint or expose private `webViewLink` as if public. Use Content-Disposition with safe filename and MIME type; protect against header injection. The download path must authorize the caller before returning a grant.

## 9. Submission lifecycle, rounds, and version history

- Admin can create/edit/activate/deactivate Submission Types and Submission Rounds without code changes
- All active teachers are eligible to submit to an active round by default; do not add target-group selection because the agreed scope is all teachers
- Each round may have a `dueAt`; after that timestamp, submissions remain accepted while the round is active, but `isLate` is set using trusted server time. Admin can explicitly pause/close/archive a round
- One primary reviewer per submission by default; only assigned reviewer and Admin can review. Reviewer reassignment is Admin-only and logged
- Workflow: `draft/pending_upload` → `pending_review` → `passed | rejected | revision_required`; teacher resubmission creates the next immutable Version and moves the current status back to `pending_review` when the file workflow completes
- Every review points to a specific Version, records scores/comments/reviewer/time and preserves its rubric snapshot. New versions do not overwrite earlier reviews
- Teacher sees comments intended for the teacher, scores, reviewer identity, timestamps and version timeline. `privateInternalNote` is never returned to teacher
- Use server timestamp for submittedAt/reviewedAt and compute late status on the server
- Prevent double-submit/double-review using Firestore transactions/idempotency keys and currentVersion checks
- Require meaningful confirmation before final review status. On `revision_required`, display instructions and clear next steps to the teacher

## 10. Rubric and scoring engine

Admin can configure rubric per Submission Type or round. Each criterion has title, description, maximum points and optional weight. Store snapshots with review. Validate numeric ranges server-side. Compute the total on server, do not trust client-supplied total. Configure passScore and result rules; show total/max and percent only when useful. Allow result decisions `passed`, `rejected`, `revision_required`. If reviewer can select a result that conflicts with the score, require an explicit override reason and append it to audit logs. Support re-evaluation of a new Version as a new Review record without modifying old Review records.

## 11. Search, filters, dashboards, and reports

### Teacher Dashboard

Show counts for in-progress, pending review, passed, revision-required, rejected and late submissions; recent activity; upcoming due dates; shortcut to upload; recent feedback. Default lists filter to current user only.

### Reviewer Dashboard

Show assigned pending items, overdue-to-review items if configured, recently reviewed items and status summary. Queries must restrict results to `reviewerUid == currentUser.uid` unless Admin.

### Admin Dashboard

Cards and graphs for:
- active teachers/reviewers
- number of teachers who have/ have not submitted (derive using active Teacher roster and round/type scope)
- submissions by status
- on-time vs late submissions
- pending reviews and items requiring revision
- score distribution/average score (only aggregate if data exists)
- breakdown by learning area, subject, grade, submission type, round, reviewer and date
- activity summary and most recent backup state

All tables need search, sort, cursor pagination and filters by academic year, semester, submission type, round, learning area, subject, grade, user, reviewer, status and date range when relevant. Do not load the entire collection into the browser for large data sets.

### Google Sheets export

- Admin and permitted Reviewer can create/export report sheets for scopes they are authorized to see
- Build export from Firestore server-side queries, not client-provided totals
- Report types: summary dashboard, teacher-by-teacher tracking, submissions and late flags, review outcomes/scores, rubric detail, reviewer workload, activity log export (Admin only)
- Include generatedAt, generatedBy, filters, academic year, semester and timezone
- Escape formula-leading values (`=`, `+`, `-`, `@`) before writing arbitrary user-generated text to Sheets to prevent spreadsheet formula injection
- Create report spreadsheet in the `reports/{academicYear}/{month}` directory below `FOLDER_ID`; return a protected app link and/or Google Sheets link whose permissions are configured deliberately
- Google Sheets is never the authoritative database and exports must not include passwords, auth tokens or private credentials

## 12. Notifications and LINE Messaging API

### In-app notifications

- Bell icon with unread count in Topbar
- Notification list with read/unread filters and mark-one/mark-all as read
- Clicking notification routes to the relevant submission/review/page after authorization
- Notification visibility is per-recipient. Server creates notifications upon meaningful events

### LINE groups

- Use LINE Messaging API Push Message endpoint (not retired LINE Notify)
- Admin can configure multiple Group IDs, friendly group labels and enabled/disabled event types in Admin Settings
- Store `LINE_CHANNEL_ACCESS_TOKEN` only in Vercel/Google Cloud Secret Manager. Group IDs may be stored as protected settings but never place access token in Firestore/client
- Supported configurable events: new submission, late submission, assignment/reassignment, review passed, review rejected, revision required, reminders for pending work (if scheduled reminder task is configured), and backup failure to admin group
- Use an outbox and idempotency keys so retrying does not create uncontrolled duplicates; exponential backoff with max attempts, delivery logs and Admin test-message action
- LINE message may include teacher display name, submission type and status as agreed, plus a link to the authenticated app. Do not send score, private reviewer comments, personal email, file contents, file download links or internal notes to group chats
- The LINE Official Account must be invited/joined to each target group and the configured Group ID must be valid; show a useful Admin diagnostic without disclosing the channel token
- LINE send errors must not roll back a successful submission/review; queue retry and record a sanitized error

## 13. API routes (minimum contract)

Use `/api/v1/...`, consistent JSON envelopes, proper HTTP status codes, request validation with Zod and typed client wrappers. Use `Authorization: Bearer <Firebase ID token>` for authenticated requests except public auth endpoints. Do not make an endpoint public just because a button uses it.

Minimum endpoints (split into files/modules logically):

### Auth/Profile
- `POST /api/v1/auth/username-login`
- `POST /api/v1/auth/complete-profile`
- `GET /api/v1/me`
- `PATCH /api/v1/me`
- `POST /api/v1/auth/request-password-reset` (privacy-preserving response)
- `POST /api/v1/auth/logout-log` (best effort audit event)

### Submission catalog/rounds
- `GET /api/v1/submission-types`
- `GET /api/v1/submission-rounds`
- `POST /api/v1/admin/submission-types`
- `PATCH /api/v1/admin/submission-types/:id`
- `POST /api/v1/admin/submission-rounds`
- `PATCH /api/v1/admin/submission-rounds/:id`

### Upload/submission/version
- `POST /api/v1/uploads/initiate`
- `POST /api/v1/uploads/complete`
- `POST /api/v1/uploads/fail`
- `POST /api/v1/submissions` (create/submit new logical item or configured item key)
- `GET /api/v1/submissions` (scoped by role; filters/pagination)
- `GET /api/v1/submissions/:id`
- `POST /api/v1/submissions/:id/versions` (start new version)
- `GET /api/v1/submissions/:id/versions`
- `POST /api/v1/submissions/:id/download-grants` (authorize and issue short-lived secure download grant)

### Review/assignment
- `POST /api/v1/admin/submissions/:id/assign-reviewer`
- `POST /api/v1/submissions/:id/reviews` (assigned Reviewer/Admin only)
- `GET /api/v1/submissions/:id/reviews`
- `GET /api/v1/reviewer/queue`

### Notifications/Library
- `GET /api/v1/notifications`
- `POST /api/v1/notifications/:id/read`
- `POST /api/v1/notifications/read-all`
- `GET /api/v1/library/categories`
- `GET /api/v1/library/files`
- `POST /api/v1/admin/library/files` (metadata + Drive upload session workflow)
- `PATCH /api/v1/admin/library/files/:id`
- `POST /api/v1/admin/library/categories`

### Members/settings/reports/audit
- `GET /api/v1/admin/members`
- `POST /api/v1/admin/members` (create/invite account, never accept a public requested role)
- `PATCH /api/v1/admin/members/:uid`
- `POST /api/v1/admin/members/:uid/disable`
- `POST /api/v1/admin/members/:uid/archive`
- `POST /api/v1/admin/members/:uid/send-password-reset`
- `GET /api/v1/admin/settings`
- `PATCH /api/v1/admin/settings`
- `POST /api/v1/reports/export`
- `GET /api/v1/admin/activity-logs`
- `GET /api/v1/admin/backup-runs`
- `POST /api/v1/admin/line/test`

This list is a minimum guide, not a reason to put all code into one API file. If additional endpoints are required, document them in `docs/API.md`. Each endpoint must define its request schema, response schema, roles, validation, side effects and audit requirement.

## 14. Activity Log requirements

Append audit logs for login/logout (logout best-effort), registration, profile update, upload initiate/complete/failure, submit, new Version, reviewer assignment/reassignment, review decision/score, member create/edit/disable/archive, password reset email request (never the reset link/token), settings changes, library updates, report exports, LINE configuration/testing, protected file download and backup/restore operations.

Log: actor UID, username snapshot if available, role snapshot, action, entity type/ID, server timestamp, request ID, success/failure and sanitized details. Do not log password, token, upload session URL, document contents or signed download grant. Firestore rules and backend must prevent ordinary roles from editing/deleting logs.

## 15. Google Sheets, Drive, and OAuth configuration

Implement a server-side Google OAuth setup document:

- Create Google Cloud project and enable Google Drive API and Google Sheets API
- Configure OAuth consent screen and authorized redirect URI appropriate to local development and production
- Connect a dedicated school-owned Google account that has access to the chosen Drive root folder
- Request the minimum viable scopes needed for listing/creating/uploading/downloading files and creating/updating spreadsheets; explain any broad/restricted scope trade-off
- Store OAuth Client ID, Client Secret and Refresh Token only as server-side environment variables/Secret Manager values
- `GOOGLE_DRIVE_FOLDER_ID` is required and used as the root folder for all operations. The implementation must fail closed with a clear server-side configuration error if missing
- Provide Admin-side health check that verifies token refresh and read/write access under the root folder without showing tokens
- Avoid asking the user to paste private keys/tokens into chat or commit them to GitHub

Suggested variables (use exact consistent names in code and `.env.example`):

```dotenv
# Public Firebase web config (not secrets; restricted in Firebase console)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=

# Server-only
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_JSON=
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REFRESH_TOKEN=
LINE_CHANNEL_ACCESS_TOKEN=
DOWNLOAD_GRANT_SIGNING_SECRET=
APP_BASE_URL=
CRON_SECRET=
GOOGLE_CLOUD_PROJECT_ID=
BACKUP_BUCKET_NAME=
INITIAL_ADMIN_EMAIL=
```

The actual bootstrap password must be entered by the operator through a secure local prompt or injected into a one-time trusted script; do not add it as a committed variable value. If the Firebase Admin service account is provided as JSON, parse it safely from a server-only environment variable and document newline escaping. Prefer Google Cloud Secret Manager for Cloud Run/Cloud Functions credentials. Do not use any `VITE_` prefix for server-only values.

## 16. Scheduled Firestore backup and restoration

Implement and document these retention goals:
- Daily Firestore full export: retain 30 days
- Monthly Firestore full export: retain 12 months
- Additional export before major schema migration/production release
- Store export data in a dedicated private Google Cloud Storage bucket with lifecycle policies for daily and monthly prefixes; keep report exports in Drive separately
- Use Cloud Scheduler + Cloud Functions/Cloud Run Job or the supported managed export method, with least-privilege service account permissions. Do not store database exports in a client-accessible public bucket
- Record backup run status/metadata in `backupRuns` without making the app wait for the full export
- Alert Admin via in-app notification and optional LINE Admin group when backup fails
- Document cost impact and billing prerequisite (Cloud Firestore export/backup and scheduled Google Cloud workloads may require Blaze/Google Cloud billing)
- Include a restore runbook: restore to a staging/new database first, validate collection counts and sample records, confirm Drive files are unaffected, then plan production cutover. Do not implement a one-click destructive restore without double confirmation and a documented rollback plan
- Because managed Firestore backup retention options may not cover a full 12 months for each backup schedule, use dated Cloud Storage exports and lifecycle policies to meet the agreed daily/monthly retention policy; verify exact provider settings before claiming they are configured

## 17. Frontend details and UX behavior

- Mobile-first responsive layout; preserve all primary actions on small screens
- Sidebar collapsed state persists safely in local preferences, not as a security control
- Table supports server-side search/filter/sort/pagination and accessible row actions
- Upload dropzone supports multiple files, previews for images/PDF where safe, file count/size warnings, individual progress indicators, cancel/retry and clear completion/failure states
- Only mark submission as submitted after upload completion is confirmed server-side
- Detail page shows Timeline: submitted Version, review result, score/rubric, feedback, reviewer name, timestamp, resubmission versions
- Library UI supports category browse, search, file type icon, file size, uploaded date, uploader and authorized download
- Member management supports search, role/status filters, edit, disable, archive, reviewer assignment and reset-email action
- Settings UI includes system/school names, logo/favicons (upload or HTTPS URL), academic year, semester, theme colors, footer, welcome text, submission types, rounds, rubric criteria, file policy, LINE groups/events and Drive/Sheets connection health
- Keep server data separate from local UI state; optimistic updates only for safe operations and rollback on failure
- Display human-friendly Thai errors while retaining request ID for support; never display raw secrets or stack traces

## 18. Suggested repository structure

Adapt to existing repo if necessary, but maintain clear separation:

```text
/
  src/
    app/                 # router, providers, app shell
    components/          # shared UI components
    features/
      auth/
      dashboard/
      submissions/
      reviews/
      members/
      library/
      reports/
      notifications/
      settings/
    hooks/
    lib/                 # Firebase client, API client, schemas, utilities
    styles/
    types/
  api/
    v1/
      auth/
      me/
      submissions/
      uploads/
      reviews/
      admin/
      notifications/
      library/
      reports/
      line/
  server/
    auth/
    authorization/
    firestore/
    drive/
    sheets/
    notifications/
    audit/
    validation/
    rate-limit/
  cloud/                 # Cloud Run/Functions jobs when needed
  scripts/
    bootstrap-admin.ts
    seed-reference-data.ts
  firestore.rules
  firestore.indexes.json
  vercel.json
  .env.example
  .gitignore
  README.md
  docs/
    ARCHITECTURE.md
    API.md
    DATA_MODEL.md
    SECURITY.md
    GOOGLE_SETUP.md
    LINE_SETUP.md
    DEPLOYMENT.md
    BACKUP_RESTORE.md
    TEST_PLAN.md
```

Do not place all server logic in `src/` or import Firebase Admin SDK into the browser bundle. Ensure Vite build cannot include the `server/` directory or server-only environment variables.

## 19. Error handling and observability

- Standard API shape e.g. `{ data, error, requestId }`; do not leak stack traces in production
- Correct status codes: 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict/idempotency, 413 size policy (not a Vercel large-file upload path), 429 rate limit, 500 generic server error
- Add request IDs, structured logs with redaction, and safe error codes
- Retry transient Drive/Sheets/LINE errors with bounded exponential backoff; do not retry validation/permission failures blindly
- Ensure LINE failures do not undo successful business operations; use the outbox pattern
- Add status/health checks that reveal service connectivity state without showing credential values

## 20. Required tests

Use Vitest for unit/integration tests and Playwright for critical end-to-end flows where possible. Mock Google/LINE APIs for repeatable CI; provide a separate manual integration-test checklist using real credentials.

### Unit tests
- Username normalization and concurrent uniqueness behavior
- Role authorization and disabled/unverified accounts
- Submission late flag based on server timestamps/time zones
- Score/rubric calculation, ranges and pass score rules
- Version creation and immutable history behavior
- Filename sanitization/MIME validation/size-count validation
- External HTTPS URL validation
- Sheets formula-injection escaping
- Notification template privacy
- Download grant expiry, UID binding, file binding, nonce replay prevention

### Security tests
- Teacher cannot query/read another teacher's submission, Version, review or files
- Reviewer cannot read unassigned submissions or modify assignment/role
- Teacher cannot update own role, status, score, review, audit logs or library metadata
- Unauthenticated/unverified/disabled account cannot call protected APIs
- Forged user UID, role, file ID, parent folder ID and score are rejected
- No public Drive permissions are created for private evidence
- No secrets/passwords/token values appear in built frontend assets, API JSON, logs or repository
- Firestore rules deny unauthorized writes; include emulator tests where possible

### Integration/E2E tests
- Register with email/password → verification required → complete profile → active Teacher
- Google sign-in → mandatory profile onboarding for new account
- Username/password login via server custom token flow
- Password reset email flow and Admin reset-email workflow
- Create Submission Type/Round/Rubric; teacher uploads multiple files and link
- Resume/retry interrupted upload; submit only when all files complete
- Submission late flag after due date while active round still accepts work
- Admin assigns reviewer; reviewer scores and chooses pass/reject/revision-required
- Teacher uploads next Version and previous Version/reviews remain visible
- Notification unread count/mark read and LINE outbox retry behavior
- Private Drive download denied to unauthorized account and allowed to owner/assigned reviewer/Admin
- Library file visibility per configured role
- Admin report exports to Google Sheets under Drive root
- Backup run metadata and restore runbook dry run

## 21. Deployment and environment setup

Produce a `README.md` with step-by-step setup for a non-specialist school administrator:

1. Install supported Node.js LTS and dependencies
2. Configure Firebase project, Authentication providers (Google and Email/Password), email verification/reset templates, Firestore database, Rules, indexes and App Check recommendation
3. Configure Google Cloud project, Drive API, Sheets API, OAuth consent and server-side refresh token; create root Drive folder and put its ID in `GOOGLE_DRIVE_FOLDER_ID`
4. Configure LINE Official Account/Messaging API, invite the bot into each target group and capture Group IDs; set server-only channel access token
5. Add only the required environment variables to Vercel Development/Preview/Production environments; do not commit secrets
6. Create Firebase Admin service credentials/least-privilege service account and secure them; prefer Secret Manager for Cloud Run/Cloud Functions
7. Run bootstrap admin script locally in trusted environment and discard terminal/session secret exposure; do not publish credential in docs
8. Configure backup bucket, scheduler, lifecycle policies and permissions; explain billing requirements
9. Run local checks, unit tests, emulator tests, build and lint
10. Push branch to GitHub, review Vercel Preview, verify env vars, deploy to Production
11. Run production smoke tests and confirm Drive/Sheets/LINE/Auth/backup status
12. Rotate/revoke leaked OAuth tokens/service credentials and document incident procedure

Use Vercel environment scopes correctly; Preview and Production must not share test data inadvertently. Add `vercel.json` for SPA fallback only for non-API routes; API routes must not rewrite to `index.html`. Provide separate configuration for the Cloud Run streaming service if used.

## 22. Acceptance criteria — must all pass before declaring complete

### Authentication and roles
- [ ] Google Sign-In and Email/Password work
- [ ] email verification is required before protected usage
- [ ] username login resolves to Firebase Auth safely and does not disclose account email before verifying credential
- [ ] public registration cannot create Reviewer/Admin
- [ ] Admin bootstrap uses one-time secure process, no default hardcoded password
- [ ] password reset uses Firebase Auth and no password is stored/read as plaintext
- [ ] disabled accounts lose access promptly

### Core workflow
- [ ] Admin can create Submission Types, Rounds, Rubrics and school settings without code edits
- [ ] Every active Teacher can see/submit configured items; all active rounds accept late submissions and flag late based on server time
- [ ] upload supports 50 MiB/file and up to 20 files/version by default without routing binary through Vercel Function payload body
- [ ] file upload state is verified server-side before submission finalizes
- [ ] each resubmission creates a new immutable Version
- [ ] assigned Reviewer can review only their assigned item and save score/result/comment
- [ ] Teacher sees all prior results and feedback intended for them

### Privacy and files
- [ ] private files are not public and download is permission-checked
- [ ] secure download supports files larger than Vercel's 4.5 MB response-body limit via the approved streaming or Drive permission model
- [ ] all Drive operations are scoped beneath `GOOGLE_DRIVE_FOLDER_ID`
- [ ] library categories and role permissions work
- [ ] private/internal review notes are never shown to Teacher or sent to LINE

### Reports, alerts, and audit
- [ ] Dashboards and filters match role scope
- [ ] Google Sheets export uses Firestore as source of truth and is stored/organized under Drive root
- [ ] notifications support unread counts and status updates
- [ ] LINE event types are configurable, token stays server-only, and failed messages can retry
- [ ] required audit events are recorded with server timestamps and redaction

### Operability
- [ ] daily/monthly backup schedulers and retention policy are documented and configured/tested in a real Google Cloud project (or explicitly marked pending credentials/billing; do not falsely report completion)
- [ ] restore runbook exists and has been exercised in a non-production environment
- [ ] TypeScript build, lint and automated tests pass
- [ ] no secrets are committed or bundled into frontend assets
- [ ] `.env.example`, README, API docs, security notes, deployment steps and manual smoke-test list are complete
- [ ] no dead buttons, placeholder pages presented as finished features, TODO-only implementations or fake integrations remain

## 23. Implementation workflow for the Coding Agent

1. Inspect repository, package manager, current code, deployment settings and existing Firebase config. Do not overwrite user work blindly.
2. Write a short implementation checklist in `docs/IMPLEMENTATION_STATUS.md` and keep it updated.
3. Implement shared types/schema/validation and server authorization before building privileged UI.
4. Implement Firebase Auth and bootstrap process.
5. Implement core Firestore data model, indexes, Security Rules and emulator tests.
6. Implement Drive upload/download workflows with real error handling; verify Vercel payload limits are bypassed correctly.
7. Implement submission/version/review/score lifecycle and audit trail.
8. Build role-specific dashboards and settings UI.
9. Implement notifications, LINE outbox, Sheets export and scheduled backup infrastructure/documentation.
10. Run lint, typecheck, tests and production build; repair all errors.
11. Review browser bundle and Git history for secrets. Confirm `.env*` and credential files are ignored.
12. Summarize what was implemented, tests run, deployment status, missing external credentials, required manual setup and exact next actions. Never claim an integration test or deployment succeeded unless it actually did.

**เริ่มลงมือทำตาม Prompt นี้ทันที โดยไม่ถามซ้ำในประเด็นที่กำหนดไว้แล้ว หากขาด Credential, OAuth consent, Billing หรือสิทธิ์เข้าถึงระบบภายนอก ให้สร้าง implementation ที่ถูกต้องพร้อม configuration/documentation และระบุ blocker ตามจริง ห้ามแกล้งจำลองผลสำเร็จแทน integration จริง**

## 24. Official references for implementation

Use current official documentation and verify changes during implementation:

- Vercel Function request/response body limits: https://vercel.com/docs/errors/function_payload_too_large and https://vercel.com/docs/errors/function_response_payload_too_large
- Google Drive resumable uploads: https://developers.google.com/workspace/drive/api/guides/manage-uploads
- Firebase Admin SDK, ID token verification and custom claims: https://firebase.google.com/docs/auth/admin and https://firebase.google.com/docs/auth/admin/custom-claims
- Firestore scheduled backups: https://firebase.google.com/docs/firestore/backups
- Scheduled Firestore exports: https://firebase.google.com/docs/firestore/solutions/schedule-export
- Google Drive downloads: https://developers.google.com/workspace/drive/api/guides/manage-downloads
- LINE Messaging API sending messages: https://developers.line.biz/en/docs/messaging-api/sending-messages/ and group chat behavior: https://developers.line.biz/en/docs/messaging-api/group-chats/
