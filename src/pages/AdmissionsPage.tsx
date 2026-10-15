import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Kanban,
  FileCheck,
  CalendarCheck,
  CheckCircle2,
  GraduationCap,
  BarChart3,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { AdmissionApplication } from '../types/admission';
import { admissionService } from '../services/admissionService';
import { AdmissionsDashboardTab } from '../components/admissions/AdmissionsDashboardTab';
import { ApplicationsListTab } from '../components/admissions/ApplicationsListTab';
import { NewApplicationTab } from '../components/admissions/NewApplicationTab';
import { ApplicationPipelineTab } from '../components/admissions/ApplicationPipelineTab';
import { DocumentVerificationTab } from '../components/admissions/DocumentVerificationTab';
import { InterviewsTestsTab } from '../components/admissions/InterviewsTestsTab';
import { ApprovedApplicationsTab } from '../components/admissions/ApprovedApplicationsTab';
import { EnrolledStudentsTab } from '../components/admissions/EnrolledStudentsTab';
import { AdmissionReportsTab } from '../components/admissions/AdmissionReportsTab';
import { AdmissionSettingsTab } from '../components/admissions/AdmissionSettingsTab';
import { ApplicationProfileModal } from '../components/admissions/ApplicationProfileModal';
import { EnrollStudentModal } from '../components/admissions/EnrollStudentModal';
import { Button } from '../components/ui/Button';

export type AdmissionTabId =
  | 'admissions-dashboard'
  | 'admissions-applications'
  | 'admissions-new'
  | 'admissions-pipeline'
  | 'admissions-documents'
  | 'admissions-interviews'
  | 'admissions-approved'
  | 'admissions-enrolled'
  | 'admissions-reports'
  | 'admissions-settings';

interface AdmissionsPageProps {
  subRoute?: string;
}

export const AdmissionsPage: React.FC<AdmissionsPageProps> = ({ subRoute }) => {
  const [activeTab, setActiveTab] = useState<AdmissionTabId>(() => {
    if (subRoute && subRoute.startsWith('admissions-')) {
      return subRoute as AdmissionTabId;
    }
    return 'admissions-dashboard';
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = () => setRefreshKey((k) => k + 1);

  // When parent route changes (from sidebar), update activeTab
  useEffect(() => {
    if (subRoute && subRoute.startsWith('admissions-')) {
      setActiveTab(subRoute as AdmissionTabId);
    }
  }, [subRoute]);

  // Modal states
  const [inspectingApp, setInspectingApp] = useState<AdmissionApplication | null>(null);
  const [enrollingApp, setEnrollingApp] = useState<AdmissionApplication | null>(null);

  // Live counts for badges
  const applications = admissionService.getApplications();
  const pendingDocsCount = applications.reduce(
    (acc, app) =>
      acc +
      app.documents.filter(
        (d) => d.verificationStatus === 'MISSING' || d.verificationStatus === 'PENDING'
      ).length,
    0
  );
  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;
  const enrolledCount = applications.filter((a) => a.status === 'ENROLLED').length;

  const tabs: { id: AdmissionTabId; label: string; icon: React.ElementType; badge?: number | string; badgeColor?: string }[] = [
    { id: 'admissions-dashboard', label: 'Admissions Dashboard', icon: LayoutDashboard },
    { id: 'admissions-applications', label: 'Applications', icon: FileText, badge: applications.length },
    { id: 'admissions-new', label: 'New Application', icon: PlusCircle },
    { id: 'admissions-pipeline', label: 'Application Pipeline', icon: Kanban },
    {
      id: 'admissions-documents',
      label: 'Document Verification',
      icon: FileCheck,
      badge: pendingDocsCount > 0 ? pendingDocsCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { id: 'admissions-interviews', label: 'Interviews & Tests', icon: CalendarCheck },
    {
      id: 'admissions-approved',
      label: 'Approved Applications',
      icon: CheckCircle2,
      badge: approvedCount > 0 ? approvedCount : undefined,
      badgeColor: 'bg-teal-100 text-teal-800',
    },
    {
      id: 'admissions-enrolled',
      label: 'Enrolled Students',
      icon: GraduationCap,
      badge: enrolledCount > 0 ? enrolledCount : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    { id: 'admissions-reports', label: 'Admission Reports', icon: BarChart3 },
    { id: 'admissions-settings', label: 'Admission Settings', icon: Settings },
  ];

  return (
    <div key={refreshKey} className="space-y-6 pb-16">
      {/* Top Banner & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Admissions & Enrollment Automation
              </h1>
              <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                Session 2025-2026
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              End-to-end recruitment lifecycle from intake inquiry to document audit, entrance testing, and student roster onboarding.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            onClick={() => setActiveTab('admissions-new')}
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Create Application
          </Button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'admissions-dashboard' && (
          <AdmissionsDashboardTab
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectApplication={(app) => setInspectingApp(app)}
          />
        )}

        {activeTab === 'admissions-applications' && (
          <ApplicationsListTab
            onSelectApplication={(app) => setInspectingApp(app)}
            onOpenEnroll={(app) => setEnrollingApp(app)}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'admissions-new' && (
          <NewApplicationTab
            onSuccess={(newApp) => {
              handleRefresh();
              setInspectingApp(newApp);
              setActiveTab('admissions-applications');
            }}
          />
        )}

        {activeTab === 'admissions-pipeline' && (
          <ApplicationPipelineTab
            onSelectApplication={(app) => setInspectingApp(app)}
            onOpenEnroll={(app) => setEnrollingApp(app)}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'admissions-documents' && (
          <DocumentVerificationTab
            onSelectApplication={(app) => setInspectingApp(app)}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'admissions-interviews' && (
          <InterviewsTestsTab
            onSelectApplication={(app) => setInspectingApp(app)}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'admissions-approved' && (
          <ApprovedApplicationsTab
            onSelectApplication={(app) => setInspectingApp(app)}
            onOpenEnroll={(app) => setEnrollingApp(app)}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'admissions-enrolled' && (
          <EnrolledStudentsTab
            onSelectApplication={(app) => setInspectingApp(app)}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'admissions-reports' && <AdmissionReportsTab />}

        {activeTab === 'admissions-settings' && <AdmissionSettingsTab />}
      </div>

      {/* Application Detail / Audit Modal */}
      {inspectingApp && (
        <ApplicationProfileModal
          application={inspectingApp}
          onClose={() => setInspectingApp(null)}
          onRefresh={() => {
            handleRefresh();
            // refresh inspectingApp instance
            const updated = admissionService.getApplicationById(inspectingApp.id);
            if (updated) setInspectingApp(updated);
          }}
          onOpenEnroll={(app) => {
            setInspectingApp(null);
            setEnrollingApp(app);
          }}
        />
      )}

      {/* Enroll Student Modal */}
      {enrollingApp && (
        <EnrollStudentModal
          application={enrollingApp}
          onClose={() => setEnrollingApp(null)}
          onSuccess={() => {
            setEnrollingApp(null);
            handleRefresh();
            setActiveTab('admissions-enrolled');
          }}
        />
      )}
    </div>
  );
};
