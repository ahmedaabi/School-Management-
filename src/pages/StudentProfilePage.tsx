import { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Award,
  BookOpen,
  DollarSign,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  Printer,
  Download,
  Shield,
  Upload,
  UserCheck,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Student } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EditStudentModal } from '../components/modals/EditStudentModal';
import { AttendanceCalendar } from '../components/attendance/AttendanceCalendar';

export interface StudentProfilePageProps {
  studentId: string;
  onBack: () => void;
}

export const StudentProfilePage = ({ studentId, onBack }: StudentProfilePageProps) => {
  const { can } = useAuth();
  const { showToast } = useToast();
  const [student, setStudent] = useState<Student | null>(() => dataService.getStudentById(studentId));
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!student) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl">
        <h3 className="text-base font-bold text-slate-800">Student Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested student ID does not exist.</p>
        <Button variant="primary" size="sm" onClick={onBack} className="mt-4">
          Back to Directory
        </Button>
      </div>
    );
  }

  // Related data
  const attendanceLogs = dataService.getAttendanceByStudent(student.studentId);
  const feeRecords = dataService.getFeesByStudent(student.id);
  const paymentHistory = dataService.getPaymentsByStudent(student.studentId);
  const examResults = dataService.getExamResultsByStudent(student.studentId);
  const homeworkSubmissions = dataService.getHomeworkByStudent(student.studentId);
  const leaveRequests = dataService.getLeaveRequestsByStudent(student.studentId);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'attendance', label: 'Attendance', count: attendanceLogs.length },
    { id: 'fees', label: 'Fees & Billing', count: feeRecords.length },
    { id: 'results', label: 'Exams & Results', count: examResults.length },
    { id: 'homework', label: 'Homework', count: homeworkSubmissions.length },
    { id: 'leave', label: 'Leave Requests', count: leaveRequests.length },
    { id: 'discipline', label: 'Discipline & Merits' },
    { id: 'health', label: 'Health Record' },
    { id: 'documents', label: 'Documents' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Roster</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Profile
          </Button>
          {can('students.edit') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit Student
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header Hero Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <img
              src={student.profilePhoto}
              alt={student.firstName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-200 shadow-xs shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {student.firstName} {student.lastName}
                </h1>
                <Badge
                  variant={
                    student.status === 'Active'
                      ? 'success'
                      : student.status === 'Suspended'
                      ? 'danger'
                      : 'neutral'
                  }
                >
                  {student.status}
                </Badge>
                {student.bloodGroup && (
                  <span className="text-[11px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200/60">
                    Blood: {student.bloodGroup}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 font-medium">
                <span className="font-mono text-slate-700 font-semibold">{student.studentId}</span>
                <span>•</span>
                <span className="text-slate-700 font-semibold">{student.className} ({student.sectionName})</span>
                <span>•</span>
                <span>Roll #{student.rollNumber}</span>
                <span>•</span>
                <span>Enrolled: {student.admissionDate}</span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-2.5">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {student.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {student.parentContact}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges in Header */}
          <div className="flex sm:flex-row md:flex-col gap-3 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Attendance</span>
                <span className="text-sm font-bold text-slate-800">{student.attendanceRate}% Rate</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fee Account</span>
                <span
                  className={`text-sm font-bold ${
                    student.feeStatus === 'Overdue' ? 'text-rose-600' : 'text-slate-800'
                  }`}
                >
                  {student.feeStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 -mb-2">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Personal & Academic Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Details */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Personal Demographics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">First Name</span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{student.firstName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Last Name</span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{student.lastName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date of Birth</span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{student.dateOfBirth}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Gender</span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{student.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Blood Group</span>
                  <span className="font-semibold text-rose-600 text-sm mt-0.5 block">{student.bloodGroup || 'O+'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Previous School</span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{student.previousSchool || 'None'}</span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-400 block font-medium">Residential Street Address</span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{student.address}</span>
                </div>
              </div>
            </div>

            {/* Parent & Guardian Info */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Parent & Guardian Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Father / Primary Guardian</span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{student.fatherGuardianName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Primary Contact Phone</span>
                  <span className="font-semibold text-indigo-600 text-sm mt-0.5 block">{student.parentContact}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Secondary / Mother Contact</span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                    {student.secondaryContact || 'None Listed'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Emergency Designated Contact</span>
                  <span className="font-semibold text-rose-600 text-sm mt-0.5 block">
                    {student.emergencyContact || student.parentContact}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Academic Summary & Alerts */}
          <div className="space-y-6">
            {/* Academic Standing */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Academic Summary
              </h3>
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Enrolled Class</span>
                  <span className="font-bold text-slate-900">{student.className}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Section Assignment</span>
                  <span className="font-bold text-slate-900">{student.sectionName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Roll Number</span>
                  <span className="font-mono font-bold text-slate-900">{student.rollNumber}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Current Cumulative GPA</span>
                  <span className="font-bold text-emerald-600 text-sm">3.85 / 4.0</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Class Rank Standing</span>
                  <span className="font-bold text-indigo-600">Top 5% (3rd / 32)</span>
                </div>
              </div>
            </div>

            {/* Health & Allergy Caution */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Health & Medical Notes
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/60 border border-rose-100 p-3 rounded-lg">
                {student.medicalNotes || 'No specific medical or allergy precautions on file.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance */}
      {activeTab === 'attendance' && (() => {
        const totalSessions = attendanceLogs.length;
        const presentCount = attendanceLogs.filter((r) => r.status === 'Present').length;
        const absentCount = attendanceLogs.filter((r) => r.status === 'Absent').length;
        const lateCount = attendanceLogs.filter((r) => r.status === 'Late').length;
        const excusedCount = attendanceLogs.filter((r) => r.status === 'Excused').length;
        const computedRate =
          totalSessions > 0
            ? Number((((presentCount + lateCount) / totalSessions) * 100).toFixed(1))
            : student.attendanceRate;

        return (
          <div className="space-y-6">
            {/* Real-time Attendance Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
                <span className="text-[11px] text-slate-500 font-semibold block">Attendance Rate</span>
                <div className="text-xl font-bold text-slate-900 mt-1">{computedRate}%</div>
                <span className={`text-[10px] font-semibold ${computedRate < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {computedRate < 75 ? 'Below Target' : 'In Good Standing'}
                </span>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
                <span className="text-[11px] text-slate-500 font-semibold block">Present Days</span>
                <div className="text-xl font-bold text-emerald-600 mt-1">{presentCount}</div>
                <span className="text-[10px] text-slate-400">Standard sessions</span>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
                <span className="text-[11px] text-slate-500 font-semibold block">Absences</span>
                <div className="text-xl font-bold text-rose-600 mt-1">{absentCount}</div>
                <span className="text-[10px] text-slate-400">Unexcused</span>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
                <span className="text-[11px] text-slate-500 font-semibold block">Late / Tardy</span>
                <div className="text-xl font-bold text-amber-600 mt-1">{lateCount}</div>
                <span className="text-[10px] text-slate-400">Morning arrival</span>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
                <span className="text-[11px] text-slate-500 font-semibold block">Excused Leaves</span>
                <div className="text-xl font-bold text-sky-600 mt-1">{excusedCount}</div>
                <span className="text-[10px] text-slate-400">Verified medical</span>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
                <span className="text-[11px] text-slate-500 font-semibold block">Total Sessions</span>
                <div className="text-xl font-bold text-slate-900 mt-1">{totalSessions}</div>
                <span className="text-[10px] text-slate-400">Roll calls taken</span>
              </div>
            </div>

            {/* Interactive Visual Attendance Calendar */}
            <AttendanceCalendar
              records={attendanceLogs}
              studentName={`${student.firstName} ${student.lastName}`}
              initialYear={2026}
              initialMonth={8}
            />

            {/* Chronological Table */}
            <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Full Session Attendance Ledger ({attendanceLogs.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Period / Session</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Logged By</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {attendanceLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No specific attendance records found.
                        </td>
                      </tr>
                    ) : (
                      attendanceLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-medium">{log.date}</td>
                          <td className="py-3 px-4 font-medium text-slate-900">{log.className}</td>
                          <td className="py-3 px-4 text-slate-600">{log.period || 'Daily Homeroom'}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                log.status === 'Present'
                                  ? 'success'
                                  : log.status === 'Late'
                                  ? 'warning'
                                  : log.status === 'Excused'
                                  ? 'info'
                                  : 'danger'
                              }
                            >
                              {log.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{log.recordedBy || 'Homeroom Faculty'}</td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                            {log.remarks || 'Standard roll call entry'}
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
      })()}

      {/* Tab 3: Fees & Billing */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl">
              <span className="text-xs text-slate-500 font-medium">Assigned Tuition (Term 2)</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                ${feeRecords.reduce((acc, f) => acc + f.amount, 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">Total institutional dues</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl">
              <span className="text-xs text-slate-500 font-medium">Payments Reconciled</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                ${feeRecords.reduce((acc, f) => acc + f.paidAmount, 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Verified by Bursar</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl">
              <span className="text-xs text-slate-500 font-medium">Outstanding Balance</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                ${student.pendingFeeAmount?.toLocaleString() || '0'}
              </div>
              <span className="text-[11px] text-slate-400">Status: {student.feeStatus}</span>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Assigned Fee Invoices & Schedules
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Invoice / Type</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {feeRecords.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{fee.feeType}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{fee.id}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{fee.dueDate}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">${fee.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">
                        ${fee.paidAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            fee.status === 'Paid'
                              ? 'success'
                              : fee.status === 'Pending'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {fee.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Receipts History */}
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Official Receipts Ledger ({paymentHistory.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Amount Cleared</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paymentHistory.map((pmt) => (
                    <tr key={pmt.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {pmt.receiptNumber}
                      </td>
                      <td className="py-3 px-4">{pmt.paymentDate}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{pmt.method}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        ${pmt.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => showToast(`Printing receipt ${pmt.receiptNumber}`, 'info')}
                          className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Exams & Results */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Official Academic Transcripts & Term Exams
                </h3>
                <p className="text-[11px] text-slate-400">Cumulative GPA: 3.85 / 4.0</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Exam Session</th>
                    <th className="py-3 px-4">Marks Obtained</th>
                    <th className="py-3 px-4">Max Marks</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {examResults.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No examination results recorded yet for this session.
                      </td>
                    </tr>
                  ) : (
                    examResults.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">{r.subjectName}</td>
                        <td className="py-3 px-4 font-medium text-slate-600">{r.examName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">{r.marksObtained}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{r.maxMarks}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-xs ${
                              r.grade.startsWith('A')
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : r.grade.startsWith('B')
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {r.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 italic">"{r.remarks || 'Commendable performance'}"</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Homework */}
      {activeTab === 'homework' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Assigned Homework & Deliverables
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Assignment Title</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Submission Status</th>
                  <th className="py-3 px-4">Feedback / Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {homeworkSubmissions.map((hw) => (
                  <tr key={hw.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{hw.title}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{hw.subject}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{hw.dueDate}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          hw.status === 'Submitted'
                            ? 'success'
                            : hw.status === 'Pending'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {hw.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {hw.grade ? (
                        <span className="font-bold text-emerald-600">{hw.grade}</span>
                      ) : (
                        <span className="text-slate-400">Awaiting review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Leave Requests */}
      {activeTab === 'leave' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Absence & Leave Authorization History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">From Date</th>
                  <th className="py-3 px-4">To Date</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leaveRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono">{req.startDate}</td>
                    <td className="py-3 px-4 font-mono">{req.endDate}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{req.reason}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          req.status === 'Approved'
                            ? 'success'
                            : req.status === 'Pending'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {req.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{req.approvedBy || 'Pending Principal Review'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Discipline */}
      {activeTab === 'discipline' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Honor Roll & Academic Commendations
              </h3>
            </div>
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200/70 flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-900">Principal's Honor List</h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">Awarded for consistent GPA ≥ 3.8 across both terms.</p>
                </div>
                <span className="text-[10px] font-mono font-semibold text-amber-700">Term 1 2024</span>
              </div>
              <div className="p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-200/70 flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">Mathematics Olympiad Distinction</h4>
                  <p className="text-[11px] text-indigo-800 mt-0.5">Represented St. Augustine High in inter-school science fair.</p>
                </div>
                <span className="text-[10px] font-mono font-semibold text-indigo-700">Oct 2024</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Behavioral Infractions & Conduct Records
              </h3>
            </div>
            <p className="text-xs text-slate-500 italic">No disciplinary infractions recorded on pupil permanent record.</p>
          </div>
        </div>
      )}

      {/* Tab 8: Health */}
      {activeTab === 'health' && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Heart className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Campus Health & Emergency Clinic Record</h3>
              <p className="text-xs text-slate-500">Confidential pupil health profile managed by the school nurse</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <span className="text-slate-400 font-medium block">Blood Group</span>
              <span className="text-base font-bold text-rose-600 mt-0.5 block">{student.bloodGroup || 'O+'}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <span className="text-slate-400 font-medium block">Emergency Contact</span>
              <span className="text-base font-bold text-slate-800 mt-0.5 block">{student.emergencyContact || student.parentContact}</span>
            </div>
            <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <span className="text-slate-400 font-medium block">Medical Conditions & Allergy Notes</span>
              <p className="text-slate-800 font-medium mt-1 leading-relaxed">
                {student.medicalNotes || 'No chronic conditions, active medications, or dietary restrictions reported by guardian.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Permanent Student Dossier Files</h3>
              <p className="text-xs text-slate-500">Verified official administrative and identity artifacts</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => showToast('File upload picker initialized', 'info')}
            >
              Upload Document
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              { name: 'State Birth Certificate.pdf', size: '1.2 MB', date: 'Enrolled Verified' },
              { name: 'Prior School Transcript & Recommendations.pdf', size: '2.8 MB', date: 'Verified' },
              { name: 'Immunization & Health Clearance Certificate.pdf', size: '850 KB', date: 'Nurse Approved' },
              { name: 'Parent Residency ID Proof.pdf', size: '940 KB', date: 'Verified' },
            ].map((doc, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">{doc.name}</span>
                    <span className="text-[10px] text-slate-400">{doc.size} • {doc.date}</span>
                  </div>
                </div>
                <Button
                  variant="subtle"
                  size="sm"
                  leftIcon={<Download className="w-3 h-3" />}
                  onClick={() => showToast(`Downloading ${doc.name}`, 'info')}
                >
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={isEditModalOpen}
        student={student}
        onClose={() => setIsEditModalOpen(false)}
        onStudentUpdated={(updated) => {
          setStudent(updated);
        }}
      />
    </div>
  );
};
