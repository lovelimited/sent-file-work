import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getSubmissionTopics, 
  saveSubmissionTopic, 
  deleteSubmissionTopic,
  getSubmissions 
} from '../../lib/storage';
import { initTopicFoldersInGoogleDrive } from '../../lib/googleDriveService';
import { triggerAutoSyncToGoogleSheets } from '../../lib/googleSheetsSync';
import { SubmissionTopic, TopicSubTask } from '../../types';
import { 
  FolderPlus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Tag, 
  Edit3, 
  Trash2, 
  Plus, 
  X, 
  Link as LinkIcon, 
  Paperclip, 
  Users,
  Search,
  AlertTriangle,
  ListTodo
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';

const DEFAULT_CATEGORIES = [
  'แผนการจัดการเรียนรู้',
  'วิจัยในชั้นเรียน',
  'สื่อและนวัตกรรมการสอน',
  'งานธุรการชั้นเรียน/ปพ.',
  'รายงานโครงการ/กิจกรรม',
  'ข้อตกลงในการพัฒนางาน (PA)',
  'ภาพกิจกรรมและประชาสัมพันธ์',
  'เอกสารทางวิชาการอื่นๆ'
];

export const TopicsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [topics, setTopics] = useState<SubmissionTopic[]>(getSubmissionTopics());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<SubmissionTopic | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [academicYear, setAcademicYear] = useState('2569');
  const [semester, setSemester] = useState('1');
  const [dueDate, setDueDate] = useState('');
  const [allowedExtensions, setAllowedExtensions] = useState<string[]>(['.pdf', '.docx']);
  const [maxFiles, setMaxFiles] = useState(5);
  const [allowExternalLinks, setAllowExternalLinks] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [subTasks, setSubTasks] = useState<TopicSubTask[]>([]);

  const allSubmissions = getSubmissions();

  const reloadTopics = () => {
    setTopics(getSubmissionTopics());
  };

  const openCreateModal = () => {
    setEditingTopic(null);
    setTitle('');
    setCategory(DEFAULT_CATEGORIES[0]);
    setCustomCategory('');
    setDescription('');
    setAcademicYear('2569');
    setSemester('1');
    // Default due date: 14 days from now at 23:59:59
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const dateStr = d.toISOString().split('T')[0] + 'T23:59';
    setDueDate(dateStr);
    setAllowedExtensions(['.pdf', '.docx']);
    setMaxFiles(5);
    setAllowExternalLinks(true);
    setIsActive(true);
    setSubTasks([
      { id: `st-${Date.now()}-1`, title: 'แผนการจัดการเรียนรู้ฉบับสมบูรณ์', description: 'ไฟล์แผนการสอนรายวิชา', isRequired: true },
      { id: `st-${Date.now()}-2`, title: 'กำหนดการสอน / โครงสร้างรายวิชา', description: 'กำหนดการสอนตลอดภาคเรียน', isRequired: true }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (t: SubmissionTopic) => {
    setEditingTopic(t);
    setTitle(t.title);
    if (DEFAULT_CATEGORIES.includes(t.category)) {
      setCategory(t.category);
      setCustomCategory('');
    } else {
      setCategory('custom');
      setCustomCategory(t.category);
    }
    setDescription(t.description);
    setAcademicYear(t.academicYear);
    setSemester(t.semester);
    try {
      const dt = new Date(t.dueDate);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      const hours = String(dt.getHours()).padStart(2, '0');
      const mins = String(dt.getMinutes()).padStart(2, '0');
      setDueDate(`${year}-${month}-${day}T${hours}:${mins}`);
    } catch {
      setDueDate(t.dueDate);
    }
    setAllowedExtensions(t.allowedFileExtensions);
    setMaxFiles(t.maxFiles);
    setAllowExternalLinks(t.allowExternalLinks);
    setIsActive(t.isActive);
    setSubTasks(t.subTasks ? [...t.subTasks] : []);
    setIsModalOpen(true);
  };

  const handleToggleExtension = (ext: string) => {
    setAllowedExtensions(prev => 
      prev.includes(ext) ? prev.filter(e => e !== ext) : [...prev, ext]
    );
  };

  const handleAddSubTask = () => {
    setSubTasks(prev => [
      ...prev,
      {
        id: `st-${Date.now()}-${prev.length + 1}`,
        title: '',
        description: '',
        isRequired: true,
      }
    ]);
  };

  const handleUpdateSubTask = (id: string, field: keyof TopicSubTask, value: any) => {
    setSubTasks(prev => prev.map(st => st.id === id ? { ...st, [field]: value } : st));
  };

  const handleRemoveSubTask = (id: string) => {
    setSubTasks(prev => prev.filter(st => st.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      Swal.fire('กรุณาระบุชื่อหัวข้อเรื่อง', '', 'warning');
      return;
    }
    if (!dueDate) {
      Swal.fire('กรุณาระบุกำหนดส่ง (Due Date)', '', 'warning');
      return;
    }
    if (allowedExtensions.length === 0) {
      Swal.fire('กรุณาเลือกประเภทไฟล์ที่อนุญาตอย่างน้อย 1 ประเภท', '', 'warning');
      return;
    }
    if (!currentUser) return;

    const finalCategory = category === 'custom' ? (customCategory.trim() || 'ผลงานทั่วไป') : category;

    const topicItem: SubmissionTopic = {
      id: editingTopic ? editingTopic.id : `topic-${Date.now()}`,
      title: title.trim(),
      category: finalCategory,
      description: description.trim(),
      academicYear,
      semester,
      dueDate: new Date(dueDate).toISOString(),
      allowedFileExtensions: allowedExtensions,
      maxFiles: Number(maxFiles) || 5,
      allowExternalLinks,
      isActive,
      createdAt: editingTopic ? editingTopic.createdAt : new Date().toISOString(),
      createdBy: editingTopic ? editingTopic.createdBy : currentUser.displayName,
      subTasks: subTasks.filter(st => st.title.trim() !== ''),
    };

    saveSubmissionTopic(topicItem, currentUser);
    reloadTopics();
    setIsModalOpen(false);

    // Auto-create topic folder in Google Drive and sync Google Sheets
    initTopicFoldersInGoogleDrive([{ title: topicItem.title }]).catch(() => {});
    triggerAutoSyncToGoogleSheets(editingTopic ? 'ADMIN_UPDATE_TOPIC' : 'ADMIN_CREATE_TOPIC');

    Swal.fire({
      title: editingTopic ? 'อัปเดตหัวข้อเรื่องสำเร็จ' : 'สร้างหัวข้อส่งงานใหม่สำเร็จ!',
      text: `คุณครูสามารถส่งผลงานในหัวข้อ "${topicItem.title}" ได้ตามกำหนดส่ง`,
      icon: 'success',
      confirmButtonColor: '#2563eb'
    });
  };

  const handleDelete = (topic: SubmissionTopic) => {
    const submissionsForTopic = allSubmissions.filter(s => s.topicId === topic.id);

    Swal.fire({
      title: 'ยืนยันการลบหัวข้อเรื่อง?',
      html: `คุณกำลังจะลบหัวข้อ <b>"${topic.title}"</b><br/>${
        submissionsForTopic.length > 0 
          ? `<span class="text-rose-600 font-semibold">(มีงานที่ครูส่งแล้ว ${submissionsForTopic.length} รายการ)</span>` 
          : ''
      }`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ต้องการลบ',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed && currentUser) {
        deleteSubmissionTopic(topic.id, currentUser);
        reloadTopics();
        triggerAutoSyncToGoogleSheets('ADMIN_DELETE_TOPIC');
        Swal.fire('ลบหัวข้อเรื่องเรียบร้อย', '', 'success');
      }
    });
  };

  const handleToggleStatus = (topic: SubmissionTopic) => {
    if (!currentUser) return;
    const updated: SubmissionTopic = {
      ...topic,
      isActive: !topic.isActive
    };
    saveSubmissionTopic(updated, currentUser);
    reloadTopics();
    triggerAutoSyncToGoogleSheets('ADMIN_TOGGLE_TOPIC_STATUS');
  };

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

  const filteredTopics = topics.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' ? true : t.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FolderPlus className="w-6 h-6 text-blue-600" />
              จัดการหัวข้อส่งงานและกำหนดส่ง (Submission Topics)
            </h2>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              แอดมินสร้างเรื่อง
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            แอดมินเป็นผู้กำหนดหัวข้อเรื่อง รายละเอียด วันเวลาสิ้นสุดรับงาน (Deadline) เพื่อให้ครูทุกคนส่งผลงานตามกำหนด
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          สร้างหัวข้อเรื่องใหม่
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อหัวข้อเรื่อง, คำชี้แจง, ประเภท..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 py-2.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
          >
            <option value="all">ทุกประเภทงาน ({topics.length})</option>
            {DEFAULT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Topic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTopics.map(topic => {
          const submissionsCount = allSubmissions.filter(s => s.topicId === topic.id).length;
          const passedCount = allSubmissions.filter(s => s.topicId === topic.id && s.status === 'passed').length;
          const remaining = getRemainingDaysText(topic.dueDate);

          return (
            <div 
              key={topic.id}
              className={`bg-white rounded-3xl border transition-all hover:shadow-md flex flex-col justify-between ${
                topic.isActive ? 'border-slate-200/90' : 'border-slate-200 bg-slate-50/60 opacity-80'
              }`}
            >
              {/* Card Body */}
              <div className="p-6 space-y-4">
                
                {/* Header Meta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {topic.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                      เทอม {topic.semester}/{topic.academicYear}
                    </span>
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => handleToggleStatus(topic)}
                    title={topic.isActive ? 'คลิกเพื่อปิดรับส่ง' : 'คลิกเพื่อเปิดรับส่ง'}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                      topic.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${topic.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    {topic.isActive ? 'เปิดรับส่ง' : 'ปิดรับส่ง'}
                  </button>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3">
                    {topic.description || 'ไม่มีคำชี้แจงเพิ่มเติม'}
                  </p>
                </div>

                {/* Deadline & Remaining Days */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                  remaining.isOverdue 
                    ? 'bg-rose-50 border-rose-200 text-rose-800' 
                    : remaining.isUrgent 
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-slate-50 border-slate-200/80 text-slate-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0 text-slate-500" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">กำหนดส่ง (Deadline):</span>
                      <span className="font-semibold">
                        {new Date(topic.dueDate).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} น.
                      </span>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                    remaining.isOverdue 
                      ? 'bg-rose-100 text-rose-700 border-rose-300' 
                      : remaining.isUrgent
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-600 border-slate-200'
                  }`}>
                    {remaining.text}
                  </span>
                </div>

                {/* Constraints tags */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                    <Paperclip className="w-3 h-3 text-slate-400" />
                    ไฟล์ที่อนุญาต: {topic.allowedFileExtensions.join(', ')}
                  </span>
                  <span className="bg-slate-100 px-2 py-1 rounded-lg">
                    สูงสุด {topic.maxFiles} ไฟล์
                  </span>
                  {topic.allowExternalLinks && (
                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg text-emerald-700">
                      <LinkIcon className="w-3 h-3" />
                      แนบลิงก์ได้
                    </span>
                  )}
                </div>

                {/* Sub-tasks badge & list preview */}
                {topic.subTasks && topic.subTasks.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-1">
                    <span className="text-[11px] font-bold text-purple-950 flex items-center gap-1">
                      <ListTodo className="w-3.5 h-3.5 text-purple-600" />
                      มีงานย่อย {topic.subTasks.length} รายการ:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {topic.subTasks.map((st, i) => (
                        <span key={st.id} className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-purple-100 text-slate-700">
                          {i + 1}. {st.title} {st.isRequired ? '*' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submission stats */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-blue-600">
                      <Users className="w-3.5 h-3.5" /> ครูส่งแล้ว: {submissionsCount} คน
                    </span>
                    <span className="text-emerald-600 font-medium">
                      (ตรวจผ่าน {passedCount})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    สร้างโดย: {topic.createdBy}
                  </span>
                </div>

              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 rounded-b-3xl flex items-center justify-between">
                <Link
                  to={`/submissions`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  ดูผลงานที่ส่งในระบบ
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(topic)}
                    className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-white transition-colors"
                    title="แก้ไขหัวข้อ"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(topic)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="ลบหัวข้อ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTopics.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <FolderPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">ยังไม่พบหัวข้อส่งงาน</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            กดปุ่ม "สร้างหัวข้อเรื่องใหม่" ด้านบนเพื่อเริ่มกำหนดหัวข้อเรื่องและวันเวลาครบกำหนดให้ครูส่งงาน
          </p>
        </div>
      )}

      {/* Modal: Create / Edit Topic */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingTopic ? 'แก้ไขหัวข้อส่งงาน' : 'สร้างหัวข้อส่งงานใหม่ (กำหนดโดยแอดมิน)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {/* Title */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  ชื่อหัวข้อเรื่องที่ต้องการให้ครูส่ง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569 (หน่วยที่ 1-2)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    ประเภทผลงาน <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {DEFAULT_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="custom">-- อื่นๆ (ระบุเอง) --</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    ภาคเรียน
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="1">ภาคเรียนที่ 1</option>
                    <option value="2">ภาคเรียนที่ 2</option>
                    <option value="summer">ภาคฤดูร้อน</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    ปีการศึกษา
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {category === 'custom' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ระบุประเภทงานเพิ่มเติม
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น รายงานผลงานนักเรียนรางวัลระดับชาติ"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Due Date & Time */}
              <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-2">
                <label className="block font-bold text-blue-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  วันและเวลาครบกำหนดส่ง (Deadline) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-blue-300 p-2.5 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-blue-700">
                  หากคุณครูส่งหลังจากวันเวลาดังกล่าว ระบบจะบันทึกสถานะว่า "ส่งล่าช้า (Late)" โดยอัตโนมัติ
                </p>
              </div>

              {/* Description & Guidelines */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  คำชี้แจง / คำสั่งจากแอดมิน (Guidelines)
                </label>
                <textarea
                  rows={3}
                  placeholder="เช่น ให้จัดทำแผนการจัดการเรียนรู้ฉบับสมบูรณ์ พร้อมแบบบันทึกผลการประเมิน..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sub-tasks Section */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold text-xs text-purple-950 flex items-center gap-1.5">
                      <ListTodo className="w-4 h-4 text-purple-700" />
                      รายการงานย่อยในหัวข้อนี้ (Sub-tasks)
                    </label>
                    <p className="text-[10px] text-purple-700 mt-0.5">
                      กำหนดงานย่อยเพื่อให้ครูแนบไฟล์แยกตามรายการ (เช่น 1. แผนการสอน 2. โครงสร้างรายวิชา 3. แบบประเมิน)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubTask}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มงานย่อย
                  </button>
                </div>

                {subTasks.length > 0 ? (
                  <div className="space-y-2">
                    {subTasks.map((st, idx) => (
                      <div key={st.id} className="p-3 bg-white rounded-xl border border-purple-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            placeholder="ระบุชื่องานย่อย เช่น แผนการจัดการเรียนรู้..."
                            value={st.title}
                            onChange={(e) => handleUpdateSubTask(st.id, 'title', e.target.value)}
                            className="flex-1 text-xs rounded-lg border border-slate-200 p-2 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSubTask(st.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="ลบงานย่อยนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pl-7">
                          <input
                            type="text"
                            placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)..."
                            value={st.description || ''}
                            onChange={(e) => handleUpdateSubTask(st.id, 'description', e.target.value)}
                            className="flex-1 text-[11px] rounded-lg border border-slate-100 p-1.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 select-none cursor-pointer flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={st.isRequired}
                              onChange={(e) => handleUpdateSubTask(st.id, 'isRequired', e.target.checked)}
                              className="rounded text-purple-600"
                            />
                            จำเป็นต้องส่ง
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-purple-600 italic bg-white/70 p-2.5 rounded-xl border border-purple-100">
                    ยังไม่มีรายการงานย่อย (หากไม่ระบุ ครูจะส่งเป็นงานเดี่ยวตามปกติ)
                  </p>
                )}
              </div>

              {/* File Constraints */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">
                  ประเภทไฟล์ที่อนุญาตให้ส่ง
                </label>
                <div className="flex flex-wrap gap-2">
                  {['.pdf', '.docx', '.doc', '.xlsx', '.pptx', '.jpg', '.png', '.zip', '.mp4'].map(ext => (
                    <button
                      type="button"
                      key={ext}
                      onClick={() => handleToggleExtension(ext)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        allowedExtensions.includes(ext)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {ext}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Files & External Link Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    จำนวนไฟล์สูงสุดที่แนบได้
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={maxFiles}
                    onChange={(e) => setMaxFiles(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <input
                    type="checkbox"
                    id="allowExternalLinks"
                    checked={allowExternalLinks}
                    onChange={(e) => setAllowExternalLinks(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="allowExternalLinks" className="text-xs font-medium text-slate-700 select-none">
                    อนุญาตให้แนบลิงก์ภายนอก (Canva, Drive, YouTube)
                  </label>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 select-none">
                  เปิดรับการส่งงานทันทีหลังบันทึก
                </label>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-all"
                >
                  {editingTopic ? 'บันทึกการแก้ไข' : 'บันทึกและเปิดรับส่งงาน'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
