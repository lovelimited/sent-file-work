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

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 75));
  const handleResetZoom = () => setZoomLevel(100);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    Swal.fire({
      title: 'กำลังดาวน์โหลดเอกสาร',
      html: `ไฟล์: <b>${file.fileName}</b><br/><span class="text-xs text-slate-500">บันทึกสำเนาลงในเครื่องของคุณเรียบร้อยแล้ว</span>`,
      icon: 'success',
      timer: 2000,
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
            {/* Image Viewer */}
            {isImage ? (
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
                      โรงเรียนมัธยมศึกษาตัวอย่าง • กลุ่มบริหารงานวิชาการ
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
                          ส่วนที่ 1: รายละเอียดเค้าโครงและสาระสำคัญของผลงาน
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          ไฟล์: <span className="font-mono text-blue-700">{file.fileName}</span>
                        </p>
                      </div>

                      <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-slate-900">1.1 มาตรฐานการเรียนรู้และตัวชี้วัด / ผลการเรียนรู้</h3>
                        <p className="text-slate-700 pl-3 border-l-2 border-slate-200">
                          มฐ. ว 4.2 เข้าใจและใช้แนวคิดเชิงคำนวณในการแก้ปัญหาที่พบในชีวิตจริงอย่างเป็นขั้นตอนและเป็นระบบ ใช้เทคโนโลยีสารสนเทศและการสื่อสารในการเรียนรู้ การทำงาน และการแก้ปัญหาได้อย่างมีประสิทธิภาพ รู้เท่าทัน และมีจริยธรรม
                        </p>

                        <h3 className="font-bold text-slate-900 pt-2">1.2 วัตถุประสงค์และจุดประสงค์การเรียนรู้ (K-P-A)</h3>
                        <ul className="list-disc list-inside space-y-1 pl-3 text-slate-700">
                          <li><strong>ด้านความรู้ (Knowledge):</strong> นักเรียนสามารถอธิบายหลักการออกแบบและพัฒนาโปรแกรมประยุกต์เบื้องต้นได้อย่างถูกต้อง (ร้อยละ 85 ขึ้นไป)</li>
                          <li><strong>ด้านทักษะกระบวนการ (Process):</strong> นักเรียนฝึกเขียนโปรแกรมและทำงานร่วมกันเป็นทีมผ่านกระบวนการโครงงาน (Project-based Learning)</li>
                          <li><strong>ด้านคุณลักษณะอันพึงประสงค์ (Attitude):</strong> มีวินัย ใฝ่เรียนรู้ และมุ่งมั่นในการทำงาน</li>
                        </ul>

                        <h3 className="font-bold text-slate-900 pt-2">1.3 การจัดกิจกรรมการเรียนรู้เชิงรุก (Active Learning 5 ขั้นตอน)</h3>
                        <div className="grid grid-cols-5 gap-2 text-center text-[10px] pt-1">
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <strong className="block text-blue-900">ขั้นที่ 1</strong> กระตุ้นความสนใจ (Warm up)
                          </div>
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <strong className="block text-blue-900">ขั้นที่ 2</strong> สำรวจและค้นหา (Explore)
                          </div>
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <strong className="block text-blue-900">ขั้นที่ 3</strong> อธิบายความรู้ (Explain)
                          </div>
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <strong className="block text-blue-900">ขั้นที่ 4</strong> ขยายความเข้าใจ (Elaborate)
                          </div>
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <strong className="block text-blue-900">ขั้นที่ 5</strong> ตรวจสอบผล (Evaluate)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PAGE 2 CONTENT */}
                  {currentPage === 2 && (
                    <div className="space-y-5 text-xs leading-relaxed text-slate-800">
                      <div className="border-l-4 border-indigo-600 pl-3">
                        <h2 className="text-sm font-bold text-slate-900">
                          ส่วนที่ 2: สื่อ นวัตกรรมการสอน และการวัดประเมินผล (Rubrics)
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          เครื่องมือวัดผลและเกณฑ์การให้คะแนนอย่างละเอียด
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-bold text-slate-900">2.1 สื่อและแหล่งการเรียนรู้ที่ใช้จัดการเรียนรู้</h3>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <p>• สื่อดิจิทัลและสไลด์นำเสนอ Interactive Canva & Google Slides</p>
                          <p>• บอร์ดเกมและแบบฝึกทักษะการแก้ปัญหาเชิงคำนวณ</p>
                          <p>• แพลตฟอร์มการเขียนโปรแกรม MakeCode Arcade / Scratch 3.0</p>
                        </div>

                        <h3 className="font-bold text-slate-900 pt-2">2.2 ตารางเกณฑ์การประเมินชิ้นงาน / ภาระงาน (Scoring Rubrics)</h3>
                        <table className="w-full border-collapse border border-slate-300 text-[11px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-800 font-bold">
                              <th className="border border-slate-300 p-2 text-left">ประเด็นการประเมิน</th>
                              <th className="border border-slate-300 p-2 text-center">ดีมาก (4)</th>
                              <th className="border border-slate-300 p-2 text-center">ดี (3)</th>
                              <th className="border border-slate-300 p-2 text-center">พอใช้ (2)</th>
                              <th className="border border-slate-300 p-2 text-center">ปรับปรุง (1)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-300 p-2 font-medium">1. ความถูกต้องของเนื้อหา</td>
                              <td className="border border-slate-300 p-2">ครบถ้วน ถูกต้อง 100%</td>
                              <td className="border border-slate-300 p-2">ถูกต้องเป็นส่วนใหญ่</td>
                              <td className="border border-slate-300 p-2">มีข้อผิดพลาดเล็กน้อย</td>
                              <td className="border border-slate-300 p-2">ต้องแก้ไขสาระสำคัญ</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 p-2 font-medium">2. ความคิดสร้างสรรค์</td>
                              <td className="border border-slate-300 p-2">ออกแบบแปลกใหม่ น่าสนใจ</td>
                              <td className="border border-slate-300 p-2">มีความคิดริเริ่มดี</td>
                              <td className="border border-slate-300 p-2">ทำตามแบบตัวอย่าง</td>
                              <td className="border border-slate-300 p-2">ไม่มีความแปลกใหม่</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 p-2 font-medium">3. การทำงานเป็นทีม</td>
                              <td className="border border-slate-300 p-2">แบ่งหน้าที่ชัดเจน ช่วยเหลือกัน</td>
                              <td className="border border-slate-300 p-2">ร่วมมือกันทำงานได้ดี</td>
                              <td className="border border-slate-300 p-2">ทำงานเฉพาะที่ได้รับมอบหมาย</td>
                              <td className="border border-slate-300 p-2">ไม่ให้ความร่วมมือ</td>
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
