import React, { useState, useEffect } from 'react';
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
  Sparkles
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [viewerFile, setViewerFile] = useState<any | null>(null);

  // Topic & Sub-tasks
  const topic = topics.find(t => t.id === submission?.topicId);
  const topicSubTasks = topic?.subTasks || [];

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
  const canResubmit = isOwnerTeacher && (submission.status === 'revision_required' || submission.status === 'rejected');

  // 1-Click Direct Quick Approve
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
      title: '✓ ยืนยันอนุมัติผลงานผ่าน?',
      html: `
        <div class="text-left text-sm space-y-3 text-slate-700">
          <p>คุณกำลังจะอนุมัติผลงาน <b>"${submission.title}"</b></p>
          <p>ครูผู้ส่ง: <b>${submission.teacherName}</b> (${submission.teacherDepartment || 'ทั่วไป'})</p>
          <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
            <b>ผลลัพธ์:</b> ระบบจะบันทึกสถานะ "ผ่านการตรวจรับรอง (Passed)" ให้กับทุกงานย่อย อัปเดต Cloud Firestore และซิงค์ตาราง Google Sheets ทันที
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">ความเห็นการอนุมัติ:</label>
            <input id="swal-quick-comment" class="swal2-input !m-0 !w-full !text-xs !py-2" value="เอกสารครบถ้วนสมบูรณ์ ถูกต้องตามเกณฑ์มาตรฐาน อนุมัติผ่านเรียบร้อย" />
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
        const comment = (document.getElementById('swal-quick-comment') as HTMLInputElement)?.value || 'อนุมัติผ่านเรียบร้อย';
        submitAdminReview(
          submission.id,
          'passed',
          comment.trim(),
          '',
          currentUser
        );
        triggerAutoSyncToGoogleSheets('ADMIN_QUICK_APPROVE');
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        Swal.fire({
          title: 'อนุมัติผลงานสำเร็จ!',
          text: `ผลงาน "${submission.title}" ได้รับการอนุมัติผ่านการตรวจเรียบร้อยแล้ว`,
          icon: 'success',
          confirmButtonColor: '#059669'
        });
        reloadSubmissionData();
      }
    });
  };

  // 1-Click Request Revision
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
            <textarea id="swal-revision-note" rows="3" class="swal2-textarea !m-0 !w-full !text-xs !p-2.5" placeholder="เช่น รบกวนเพิ่มเติมแบบบันทึกผลการประเมินท้ายหน่วย และใบงานกิจกรรม แล้วส่งเวอร์ชันใหม่..."></textarea>
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
        submitAdminReview(
          submission.id,
          'revision_required',
          note.trim(),
          'กรุณาปรับปรุงเอกสารและส่งเวอร์ชันใหม่',
          currentUser
        );
        triggerAutoSyncToGoogleSheets('ADMIN_REQUEST_REVISION');
        Swal.fire({
          title: 'ส่งแจ้งเตือนแก้ไขแล้ว!',
          text: `ส่งข้อเสนอแนะให้คุณครู ${submission.teacherName} เรียบร้อยแล้ว`,
          icon: 'info',
          confirmButtonColor: '#d97706'
        });
        reloadSubmissionData();
      }
    });
  };

  const openReviewModal = () => {
    const initialSubReviews: Record<string, { decision: 'passed' | 'revision_required'; feedback: string }> = {};
    topicSubTasks.forEach(st => {
      const existing = activeVersionReview?.subTaskReviews?.[st.id];
      initialSubReviews[st.id] = {
        decision: existing?.decision || 'passed',
        feedback: existing?.feedback || ''
      };
    });
    setSubTaskReviewsState(initialSubReviews);

    // If there's an existing review, use its values
    if (activeVersionReview) {
      setReviewDecision(activeVersionReview.decision === 'rejected' ? 'revision_required' : activeVersionReview.decision);
      setReviewComments(activeVersionReview.comments || '');
      setReviewRecommendations(activeVersionReview.recommendations || '');
    } else {
      setReviewDecision('passed');
      setReviewComments('เอกสารครบถ้วนสมบูรณ์ ถูกต้องตามเกณฑ์มาตรฐาน อนุมัติผ่านเรียบร้อย');
      setReviewRecommendations('');
    }

    setShowReviewModal(true);
  };

  const handleToggleSubTaskDecision = (subTaskId: string, decision: 'passed' | 'revision_required') => {
    setSubTaskReviewsState(prev => {
      const next = {
        ...prev,
        [subTaskId]: {
          ...prev[subTaskId],
          decision
        }
      };
      // Auto-set overall review decision: If any sub-task needs revision, overall decision becomes revision_required
      const hasAnyRevision = Object.values(next).some(r => r.decision === 'revision_required');
      setReviewDecision(hasAnyRevision ? 'revision_required' : 'passed');
      return next;
    });
  };

  const handleSubTaskFeedbackChange = (subTaskId: string, feedback: string) => {
    setSubTaskReviewsState(prev => ({
      ...prev,
      [subTaskId]: {
        ...prev[subTaskId],
        feedback
      }
    }));
  };

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
  };

  const handleSubmitAdminReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      Swal.fire('กรุณาเข้าสู่ระบบก่อน', '', 'warning');
      return;
    }
    if (!isAdmin) {
      Swal.fire('สงวนสิทธิ์เฉพาะแอดมิน', 'คุณต้องใช้สิทธิ์แอดมินในการอนุมัติผลงาน', 'warning');
      return;
    }

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
      reviewDecision,
      reviewComments.trim(),
      reviewRecommendations.trim(),
      currentUser,
      subTaskReviewsToSave
    );

    triggerAutoSyncToGoogleSheets('ADMIN_SUBMIT_REVIEW');
    setShowReviewModal(false);

    if (reviewDecision === 'passed') {
      confetti({ particleCount: 70, spread: 60 });
    }

    Swal.fire({
      title: 'บันทึกผลการตรวจสอบเรียบร้อย!',
      text: reviewDecision === 'passed' ? 'อนุมัติผลงานผ่านเรียบร้อยแล้ว' : 'ส่งแจ้งเตือนให้ครูปรับปรุงแก้ไขเรียบร้อยแล้ว',
      icon: 'success',
      confirmButtonColor: '#2563eb'
    });
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

    setShowResubmitModal(false);
    confetti({ particleCount: 70, spread: 60 });

    Swal.fire({
      title: 'ส่งงานเวอร์ชันใหม่สำเร็จ!',
      html: `
        <div class="text-left text-xs space-y-2 mt-2 text-slate-600">
          <p>ส่งเวอร์ชัน ${submission.currentVersionNumber + 1} เข้าระบบและบันทึกลง Google Drive เรียบร้อยแล้ว</p>
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
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับสู่รายการ
        </button>

        <div className="flex items-center gap-2">
          {canReview && (
            <button
              onClick={handleQuickApprove}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              อนุมัติผ่านทันที
            </button>
          )}

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
      </div>

      {/* 👑 EXECUTIVE ADMIN APPROVAL CENTER (ปุ่มอนุมัติเด่น ชัดเจน มองง่าย กดได้ใน 1 คลิก) */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-7 rounded-3xl border-2 border-blue-400/40 shadow-2xl text-white space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-blue-500/25 text-blue-300 font-bold text-xs sm:text-sm border border-blue-400/30">
                  <ShieldCheck className="w-4 h-4 text-blue-400" /> แผงควบคุมการอนุมัติ (Admin Approval Center)
                </span>
                <span className="text-xs sm:text-sm text-slate-300 font-medium">
                  เวอร์ชันปัจจุบัน: <b className="text-white">v{submission.currentVersionNumber}</b>
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  สถานะการตรวจ:
                </h2>
                {submission.status === 'passed' ? (
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-base font-bold shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> อนุมัติผ่านเรียบร้อยแล้ว (Passed)
                  </span>
                ) : submission.status === 'revision_required' ? (
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/40 text-base font-bold shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-400" /> ส่งกลับให้ครูแก้ไข (Revision)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-400/40 text-base font-bold shadow-sm animate-pulse">
                    <Clock className="w-5 h-5 text-amber-300" /> รอแอดมินพิจารณาอนุมัติ
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300">
                ครูผู้ส่ง: <b className="text-white font-bold">{submission.teacherName}</b> • กลุ่มสาระ: <b className="text-white">{submission.teacherDepartment || 'ทั่วไป'}</b>
                {topicSubTasks.length > 0 && ` • มีงานย่อย ${topicSubTasks.length} รายการ`}
              </p>
            </div>

            {/* ACTION BUTTONS (HIGH CONTRAST, LARGE, VISIBLE, 1-CLICK APPROVE) */}
            <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
              {/* 1-Click Quick Approve */}
              <button
                type="button"
                onClick={handleQuickApprove}
                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-emerald-500/30 transition-all cursor-pointer flex items-center gap-2 hover:shadow-emerald-400/50"
                title="คลิกเดียวเพื่ออนุมัติรับรองผลงานนี้ทันที"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950 fill-emerald-200" />
                <span>✓ กดอนุมัติผ่านทันที (Quick Approve)</span>
              </button>

              {/* Request Revision */}
              <button
                type="button"
                onClick={handleQuickRequestRevision}
                className="px-4 py-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-400/40 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
                title="แจ้งส่งผลงานกลับให้คุณครูแก้ไข"
              >
                <AlertCircle className="w-4 h-4" />
                <span>⚠️ ส่งกลับให้แก้ไข</span>
              </button>

              {/* Detailed Review */}
              <button
                type="button"
                onClick={openReviewModal}
                className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
                title="เปิดแบบฟอร์มตรวจสอบละเอียดแยกงานย่อยแต่ละข้อ"
              >
                <ClipboardCheck className="w-4 h-4 text-blue-300" />
                <span>ตรวจละเอียดรายข้อ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                {type?.name || topic?.category || 'ผลงานวิชาการ'}
              </span>
              <StatusBadge status={submission.status} isLate={submission.isLate} />
              {topicSubTasks.length > 0 && (
                <span className="text-xs sm:text-sm font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
                  มี {topicSubTasks.length} งานย่อย
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {submission.title}
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

          {/* SUB-TASKS BREAKDOWN CARD (แสดงรายการงานย่อยและการตรวจรับรอง) */}
          {topicSubTasks.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-purple-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    รายการงานย่อยและการตรวจรับรอง (ในเวอร์ชัน {selectedVersionNum})
                  </h3>
                </div>
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {topicSubTasks.length} รายการ
                </span>
              </div>

              <div className="space-y-3">
                {topicSubTasks.map((st, idx) => {
                  const subReview = activeVersionReview?.subTaskReviews?.[st.id];
                  const attachedFiles = activeVersion?.files?.filter(f => f.subTaskId === st.id) || [];
                  const isPassed = subReview?.decision === 'passed';
                  const isRevision = subReview?.decision === 'revision_required';
                  const isPending = !subReview;

                  return (
                    <div 
                      key={st.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isPassed 
                          ? 'bg-emerald-50/40 border-emerald-200' 
                          : isRevision 
                            ? 'bg-amber-50/40 border-amber-300' 
                            : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">
                              {idx + 1}. {st.title}
                            </span>
                            {st.isRequired && (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                จำเป็น *
                              </span>
                            )}
                          </div>
                          {st.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {st.description}
                            </p>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0">
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
                                    className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition-all inline-flex items-center gap-1.5"
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
                          <p className="text-[11px] text-slate-400 italic">
                            (ไม่มีไฟล์แนบเฉพาะสำหรับงานย่อยนี้)
                          </p>
                        )}
                      </div>

                      {/* Admin feedback for this sub-task */}
                      {subReview?.feedback && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 space-y-0.5">
                          <span className="font-bold block">💬 ข้อเสนอแนะจากแอดมิน:</span>
                          <p className="whitespace-pre-line">{subReview.feedback}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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

        {/* Right Column: Admin Review Result (1 col) */}
        <div className="space-y-6">

          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>ผลการตรวจรับรอง (เวอร์ชัน {selectedVersionNum})</span>
              {activeVersionReview && (
                <span className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-xl ${
                  activeVersionReview.decision === 'passed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  activeVersionReview.decision === 'revision_required' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                  'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  {activeVersionReview.decision === 'passed' ? '✓ ผ่านเรียบร้อย' :
                   activeVersionReview.decision === 'revision_required' ? '⚠️ ส่งแก้ไข' : '✕ ไม่ผ่าน'}
                </span>
              )}
            </h3>

            {activeVersionReview ? (
              <div className="space-y-4">
                {/* Decision Banner */}
                <div className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 ${
                  activeVersionReview.decision === 'passed' 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                    : activeVersionReview.decision === 'revision_required'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  {activeVersionReview.decision === 'passed' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : activeVersionReview.decision === 'revision_required' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm sm:text-base">
                      {activeVersionReview.decision === 'passed' && 'ผลงานได้รับการอนุมัติผ่าน'}
                      {activeVersionReview.decision === 'revision_required' && 'ต้องแก้ไขตามคำแนะนำของแอดมิน'}
                      {activeVersionReview.decision === 'rejected' && 'ไม่ผ่านการรับรอง'}
                    </p>
                    <p className="text-xs sm:text-sm opacity-90 mt-1 leading-relaxed">
                      {activeVersionReview.decision === 'passed' && 'เอกสารถูกต้องตามเกณฑ์และครบถ้วนสมบูรณ์'}
                      {activeVersionReview.decision === 'revision_required' && 'กรุณาปรับปรุงเอกสารแล้วส่งเวอร์ชันใหม่'}
                      {activeVersionReview.decision === 'rejected' && 'เอกสารไม่ตรงตามข้อกำหนด'}
                    </p>
                  </div>
                </div>

                {/* Sub-tasks status summary in review */}
                {activeVersionReview.subTaskReviews && (
                  <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
                    <span className="text-xs font-bold text-purple-950 block">สรุปการตรวจงานย่อย:</span>
                    {Object.values(activeVersionReview.subTaskReviews).map((sr, i) => (
                      <div key={i} className="flex items-center justify-between text-xs sm:text-sm bg-white p-2 rounded-xl border border-purple-100">
                        <span className="text-slate-800 font-medium truncate">{sr.subTaskTitle}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ml-2 ${
                          sr.decision === 'passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {sr.decision === 'passed' ? '✓ ผ่าน' : '⚠️ แก้ไข'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comments */}
                {activeVersionReview.comments && (
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-700 block mb-1">ความเห็นการตรวจสอบ:</span>
                    <p className="text-xs sm:text-sm text-slate-800 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed whitespace-pre-line font-medium">
                      {activeVersionReview.comments}
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                {activeVersionReview.recommendations && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-amber-900 block mb-1">ข้อเสนอแนะเพิ่มเติม:</span>
                    <p className="text-xs sm:text-sm text-slate-800 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 leading-relaxed font-medium">
                      {activeVersionReview.recommendations}
                    </p>
                  </div>
                )}

                <p className="text-xs text-slate-400 pt-1 text-right">
                  ตรวจโดย <b>{activeVersionReview.reviewerName}</b> (Admin) • {new Date(activeVersionReview.reviewedAt).toLocaleString('th-TH')}
                </p>

                {/* Action buttons inside card */}
                {canReview && (
                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleQuickApprove}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      ✓ อนุมัติผ่าน (Approve)
                    </button>
                    <button
                      type="button"
                      onClick={openReviewModal}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ClipboardCheck className="w-4 h-4 text-blue-600" />
                      แก้ไขผลการตรวจ / ตรวจละเอียดรายข้อ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-slate-800">รอแอดมินพิจารณาอนุมัติ</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    คุณครูส่งผลงานเวอร์ชันนี้เข้าระบบแล้ว และกำลังรอฝ่ายแอดมินตรวจสอบ
                  </p>
                </div>

                {canReview && (
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={handleQuickApprove}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      ✓ กดอนุมัติผ่านทันที
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleQuickRequestRevision}
                        className="py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        ส่งกลับแก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={openReviewModal}
                        className="py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        ตรวจละเอียด
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Admin Review Modal (WITH SUB-TASKS CHECKING) */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">ตรวจรับรองผลงาน (ฝ่ายแอดมิน)</h3>
                <p className="text-xs text-slate-500">ผลงาน: {submission.title} (เวอร์ชัน {selectedVersionNum})</p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdminReview} className="space-y-4">

              {/* Sub-tasks evaluation section if topic has sub-tasks */}
              {topicSubTasks.length > 0 && (
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                        <ListTodo className="w-4 h-4 text-purple-700" />
                        ตรวจสอบรายชื่องานย่อย ({topicSubTasks.length} รายการ)
                      </h4>
                      <p className="text-[10px] text-purple-700 mt-0.5">
                        เลือก "ผ่าน" หรือ "ต้องแก้ไข" แยกตามงานย่อยแต่ละข้อ พร้อมระบุคำแนะนำ
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handlePassAllSubTasks}
                      className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      ตรวจผ่านทุกงานย่อย
                    </button>
                  </div>

                  <div className="space-y-3">
                    {topicSubTasks.map((st, idx) => {
                      const state = subTaskReviewsState[st.id] || { decision: 'passed', feedback: '' };
                      const attachedFiles = activeVersion?.files?.filter(f => f.subTaskId === st.id) || [];

                      return (
                        <div key={st.id} className="p-3 bg-white rounded-xl border border-purple-100 space-y-2 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {idx + 1}. {st.title} {st.isRequired ? '(จำเป็น)' : ''}
                              </span>
                              
                              {/* Attached files buttons for instant previewing in review mode */}
                              {attachedFiles.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  <span className="text-[10px] text-slate-500 font-medium">เปิดดูไฟล์งานนี้:</span>
                                  {attachedFiles.map(af => (
                                    <button
                                      key={af.id}
                                      type="button"
                                      onClick={() => setViewerFile({
                                        ...af,
                                        subTaskTitle: st.title,
                                        subTaskId: st.id
                                      })}
                                      className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1 shadow-2xs group"
                                      title="คลิกเพื่อเปิดอ่านไฟล์เอกสารนี้ทันทีโดยไม่ต้องดาวน์โหลด"
                                    >
                                      <Eye className="w-3 h-3 text-blue-600 group-hover:text-white" />
                                      <span className="truncate max-w-[180px]">{af.fileName}</span>
                                      <span className="text-[9px] text-blue-400 group-hover:text-blue-100">({(af.fileSizeBytes / 1024 / 1024).toFixed(1)}MB)</span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] text-rose-500 italic block pt-0.5">
                                  ⚠️ ยังไม่มีไฟล์แนบเฉพาะสำหรับงานย่อยนี้
                                </span>
                              )}
                            </div>

                            {/* Decision buttons */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleSubTaskDecision(st.id, 'passed')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  state.decision === 'passed'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                ✓ ผ่าน
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleSubTaskDecision(st.id, 'revision_required')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  state.decision === 'revision_required'
                                    ? 'bg-amber-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                ⚠️ ต้องแก้ไข
                              </button>
                            </div>
                          </div>

                          {/* Sub-task feedback note */}
                          <input
                            type="text"
                            value={state.feedback}
                            onChange={(e) => handleSubTaskFeedbackChange(st.id, e.target.value)}
                            placeholder="บันทึกข้อเสนอแนะเฉพาะงานย่อยนี้ (เช่น ขาดแบบประเมินท้ายหน่วย)..."
                            className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Overall Decision */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">
                  สรุปผลการพิจารณาภาพรวม <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="passed"
                      checked={reviewDecision === 'passed'}
                      onChange={() => setReviewDecision('passed')}
                      className="sr-only peer"
                    />
                    <div className="p-4 rounded-2xl border-2 border-slate-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-50/70 peer-checked:text-emerald-950 transition-all flex items-center gap-3 shadow-2xs hover:border-slate-300">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 peer-checked:border-emerald-300 peer-checked:bg-emerald-600 peer-checked:text-white flex items-center justify-center font-bold text-base flex-shrink-0 text-emerald-600">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm sm:text-base block">อนุมัติ / ผ่านเรียบร้อย</span>
                        <span className="text-xs text-slate-500 block">เอกสารถูกต้องครบถ้วน</span>
                      </div>
                    </div>
                  </label>

                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="revision_required"
                      checked={reviewDecision === 'revision_required'}
                      onChange={() => setReviewDecision('revision_required')}
                      className="sr-only peer"
                    />
                    <div className="p-4 rounded-2xl border-2 border-slate-200 peer-checked:border-amber-500 peer-checked:bg-amber-50/70 peer-checked:text-amber-950 transition-all flex items-center gap-3 shadow-2xs hover:border-slate-300">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 peer-checked:border-amber-300 peer-checked:bg-amber-500 peer-checked:text-white flex items-center justify-center font-bold text-base flex-shrink-0 text-amber-600">
                        ⚠️
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm sm:text-base block">ส่งกลับให้ครูแก้ไข</span>
                        <span className="text-xs text-slate-500 block">ต้องปรับปรุงเอกสารเพิ่ม</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-800">
                  ความคิดเห็นการตรวจผลงาน
                </label>
                <textarea
                  rows={3}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="ระบุข้อความรับรอง หรือแจ้งจุดที่ตรวจสอบแล้ว..."
                  className="w-full text-sm rounded-xl border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-800">
                  ข้อเสนอแนะเพิ่มเติม (ถ้ามี)
                </label>
                <textarea
                  rows={2}
                  value={reviewRecommendations}
                  onChange={(e) => setReviewRecommendations(e.target.value)}
                  placeholder="ระบุคำแนะนำเพิ่มเติมสำหรับการจัดการเรียนรู้หรือเอกสาร..."
                  className="w-full text-sm rounded-xl border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`px-6 py-3 rounded-2xl text-white text-sm sm:text-base font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                    reviewDecision === 'passed'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                  }`}
                >
                  {reviewDecision === 'passed' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>✓ ยืนยันอนุมัติผลงานผ่าน (Approve)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-white" />
                      <span>⚠️ ยืนยันส่งกลับให้แก้ไข (Request Revision)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
