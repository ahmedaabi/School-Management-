import React, { useState } from 'react';
import {
  CheckCircle2,
  UserCheck,
  Search,
  Eye,
  FileCheck,
  Building,
} from 'lucide-react';
import { AdmissionApplication } from '../../types/admission';
import { admissionService } from '../../services/admissionService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ApprovedApplicationsTabProps {
  onSelectApplication: (app: AdmissionApplication) => void;
  onOpenEnroll: (app: AdmissionApplication) => void;
  onRefresh: () => void;
}

export const ApprovedApplicationsTab: React.FC<ApprovedApplicationsTabProps> = ({
  onSelectApplication,
  onOpenEnroll,
  onRefresh,
}) => {
  const applications = admissionService.getApplications();
  const approvedApps = applications.filter((a) => a.status === 'APPROVED');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = approvedApps.filter(
    (app) =>
      !searchTerm.trim() ||
      app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.appliedClassName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Approved Candidates Ready for Enrollment</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Candidates cleared by the admissions committee awaiting final classroom and fee assignment.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
          Ready to Enroll: <strong>{approvedApps.length}</strong>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search approved candidates..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Applicant & App #</th>
                <th className="px-4 py-3">Class Placement</th>
                <th className="px-4 py-3">Parent Contact</th>
                <th className="px-4 py-3">Approval Details</th>
                <th className="px-4 py-3">Documents Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No approved applications waiting for enrollment.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => {
                  const verifiedDocs = app.documents.filter((d) => d.verificationStatus === 'VERIFIED').length;
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{app.applicantName}</span>
                        <span className="font-mono text-[11px] text-slate-400">{app.applicationNumber}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {app.appliedClassName} ({app.appliedSectionName})
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-800 font-medium block">{app.parentName}</span>
                        <span className="text-[11px] text-slate-400">{app.parentPhone}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span>Approved by <strong>{app.approvedBy || 'Principal'}</strong></span>
                        <span className="block text-[11px] text-slate-400">{app.approvedDate}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1 w-max">
                          <FileCheck className="w-3 h-3 text-emerald-600" />
                          {verifiedDocs}/{app.documents.length} Verified
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectApplication(app)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Inspect
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          onClick={() => onOpenEnroll(app)}
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Enroll Student
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
