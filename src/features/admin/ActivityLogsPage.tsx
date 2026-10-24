import React, { useState } from 'react';
import { getActivityLogs } from '../../lib/storage';
import { History, Search, Shield, Filter, Eye } from 'lucide-react';
import Swal from 'sweetalert2';

export const ActivityLogsPage: React.FC = () => {
  const logs = getActivityLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.entityType && l.entityType.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = actionFilter === 'all' ? true : l.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const handleViewDetails = (log: any) => {
    Swal.fire({
      title: 'รายละเอียดบันทึกกิจกรรม',
      html: `
        <div class="text-left text-xs space-y-2">
          <p><strong>ผู้กระทำ:</strong> ${log.actorName} (${log.actorRole})</p>
          <p><strong>การกระทำ (Action):</strong> <span class="font-mono text-blue-600">${log.action}</span></p>
          <p><strong>Entity:</strong> ${log.entityType} ${log.entityId ? `(#${log.entityId})` : ''}</p>
          <p><strong>เวลา:</strong> ${new Date(log.timestamp).toLocaleString('th-TH')}</p>
          <div class="mt-2 p-2 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto">
            ${JSON.stringify(log.details || {}, null, 2)}
          </div>
        </div>
      `,
      confirmButtonText: 'ปิด',
      confirmButtonColor: '#2563eb'
    });
  };

  return (
    <div className="space-y-6">

      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <History className="w-6 h-6 text-blue-600" />
          บันทึกกิจกรรมระบบ (Activity Audit Logs)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          เก็บบันทึกประวัติการเข้าสู่ระบบ ส่งผลงาน ตรวจประเมิน เปลี่ยนแปลงสิทธิ์ และแก้ไขการตั้งค่า
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อผู้ดำเนินการ, Action, Entity..."
            className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full sm:w-auto text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700"
        >
          <option value="all">ทุกกิจกรรม</option>
          <option value="LOGIN">LOGIN</option>
          <option value="SUBMIT_WORK">SUBMIT_WORK</option>
          <option value="SUBMIT_REVIEW">SUBMIT_REVIEW</option>
          <option value="UPDATE_SETTINGS">UPDATE_SETTINGS</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="p-4">เวลา</th>
                <th className="p-4">ผู้ดำเนินการ</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4 text-right">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-800 block">{l.actorName}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{l.actorRole}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold text-[11px] border border-blue-100">
                      {l.action}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 font-mono text-[11px]">
                    {l.entityType} {l.entityId ? `#${l.entityId}` : ''}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleViewDetails(l)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="ดูรายละเอียดเพิ่มเติม"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
