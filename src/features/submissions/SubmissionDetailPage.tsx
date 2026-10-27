import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getSubmissionById, 
  getVersionsBySubmissionId, 
  getReviewsBySubmissionId,
  getSubmissionRounds,
  getSubmissionTypes,
  getSubmissionTopics,
  addSubmissionVersion,
  submitAdminReview
} from '../../lib/storage';
import { triggerAutoSyncToGoogleSheets } from '../../lib/googleSheetsSync';
import { uploadFilesToGoogleDrive } from '../../lib/googleDriveService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  GraduationCap, 
  UploadCloud, 
  X, 
  ClipboardCheck,
  Eye,
  Lock,
  ShieldCheck,
  ShieldAlert,
  FolderOpen,
  Check,
  ListTodo,
  AlertCircle,
  HelpCircle,
  Sparkles,
  User,
  Upload,
  Tag
} from 'lucide-react';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';
import { DocumentViewerModal } from '../../components/common/DocumentViewerModal';
import { Submission, SubmissionVersion, ReviewRecord } from '../../types';

export const SubmissionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();

  // Reactive state synced with storage and Cloud Firestore
  const [submission, setSubmission] = useState<Submission | undefined>(() => id ? getSubmissionById(id) : undefined);
  const [versions, setVersions] = useState<SubmissionVersion[]>(() => id ? getVersionsBySubmissionId(id) : []);
  const [reviews, setReviews] = useState<ReviewRecord[]>(() => id ? getReviewsBySubmissionId(id) : []);
  const rounds = getSubmissionRounds();
  const types = getSubmissionTypes();
  const topics = getSubmissionTopics();

  const reloadSubmissionData = () => {
    if (id) {
      setSubmission(getSubmissionById(id));
      setVersions(getVersionsBySubmissionId(id));
      setReviews(getReviewsBySubmissionId(id));
    }
  };

  useEffect(() => {
    reloadSubmissionData();
    const handleDataChanged = () => reloadSubmissionData();
    window.addEventListener('sent_work_data_changed', handleDataChanged);
    window.addEventListener('storage', handleDataChanged);
    return () => {
      window.removeEventListener('sent_work_data_changed', handleDataChanged);
      window.removeEventListener('storage', handleDataChanged);
    };
  }, [id]);

  // Selected Version tab (defaults to current/highest version)
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(
    submission?.currentVersionNumber || 1
  );

  // Keep selected version up to date when submission changes
  useEffect(() => {
    if (submission?.currentVersionNumber) {
      setSelectedVersionNum(submission.currentVersionNumber);
    }
  }, [submission?.currentVersionNumber]);

  // Modals state
  // Modals state
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [viewerFile, setViewerFile] = useState<any | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);

  // Topic & Sub-tasks
  const topic = topics.find(t => t.id === submission?.topicId);
  const topicSubTasks = topic?.subTasks || [];

  // Helper to format submission title without redundant topic prefix
  const displaySubmissionTitle = useMemo(() => {
    if (submission?.topicTitle && submission.title.startsWith(`${submission.topicTitle} - `)) {
      return submission.title.replace(`${submission.topicTitle} - `, '');
    }
    return submission?.title || 'ผลงานครู';
  }, [submission]);

  // Review Form state (Admin only, NO scoring)
  const [reviewDecision, setReviewDecision] = useState<'passed' | 'revision_required'>('passed');
  const [reviewComments, setReviewComments] = useState('');
  const [reviewRecommendations, setReviewRecommendations] = useState('');
  const [subTaskReviewsState, setSubTaskReviewsState] = useState<Record<string, {
    decision: 'passed' | 'revision_required';
    feedback: string;
  }>>({});

  // Resubmit Form state
  const [resubmitNote, setResubmitNote] = useState('');
  const [resubmitFiles, setResubmitFiles] = useState<Array<{
    fileObject?: File;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    previewUrl?: string;
    downloadUrl?: string;
    driveFileId?: string;
    driveUrl?: string;
    subTaskId?: string;
    subTaskTitle?: string;
  }>>([]);
  const [resubmitLinks, setResubmitLinks] = useState<string[]>([]);
  const [resubmitLinkInput, setResubmitLinkInput] = useState('');

  if (!submission) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-base font-bold text-slate-800">ไม่พบข้อมูลผลงานที่ระบุ</p>
        <button
          onClick={() => navigate('/submissions')}
          className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          กลับสู่หน้ารายการ
        </button>
      </div>
    );
  }

  const round = rounds.find(r => r.id === submission.roundId);
  const type = types.find(t => t.id === submission.submissionTypeId);

  const activeVersion = versions.find(v => v.versionNumber === selectedVersionNum) || versions[0];
  const activeVersionReview = reviews.find(r => r.versionNumber === selectedVersionNum);

  // CRITICAL PRIVACY & ADMIN RULE
  const isOwnerTeacher = currentUser?.uid === submission.teacherUid;
  const isAdmin = 
    role === 'admin' || 
    currentUser?.role === 'admin' || 
    currentUser?.email?.toLowerCase() === 'drive.limited@gmail.com' ||
    Boolean(currentUser?.displayName && currentUser.displayName.includes('กฤตพจน์')) ||
    Boolean(currentUser?.displayName && currentUser.displayName.includes('แอดมิน')) ||
    Boolean(currentUser?.displayName && currentUser.displayName.includes('Admin'));
  const canAccessFiles = isAdmin || isOwnerTeacher;

  // STRICT ACCESS CONTROL: Non-admin users CANNOT view other teachers' submissions
  if (!canAccessFiles) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center space-y-4 shadow-sm animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          สงวนสิทธิ์การเข้าถึงไฟล์ผลงานเฉพาะครูเจ้าของผลงานและแอดมิน
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          ระบบไม่อนุญาตให้เปิดดูไฟล์ผลงานของครูท่านอื่น คุณครูสามารถเปิดดูและจัดการได้เฉพาะไฟล์ผลงานที่ตนเองส่งเท่านั้น เพื่อความปลอดภัยและความเป็นส่วนตัว
        </p>
        <div className="pt-3">
          <button
            onClick={() => navigate('/submissions')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับสู่หน้ารายการผลงานของฉัน
          </button>
        </div>
      </div>
    );
  }

  const canReview = isAdmin;
  const canResubmit = isOwnerTeacher;

  // Auto-initialize review state based on current version and review
  useEffect(() => {
    const initialSubReviews: Record<string, { decision: 'passed' | 'revision_required'; feedback: string }> = {};
    topicSubTasks.forEach((st, idx) => {
      const existing = activeVersionReview?.subTaskReviews?.[st.id];
      if (existing) {
        initialSubReviews[st.id] = {
          decision: existing.decision,
          feedback: existing.feedback || ''
        };
      } else if (submission?.status === 'revision_required') {
        const passedCount = submission.subTasksCount?.passed ?? 0;
        const isThisPassed = idx < passedCount;
        initialSubReviews[st.id] = {
          decision: isThisPassed ? 'passed' : 'revision_required',
          feedback: isThisPassed ? '' : 'กรุณาแก้ไขเอกสารในข้อนี้'
        };
      } else {
        initialSubReviews[st.id] = {
          decision: 'passed',
          feedback: ''
        };
      }
    });
    setSubTaskReviewsState(initialSubReviews);

    if (activeVersionReview) {
      setReviewDecision(activeVersionReview.decision === 'rejected' ? 'revision_required' : activeVersionReview.decision);
      setReviewComments(activeVersionReview.comments || '');
      setReviewRecommendations(activeVersionReview.recommendations || '');
    } else if (submission?.status === 'revision_required') {
      setReviewDecision('revision_required');
      setReviewComments('มีรายการงานย่อยที่ต้องปรับปรุงแก้ไข กรุณาตรวจสอบข้อเสนอแนะและส่งเวอร์ชันใหม่');
      setReviewRecommendations('');
    } else {
      setReviewDecision('passed');
      setReviewComments('เอกสารครบถ้วนสมบูรณ์ ถูกต้องตามเกณฑ์มาตรฐาน อนุมัติผ่านเรียบร้อย');
      setReviewRecommendations('');
    }
  }, [selectedVersionNum, activeVersionReview?.id, submission?.id, submission?.status, topicSubTasks.length]);

  const passedSubTasksCount = useMemo(() => {
    return topicSubTasks.filter(st => subTaskReviewsState[st.id]?.decision === 'passed').length;
  }, [topicSubTasks, subTaskReviewsState]);

  const allSubTasksPassed = topicSubTasks.length > 0 && passedSubTasksCount === topicSubTasks.length;

  // 1-Click Direct Quick Approve All (อนุมัติผ่านทั้งงานในคลิกเดียว พร้อมรับรองทุกงานย่อย 100%)
  const handleQuickApprove = () => {
    if (!currentUser) {
      Swal.fire('กรุณาเข้าสู่ระบบก่อน', '', 'warning');
      return;
    }
    if (!isAdmin) {
      Swal.fire('สงวนสิทธิ์เฉพาะแอดมิน', 'คุณต้องใช้สิทธิ์แอดมินในการอนุมัติผลงาน', 'warning');
      return;
    }

    Swal.fire({
      title: '✓ ยืนยันอนุมัติผ่านทั้งงาน?',
      html: `
        <div class="text-left text-sm space-y-3 text-slate-700">
          <p>คุณกำลังจะอนุมัติผลงาน <b>"${submission.title}"</b></p>
          <p>ครูผู้ส่ง: <b>${submission.teacherName}</b> (${submission.teacherDepartment || 'ทั่วไป'})</p>
          <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
            <b>ผลลัพธ์:</b> ระบบจะบันทึกสถานะ "ผ่านการอนุมัติ (Passed)" ให้กับงานรวม และรับรองให้ทุกงานย่อยผ่าน 100% พร้อมซิงค์ Google Sheets ทันที
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '✓ ยืนยันอนุมัติผ่านทันที',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b'
    }).then(async res => {
      if (res.isConfirmed) {
        let subTaskReviewsToSave: Record<string, {
          subTaskId: string;
          subTaskTitle: string;
          decision: 'passed' | 'revision_required';
          feedback?: string;
        }> | undefined = undefined;

        if (topicSubTasks.length > 0) {
          subTaskReviewsToSave = {};
          topicSubTasks.forEach(st => {
            subTaskReviewsToSave![st.id] = {
              subTaskId: st.id,
              subTaskTitle: st.title,
              decision: 'passed',
              feedback: 'ผ่านการรับรอง'
            };
          });
        }

        submitAdminReview(
          submission.id,
          'passed',
          'เอกสารครบถ้วนสมบูรณ์ ถูกต้องตามเกณฑ์มาตรฐาน อนุมัติผ่านเรียบร้อย',
          '',
          currentUser,
          subTaskReviewsToSave
        );

        triggerAutoSyncToGoogleSheets('ADMIN_QUICK_APPROVE');
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

        Swal.fire({
          title: 'อนุมัติผลงานสำเร็จ!',
          text: `ผลงาน "${submission.title}" ได้รับการอนุมัติผ่านการตรวจเรียบร้อยแล้ว`,
          icon: 'success',
          confirmButtonColor: '#059669',
          timer: 2000,
          showConfirmButton: false
        });

        reloadSubmissionData();
      }
    });
  };

  // 1-Click Request Revision (ส่งกลับให้แก้ไขทั้งงาน)
  const handleQuickRequestRevision = () => {
    if (!currentUser) return;
    if (!isAdmin) {
      Swal.fire('สงวนสิทธิ์เฉพาะแอดมิน', 'คุณต้องใช้สิทธิ์แอดมิน', 'warning');
      return;
    }

    Swal.fire({
      title: '⚠️ ส่งกลับให้คุณครูแก้ไขงาน?',
      html: `
        <div class="text-left text-sm space-y-3 text-slate-700">
          <p>ส่งข้อเสนอแนะเพื่อให้คุณครู <b>${submission.teacherName}</b> ปรับปรุงเอกสารและส่งเวอร์ชันใหม่:</p>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">จุดที่ต้องแก้ไข:</label>
            <textarea id="swal-revision-note" rows="3" class="swal2-textarea !m-0 !w-full !text-xs !p-2.5" placeholder="ระบุสิ่งที่ต้องการให้ครูปรับปรุงเพิ่มเติม..."></textarea>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '⚠️ ส่งกลับให้แก้ไข',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d97706',
      cancelButtonColor: '#64748b'
    }).then(async res => {
      if (res.isConfirmed) {
        const note = (document.getElementById('swal-revision-note') as HTMLTextAreaElement)?.value || 'กรุณาแก้ไขเอกสารตามข้อกำหนด';
        
        let subTaskReviewsToSave: any = undefined;
        if (topicSubTasks.length > 0) {
          subTaskReviewsToSave = {};
          topicSubTasks.forEach(st => {
            const current = subTaskReviewsState[st.id];
            subTaskReviewsToSave[st.id] = {
              subTaskId: st.id,
              subTaskTitle: st.title,
              decision: current?.decision || 'revision_required',
              feedback: current?.feedback || note.trim()
            };
          });
        }

        submitAdminReview(
          submission.id,
          'revision_required',
          note.trim(),
          'กรุณาปรับปรุงเอกสารและส่งเวอร์ชันใหม่',
          currentUser,
          subTaskReviewsToSave
        );

        triggerAutoSyncToGoogleSheets('ADMIN_REQUEST_REVISION');

        Swal.fire({
          title: 'ส่งแจ้งเตือนแก้ไขแล้ว!',
          text: `ส่งข้อเสนอแนะให้คุณครู ${submission.teacherName} เรียบร้อยแล้ว`,
          icon: 'info',
          confirmButtonColor: '#d97706',
          timer: 2000,
          showConfirmButton: false
        });

        reloadSubmissionData();
      }
    });
  };

  // Toggle single sub-task and auto-calculate overall decision
  const handleToggleSubTaskDecision = (subTaskId: string, decision: 'passed' | 'revision_required') => {
    setSubTaskReviewsState(prev => {
      const next = {
        ...prev,
        [subTaskId]: {
          ...prev[subTaskId],
          decision
        }
      };

      // Smart synchronization:
      // If any sub-task needs revision -> overall is revision_required
      // If all sub-tasks pass -> overall is passed
      const hasAnyRevision = topicSubTasks.some(st => next[st.id]?.decision === 'revision_required');
      if (hasAnyRevision) {
        setReviewDecision('revision_required');
        if (!reviewComments || reviewComments.includes('เอกสารครบถ้วนสมบูรณ์ ถูกต้องตามเกณฑ์')) {
          setReviewComments('มีรายการงานย่อยที่ต้องปรับปรุงแก้ไข กรุณาตรวจสอบข้อเสนอแนะและส่งเวอร์ชันใหม่');
        }
      } else {
        setReviewDecision('passed');
        if (!reviewComments || reviewComments.includes('มีรายการงานย่อยที่ต้องปรับปรุงแก้ไข')) {
          setReviewComments('เอกสารครบถ้วนสมบูรณ์ ถูกต้องตามเกณฑ์มาตรฐาน อนุมัติผ่านเรียบร้อย');
        }
      }

      return next;
    });
  };

  // Sub-task feedback note handler
  const handleSubTaskFeedbackChange = (subTaskId: string, feedback: string) => {
    setSubTaskReviewsState(prev => ({
      ...prev,
      [subTaskId]: {
        ...prev[subTaskId],
        feedback
      }
    }));
  };

  // 1-Click Pass all subtasks
  const handlePassAllSubTasks = () => {
    setSubTaskReviewsState(prev => {
      const next: typeof prev = {};
      topicSubTasks.forEach(st => {
        next[st.id] = {
          decision: 'passed',
          feedback: prev[st.id]?.feedback || ''
        };
      });
      return next;
    });
    setReviewDecision('passed');
    setReviewComments('เอกสารครบถ้วนสมบูรณ์ ถูกต้องตามเกณฑ์มาตรฐาน อนุมัติผ่านเรียบร้อย');
  };

  // Direct In-Page Review Submission
  const handleSubmitAdminReview = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) {
      Swal.fire('กรุณาเข้าสู่ระบบก่อน', '', 'warning');
      return;
    }
    if (!isAdmin) {
      Swal.fire('สงวนสิทธิ์เฉพาะแอดมิน', 'คุณต้องใช้สิทธิ์แอดมินในการอนุมัติผลงาน', 'warning');
      return;
    }

    const actualDecision = topicSubTasks.length > 0
      ? (allSubTasksPassed ? 'passed' : 'revision_required')
      : reviewDecision;

    // Prepare subTaskReviews if topic has subtasks
    let subTaskReviewsToSave: Record<string, {
      subTaskId: string;
      subTaskTitle: string;
      decision: 'passed' | 'revision_required';
      feedback?: string;
    }> | undefined = undefined;

    if (topicSubTasks.length > 0) {
      subTaskReviewsToSave = {};
      topicSubTasks.forEach(st => {
        const item = subTaskReviewsState[st.id];
        subTaskReviewsToSave![st.id] = {
          subTaskId: st.id,
          subTaskTitle: st.title,
          decision: item ? item.decision : 'passed',
          feedback: item?.feedback?.trim() || undefined
        };
      });
    }

    submitAdminReview(
      submission.id,
      actualDecision,
      reviewComments.trim() || (actualDecision === 'passed' ? 'เอกสารครบถ้วนสมบูรณ์ ถูกต้องตามเกณฑ์มาตรฐาน อนุมัติผ่านเรียบร้อย' : 'กรุณาปรับปรุงเอกสารตามคำแนะนำ'),
      reviewRecommendations.trim(),
      currentUser,
      subTaskReviewsToSave
    );

    triggerAutoSyncToGoogleSheets('ADMIN_SUBMIT_REVIEW');

    if (actualDecision === 'passed') {
      confetti({ particleCount: 70, spread: 60 });
    }

    Swal.fire({
      title: 'บันทึกผลการตรวจเรียบร้อย!',
      text: actualDecision === 'passed' ? 'อนุมัติผลงานผ่านเรียบร้อยแล้ว' : 'ส่งแจ้งเตือนให้ครูปรับปรุงแก้ไขเรียบร้อยแล้ว',
      icon: 'success',
      confirmButtonColor: '#2563eb',
      timer: 2000,
      showConfirmButton: false
    });

    setIsEditingReview(false);
    reloadSubmissionData();
  };

  const handleResubmitFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incomingFiles = Array.from(e.target.files).map(file => ({
      fileObject: file,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setResubmitFiles(prev => [...prev, ...incomingFiles]);
  };

  const handleAddResubmitLink = () => {
    if (!resubmitLinkInput.trim()) return;
    setResubmitLinks(prev => [...prev, resubmitLinkInput.trim()]);
    setResubmitLinkInput('');
  };

  const handleExecuteResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resubmitFiles.length === 0 && resubmitLinks.length === 0) {
      Swal.fire('กรุณาแนบไฟล์หรือลิงก์', 'กรุณาอัปโหลดเอกสารที่แก้ไขแล้วอย่างน้อย 1 รายการ', 'warning');
      return;
    }
    if (!currentUser || !submission) return;

    let finalFiles = [...resubmitFiles];
    let driveFolderUrl = 'https://drive.google.com/drive/folders/1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd';

    // Upload files to Google Drive
    const filesToUpload = resubmitFiles.filter(f => f.fileObject);
    if (filesToUpload.length > 0) {
      Swal.fire({
        title: 'กำลังอัปโหลดไฟล์เวอร์ชันใหม่ไปยัง Google Drive...',
        html: `
          <div class="text-left text-xs space-y-2 mt-2 text-slate-600">
            <p>ระบบกำลังบันทึกไฟล์แก้ไขเข้าสู่โฟลเดอร์ Google Drive ของสถานศึกษา...</p>
            <div class="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-mono text-[11px] truncate">
              📁 Google Drive / ${submission.topicTitle || 'ผลงานครู'} / ${currentUser.displayName} /
            </div>
            <p class="text-slate-400 text-[10px]">กรุณารอสักครู่ ห้ามปิดหน้าต่างนี้</p>
          </div>
        `,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const driveRes = await uploadFilesToGoogleDrive({
        topicTitle: submission.topicTitle || 'ผลงานครู',
        teacherName: currentUser.displayName,
        files: resubmitFiles
      });

      if (driveRes.success) {
        if (driveRes.folderUrl) driveFolderUrl = driveRes.folderUrl;
        finalFiles = resubmitFiles.map((f, i) => {
          const up = driveRes.files.find(uf =>
            uf.fileName === f.fileName ||
            (uf as any).originalName === f.fileName ||
            (uf as any).savedName === f.fileName
          ) || driveRes.files[i];

          const fileId = up?.fileId;
          const fileUrl = up?.fileUrl || (fileId ? `https://drive.google.com/file/d/${fileId}/view` : undefined);
          const previewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : (f.previewUrl || up?.previewUrl);
          const downloadUrl = up?.downloadUrl || (fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : undefined) || '#';

          return {
            fileName: f.fileName,
            fileSizeBytes: f.fileSizeBytes,
            mimeType: f.mimeType,
            previewUrl,
            downloadUrl,
            driveFileId: fileId,
            driveUrl: fileUrl,
            subTaskId: f.subTaskId,
            subTaskTitle: f.subTaskTitle
          };
        });
      }
    }

    addSubmissionVersion(
      submission.id,
      finalFiles,
      resubmitNote,
      resubmitLinks,
      currentUser
    );

    // Auto-sync update to Google Sheets
    triggerAutoSyncToGoogleSheets('TEACHER_RESUBMIT');

    const updatedSub = getSubmissionById(submission.id);
    const newVer = updatedSub?.currentVersionNumber || (submission.currentVersionNumber + 1);
    setSelectedVersionNum(newVer);
    reloadSubmissionData();

    setShowResubmitModal(false);
    confetti({ particleCount: 70, spread: 60 });

    Swal.fire({
      title: 'ส่งงานเวอร์ชันใหม่สำเร็จ!',
      html: `
        <div class="text-left text-xs space-y-2 mt-2 text-slate-600">
          <p>ส่งเวอร์ชัน ${newVer} เข้าระบบและบันทึกลง Google Drive เรียบร้อยแล้ว</p>
          <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-mono text-[11px] truncate">
            📁 Google Drive / ${submission.topicTitle || 'ผลงานครู'} / ${currentUser.displayName} /
          </div>
        </div>
      `,
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: '📂 ดูโฟลเดอร์ใน Google Drive',
      cancelButtonText: 'ตกลง',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(driveFolderUrl, '_blank');
      }
      reloadSubmissionData();
    });
  };

  const handleFileDownload = (file: any, subTaskTitle?: string) => {
    if (file.downloadUrl && file.downloadUrl !== '#') {
      window.open(file.downloadUrl, '_blank');
      return;
    }
    if (file.driveUrl) {
      window.open(file.driveUrl, '_blank');
      return;
    }
    if (file.driveFileId) {
      window.open(`https://drive.google.com/uc?export=download&id=${file.driveFileId}`, '_blank');
      return;
    }
    if (file.previewUrl && file.previewUrl.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = file.previewUrl;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    Swal.fire({
      title: 'ข้อมูลไฟล์เอกสาร',
      html: `
        <div class="text-left text-xs space-y-2 text-slate-700">
          <p><strong>ชื่อไฟล์:</strong> ${file.fileName}</p>
          <p><strong>งานย่อย:</strong> ${subTaskTitle || file.subTaskTitle || 'เอกสารหลัก'}</p>
          <div class="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-900">
            <p class="font-bold">📁 โฟลเดอร์ใน Google Drive:</p>
            <p class="font-mono text-[11px] mt-0.5">${file.folderPath || `Google Drive / ${submission?.topicTitle} / ${submission?.teacherName} /`}</p>
          </div>
          <p class="text-slate-500">กรุณาเข้าดูหรือดาวน์โหลดไฟล์ต้นฉบับผ่าน Google Drive ของสถาบัน</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'เปิด Google Drive',
      showCancelButton: true,
      cancelButtonText: 'ปิด',
      confirmButtonColor: '#059669'
    }).then(res => {
      if (res.isConfirmed) {
        window.open(file.driveUrl || 'https://drive.google.com/drive/folders/1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd', '_blank');
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับสู่รายการ
        </button>

        {canResubmit && (
          <button
            onClick={() => setShowResubmitModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-all hover:scale-[1.02]"
          >
            <UploadCloud className="w-4 h-4" />
            ส่งเวอร์ชันใหม่ (v{submission.currentVersionNumber + 1})
          </button>
        )}
      </div>

      {/* 👑 EXECUTIVE ADMIN ACTION BAR (ชัดเจน ตรงไปตรงมา ไม่สับสน) */}
      {isAdmin && (
        submission.status === 'passed' && !isEditingReview ? (
          <div className="bg-emerald-50 border-2 border-emerald-300 p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-emerald-950 flex items-center gap-2">
                  ✓ ผลงานนี้ได้รับการอนุมัติผ่านเรียบร้อยแล้ว (Passed 100%)
                </h2>
                <p className="text-xs text-emerald-800 mt-0.5">
                  ตรวจรับรองโดย: <b className="font-bold">{activeVersionReview?.reviewerName || 'ฝ่ายแอดมิน'}</b>
                  {activeVersionReview?.reviewedAt && (
                    <span> • เมื่อ {new Date(activeVersionReview.reviewedAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditingReview(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-100/70 text-emerald-900 border border-emerald-300 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>✏️ แก้ไขผลการตรวจใหม่</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> แผงตรวจงานของแอดมิน (Admin Review)
                  </span>
                  {topicSubTasks.length > 0 && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      งานย่อย {passedSubTasksCount}/{topicSubTasks.length} ข้อผ่าน
                    </span>
                  )}
                  {submission.status === 'revision_required' && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      สถานะปัจจุบัน: ต้องส่งแก้ไข
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  ตรวจรับรองผลงานของ: <span className="text-blue-400">{submission.teacherName}</span> (เวอร์ชัน v{submission.currentVersionNumber})
                </h2>
                <p className="text-xs text-slate-400">
                  คุณสามารถกดปุ่มอนุมัติผ่านทั้งงานในคลิกเดียว หรือตรวจละเอียดรายข้อในรายการด้านล่าง
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleQuickApprove}
                  className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
                  title="คลิกเดียวเพื่อรับรองผ่านทุกงานย่อยและอนุมัติผลงานนี้ทันที"
                >
                  <CheckCircle2 className="w-4 h-4 fill-emerald-200 text-slate-950" />
                  <span>⚡ อนุมัติผ่านทั้งงาน (1-Click)</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickRequestRevision}
                  className="px-4 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-400/40 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
                  title="แจ้งส่งผลงานกลับให้คุณครูแก้ไข"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>⚠️ ส่งกลับให้แก้ไข</span>
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Header Info Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                {submission.topicTitle || type?.name || topic?.category || 'ผลงานวิชาการ'}
              </span>
              <StatusBadge status={submission.status} isLate={submission.isLate} />
              {topicSubTasks.length > 0 && (
                <span className="text-xs sm:text-sm font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
                  มี {topicSubTasks.length} งานย่อย
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {displaySubmissionTitle}
            </h1>
          </div>

          <div className="flex-shrink-0">
            {isAdmin ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs sm:text-sm font-bold border border-rose-200 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-rose-600" /> สิทธิ์แอดมิน (เปิดดูไฟล์ได้)
              </span>
            ) : isOwnerTeacher ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-bold border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> งานของคุณ (เปิดดูไฟล์ได้)
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs sm:text-sm font-semibold border border-slate-200">
                <Lock className="w-4 h-4 text-amber-600" /> ไฟล์จำกัดสิทธิ์แอดมิน
              </span>
            )}
          </div>
        </div>

        {/* Metadata Details Bar */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-600">
          <div>
            <span className="text-xs font-medium text-slate-400 block">ครูผู้ส่งผลงาน</span>
            <span className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1.5 mt-1">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              {submission.teacherName}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-400 block">กลุ่มสาระการเรียนรู้</span>
            <span className="font-bold text-sm sm:text-base text-slate-900 truncate block mt-1">
              {submission.teacherDepartment || 'ทั่วไป'}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-400 block">หัวข้อเรื่องที่แอดมินมอบหมาย</span>
            <span className="font-bold text-sm sm:text-base text-blue-700 truncate block mt-1" title={submission.topicTitle}>
              {submission.topicTitle || round?.title || 'หัวข้อทั่วไป'}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-400 block">วันที่ส่งล่าสุด</span>
            <span className="font-bold text-sm sm:text-base text-slate-900 block mt-1">
              {new Date(submission.updatedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Version Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> ประวัติเวอร์ชัน:
        </span>
        {versions.map(v => (
          <button
            key={v.id}
            onClick={() => setSelectedVersionNum(v.versionNumber)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedVersionNum === v.versionNumber
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            เวอร์ชัน {v.versionNumber}
            {v.versionNumber === submission.currentVersionNumber && (
              <span className={`text-[10px] px-1 py-0.2 rounded font-normal ${selectedVersionNum === v.versionNumber ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                ล่าสุด
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content: Files & Review Result */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Version Files & Teacher Note (2 cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* SUB-TASKS BREAKDOWN CARD (ตรวจละเอียดรายชิ้นงานย่อยบนหน้าจอทันที ไม่ต้องเปิดป๊อปอัปให้สับสน) */}
          {topicSubTasks.length > 0 && (
            <div id="subtasks-review-section" className="bg-white p-6 rounded-3xl border-2 border-purple-200/90 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <ListTodo className="w-5 h-5 text-purple-700" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      ตรวจรับรองรายชื่องานย่อย (เวอร์ชัน {selectedVersionNum})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isAdmin 
                        ? 'คลิกปุ่ม [✓ ผ่าน] หรือ [⚠️ ให้แก้ไข] ในแต่ละงานย่อย ระบบจะปรับสถานะภาพรวมให้อัตโนมัติ'
                        : 'ผลการตรวจรับรองงานย่อยแต่ละรายการจากฝ่ายแอดมิน'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                    allSubTasksPassed 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                    ผ่านแล้ว {passedSubTasksCount}/{topicSubTasks.length} รายการ ({Math.round((passedSubTasksCount / topicSubTasks.length) * 100)}%)
                  </span>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handlePassAllSubTasks}
                      className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="กดเพื่อให้ทุกงานย่อยผ่าน 100% ทันที"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>✓ ให้ผ่านทุกข้อ</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3.5">
                {topicSubTasks.map((st, idx) => {
                  const state = subTaskReviewsState[st.id] || { decision: 'passed', feedback: '' };
                  const subReview = activeVersionReview?.subTaskReviews?.[st.id];
                  const attachedFiles = activeVersion?.files?.filter(f => f.subTaskId === st.id) || [];
                  
                  // In Admin mode, reflect reactive interactive state; in teacher mode, reflect saved review
                  const isPassed = isAdmin ? state.decision === 'passed' : subReview?.decision === 'passed';
                  const isRevision = isAdmin ? state.decision === 'revision_required' : subReview?.decision === 'revision_required';
                  const isPending = !isAdmin && !subReview;

                  return (
                    <div 
                      key={st.id}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        isPassed 
                          ? 'bg-emerald-50/40 border-emerald-200' 
                          : isRevision 
                            ? 'bg-amber-50/50 border-amber-300' 
                            : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                              {idx + 1}. {st.title}
                            </span>
                            {st.isRequired && (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                จำเป็น *
                              </span>
                            )}
                          </div>
                          {st.description && (
                            <p className="text-[11px] text-slate-500">
                              {st.description}
                            </p>
                          )}
                        </div>

                        {/* Status / Interactive Admin Toggle */}
                        <div className="flex-shrink-0">
                          {isAdmin ? (
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleToggleSubTaskDecision(st.id, 'passed')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                  state.decision === 'passed'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                                }`}
                                title="รับรองผ่านงานย่อยนี้"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>ผ่าน</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleSubTaskDecision(st.id, 'revision_required')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                  state.decision === 'revision_required'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                                }`}
                                title="แจ้งให้ครูแก้ไขงานย่อยนี้"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>ให้แก้ไข</span>
                              </button>
                            </div>
                          ) : (
                            <div>
                              {isPassed && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" /> ผ่านการรับรอง
                                </span>
                              )}
                              {isRevision && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> ต้องส่งแก้ไข
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" /> รอตรวจ
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Attached files under this sub-task */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                        <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                          📎 ไฟล์แนบสำหรับงานนี้ ({attachedFiles.length} ไฟล์):
                        </span>
                        {attachedFiles.length > 0 ? (
                          <div className="space-y-1.5">
                            {attachedFiles.map(file => (
                              <div 
                                key={file.id} 
                                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                  <span className="font-medium text-slate-800 truncate" title={file.fileName}>
                                    {file.fileName}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    ({(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Direct In-App File Viewer (เปิดดูไฟล์โดยตรง ไม่ต้องดาวน์โหลด) */}
                                  <button
                                    type="button"
                                    onClick={() => setViewerFile({
                                      ...file,
                                      subTaskTitle: st.title,
                                      subTaskId: st.id
                                    })}
                                    className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                    title="เปิดอ่านเนื้อหาเอกสารในระบบทันที ไม่ต้องดาวน์โหลด"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>เปิดดูไฟล์</span>
                                  </button>

                                  {/* Open in Google Drive Link */}
                                  <a
                                    href={file.driveUrl || `https://drive.google.com/drive/folders/1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-semibold transition-all inline-flex items-center gap-1 shadow-2xs"
                                    title="เปิดดูไฟล์ใน Google Drive"
                                  >
                                    <FolderOpen className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Drive</span>
                                  </a>

                                  {/* Real Download Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleFileDownload(file, st.title)}
                                    className="text-slate-600 hover:text-blue-700 p-1.5 font-semibold text-xs inline-flex items-center gap-1 border border-slate-200 hover:border-blue-300 rounded-xl bg-slate-50 hover:bg-white transition-colors cursor-pointer"
                                    title="ดาวน์โหลดสำเนาไฟล์นี้"
                                  >
                                    <Download className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="hidden sm:inline">ดาวน์โหลด</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-amber-700/80 italic bg-amber-50/50 p-2 rounded-xl border border-amber-200/50">
                            ⚠️ ยังไม่มีไฟล์แนบเฉพาะสำหรับงานย่อยนี้ (หากครูแนบรวมไว้ที่ไฟล์ด้านล่าง สามารถตรวจรับรองได้)
                          </p>
                        )}
                      </div>

                      {/* Admin feedback input / display for this sub-task */}
                      {isAdmin ? (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/50">
                          <input
                            type="text"
                            value={state.feedback}
                            onChange={(e) => handleSubTaskFeedbackChange(st.id, e.target.value)}
                            placeholder="ข้อเสนอแนะเฉพาะงานย่อยนี้ (เช่น หน้า 4 ขาดลายเซ็นผู้บริหาร, แนบแบบประเมิน)..."
                            className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                      ) : (
                        subReview?.feedback && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 space-y-0.5">
                            <span className="font-bold block">💬 ข้อเสนอแนะจากแอดมิน:</span>
                            <p className="whitespace-pre-line">{subReview.feedback}</p>
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Admin Review Workspace & Single Definitive Save Button */}
              {isAdmin && (
                <div className="pt-4 mt-2 border-t border-purple-100 space-y-4">
                  {/* Feedback Comments */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      ความคิดเห็น / บันทึกการตรวจถึงคุณครู:
                    </label>
                    <textarea
                      rows={2}
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="ระบุข้อความรับรอง หรือระบุภาพรวมการตรวจ..."
                      className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    />
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      ข้อเสนอแนะเพิ่มเติมสำหรับการจัดการเรียนรู้ (ถ้ามี):
                    </label>
                    <input
                      type="text"
                      value={reviewRecommendations}
                      onChange={(e) => setReviewRecommendations(e.target.value)}
                      placeholder="ระบุคำแนะนำพัฒนาเพิ่มเติม..."
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    />
                  </div>

                  {/* Smart Result Notification */}
                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    allSubTasksPassed
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      {allSubTasksPassed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>งานย่อยผ่านครบทุกข้อ ({passedSubTasksCount}/{topicSubTasks.length}) • พร้อมบันทึกอนุมัติผ่านทั้งงาน</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>มีงานย่อยที่เลือกให้แก้ไข ({topicSubTasks.length - passedSubTasksCount} ข้อ) • ระบบจะบันทึกสถานะส่งกลับให้ครูแก้ไข</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* One Clear Action Button */}
                  <button
                    type="button"
                    onClick={() => handleSubmitAdminReview()}
                    className={`w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                      allSubTasksPassed
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                        : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                    }`}
                  >
                    {allSubTasksPassed ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>✓ ยืนยันบันทึกผล: อนุมัติผ่านทั้งงาน (Approve 100%)</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5" />
                        <span>⚠️ ยืนยันบันทึกผล: ส่งกลับให้ครูแก้ไข (Request Revision)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ADMIN REVIEW WORKSPACE FOR TOPICS WITHOUT SUB-TASKS */}
          {isAdmin && topicSubTasks.length === 0 && (
            <div className="bg-white p-6 rounded-3xl border-2 border-blue-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    พิจารณาผลการตรวจ (Admin Review)
                  </h3>
                  <p className="text-[11px] text-slate-500">เลือกผลการพิจารณาและบันทึกผลการตรวจ</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                  reviewDecision === 'passed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}>
                  {reviewDecision === 'passed' ? '✓ อนุมัติผ่าน' : '⚠️ ส่งกลับแก้ไข'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setReviewDecision('passed');
                    setReviewComments('เอกสารครบถ้วนสมบูรณ์ ถูกต้องตามเกณฑ์มาตรฐาน อนุมัติผ่านเรียบร้อย');
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                    reviewDecision === 'passed'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                    reviewDecision === 'passed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-sm block">อนุมัติผ่านทั้งงาน</span>
                    <span className="text-xs text-slate-500">เอกสารถูกต้องครบถ้วน</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReviewDecision('revision_required');
                    setReviewComments('มีจุดที่ต้องปรับปรุงแก้ไข กรุณาตรวจสอบข้อเสนอแนะและส่งเวอร์ชันใหม่');
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                    reviewDecision === 'revision_required'
                      ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                    reviewDecision === 'revision_required' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    ⚠️
                  </div>
                  <div>
                    <span className="font-bold text-sm block">ส่งกลับให้ครูแก้ไข</span>
                    <span className="text-xs text-slate-500">แจ้งเตือนให้ครูปรับปรุง</span>
                  </div>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ความคิดเห็นการตรวจผลงาน:
                </label>
                <textarea
                  rows={2}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="ระบุข้อความรับรอง หรือแจ้งจุดที่ตรวจสอบแล้ว..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>

              <button
                type="button"
                onClick={() => handleSubmitAdminReview()}
                className={`w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  reviewDecision === 'passed' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{reviewDecision === 'passed' ? '✓ บันทึกผล: อนุมัติผ่านทั้งงาน' : '⚠️ บันทึกผล: ส่งกลับให้ครูแก้ไข'}</span>
              </button>
            </div>
          )}

          {/* Attached Files Card (All files in this version) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>ไฟล์เอกสารและหลักฐานทั้งหมดในเวอร์ชัน {selectedVersionNum}</span>
              <span className="text-xs font-normal text-slate-400">
                {activeVersion?.files?.length || 0} ไฟล์แนบ
              </span>
            </h3>

            {/* Topic Folder Destination Notice */}
            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200/80 flex items-center gap-2.5 text-xs text-blue-900">
              <FolderOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-semibold block text-[11px] text-blue-900">
                  โฟลเดอร์จัดเก็บผลงานตามชื่องาน (Google Drive):
                </span>
                <span className="font-mono text-[11px] text-blue-700 font-bold truncate block">
                  📁 Google Drive / {submission?.topicTitle || 'ผลงานครู'} /
                </span>
              </div>
              <span className="text-[10px] text-blue-700 font-semibold bg-white px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                จัดเข้าโฟลเดอร์เรียบร้อย
              </span>
            </div>

            {/* CHECK FILE ACCESS: Admin or Owner Teacher only */}
            {canAccessFiles ? (
              activeVersion?.files && activeVersion.files.length > 0 ? (
                <div className="space-y-2">
                  {activeVersion.files.map((file) => (
                    <div
                      key={file.id}
                      className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase">
                          {file.fileName.split('.').pop() || 'FILE'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{file.fileName}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                            <span>{(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                            <span>•</span>
                            <span>แนบเมื่อ {new Date(file.uploadedAt).toLocaleDateString('th-TH')}</span>
                            {file.subTaskTitle && (
                              <>
                                <span>•</span>
                                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 truncate">
                                  งานย่อย: {file.subTaskTitle}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Direct In-App File Viewer */}
                        <button
                          type="button"
                          onClick={() => setViewerFile(file)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs group"
                          title="เปิดดูเนื้อหาเอกสารในระบบ ไม่ต้องดาวน์โหลด"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600 group-hover:text-white" />
                          <span>เปิดดูไฟล์</span>
                        </button>
                        {/* Open in Google Drive */}
                        <a
                          href={file.driveUrl || `https://drive.google.com/drive/folders/1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-semibold transition-all inline-flex items-center gap-1 shadow-2xs"
                          title="เปิดดูไฟล์ใน Google Drive"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Drive</span>
                        </a>

                        {/* Real Download Button */}
                        <button
                          type="button"
                          onClick={() => handleFileDownload(file, file.subTaskTitle)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-2xs transition-colors cursor-pointer text-xs"
                          title="ดาวน์โหลดสำเนาไฟล์นี้ลงในเครื่อง"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ดาวน์โหลด</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  ไม่มีไฟล์แนบในเวอร์ชันนี้
                </div>
              )
            ) : (
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs space-y-2 text-center">
                <Lock className="w-6 h-6 text-amber-600 mx-auto" />
                <p className="font-bold">จำกัดสิทธิ์การเข้าถึงไฟล์เอกสาร</p>
                <p className="text-[11px] text-amber-700 max-w-sm mx-auto">
                  ไฟล์เอกสารและผลงานของครูท่านนี้เปิดดูได้เฉพาะฝ่ายแอดมิน และครูผู้เป็นเจ้าของผลงานเท่านั้น
                </p>
              </div>
            )}

            {/* External Links */}
            {activeVersion?.externalLinks && activeVersion.externalLinks.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block mb-2">ลิงก์ผลงานภายนอก:</span>
                <div className="space-y-1.5">
                  {activeVersion.externalLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-200 text-blue-600 transition-colors text-xs"
                    >
                      <span className="truncate">{link}</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 ml-2 text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Teacher Submission Note */}
          {activeVersion?.note && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-slate-700">หมายเหตุจากครูผู้ส่งผลงาน (เวอร์ชัน {selectedVersionNum})</h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-line">
                {activeVersion.note}
              </p>
            </div>
          )}

        </div>

        {/* Right Column: Information, Teacher Details & Google Drive Workspace */}
        <div className="space-y-6">

          {/* Card 1: Review Status Card (สรุปสถานะการตรวจรับรอง) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                สถานะการตรวจรับรอง (เวอร์ชัน {selectedVersionNum})
              </h3>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                activeVersionReview?.decision === 'passed' || submission.status === 'passed'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : activeVersionReview?.decision === 'revision_required' || submission.status === 'revision_required'
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-blue-50 text-blue-900 border-blue-300'
              }`}>
                {activeVersionReview?.decision === 'passed' || submission.status === 'passed'
                  ? '✓ อนุมัติผ่านแล้ว'
                  : activeVersionReview?.decision === 'revision_required' || submission.status === 'revision_required'
                    ? '⚠️ ต้องแก้ไข'
                    : '⏳ รอแอดมินตรวจ'}
              </span>
            </div>

            {/* Sub-tasks progress meter if topic has sub-tasks */}
            {topicSubTasks.length > 0 && (
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">ความคืบหน้างานย่อย:</span>
                  <span className="font-bold text-blue-600">{passedSubTasksCount} / {topicSubTasks.length} ข้อ ({Math.round((passedSubTasksCount / topicSubTasks.length) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${(passedSubTasksCount / topicSubTasks.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Review feedback details if reviewed */}
            {activeVersionReview ? (
              <div className="space-y-3 pt-1">
                {activeVersionReview.comments && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-600">ความเห็นการตรวจสอบ:</span>
                    <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-line font-medium">
                      {activeVersionReview.comments}
                    </p>
                  </div>
                )}

                {activeVersionReview.recommendations && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-amber-900">ข้อเสนอแนะเพิ่มเติม:</span>
                    <p className="text-xs text-slate-800 bg-amber-50/70 p-3 rounded-xl border border-amber-200 leading-relaxed font-medium">
                      {activeVersionReview.recommendations}
                    </p>
                  </div>
                )}

                <div className="pt-2 text-[11px] text-slate-400 text-right border-t border-slate-100">
                  ตรวจโดย <b>{activeVersionReview.reviewerName}</b> • {new Date(activeVersionReview.reviewedAt).toLocaleString('th-TH')}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-1.5">
                <Clock className="w-5 h-5 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">ยังไม่ได้รับการตรวจประเมิน</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {isAdmin 
                    ? 'แอดมินสามารถให้คะแนนและบันทึกผลได้จากแผงงานย่อยด้านซ้าย' 
                    : 'คุณครูส่งผลงานเวอร์ชันนี้แล้ว และกำลังรอฝ่ายบริหาร/แอดมินตรวจ'}
                </p>
              </div>
            )}

            {/* Quick action for teacher when revision required or updating */}
            {!isAdmin && isOwnerTeacher && (
              <button
                type="button"
                onClick={() => setShowResubmitModal(true)}
                className={`w-full mt-2 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  submission.status === 'revision_required' || activeVersionReview?.decision === 'revision_required'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>
                  {submission.status === 'revision_required' || activeVersionReview?.decision === 'revision_required'
                    ? `⚠️ ส่งงานเวอร์ชันใหม่ตามคำแนะนำ (v${submission.currentVersionNumber + 1})`
                    : `🚀 ส่งงานเวอร์ชันใหม่เพิ่มเติม (v${submission.currentVersionNumber + 1})`}
                </span>
              </button>
            )}
          </div>

          {/* Card 2: Teacher Profile Card (ข้อมูลครูผู้ส่งผลงาน) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-blue-600" />
              ข้อมูลครูผู้ส่งผลงาน
            </h3>
            
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md flex-shrink-0">
                {submission.teacherName?.slice(0, 2) || 'ครู'}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{submission.teacherName}</h4>
                <p className="text-xs text-slate-500 truncate">{submission.teacherDepartment || 'กลุ่มสาระการเรียนรู้'}</p>
                <p className="text-[11px] text-slate-400 truncate">{submission.teacherEmail}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block">วันที่ส่งเข้าระบบ</span>
                <span className="font-bold text-slate-700 block truncate">
                  {new Date(submission.submittedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block">เวอร์ชันปัจจุบัน</span>
                <span className="font-bold text-blue-600 block">
                  v{submission.currentVersionNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Google Drive Sync & Direct Folder Access */}
          <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 p-6 rounded-3xl border border-blue-200/80 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-blue-950 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-600" />
                คลัง Google Drive
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                ซิงค์สด 100%
              </span>
            </div>

            <p className="text-xs text-blue-900 leading-relaxed font-mono bg-white/80 p-2.5 rounded-xl border border-blue-200/60 truncate" title={`Google Drive / ${submission.topicTitle || 'ผลงานครู'} / ${submission.teacherName} /`}>
              📁 Drive / {submission.topicTitle || 'ผลงานครู'} / {submission.teacherName}
            </p>

            <a
              href={
                activeVersion?.files?.find(f => f.driveUrl && f.driveUrl.includes('drive.google.com'))?.driveUrl 
                || 'https://drive.google.com/drive/folders/1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>เปิดดูโฟลเดอร์ใน Google Drive</span>
            </a>
          </div>

          {/* Card 4: Topic Criteria & Constraints */}
          {(topic || round) && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <Tag className="w-4 h-4 text-emerald-600" />
                ข้อกำหนดของหัวข้องาน
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">หมวดหมู่งาน:</span>
                  <span className="font-bold text-slate-800">{topic?.category || 'เอกสารวิชาการ'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">กำหนดส่ง:</span>
                  <span className="font-bold text-slate-800">
                    {(topic?.dueDate || round?.dueAt) 
                      ? new Date(topic?.dueDate || round?.dueAt!).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) 
                      : 'ไม่ระบุ'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">รูปแบบไฟล์:</span>
                  <span className="font-medium text-slate-600">
                    {topic?.allowedFileExtensions?.join(', ') || '.pdf, .docx, .xlsx'}
                  </span>
                </div>
                {(topic?.academicYear || round?.academicYear) && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">ภาคเรียน/ปีการศึกษา:</span>
                    <span className="font-bold text-slate-700">
                      {topic?.semester || round?.semester || '1'}/{topic?.academicYear || round?.academicYear || '2569'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Resubmit New Version Modal */}
      {showResubmitModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">ส่งงานเวอร์ชันใหม่ (v{submission.currentVersionNumber + 1})</h3>
                <p className="text-xs text-slate-500">แนบไฟล์เอกสารที่ปรับปรุงตามข้อเสนอแนะของแอดมิน</p>
              </div>
              <button onClick={() => setShowResubmitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteResubmit} className="space-y-4">
              <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-blue-900">
                <FolderOpen className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <p className="font-bold">ซิงค์ลง Google Drive อัตโนมัติ:</p>
                  <p className="font-mono text-[11px] text-blue-700 truncate">
                    📁 Google Drive / {submission.topicTitle || 'ผลงานครู'} / {currentUser?.displayName} /
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  อัปโหลดไฟล์ที่แก้ไขแล้ว <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleResubmitFileChange}
                  className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-xl p-2 cursor-pointer"
                />
                {resubmitFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {resubmitFiles.map((f, i) => (
                      <p key={i} className="text-[11px] text-slate-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {f.fileName}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  บันทึกการแก้ไข / สิ่งที่ปรับปรุงในเวอร์ชันนี้
                </label>
                <textarea
                  rows={3}
                  value={resubmitNote}
                  onChange={(e) => setResubmitNote(e.target.value)}
                  placeholder="เช่น ปรับปรุงเอกสารเพิ่มเติมตามคำแนะนำของแอดมิน..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResubmitModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-all"
                >
                  ยืนยันการส่งเวอร์ชันใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Featured Direct Document Viewer Modal (เปิดอ่านไฟล์ได้ทันทีโดยไม่ต้องดาวน์โหลด) */}
      <DocumentViewerModal
        isOpen={!!viewerFile}
        onClose={() => setViewerFile(null)}
        file={viewerFile}
        teacherName={submission.teacherName}
        teacherDepartment={submission.teacherDepartment}
        topicTitle={submission.topicTitle || round?.title}
        canReview={isAdmin}
        subTaskDecision={viewerFile?.subTaskId ? subTaskReviewsState[viewerFile.subTaskId]?.decision : undefined}
        onSubTaskDecisionChange={viewerFile?.subTaskId ? (subTaskId, dec) => handleToggleSubTaskDecision(subTaskId, dec) : undefined}
        subTaskFeedback={viewerFile?.subTaskId ? subTaskReviewsState[viewerFile.subTaskId]?.feedback : undefined}
        onSubTaskFeedbackChange={viewerFile?.subTaskId ? (subTaskId, fb) => handleSubTaskFeedbackChange(subTaskId, fb) : undefined}
      />

    </div>
  );
};
