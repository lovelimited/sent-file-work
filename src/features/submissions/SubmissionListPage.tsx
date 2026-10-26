import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getSubmissions, 
  getSubmissionTopics, 
  getUsers, 
  hasDemoSubmissions, 
  deleteDemoSubmissions,
  submitAdminReview 
} from '../../lib/storage';
import { syncDataToGoogleSheets, triggerAutoSyncToGoogleSheets } from '../../lib/googleSheetsSync';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import { Submission, SubmissionTopic, User } from '../../types';
import { 
  FileText, 
  Search, 
  Filter, 
  UploadCloud, 
  ArrowRight,
  GraduationCap,
  Calendar,
  CheckCircle2,
  FolderOpen,
  Clock,
  AlertTriangle,
  Trash2,
  Plus,
  RefreshCw,
  Layers,
  Sparkles,
  Info,
  XCircle,
  FolderPlus,
  ListTodo
} from 'lucide-react';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

export const SubmissionListPage: React.FC = () => {
  const { currentUser, role } = useAuth();

  // Reactive state synced with storage and Cloud Firestore
  const [submissions, setSubmissions] = useState<Submission[]>(getSubmissions());
  const [topics, setTopics] = useState<SubmissionTopic[]>(getSubmissionTopics());
  const [users, setUsers] = useState<User[]>(getUsers());
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  // View state: 'topics' (Categorized by Admin Assigned Topics) or 'all' (Feed list)
  const [activeTab, setActiveTab] = useState<'topics' | 'all'>('topics');

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');

  // Reload data on events
  const reloadData = () => {
    setSubmissions(getSubmissions());
    setTopics(getSubmissionTopics());
    setUsers(getUsers());
  };

  useEffect(() => {
    reloadData();
    const handleDataChanged = () => reloadData();
    window.addEventListener('sent_work_data_changed', handleDataChanged);
    window.addEventListener('storage', handleDataChanged);
    return () => {
      window.removeEventListener('sent_work_data_changed', handleDataChanged);
      window.removeEventListener('storage', handleDataChanged);
    };
  }, []);

  const activeTeachers = useMemo(() => {
    return users.filter(u => u.role === 'teacher' && u.status === 'active');
  }, [users]);

  // Demo Submissions check
  const hasDemo = useMemo(() => hasDemoSubmissions(), [submissions]);
  const demoCount = useMemo(() => {
    return submissions.filter(s => 
      s.id.startsWith('sub-2026-') ||
      s.teacherUid.startsWith('teacher-') ||
      s.teacherName.includes('ครูสมศรี') ||
      s.teacherName.includes('ครูสมชาย') ||
      s.teacherName.includes('ครูอภิสิทธิ์')
    ).length;
  }, [submissions]);

  // Purge demo submissions
  const handlePurgeDemo = () => {
    if (!currentUser) return;
    Swal.fire({
      title: 'ล้างรายการส่งงานตัวอย่าง (Demo)?',
      html: `
        <div class="text-left text-xs space-y-2 text-slate-600">
          <p>ระบบตรวจพบรายการส่งงานตัวอย่างตกค้าง <b>${demoCount} รายการ</b></p>
          <p class="text-rose-600 font-semibold">เมื่อล้างแล้ว รายการส่งงานทั้งหมดจะตรงกับหัวข้องานจริงที่แอดมินสร้างขึ้นเท่านั้น</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ล้างรายการตัวอย่าง',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#e11d48'
    }).then(async res => {
      if (res.isConfirmed) {
        const result = deleteDemoSubmissions(currentUser);
        reloadData();
        await syncDataToGoogleSheets('PURGE_DEMO_SUBMISSIONS');
        Swal.fire({
          title: 'ล้างรายการตัวอย่างสำเร็จ!',
          text: `ลบรายการตัวอย่างออกแล้ว ${result.count} รายการ ตอนนี้ระบบแสดงเฉพาะงานจริง`,
          icon: 'success',
          confirmButtonColor: '#2563eb'
        });
      }
    });
  };

  // Sync Google Sheets manually
  const handleSyncSheets = async () => {
    setIsSyncingSheets(true);
    const res = await syncDataToGoogleSheets('MANUAL_REFRESH_SUBMISSION_LIST');
    setIsSyncingSheets(false);
    if (res.success) {
      Swal.fire({
        title: 'ซิงค์ข้อมูลสำเร็จ!',
        text: res.message,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      Swal.fire('ข้อผิดพลาด', res.message, 'error');
    }
  };

  const isAdmin = 
    role === 'admin' || 
    currentUser?.role === 'admin' || 
    currentUser?.email?.toLowerCase() === 'drive.limited@gmail.com' ||
    Boolean(currentUser?.displayName && currentUser.displayName.includes('กฤตพจน์')) ||
    Boolean(currentUser?.displayName && currentUser.displayName.includes('แอดมิน')) ||
    Boolean(currentUser?.displayName && currentUser.displayName.includes('Admin'));

  // 1-Click Quick Approve directly from submission list
  const handleQuickApproveFromList = (e: React.MouseEvent, sub: Submission) => {
    e.stopPropagation();
    e.preventDefault();
    if (!currentUser || !isAdmin) {
      Swal.fire('สงวนสิทธิ์เฉพาะแอดมิน', 'คุณต้องใช้สิทธิ์แอดมินในการอนุมัติผลงาน', 'warning');
      return;
    }

    Swal.fire({
      title: '✓ ยืนยันอนุมัติผลงานทันที?',
      html: `
        <div class="text-left text-sm space-y-2 text-slate-700">
          <p>ยืนยันอนุมัติผลงาน: <b>"${sub.title}"</b></p>
          <p>ครูผู้ส่ง: <b>${sub.teacherName}</b> (${sub.teacherDepartment || 'ทั่วไป'})</p>
          <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 text-xs leading-relaxed mt-2">
            <b>ผลลัพธ์:</b> ระบบจะบันทึกสถานะ "ผ่านการตรวจรับรอง (Passed)" ให้ทุกงานย่อย อัปเดต Cloud Firestore และซิงค์ Google Sheets ทันที
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '✓ ยืนยันอนุมัติผ่าน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b'
    }).then(res => {
      if (res.isConfirmed) {
        submitAdminReview(
          sub.id,
          'passed',
          'เอกสารครบถ้วนสมบูรณ์ ถูกต้องตามเกณฑ์มาตรฐาน อนุมัติผ่านเรียบร้อย',
          '',
          currentUser
        );
        triggerAutoSyncToGoogleSheets('ADMIN_QUICK_APPROVE_LIST');
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        Swal.fire({
          title: 'อนุมัติผลงานสำเร็จ!',
          text: `ผลงาน "${sub.title}" ได้รับการอนุมัติผ่านเรียบร้อยแล้ว`,
          icon: 'success',
          confirmButtonColor: '#059669',
          timer: 2000,
          showConfirmButton: false
        });
        reloadData();
      }
    });
  };

  // Role scoping: Admin sees all, teachers see their own submissions in feed
  const scopedSubmissions = useMemo(() => {
    return isAdmin
      ? submissions
      : submissions.filter(s => s.teacherUid === currentUser?.uid);
  }, [submissions, isAdmin, currentUser]);

  // Status stats
  const passedCount = scopedSubmissions.filter(s => s.status === 'passed').length;
  const pendingCount = scopedSubmissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length;
  const revisionCount = scopedSubmissions.filter(s => s.status === 'revision_required').length;

  // Deadline countdown helper
  const getRemainingDaysText = (dueIso: string) => {
    const now = new Date().getTime();
    const due = new Date(dueIso).getTime();
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return { text: `เลยกำหนดส่งแล้ว (${Math.abs(diffDays)} วัน)`, isOverdue: true };
    }
    if (diffDays === 0) {
      return { text: 'ครบกำหนดวันนี้!', isOverdue: false, isUrgent: true };
    }
    return { text: `เหลือเวลาอีก ${diffDays} วัน`, isOverdue: false, isUrgent: diffDays <= 3 };
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(topics.map(t => t.category));
    return Array.from(set);
  }, [topics]);

  // Filtered Topics for Tab 1
  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      const matchSearch = 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [topics, searchTerm, categoryFilter]);

  // Filtered Submissions for Tab 2
  const filteredSubmissions = useMemo(() => {
    return scopedSubmissions.filter(sub => {
      const matchesSearch = 
        sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.topicTitle && sub.topicTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sub.teacherDepartment && sub.teacherDepartment.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' ? true : sub.status === statusFilter;
      const matchesTopic = topicFilter === 'all' ? true : sub.topicId === topicFilter;

      return matchesSearch && matchesStatus && matchesTopic;
    });
  }, [scopedSubmissions, searchTerm, statusFilter, topicFilter]);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              {role === 'teacher' ? 'รายการงานของฉันและหัวข้อที่ได้รับมอบหมาย' : 'รายการส่งงานทั้งหมดในสถานศึกษา'}
            </h2>
            <span className="bg-blue-50 text-blue-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              {role === 'admin' ? 'ฝ่ายบริหารวิชาการ' : 'คณะครูผู้สอน'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {role === 'teacher' 
              ? 'ตรวจสอบหัวข้องานที่แอดมินมอบหมาย ส่งผลงานตามกำหนด และติดตามผลการตรวจรับรอง' 
              : 'ตรวจสอบและติดตามผลการส่งงานของคณะครูทุกคน ตรงตามหัวข้องานจริงที่แอดมินสร้าง'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {role === 'admin' && (
            <Link
              to="/admin/topics"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              สร้างหัวข้อส่งงานใหม่
            </Link>
          )}

          {role === 'teacher' && (
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
            >
              <UploadCloud className="w-4 h-4" />
              ส่งงานใหม่
            </Link>
          )}

          {role === 'admin' && (
            <button
              onClick={handleSyncSheets}
              disabled={isSyncingSheets}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
              title="ซิงค์ข้อมูลไปยัง Google Sheets รายงานแบบเรียลไทม์ (เฉพาะแอดมิน)"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              {isSyncingSheets ? 'กำลังซิงค์...' : 'ซิงค์ Google Sheets'}
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">หัวข้องานที่มอบหมาย</span>
            <span className="text-xl font-bold text-slate-900">{topics.length}</span>
            <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">หัวข้อเรื่องจากแอดมิน</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">คุณครูในสถานศึกษา</span>
            <span className="text-xl font-bold text-slate-900">{activeTeachers.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">ท่าน (เปิดใช้งาน)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">ผลงานที่ส่งแล้ว</span>
            <span className="text-xl font-bold text-blue-600">{scopedSubmissions.length}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">ตรวจผ่านแล้ว {passedCount} งาน</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">สถานะรอตรวจ / แก้ไข</span>
            <div className="flex items-center gap-1.5 text-xl font-bold">
              <span className="text-amber-600">{pendingCount}</span>
              <span className="text-slate-300 text-sm">/</span>
              <span className="text-rose-600">{revisionCount}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">รอตรวจ {pendingCount} • แก้ไข {revisionCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Demo Submissions Notification & Purge Action */}
      {hasDemo && demoCount > 0 && role === 'admin' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                ตรวจพบรายการส่งงานตัวอย่างเดิม (Demo Submissions) ตกค้าง {demoCount} รายการ
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                รายการส่งงานตัวอย่างเหล่านี้ไม่ตรงกับงานที่ท่านสร้าง คุณสามารถกดปุ่ม <b>"ล้างรายการตัวอย่าง"</b> เพื่อให้ระบบแสดงเฉพาะงานจริงของสถานศึกษา
              </p>
            </div>
          </div>
          <button
            onClick={handlePurgeDemo}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all flex-shrink-0 hover:scale-[1.02]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            ล้างรายการส่งงานตัวอย่าง ({demoCount})
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('topics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'topics'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            จำแนกตามหัวข้องานที่แอดมินมอบหมาย ({topics.length})
          </button>
          
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            รายการผลงานทั้งหมด ({scopedSubmissions.length})
          </button>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          โรงเรียนสารสาสน์วิเทศราชพฤกษ์ • ฝ่ายบริหารวิชาการ
        </span>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: จำแนกตามหัวข้องานที่แอดมินสร้าง (Topic Breakdown) */}
      {/* ======================================================== */}
      {activeTab === 'topics' && (
        <div className="space-y-5">
          {/* Filters for Topics */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อหัวข้องานที่แอดมินสร้าง, ประเภทงาน, คำชี้แจง..."
                className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">ทุกประเภทงาน ({topics.length})</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Topics List with Submissions Nested */}
          {filteredTopics.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <FolderPlus className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                {topics.length === 0 ? 'ยังไม่มีหัวข้องานที่แอดมินสร้าง' : 'ไม่พบหัวข้องานที่ตรงตามคำค้นหา'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {topics.length === 0 
                  ? 'แอดมินสามารถกำหนดหัวข้องานและวันเวลาครบกำหนดส่งได้ที่หน้า "จัดการหัวข้อส่งงาน & กำหนดส่ง"' 
                  : 'ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองประเภทงาน'}
              </p>
              {role === 'admin' && topics.length === 0 && (
                <Link
                  to="/admin/topics"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  สร้างหัวข้อส่งงานใหม่ทันที
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredTopics.map((topic, index) => {
                const topicSubmissions = submissions.filter(s => s.topicId === topic.id || s.roundId === topic.id);
                const uniqueSubmittedTeachers = new Set(topicSubmissions.map(s => s.teacherUid)).size;
                const totalTeachersCount = activeTeachers.length || 1;
                const submissionRate = Math.round((uniqueSubmittedTeachers / totalTeachersCount) * 100);
                const remaining = getRemainingDaysText(topic.dueDate);

                const topicPassed = topicSubmissions.filter(s => s.status === 'passed').length;
                const topicPending = topicSubmissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length;
                const topicRevision = topicSubmissions.filter(s => s.status === 'revision_required').length;

                // Check if current user submitted to this topic
                const mySubmissionForThisTopic = currentUser ? topicSubmissions.find(s => s.teacherUid === currentUser.uid) : undefined;

                return (
                  <div
                    key={topic.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all hover:border-blue-300"
                  >
                    {/* Topic Header Card */}
                    <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50/80 via-white to-blue-50/30 border-b border-slate-100 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {topic.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                            ภาคเรียนที่ {topic.semester}/{topic.academicYear}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            topic.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {topic.isActive ? '● เปิดรับส่ง' : 'ปิดรับส่ง'}
                          </span>
                        </div>

                        {/* Deadline & Remaining Days */}
                        <div className="flex items-center gap-2">
                          <div className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                            remaining.isOverdue
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : remaining.isUrgent
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>กำหนดส่ง: {new Date(topic.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</span>
                            <span className="opacity-70">({remaining.text})</span>
                          </div>
                        </div>
                      </div>

                      {/* Topic Title & Description */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {topic.title}
                        </h3>
                        {topic.description && (
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {topic.description}
                          </p>
                        )}
                      </div>

                      {/* Sub-tasks info */}
                      {topic.subTasks && topic.subTasks.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                            <ListTodo className="w-3.5 h-3.5 text-purple-600" />
                            งานย่อย ({topic.subTasks.length} รายการ):
                          </span>
                          {topic.subTasks.map((st, i) => (
                            <span key={st.id} className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-purple-200 text-slate-700">
                              {i + 1}. {st.title} {st.isRequired ? '*' : ''}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Progress Bar for Topic */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-800">
                            อัตราการส่งงาน: <span className="text-blue-600">{uniqueSubmittedTeachers}/{activeTeachers.length} คน ({submissionRate}%)</span>
                          </span>
                          <span className="text-emerald-600 font-medium text-[11px]">
                            (ผ่าน {topicPassed} • รอตรวจ {topicPending} • แก้ไข {topicRevision})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {role === 'teacher' && (
                            <Link
                              to={`/submit?topicId=${topic.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-all hover:scale-[1.02]"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              {mySubmissionForThisTopic ? 'ส่งเวอร์ชันใหม่ / แก้ไข' : 'ส่งงานในหัวข้อนี้'}
                            </Link>
                          )}

                          {role === 'admin' && (
                            <Link
                              to={`/admin/topics`}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-medium transition-colors"
                            >
                              จัดการหัวข้อ
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(submissionRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Topic Submissions List Body */}
                    <div className="divide-y divide-slate-100">
                      {topicSubmissions.length === 0 ? (
                        <div className="p-8 text-center space-y-2 bg-slate-50/40">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                            <Clock className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-semibold text-slate-700">
                            ยังไม่มีคุณครูส่งผลงานในหัวข้อนี้
                          </p>
                          <p className="text-[11px] text-slate-400">
                            เปิดรับการส่งผลงานตามกำหนดส่งถึงวันที่ {new Date(topic.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          {role === 'teacher' && (
                            <div className="pt-2">
                              <Link
                                to={`/submit?topicId=${topic.id}`}
                                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition-colors"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                เริ่มส่งผลงานในหัวข้อนี้
                              </Link>
                            </div>
                          )}
                        </div>
                      ) : (
                        topicSubmissions.map((sub) => {
                          const isCurrentUserSub = currentUser && sub.teacherUid === currentUser.uid;
                          return (
                            <div
                              key={sub.id}
                              className={`p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors ${
                                isCurrentUserSub ? 'bg-blue-50/20' : ''
                              }`}
                            >
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-100">
                                    v{sub.currentVersionNumber}
                                  </span>
                                  <Link
                                    to={`/submissions/${sub.id}`}
                                    className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                                  >
                                    {sub.title}
                                  </Link>
                                  <StatusBadge status={sub.status} isLate={sub.isLate} />
                                  {isCurrentUserSub && (
                                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                                      งานของฉัน
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                                  <span className="flex items-center gap-1.5 text-slate-800 font-medium">
                                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                                    {sub.teacherName}
                                  </span>
                                  {sub.teacherDepartment && (
                                    <span className="text-slate-400 hidden sm:inline">
                                      • {sub.teacherDepartment}
                                    </span>
                                  )}
                                  <span>
                                    • ส่งเมื่อ: {new Date(sub.submittedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isAdmin && sub.status !== 'passed' && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleQuickApproveFromList(e, sub)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                                    title="คลิกเพื่ออนุมัติรับรองผลงานนี้ทันที"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>อนุมัติทันที</span>
                                  </button>
                                )}
                                <Link
                                  to={`/submissions/${sub.id}`}
                                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 text-xs font-semibold transition-colors bg-white shadow-2xs"
                                >
                                  {isAdmin ? 'ตรวจงาน / ดูรายละเอียด' : 'ดูรายละเอียด'} <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: รายการส่งงานทั้งหมด (Feed View)                    */}
      {/* ======================================================== */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาชื่อแผนการสอน, ชื่อครูผู้สอน, กลุ่มสาระ..."
                  className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Topic Filter */}
              <div className="w-full md:w-auto">
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">ทุกหัวข้อที่แอดมินมอบหมาย ({topics.length})</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>[{t.category}] {t.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-medium text-[11px] mr-1">สถานะ:</span>
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'submitted', label: 'รอรับการตรวจ' },
                { id: 'under_review', label: 'กำลังตรวจ' },
                { id: 'passed', label: 'ผ่านเกณฑ์' },
                { id: 'revision_required', label: 'ต้องส่งแก้ไข' },
                { id: 'rejected', label: 'ไม่ผ่าน' }
              ].map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setStatusFilter(chip.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === chip.id
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-800">ไม่พบรายการผลงานที่ตรงตามเงื่อนไข</p>
                <p className="text-xs text-slate-400">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองสถานะ</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => {
                  return (
                    <div
                      key={sub.id}
                      className="p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-100">
                            v{sub.currentVersionNumber}
                          </span>
                          <span className="text-[10px] font-semibold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
                            {sub.topicTitle || 'ผลงานครู'}
                          </span>
                          <Link
                            to={`/submissions/${sub.id}`}
                            className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors"
                          >
                            {sub.title}
                          </Link>
                          <StatusBadge status={sub.status} isLate={sub.isLate} />
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            {sub.teacherName}
                          </span>
                          {sub.teacherDepartment && (
                            <span className="text-slate-400 hidden sm:inline">
                              • {sub.teacherDepartment}
                            </span>
                          )}
                          <span>
                            • ส่งเมื่อ: {new Date(sub.submittedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isAdmin && sub.status !== 'passed' && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickApproveFromList(e, sub)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                            title="คลิกเพื่ออนุมัติรับรองผลงานนี้ทันที"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>อนุมัติทันที</span>
                          </button>
                        )}
                        <Link
                          to={`/submissions/${sub.id}`}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 text-xs font-semibold transition-colors bg-white shadow-2xs"
                        >
                          {isAdmin ? 'ตรวจงาน / ดูรายละเอียด' : 'ดูรายละเอียด'} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
