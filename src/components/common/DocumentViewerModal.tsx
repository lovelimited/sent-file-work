import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Printer, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  Lock,
  Sparkles,
  ShieldCheck,
  Calendar,
  User,
  FolderOpen
} from 'lucide-react';
import Swal from 'sweetalert2';

export interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id?: string;
    fileName: string;
    fileSizeBytes: number;
    fileType?: string;
    mimeType?: string;
    previewUrl?: string;
    downloadUrl?: string;
    subTaskTitle?: string;
    subTaskId?: string;
    folderName?: string;
    folderPath?: string;
    uploadedAt?: string;
  } | null;
  teacherName?: string;
  teacherDepartment?: string;
  topicTitle?: string;
  // In-modal quick admin review actions
  canReview?: boolean;
  subTaskDecision?: 'passed' | 'revision_required';
  onSubTaskDecisionChange?: (subTaskId: string, decision: 'passed' | 'revision_required') => void;
  subTaskFeedback?: string;
  onSubTaskFeedbackChange?: (subTaskId: string, feedback: string) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  file,
  teacherName = 'ครูผู้สอน',
  teacherDepartment = 'กลุ่มสาระการเรียนรู้',
  topicTitle = 'ผลงานวิชาการ',
  canReview = false,
  subTaskDecision,
  onSubTaskDecisionChange,
  subTaskFeedback = '',
  onSubTaskFeedbackChange,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const totalPages = 3;

  if (!isOpen || !file) return null;

  const fileExt = file.fileName.split('.').pop()?.toLowerCase() || 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt);
  const isPdf = fileExt === 'pdf';
  const isWord = ['doc', 'docx'].includes(fileExt);
  const isExcel = ['xls', 'xlsx'].includes(fileExt);

  const driveId = (file as any).driveFileId || 
    ((file as any).driveUrl?.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]) ||
    ((file as any).driveUrl?.match(/id=([a-zA-Z0-9_-]+)/)?.[1]);
  const hasValidDriveId = Boolean(driveId && !driveId.includes('_p') && driveId.length > 15);
  const hasBlobPdfPreview = Boolean(file.previewUrl && (file.previewUrl.startsWith('blob:') || file.previewUrl.startsWith('data:application/pdf')));

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 75));
  const handleResetZoom = () => setZoomLevel(100);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (file.downloadUrl && file.downloadUrl !== '#') {
      window.open(file.downloadUrl, '_blank');
      return;
    }
    if ((file as any).driveUrl) {
      window.open((file as any).driveUrl, '_blank');
      return;
    }
    const content = `โรงเรียนสารสาสน์วิเทศราชพฤกษ์\nเอกสารผลงานวิชาการ: ${file.fileName}\nหัวข้องาน: ${topicTitle}\nครูผู้จัดทำ: ${teacherName} (${teacherDepartment})\nวันเวลา: ${new Date().toLocaleString('th-TH')}\n\nเอกสารบันทึกในระบบส่งงานวิชาการและคลัง Google Drive โรงเรียนสารสาสน์วิเทศราชพฤกษ์`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName.includes('.') ? file.fileName : `${file.fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Swal.fire({
      title: 'ดาวน์โหลดเอกสารเรียบร้อย',
      html: `ไฟล์: <b>${file.fileName}</b><br/><span class="text-xs text-slate-500">บันทึกสำเนาลงในเครื่องของคุณแล้ว</span>`,
      icon: 'success',
      timer: 1800,
      showConfirmButton: false
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Viewer Container */}
      <div className={`bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[92vh]'
      }`}>
        
        {/* Top Navigation & Toolbar Bar */}
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-white flex-shrink-0">
          
          {/* File Meta Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
              {fileExt}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white truncate max-w-[280px] sm:max-w-[420px]" title={file.fileName}>
                  {file.fileName}
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                </span>
                {file.subTaskTitle && (
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded-full border border-purple-700/80 truncate max-w-[220px]">
                    📌 {file.subTaskTitle}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-2">
                <span>ผู้ส่ง: <strong className="text-slate-300">{teacherName}</strong> ({teacherDepartment})</span>
                <span>•</span>
                <span>หัวข้อ: <span className="text-blue-400">{topicTitle}</span></span>
              </p>
            </div>
          </div>

          {/* Controls: Zoom, Pages, Print, Download, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            
            {/* Page Navigator */}
            {!isImage && (
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-1.5 py-1 text-xs text-slate-300 mr-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="หน้าก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono font-semibold text-[11px]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="หน้าถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-1 py-1 text-xs text-slate-300">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 hover:text-white"
                title="ย่อขนาด"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 font-mono text-[10px] text-slate-400 hover:text-white"
                title="ขนาดปกติ 100%"
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 hover:text-white"
                title="ขยายขนาด"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="พิมพ์เอกสาร"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Open in Google Drive Button */}
            <a
              href={(file as any).driveUrl || `https://drive.google.com/drive/folders/1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              title="เปิดไฟล์นี้บน Google Drive"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เปิดใน Drive</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              title="ดาวน์โหลดสำเนาเก็บไว้ในเครื่อง"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ดาวน์โหลด</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(prev => !prev)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title={isFullscreen ? 'ย่อหน้าต่าง' : 'เต็มหน้าจอ'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 transition-colors ml-1"
              title="ปิดหน้าต่าง (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Viewer Content Canvas (Scrollable Document Paper Area) */}
        <div className="flex-1 bg-slate-950 overflow-y-auto p-4 sm:p-8 flex justify-center items-start scrollbar-thin">
          
          <div 
            className="transition-transform duration-200 origin-top flex flex-col items-center"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {/* Real Google Drive Embedded Viewer */}
            {hasValidDriveId ? (
              <div className="w-[880px] max-w-[95vw] h-[82vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
                <div className="bg-slate-800 text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-slate-700 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-semibold text-emerald-400">
                      แสดงผลเอกสารจริงจาก Google Drive
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                      ({file.fileName})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={(file as any).driveUrl || `https://drive.google.com/file/d/${driveId}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      เปิดใน Drive <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <iframe
                  src={`https://drive.google.com/file/d/${driveId}/preview`}
                  className="w-full flex-1 border-0 bg-white"
                  allow="autoplay"
                  title={file.fileName}
                />
              </div>
            ) : hasBlobPdfPreview ? (
              <div className="w-[880px] max-w-[95vw] h-[82vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
                <div className="bg-slate-800 text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-slate-700 flex-shrink-0">
                  <span className="font-semibold text-blue-400 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    แสดงตัวอย่างเอกสาร PDF ที่อัปโหลด ({file.fileName})
                  </span>
                  <button
                    onClick={handleDownload}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    ดาวน์โหลด <Download className="w-3 h-3" />
                  </button>
                </div>
                <iframe
                  src={file.previewUrl}
                  className="w-full flex-1 border-0 bg-white"
                  title={file.fileName}
                />
              </div>
            ) : isImage ? (
              <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-800 max-w-3xl">
                <img 
                  src={file.previewUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80"} 
                  alt={file.fileName}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl"
                />
                <p className="text-center text-xs text-slate-500 mt-3 font-mono">
                  {file.fileName} • ตรวจดูรูปภาพความละเอียดสูง
                </p>
              </div>
            ) : (
              /* High-Fidelity A4 Paper Document Canvas (แบบฟอร์มเอกสารวิชาการทางการ) */
              <div className="w-[794px] min-h-[1123px] bg-white text-slate-900 rounded-lg shadow-2xl p-12 sm:p-16 border border-slate-300 font-sans relative flex flex-col justify-between select-text">
                
                {/* Official Document Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                  <div className="text-9xl font-black rotate-[-30deg]">ACADEMIC</div>
                </div>

                {/* Document Body */}
                <div className="space-y-6 relative z-10">
                  
                  {/* Official Header */}
                  <div className="text-center border-b-2 border-slate-800 pb-5 space-y-1">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full border-2 border-slate-800 flex items-center justify-center p-1 bg-slate-50">
                      <ShieldCheck className="w-10 h-10 text-slate-800" />
                    </div>
                    <p className="text-xs font-bold text-slate-600 tracking-wider">
                      สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน กระทรวงศึกษาธิการ
                    </p>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight">
                      โรงเรียนสารสาสน์วิเทศราชพฤกษ์ • ฝ่ายบริหารวิชาการ
                    </h1>
                    <p className="text-xs font-semibold text-slate-700">
                      เอกสารตรวจสอบและรับรองผลงานวิชาการ ประจำภาคเรียนที่ 1 ปีการศึกษา 2569
                    </p>
                  </div>

                  {/* Document Meta Table */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">ชื่อหัวข้องานที่ส่ง:</span>
                      <strong className="text-slate-900 text-sm block mt-0.5">{topicTitle}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">รายการงานย่อยที่ตรวจ:</span>
                      <strong className="text-purple-700 text-sm block mt-0.5">
                        {file.subTaskTitle || 'เอกสารประกอบหลัก'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">คุณครูผู้จัดทำ:</span>
                      <span className="text-slate-800 font-medium block mt-0.5">{teacherName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">กลุ่มสาระการเรียนรู้:</span>
                      <span className="text-slate-800 font-medium block mt-0.5">{teacherDepartment}</span>
                    </div>
                  </div>

                  {/* PAGE 1 CONTENT */}
                  {currentPage === 1 && (
                    <div className="space-y-5 text-xs leading-relaxed text-slate-800">
                      <div className="border-l-4 border-blue-600 pl-3">
                        <h2 className="text-sm font-bold text-slate-900">
                          ส่วนที่ 1: รายละเอียดเอกสารและสถานะการจัดเก็บบน Google Drive
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          ไฟล์: <span className="font-mono text-blue-700">{file.fileName}</span>
                        </p>
                      </div>

                      <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                            <div>
                              <p className="font-bold text-xs">สถานะ: ลงทะเบียนเข้าสู่ระบบสารบรรณและ Google Drive แล้ว</p>
                              <p className="text-[11px] text-emerald-700 font-mono mt-0.5">
                                ปลายทาง: Google Drive / {topicTitle} / [{teacherName}] {file.fileName}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] border border-emerald-300">
                            VERIFIED
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 pt-1">ข้อมูลจำเพาะของไฟล์เอกสาร (File Specification)</h3>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block text-[10px]">ชื่อไฟล์ต้นฉบับ:</span>
                            <strong className="text-slate-800 font-mono break-all">{file.fileName}</strong>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block text-[10px]">ขนาดไฟล์:</span>
                            <strong className="text-slate-800">{(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB ({file.fileSizeBytes.toLocaleString()} ไบต์)</strong>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block text-[10px]">รูปแบบไฟล์ (MIME Type):</span>
                            <strong className="text-slate-800 font-mono">{file.mimeType || fileExt.toUpperCase()}</strong>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block text-[10px]">Google Drive Root:</span>
                            <strong className="text-slate-800 font-mono text-[10px]">1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd</strong>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center gap-3">
                          <a
                            href={(file as any).driveUrl || `https://drive.google.com/drive/folders/1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-center text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <FolderOpen className="w-4 h-4" />
                            <span>เปิดดูโฟลเดอร์ใน Google Drive</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            type="button"
                            onClick={handleDownload}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <Download className="w-4 h-4" />
                            <span>ดาวน์โหลดเอกสารจริง</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PAGE 2 CONTENT */}
                  {currentPage === 2 && (
                    <div className="space-y-5 text-xs leading-relaxed text-slate-800">
                      <div className="border-l-4 border-indigo-600 pl-3">
                        <h2 className="text-sm font-bold text-slate-900">
                          ส่วนที่ 2: มาตรฐานการประเมินและเกณฑ์คุณภาพผลงานวิชาการ (Rubrics)
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          เกณฑ์ประเมินเอกสารวิชาการ โรงเรียนสารสาสน์วิเทศราชพฤกษ์
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <p>• <strong>หัวข้อการประเมิน:</strong> {topicTitle}</p>
                          <p>• <strong>หมวดหมู่งานย่อย:</strong> {file.subTaskTitle || 'เอกสารประกอบหลัก'}</p>
                          <p>• <strong>กลุ่มสาระการเรียนรู้:</strong> {teacherDepartment}</p>
                        </div>

                        <h3 className="font-bold text-slate-900 pt-2">เกณฑ์การพิจารณาตรวจสอบของฝ่ายวิชาการ</h3>
                        <table className="w-full border-collapse border border-slate-300 text-[11px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-800 font-bold">
                              <th className="border border-slate-300 p-2 text-left">ประเด็นการประเมิน</th>
                              <th className="border border-slate-300 p-2 text-center">ระดับคุณภาพ</th>
                              <th className="border border-slate-300 p-2 text-center">เกณฑ์การผ่าน</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-300 p-2 font-medium">1. ความถูกต้องและสมบูรณ์ของเอกสาร</td>
                              <td className="border border-slate-300 p-2 text-center">ดีเยี่ยม (4/4)</td>
                              <td className="border border-slate-300 p-2 text-center text-emerald-700 font-bold">ผ่านเกณฑ์</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 p-2 font-medium">2. ความสอดคล้องกับหลักสูตรและมาตรฐานการเรียนรู้</td>
                              <td className="border border-slate-300 p-2 text-center">ดีเยี่ยม (4/4)</td>
                              <td className="border border-slate-300 p-2 text-center text-emerald-700 font-bold">ผ่านเกณฑ์</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 p-2 font-medium">3. การจัดเก็บไฟล์และการเชื่อมโยงข้อมูลใน Google Drive</td>
                              <td className="border border-slate-300 p-2 text-center">ดีเยี่ยม (4/4)</td>
                              <td className="border border-slate-300 p-2 text-center text-emerald-700 font-bold">ผ่านเกณฑ์</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* PAGE 3 CONTENT */}
                  {currentPage === 3 && (
                    <div className="space-y-5 text-xs leading-relaxed text-slate-800">
                      <div className="border-l-4 border-emerald-600 pl-3">
                        <h2 className="text-sm font-bold text-slate-900">
                          ส่วนที่ 3: บันทึกผลหลังการสอนและการตรวจรับรองจากฝ่ายบริหาร
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          สรุปผลสัมฤทธิ์และผลการรับรองคุณภาพเอกสาร
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <h3 className="font-bold text-slate-900">3.1 ผลการจัดกิจกรรมการเรียนรู้</h3>
                          <p className="text-slate-700">
                            นักเรียนในรายวิชามีความสนใจและกระตือรือร้นในการทำกิจกรรมกลุ่ม สามารถสร้างสรรค์ชิ้นงานได้ตามเกณฑ์ตัวชี้วัด คิดเป็นร้อยละ 94.2 ของผู้เรียนทั้งหมด มีนักเรียนที่ต้องพัฒนาเพิ่มเติม 2 คน โดยครูได้จัดสอนเสริมในคาบลดเวลาเรียนเพิ่มเวลารู้
                          </p>
                        </div>

                        {/* Signatures & Certification Box */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                          
                          {/* Teacher Signature */}
                          <div className="text-center p-4 border border-dashed border-slate-300 rounded-xl space-y-2">
                            <span className="text-[11px] text-slate-500 block">ลงชื่อครูผู้จัดทำ</span>
                            <div className="h-10 flex items-center justify-center font-serif italic text-blue-800 text-sm">
                              {teacherName}
                            </div>
                            <p className="font-bold text-slate-800">({teacherName})</p>
                            <p className="text-[10px] text-slate-500">ตำแหน่ง ครู กลุ่มสาระการเรียนรู้{teacherDepartment}</p>
                          </div>

                          {/* Academic Admin Certification Stamp */}
                          <div className="text-center p-4 bg-emerald-50/50 border border-emerald-300 rounded-xl space-y-2 relative">
                            <div className="absolute top-2 right-2">
                              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> รับรองแล้ว
                              </span>
                            </div>

                            <span className="text-[11px] text-emerald-800 font-bold block">
                              ผลการตรวจรับรองของฝ่ายบริหารวิชาการ
                            </span>
                            <div className="h-10 flex items-center justify-center font-serif italic text-slate-800 text-sm">
                              กฤตพจน์ แอดมินบริหาร
                            </div>
                            <p className="font-bold text-slate-800">(นายกฤตพจน์ แอดมินบริหาร)</p>
                            <p className="text-[10px] text-slate-500">รองผู้อำนวยการกลุ่มบริหารงานวิชาการ</p>
                          </div>

                        </div>

                      </div>
                    </div>
                  )}

                </div>

                {/* Document Footer */}
                <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
                  <span>ระบบส่งงานครู ตรวจประเมิน และคลังเอกสารสำหรับผู้บริหาร (Electronic Academic Repository)</span>
                  <span className="font-mono">หน้าที่ {currentPage} / {totalPages}</span>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* BOTTOM QUICK REVIEW DOCK (สำหรับแอดมินตรวจงานได้ทันทีขณะเปิดดูไฟล์) */}
        {canReview && file.subTaskId && onSubTaskDecisionChange && (
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-600/30 text-purple-300 border border-purple-500/40">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </span>
              <div>
                <span className="text-xs font-bold text-white block">
                  ตรวจรับรองงานย่อยนี้: "{file.subTaskTitle || file.fileName}"
                </span>
                <span className="text-[11px] text-slate-400">
                  แอดมินสามารถคลิกผลตรวจและระบุข้อเสนอแนะได้ทันที ไม่ต้องสลับหน้าต่าง
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Feedback text input */}
              {onSubTaskFeedbackChange && (
                <input
                  type="text"
                  value={subTaskFeedback}
                  onChange={(e) => onSubTaskFeedbackChange(file.subTaskId!, e.target.value)}
                  placeholder="พิมพ์ข้อเสนอแนะสำหรับงานย่อยนี้..."
                  className="text-xs rounded-xl border border-slate-700 bg-slate-800 text-slate-200 px-3 py-2 w-64 focus:outline-none focus:border-blue-500"
                />
              )}

              {/* Pass button */}
              <button
                type="button"
                onClick={() => {
                  onSubTaskDecisionChange(file.subTaskId!, 'passed');
                  Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `รับรองผ่านงานย่อย: ${file.subTaskTitle || file.fileName}`,
                    showConfirmButton: false,
                    timer: 2000
                  });
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  subTaskDecision === 'passed'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                    : 'bg-slate-800 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-700/60'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ รับรองผ่าน</span>
              </button>

              {/* Revision required button */}
              <button
                type="button"
                onClick={() => {
                  onSubTaskDecisionChange(file.subTaskId!, 'revision_required');
                  Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'warning',
                    title: `แจ้งให้แก้ไขงานย่อย: ${file.subTaskTitle || file.fileName}`,
                    showConfirmButton: false,
                    timer: 2000
                  });
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  subTaskDecision === 'revision_required'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/50'
                    : 'bg-slate-800 hover:bg-amber-900/40 text-amber-400 border border-amber-700/60'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>⚠️ ส่งแก้ไข</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
