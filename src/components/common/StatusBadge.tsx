import React from 'react';
import { SubmissionStatus } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, XCircle, AlertCircle } from 'lucide-react';

interface Props {
  status: SubmissionStatus | 'passed' | 'rejected' | 'revision_required' | 'not_submitted';
  isLate?: boolean;
}

export const StatusBadge: React.FC<Props> = ({ status, isLate }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'passed':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          text: 'อนุมัติ / ผ่านแล้ว',
        };
      case 'revision_required':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
          text: 'ต้องส่งแก้ไขใหม่',
        };
      case 'rejected':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          icon: XCircle,
          text: 'ไม่ผ่านการอนุมัติ',
        };
      case 'not_submitted':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          icon: AlertCircle,
          text: 'ยังไม่ได้ส่ง',
        };
      case 'under_review':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
          icon: Clock,
          text: 'กำลังตรวจเอกสาร',
        };
      case 'submitted':
      default:
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          icon: Clock,
          text: 'ส่งแล้ว (รอแอดมินตรวจ)',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        <Icon className="w-3.5 h-3.5" />
        {config.text}
      </span>
      {isLate && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700 border border-red-200">
          ส่งช้ากว่ากำหนด
        </span>
      )}
    </div>
  );
};
