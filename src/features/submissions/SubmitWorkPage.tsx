import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getSubmissionTopics, 
  createSubmission,
  getSubmissions,
  getSettings
} from '../../lib/storage';
import { uploadFilesToGoogleDrive } from '../../lib/googleDriveService';
import { SubmissionTopic, TopicSubTask, Submission } from '../../types';
import { 
  UploadCloud, 
  FileText, 
  Link as LinkIcon, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Clock, 
  Paperclip, 
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  FolderOpen
} from 'lucide-react';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

export const SubmitWorkPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedTopicId = searchParams.get('topicId');

  const topics = useMemo(() => getSubmissionTopics().filter(t => t.isActive), []);
  const allSubmissions = useMemo(() => getSubmissions(), []);

  // Map of teacher's submissions by topicId
  const mySubmissionsByTopic = useMemo(() => {
    if (!currentUser) return {} as Record<string, Submission>;
    const map: Record<string, Submission> = {};
    allSubmissions
      .filter(s => s.teacherUid === currentUser.uid)
      .forEach(s => {
        map[s.topicId] = s;
      });
    return map;
  }, [allSubmissions, currentUser]);

  const [selectedTopicId, setSelectedTopicId] = useState<string>(() => {
    if (preselectedTopicId && topics.some(t => t.id === preselectedTopicId)) {
      return preselectedTopicId;
    }
    // Select first unsubmitted topic if exists, else first topic
    const firstUnsubmitted = topics.find(t => !allSubmissions.some(s => s.teacherUid === currentUser?.uid && s.topicId === t.id));
    return firstUnsubmitted?.id || topics[0]?.id || '';
  });

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Files state
  const [files, setFiles] = useState<Array<{
    fileObject?: File;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    previewUrl?: string;
    subTaskId?: string;
    subTaskTitle?: string;
  }>>([]);

  // Links state
  const [links, setLinks] = useState<string[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [newLinkInput, setNewLinkInput] = useState('');

  const selectedTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
  const existingSubmission = selectedTopic ? mySubmissionsByTopic[selectedTopic.id] : undefined;

  useEffect(() => {
    if (preselectedTopicId && topics.some(t => t.id === preselectedTopicId)) {
      setSelectedTopicId(preselectedTopicId);
    }
  }, [preselectedTopicId, topics]);

  // Auto-generate title & default note when selected topic changes
  useEffect(() => {
    if (selectedTopic) {
      setTitle(`${selectedTopic.title} - ${currentUser?.displayName || 'ครูผู้สอน'}`);
      setNote('ส่งเอกสารหลักฐานครบถ้วนตามข้อกำหนด พร้อมรับการตรวจรับรอง');
    }
  }, [selectedTopicId]);

  const getRemainingTime = (dueIso?: string) => {
    if (!dueIso) return null;
    const now = new Date().getTime();
    const due = new Date(dueIso).getTime();
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return { text: `เลยกำหนดส่ง (${Math.abs(diffDays)} วัน)`, isOverdue: true };
    }
    if (diffDays === 0) {
      return { text: 'ครบกำหนดส่งวันนี้!', isOverdue: false, isUrgent: true };
    }
    return { text: `เหลือเวลาอีก ${diffDays} วัน`, isOverdue: false, isUrgent: diffDays <= 3 };
  };

  const remaining = selectedTopic ? getRemainingTime(selectedTopic.dueDate) : null;

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedTopic) return;
    const incomingFiles = Array.from(e.target.files);
    const allowedExts = selectedTopic.allowedFileExtensions.map(ext => ext.toLowerCase());
    const validFiles: typeof files = [];
    const invalidFiles: string[] = [];

    incomingFiles.forEach(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (allowedExts.includes(ext) || allowedExts.length === 0) {
        validFiles.push({
          fileObject: file,
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type || 'application/octet-stream',
          previewUrl: (file.type.startsWith('image/') || file.type === 'application/pdf') ? URL.createObjectURL(file) : undefined,
        });
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      Swal.fire({
        title: 'ประเภทไฟล์ไม่รองรับ',
        text: `ไฟล์ที่เลือกไม่ตรงกับประเภทที่กำหนด (${allowedExts.join(', ')}): ${invalidFiles.join(', ')}`,
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
    }

    if (files.length + validFiles.length > (selectedTopic.maxFiles || 10)) {
      Swal.fire({
        title: 'เกินจำนวนไฟล์สูงสุด',
        text: `แนบไฟล์ได้สูงสุด ${selectedTopic.maxFiles} ไฟล์`,
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileSubTask = (fileIndex: number, subTaskId: string) => {
    const subTask = selectedTopic?.subTasks?.find(s => s.id === subTaskId);
    setFiles(prev => prev.map((f, i) => {
      if (i !== fileIndex) return f;
      return {
        ...f,
        subTaskId: subTaskId ? subTaskId : undefined,
        subTaskTitle: subTask ? subTask.title : undefined,
      };
    }));
  };

  const handleAddLink = () => {
    if (!newLinkInput.trim()) return;
    if (!newLinkInput.startsWith('http://') && !newLinkInput.startsWith('https://')) {
      Swal.fire('URL ไม่ถูกต้อง', 'กรุณากรอกลิงก์ที่ขึ้นต้นด้วย https:// หรือ http://', 'warning');
      return;
    }
    setLinks(prev => [...prev, newLinkInput.trim()]);
    setNewLinkInput('');
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTopic) {
      Swal.fire('ไม่พบหัวข้อส่งงาน', 'กรุณาเลือกหัวข้อส่งงานที่ต้องการส่ง', 'warning');
      return;
    }

    if (!title.trim()) {
      Swal.fire('กรุณาระบุชื่องาน', 'กรุณาระบุชื่องานที่ต้องการส่ง', 'warning');
      return;
    }

    if (files.length === 0 && links.length === 0) {
      Swal.fire('กรุณาแนบไฟล์หรือลิงก์', 'กรุณาอัปโหลดเอกสารผลงานอย่างน้อย 1 ไฟล์', 'warning');
      return;
    }

    executeSubmission();
  };

  const executeSubmission = async () => {
    if (!currentUser || !selectedTopic) return;
    const settings = getSettings();
    const driveFolderId = settings.googleDriveRootFolderId || '1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd';
    setIsSubmitting(true);

    try {
      let uploadedFilesList = files.map(f => ({
        fileName: f.fileName,
        fileSizeBytes: f.fileSizeBytes,
        mimeType: f.mimeType,
        previewUrl: f.previewUrl,
        downloadUrl: '#',
        driveFileId: undefined as string | undefined,
        driveUrl: undefined as string | undefined,
        subTaskId: f.subTaskId,
        subTaskTitle: f.subTaskTitle
      }));

      let driveFolderUrl = `https://drive.google.com/drive/folders/${driveFolderId}`;
      let needsAuth = false;

      if (files.length > 0) {
        Swal.fire({
          title: 'กำลังอัปโหลดไฟล์ไปยัง Google Drive...',
          html: `
            <div class="text-left text-xs space-y-2 mt-2 text-slate-600">
              <p>ระบบกำลังบันทึกไฟล์เข้าสู่โฟลเดอร์ Google Drive ของสถานศึกษา...</p>
              <div class="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-mono text-[11px] truncate">
                📁 Google Drive / ${selectedTopic.title} / ${currentUser.displayName} /
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
          topicTitle: selectedTopic.title,
          teacherName: currentUser.displayName,
          files: files
        });

        if (driveRes.success) {
          if (driveRes.folderUrl) driveFolderUrl = driveRes.folderUrl;
          uploadedFilesList = files.map((f, i) => {
            const up = driveRes.files.find(uf => 
              uf.fileName === f.fileName || 
              (uf as any).originalName === f.fileName || 
              (uf as any).savedName === f.fileName ||
              (uf.subTaskId && uf.subTaskId === f.subTaskId)
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
              folderName: currentUser.displayName,
              folderPath: `Google Drive / ${selectedTopic.title} / ${currentUser.displayName} /`,
              subTaskId: f.subTaskId,
              subTaskTitle: f.subTaskTitle
            };
          });
        } else if (driveRes.needsAuthorization) {
          needsAuth = true;
        }
      }

      const newSub = createSubmission(
        {
          topicId: selectedTopic.id,
          topicTitle: selectedTopic.title,
          teacherUid: currentUser.uid,
          teacherName: currentUser.displayName,
          teacherEmail: currentUser.email,
          teacherDepartment: currentUser.learningAreaName || 'กลุ่มสาระการเรียนรู้ทั่วไป',
          title: title.trim(),
        },
        uploadedFilesList,
        note,
        links,
        currentUser
      );

      // Celebration effect
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (needsAuth) {
        Swal.fire({
          title: 'บันทึกงานเรียบร้อยแล้ว',
          text: 'บันทึกข้อมูลการส่งงานสำเร็จ (ระบบกำลังรอเชื่อมต่อสิทธิ์ Google Drive ครั้งแรก)',
          icon: 'success',
          confirmButtonColor: '#2563eb'
        }).then(() => {
          navigate('/submissions');
        });
      } else {
        Swal.fire({
          title: '🎉 ส่งผลงานสำเร็จเรียบร้อย!',
          html: `
            <div class="text-left text-xs space-y-2 mt-2 text-slate-600">
              <p>ระบบได้บันทึกผลงานของคุณครูและอัปโหลดเข้าสู่ Google Drive เรียบร้อยแล้ว</p>
              <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                <p class="font-bold text-xs">ชื่องาน: ${newSub.title}</p>
                <p class="text-[11px] text-emerald-700">จำนวนไฟล์: ${uploadedFilesList.length} รายการ • เวอร์ชัน: v${newSub.currentVersionNumber}</p>
              </div>
            </div>
          `,
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: '📂 ดูโฟลเดอร์ใน Google Drive',
          cancelButtonText: 'ดูรายการงานที่ส่งแล้ว',
          confirmButtonColor: '#2563eb',
          cancelButtonColor: '#64748b'
        }).then((result) => {
          if (result.isConfirmed) {
            window.open(driveFolderUrl, '_blank');
          }
          navigate('/submissions');
        });
      }

    } catch (err: any) {
      console.error('Submission error:', err);
      Swal.fire('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถส่งงานได้ กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (topics.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 my-8">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">ขณะนี้ยังไม่มีหัวข้อส่งงานที่เปิดรับ</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          ฝ่ายวิชาการยังไม่ได้เปิดรอบหรือสร้างหัวข้อเรื่องส่งงาน กรุณารอประกาศรอบส่งงานถัดไปครับ
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  const subTasks = selectedTopic?.subTasks || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              ระบบส่งงานครูออนไลน์
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">ง่ายและสะดวกใน 3 ขั้นตอน</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <UploadCloud className="w-6 h-6 text-blue-600" />
            ส่งงานวิชาการ (Submit Work)
          </h2>
        </div>

        <Link
          to="/submissions"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>ดูรายการที่เคยส่งแล้ว</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ========================================================
              LEFT COLUMN: STEP 1 - SELECT TOPIC & DETAILS
             ======================================================== */}
          <div className="lg:col-span-5 space-y-5">
            
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    เลือกหัวข้องานที่ต้องการส่ง
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-rose-500">* จำเป็น</span>
              </div>

              {/* Clean Topic Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  หัวข้อเรื่องที่เปิดรับส่งขณะนี้:
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-2xs"
                >
                  {topics.map(t => {
                    const sub = mySubmissionsByTopic[t.id];
                    const isSubmitted = !!sub;
                    return (
                      <option key={t.id} value={t.id}>
                        {isSubmitted ? '✓ [ส่งแล้ว] ' : '○ [ยังไม่ส่ง] '} 
                        [{t.category}] {t.title}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Status Banner of Selected Topic */}
              {existingSubmission ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      คุณเคยส่งงานนี้แล้ว (v{existingSubmission.currentVersionNumber})
                    </span>
                    <Link
                      to={`/submissions/${existingSubmission.id}`}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-0.5"
                    >
                      เปิดดู <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    สถานะปัจจุบัน: <b>{existingSubmission.status === 'passed' ? 'อนุมัติผ่านแล้ว' : existingSubmission.status === 'revision_required' ? 'ต้องส่งแก้ไข' : 'รอฝ่ายตรวจประเมิน'}</b> (ส่งใหม่ได้ ระบบจะสร้างเวอร์ชันใหม่ให้อัตโนมัติ)
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-xs font-medium">
                    คุณยังไม่ได้ส่งงานในหัวข้อนี้
                  </span>
                </div>
              )}

              {/* Selected Topic Details Card */}
              {selectedTopic && (
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-blue-600 text-white">
                      {selectedTopic.category}
                    </span>
                    {remaining && (
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                        remaining.isOverdue
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : remaining.isUrgent
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {remaining.text}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {selectedTopic.title}
                    </h4>
                    {selectedTopic.description && (
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed whitespace-pre-line bg-white p-2.5 rounded-xl border border-slate-200/70">
                        {selectedTopic.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      ครบกำหนด: {new Date(selectedTopic.dueDate).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      {selectedTopic.allowedFileExtensions.join(', ')}
                    </span>
                  </div>

                  {/* Friendly Subtasks Checklist */}
                  {subTasks.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                      <p className="text-[11px] font-bold text-slate-700">
                        📋 รายการงานย่อยที่ฝ่ายวิชาการแนะนำ ({subTasks.length} รายการ):
                      </p>
                      <ul className="space-y-1">
                        {subTasks.map((st, i) => (
                          <li key={st.id} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="truncate">{st.title}</span>
                            {st.isRequired && (
                              <span className="text-[9px] text-rose-500 font-bold ml-auto flex-shrink-0">
                                (จำเป็น)
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>

          {/* ========================================================
              RIGHT COLUMN: STEP 2 (ATTACH FILES) & STEP 3 (SUBMIT)
             ======================================================== */}
          <div className="lg:col-span-7 space-y-5">

            {/* STEP 2: ATTACH FILES */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                    2
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      แนบไฟล์เอกสารผลงาน
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      รองรับ PDF, Word, Excel, PowerPoint, รูปภาพ (สูงสุด {selectedTopic?.maxFiles || 5} ไฟล์)
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-rose-500">* จำเป็น</span>
              </div>

              {/* Single Clean Dropzone */}
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-6 text-center transition-all cursor-pointer relative bg-slate-50/40 group">
                <input
                  type="file"
                  multiple
                  accept={selectedTopic?.allowedFileExtensions.join(',') || '.pdf,.docx,.doc,.xlsx,.pptx'}
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์มาวางที่นี่
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ไฟล์จะถูกนำไปจัดเก็บเข้าโฟลเดอร์ Google Drive ของคุณครูอัตโนมัติ
                    </p>
                  </div>
                </div>
              </div>

              {/* Attached Files List */}
              {files.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>ไฟล์ที่เลือกไว้ ({files.length} รายการ):</span>
                    <button
                      type="button"
                      onClick={() => setFiles([])}
                      className="text-[11px] text-slate-400 hover:text-rose-600 font-normal"
                    >
                      ลบไฟล์ทั้งหมด
                    </button>
                  </div>

                  <div className="space-y-2">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                            {file.fileName.split('.').pop()?.toUpperCase() || 'FILE'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800 truncate" title={file.fileName}>
                              {file.fileName}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>

                        {/* Optional Sub-task tag */}
                        {subTasks.length > 0 && (
                          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                            <select
                              value={file.subTaskId || ''}
                              onChange={(e) => updateFileSubTask(idx, e.target.value)}
                              className="text-[10px] font-medium py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none"
                            >
                              <option value="">-- ไม่ระบุงานย่อย --</option>
                              {subTasks.map((st, i) => (
                                <option key={st.id} value={st.id}>
                                  งานที่ {i + 1}: {st.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                          title="ลบไฟล์นี้"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Links Toggle */}
              {selectedTopic?.allowExternalLinks && (
                <div className="pt-2 border-t border-slate-100">
                  {!showLinkInput ? (
                    <button
                      type="button"
                      onClick={() => setShowLinkInput(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1.5"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>+ ต้องการแนบลิงก์ผลงานภายนอก (Canva, Google Drive, YouTube ฯลฯ)</span>
                    </button>
                  ) : (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                          <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                          ระบุลิงก์ผลงานภายนอก:
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowLinkInput(false)}
                          className="text-[10px] text-slate-400 hover:text-slate-600"
                        >
                          ซ่อนช่องลิงก์
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newLinkInput}
                          onChange={(e) => setNewLinkInput(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddLink}
                          className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
                        >
                          เพิ่ม
                        </button>
                      </div>

                      {links.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {links.map((lnk, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs">
                              <span className="text-blue-600 truncate max-w-[280px]">{lnk}</span>
                              <button
                                type="button"
                                onClick={() => removeLink(i)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* STEP 3: WORK DETAILS & SUBMIT */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                    3
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      ตรวจสอบชื่องานและกดยืนยันส่ง
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      ระบบตั้งชื่อให้อัตโนมัติ สามารถกดส่งได้ทันที
                    </p>
                  </div>
                </div>
              </div>

              {/* Work Title Input (Auto-filled) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>ชื่องานที่ส่ง:</span>
                  <span className="text-[10px] text-slate-400 font-normal">(แก้ไขได้หากต้องการระบุหน่วยการเรียนรู้)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  required
                />
              </div>

              {/* Optional Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>หมายเหตุเพิ่มเติมถึงฝ่ายตรวจ (ถ้ามี):</span>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น ส่งฉบับสมบูรณ์ พร้อมแผนการสอนและโครงสร้างรายวิชา..."
                  className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                {/* Quick 3 pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">ข้อความด่วน:</span>
                  <button
                    type="button"
                    onClick={() => setNote('ส่งเอกสารหลักฐานครบถ้วนตามข้อกำหนด พร้อมรับการตรวจรับรอง')}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] transition-colors"
                  >
                    📄 ส่งเอกสารครบถ้วน
                  </button>
                  <button
                    type="button"
                    onClick={() => setNote('ส่งงานฉบับปรับปรุงแก้ไขเพิ่มเติมตามคำแนะนำของฝ่ายตรวจ')}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] transition-colors"
                  >
                    ✏️ ส่งฉบับแก้ไข
                  </button>
                </div>
              </div>

              {/* Big Submit Button */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span>บันทึกเข้า Google Drive อัตโนมัติ</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : '🚀 ยืนยันการส่งงาน'}</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      </form>

    </div>
  );
};
