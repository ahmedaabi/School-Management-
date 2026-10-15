import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  Eye,
  CheckCircle2,
  DollarSign,
  Download,
  Building,
} from 'lucide-react';
import { AdmissionApplication } from '../../types/admission';
import { admissionService } from '../../services/admissionService';
import { dataService } from '../../services/dataService';
import { Button } from '../ui/Button';

interface EnrolledStudentsTabProps {
  onSelectApplication: (app: AdmissionApplication) => void;
  onRefresh: () => void;
}

export const EnrolledStudentsTab: React.FC<EnrolledStudentsTabProps> = ({
  onSelectApplication,
  onRefresh,
}) => {
  const applications = admissionService.getApplications();
  const enrolledApps = applications.filter((a) => a.status === 'ENROLLED');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = enrolledApps.filter(
    (app) =>
      !searchTerm.trim() ||
      app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.enrolledAdmissionNumber && app.enrolledAdmissionNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.enrolledStudentId && app.enrolledStudentId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Formally Enrolled Cohort Roster</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admissions successfully transitioned to official student records in the school registry.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
          Enrolled Students: <strong>{enrolledApps.length}</strong>
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
            placeholder="Search by student ID, admission #, or name..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student & Admission ID</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Class & Section</th>
                <th className="px-4 py-3">Parent / Guardian</th>
                <th className="px-4 py-3">Enrolled Date</th>
                <th className="px-4 py-3">Fee Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No enrolled candidates found matching search.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-slate-900 block">
                        {app.enrolledAdmissionNumber || 'AD-2026-PENDING'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {app.enrolledStudentId || 'STU-PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{app.applicantName}</span>
                      <span className="text-[10px] text-slate-400">App: {app.applicationNumber}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {app.appliedClassName} ({app.appliedSectionName})
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-800 font-medium block">{app.parentName}</span>
                      <span className="text-[10px] text-slate-400">{app.parentEmail}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{app.enrolledDate || 'Recent'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 w-max ${
                          app.feeStructureAssigned
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <DollarSign className="w-3 h-3" />
                        {app.feeStructureAssigned ? 'Invoice Generated' : 'Schedule Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectApplication(app)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Inspect Record
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
