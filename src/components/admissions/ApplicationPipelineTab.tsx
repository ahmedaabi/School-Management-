import React, { useState } from 'react';
import {
  Kanban,
  MoreVertical,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  UserCheck,
  XCircle,
  Eye,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { AdmissionApplication, AdmissionStatus } from '../../types/admission';
import { admissionService } from '../../services/admissionService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ApplicationPipelineTabProps {
  onSelectApplication: (app: AdmissionApplication) => void;
  onOpenEnroll: (app: AdmissionApplication) => void;
  onRefresh: () => void;
}

export const ApplicationPipelineTab: React.FC<ApplicationPipelineTabProps> = ({
  onSelectApplication,
  onOpenEnroll,
  onRefresh,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const applications = admissionService.getApplications();

  // Columns definition
  const columns: { status: AdmissionStatus; title: string; color: string }[] = [
    { status: 'NEW', title: 'New Intake', color: 'border-blue-500 text-blue-700 bg-blue-50' },
    { status: 'UNDER_REVIEW', title: 'Under Review', color: 'border-indigo-500 text-indigo-700 bg-indigo-50' },
    { status: 'DOCUMENTS_PENDING', title: 'Docs Verification', color: 'border-amber-500 text-amber-700 bg-amber-50' },
    { status: 'INTERVIEW_PENDING', title: 'Interview / Test', color: 'border-purple-500 text-purple-700 bg-purple-50' },
    { status: 'APPROVED', title: 'Approved', color: 'border-teal-500 text-teal-700 bg-teal-50' },
    { status: 'WAITLISTED', title: 'Waitlist', color: 'border-orange-500 text-orange-700 bg-orange-50' },
    { status: 'ENROLLED', title: 'Enrolled', color: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
    { status: 'REJECTED', title: 'Rejected', color: 'border-rose-500 text-rose-700 bg-rose-50' },
  ];

  const handleQuickMove = (app: AdmissionApplication, targetStatus: AdmissionStatus) => {
    if (app.status === targetStatus) return;

    if (app.status === 'REJECTED' && targetStatus === 'ENROLLED') {
      showToast('Invalid transition: A rejected applicant cannot be enrolled directly.', 'error');
      return;
    }

    if (targetStatus === 'REJECTED') {
      const reason = window.prompt('Enter mandatory reason for rejection:');
      if (!reason || !reason.trim()) {
        showToast('Rejection cancelled: reason is mandatory.', 'warning');
        return;
      }
      const res = admissionService.updateStatus(app.id, 'REJECTED', { reason }, currentUser || undefined);
      if (res.success) {
        showToast(`Application marked as REJECTED.`, 'info');
        onRefresh();
      } else {
        showToast(res.error || 'Failed to update', 'error');
      }
      return;
    }

    if (targetStatus === 'ENROLLED') {
      onOpenEnroll(app);
      return;
    }

    const res = admissionService.updateStatus(
      app.id,
      targetStatus,
      { reason: `Moved via pipeline to ${targetStatus}` },
      currentUser || undefined
    );

    if (!res.success) {
      showToast(res.error || 'Failed to transition stage', 'error');
      return;
    }

    showToast(`Moved ${app.applicantName} to ${targetStatus}.`, 'success');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Interactive Application Pipeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-stage board with status safeguard validation and quick stage transitions.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Total Candidates: <strong className="text-slate-800">{applications.length}</strong>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 min-h-[600px] scrollbar-thin">
        {columns.map((col) => {
          const appsInColumn = applications.filter((a) => {
            if (col.status === 'INTERVIEW_PENDING') {
              return a.status === 'INTERVIEW_PENDING' || a.status === 'TEST_PENDING';
            }
            return a.status === col.status;
          });

          return (
            <div
              key={col.status}
              className="w-72 flex-shrink-0 bg-slate-100/70 rounded-2xl p-3 border border-slate-200 flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-2 mb-2">
                <span className="font-bold text-xs text-slate-800 tracking-tight flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${col.color.split(' ')[0].replace('border-', 'bg-')}`} />
                  {col.title}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white text-slate-600 font-bold text-[11px] shadow-xs border border-slate-200">
                  {appsInColumn.length}
                </span>
              </div>

              {/* Cards Column */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[650px] pr-1">
                {appsInColumn.length === 0 ? (
                  <div className="h-28 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400">
                    No applications
                  </div>
                ) : (
                  appsInColumn.map((app) => {
                    const missingDocs = app.documents.filter(
                      (d) => d.verificationStatus === 'MISSING' || d.verificationStatus === 'REJECTED'
                    ).length;

                    return (
                      <div
                        key={app.id}
                        className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-2.5"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {app.applicationNumber}
                          </span>
                          <button
                            onClick={() => onSelectApplication(app)}
                            className="text-slate-400 hover:text-indigo-600 p-1"
                            title="Inspect Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <h4
                            onClick={() => onSelectApplication(app)}
                            className="font-bold text-xs text-slate-900 hover:text-indigo-600 cursor-pointer"
                          >
                            {app.applicantName}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                            Applying: <strong className="text-slate-700">{app.appliedClassName}</strong>
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div>Parent: <strong className="text-slate-700">{app.parentName}</strong></div>
                          <div>Phone: {app.parentPhone}</div>
                        </div>

                        {/* Alerts inside card */}
                        {missingDocs > 0 && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded flex items-center gap-1 font-semibold">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {missingDocs} doc(s) missing/rejected
                          </div>
                        )}

                        {app.interviews.length > 0 && (
                          <div className="text-[10px] text-purple-700 bg-purple-50 px-2 py-1 rounded flex items-center gap-1 font-semibold">
                            <Calendar className="w-3 h-3 text-purple-600" />
                            {app.interviews[0].date} ({app.interviews[0].status})
                          </div>
                        )}

                        {/* Stage Transition Selector */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">Move to:</span>
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleQuickMove(app, e.target.value as AdmissionStatus);
                              }
                            }}
                            className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5 focus:outline-none"
                          >
                            <option value="">Select Stage...</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="DOCUMENTS_PENDING">Docs Verification</option>
                            <option value="INTERVIEW_PENDING">Interview/Test</option>
                            <option value="APPROVED">Approved</option>
                            <option value="WAITLISTED">Waitlisted</option>
                            <option value="ENROLLED">Enrolled</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
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
    </div>
  );
};
