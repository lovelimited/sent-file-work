import { 
  User, 
  SubmissionTopic, 
  Submission, 
  SubmissionVersion, 
  SubmissionType,
  SubmissionRound,
  ReviewRecord, 
  LibraryCategory, 
  LibraryFile, 
  AppNotification, 
  ActivityLog, 
  SystemSettings 
} from '../types';

export const initialSettings: SystemSettings = {
  systemName: "ระบบส่งงานครู ตรวจประเมิน และคลังเอกสารสำหรับผู้บริหาร",
  schoolName: "โรงเรียนสาธิตพัฒนาวิทยาการ",
  logoUrl: "/logo.jpg",
  academicYear: "2569",
  semester: "1",
  footerText: "กลุ่มบริหารงานวิชาการ • ติดตามการส่งผลงานของคณะครู",
  welcomeText: "ยินดีต้อนรับสู่ระบบส่งงานและรายงานผลงานครู ประจำปีการศึกษา 2569",
  timezone: "Asia/Bangkok (UTC+7)",
  googleDriveRootFolderId: "1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAM",
  googleSheetReportId: "1N5t1SP33BkvUrc00lrjEvnRbfi1cf1JuesNJezVyZqU",
  lineNotifyEnabled: true,
};

export const initialUsers: User[] = [
  {
    uid: "admin-001",
    email: "drive.limited@gmail.com",
    username: "admin",
    usernameNormalized: "admin",
    emailVerified: true,
    firstName: "กฤตพจน์",
    lastName: "แอดมินบริหาร",
    displayName: "กฤตพจน์ แอดมินบริหาร (Admin)",
    role: "admin",
    status: "active",
    learningAreaIds: ["admin"],
    learningAreaName: "ฝ่ายบริหารวิชาการ",
    subjects: [{ id: "sub-admin", name: "ผู้ดูแลระบบและฝ่ายตรวจงาน" }],
    gradeLevels: ["ทุกระดับชั้น"],
    phone: "081-234-5678",
    photo: { type: "url", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80" },
    authProvider: "mixed",
    createdAt: "2026-05-01T08:00:00Z",
  },
  {
    uid: "teacher-001",
    email: "somsri.teacher@school.ac.th",
    username: "somsri",
    usernameNormalized: "somsri",
    emailVerified: true,
    firstName: "สมศรี",
    lastName: "ใจดีเลิศ",
    displayName: "ครูสมศรี ใจดีเลิศ",
    role: "teacher",
    status: "active",
    learningAreaIds: ["sci_tech"],
    learningAreaName: "วิทยาศาสตร์และเทคโนโลยี",
    subjects: [
      { id: "sub-1", name: "วิทยาการคำนวณ 3", code: "ว23101" },
      { id: "sub-2", name: "การออกแบบและเทคโนโลยี", code: "ว23102" }
    ],
    gradeLevels: ["ม.3"],
    phone: "089-987-6543",
    photo: { type: "url", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" },
    authProvider: "password",
    createdAt: "2026-05-10T09:00:00Z",
  },
  {
    uid: "teacher-002",
    email: "somchai.teacher@school.ac.th",
    username: "somchai",
    usernameNormalized: "somchai",
    emailVerified: true,
    firstName: "สมชาย",
    lastName: "รักการสอน",
    displayName: "ครูสมชาย รักการสอน",
    role: "teacher",
    status: "active",
    learningAreaIds: ["math"],
    learningAreaName: "คณิตศาสตร์",
    subjects: [{ id: "sub-3", name: "คณิตศาสตร์พื้นฐาน 5", code: "ค33101" }],
    gradeLevels: ["ม.5", "ม.6"],
    phone: "084-555-4321",
    photo: { type: "url", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
    authProvider: "password",
    createdAt: "2026-05-11T10:00:00Z",
  },
  {
    uid: "teacher-003",
    email: "mana.teacher@school.ac.th",
    username: "mana",
    usernameNormalized: "mana",
    emailVerified: true,
    firstName: "มานะ",
    lastName: "มีวินัย",
    displayName: "ครูมานะ มีวินัย",
    role: "teacher",
    status: "active",
    learningAreaIds: ["thai"],
    learningAreaName: "ภาษาไทย",
    subjects: [{ id: "sub-4", name: "ภาษาไทย 3", code: "ท23101" }],
    gradeLevels: ["ม.3"],
    phone: "086-333-7890",
    photo: { type: "url", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
    authProvider: "password",
    createdAt: "2026-05-12T08:00:00Z",
  },
  {
    uid: "teacher-004",
    email: "suda.teacher@school.ac.th",
    username: "suda",
    usernameNormalized: "suda",
    emailVerified: true,
    firstName: "สุดา",
    lastName: "รักเรียน",
    displayName: "ครูสุดา รักเรียน",
    role: "teacher",
    status: "active",
    learningAreaIds: ["foreign_lang"],
    learningAreaName: "ภาษาต่างประเทศ",
    subjects: [{ id: "sub-5", name: "ภาษาอังกฤษพื้นฐาน", code: "อ22101" }],
    gradeLevels: ["ม.2"],
    phone: "085-444-9988",
    photo: { type: "url", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
    authProvider: "password",
    createdAt: "2026-05-12T09:00:00Z",
  },
  {
    uid: "teacher-005",
    email: "aphisit.teacher@school.ac.th",
    username: "aphisit",
    usernameNormalized: "aphisit",
    emailVerified: true,
    firstName: "อภิสิทธิ์",
    lastName: "กิจเจริญ",
    displayName: "ครูอภิสิทธิ์ กิจเจริญ",
    role: "teacher",
    status: "active",
    learningAreaIds: ["social"],
    learningAreaName: "สังคมศึกษา ศาสนา และวัฒนธรรม",
    subjects: [{ id: "sub-6", name: "ประวัติศาสตร์ไทย", code: "ส23102" }],
    gradeLevels: ["ม.3"],
    phone: "081-777-1234",
    photo: { type: "url", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80" },
    authProvider: "password",
    createdAt: "2026-05-13T10:00:00Z",
  }
];

// หัวข้อเรื่องที่แอดมินเป็นคนสร้างขึ้น เพื่อให้ครูส่งตามกำหนด
export const initialSubmissionTopics: SubmissionTopic[] = [
  {
    id: "topic-plan-1",
    title: "ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2)",
    category: "แผนการจัดการเรียนรู้",
    description: "ให้คุณครูทุกท่านจัดทำและส่งแผนการจัดการเรียนรู้เชิงรุก (Active Learning) หน่วยการเรียนรู้ที่ 1-2 แนบไฟล์ PDF หรือ Word เพื่อรับการตรวจรับรอง",
    academicYear: "2569",
    semester: "1",
    dueDate: "2026-06-30T23:59:59Z",
    allowedFileExtensions: [".pdf", ".docx", ".doc"],
    maxFiles: 5,
    allowExternalLinks: true,
    isActive: true,
    createdAt: "2026-05-15T08:00:00Z",
    createdBy: "กฤตพจน์ แอดมินบริหาร",
    subTasks: [
      { id: "st-plan-1", title: "1. แผนการจัดการเรียนรู้ฉบับสมบูรณ์ (หน่วยที่ 1-2)", description: "เน้นกระบวนการ Active Learning และสมรรถนะผู้เรียน", isRequired: true },
      { id: "st-plan-2", title: "2. โครงสร้างรายวิชาและกำหนดการสอน", description: "ตารางวิเคราะห์หน่วยการเรียนรู้และสัดส่วนคะแนน", isRequired: true },
      { id: "st-plan-3", title: "3. เครื่องมือวัดและประเมินผล / รูบริก", description: "แบบประเมินชิ้นงาน แบบทดสอบ และเกณฑ์รูบริก", isRequired: true },
      { id: "st-plan-4", title: "4. ใบงาน / แบบฝึกหัดประกอบการสอน", description: "เอกสารประกอบการจัดกิจกรรมสำหรับผู้เรียน", isRequired: false },
    ]
  },
  {
    id: "topic-research-1",
    title: "ส่งเค้าโครงการวิจัยในชั้นเรียน (Action Research) 1/2569",
    category: "วิจัยในชั้นเรียน",
    description: "ให้ครูผู้สอนส่งชื่อเรื่อง วัตถุประสงค์ และแนวทางการแก้ปัญหาหรือพัฒนานวัตกรรมผู้เรียนในภาคเรียนที่ 1",
    academicYear: "2569",
    semester: "1",
    dueDate: "2026-07-31T23:59:59Z",
    allowedFileExtensions: [".pdf", ".docx"],
    maxFiles: 3,
    allowExternalLinks: false,
    isActive: true,
    createdAt: "2026-05-15T08:30:00Z",
    createdBy: "กฤตพจน์ แอดมินบริหาร",
    subTasks: [
      { id: "st-res-1", title: "1. แบบเสนอเค้าโครงการวิจัย (บทที่ 1-3)", description: "ความเป็นมา วัตถุประสงค์ และกรอบแนวคิดการวิจัย", isRequired: true },
      { id: "st-res-2", title: "2. นวัตกรรมหรือเครื่องมือเก็บรวบรวมข้อมูล", description: "นวัตกรรมที่พัฒนาขึ้นหรือแบบวัดผลสัมฤทธิ์", isRequired: true },
    ]
  },
  {
    id: "topic-media-1",
    title: "ส่งสื่อ นวัตกรรม และเทคโนโลยีการสอนยอดเยี่ยม 1/2569",
    category: "สื่อและนวัตกรรมการสอน",
    description: "ส่งไฟล์สื่อการสอน ใบความรู้ เอกสาร หรือแนบลิงก์ Canva, Padlet, Kahoot, YouTube สำหรับใช้จัดการเรียนรู้",
    academicYear: "2569",
    semester: "1",
    dueDate: "2026-07-15T23:59:59Z",
    allowedFileExtensions: [".pdf", ".pptx", ".docx", ".zip", ".jpg", ".png"],
    maxFiles: 10,
    allowExternalLinks: true,
    isActive: true,
    createdAt: "2026-05-15T09:00:00Z",
    createdBy: "กฤตพจน์ แอดมินบริหาร",
    subTasks: [
      { id: "st-med-1", title: "1. ไฟล์สื่อการสอน / สไลด์นำเสนอ / บอร์ดเกม", description: "ไฟล์สื่อดิจิทัลหรือลิงก์แพลตฟอร์มการสอน", isRequired: true },
      { id: "st-med-2", title: "2. คู่มือการใช้งานสื่อสำหรับครูและนักเรียน", description: "คำอธิบายขั้นตอนการนำไปใช้จัดกิจกรรม", isRequired: true },
    ]
  },
  {
    id: "topic-pp5-midterm",
    title: "ส่งสมุดบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) กลางภาค 1/2569",
    category: "งานธุรการชั้นเรียน/ปพ.",
    description: "ให้ครูประจำวิชาส่งบันทึกคะแนนเก็บและผลการประเมินกลางภาคเรียนที่ 1 ในรูปแบบไฟล์ PDF หรือ Excel",
    academicYear: "2569",
    semester: "1",
    dueDate: "2026-08-15T23:59:59Z",
    allowedFileExtensions: [".pdf", ".xlsx"],
    maxFiles: 3,
    allowExternalLinks: false,
    isActive: true,
    createdAt: "2026-05-15T09:30:00Z",
    createdBy: "กฤตพจน์ แอดมินบริหาร",
    subTasks: [
      { id: "st-pp5-1", title: "1. สมุด ปพ.5 บันทึกคะแนนเก็บและกลางภาค", description: "ตารางสรุปคะแนนรายตัวชี้วัด", isRequired: true },
      { id: "st-pp5-2", title: "2. สรุปสถิติการเข้าเรียนและเวลาเรียน", description: "สรุปเวลาเรียนร้อยละของผู้เรียน", isRequired: true },
    ]
  },
  {
    id: "topic-project-report",
    title: "ส่งรายงานสรุปผลการดำเนินโครงการตามแผนปฏิบัติการ 1/2569",
    category: "รายงานโครงการ/กิจกรรม",
    description: "สรุปผลการดำเนินงานโครงการ พร้อมรูปภาพและแบบประเมินความพึงพอใจสำหรับหัวหน้าโครงการ",
    academicYear: "2569",
    semester: "1",
    dueDate: "2026-09-15T23:59:59Z",
    allowedFileExtensions: [".pdf", ".docx"],
    maxFiles: 5,
    allowExternalLinks: true,
    isActive: true,
    createdAt: "2026-05-15T10:00:00Z",
    createdBy: "กฤตพจน์ แอดมินบริหาร",
    subTasks: [
      { id: "st-proj-1", title: "1. เล่มรายงานสรุปผลการดำเนินโครงการ", description: "ผลการดำเนินงานตามตัวชี้วัดความสำเร็จ", isRequired: true },
      { id: "st-proj-2", title: "2. สรุปการใช้จ่ายงบประมาณและผลการประเมิน", description: "สรุปงบประมาณและผลประเมินความพึงพอใจ", isRequired: true },
      { id: "st-proj-3", title: "3. ภาพถ่ายกิจกรรมหรือหลักฐานเชิงประจักษ์", description: "ภาพถ่ายขณะดำเนินโครงการ", isRequired: true },
    ]
  }
];

export const initialSubmissionTypes: SubmissionType[] = [
  { id: "type-plan", name: "แผนการจัดการเรียนรู้ (Active Learning)", description: "แผนการจัดการเรียนรู้บูรณาการ ใบงาน และแบบวัดผล", active: true },
  { id: "type-research", name: "วิจัยในชั้นเรียน (Action Research)", description: "เค้าโครงและรายงานผลการวิจัยเพื่อแก้ปัญหาผู้เรียน", active: true },
  { id: "type-media", name: "สื่อและนวัตกรรมการสอน", description: "เอกสาร สื่อสไลด์ ลิงก์สื่อดิจิทัล หรือใบความรู้", active: true },
  { id: "type-pp5", name: "งานธุรการชั้นเรียน/ปพ.", description: "สมุดบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) ปพ.6 ฯลฯ", active: true },
  { id: "type-project", name: "รายงานผลการดำเนินโครงการ", description: "สรุปผลโครงการตามแผนปฏิบัติการและรูปภาพกิจกรรม", active: true },
  { id: "type-pa", name: "ข้อตกลงในการพัฒนางาน (PA)", description: "เอกสาร ว.PA และร่องรอยหลักฐานการพัฒนาตนเองและวิชาชีพ", active: true },
];

export const initialSubmissionRounds: SubmissionRound[] = [
  { id: "round-1", title: "ส่งผลงานทางวิชาการ ภาคเรียนที่ 1/2569", academicYear: "2569", semester: "1", dueAt: "2026-06-30T23:59:59Z", isActive: true },
  { id: "round-2", title: "ส่งผลงานทางวิชาการ ภาคเรียนที่ 2/2569", academicYear: "2569", semester: "2", dueAt: "2026-11-30T23:59:59Z", isActive: false },
];

export const initialSubmissions: Submission[] = [
  {
    id: "sub-2026-001",
    topicId: "topic-plan-1",
    topicTitle: "ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2)",
    teacherUid: "teacher-001",
    teacherName: "ครูสมศรี ใจดีเลิศ",
    teacherEmail: "somsri.teacher@school.ac.th",
    teacherDepartment: "วิทยาศาสตร์และเทคโนโลยี",
    title: "แผนการจัดการเรียนรู้ ว23101 วิทยาการคำนวณ 3 หน่วยการเรียนรู้ที่ 1 การพัฒนาแอปพลิเคชัน",
    status: "passed",
    currentVersionNumber: 1,
    isLate: false,
    submittedAt: "2026-05-20T10:30:00Z",
    updatedAt: "2026-05-22T14:15:00Z",
    latestReviewDecision: "passed",
    subTasksCount: { total: 4, completed: 4, passed: 4 },
    metadata: {
      workType: "แผนการสอนบูรณาการ Active Learning",
      hours: "8 ชั่วโมง"
    }
  },
  {
    id: "sub-2026-002",
    topicId: "topic-media-1",
    topicTitle: "ส่งสื่อ นวัตกรรม และเทคโนโลยีการสอนยอดเยี่ยม 1/2569",
    teacherUid: "teacher-001",
    teacherName: "ครูสมศรี ใจดีเลิศ",
    teacherEmail: "somsri.teacher@school.ac.th",
    teacherDepartment: "วิทยาศาสตร์และเทคโนโลยี",
    title: "สื่อจำลองการเขียนโปรแกรมและบอร์ดกิจกรรม STEM Education ม.3",
    status: "submitted",
    currentVersionNumber: 1,
    isLate: false,
    submittedAt: "2026-05-24T15:00:00Z",
    updatedAt: "2026-05-24T15:00:00Z",
    subTasksCount: { total: 2, completed: 2, passed: 0 },
  },
  {
    id: "sub-2026-003",
    topicId: "topic-plan-1",
    topicTitle: "ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2)",
    teacherUid: "teacher-002",
    teacherName: "ครูสมชาย รักการสอน",
    teacherEmail: "somchai.teacher@school.ac.th",
    teacherDepartment: "คณิตศาสตร์",
    title: "แผนการจัดการเรียนรู้ ค33101 แคลคูลัสเบื้องต้น หน่วยที่ 2 อนุพันธ์ของฟังก์ชัน",
    status: "revision_required",
    currentVersionNumber: 1,
    isLate: false,
    submittedAt: "2026-05-21T09:15:00Z",
    updatedAt: "2026-05-23T11:00:00Z",
    latestReviewDecision: "revision_required",
    subTasksCount: { total: 4, completed: 3, passed: 2 },
  },
  {
    id: "sub-2026-004",
    topicId: "topic-media-1",
    topicTitle: "ส่งสื่อ นวัตกรรม และเทคโนโลยีการสอนยอดเยี่ยม 1/2569",
    teacherUid: "teacher-005",
    teacherName: "ครูอภิสิทธิ์ กิจเจริญ",
    teacherEmail: "aphisit.teacher@school.ac.th",
    teacherDepartment: "สังคมศึกษา ศาสนา และวัฒนธรรม",
    title: "สื่อนำเสนอและบอร์ดเกมนิทรรศการประวัติศาสตร์อยุธยา ม.3",
    status: "passed",
    currentVersionNumber: 1,
    isLate: false,
    submittedAt: "2026-05-25T11:20:00Z",
    updatedAt: "2026-05-26T09:30:00Z",
    latestReviewDecision: "passed",
    subTasksCount: { total: 2, completed: 2, passed: 2 },
  }
];

export const initialVersions: Record<string, SubmissionVersion[]> = {
  "sub-2026-001": [
    {
      id: "ver-sub-1-v1",
      submissionId: "sub-2026-001",
      versionNumber: 1,
      note: "ส่งแผนการสอนฉบับสมบูรณ์ พร้อมแบบวัดผลและใบกิจกรรมการเขียนโปรแกรม",
      submittedAt: "2026-05-20T10:30:00Z",
      statusSnapshot: "passed",
      files: [
        {
          id: "file-plan-001",
          fileName: "แผนการจัดการเรียนรู้_ว23101_หน่วยที่1_สมศรี.pdf",
          fileSizeBytes: 4250000,
          mimeType: "application/pdf",
          driveFileId: "1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAM_p1",
          downloadUrl: "#",
          folderName: "ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2)",
          folderPath: "Google Drive / ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2) /",
          subTaskId: "st-plan-1",
          subTaskTitle: "1. แผนการจัดการเรียนรู้ฉบับสมบูรณ์ (หน่วยที่ 1-2)",
          uploadedAt: "2026-05-20T10:28:00Z",
        },
        {
          id: "file-plan-002",
          fileName: "โครงสร้างรายวิชาและกำหนดการสอน_ว23101.pdf",
          fileSizeBytes: 1850000,
          mimeType: "application/pdf",
          driveFileId: "1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAM_p2",
          downloadUrl: "#",
          folderName: "ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2)",
          folderPath: "Google Drive / ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2) /",
          subTaskId: "st-plan-2",
          subTaskTitle: "2. โครงสร้างรายวิชาและกำหนดการสอน",
          uploadedAt: "2026-05-20T10:28:30Z",
        },
        {
          id: "file-plan-003",
          fileName: "ใบงานและแบบประเมินรูบริก.docx",
          fileSizeBytes: 1200000,
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          driveFileId: "1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAM_p3",
          downloadUrl: "#",
          folderName: "ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2)",
          folderPath: "Google Drive / ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2) /",
          subTaskId: "st-plan-3",
          subTaskTitle: "3. เครื่องมือวัดและประเมินผล / รูบริก",
          uploadedAt: "2026-05-20T10:29:00Z",
        },
        {
          id: "file-plan-004",
          fileName: "ใบงานกิจกรรมการเขียนโปรแกรม_ม3.pdf",
          fileSizeBytes: 2100000,
          mimeType: "application/pdf",
          driveFileId: "1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAM_p4",
          downloadUrl: "#",
          folderName: "ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2)",
          folderPath: "Google Drive / ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2) /",
          subTaskId: "st-plan-4",
          subTaskTitle: "4. ใบงาน / แบบฝึกหัดประกอบการสอน",
          uploadedAt: "2026-05-20T10:29:30Z",
        }
      ],
      externalLinks: [
        "https://padlet.com/teacher_somsri/active_learning_unit1"
      ]
    }
  ],
  "sub-2026-002": [
    {
      id: "ver-sub-2-v1",
      submissionId: "sub-2026-002",
      versionNumber: 1,
      note: "สื่อการสอนบอร์ดกิจกรรมคอมพิวเตอร์และสไลด์ประกอบ",
      submittedAt: "2026-05-24T15:00:00Z",
      statusSnapshot: "submitted",
      files: [
        {
          id: "file-atm-001",
          fileName: "stem_coding_board_game.pdf",
          fileSizeBytes: 3100000,
          mimeType: "application/pdf",
          downloadUrl: "#",
          folderName: "ส่งสื่อ นวัตกรรม และเทคโนโลยีการสอนยอดเยี่ยม 1/2569",
          folderPath: "Google Drive / ส่งสื่อ นวัตกรรม และเทคโนโลยีการสอนยอดเยี่ยม 1/2569 /",
          subTaskId: "st-med-1",
          subTaskTitle: "1. ไฟล์สื่อการสอน / สไลด์นำเสนอ / บอร์ดเกม",
          uploadedAt: "2026-05-24T14:58:00Z",
        },
        {
          id: "file-atm-002",
          fileName: "คู่มือการใช้งานบอร์ดเกมและแผนจัดกิจกรรม.pdf",
          fileSizeBytes: 1950000,
          mimeType: "application/pdf",
          downloadUrl: "#",
          folderName: "ส่งสื่อ นวัตกรรม และเทคโนโลยีการสอนยอดเยี่ยม 1/2569",
          folderPath: "Google Drive / ส่งสื่อ นวัตกรรม และเทคโนโลยีการสอนยอดเยี่ยม 1/2569 /",
          subTaskId: "st-med-2",
          subTaskTitle: "2. คู่มือการใช้งานสื่อสำหรับครูและนักเรียน",
          uploadedAt: "2026-05-24T14:59:00Z",
        }
      ],
      externalLinks: []
    }
  ],
  "sub-2026-003": [
    {
      id: "ver-sub-3-v1",
      submissionId: "sub-2026-003",
      versionNumber: 1,
      note: "ส่งแผนแคลคูลัส ม.6",
      submittedAt: "2026-05-21T09:15:00Z",
      statusSnapshot: "revision_required",
      files: [
        {
          id: "file-plan-005",
          fileName: "แผนการสอน_ค33101_อนุพันธ์.pdf",
          fileSizeBytes: 3800000,
          mimeType: "application/pdf",
          downloadUrl: "#",
          folderName: "ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2)",
          folderPath: "Google Drive / ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2) /",
          subTaskId: "st-plan-1",
          subTaskTitle: "1. แผนการจัดการเรียนรู้ฉบับสมบูรณ์ (หน่วยที่ 1-2)",
          uploadedAt: "2026-05-21T09:10:00Z",
        },
        {
          id: "file-plan-006",
          fileName: "โครงสร้างรายวิชาคณิตศาสตร์_ม6.pdf",
          fileSizeBytes: 1450000,
          mimeType: "application/pdf",
          downloadUrl: "#",
          folderName: "ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2)",
          folderPath: "Google Drive / ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2) /",
          subTaskId: "st-plan-2",
          subTaskTitle: "2. โครงสร้างรายวิชาและกำหนดการสอน",
          uploadedAt: "2026-05-21T09:12:00Z",
        }
      ],
      externalLinks: []
    }
  ],
  "sub-2026-004": [
    {
      id: "ver-sub-4-v1",
      submissionId: "sub-2026-004",
      versionNumber: 1,
      note: "สื่อการสอนบอร์ดเกมประวัติศาสตร์และสไลด์สรุป",
      submittedAt: "2026-05-25T11:20:00Z",
      statusSnapshot: "passed",
      files: [
        {
          id: "file-med-003",
          fileName: "ประวัติศาสตร์อยุธยา_บอร์ดเกม.pdf",
          fileSizeBytes: 5400000,
          mimeType: "application/pdf",
          downloadUrl: "#",
          folderName: "ส่งสื่อ นวัตกรรม และเทคโนโลยีการสอนยอดเยี่ยม 1/2569",
          folderPath: "Google Drive / ส่งสื่อ นวัตกรรม และเทคโนโลยีการสอนยอดเยี่ยม 1/2569 /",
          subTaskId: "st-med-1",
          subTaskTitle: "1. ไฟล์สื่อการสอน / สไลด์นำเสนอ / บอร์ดเกม",
          uploadedAt: "2026-05-25T11:18:00Z",
        },
        {
          id: "file-med-004",
          fileName: "คู่มือกิจกรรมบอร์ดเกมนิทรรศการ.pdf",
          fileSizeBytes: 2200000,
          mimeType: "application/pdf",
          downloadUrl: "#",
          folderName: "ส่งสื่อ นวัตกรรม และเทคโนโลยีการสอนยอดเยี่ยม 1/2569",
          folderPath: "Google Drive / ส่งสื่อ นวัตกรรม และเทคโนโลยีการสอนยอดเยี่ยม 1/2569 /",
          subTaskId: "st-med-2",
          subTaskTitle: "2. คู่มือการใช้งานสื่อสำหรับครูและนักเรียน",
          uploadedAt: "2026-05-25T11:19:00Z",
        }
      ],
      externalLinks: ["https://canva.com/design/ayutthaya-history-demo"]
    }
  ]
};

export const initialReviews: Record<string, ReviewRecord[]> = {
  "sub-2026-001": [
    {
      id: "rev-001",
      submissionId: "sub-2026-001",
      versionNumber: 1,
      reviewerUid: "admin-001",
      reviewerName: "กฤตพจน์ แอดมินบริหาร",
      decision: "passed",
      comments: "เอกสารแผนการสอนจัดทำได้ครบถ้วน สอดคล้องกับหัวข้อที่กำหนด",
      recommendations: "อนุมัติเรียบร้อย นำไปใช้สอนได้ตามกำหนดครับ",
      reviewedAt: "2026-05-22T14:15:00Z",
      subTaskReviews: {
        "st-plan-1": { subTaskId: "st-plan-1", subTaskTitle: "1. แผนการจัดการเรียนรู้ฉบับสมบูรณ์ (หน่วยที่ 1-2)", decision: "passed", feedback: "แผนเชิงรุก Active Learning ครบถ้วน" },
        "st-plan-2": { subTaskId: "st-plan-2", subTaskTitle: "2. โครงสร้างรายวิชาและกำหนดการสอน", decision: "passed", feedback: "สัดส่วนคะแนนและตัวชี้วัดชัดเจน" },
        "st-plan-3": { subTaskId: "st-plan-3", subTaskTitle: "3. เครื่องมือวัดและประเมินผล / รูบริก", decision: "passed", feedback: "รูบริกสอดคล้องกับสมรรถนะผู้เรียน" },
        "st-plan-4": { subTaskId: "st-plan-4", subTaskTitle: "4. ใบงาน / แบบฝึกหัดประกอบการสอน", decision: "passed", feedback: "ใบงานมีคำชี้แจงชัดเจน" },
      }
    }
  ],
  "sub-2026-003": [
    {
      id: "rev-002",
      submissionId: "sub-2026-003",
      versionNumber: 1,
      reviewerUid: "admin-001",
      reviewerName: "กฤตพจน์ แอดมินบริหาร",
      decision: "revision_required",
      comments: "เนื้อหาหลักสูตรครบถ้วน แต่ยังขาดแบบบันทึกผลการประเมินตามที่ระบุในคำชี้แจงหัวข้อเรื่อง",
      recommendations: "รบกวนเพิ่มเติมแบบประเมินและส่งเวอร์ชัน 2 เพื่อตรวจสอบอีกครั้งครับ",
      reviewedAt: "2026-05-23T11:00:00Z",
      subTaskReviews: {
        "st-plan-1": { subTaskId: "st-plan-1", subTaskTitle: "1. แผนการจัดการเรียนรู้ฉบับสมบูรณ์ (หน่วยที่ 1-2)", decision: "passed", feedback: "เนื้อหาแคลคูลัสถูกต้อง" },
        "st-plan-2": { subTaskId: "st-plan-2", subTaskTitle: "2. โครงสร้างรายวิชาและกำหนดการสอน", decision: "passed", feedback: "โครงสร้างรายวิชาครบถ้วน" },
        "st-plan-3": { subTaskId: "st-plan-3", subTaskTitle: "3. เครื่องมือวัดและประเมินผล / รูบริก", decision: "revision_required", feedback: "⚠️ ยังไม่พบแบบวัดผลประเมินผลและเกณฑ์รูบริก กรุณาแนบเพิ่มเติม" },
      }
    }
  ],
  "sub-2026-004": [
    {
      id: "rev-003",
      submissionId: "sub-2026-004",
      versionNumber: 1,
      reviewerUid: "admin-001",
      reviewerName: "กฤตพจน์ แอดมินบริหาร",
      decision: "passed",
      comments: "สื่อและบอร์ดเกมนวัตกรรมมีความน่าสนใจ สอดคล้องกับมาตรฐานการเรียนรู้",
      recommendations: "ขอชื่นชมการสร้างสรรค์นวัตกรรมการสอน",
      reviewedAt: "2026-05-26T09:30:00Z",
      subTaskReviews: {
        "st-med-1": { subTaskId: "st-med-1", subTaskTitle: "1. ไฟล์สื่อการสอน / สไลด์นำเสนอ / บอร์ดเกม", decision: "passed", feedback: "บอร์ดเกมน่าสนใจมาก" },
        "st-med-2": { subTaskId: "st-med-2", subTaskTitle: "2. คู่มือการใช้งานสื่อสำหรับครูและนักเรียน", decision: "passed", feedback: "คู่มือเขียนเข้าใจง่าย" },
      }
    }
  ]
};

export const initialLibraryCategories: LibraryCategory[] = [
  {
    id: "cat-curriculum",
    name: "หลักสูตรและคู่มือการสอน",
    description: "หลักสูตรสถานศึกษา แผนแม่บท และคู่มือการจัดการเรียนรู้",
    allowedRoles: ["teacher", "admin"],
  },
  {
    id: "cat-forms",
    name: "แบบฟอร์มทางวิชาการและวิจัย",
    description: "แบบฟอร์มแผนการสอน วิจัยในชั้นเรียน และเอกสารธุรการ",
    allowedRoles: ["teacher", "admin"],
  },
  {
    id: "cat-pa",
    name: "เอกสารวิทยฐานะและ ว.PA",
    description: "คู่มือการจัดทำข้อตกลงในการพัฒนางาน (PA) และเอกสารหลักฐาน",
    allowedRoles: ["teacher", "admin"],
  },
  {
    id: "cat-executive",
    name: "เอกสารรายงานเฉพาะผู้บริหาร",
    description: "สรุปผลสัมฤทธิ์ สถิติการส่งงาน และรายงานตรวจราชการ",
    allowedRoles: ["admin"],
  }
];

export const initialLibraryFiles: LibraryFile[] = [
  {
    id: "lib-001",
    categoryId: "cat-forms",
    title: "แบบฟอร์มแผนการจัดการเรียนรู้มาตรฐาน ประจำปีการศึกษา 2569",
    description: "เทมเพลตมาตรฐานสำหรับเขียนแผนการจัดการเรียนรู้เน้นสมรรถนะ",
    fileName: "Template_Lesson_Plan_2569.docx",
    fileSizeBytes: 245000,
    fileType: "DOCX",
    downloadUrl: "#",
    uploadedByName: "ผู้ดูแลระบบสารสนเทศ",
    uploadedAt: "2026-05-01T08:00:00Z",
    allowedRoles: ["teacher", "admin"],
    downloadsCount: 142,
  },
  {
    id: "lib-002",
    categoryId: "cat-curriculum",
    title: "คู่มือแนวทางการจัดทำวิจัยในชั้นเรียนและการแก้ปัญหาผู้เรียน",
    description: "คู่มือขั้นตอนการทำวิจัยในชั้นเรียน 5 บทอย่างง่ายสำหรับคุณครู",
    fileName: "Classroom_Action_Research_Guide.pdf",
    fileSizeBytes: 6200000,
    fileType: "PDF",
    downloadUrl: "#",
    uploadedByName: "ผู้ดูแลระบบสารสนเทศ",
    uploadedAt: "2026-05-03T10:00:00Z",
    allowedRoles: ["teacher", "admin"],
    downloadsCount: 88,
  },
  {
    id: "lib-003",
    categoryId: "cat-pa",
    title: "แนวทางการประเมินข้อตกลงในการพัฒนางาน (ว.PA) สายงานการสอน",
    description: "เกณฑ์และแนวทางการเก็บรวบรวมหลักฐานร่องรอยการปฏิบัติงาน",
    fileName: "PA_Guidelines_2569.pdf",
    fileSizeBytes: 5200000,
    fileType: "PDF",
    downloadUrl: "#",
    uploadedByName: "ผู้ดูแลระบบสารสนเทศ",
    uploadedAt: "2026-05-04T11:30:00Z",
    allowedRoles: ["teacher", "admin"],
    downloadsCount: 115,
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: "notif-1",
    recipientUid: "teacher-001",
    title: "ผลการตรวจสอบผลงานเสร็จสิ้น",
    message: "แผนการจัดการเรียนรู้ ว23101 ได้รับการอนุมัติผ่านเรียบร้อยแล้วโดยแอดมิน",
    type: "review",
    read: false,
    createdAt: "2026-05-22T14:15:00Z",
    link: "/submissions/sub-2026-001"
  },
  {
    id: "notif-2",
    recipientUid: "admin-001",
    title: "มีงานส่งเข้ามาใหม่รอรับการตรวจ",
    message: "ครูสมศรี ใจดีเลิศ ได้ส่งงานในหัวข้อ 'ส่งสื่อ นวัตกรรม และเทคโนโลยีการสอนยอดเยี่ยม'",
    type: "submission",
    read: false,
    createdAt: "2026-05-24T15:00:00Z",
    link: "/submissions/sub-2026-002"
  },
  {
    id: "notif-3",
    recipientUid: "teacher-002",
    title: "แผนการสอนต้องการการปรับปรุงแก้ไข",
    message: "แอดมินได้แจ้งข้อเสนอแนะในหัวข้อแผนการจัดการเรียนรู้ กรุณาตรวจสอบและส่งเวอร์ชันใหม่",
    type: "review",
    read: false,
    createdAt: "2026-05-23T11:00:00Z",
    link: "/submissions/sub-2026-003"
  }
];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: "log-1",
    actorUid: "admin-001",
    actorName: "กฤตพจน์ แอดมินบริหาร",
    actorRole: "admin",
    action: "CREATE_SUBMISSION_TOPIC",
    entityType: "SubmissionTopic",
    entityId: "topic-plan-1",
    timestamp: "2026-05-15T08:00:00Z",
    details: { title: "ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2)", dueDate: "2026-06-30" },
  },
  {
    id: "log-2",
    actorUid: "teacher-001",
    actorName: "ครูสมศรี ใจดีเลิศ",
    actorRole: "teacher",
    action: "SUBMIT_WORK_FOR_TOPIC",
    entityType: "Submission",
    entityId: "sub-2026-001",
    timestamp: "2026-05-20T10:30:00Z",
    details: { topicId: "topic-plan-1", title: "แผนการจัดการเรียนรู้ ว23101" },
  },
  {
    id: "log-3",
    actorUid: "admin-001",
    actorName: "กฤตพจน์ แอดมินบริหาร",
    actorRole: "admin",
    action: "ADMIN_APPROVE_SUBMISSION",
    entityType: "Submission",
    entityId: "sub-2026-001",
    timestamp: "2026-05-22T14:15:00Z",
    details: { decision: "passed" },
  }
];
