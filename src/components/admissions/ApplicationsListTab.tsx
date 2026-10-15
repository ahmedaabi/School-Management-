import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  FilePlus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Printer,
} from 'lucide-react';
import { AdmissionApplication, AdmissionStatus } from '../../types/admission';
import { admissionService } from '../../services/admissionService';
import { dataService } from '../../services/dataService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ApplicationsListTabProps {
  onSelectApplication: (app: AdmissionApplication) => void;
  onOpenNewApplication: () => void;
  onOpenEnroll: (app: AdmissionApplication) => void;
  onRefreshData: () => void;
}

export const ApplicationsListTab: React.FC<ApplicationsListTabProps> = ({
  onSelectApplication,
  onOpenNewApplication,
  onOpenEnroll,
  onRefreshData,
}) => {
  const applications = admissionService.getApplications();
  const classes = dataService.getClasses();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter logic
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        !searchTerm.trim() ||
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.parentPhone.includes(searchTerm) ||
        app.parentEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
      const matchesClass = classFilter === 'ALL' || app.appliedClassId === classFilter || app.appliedClassName === classFilter;
      const matchesSource = sourceFilter === 'ALL' || app.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesClass && matchesSource;
    });
  }, [applications, searchTerm, statusFilter, classFilter, sourceFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / itemsPerPage));
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const handleExportCSV = () => {
    const headers = [
      'Application Number',
      'Applicant Name',
      'Class',
      'Date of Birth',
      'Gender',
      'Parent Name',
      'Parent Phone',
      'Parent Email',
      'Status',
      'Source',
      'Application Date',
    ];

    const rows = filteredApplications.map((a) => [
      a.applicationNumber,
      `"${a.applicantName}"`,
      `"${a.appliedClassName}"`,
      a.dateOfBirth,
      a.gender,
      `"${a.parentName}"`,
      a.parentPhone,
      a.parentEmail,
      a.status,
      a.source,
      a.applicationDate,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Admissions_Applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admission Applications Registry</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming candidate profiles, verify requirements, and track review stages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
          <Button size="sm" variant="primary" onClick={onOpenNewApplication}>
            <FilePlus className="w-3.5 h-3.5 mr-1.5" />
            New Application
          </Button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, app #, phone, email..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="DOCUMENTS_PENDING">DOCUMENTS_PENDING</option>
              <option value="INTERVIEW_PENDING">INTERVIEW_PENDING</option>
              <option value="TEST_PENDING">TEST_PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="WAITLISTED">WAITLISTED</option>
              <option value="ENROLLED">ENROLLED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
            >
              <option value="ALL">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
            >
              <option value="ALL">All Application Sources</option>
              <option value="Website">Website</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Referral">Referral</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Education Fair">Education Fair</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Results summary & reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong>{filteredApplications.length}</strong> matching candidate application(s)
          </span>
          {(searchTerm || statusFilter !== 'ALL' || classFilter !== 'ALL' || sourceFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setClassFilter('ALL');
                setSourceFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-indigo-600 hover:underline font-semibold"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">App #</th>
                <th className="px-4 py-3">Applicant Name</th>
                <th className="px-4 py-3">Applying Class</th>
                <th className="px-4 py-3">Parent / Guardian</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{app.applicationNumber}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900 block">{app.applicantName}</span>
                      <span className="text-[11px] text-slate-400">
                        {app.gender}, DOB: {app.dateOfBirth}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{app.appliedClassName}</td>
                    <td className="px-4 py-3">
                      <span className="text-slate-800 font-medium block">{app.parentName}</span>
                      <span className="text-[11px] text-slate-400">{app.parentPhone}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {app.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{app.applicationDate}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(app.status)}>
                        {app.status.replace('_', ' ')}
                      </Badge>
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

                      {app.status === 'APPROVED' && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => onOpenEnroll(app)}
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Enroll
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
