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
  FolderPlus, 
  FolderOpen, 
  AlertTriangle, 
  Info,
  Calendar,
  Check,
  ListTodo,
  Sparkles,
  ExternalLink,
  Filter
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

  // Filter topics by teacher's submission status for easy navigation
  const [statusFilter, setStatusFilter] = useState<'all' | 'unsubmitted' | 'submitted'>('all');

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

  // Topic submission stats for current teacher
  const submittedCount = useMemo(() => {
    return topics.filter(t => {
      const sub = mySubmissionsByTopic[t.id];
      return sub && sub.status !== 'revision_required';
    }).length;
  }, [topics, mySubmissionsByTopic]);

  const revisionCount = useMemo(() => {
    return topics.filter(t => mySubmissionsByTopic[t.id]?.status === 'revision_required').length;
  }, [topics, mySubmissionsByTopic]);

  const unsubmittedCount = topics.length - submittedCount - revisionCount;

  // Filtered topics list based on tab
  const filteredTopics = useMemo(() => {
    if (statusFilter === 'all') return topics;
    if (statusFilter === 'submitted') {
      return topics.filter(t => {
        const sub = mySubmissionsByTopic[t.id];
        return sub && sub.status !== 'revision_required';
      });
    }
    // unsubmitted (includes revision_required)
    return topics.filter(t => {
      const sub = mySubmissionsByTopic[t.id];
      return !sub || sub.status === 'revision_required';
    });
  }, [topics, statusFilter, mySubmissionsByTopic]);

  const [selectedTopicId, setSelectedTopicId] = useState<string>(() => {
    if (preselectedTopicId && topics.some(t => t.id === preselectedTopicId)) {
      return preselectedTopicId;
    }
    // Pick the first unsubmitted topic if available, else first topic
    const firstUnsubmitted = topics.find(t => !allSubmissions.some(s => s.teacherUid === currentUser?.uid && s.topicId === t.id));
    return firstUnsubmitted?.id || topics[0]?.id || '';
  });

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  
  // Files state with optional subTaskId and subTaskTitle mapping
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
  const [newLinkInput, setNewLinkInput] = useState('');

  const selectedTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
  const existingSubmissionForSelected = selectedTopic ? mySubmissionsByTopic[selectedTopic.id] : undefined;

  useEffect(() => {
    if (preselectedTopicId && topics.some(t => t.id === preselectedTopicId)) {
      setSelectedTopicId(preselectedTopicId);
    }
  }, [preselectedTopicId, topics]);

  // Helper to generate default title based on selected topic
  const getDefaultTitle = (topicItem?: SubmissionTopic) => {
    if (!topicItem) return '';
    return `${topicItem.title} - ${currentUser?.displayName || 'ครูผู้สอน'}`;
  };

  // Helper to generate default note based on topic category (ตอบโจทย์คนขี้เกียจพิมพ์)
  const getDefaultNote = (topicItem?: SubmissionTopic) => {
    if (!topicItem) return '';
    if (topicItem.category.includes('วิจัย')) {
      return 'ส่งเค้าโครงการวิจัยในชั้นเรียน พร้อมเครื่องมือเก็บรวบรวมข้อมูล ครบถ้วนตามข้อกำหนด';
    }
    if (topicItem.category.includes('แผน')) {
      return 'ส่งแผนการจัดการเรียนรู้ฉบับสมบูรณ์ พร้อมโครงสร้างรายวิชาและแบบวัดประเมินผล';
    }
    if (topicItem.category.includes('สื่อ')) {
      return 'ส่งสื่อและนวัตกรรมการสอน พร้อมคู่มือการจัดกิจกรรมการเรียนรู้';
    }
    if (topicItem.category.includes('ปพ') || topicItem.category.includes('ธุรการ') || topicItem.category.includes('ปฏิบัติงาน')) {
      return 'ส่งรายงานผลการประเมินและเอกสารหลักฐานร่องรอยเชิงประจักษ์ครบถ้วน';
    }
    if (topicItem.category.includes('โครงการ') || topicItem.category.includes('กิจกรรม')) {
      return 'ส่งรายงานสรุปผลการดำเนินโครงการ พร้อมภาพถ่ายกิจกรรมและสรุปงบประมาณ';
    }
    return 'ส่งมอบเอกสารและหลักฐานครบถ้วนตามข้อกำหนดของหัวข้อเรื่อง พร้อมรับการตรวจรับรอง';
  };

  // When selected topic changes, ALWAYS synchronize title and note to match the topic
  useEffect(() => {
    if (selectedTopic) {
      setTitle(getDefaultTitle(selectedTopic));
      setNote(getDefaultNote(selectedTopic));
    }
  }, [selectedTopicId]);

  const getRemainingTime = (dueIso?: string) => {
    if (!dueIso) return null;
    const now = new Date().getTime();
    const due = new Date(dueIso).getTime();
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return { text: `เลยกำหนดส่งแล้ว (${Math.abs(diffDays)} วัน) - ส่งได้แต่จะขึ้นสถานะล่าช้า`, isOverdue: true };
    }
    if (diffDays === 0) {
      return { text: 'ครบกำหนดส่งวันนี้!', isOverdue: false, isUrgent: true };
    }
    return { text: `เหลือเวลาอีก ${diffDays} วัน`, isOverdue: false, isUrgent: diffDays <= 3 };
  };

  const remaining = selectedTopic ? getRemainingTime(selectedTopic.dueDate) : null;

  // Add files to general list or assigned to a subTask
  const addIncomingFiles = (incomingFiles: File[], subTask?: TopicSubTask) => {
    if (!selectedTopic) return;

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
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          subTaskId: subTask?.id,
          subTaskTitle: subTask?.title,
        });
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      Swal.fire({
        title: 'ประเภทไฟล์ไม่ได้รับอนุญาต',
        html: `หัวข้อนี้อนุญาตเฉพาะไฟล์นามสกุล: <b>${allowedExts.join(', ')}</b><br/><br/>ไฟล์ที่ถูกคัดออก: ${invalidFiles.join(', ')}`,
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
    }

    if (files.length + validFiles.length > selectedTopic.maxFiles) {
      Swal.fire({
        title: 'เกินจำนวนไฟล์สูงสุด',
        text: `หัวข้อนี้อนุญาตให้แนบไฟล์ได้สูงสุด ${selectedTopic.maxFiles} ไฟล์`,
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleGeneralFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    addIncomingFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleSubTaskFileChange = (e: React.ChangeEvent<HTMLInputElement>, subTask: TopicSubTask) => {
    if (!e.target.files) return;
    addIncomingFiles(Array.from(e.target.files), subTask);
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
      Swal.fire({
        title: 'URL ไม่ถูกต้อง',
        text: 'กรุณากรอกลิงก์ที่ขึ้นต้นด้วย https:// หรือ http://',
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }
    setLinks(prev => [...prev, newLinkInput.trim()]);
    setNewLinkInput('');
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTopic) {
      Swal.fire('ไม่พบหัวข้อส่งงาน', 'กรุณาเลือกหัวข้อส่งงานที่เปิดรับ', 'warning');
      return;
    }

    if (!title.trim()) {
      Swal.fire('กรุณาระบุชื่องาน', 'กรุณาระบุชื่อเรื่องหรือแผนการจัดการเรียนรู้ที่ต้องการส่ง', 'warning');
      return;
    }

    if (files.length === 0 && links.length === 0) {
      Swal.fire('กรุณาแนบไฟล์หรือลิงก์', 'กรุณาอัปโหลดเอกสารหรือแนบลิงก์ผลงานอย่างน้อย 1 รายการ', 'warning');
      return;
    }

    // Check required sub-tasks if topic has them
    if (selectedTopic.subTasks && selectedTopic.subTasks.length > 0) {
      const requiredSubTasks = selectedTopic.subTasks.filter(st => st.isRequired);
      const missingSubTasks = requiredSubTasks.filter(st => !files.some(f => f.subTaskId === st.id));

      if (missingSubTasks.length > 0) {
        Swal.fire({
          title: 'ยังแนบงานย่อยไม่ครบถ้วน',
          html: `
            <div class="text-left text-xs space-y-2 mt-2">
              <p>หัวข้อนี้กำหนดงานย่อยจำเป็นที่ยังไม่ได้แนบไฟล์:</p>
              <ul class="list-disc pl-5 font-semibold text-rose-700">
                ${missingSubTasks.map(m => `<li>${m.title}</li>`).join('')}
              </ul>
              <p class="text-slate-500 pt-1">คุณสามารถเลือกแนบไฟล์โดยตรงที่ช่องงานย่อย หรือคลิกเปลี่ยนหมวดหมู่งานย่อยของไฟล์ที่แนบไว้ได้</p>
            </div>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'ยืนยันจะส่งต่อ',
          cancelButtonText: 'กลับไปแนบไฟล์เพิ่ม',
          confirmButtonColor: '#2563eb',
          cancelButtonColor: '#64748b',
        }).then((res) => {
          if (res.isConfirmed) {
            executeSubmission();
          }
        });
        return;
      }
    }

    executeSubmission();
  };

  const executeSubmission = async () => {
    if (!currentUser || !selectedTopic) return;
    const settings = getSettings();
    const driveFolderId = settings.googleDriveRootFolderId || '1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAM';

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
              <p>กำลังส่งไฟล์เอกสารเข้าสู่โฟลเดอร์ Google Drive ของสถาบัน...</p>
              <div class="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-mono text-[11px]">
                📁 Google Drive / ${selectedTopic.title} /
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
          uploadedFilesList = files.map(f => {
            const up = driveRes.files.find(uf => uf.fileName === f.fileName);
            return {
              fileName: f.fileName,
              fileSizeBytes: f.fileSizeBytes,
              mimeType: f.mimeType,
              previewUrl: up?.previewUrl || f.previewUrl,
              downloadUrl: up?.downloadUrl || up?.fileUrl || '#',
              driveFileId: up?.fileId,
              driveUrl: up?.fileUrl,
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

      // Confetti Celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (needsAuth) {
        Swal.fire({
          title: 'บันทึกงานแล้ว (รอสิทธิ์ Google Drive)',
          html: `
            <div class="text-left text-xs space-y-2 mt-2 text-slate-600">
              <p class="text-emerald-700 font-semibold">✓ บันทึกข้อมูลการส่งงานในระบบเรียบร้อยแล้ว</p>
              <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <p class="font-bold flex items-center gap-1.5 text-xs text-amber-800">
                  ⚠️ ต้องการยืนยันสิทธิ์ Google Drive ครั้งแรก
                </p>
                <p class="text-[11px] text-amber-700 leading-relaxed">
                  ระบบ Google Apps Script ยังไม่ได้รับสิทธิ์เข้าถึง Google Drive กรุณากดปุ่มด้านล่างเพื่อเปิดหน้าสคริปต์ แล้วกด <b>"เรียกใช้ (Run)"</b> ฟังก์ชัน <code>testAuthorize</code> 1 ครั้งเพื่ออนุมัติสิทธิ์
                </p>
              </div>
            </div>
          `,
          icon: 'warning',
          confirmButtonText: 'เปิด Apps Script เพื่อยืนยันสิทธิ์',
          showCancelButton: true,
          cancelButtonText: 'ดูผลงานในระบบ',
          confirmButtonColor: '#2563eb',
          cancelButtonColor: '#64748b'
        }).then(res => {
          if (res.isConfirmed) {
            window.open('https://script.google.com/u/0/home/projects/1H_l1PgGEO65Y80m7dgtyak2JKNz7hE_fA_nWwYVYcpqnpMb5A6ot3cUH/edit', '_blank');
          }
          navigate(`/submissions/${newSub.id}`);
        });
        return;
      }

      Swal.fire({
        title: 'ส่งผลงานและอัปโหลดเข้า Drive สำเร็จ!',
        html: `
          <div class="text-left text-xs space-y-2 mt-2">
            <p>ระบบได้บันทึกการส่งงานในหัวข้อ <b>"${selectedTopic.title}"</b> เรียบร้อยแล้ว</p>
            ${selectedTopic.subTasks && selectedTopic.subTasks.length > 0 ? `
              <p class="text-emerald-700 font-semibold">
                ✓ แนบงานย่อยสำเร็จ: ${new Set(files.map(f => f.subTaskId).filter(Boolean)).size}/${selectedTopic.subTasks.length} รายการ
              </p>
            ` : ''}
            <div class="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 space-y-1.5">
              <p class="font-bold flex items-center gap-1.5 text-xs">
                📁 จัดเก็บไฟล์เข้าโฟลเดอร์ Google Drive:
              </p>
              <p class="font-mono text-[11px] bg-white p-1.5 rounded border border-blue-200 text-blue-700 break-all">
                Google Drive / ${selectedTopic.title} /
              </p>
              <div class="pt-1">
                <a
                  href="${driveFolderUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  เปิดดูโฟลเดอร์ใน Google Drive ↗
                </a>
              </div>
            </div>
          </div>
        `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'ดูรายละเอียดผลงาน',
        cancelButtonText: 'เปิดดูใน Google Drive',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#059669'
      }).then((res) => {
        if (res.dismiss === Swal.DismissReason.cancel) {
          window.open(driveFolderUrl, '_blank');
        }
        navigate(`/submissions/${newSub.id}`);
      });

    } catch (err: any) {
      console.error('Submission error:', err);
      Swal.fire('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถบันทึกการส่งงานได้ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  if (topics.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <FolderPlus className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">ขณะนี้ยังไม่มีหัวข้อส่งงานที่เปิดรับ</h3>
        <p className="text-xs text-slate-500">
          แอดมินยังไม่ได้เปิดรอบหรือสร้างหัวข้อเรื่องส่งงาน กรุณารอประกาศจากฝ่ายบริหารวิชาการ
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
        >
          กลับสู่หน้าหลัก
        </Link>
      </div>
    );
  }

  // Calculate sub-task completion progress for selected topic
  const subTasks = selectedTopic?.subTasks || [];
  const assignedSubTaskIds = new Set(files.map(f => f.subTaskId).filter(Boolean));
  const subTasksCompletedCount = assignedSubTaskIds.size;
  const subTasksTotalCount = subTasks.length;
  const subTasksPercent = subTasksTotalCount > 0 ? Math.round((subTasksCompletedCount / subTasksTotalCount) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-blue-600" />
            ส่งผลงานตามหัวข้อที่แอดมินกำหนด
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            เลือกหัวข้อเรื่องที่ต้องการส่งงาน (แสดงสีเขียว/สีแดงตามสถานะการส่ง) ตรวจสอบรายการงานย่อย และแนบไฟล์
          </p>
        </div>
        
        <div className="text-xs bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>ไฟล์ที่ส่ง แอดมินและผู้ส่งเท่านั้นที่เปิดดูได้</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section 1: Choose Admin Topic with Green / Red Indicators */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              เลือกหัวข้อเรื่องที่แอดมินมอบหมาย (Topic) <span className="text-rose-500">*</span>
            </h3>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === 'all' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({topics.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('unsubmitted')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                  statusFilter === 'unsubmitted' 
                    ? 'bg-rose-600 text-white shadow-xs' 
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping" />
                🔴 ยังไม่ส่ง ({unsubmittedCount + revisionCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('submitted')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === 'submitted' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                🟢 ส่งแล้ว ({submittedCount})
              </button>
            </div>
          </div>

          {/* DROPDOWN LIST WITH GREEN / RED OPTIONS */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                เลือกหัวข้อเรื่องที่ต้องการส่งงาน:
                <span className="text-[11px] font-normal text-slate-500">
                  (🟢 สีเขียว = ส่งแล้ว, 🔴 สีแดง = ยังไม่ส่ง, 🟠 สีส้ม = ต้องส่งแก้ไข)
                </span>
              </label>
            </div>

            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className={`w-full text-xs font-bold rounded-2xl border-2 px-4 py-3.5 shadow-sm focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                existingSubmissionForSelected?.status === 'passed' || existingSubmissionForSelected?.status === 'submitted' || existingSubmissionForSelected?.status === 'under_review'
                  ? 'border-emerald-400 bg-emerald-50/40 text-emerald-950 focus:ring-emerald-500'
                  : existingSubmissionForSelected?.status === 'revision_required'
                  ? 'border-amber-400 bg-amber-50/40 text-amber-950 focus:ring-amber-500'
                  : 'border-rose-400 bg-rose-50/30 text-rose-950 focus:ring-rose-500'
              }`}
              required
            >
              {filteredTopics.map(t => {
                const sub = mySubmissionsByTopic[t.id];
                const isPassed = sub?.status === 'passed';
                const isSubmitted = sub && sub.status !== 'revision_required';
                const isRevision = sub?.status === 'revision_required';

                // Display badge prefix & styles for each option
                const statusIcon = isPassed ? '🟢 [ส่งแล้ว-ผ่าน]' : isSubmitted ? '🟢 [ส่งแล้ว-รอตรวจ]' : isRevision ? '🟠 [ต้องส่งแก้ไข]' : '🔴 [ยังไม่ส่ง]';
                const optColor = isSubmitted ? '#166534' : isRevision ? '#c2410c' : '#b91c1c';
                const optBg = isSubmitted ? '#f0fdf4' : isRevision ? '#fff7ed' : '#fef2f2';

                const subTaskText = t.subTasks && t.subTasks.length > 0 ? ` • ${t.subTasks.length} งานย่อย` : '';

                return (
                  <option 
                    key={t.id} 
                    value={t.id}
                    style={{ 
                      color: optColor, 
                      backgroundColor: optBg, 
                      fontWeight: 700,
                      padding: '8px'
                    }}
                  >
                    {statusIcon} [{t.category}] {t.title}{subTaskText} (ครบกำหนด: {new Date(t.dueDate).toLocaleDateString('th-TH')})
                  </option>
                );
              })}
            </select>
          </div>

          {/* HIGH-VISIBILITY STATUS BANNER FOR CURRENTLY SELECTED TOPIC */}
          {existingSubmissionForSelected ? (
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              existingSubmissionForSelected.status === 'passed' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : existingSubmissionForSelected.status === 'revision_required'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-blue-50 border-blue-300 text-blue-900'
            }`}>
              <div className="flex items-start gap-3">
                {existingSubmissionForSelected.status === 'passed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : existingSubmissionForSelected.status === 'revision_required' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">
                      {existingSubmissionForSelected.status === 'passed' && '🟢 คุณส่งงานในหัวข้อนี้แล้ว และได้รับการอนุมัติผ่านเรียบร้อย'}
                      {existingSubmissionForSelected.status === 'submitted' && '🟢 คุณส่งงานในหัวข้อนี้แล้ว (กำลังรอแอดมินตรวจ)'}
                      {existingSubmissionForSelected.status === 'revision_required' && '🟠 งานในหัวข้อนี้แอดมินแจ้งให้ส่งแก้ไขปรับปรุง'}
                    </span>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border">
                      v{existingSubmissionForSelected.currentVersionNumber}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    ชื่องานเดิม: "{existingSubmissionForSelected.title}" • ส่งเมื่อ {new Date(existingSubmissionForSelected.submittedAt).toLocaleDateString('th-TH')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  to={`/submissions/${existingSubmissionForSelected.id}`}
                  className="px-3 py-1.5 rounded-xl bg-white text-xs font-semibold border shadow-2xs hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  เปิดดูงานเดิม
                </Link>
                <span className="text-[11px] font-medium text-slate-500">
                  (ส่งซ้ำเพื่อสร้างเวอร์ชันใหม่)
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <div>
                  <span className="font-bold text-xs block">
                    🔴 คุณยังไม่ได้ส่งงานในหัวข้อนี้
                  </span>
                  <span className="text-[11px] text-rose-700">
                    กรุณาตรวจสอบข้อกำหนดและรายการงานย่อยด้านล่าง แล้วแนบไฟล์เพื่อส่งตามกำหนด
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-700 bg-white px-2.5 py-1 rounded-xl border border-rose-200 shadow-2xs">
                ยังค้างส่ง
              </span>
            </div>
          )}

          {/* Detailed Topic Brief Banner */}
          {selectedTopic && (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-blue-100 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white">
                    {selectedTopic.category}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ภาคเรียนที่ {selectedTopic.semester}/{selectedTopic.academicYear}
                  </span>
                  {selectedTopic.subTasks && selectedTopic.subTasks.length > 0 && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      มี {selectedTopic.subTasks.length} งานย่อย
                    </span>
                  )}
                </div>

                {/* Remaining badge */}
                {remaining && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                    remaining.isOverdue 
                      ? 'bg-rose-100 text-rose-700 border-rose-300' 
                      : remaining.isUrgent
                        ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    {remaining.text}
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedTopic.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line bg-white/70 p-3 rounded-xl border border-slate-200/60">
                  {selectedTopic.description || 'ไม่มีคำชี้แจงเพิ่มเติมจากแอดมิน'}
                </p>
              </div>

              {/* Deadline & Constraints Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">กำหนดส่ง:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(selectedTopic.dueDate).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} น.
                    </span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">นามสกุลไฟล์:</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {selectedTopic.allowedFileExtensions.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">ข้อกำหนด:</span>
                    <span className="font-semibold text-slate-800">
                      สูงสุด {selectedTopic.maxFiles} ไฟล์ {selectedTopic.allowExternalLinks ? '(แนบลิงก์ได้)' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Section 2: SUB-TASKS CHECKLIST (ถ้าหัวข้อนี้มีงานย่อยหลายรายการ) */}
        {subTasks.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-purple-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  รายการงานย่อยที่ต้องส่งสำหรับหัวข้อนี้ ({subTasksCompletedCount}/{subTasksTotalCount} รายการ)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  หัวข้อนี้มีงานย่อยที่ต้องส่งหลายรายการ คุณครูสามารถแนบไฟล์แยกตามงานย่อยแต่ละข้อได้โดยตรง
                </p>
              </div>

              {/* Progress pill */}
              <div className="flex items-center gap-2">
                <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${subTasksPercent}%` }}
                  />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                  subTasksCompletedCount === subTasksTotalCount 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {subTasksPercent}% แนบครบแล้ว
                </span>
              </div>
            </div>

            {/* List of subtasks */}
            <div className="space-y-3">
              {subTasks.map((st, sIdx) => {
                const subTaskFiles = files.filter(f => f.subTaskId === st.id);
                const isAttached = subTaskFiles.length > 0;

                return (
                  <div 
                    key={st.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isAttached 
                        ? 'bg-emerald-50/30 border-emerald-200' 
                        : st.isRequired 
                          ? 'bg-rose-50/20 border-rose-200' 
                          : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">
                            {sIdx + 1}. {st.title}
                          </span>
                          {st.isRequired ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              จำเป็นต้องส่ง *
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              งานย่อยเพิ่มเติม (ถ้ามี)
                            </span>
                          )}
                          {isAttached ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" /> แนบแล้ว {subTaskFiles.length} ไฟล์
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                              ยังไม่ได้แนบไฟล์
                            </span>
                          )}
                        </div>
                        {st.description && (
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {st.description}
                          </p>
                        )}
                      </div>

                      {/* Direct upload button for this sub-task */}
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 text-xs font-semibold rounded-xl border border-purple-200 shadow-2xs hover:border-purple-300 transition-all flex-shrink-0">
                        <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
                        <span>แนบไฟล์สำหรับงานนี้</span>
                        <input
                          type="file"
                          multiple
                          accept={selectedTopic?.allowedFileExtensions.join(',') || '.pdf,.docx'}
                          onChange={(e) => handleSubTaskFileChange(e, st)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Files attached specifically to this sub-task */}
                    {subTaskFiles.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap gap-2">
                        {subTaskFiles.map((sf, sfIdx) => {
                          const realFileIndex = files.findIndex(f => f === sf);
                          return (
                            <div 
                              key={sfIdx}
                              className="inline-flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-emerald-200 shadow-2xs text-xs"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="font-medium text-slate-800 max-w-[180px] truncate" title={sf.fileName}>
                                {sf.fileName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({(sf.fileSizeBytes / 1024 / 1024).toFixed(1)} MB)
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFile(realFileIndex)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                                title="ลบไฟล์นี้"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 3: Work Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              {subTasks.length > 0 ? '3' : '2'}
            </span>
            รายละเอียดผลงานของคุณครู
          </h3>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                ชื่อเรื่อง / ชื่องานที่ส่ง <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setTitle(getDefaultTitle(selectedTopic))}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                title="รีเซ็ตชื่อให้ตรงกับหัวข้อเรื่องที่เลือก"
              >
                <span>🔄 ดึงชื่อตามหัวข้อที่เลือก</span>
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ตัวอย่าง: ส่งเค้าโครงการวิจัยในชั้นเรียน (Action Research) 1/2569 - ครูสมศรี ใจดีเลิศ"
              className="w-full text-xs rounded-xl border border-blue-200 bg-blue-50/20 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              required
            />
            {/* Quick append tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-400 text-[10px]">ปุ่มต่อท้ายชื่อ:</span>
              <button
                type="button"
                onClick={() => setTitle(prev => prev.includes('ฉบับสมบูรณ์') ? prev : `${prev} (ฉบับสมบูรณ์)`)}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                + ฉบับสมบูรณ์
              </button>
              <button
                type="button"
                onClick={() => setTitle(prev => prev.includes('หน่วยที่ 1-2') ? prev : `${prev} (หน่วยที่ 1-2)`)}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                + หน่วยที่ 1-2
              </button>
              <button
                type="button"
                onClick={() => setTitle(prev => prev.includes('ฉบับปรับปรุง') ? prev : `${prev} (ฉบับปรับปรุงใหม่)`)}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                + ฉบับปรับปรุงใหม่
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs font-semibold text-slate-700">
                หมายเหตุเพิ่มเติมถึงแอดมินผู้ตรวจงาน (Optional)
              </label>
              <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                ⚡ ไม่ต้องพิมพ์เอง: คลิกปุ่มข้อความสำเร็จรูปด้านล่างได้ทันที
              </span>
            </div>

            {/* Quick Note Template Chips (สำหรับคนขี้เกียจพิมพ์) */}
            <div className="p-3 bg-gradient-to-r from-amber-50/70 via-slate-50 to-blue-50/50 rounded-2xl border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  เลือกข้อความสำเร็จรูป (คลิกเดียวใส่ลงช่องทันที):
                </span>
                {note && (
                  <button
                    type="button"
                    onClick={() => setNote('')}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-medium transition-colors"
                  >
                    ล้างข้อความ
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'ส่งเอกสารหลักฐานครบถ้วนตามข้อกำหนด พร้อมรับการตรวจรับรอง',
                  'ส่งแผนการจัดการเรียนรู้ฉบับสมบูรณ์ พร้อมโครงสร้างรายวิชาและแบบวัดผล',
                  'ส่งเค้าโครงการวิจัยในชั้นเรียน พร้อมเครื่องมือเก็บรวบรวมข้อมูล',
                  'ส่งสื่อ นวัตกรรม และใบกิจกรรม พร้อมคู่มือการจัดกิจกรรม',
                  'แนบไฟล์งานย่อยครบทุกรายการตามคำสั่งแอดมินเรียบร้อยแล้ว',
                  'ส่งงานเวอร์ชันปรับปรุงแก้ไขเพิ่มเติมตามคำแนะนำของแอดมิน',
                ].map((templateText, tIdx) => (
                  <button
                    key={tIdx}
                    type="button"
                    onClick={() => setNote(templateText)}
                    className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all text-left ${
                      note === templateText
                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                        : 'bg-white hover:bg-amber-100/70 text-slate-700 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    {tIdx === 0 ? '📄 ' : tIdx === 1 ? '📘 ' : tIdx === 2 ? '🔬 ' : tIdx === 3 ? '🎨 ' : tIdx === 4 ? '📋 ' : '✏️ '}
                    {templateText}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ระบุจุดเน้น หรือคลิกปุ่มสำเร็จรูปด้านบนเพื่อใส่ข้อความอัตโนมัติ..."
              className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Section 4: File Uploads & External Links */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              {subTasks.length > 0 ? '4' : '3'}
            </span>
            แนบไฟล์เอกสารและลิงก์ผลงาน
          </h3>

          {/* Upload Dropzone */}
          <div>
            {/* Topic Folder Destination Notice */}
            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200/80 flex items-center gap-2.5 text-xs text-blue-900 mb-3">
              <FolderOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-semibold block text-[11px] text-blue-900">
                  โฟลเดอร์จัดเก็บไฟล์ตามชื่องาน (Google Drive):
                </span>
                <span className="font-mono text-[11px] text-blue-700 font-bold truncate block">
                  📁 Google Drive / {selectedTopic?.title} /
                </span>
              </div>
              <span className="text-[10px] text-blue-700 font-semibold bg-white px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                จัดเข้าโฟลเดอร์อัตโนมัติ
              </span>
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                อัปโหลดไฟล์เอกสาร ({selectedTopic?.allowedFileExtensions.join(', ')})
              </label>
              <span className="text-[11px] text-slate-500">
                สูงสุด {selectedTopic?.maxFiles || 5} ไฟล์ (แนบแล้ว {files.length} ไฟล์)
              </span>
            </div>

            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer relative">
              <input
                type="file"
                multiple
                accept={selectedTopic?.allowedFileExtensions.join(',') || '.pdf,.docx,.doc'}
                onChange={handleGeneralFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-slate-800">
                  ลากไฟล์มาวางที่นี่ หรือ <span className="text-blue-600 font-semibold underline">คลิกเพื่อเลือกไฟล์</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  รองรับนามสกุล {selectedTopic?.allowedFileExtensions.join(', ')} (ขนาดไม่เกิน 50MB ต่อไฟล์)
                </p>
              </div>
            </div>

            {/* Uploaded Files List with Sub-task Assignment Dropdown */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-700">ไฟล์ทั้งหมดที่แนบแล้ว ({files.length} รายการ):</p>
                <div className="space-y-2">
                  {files.map((file, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800 truncate">{file.fileName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400">{(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                            <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 truncate">
                              📁 {selectedTopic?.title}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sub-task tag & selector if topic has subtasks */}
                      {subTasks.length > 0 && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-slate-400">ผูกกับงานย่อย:</span>
                          <select
                            value={file.subTaskId || ''}
                            onChange={(e) => updateFileSubTask(idx, e.target.value)}
                            className="text-[11px] font-semibold py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-- ไม่ระบุงานย่อย --</option>
                            {subTasks.map((st, i) => (
                              <option key={st.id} value={st.id}>
                                {i + 1}. {st.title} {st.isRequired ? '(จำเป็น)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 flex-shrink-0"
                        title="ลบไฟล์"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* External Links (If topic allows) */}
          {selectedTopic?.allowExternalLinks && (
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                แนบลิงก์ผลงานภายนอก (Canva, Google Drive, Padlet, YouTube ฯลฯ)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newLinkInput}
                  onChange={(e) => setNewLinkInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 text-xs rounded-xl border border-slate-200 px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  เพิ่มลิงก์
                </button>
              </div>

              {links.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {links.map((link, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
                      <span className="flex items-center gap-2 text-blue-600 truncate">
                        <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        {link}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLink(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
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

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <CheckCircle2 className="w-4 h-4" />
            ยืนยันการส่งผลงานในหัวข้อนี้
          </button>
        </div>

      </form>

    </div>
  );
};
