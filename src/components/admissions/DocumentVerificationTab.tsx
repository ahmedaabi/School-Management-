import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { DocumentVerificationStatus, DocumentType, AdmissionApplication } from '../../types/admission';
import { admissionService } from '../../services/admissionService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface DocumentVerificationTabProps {
  onSelectApplication: (app: AdmissionApplication) => void;
  onRefresh: () => void;
}

export const DocumentVerificationTab: React.FC<DocumentVerificationTabProps> = ({
  onSelectApplication,
  onRefresh,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const applications = admissionService.getApplications();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Flatten documents with applicant metadata
  const allDocuments = useMemo(() => {
    const list: {
      application: AdmissionApplication;
      doc: AdmissionApplication['documents'][0];
    }[] = [];

    applications.forEach((app) => {
      app.documents.forEach((d) => {
        list.push({ application: app, doc: d });
      });
    });

    return list;
  }, [applications]);

  const filteredDocs = useMemo(() => {
    return allDocuments.filter(({ application, doc }) => {
      const matchesSearch =
        !searchTerm.trim() ||
        application.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || doc.verificationStatus === statusFilter;
      const matchesType = typeFilter === 'ALL' || doc.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allDocuments, searchTerm, statusFilter, typeFilter]);

  const handleVerify = (appId: string, docId: string) => {
    admissionService.verifyDocument(appId, docId, 'VERIFIED', undefined, currentUser || undefined);
    showToast('Document marked as VERIFIED.', 'success');
    onRefresh();
  };

  const handleReject = (appId: string, docId: string) => {
    const reason = window.prompt('Enter reason for document rejection:');
    if (!reason || !reason.trim()) {
      showToast('Rejection cancelled: reason is mandatory.', 'warning');
      return;
    }
    admissionService.verifyDocument(appId, docId, 'REJECTED', reason.trim(), currentUser || undefined);
    showToast('Document marked as REJECTED.', 'info');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admissions Document Verification Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit and verify birth certificates, prior transcripts, identification, and medical records.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, app #, or filename..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="MISSING">MISSING</option>
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
            >
              <option value="ALL">All Document Types</option>
              <option value="Birth Certificate">Birth Certificate</option>
              <option value="Previous School Certificate">Previous School Certificate</option>
              <option value="Student Photo">Student Photo</option>
              <option value="Parent/Guardian ID">Parent/Guardian ID</option>
              <option value="Medical Clearance">Medical Clearance</option>
              <option value="Transfer Certificate">Transfer Certificate</option>
              <option value="Other Documents">Other Documents</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Total Documents in Queue: <strong>{filteredDocs.length}</strong>
          </span>
          {(searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setTypeFilter('ALL');
              }}
              className="text-indigo-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Applicant & App #</th>
                <th className="px-4 py-3">Document Category</th>
                <th className="px-4 py-3">File Attached</th>
                <th className="px-4 py-3">Uploaded Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Audit Details</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No documents found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(({ application, doc }) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{application.applicantName}</span>
                      <span className="font-mono text-[11px] text-slate-400">{application.applicationNumber}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{doc.type}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <div>
                          <span className="font-mono text-slate-700 block">{doc.fileName}</span>
                          <span className="text-[10px] text-slate-400">{doc.fileSize}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{doc.uploadedDate || 'Pending'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          doc.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.verificationStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : doc.verificationStatus === 'MISSING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {doc.verificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {doc.verifiedBy ? (
                        <span>
                          Verified by {doc.verifiedBy} ({doc.verificationDate})
                        </span>
                      ) : doc.notes ? (
                        <span className="italic text-amber-700">{doc.notes}</span>
                      ) : (
                        <span className="text-slate-400">Awaiting verification</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectApplication(application)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Inspect
                      </Button>

                      {doc.verificationStatus !== 'VERIFIED' && (
                        <button
                          onClick={() => handleVerify(application.id, doc.id)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold"
                        >
                          Verify
                        </button>
                      )}

                      {doc.verificationStatus !== 'REJECTED' && (
                        <button
                          onClick={() => handleReject(application.id, doc.id)}
                          className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-xs font-semibold"
                        >
                          Reject
                        </button>
                      )}
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
