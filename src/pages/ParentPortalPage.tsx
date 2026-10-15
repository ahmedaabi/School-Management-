import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import {
  Student,
  ParentRequestTicket,
  ParentRequestStatus,
  HomeworkItem,
  FeeItem,
} from '../types';
import {
  Users,
  Calendar,
  DollarSign,
  BookOpen,
  Award,
  HelpCircle,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Download,
  Send,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

export const ParentPortalPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'attendance' | 'fees' | 'homework' | 'requests'>('overview');

  // Load parent scoped children from dataService
  const children = useMemo(() => {
    return dataService.getStudentsScoped(currentUser);
  }, [currentUser]);

  // Selected child state (default to first child, e.g. Alexander Sterling)
  const [selectedChildId, setSelectedChildId] = useState<string>(() => {
    return children[0]?.studentId || 'STU-001';
  });

  const selectedChild = useMemo(() => {
    return children.find((c) => c.studentId === selectedChildId || c.id === selectedChildId) || children[0];
  }, [children, selectedChildId]);

  // Parent tickets
  const [requests, setRequests] = useState<ParentRequestTicket[]>(() => {
    return dataService.getParentRequests(currentUser.parentId || 'PAR-001');
  });

  // Homework for selected child
  const homework = useMemo(() => {
    return dataService.getHomeworkForStudent(selectedChild?.studentId, selectedChild?.className);
  }, [selectedChild]);

  // Fees for selected child
  const allFees = useMemo(() => {
    return dataService.getFees();
  }, []);

  const childFees = useMemo(() => {
    return allFees.filter(
      (f) => f.studentId === selectedChild?.studentId || f.studentId === 'STU-001'
    );
  }, [allFees, selectedChild]);

  // Exam results for selected child
  const examResults = useMemo(() => {
    return dataService.getExamResults().filter(
      (e) => e.studentId === selectedChild?.studentId || e.studentId === 'STU-001'
    );
  }, [selectedChild]);

  // New Ticket State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqCategory, setReqCategory] = useState<'LEAVE_APPLICATION' | 'FEE_QUERY' | 'ACADEMIC_CONCERN' | 'TRANSPORTATION' | 'GENERAL_FEEDBACK'>('LEAVE_APPLICATION');
  const [reqSubject, setReqSubject] = useState('');
  const [reqPriority, setReqPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [reqMessage, setReqMessage] = useState('');
  const [reqSuccessMessage, setReqSuccessMessage] = useState<string | null>(null);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return;

    const newTicket = dataService.createParentRequest(
      {
        parentId: currentUser.parentId || 'PAR-001',
        parentName: currentUser.name,
        studentId: selectedChild.studentId,
        studentName: `${selectedChild.firstName} ${selectedChild.lastName}`,
        category: reqCategory,
        subject: reqSubject,
        description: reqMessage,
        priority: reqPriority,
      },
      currentUser
    );

    setRequests((prev) => [newTicket, ...prev]);
    setShowRequestModal(false);
    setReqSubject('');
    setReqMessage('');
    setReqSuccessMessage(`Support request ${newTicket.ticketNumber} submitted to administration!`);
    setTimeout(() => setReqSuccessMessage(null), 4500);
  };

  // Payment Modal State
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeItem | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleSimulatePayment = (fee: FeeItem) => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      dataService.recordPayment({
        feeId: fee.id,
        studentId: fee.studentId,
        studentName: selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : 'Alexander Sterling',
        amountPaid: fee.amount,
        method: 'Bank Transfer',
      });
      setIsProcessingPayment(false);
      setSelectedFeeForPayment(null);
      setPaymentSuccess(`Payment receipt generated for ${fee.title} ($${fee.amount.toLocaleString()})! Status updated to Paid.`);
      setTimeout(() => setPaymentSuccess(null), 4000);
    }, 1000);
  };

  return (
    <div id="parent-portal-page" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Child Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Family Portal
            </span>
            <span className="text-xs text-slate-500">ID: {currentUser.parentId || 'PAR-001'}</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs text-slate-600">
            Monitoring verified academic, attendance, and financial progress for your enrolled children.
          </p>
        </div>

        {/* Child Selector Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Select Child:
          </span>
          <div className="flex items-center gap-2">
            {children.map((child) => {
              const isSelected = (child.studentId || child.id) === selectedChildId;
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedChildId(child.studentId || child.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <img
                    src={child.photoUrl}
                    alt={child.firstName}
                    className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {child.firstName} {child.lastName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {child.className} • Roll {child.rollNumber || '01'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto no-scrollbar pb-px">
        {[
          { id: 'overview', label: 'Child Dashboard', icon: Users },
          { id: 'academics', label: 'Report Cards & Grades', icon: Award },
          { id: 'attendance', label: 'Daily Attendance History', icon: Calendar },
          { id: 'fees', label: 'Tuition Invoices & Receipts', icon: DollarSign },
          { id: 'homework', label: 'Homework & Tasks', icon: BookOpen },
          { id: 'requests', label: 'Parent Helpdesk & Leaves', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notifications / Toast */}
      {reqSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{reqSuccessMessage}</span>
        </div>
      )}

      {paymentSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{paymentSuccess}</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && selectedChild && (
        <div className="space-y-6">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                <span>Today's Status</span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-700 mt-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Present in Class
              </div>
              <div className="text-xs text-slate-500 mt-1">Logged at 08:15 AM (Homeroom)</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                <span>Attendance Rate</span>
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {selectedChild.attendancePercentage}%
              </div>
              <div className="text-xs text-slate-500 mt-1">62 of 64 academic days present</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                <span>Academic Standing</span>
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {selectedChild.academicStanding || 'Distinction'}
              </div>
              <div className="text-xs text-purple-700 mt-1 font-semibold">GPA 3.85 / 4.0</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                <span>Tuition Balance</span>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                ${selectedChild.pendingFeeAmount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {selectedChild.pendingFeeAmount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('fees')}
                    className="text-amber-600 hover:text-amber-800 font-semibold"
                  >
                    View Invoice Breakdown →
                  </button>
                ) : (
                  <span className="text-emerald-600 font-medium">All dues settled</span>
                )}
              </div>
            </div>
          </div>

          {/* Child Identity & Classroom Cohort */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    Active Homework & Course Deadlines
                  </h3>
                  <p className="text-xs text-slate-500">Assignments assigned to {selectedChild.className}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('homework')}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  View All Homework →
                </button>
              </div>

              <div className="space-y-3">
                {homework.slice(0, 3).map((hw) => (
                  <div
                    key={hw.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-semibold">
                          {hw.subject}
                        </span>
                        <span className="text-xs text-slate-500">By {hw.assignedBy}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{hw.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{hw.description}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Due Date</span>
                        <span className="text-xs font-bold text-red-600">{hw.dueDate}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                        Pending Submission
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Faculty & Direct Contacts */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900 mb-1">Homeroom Faculty</h3>
                <p className="text-xs text-slate-500 mb-4">Direct academic and pastoral supervision.</p>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                      alt="Arthur Pendelton"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Arthur Pendelton</h4>
                      <p className="text-xs text-slate-500">Lead Instructor • Mathematics</p>
                      <span className="text-[10px] text-emerald-600 font-medium">Available for appointments</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Classroom:</span>
                      <span className="font-semibold text-slate-700">Room 204 (Science Wing)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Office Hours:</span>
                      <span className="font-semibold text-slate-700">Tue & Thu 3:30 - 4:30 PM</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('requests');
                    setShowRequestModal(true);
                  }}
                  className="w-full mt-4 py-2.5 px-4 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Request Teacher Consultation
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>FERPA Enforced Access</span>
                <span>Term 2</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMICS & REPORT CARDS */}
      {activeTab === 'academics' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Academic Performance & Grade Records
              </h3>
              <p className="text-xs text-slate-500">
                Official marks for {selectedChild?.firstName} {selectedChild?.lastName} (Academic Year 2024–2025)
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download Official Report Card (PDF)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold">Term 2 Verified Marks & Grade Point Average</span>
              <span className="font-mono font-bold text-indigo-700">Cumulative GPA: 3.85</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Examination</th>
                    <th className="py-3 px-4">Marks Obtained</th>
                    <th className="py-3 px-4">Letter Grade</th>
                    <th className="py-3 px-4">GPA</th>
                    <th className="py-3 px-4">Faculty Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {examResults.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-semibold text-slate-900">{res.subject}</td>
                      <td className="py-3 px-4 text-slate-600">{res.examName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {res.marksObtained} / {res.totalMarks}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            res.grade.startsWith('A')
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {res.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{res.gpa.toFixed(1)}</td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                        "{res.remarks || 'Outstanding dedication and classroom engagement'}"
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE HISTORY */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">
              Attendance Roster & Punctuality Tracker
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Verified daily gate check-ins and homeroom attendance records.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase font-semibold block">Total Academic Days</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">64</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] text-emerald-700 uppercase font-semibold block">Days Present</span>
                <span className="text-2xl font-bold text-emerald-800 mt-1 block">62</span>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <span className="text-[11px] text-red-700 uppercase font-semibold block">Excused Leaves</span>
                <span className="text-2xl font-bold text-red-800 mt-1 block">2</span>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                <span className="text-[11px] text-indigo-700 uppercase font-semibold block">Compliance Rate</span>
                <span className="text-2xl font-bold text-indigo-800 mt-1 block">
                  {selectedChild?.attendancePercentage}%
                </span>
              </div>
            </div>

            {/* Attendance Days List */}
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {[
                { date: 'Today, Mar 4, 2025', status: 'Present', time: '08:15 AM', remark: 'On time' },
                { date: 'Monday, Mar 3, 2025', status: 'Present', time: '08:12 AM', remark: 'On time' },
                { date: 'Friday, Feb 28, 2025', status: 'Present', time: '08:18 AM', remark: 'On time' },
                { date: 'Thursday, Feb 27, 2025', status: 'Late', time: '08:42 AM', remark: 'School bus traffic delay (Excused)' },
                { date: 'Wednesday, Feb 26, 2025', status: 'Present', time: '08:10 AM', remark: 'On time' },
                { date: 'Tuesday, Feb 25, 2025', status: 'Present', time: '08:14 AM', remark: 'On time' },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.status === 'Present' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    ></span>
                    <div>
                      <div className="font-semibold text-slate-800">{item.date}</div>
                      <div className="text-[11px] text-slate-400">{item.remark}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500">{item.time}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.status === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FEES & INVOICES */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Annual Billed Tuition</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">$8,500.00</div>
              <div className="text-xs text-slate-400 mt-1">Class 6 Full Academic Year</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Settled Payments</span>
              <div className="text-2xl font-bold text-emerald-700 mt-2">$7,300.00</div>
              <div className="text-xs text-emerald-600 mt-1">Verified bank transfer receipts</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Outstanding Balance</span>
              <div className="text-2xl font-bold text-amber-600 mt-2">$1,200.00</div>
              <div className="text-xs text-amber-700 mt-1">Due before Term 3 start</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold">Invoices & Financial Statements</span>
              <span>Encrypted Payment Processing</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {childFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{fee.id}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{fee.title}</span>
                        <span className="text-[11px] text-slate-400">{fee.category} Fee</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{fee.dueDate}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ${fee.amount.toLocaleString()}.00
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            fee.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : fee.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {fee.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {fee.status === 'Paid' ? (
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedFeeForPayment(fee)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1 shadow-2xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Pay Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: HOMEWORK */}
      {activeTab === 'homework' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">
              Active Coursework & Homework Monitor
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Track assigned exercises, due dates, and completion status for {selectedChild?.firstName}.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {homework.map((hw) => (
                <div
                  key={hw.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {hw.subject}
                      </span>
                      <span className="text-xs font-bold text-red-600">Due: {hw.dueDate}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-1">{hw.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">{hw.description}</p>

                    {hw.attachment && (
                      <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs text-slate-600 mb-3">
                        <span className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{hw.attachment}</span>
                        </span>
                        <span className="text-[10px] text-indigo-600 font-semibold shrink-0 cursor-pointer">
                          View
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                    <span>Assigned by: {hw.assignedBy}</span>
                    <span className="font-semibold text-emerald-700">Verified by Faculty</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PARENT HELPDESK & REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Parent Support Desk & Leave Requests
              </h3>
              <p className="text-xs text-slate-500">
                Submit tickets for leaves, fee questions, bus changes, or faculty appointments.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRequestModal(true)}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm self-start"
            >
              <Plus className="w-4 h-4" />
              New Support Request
            </button>
          </div>

          <div className="space-y-4">
            {requests.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {ticket.ticketNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {ticket.category.replace('_', ' ')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ticket.priority === 'HIGH' || ticket.priority === 'URGENT'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      ticket.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ticket.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-1">{ticket.subject}</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{ticket.description}</p>

                {/* Responses thread */}
                {ticket.responses && ticket.responses.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 mb-3">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Administration Responses:
                    </div>
                    {ticket.responses.map((resp) => (
                      <div key={resp.id} className="text-xs border-l-2 border-indigo-500 pl-3 py-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span className="font-bold text-slate-700">
                            {resp.author} ({resp.role})
                          </span>
                          <span>{resp.timestamp}</span>
                        </div>
                        <p className="text-slate-600">{resp.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>Student: {ticket.studentName}</span>
                  <span>Submitted: {ticket.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW SUPPORT REQUEST MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">
              Submit Parent Helpdesk Ticket
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Your inquiry will be routed to the respective administrative or faculty department.
            </p>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Request Category
                  </label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="LEAVE_APPLICATION">Leave / Absence Notification</option>
                    <option value="FEE_QUERY">Bursar & Fee Query</option>
                    <option value="ACADEMIC_CONCERN">Academic / Teacher Meeting</option>
                    <option value="TRANSPORTATION">Bus / Transport Modification</option>
                    <option value="GENERAL_FEEDBACK">General Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={reqPriority}
                    onChange={(e) => setReqPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Normal / Medium</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent (Medical / Emergency)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Subject Headline
                </label>
                <input
                  type="text"
                  required
                  value={reqSubject}
                  onChange={(e) => setReqSubject(e.target.value)}
                  placeholder="e.g. 2-Day Absence Notice due to Family Event"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Details / Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={reqMessage}
                  onChange={(e) => setReqMessage(e.target.value)}
                  placeholder="Provide dates, reasons, doctor's notes, or details..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONLINE PAYMENT MODAL */}
      {selectedFeeForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">
              Online Fee Settlement
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Instant credit card or bank transfer gateway simulation.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-mono font-bold text-slate-800">{selectedFeeForPayment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Item:</span>
                <span className="font-semibold text-slate-800">{selectedFeeForPayment.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-semibold text-slate-800">
                  {selectedChild?.firstName} {selectedChild?.lastName}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-800">Total Payable:</span>
                <span className="font-mono font-bold text-emerald-700">
                  ${selectedFeeForPayment.amount.toLocaleString()}.00
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">Card Number</label>
                <input
                  type="text"
                  readOnly
                  value="•••• •••• •••• 4242"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono text-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">Expires</label>
                  <input
                    type="text"
                    readOnly
                    value="12/28"
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">CVC</label>
                  <input
                    type="text"
                    readOnly
                    value="•••"
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedFeeForPayment(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={() => handleSimulatePayment(selectedFeeForPayment)}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1.5"
              >
                {isProcessingPayment ? 'Processing Transaction...' : 'Confirm & Authorize Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
