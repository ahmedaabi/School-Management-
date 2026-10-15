import React from 'react';
import {
  Users,
  FilePlus,
  Clock,
  FileCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  BarChart3,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { AdmissionApplication } from '../../types/admission';
import { admissionService } from '../../services/admissionService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AdmissionsDashboardTabProps {
  onNavigateTab: (tabId: string) => void;
  onSelectApplication: (app: AdmissionApplication) => void;
  onOpenNewApplication: () => void;
}

export const AdmissionsDashboardTab: React.FC<AdmissionsDashboardTabProps> = ({
  onNavigateTab,
  onSelectApplication,
  onOpenNewApplication,
}) => {
  const metrics = admissionService.getConversionMetrics();
  const applications = admissionService.getApplications();
  const followUpAlerts = admissionService.getFollowUpAlerts();
  const capacities = admissionService.getCapacities();

  const pipelineStages = [
    { label: 'New', count: metrics.newCount, color: 'bg-blue-500', tab: 'applications' },
    { label: 'Under Review', count: metrics.underReviewCount, color: 'bg-indigo-500', tab: 'pipeline' },
    { label: 'Docs Pending', count: metrics.documentsPendingCount, color: 'bg-amber-500', tab: 'documents' },
    { label: 'Interview/Test', count: metrics.interviewPendingCount, color: 'bg-purple-500', tab: 'interviews' },
    { label: 'Approved', count: metrics.approvedCount, color: 'bg-teal-500', tab: 'approved' },
    { label: 'Enrolled', count: metrics.enrolledCount, color: 'bg-emerald-500', tab: 'enrolled' },
  ];

  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime())
    .slice(0, 5);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ENROLLED':
        return 'success';
      case 'REJECTED':
        return 'danger';
      case 'WAITLISTED':
        return 'warning';
      case 'NEW':
      case 'UNDER_REVIEW':
        return 'info';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-indigo-300">
              Admissions & Enrollment Automation Hub
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              Admission Intake & Application Pipeline
            </h1>
            <p className="text-sm text-indigo-200 mt-1 max-w-2xl">
              Monitor admissions lifecycle, verify applicant documentation, schedule interviews, and seamlessly convert approved applicants into enrolled students.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => onNavigateTab('pipeline')}
            >
              Visual Pipeline
            </Button>
            <Button
              variant="primary"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-900/30"
              onClick={onOpenNewApplication}
            >
              <FilePlus className="w-4 h-4 mr-2" />
              New Application
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div
          onClick={() => onNavigateTab('applications')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-bold text-indigo-600">ALL</span>
          </div>
          <span className="text-2xl font-black text-slate-900 block">{metrics.totalApplications}</span>
          <span className="text-xs font-medium text-slate-500">Total Apps</span>
        </div>

        <div
          onClick={() => onNavigateTab('applications')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <FilePlus className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold text-blue-600">INBOX</span>
          </div>
          <span className="text-2xl font-black text-blue-600 block">{metrics.newCount}</span>
          <span className="text-xs font-medium text-slate-500">New</span>
        </div>

        <div
          onClick={() => onNavigateTab('pipeline')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-bold text-indigo-600">AUDIT</span>
          </div>
          <span className="text-2xl font-black text-indigo-600 block">{metrics.underReviewCount}</span>
          <span className="text-xs font-medium text-slate-500">Under Review</span>
        </div>

        <div
          onClick={() => onNavigateTab('documents')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-amber-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <FileCheck className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600">DOCS</span>
          </div>
          <span className="text-2xl font-black text-amber-600 block">{metrics.documentsPendingCount}</span>
          <span className="text-xs font-medium text-slate-500">Docs Pending</span>
        </div>

        <div
          onClick={() => onNavigateTab('interviews')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] font-bold text-purple-600">EVAL</span>
          </div>
          <span className="text-2xl font-black text-purple-600 block">{metrics.interviewPendingCount}</span>
          <span className="text-xs font-medium text-slate-500">Interview/Test</span>
        </div>

        <div
          onClick={() => onNavigateTab('approved')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
            <span className="text-[10px] font-bold text-teal-600">READY</span>
          </div>
          <span className="text-2xl font-black text-teal-600 block">{metrics.approvedCount}</span>
          <span className="text-xs font-medium text-slate-500">Approved</span>
        </div>

        <div
          onClick={() => onNavigateTab('enrolled')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600">DONE</span>
          </div>
          <span className="text-2xl font-black text-emerald-600 block">{metrics.enrolledCount}</span>
          <span className="text-xs font-medium text-slate-500">Enrolled</span>
        </div>

        <div
          onClick={() => onNavigateTab('applications')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <XCircle className="w-4 h-4 text-rose-500" />
            <span className="text-[10px] font-bold text-rose-600">DENIED</span>
          </div>
          <span className="text-2xl font-black text-rose-600 block">{metrics.rejectedCount}</span>
          <span className="text-xs font-medium text-slate-500">Rejected</span>
        </div>
      </div>

      {/* Visual Pipeline Funnel Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Admission Conversion Pipeline
            </h3>
            <p className="text-xs text-slate-500">Stage progression from initial receipt to final classroom roster enrollment.</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
              Approval Rate: <strong>{metrics.approvalRate}%</strong>
            </span>
            <span className="text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">
              Enrollment Yield: <strong>{metrics.enrollmentConversionRate}%</strong>
            </span>
          </div>
        </div>

        {/* Pipeline Bar */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-2">
          {pipelineStages.map((stage, idx) => (
            <div
              key={stage.label}
              onClick={() => onNavigateTab(stage.tab)}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${stage.color}`} />
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold text-slate-700 group-hover:text-indigo-600">{stage.label}</span>
                <span className="text-[10px] text-slate-400">#{idx + 1}</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-900">{stage.count}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Follow-Up Alerts & Capacity Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Follow-Up & Action Alerts (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Active Follow-up Reminders & Alerts</h3>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {followUpAlerts.length} Action Items
            </span>
          </div>

          {followUpAlerts.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              All applications are currently up to date! No pending review delays or missing documents.
            </div>
          ) : (
            <div className="space-y-2.5">
              {followUpAlerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-4 text-xs transition-all ${
                    alert.severity === 'danger'
                      ? 'bg-rose-50/50 border-rose-200'
                      : alert.severity === 'warning'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-blue-50/50 border-blue-200'
                  }`}
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{alert.title}</span>
                    <p className="text-slate-600 mt-0.5">{alert.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 bg-white"
                    onClick={() => onSelectApplication(alert.application)}
                  >
                    {alert.actionText}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Capacity Overview Widget (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Intake Capacity
            </h3>
            <button
              onClick={() => onNavigateTab('settings')}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3">
            {capacities.slice(0, 4).map((cap) => {
              const pct = Math.min(100, Math.round((cap.occupied / cap.maxCapacity) * 100));
              return (
                <div key={`${cap.classId}-${cap.sectionId}`} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800">
                      {cap.className} ({cap.sectionName})
                    </span>
                    <span className="font-bold text-slate-600">
                      {cap.occupied} / {cap.maxCapacity} seats ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 95 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Applications Feed */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Applications Received</h3>
            <p className="text-xs text-slate-500">Newly registered admission applicants awaiting committee action.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onNavigateTab('applications')}>
            View All Applications
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">App Number</th>
                <th className="px-4 py-3">Applicant Name</th>
                <th className="px-4 py-3">Class & Section</th>
                <th className="px-4 py-3">Parent Contact</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentApplications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">{app.applicationNumber}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900 block">{app.applicantName}</span>
                    <span className="text-[11px] text-slate-400">{app.dateOfBirth} ({app.gender})</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{app.appliedClassName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <span>{app.parentName}</span>
                    <span className="block text-[11px] text-slate-400">{app.parentPhone}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                      {app.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(app.status)}>
                      {app.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectApplication(app)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>
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
