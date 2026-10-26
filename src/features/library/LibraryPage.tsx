import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getLibraryCategories, 
  updateLibraryCategoryName,
  addLibraryCategory,
  deleteLibraryCategory,
  getLibraryFiles, 
  addLibraryFile, 
  deleteLibraryFile,
  getSubmissionFilesGroupedByTopic,
  TopicFolderItem
} from '../../lib/storage';
import { uploadFilesToGoogleDrive } from '../../lib/googleDriveService';
import { 
  BookOpen, 
  Search, 
  UploadCloud, 
  Download, 
  Trash2, 
  FileText, 
  X, 
  ShieldAlert,
  FolderOpen,
  Folder,
  Lock,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Users,
  Eye,
  Sparkles,
  ShieldCheck,
  Edit3,
  Plus,
  Check,
  Settings2
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';

export const LibraryPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'templates' ? 'templates' : 'topic_folders';
  const [activeMainTab, setActiveMainTab] = useState<'topic_folders' | 'templates'>(initialTab);

  const [categories, setCategories] = useState(getLibraryCategories());
  const [files, setFiles] = useState(getLibraryFiles());
  const [topicFolders, setTopicFolders] = useState(getSubmissionFilesGroupedByTopic());

  // Listen to tab query param changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'templates') {
      setActiveMainTab('templates');
    } else if (tabParam === 'topic_folders') {
      setActiveMainTab('topic_folders');
    }
  }, [searchParams]);

  // Listen to real-time sync / data change events
  useEffect(() => {
    const handleDataChanged = () => {
      setCategories(getLibraryCategories());
      setFiles(getLibraryFiles());
      setTopicFolders(getSubmissionFilesGroupedByTopic());
    };
    window.addEventListener('sent_work_data_changed', handleDataChanged);
    window.addEventListener('storage', handleDataChanged);
    return () => {
      window.removeEventListener('sent_work_data_changed', handleDataChanged);
      window.removeEventListener('storage', handleDataChanged);
    };
  }, []);

  // Category Manager Modal state
  const [showCatManagerModal, setShowCatManagerModal] = useState(false);
  
  // Topic Folders Explorer State
  const [selectedTopicFolder, setSelectedTopicFolder] = useState<TopicFolderItem | null>(null);
  const [topicSearchTerm, setTopicSearchTerm] = useState('');

  // Sub-view in Topic Folders: 'folders' (มุมมองโฟลเดอร์) or 'files' (มุมมองรายการไฟล์ทั้งหมด)
  const [topicSubView, setTopicSubView] = useState<'folders' | 'files'>('folders');

  // Teacher Folder Filter: 'my_folders' (เฉพาะโฟลเดอร์ที่มีไฟล์ของตนเอง) or 'all_topics' (ทุกหัวข้องาน)
  const [teacherFolderScope, setTeacherFolderScope] = useState<'my_folders' | 'all_topics'>('my_folders');

  // Templates Tab State
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // New template file form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCatId, setNewCatId] = useState(categories[0]?.id || '');
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState(2500000);
  const [newFileType, setNewFileType] = useState('PDF');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Inline Category Management State
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Keep newCatId valid
  useEffect(() => {
    if (!newCatId && categories.length > 0) {
      setNewCatId(categories[0].id);
    }
  }, [categories, newCatId]);

  // Handler to rename category
  const handleSaveRenameCategory = () => {
    if (!editingCategoryName.trim()) {
      Swal.fire('กรุณาระบุชื่อหมวดหมู่', '', 'warning');
      return;
    }
    const targetCatId = newCatId || categories[0]?.id;
    if (!targetCatId) return;

    const updated = updateLibraryCategoryName(targetCatId, editingCategoryName.trim(), currentUser || undefined);
    setCategories([...updated]);
    setIsEditingCategory(false);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'เปลี่ยนชื่อหมวดหมู่เรียบร้อยแล้ว',
      showConfirmButton: false,
      timer: 2000
    });
  };

  // Handler to add new category
  const handleSaveNewCategory = () => {
    if (!newCategoryName.trim()) {
      Swal.fire('กรุณาระบุชื่อหมวดหมู่ใหม่', '', 'warning');
      return;
    }
    const created = addLibraryCategory(newCategoryName.trim(), '', currentUser || undefined);
    const updated = getLibraryCategories();
    setCategories([...updated]);
    setNewCatId(created.id);
    setIsAddingCategory(false);
    setNewCategoryName('');
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `สร้างหมวดหมู่ "${created.name}" เรียบร้อยแล้ว`,
      showConfirmButton: false,
      timer: 2000
    });
  };

  // Handler to delete category
  const handleDeleteCategory = (catId: string, catName: string) => {
    const filesInCat = files.filter(f => f.categoryId === catId);
    Swal.fire({
      title: 'ยืนยันการลบหมวดหมู่เอกสาร?',
      html: `
        <div class="text-left text-xs space-y-2">
          <p>คุณกำลังจะลบหมวดหมู่: <b class="text-rose-600 font-semibold">"${catName}"</b></p>
          ${filesInCat.length > 0 
            ? `<div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                ⚠️ มีเอกสารอยู่ในหมวดหมู่นี้ <b>${filesInCat.length}</b> ไฟล์ ระบบจะย้ายเอกสารทั้งหมดไปยังหมวดหมู่หลักเพื่อความปลอดภัย
               </div>` 
            : '<p class="text-slate-500">หมวดหมู่นี้ไม่มีเอกสารคงค้าง</p>'}
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ยืนยันลบหมวดหมู่นี้',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b'
    }).then((res) => {
      if (res.isConfirmed) {
        deleteLibraryCategory(catId, currentUser || undefined);
        const updated = getLibraryCategories();
        setCategories([...updated]);
        if (selectedCatId === catId) {
          setSelectedCatId('all');
        }
        if (newCatId === catId && updated.length > 0) {
          setNewCatId(updated[0].id);
        }
        Swal.fire({
          icon: 'success',
          title: 'ลบหมวดหมู่เรียบร้อยแล้ว',
          text: `หมวดหมู่ "${catName}" ถูกนำออกจากระบบแล้ว`,
          timer: 2000,
          showConfirmButton: false,
        });
      }
    });
  };

  // Filter accessible categories based on user role
  const accessibleCategories = categories.filter(c => c.allowedRoles.includes(role));

  const filteredTemplateFiles = files.filter(f => {
    if (!f.allowedRoles.includes(role)) return false;
    const matchesCat = selectedCatId === 'all' ? true : f.categoryId === selectedCatId;
    const matchesSearch = 
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      f.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Filter topic folders
  const filteredTopicFolders = topicFolders.filter(folder => 
    folder.topicTitle.toLowerCase().includes(topicSearchTerm.toLowerCase()) ||
    folder.category.toLowerCase().includes(topicSearchTerm.toLowerCase())
  );

  // Folders containing current teacher's files
  const myTopicFolders = filteredTopicFolders.filter(folder => 
    folder.files.some(f => f.teacherUid === currentUser?.uid)
  );

  // Folders to display:
  // Admin sees all folders.
  // Teachers see ONLY folders containing their files by default (other teachers' folders/files are not shown)
  const foldersToDisplay = role === 'admin'
    ? filteredTopicFolders
    : (teacherFolderScope === 'my_folders' ? myTopicFolders : filteredTopicFolders);

  // File count scoping:
  // Admin sees all files across the school.
  // Teachers see ONLY their own files count!
  const myTotalSubmissionFiles = topicFolders.reduce((acc, folder) => {
    return acc + folder.files.filter(f => f.teacherUid === currentUser?.uid).length;
  }, 0);
  const allTotalSubmissionFiles = topicFolders.reduce((acc, f) => acc + f.totalFiles, 0);

  const displayTabCount = role === 'admin' ? allTotalSubmissionFiles : myTotalSubmissionFiles;

  // Scope files inside selected topic folder:
  // Admin sees ALL files, Teacher sees ONLY their own files (other teachers' files are completely hidden!)
  const visibleTopicFiles = selectedTopicFolder 
    ? (role === 'admin' 
        ? selectedTopicFolder.files 
        : selectedTopicFolder.files.filter(f => f.teacherUid === currentUser?.uid))
    : [];

  // All scoped files list (for flat 'files' view):
  // Admin sees all files, Teacher sees strictly ONLY their own files!
  const allScopedFiles = topicFolders.flatMap(folder => {
    return folder.files
      .filter(f => role === 'admin' || f.teacherUid === currentUser?.uid)
      .map(f => ({
        ...f,
        topicCategory: folder.category,
        topicDueDate: folder.dueDate
      }));
  }).filter(f => {
    if (!topicSearchTerm) return true;
    const term = topicSearchTerm.toLowerCase();
    return (
      f.fileName.toLowerCase().includes(term) ||
      f.folderName.toLowerCase().includes(term) ||
      (f.teacherName && f.teacherName.toLowerCase().includes(term))
    );
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newFileName.trim()) {
      Swal.fire('กรุณากรอกข้อมูลให้ครบถ้วน', '', 'warning');
      return;
    }
    if (!currentUser) return;

    let downloadUrl = '#';
    let driveUrl: string | undefined = undefined;
    let driveFileId: string | undefined = undefined;
    let driveFolderUrl = 'https://drive.google.com/drive/folders/1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd';

    if (selectedFile) {
      Swal.fire({
        title: 'กำลังอัปโหลดเอกสารไปยัง Google Drive...',
        html: `
          <div class="text-left text-xs space-y-2 mt-2 text-slate-600">
            <p>ระบบกำลังบันทึกเอกสารเข้าสู่คลัง Google Drive กลางของสถานศึกษา...</p>
            <div class="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-mono text-[11px] truncate">
              📁 Google Drive / คลังเอกสารกลาง & แบบฟอร์ม /
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
        topicTitle: 'คลังเอกสารกลาง & แบบฟอร์ม',
        teacherName: '',
        files: [{
          fileObject: selectedFile,
          fileName: newFileName.trim() || selectedFile.name,
          fileSizeBytes: selectedFile.size,
          mimeType: selectedFile.type || 'application/octet-stream',
        }]
      });

      if (driveRes.success && driveRes.files.length > 0) {
        if (driveRes.folderUrl) driveFolderUrl = driveRes.folderUrl;
        const up = driveRes.files[0];
        driveFileId = up.fileId;
        driveUrl = up.fileUrl || (driveFileId ? `https://drive.google.com/file/d/${driveFileId}/view` : undefined);
        downloadUrl = up.downloadUrl || (driveFileId ? `https://drive.google.com/uc?export=download&id=${driveFileId}` : '#');
      }
    }

    addLibraryFile(
      {
        categoryId: newCatId,
        title: newTitle.trim(),
        description: newDesc.trim(),
        fileName: newFileName.trim(),
        fileSizeBytes: newFileSize,
        fileType: newFileType,
        driveFileId,
        driveUrl,
        downloadUrl,
        uploadedByName: currentUser.displayName,
        allowedRoles: ['teacher', 'admin'],
      },
      currentUser
    );

    setShowUploadModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewFileName('');
    setSelectedFile(null);

    Swal.fire({
      title: 'เพิ่มเอกสารเข้าคลังสำเร็จ!',
      html: `
        <div class="text-left text-xs space-y-2 mt-2 text-slate-600">
          <p>เอกสารพร้อมให้ครูและผู้บริหารดาวน์โหลด และซิงค์ลง Google Drive เรียบร้อยแล้ว</p>
          <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-mono text-[11px] truncate">
            📁 Google Drive / คลังเอกสารกลาง & แบบฟอร์ม / ${newFileName.trim()}
          </div>
        </div>
      `,
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: '📂 ดูใน Google Drive',
      cancelButtonText: 'ตกลง',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(driveFolderUrl, '_blank');
      }
      window.location.reload();
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!currentUser) return;
    Swal.fire({
      title: 'ยืนยันการลบเอกสาร?',
      text: `ต้องการลบไฟล์ "${title}" ออกจากคลังเอกสารใช่หรือไม่`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเอกสาร',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#e11d48',
    }).then(res => {
      if (res.isConfirmed) {
        deleteLibraryFile(id, currentUser);
        Swal.fire('ลบเอกสารเรียบร้อย', '', 'success').then(() => {
          window.location.reload();
        });
      }
    });
  };

  const handleFileDownload = (file: any, folderName?: string) => {
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
    const fileName = file.fileName || file.title || 'academic_document';
    Swal.fire({
      title: 'ข้อมูลเอกสาร',
      html: `
        <div class="text-left text-xs space-y-2 text-slate-700">
          <p><strong>ชื่อไฟล์:</strong> ${fileName}</p>
          <div class="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-900">
            <p class="font-bold">📁 โฟลเดอร์ใน Google Drive:</p>
            <p class="font-mono text-[11px] mt-0.5">Google Drive / ${folderName || file.folderName || 'คลังส่วนกลาง'} /</p>
          </div>
          <p class="text-slate-500">กรุณาเปิดดูหรือดาวน์โหลดไฟล์ต้นฉบับผ่าน Google Drive ของสถาบัน</p>
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
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            คลังเอกสารกลางและโฟลเดอร์จัดเก็บผลงาน
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {role === 'admin' 
              ? 'ฝ่ายตรวจงาน (Admin) สามารถดูไฟล์ผลงานที่ครูทุกคนส่งเข้ามาแยกตามโฟลเดอร์ชื่องาน' 
              : 'คุณครูสามารถเข้าดูเฉพาะไฟล์ผลงานของตนเองที่ส่งเข้าโฟลเดอร์ตามชื่องาน (รักษาความเป็นส่วนตัว)'}
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => { 
              setActiveMainTab('topic_folders'); 
              setSelectedTopicFolder(null); 
              setSearchParams({});
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeMainTab === 'topic_folders'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-blue-600" />
            <span>โฟลเดอร์ผลงานตามชื่องาน ({displayTabCount})</span>
          </button>

          <button
            onClick={() => {
              setActiveMainTab('templates');
              setSearchParams({ tab: 'templates' });
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeMainTab === 'templates'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>คู่มือ & แบบฟอร์มกลาง ({files.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SUBMISSION FILES ORGANIZED BY TOPIC FOLDERS       */}
      {/* ======================================================== */}
      {activeMainTab === 'topic_folders' && (
        <div className="space-y-6 animate-fade-in">

          {/* Breadcrumb / Top Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-400">เส้นทางจัดเก็บ:</span>
              <span className="font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                📁 Google Drive
              </span>
              {selectedTopicFolder && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 truncate max-w-xs">
                    📁 {selectedTopicFolder.topicTitle}
                  </span>
                </>
              )}
            </div>

            {selectedTopicFolder ? (
              <button
                onClick={() => setSelectedTopicFolder(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                กลับหน้ารวมโฟลเดอร์
              </button>
            ) : (
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={topicSearchTerm}
                  onChange={(e) => setTopicSearchTerm(e.target.value)}
                  placeholder="ค้นหาชื่อโฟลเดอร์งาน..."
                  className="w-full text-xs rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Sub-view Switcher & Teacher Scope Pills (when not inside a specific folder) */}
          {!selectedTopicFolder && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              
              {/* Left: View Mode Toggle (Folder View vs File List View) */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold w-fit">
                <button
                  onClick={() => setTopicSubView('folders')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    topicSubView === 'folders'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>แยกตามโฟลเดอร์</span>
                </button>
                <button
                  onClick={() => setTopicSubView('files')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    topicSubView === 'files'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {role === 'admin' 
                      ? `รายการไฟล์ทั้งหมดในระบบ (${allScopedFiles.length})` 
                      : `รายการไฟล์ของฉัน (${allScopedFiles.length})`}
                  </span>
                </button>
              </div>

              {/* Right: Teacher Folder Filter Scope (เฉพาะครู) / Admin badge */}
              <div className="flex items-center gap-2">
                {role !== 'admin' ? (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">แสดง:</span>
                    <button
                      onClick={() => setTeacherFolderScope('my_folders')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        teacherFolderScope === 'my_folders'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      📁 โฟลเดอร์งานของฉัน ({myTopicFolders.length})
                    </button>
                    <button
                      onClick={() => setTeacherFolderScope('all_topics')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        teacherFolderScope === 'all_topics'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      📋 ทุกหัวข้อ ({filteredTopicFolders.length})
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                    โหมดผู้ดูแลระบบ: แสดงไฟล์และโฟลเดอร์ของครูทุกคน
                  </span>
                )}
              </div>
            </div>
          )}

          {/* VIEW A: LIST OF TOPIC FOLDERS */}
          {!selectedTopicFolder && topicSubView === 'folders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  {role === 'admin' 
                    ? `โฟลเดอร์งานวิชาการทั้งหมด (${foldersToDisplay.length} โฟลเดอร์)` 
                    : teacherFolderScope === 'my_folders'
                      ? `โฟลเดอร์งานที่มีไฟล์ของคุณ (${foldersToDisplay.length} โฟลเดอร์)`
                      : `หัวข้องานที่เปิดรับทั้งหมด (${foldersToDisplay.length} โฟลเดอร์)`}
                </h3>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {role === 'admin' 
                    ? 'สิทธิ์แอดมิน: แสดงไฟล์ผลงานของครูทุกคนในแต่ละโฟลเดอร์' 
                    : 'สิทธิ์ครู: แสดงเฉพาะไฟล์ผลงานของตนเอง (ของครูท่านอื่นจะไม่แสดง)'}
                </span>
              </div>

              {foldersToDisplay.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200/80">
                    <FolderOpen className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {role === 'admin'
                      ? 'ไม่พบโฟลเดอร์งานที่ตรงกับคำค้นหา'
                      : 'ยังไม่มีไฟล์ผลงานของคุณในโฟลเดอร์ขณะนี้'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {role === 'admin'
                      ? 'ลองปรับเปลี่ยนคำค้นหา หรือสร้างหัวข้อส่งงานใหม่'
                      : 'ระบบแสดงเฉพาะไฟล์ที่คุณส่งเท่านั้น เมื่อคุณส่งงานเข้าหัวข้อ โฟลเดอร์จะแสดงที่นี่โดยอัตโนมัติ'}
                  </p>
                  {role !== 'admin' && (
                    <div className="pt-2 flex items-center justify-center gap-3">
                      <Link
                        to="/submit"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <UploadCloud className="w-4 h-4" />
                        ส่งผลงานใหม่เข้าโฟลเดอร์
                      </Link>
                      <button
                        onClick={() => setTeacherFolderScope('all_topics')}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        ดูหัวข้องานทั้งหมด ({filteredTopicFolders.length})
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {foldersToDisplay.map((folder) => {
                    const myFilesInFolder = folder.files.filter(f => f.teacherUid === currentUser?.uid).length;
                    const fileCountLabel = role === 'admin'
                      ? `${folder.totalFiles} ไฟล์เอกสาร (ทั้งหมด)`
                      : myFilesInFolder > 0
                        ? `${myFilesInFolder} ไฟล์ของคุณ`
                        : 'ยังไม่มีไฟล์ของคุณ';

                    return (
                      <div
                        key={folder.topicId}
                        onClick={() => setSelectedTopicFolder(folder)}
                        className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          {/* Folder Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-amber-200/80 shadow-2xs">
                              <FolderOpen className="w-6 h-6 text-amber-600 fill-amber-100" />
                            </div>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 truncate">
                              {folder.category}
                            </span>
                          </div>

                          {/* Folder Name (ชื่องาน) */}
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                            {folder.topicTitle}
                          </h4>

                          {folder.description && (
                            <p className="text-xs text-slate-400 line-clamp-2">
                              {folder.description}
                            </p>
                          )}
                        </div>

                        {/* Folder Stats Footer */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            {fileCountLabel}
                          </span>
                          <span className="text-[11px] text-blue-600 font-bold group-hover:underline">
                            เปิดดูโฟลเดอร์ →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW B: FLAT ALL SCOPED FILES LIST (รายการไฟล์ทั้งหมดตามสิทธิ์) */}
          {!selectedTopicFolder && topicSubView === 'files' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4 p-5">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    {role === 'admin' 
                      ? `รายการไฟล์ผลงานทั้งหมดในระบบ (${allScopedFiles.length} ไฟล์)` 
                      : `รายการไฟล์ผลงานของฉัน (${allScopedFiles.length} ไฟล์)`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {role === 'admin'
                      ? 'แอดมินสามารถเปิดดูและดาวน์โหลดไฟล์ที่ครูทุกคนส่งเข้ามาได้จากหน้านี้'
                      : 'แสดงเฉพาะไฟล์ที่คุณส่งเท่านั้น ปลอดภัยและรักษาความเป็นส่วนตัว'}
                  </p>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {role === 'admin' ? 'สิทธิ์ผู้ดูแลระบบ' : 'ไฟล์ส่วนตัวของคุณ'}
                </div>
              </div>

              {allScopedFiles.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">ไม่พบไฟล์ผลงาน</p>
                  <p className="text-xs text-slate-400">
                    {role === 'admin'
                      ? 'ยังไม่มีการส่งไฟล์เข้ามาในระบบ หรือไม่ตรงกับคำค้นหา'
                      : 'คุณยังไม่ได้ส่งไฟล์ผลงานใดๆ ในขณะนี้'}
                  </p>
                  {role !== 'admin' && (
                    <div className="pt-2">
                      <Link
                        to="/submit"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                      >
                        <UploadCloud className="w-4 h-4" /> ส่งงานใหม่
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-full overflow-x-auto min-w-0 border border-slate-200/80 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3 min-w-[200px]">ชื่อไฟล์เอกสาร</th>
                        <th className="p-3 min-w-[180px]">โฟลเดอร์ตามชื่องาน (Drive)</th>
                        {role === 'admin' && (
                          <th className="p-3 min-w-[160px]">คุณครูผู้ส่งผลงาน</th>
                        )}
                        <th className="p-3 w-28 text-center">วันที่ส่ง</th>
                        <th className="p-3 w-24 text-center">ขนาด</th>
                        <th className="p-3 w-28 text-center">สถานะตรวจ</th>
                        <th className="p-3 w-32 text-center">การกระทำ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {allScopedFiles.map((file, idx) => (
                        <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-center text-slate-400 font-semibold">{idx + 1}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 uppercase border border-blue-200">
                                {file.fileName.split('.').pop() || 'FILE'}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate max-w-xs sm:max-w-md" title={file.fileName}>
                                  {file.fileName}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                  งาน: {file.submissionTitle} (v{file.versionNumber})
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 w-fit max-w-[220px] truncate" title={file.folderName}>
                              📁 /{file.folderName}/
                            </span>
                          </td>
                          {role === 'admin' && (
                            <td className="p-3">
                              <p className="font-semibold text-slate-800">{file.teacherName}</p>
                              <p className="text-[10px] text-slate-400">{file.teacherDepartment || 'ทั่วไป'}</p>
                            </td>
                          )}
                          <td className="p-3 text-center text-slate-600">
                            {new Date(file.uploadedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="p-3 text-center text-slate-500 font-mono text-[11px]">
                            {(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                          </td>
                          <td className="p-3 text-center">
                            {file.status === 'passed' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ผ่าน
                              </span>
                            )}
                            {file.status === 'submitted' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                รอตรวจ
                              </span>
                            )}
                            {file.status === 'revision_required' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                ต้องแก้ไข
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleFileDownload(file, file.folderName)}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors shadow-2xs"
                                title="ดาวน์โหลดไฟล์สำเนา"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <Link
                                to={`/submissions/${file.submissionId}`}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                                title="เปิดดูงานส่ง"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW B: INSIDE A SELECTED TOPIC FOLDER */}
          {selectedTopicFolder && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
              
              {/* Folder Details Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 flex-shrink-0">
                    <FolderOpen className="w-6 h-6 text-amber-600 fill-amber-100" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-lg border border-blue-200">
                        {selectedTopicFolder.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {selectedTopicFolder.topicTitle}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      โฟลเดอร์จัดเก็บผลงานบน Google Drive: <code className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">/{selectedTopicFolder.topicTitle}/</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[10px]">
                      {role === 'admin' ? 'ไฟล์ในโฟลเดอร์นี้ (ทั้งหมด)' : 'ไฟล์ของคุณในโฟลเดอร์นี้'}
                    </span>
                    <span className="font-bold text-slate-800">{visibleTopicFiles.length} ไฟล์</span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[10px]">กำหนดส่งงาน</span>
                    <span className="font-bold text-slate-800">
                      {new Date(selectedTopicFolder.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Files in this Topic Folder (Filtered: Teacher sees ONLY own files; Admin sees all) */}
              {visibleTopicFiles.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-50/50 rounded-2xl border border-slate-200/80">
                  <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">
                    {role === 'admin' 
                      ? 'ยังไม่มีไฟล์เอกสารถูกจัดเก็บในโฟลเดอร์นี้' 
                      : 'คุณยังไม่ได้ส่งไฟล์ผลงานในหัวข้อนี้'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {role === 'admin'
                      ? 'เมื่อคุณครูส่งผลงานตามหัวข้อนี้ ไฟล์จะปรากฏในโฟลเดอร์นี้โดยอัตโนมัติ'
                      : 'ระบบแสดงเฉพาะไฟล์ที่คุณส่งเท่านั้น เพื่อความเป็นส่วนตัวและความปลอดภัยของข้อมูล'}
                  </p>
                  {role !== 'admin' && (
                    <Link
                      to={`/submit?topicId=${selectedTopicFolder.topicId}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all"
                    >
                      <UploadCloud className="w-4 h-4" />
                      ส่งผลงานในหัวข้อนี้
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold">
                      {role === 'admin' ? 'รายการไฟล์ทั้งหมดในโฟลเดอร์นี้:' : 'ไฟล์ผลงานของคุณในโฟลเดอร์นี้:'}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {role === 'admin' ? 'แอดมินสามารถเปิดดูไฟล์ของครูทุกคนได้' : 'แสดงเฉพาะไฟล์ที่คุณส่งเท่านั้น'}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    {visibleTopicFiles.map((fileItem) => {
                      return (
                        <div
                          key={fileItem.id}
                          className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          {/* File info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase shadow-2xs">
                              {fileItem.fileName.split('.').pop() || 'FILE'}
                            </div>

                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate text-xs">
                                {fileItem.fileName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                                {role === 'admin' && (
                                  <>
                                    <span className="font-semibold text-slate-700">
                                      ครูผู้ส่ง: {fileItem.teacherName}
                                    </span>
                                    <span>•</span>
                                    <span>{fileItem.teacherDepartment || 'ทั่วไป'}</span>
                                    <span>•</span>
                                  </>
                                )}
                                <span>{(fileItem.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                                <span>•</span>
                                <span>ส่งเมื่อ {new Date(fileItem.uploadedAt).toLocaleDateString('th-TH')}</span>
                                <span>•</span>
                                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                  📁 {fileItem.folderName}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {fileItem.driveUrl && (
                              <a
                                href={fileItem.driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-semibold transition-all shadow-2xs"
                                title="เปิดดูบน Google Drive"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                                <span>Drive</span>
                              </a>
                            )}
                            <button
                              onClick={() => handleFileDownload(fileItem, selectedTopicFolder.topicTitle)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-2xs text-xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>ดาวน์โหลด</span>
                            </button>
                            <Link
                              to={`/submissions/${fileItem.submissionId}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                            >
                              ดูงานส่ง
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: GENERAL TEMPLATES & GUIDES (คลังแบบฟอร์มกลาง)     */}
      {/* ======================================================== */}
      {activeMainTab === 'templates' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Categories Tabs & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาชื่อเอกสาร, แบบฟอร์ม..."
                  className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://drive.google.com/drive/folders/1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold shadow-2xs transition-all"
                  title="เปิดโฟลเดอร์ Google Drive คลังเอกสารส่วนกลาง"
                >
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span>Google Drive กลาง</span>
                </a>

                {role === 'admin' && (
                  <button
                    onClick={() => {
                      setIsEditingCategory(false);
                      setIsAddingCategory(false);
                      setShowUploadModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    เพิ่มแบบฟอร์มเข้าคลัง
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCatId('all')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
                  selectedCatId === 'all'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                เอกสารทั้งหมด ({files.length})
              </button>
              {accessibleCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCatId === cat.id
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  {cat.name}
                </button>
              ))}

              {role === 'admin' && selectedCatId !== 'all' && (
                <button
                  onClick={() => {
                    const currentCat = accessibleCategories.find(c => c.id === selectedCatId);
                    if (!currentCat) return;
                    Swal.fire({
                      title: 'เปลี่ยนชื่อหมวดหมู่เอกสาร',
                      input: 'text',
                      inputLabel: `ชื่อหมวดหมู่เดิม: "${currentCat.name}"`,
                      inputValue: currentCat.name,
                      showCancelButton: true,
                      confirmButtonText: 'บันทึกชื่อใหม่',
                      cancelButtonText: 'ยกเลิก',
                      confirmButtonColor: '#2563eb',
                      inputValidator: (value) => {
                        if (!value || !value.trim()) {
                          return 'กรุณากรอกชื่อหมวดหมู่';
                        }
                      }
                    }).then((result) => {
                      if (result.isConfirmed && result.value) {
                        const updated = updateLibraryCategoryName(selectedCatId, result.value.trim(), currentUser || undefined);
                        setCategories([...updated]);
                        Swal.fire({
                          icon: 'success',
                          title: 'เปลี่ยนชื่อสำเร็จ!',
                          text: `หมวดหมู่ถูกเปลี่ยนชื่อเป็น "${result.value.trim()}" เรียบร้อยแล้ว`,
                          timer: 2000,
                          showConfirmButton: false,
                        });
                      }
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-xl font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors whitespace-nowrap flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="เปลี่ยนชื่อหมวดหมู่นี้"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>เปลี่ยนชื่อหมวดหมู่นี้</span>
                </button>
              )}

              {role === 'admin' && selectedCatId !== 'all' && (
                <button
                  onClick={() => {
                    const currentCat = accessibleCategories.find(c => c.id === selectedCatId);
                    if (!currentCat) return;
                    handleDeleteCategory(currentCat.id, currentCat.name);
                  }}
                  className="px-2.5 py-1.5 rounded-xl font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors whitespace-nowrap flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="ลบหมวดหมู่เอกสารนี้"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>ลบหมวดหมู่นี้</span>
                </button>
              )}

              {role === 'admin' && (
                <button
                  onClick={() => {
                    Swal.fire({
                      title: 'เพิ่มหมวดหมู่เอกสารใหม่',
                      input: 'text',
                      inputPlaceholder: 'เช่น เอกสารการเงินและพัสดุ...',
                      showCancelButton: true,
                      confirmButtonText: 'สร้างหมวดหมู่',
                      cancelButtonText: 'ยกเลิก',
                      confirmButtonColor: '#059669',
                      inputValidator: (value) => {
                        if (!value || !value.trim()) {
                          return 'กรุณากรอกชื่อหมวดหมู่';
                        }
                      }
                    }).then((result) => {
                      if (result.isConfirmed && result.value) {
                        const created = addLibraryCategory(result.value.trim(), '', currentUser || undefined);
                        const updated = getLibraryCategories();
                        setCategories([...updated]);
                        setSelectedCatId(created.id);
                        Swal.fire({
                          icon: 'success',
                          title: 'สร้างหมวดหมู่สำเร็จ!',
                          text: `เพิ่มหมวดหมู่ "${created.name}" เรียบร้อยแล้ว`,
                          timer: 2000,
                          showConfirmButton: false,
                        });
                      }
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-xl font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors whitespace-nowrap flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="สร้างหมวดหมู่เอกสารใหม่"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มหมวดหมู่</span>
                </button>
              )}

              {role === 'admin' && (
                <button
                  onClick={() => setShowCatManagerModal(true)}
                  className="px-2.5 py-1.5 rounded-xl font-semibold text-slate-700 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors whitespace-nowrap flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="เปิดหน้าต่างจัดการหมวดหมู่ทั้งหมด"
                >
                  <Settings2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>จัดการหมวดหมู่</span>
                </button>
              )}
            </div>
          </div>

          {/* Templates Grid */}
          {filteredTemplateFiles.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-400">ไม่พบเอกสารในหมวดหมู่นี้</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplateFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {file.fileType}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                      {file.title}
                    </h4>

                    {file.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {file.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      ดาวน์โหลดแล้ว {file.downloadsCount} ครั้ง
                    </span>

                    <div className="flex items-center gap-2">
                      {role === 'admin' && (
                        <button
                          onClick={() => handleDelete(file.id, file.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="ลบไฟล์"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleFileDownload(file)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> ดาวน์โหลด
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* UPLOAD MODAL FOR TEMPLATES */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-blue-600" />
                อัปโหลดแบบฟอร์มเข้าคลังกลาง
              </h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">หมวดหมู่เอกสาร</label>
                  {role === 'admin' && (
                    <div className="flex items-center gap-2">
                      {!isEditingCategory && !isAddingCategory && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const curr = accessibleCategories.find(c => c.id === newCatId) || accessibleCategories[0];
                              setEditingCategoryName(curr?.name || '');
                              setIsEditingCategory(true);
                              setIsAddingCategory(false);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            title="แก้ไขเปลี่ยนชื่อหมวดหมู่ที่เลือก"
                          >
                            <Edit3 className="w-3 h-3" />
                            เปลี่ยนชื่อหมวดหมู่นี้
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              setNewCategoryName('');
                              setIsAddingCategory(true);
                              setIsEditingCategory(false);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer"
                            title="สร้างหมวดหมู่เอกสารใหม่"
                          >
                            <Plus className="w-3 h-3" />
                            เพิ่มหมวดหมู่ใหม่
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              const curr = accessibleCategories.find(c => c.id === newCatId) || accessibleCategories[0];
                              if (!curr) return;
                              handleDeleteCategory(curr.id, curr.name);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                            title="ลบหมวดหมู่ที่เลือกนี้"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            ลบหมวดหมู่นี้
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Inline Rename Box */}
                {isEditingCategory && (
                  <div className="p-3 rounded-2xl bg-blue-50/90 border border-blue-200 space-y-2 animate-fade-in shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 text-[11px] flex items-center gap-1">
                        <Edit3 className="w-3 h-3 text-blue-600" />
                        เปลี่ยนชื่อหมวดหมู่เอกสาร
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingCategory(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        placeholder="ระบุชื่อหมวดหมู่ใหม่..."
                        className="flex-1 rounded-xl border border-blue-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveRenameCategory}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                      >
                        บันทึกชื่อใหม่
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingCategory(false)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Add New Category Box */}
                {isAddingCategory && (
                  <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 space-y-2 animate-fade-in shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 text-[11px] flex items-center gap-1">
                        <Plus className="w-3 h-3 text-emerald-600" />
                        เพิ่มหมวดหมู่เอกสารใหม่
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="พิมพ์ชื่อหมวดหมู่ใหม่ เช่น เอกสารการเงินและพัสดุ..."
                        className="flex-1 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveNewCategory}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                      >
                        สร้างหมวดหมู่
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}

                {/* Main Category Dropdown */}
                <select
                  value={newCatId}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setNewCategoryName('');
                      setIsAddingCategory(true);
                      setIsEditingCategory(false);
                    } else {
                      setNewCatId(e.target.value);
                      setIsEditingCategory(false);
                      setIsAddingCategory(false);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 p-2 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {accessibleCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {role === 'admin' && (
                    <option value="__add_new__" className="text-emerald-700 font-bold">
                      ➕ เพิ่มหมวดหมู่ใหม่...
                    </option>
                  )}
                </select>
              </div>

              {/* Google Drive Destination Badge */}
              <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-blue-900">
                <FolderOpen className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <p className="font-bold">ซิงค์ลง Google Drive อัตโนมัติ:</p>
                  <p className="font-mono text-[11px] text-blue-700 truncate">
                    📁 Google Drive / คลังเอกสารกลาง & แบบฟอร์ม /
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  เลือกไฟล์จากเครื่อง <span className="text-blue-600 font-normal text-xs">(ซิงค์ขึ้น Google Drive อัตโนมัติ)</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      setNewFileName(file.name);
                      setNewFileSize(file.size);
                      if (file.name.toLowerCase().endsWith('.pdf')) setNewFileType('PDF');
                      else if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) setNewFileType('DOCX');
                      else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) setNewFileType('XLSX');
                      if (!newTitle.trim()) {
                        setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
                      }
                    }
                  }}
                  className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-xl p-2 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อเอกสาร / แบบฟอร์ม</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น คู่มือการเขียนแผนการจัดการเรียนรู้ 2569"
                  className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">รายละเอียดเอกสาร</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="คำอธิบายวิธีการนำเอกสารไปใช้..."
                  className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อไฟล์</label>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="template_2026.docx"
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ประเภทไฟล์</label>
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="DOCX">Word Document</option>
                    <option value="XLSX">Excel Spreadsheet</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  บันทึกเข้าคลัง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MANAGER MODAL */}
      {showCatManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-600" />
                จัดการหมวดหมู่เอกสารทั้งหมด ({categories.length} หมวดหมู่)
              </h3>
              <button 
                onClick={() => setShowCatManagerModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Form */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">➕ เพิ่มหมวดหมู่เอกสารใหม่</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="เช่น เอกสารฝ่ายงบประมาณและพัสดุ..."
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSaveNewCategory}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  เพิ่ม
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="max-h-80 overflow-y-auto space-y-2 divide-y divide-slate-100 pr-1">
              {categories.map((cat) => {
                const count = files.filter(f => f.categoryId === cat.id).length;
                return (
                  <div key={cat.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{cat.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">มีเอกสาร {count} รายการ</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          Swal.fire({
                            title: 'เปลี่ยนชื่อหมวดหมู่เอกสาร',
                            input: 'text',
                            inputLabel: `ชื่อหมวดหมู่เดิม: "${cat.name}"`,
                            inputValue: cat.name,
                            showCancelButton: true,
                            confirmButtonText: 'บันทึกชื่อใหม่',
                            cancelButtonText: 'ยกเลิก',
                            confirmButtonColor: '#2563eb',
                            inputValidator: (value) => {
                              if (!value || !value.trim()) {
                                return 'กรุณากรอกชื่อหมวดหมู่';
                              }
                            }
                          }).then((result) => {
                            if (result.isConfirmed && result.value) {
                              const updated = updateLibraryCategoryName(cat.id, result.value.trim(), currentUser || undefined);
                              setCategories([...updated]);
                              Swal.fire({
                                icon: 'success',
                                title: 'เปลี่ยนชื่อสำเร็จ!',
                                text: `หมวดหมู่ถูกเปลี่ยนชื่อเป็น "${result.value.trim()}" เรียบร้อยแล้ว`,
                                timer: 2000,
                                showConfirmButton: false,
                              });
                            }
                          });
                        }}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                        title="เปลี่ยนชื่อหมวดหมู่นี้"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                        title="ลบหมวดหมู่นี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowCatManagerModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
