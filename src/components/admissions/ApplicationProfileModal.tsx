import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Plus,
  ShieldCheck,
  Building,
  UserCheck,
  Send,
  MessageSquare,
} from 'lucide-react';
import { AdmissionApplication, DocumentVerificationStatus, DocumentType } from '../../types/admission';
import { admissionService } from '../../services/admissionService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ApplicationProfileModalProps {
  application: AdmissionApplication;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onOpenEnroll: (app: AdmissionApplication) => void;
}

export const ApplicationProfileModal: React.FC<ApplicationProfileModalProps> = ({
  application,
  isOpen,
  onClose,
  onRefresh,
  onOpenEnroll,
}) => {
  const { currentUser, can } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'interviews_tests' | 'notes_history'>('profile');

  // Quick Action States
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [waitlistPriority, setWaitlistPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [waitlistReason, setWaitlistReason] = useState('');

  // Staff note state
  const [newNote, setNewNote] = useState('');

  // Request document state
  const [requestDocType, setRequestDocType] = useState<DocumentType>('Birth Certificate');
  const [requestDocReason, setRequestDocReason] = useState('');
  const [showRequestDocModal, setShowRequestDocModal] = useState(false);

  // Schedule interview state
  const [showScheduleInterviewModal, setShowScheduleInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('10:00 AM');
  const [interviewerName, setInterviewerName] = useState('Arthur Pendelton (Academic Dean)');
  const [interviewLocation, setInterviewLocation] = useState('Executive Boardroom Alpha');
  const [interviewNotes, setInterviewNotes] = useState('');

  // Record test state
  const [showRecordTestModal, setShowRecordTestModal] = useState(false);
  const [testSubject, setTestSubject] = useState('General Aptitude & Mathematics');
  const [testTotal, setTestTotal] = useState(100);
  const [testObtained, setTestObtained] = useState(85);
  const [testRemarks, setTestRemarks] = useState('');

  if (!isOpen) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
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

  const handleApprove = () => {
    const res = admissionService.updateStatus(
      application.id,
      'APPROVED',
      { notes: 'Approved via application profile panel' },
      currentUser || undefined
    );
    if (!res.success) {
      showToast(res.error || 'Cannot approve application', 'error');
      return;
    }
    showToast(`Application ${application.applicationNumber} approved successfully.`, 'success');
    onRefresh();
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      showToast('Rejection reason is mandatory.', 'warning');
      return;
    }
    const res = admissionService.updateStatus(
      application.id,
      'REJECTED',
      { reason: rejectionReason.trim() },
      currentUser || undefined
    );
    if (!res.success) {
      showToast(res.error || 'Failed to reject', 'error');
      return;
    }
    setIsRejectModalOpen(false);
    showToast(`Application ${application.applicationNumber} marked as REJECTED.`, 'info');
    onRefresh();
  };

  const handleWaitlistConfirm = () => {
    if (!waitlistReason.trim()) {
      showToast('Waitlist reason is required.', 'warning');
      return;
    }
    admissionService.addToWaitlist(
      application.id,
      waitlistPriority,
      waitlistReason.trim(),
      undefined,
      currentUser || undefined
    );
    setIsWaitlistModalOpen(false);
    showToast(`${application.applicantName} added to ${waitlistPriority} waitlist.`, 'info');
    onRefresh();
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const apps = admissionService.getApplications();
    const app = apps.find((a) => a.id === application.id);
    if (app) {
      app.notes.unshift({
        id: `NOT-${Date.now()}`,
        author: currentUser?.name || 'Admissions Staff',
        authorRole: currentUser?.role || 'Admin',
        note: newNote.trim(),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      });
      admissionService.updateApplication(app.id, { notes: app.notes }, currentUser || undefined);
      setNewNote('');
      showToast('Internal note saved.', 'success');
      onRefresh();
    }
  };

  const handleVerifyDocument = (docId: string, status: DocumentVerificationStatus) => {
    admissionService.verifyDocument(application.id, docId, status, undefined, currentUser || undefined);
    showToast(`Document marked as ${status}.`, 'success');
    onRefresh();
  };

  const handleRequestDocumentSubmit = () => {
    if (!requestDocReason.trim()) {
      showToast('Please provide a reason for requesting this document.', 'warning');
      return;
    }
    admissionService.requestReplacementDocument(
      application.id,
      requestDocType,
      requestDocReason.trim(),
      currentUser || undefined
    );
    setShowRequestDocModal(false);
    setRequestDocReason('');
    showToast(`Requested replacement: ${requestDocType}`, 'info');
    onRefresh();
  };

  const handleScheduleInterviewSubmit = () => {
    if (!interviewDate) {
      showToast('Please select an interview date.', 'warning');
      return;
    }
    admissionService.scheduleInterview(
      application.id,
      {
        date: interviewDate,
        time: interviewTime,
        interviewerName,
        location: interviewLocation,
        notes: interviewNotes,
      },
      currentUser || undefined
    );
    setShowScheduleInterviewModal(false);
    showToast('Interview session scheduled.', 'success');
    onRefresh();
  };

  const handleRecordTestSubmit = () => {
    const obtained = Number(testObtained);
    const total = Number(testTotal);
    if (isNaN(obtained) || isNaN(total) || total <= 0) {
      showToast('Please enter valid numeric scores.', 'warning');
      return;
    }
    const pct = Math.round((obtained / total) * 100);
    admissionService.recordAdmissionTest(
      application.id,
      {
        subjectCategory: testSubject,
        testDate: new Date().toISOString().split('T')[0],
        totalMarks: total,
        obtainedMarks: obtained,
        result: pct >= 60 ? 'PASS' : 'FAIL',
        remarks: testRemarks,
      },
      currentUser || undefined
    );
    setShowRecordTestModal(false);
    showToast(`Entrance assessment recorded (${pct}%).`, 'success');
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl shadow-sm">
              {application.applicantFirstName[0]}
              {application.applicantLastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {application.applicantName}
                </h2>
                <Badge variant={getStatusBadgeVariant(application.status)}>
                  {application.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {application.applicationNumber}
                </span>
                <span>Applying for: <strong className="text-slate-800">{application.appliedClassName}</strong></span>
                <span>Academic Year: <strong className="text-slate-800">{application.academicYear}</strong></span>
                <span>Applied: {application.applicationDate}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Bar for Staff */}
        <div className="px-6 py-2.5 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-medium text-slate-500">Quick Actions:</span>
          <div className="flex flex-wrap items-center gap-2">
            {application.status !== 'APPROVED' && application.status !== 'ENROLLED' && (
              <Button size="sm" variant="success" onClick={handleApprove}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Approve
              </Button>
            )}

            {application.status === 'APPROVED' && (
              <Button
                size="sm"
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                onClick={() => {
                  onClose();
                  onOpenEnroll(application);
                }}
              >
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                Enroll Student
              </Button>
            )}

            {application.status !== 'WAITLISTED' && application.status !== 'ENROLLED' && (
              <Button size="sm" variant="outline" onClick={() => setIsWaitlistModalOpen(true)}>
                <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Waitlist
              </Button>
            )}

            {application.status !== 'REJECTED' && application.status !== 'ENROLLED' && (
              <Button size="sm" variant="danger" onClick={() => setIsRejectModalOpen(true)}>
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Reject
              </Button>
            )}

            <Button size="sm" variant="outline" onClick={() => setShowScheduleInterviewModal(true)}>
              <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" />
              Schedule Interview
            </Button>

            <Button size="sm" variant="outline" onClick={() => setShowRecordTestModal(true)}>
              <Award className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              Record Test
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-sm bg-white">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Applicant & Parent Info
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Documents
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
              {application.documents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('interviews_tests')}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'interviews_tests'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Interviews & Tests
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
              {application.interviews.length + application.tests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('notes_history')}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'notes_history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Notes & History
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
              {application.notes.length + application.statusHistory.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          {/* 1. Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Approval / Rejection Banner */}
              {application.status === 'APPROVED' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-emerald-900 text-sm">Application Approved for Enrollment</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Approved by <strong>{application.approvedBy}</strong> on {application.approvedDate}.
                      {application.approvalNotes && ` Note: "${application.approvalNotes}"`}
                    </p>
                  </div>
                </div>
              )}

              {application.status === 'REJECTED' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-rose-900 text-sm">Application Rejected</h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Rejected by <strong>{application.rejectedBy}</strong> on {application.rejectedDate}.
                    </p>
                    <p className="text-xs font-medium text-rose-800 mt-1 bg-white/60 px-2 py-1 rounded border border-rose-100 inline-block">
                      Reason: {application.rejectionReason}
                    </p>
                  </div>
                </div>
              )}

              {application.status === 'ENROLLED' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">Candidate Formally Enrolled as Student</h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Student ID: <strong>{application.enrolledStudentId}</strong> | Admission No: <strong>{application.enrolledAdmissionNumber}</strong> | Enrolled Date: {application.enrolledDate}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Applicant Info Box */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-500" />
                    Applicant Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Full Legal Name</span>
                      <span className="font-semibold text-slate-800">{application.applicantName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Date of Birth</span>
                      <span className="font-semibold text-slate-800">{application.dateOfBirth}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Gender</span>
                      <span className="font-semibold text-slate-800">{application.gender}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Previous Grade</span>
                      <span className="font-semibold text-slate-800">{application.previousGrade || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block">Previous School</span>
                      <span className="font-semibold text-slate-800">{application.previousSchool || 'None'}</span>
                    </div>
                    {application.previousAcademicPerformance && (
                      <div className="col-span-2">
                        <span className="text-slate-400 block">Prior Academic Performance</span>
                        <p className="text-slate-700 mt-0.5 bg-slate-50 p-2 rounded border border-slate-100">
                          {application.previousAcademicPerformance}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Parent / Guardian Box */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    Parent / Guardian Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Parent Name</span>
                      <span className="font-semibold text-slate-800">{application.parentName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Relationship</span>
                      <span className="font-semibold text-slate-800">{application.parentRelationship}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Primary Phone</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {application.parentPhone}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Alternate Phone</span>
                      <span className="font-semibold text-slate-800">
                        {application.parentAlternatePhone || 'None'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block">Email Address</span>
                      <span className="font-semibold text-indigo-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {application.parentEmail}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block">Occupation / Employer</span>
                      <span className="font-semibold text-slate-800">{application.parentOccupation || 'Unspecified'}</span>
                    </div>
                  </div>
                </div>

                {/* Address & Emergency Info */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    Address & Residence
                  </h3>
                  <div className="text-xs space-y-2">
                    <div>
                      <span className="text-slate-400 block">Street Address</span>
                      <span className="font-semibold text-slate-800">{application.address}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-slate-400 block">City</span>
                        <span className="font-semibold text-slate-800">{application.city}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Postal Code</span>
                        <span className="font-semibold text-slate-800">{application.postalCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Country</span>
                        <span className="font-semibold text-slate-800">{application.country}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency & Source Info */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-indigo-500" />
                    Emergency Contact & Source
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Emergency Contact</span>
                      <span className="font-semibold text-slate-800">{application.emergencyContactName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Relationship</span>
                      <span className="font-semibold text-slate-800">{application.emergencyContactRelationship}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block">Emergency Phone</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {application.emergencyContactPhone}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Lead Source</span>
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block">
                        {application.source}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">How they heard</span>
                      <span className="font-medium text-slate-700">{application.howDidYouHear || 'Direct inquiry'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Submitted Verification Documents</h3>
                  <p className="text-xs text-slate-500">Review, verify, or request replacements for required admission records.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowRequestDocModal(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Request Replacement
                </Button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Document Type</th>
                      <th className="px-4 py-3">File Details</th>
                      <th className="px-4 py-3">Uploaded Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Verified By</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {application.documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-800">{doc.type}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-slate-700 block">{doc.fileName}</span>
                          <span className="text-[11px] text-slate-400">{doc.fileSize}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{doc.uploadedDate || 'Pending upload'}</td>
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
                              {doc.verifiedBy}
                              <span className="block text-[10px] text-slate-400">{doc.verificationDate}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Unverified</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5">
                          {doc.verificationStatus !== 'VERIFIED' && (
                            <button
                              onClick={() => handleVerifyDocument(doc.id, 'VERIFIED')}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold"
                            >
                              Verify
                            </button>
                          )}
                          {doc.verificationStatus !== 'REJECTED' && (
                            <button
                              onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-xs font-semibold"
                            >
                              Reject
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Interviews & Tests Tab */}
          {activeTab === 'interviews_tests' && (
            <div className="space-y-6">
              {/* Interviews Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Interviews ({application.interviews.length})
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => setShowScheduleInterviewModal(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Schedule Interview
                  </Button>
                </div>

                {application.interviews.length === 0 ? (
                  <div className="p-6 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    No interviews scheduled yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {application.interviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{interview.date} at {interview.time}</span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                interview.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {interview.status}
                            </span>
                            {interview.result && (
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-100 text-indigo-800">
                                {interview.result.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 mt-1">
                            Interviewer: <strong>{interview.interviewerName}</strong> ({interview.location})
                          </p>
                          {interview.comments && (
                            <p className="text-slate-500 italic mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                              "{interview.comments}"
                            </p>
                          )}
                        </div>
                        {interview.score !== undefined && (
                          <div className="text-right flex-shrink-0">
                            <span className="text-slate-400 block text-[10px] uppercase">Interview Score</span>
                            <span className="text-xl font-bold text-indigo-600">{interview.score}/100</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admission Tests Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    Admission Entrance Tests ({application.tests.length})
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => setShowRecordTestModal(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Record Test Result
                  </Button>
                </div>

                {application.tests.length === 0 ? (
                  <div className="p-6 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    No admission tests registered for this candidate.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {application.tests.map((test) => (
                      <div
                        key={test.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{test.subjectCategory}</span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                test.result === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {test.result}
                            </span>
                          </div>
                          <p className="text-slate-500 mt-1">
                            Conducted: {test.testDate} {test.evaluatorName && `| Evaluator: ${test.evaluatorName}`}
                          </p>
                          {test.remarks && <p className="text-slate-600 mt-0.5 italic">"{test.remarks}"</p>}
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-indigo-600">{test.obtainedMarks}/{test.totalMarks}</span>
                          <span className="text-xs text-slate-500 block">({test.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Notes & History Tab */}
          {activeTab === 'notes_history' && (
            <div className="space-y-6">
              {/* Add Note Input */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Add Internal Staff Note</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter private admission committee note..."
                    className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <Button size="sm" onClick={handleAddNote}>
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Save Note
                  </Button>
                </div>
              </div>

              {/* Notes List */}
              {application.notes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Committee Notes</h4>
                  {application.notes.map((n) => (
                    <div key={n.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs shadow-sm">
                      <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                        <span className="font-semibold text-slate-700">{n.author} ({n.authorRole})</span>
                        <span>{n.timestamp}</span>
                      </div>
                      <p className="text-slate-800">{n.note}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Status History Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status History Log</h4>
                <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-2">
                  {application.statusHistory.map((hist) => (
                    <div key={hist.id} className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-sm" />
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {hist.fromStatus} → {hist.toStatus}
                          </span>
                          <span className="text-[11px] text-slate-400">{hist.timestamp}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">
                          Changed by <strong className="text-slate-700">{hist.changedBy}</strong> ({hist.changedByRole})
                        </p>
                        {hist.reason && (
                          <p className="text-slate-500 text-[11px] mt-1 italic">Reason: {hist.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-400">Application record maintained in secure admissions registry.</span>
          <Button variant="secondary" onClick={onClose}>
            Close Window
          </Button>
        </div>
      </div>

      {/* Rejection Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              Confirm Application Rejection
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Please enter the mandatory reason for rejecting this application. This will be recorded in the audit log.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Entrance assessment below 60% requirement..."
              className="w-full text-xs p-3 border border-slate-200 rounded-lg mt-4 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button size="sm" variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={handleRejectConfirm}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Waitlist Modal */}
      {isWaitlistModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Place on Waitlist
            </h3>
            <div className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Waitlist Priority</label>
                <select
                  value={waitlistPriority}
                  onChange={(e) => setWaitlistPriority(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Waitlist Reason</label>
                <textarea
                  rows={2}
                  value={waitlistReason}
                  onChange={(e) => setWaitlistReason(e.target.value)}
                  placeholder="e.g. Target section full; high test score qualifies for reserve seat."
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button size="sm" variant="secondary" onClick={() => setIsWaitlistModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleWaitlistConfirm}>
                Place on Waitlist
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Request Replacement Document Modal */}
      {showRequestDocModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Request Replacement Document
            </h3>
            <div className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Document Type</label>
                <select
                  value={requestDocType}
                  onChange={(e) => setRequestDocType(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Birth Certificate">Birth Certificate</option>
                  <option value="Previous School Certificate">Previous School Certificate</option>
                  <option value="Student Photo">Student Photo</option>
                  <option value="Parent/Guardian ID">Parent/Guardian ID</option>
                  <option value="Medical Clearance">Medical Clearance</option>
                  <option value="Transfer Certificate">Transfer Certificate</option>
                  <option value="Other Documents">Other Documents</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason / Instructions for Parent</label>
                <textarea
                  rows={3}
                  value={requestDocReason}
                  onChange={(e) => setRequestDocReason(e.target.value)}
                  placeholder="e.g. Previous copy was blurred; please upload an official stamped transcript..."
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button size="sm" variant="secondary" onClick={() => setShowRequestDocModal(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleRequestDocumentSubmit}>
                Dispatch Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleInterviewModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Schedule Candidate Interview
            </h3>
            <div className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Interviewer Name</label>
                <input
                  type="text"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Location / Room</label>
                <input
                  type="text"
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Preparation Notes</label>
                <textarea
                  rows={2}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Meeting agenda or focus questions..."
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button size="sm" variant="secondary" onClick={() => setShowScheduleInterviewModal(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleScheduleInterviewSubmit}>
                Confirm Interview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Test Modal */}
      {showRecordTestModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Record Entrance Test Score
            </h3>
            <div className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subject / Category</label>
                <input
                  type="text"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Obtained Marks</label>
                  <input
                    type="number"
                    value={testObtained}
                    onChange={(e) => setTestObtained(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={testTotal}
                    onChange={(e) => setTestTotal(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Evaluator Remarks</label>
                <textarea
                  rows={2}
                  value={testRemarks}
                  onChange={(e) => setTestRemarks(e.target.value)}
                  placeholder="Strengths, weaknesses, grade placement comments..."
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button size="sm" variant="secondary" onClick={() => setShowRecordTestModal(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleRecordTestSubmit}>
                Save Assessment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
