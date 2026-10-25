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
    if (driveId) {
      window.open(`https://drive.google.com/uc?export=download&id=${driveId}`, '_blank');
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
      title: 'ข้อมูลเอกสารผลงาน',
      html: `
        <div class="text-left text-xs space-y-2 text-slate-700">
          <p><strong>ชื่อไฟล์:</strong> ${file.fileName}</p>
          <p><strong>ผู้ส่ง:</strong> ${teacherName} (${teacherDepartment})</p>
          <p><strong>หัวข้องาน:</strong> ${topicTitle}</p>
          <div class="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
            📁 ที่อยู่ไฟล์ใน Drive: <b>${file.folderPath || `Google Drive / ${topicTitle} / ${teacherName} /`}</b>
          </div>
          <p class="text-slate-500">กรุณาเปิดดูหรือดาวน์โหลดไฟล์ต้นฉบับผ่าน Google Drive ของสถาบัน</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'เปิดโฟลเดอร์ใน Google Drive',
      showCancelButton: true,
      cancelButtonText: 'ปิด',
      confirmButtonColor: '#059669'
    }).then(r => {
      if (r.isConfirmed) {
        window.open((file as any).driveUrl || 'https://drive.google.com/drive/folders/1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd', '_blank');
      }
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
              title="ดาวน์โหลดสำเนาไฟล์นี้"
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

        {/* Viewer Content Canvas */}
        <div className="flex-1 bg-slate-950 overflow-y-auto p-4 sm:p-8 flex justify-center items-start scrollbar-thin">
          
          <div 
            className="transition-transform duration-200 origin-top flex flex-col items-center w-full"
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
              /* Genuine File Details & Destination Card (ตรงตามไฟล์ที่เปิดทุกประการ) */
              <div className="w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-800 text-white space-y-6">
                
                {/* File Header */}
                <div className="flex items-start gap-4 border-b border-slate-800 pb-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-black text-xl uppercase flex-shrink-0">
                    {fileExt}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-white break-all">
                        {file.fileName}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      ประเภทไฟล์: <span className="font-mono text-slate-300">{file.mimeType || fileExt.toUpperCase()}</span>
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
                    <span className="text-slate-400 block text-[11px]">หัวข้อภาระงาน:</span>
                    <strong className="text-white block text-sm">{topicTitle}</strong>
                  </div>

                  <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
                    <span className="text-slate-400 block text-[11px]">งานย่อยที่แนบ:</span>
                    <strong className="text-purple-300 block text-sm">
                      {file.subTaskTitle || 'เอกสารประกอบหลัก'}
                    </strong>
                  </div>

                  <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
                    <span className="text-slate-400 block text-[11px]">คุณครูผู้จัดทำ:</span>
                    <strong className="text-white block">{teacherName}</strong>
                    <span className="text-slate-400 text-[11px] block">{teacherDepartment}</span>
                  </div>

                  <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
                    <span className="text-slate-400 block text-[11px]">สถานะการจัดเก็บบนคลาวด์:</span>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold pt-0.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Google Drive ซิงค์เรียบร้อย</span>
                    </div>
                    <span className="text-slate-400 text-[10px] block">
                      {file.uploadedAt ? new Date(file.uploadedAt).toLocaleString('th-TH') : 'บันทึกในระบบแล้ว'}
                    </span>
                  </div>
                </div>

                {/* Google Drive Destination Box */}
                <div className="p-4 bg-blue-950/40 rounded-2xl border border-blue-800/50 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                    <FolderOpen className="w-4 h-4" />
                    <span>ตำแหน่งโฟลเดอร์ใน Google Drive:</span>
                  </div>
                  <p className="font-mono text-xs text-blue-200 bg-slate-900/90 p-3 rounded-xl border border-slate-800 break-all select-all">
                    📁 Google Drive / {topicTitle} / {teacherName} / {file.fileName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    ไฟล์นี้ถูกจัดเก็บแยกไว้ในโฟลเดอร์ชื่อของคุณครูผู้ส่งโดยเฉพาะ สามารถคลิกเปิดดูหรือดาวน์โหลดได้ทันที
                  </p>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={(file as any).driveUrl || `https://drive.google.com/drive/folders/1VNaQSal6_ef-3_muZQd2vRH6Zb5oBAMd`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>เปิดโฟลเดอร์ใน Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลดไฟล์นี้</span>
                  </button>
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
