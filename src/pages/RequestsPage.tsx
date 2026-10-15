import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  User,
  Building,
  ArrowRight,
  Shield,
  Calendar,
  Send,
  Lock,
  ChevronRight,
  UserCheck,
  RefreshCw,
  FileText,
  Tag,
  Download,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { requestService } from '../services/requestService';
import { staffService } from '../services/staffService';
import { timetableService } from '../services/timetableService';
import { dataService } from '../services/dataService';
import {
  RequestTicket,
  RequestStatus,
  RequestPriority,
  RequestCategory,
  RequesterRole,
  RequestCategoryCode,
} from '../types/request';

export const RequestsPage: React.FC = () => {
  const { currentUser, can } = useAuth();

  // State
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'my' | 'assigned' | 'pending' | 'overdue'
  >('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // New Request Form State
  const [newCategoryCode, setNewCategoryCode] = useState<RequestCategoryCode>('STUDENT_LEAVE');
  const [newSubject, setNewSubject] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newPriority, setNewPriority] = useState<RequestPriority>('MEDIUM');
  const [newStudentId, setNewStudentId] = useState<string>('');
  const [leaveFrom, setLeaveFrom] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaveTo, setLeaveTo] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState<string>('');

  // Comment & Resolution State inside Drawer
  const [commentText, setCommentText] = useState<string>('');
  const [isInternalComment, setIsInternalComment] = useState<boolean>(false);
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [selectedCoverTeacherId, setSelectedCoverTeacherId] = useState<string>('');
  const [activeDrawerTab, setActiveDrawerTab] = useState<'comments' | 'audit'>('comments');

  // Data fetching
  const metrics = requestService.getDashboardMetrics();
  const categories = requestService.getCategories();
  const allTickets = requestService.getRequests(currentUser);
  const staffList = staffService.getAllStaff();
  const teachers = dataService.getTeachers();
  const students = dataService.getStudents();

  // Permissions
  const canManageAllRequests =
    can('requests.manage') ||
    ['super_admin', 'principal', 'admin_staff', 'accountant'].includes(currentUser.role);
  const canAssignStaff =
    can('requests.assign') || ['super_admin', 'principal'].includes(currentUser.role);

  // Selected ticket from ID
  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return requestService.getRequestById(selectedTicketId) || null;
  }, [selectedTicketId, allTickets]);

  const comments = useMemo(() => {
    if (!selectedTicket) return [];
    return requestService.getComments(selectedTicket.id, currentUser);
  }, [selectedTicket, currentUser]);

  const history = useMemo(() => {
    if (!selectedTicket) return [];
    return requestService.getStatusHistory(selectedTicket.id);
  }, [selectedTicket]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return allTickets.filter((ticket) => {
      const isOverdue = requestService.getSLAStatus(ticket) === 'OVERDUE';

      // Tab Filter
      if (activeFilter === 'my' && ticket.requesterUserId !== currentUser.id) return false;
      if (activeFilter === 'assigned' && ticket.assignedToStaffId !== currentUser.id) return false;
      if (
        activeFilter === 'pending' &&
        !['NEW', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER'].includes(ticket.status)
      )
        return false;
      if (activeFilter === 'overdue' && !isOverdue) return false;

      // Category
      if (selectedCategory !== 'ALL' && ticket.categoryCode !== selectedCategory) return false;

      // Priority
      if (selectedPriority !== 'ALL' && ticket.priority !== selectedPriority) return false;

      // Status
      if (selectedStatus !== 'ALL' && ticket.status !== selectedStatus) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = ticket.requestNumber.toLowerCase().includes(q);
        const matchSub = ticket.subject.toLowerCase().includes(q);
        const matchReq = ticket.requesterName.toLowerCase().includes(q);
        const matchDesc = ticket.description.toLowerCase().includes(q);
        if (!matchNum && !matchSub && !matchReq && !matchDesc) return false;
      }

      return true;
    });
  }, [
    allTickets,
    activeFilter,
    selectedCategory,
    selectedPriority,
    selectedStatus,
    searchQuery,
    currentUser.id,
  ]);

  // Selected Category SLA details
  const currentCategoryObj = categories.find((c) => c.code === newCategoryCode);

  // Map user role to RequesterRole
  const mapRoleToRequester = (role: string): RequesterRole => {
    if (role === 'parent') return 'Parent';
    if (role === 'teacher') return 'Teacher';
    if (role === 'student') return 'Student';
    if (role === 'super_admin' || role === 'principal') return 'Admin';
    return 'Staff';
  };

  // Handlers
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;

    const studentObj = students.find((s) => s.id === newStudentId);
    const catObj = categories.find((c) => c.code === newCategoryCode) || categories[0];

    const isLeave = newCategoryCode === 'STUDENT_LEAVE' || newCategoryCode === 'TEACHER_LEAVE';
    const dayDiff = Math.max(
      1,
      Math.ceil(
        (new Date(leaveTo).getTime() - new Date(leaveFrom).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );

    const created = requestService.createRequest(
      {
        schoolId: 'SCH-001',
        categoryId: catObj.id,
        categoryCode: catObj.code,
        categoryName: catObj.name,
        subject: newSubject,
        description: newDescription,
        priority: newPriority,
        requesterUserId: currentUser.id,
        requesterName: currentUser.name,
        requesterRole: mapRoleToRequester(currentUser.role),
        requesterEmail: currentUser.email,
        studentId: studentObj ? studentObj.id : undefined,
        studentName: studentObj ? `${studentObj.firstName} ${studentObj.lastName}` : undefined,
        leaveDetails: isLeave
          ? {
              fromDate: leaveFrom,
              toDate: leaveTo,
              numberOfDays: dayDiff,
              reason: leaveReason || newDescription,
            }
          : undefined,
      },
      currentUser
    );

    setIsCreateModalOpen(false);
    setSelectedTicketId(created.id);
    setNewSubject('');
    setNewDescription('');
    setLeaveReason('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !commentText.trim()) return;

    requestService.addComment(
      selectedTicket.id,
      commentText,
      isInternalComment ? 'INTERNAL_NOTE' : 'PUBLIC_COMMENT',
      currentUser
    );
    setCommentText('');
  };

  const handleUpdateStatus = (newStatus: RequestStatus) => {
    if (!selectedTicket) return;

    requestService.updateRequestStatus(
      selectedTicket.id,
      newStatus,
      resolutionSummary || `Ticket transitioned to ${newStatus}`,
      resolutionSummary,
      currentUser
    );

    // If teacher leave cover substitution is set
    if (
      selectedCoverTeacherId &&
      selectedTicket.categoryCode === 'TEACHER_LEAVE' &&
      newStatus === 'RESOLVED'
    ) {
      const coverTeacher = teachers.find((t) => t.id === selectedCoverTeacherId);
      if (coverTeacher) {
        requestService.assignSubstituteTeacher(
          selectedTicket.id,
          coverTeacher.id,
          coverTeacher.name,
          'PER-01',
          'Period 1',
          'CLS-001',
          'Grade 10',
          'SEC-001',
          'Section A',
          'SUB-01',
          'Mathematics',
          'RM-101',
          'Room 101',
          currentUser
        );
      }
    }

    setResolutionSummary('');
  };

  const handleAssignTicket = (userId: string) => {
    if (!selectedTicket) return;
    const staff = staffList.find((s) => s.userId === userId || s.id === userId);
    if (!staff) return;

    requestService.assignRequest(
      selectedTicket.id,
      staff.userId || staff.id,
      `${staff.firstName} ${staff.lastName}`,
      staff.departmentId,
      staff.departmentName,
      currentUser
    );
  };

  const handleExportCSV = () => {
    const headers = [
      'Ticket Number',
      'Category',
      'Subject',
      'Priority',
      'Status',
      'Requester Name',
      'Role',
      'Assigned Staff',
      'Due Date',
      'SLA Status',
    ];
    const rows = filteredTickets.map((t) => [
      t.requestNumber,
      t.categoryCode,
      `"${t.subject.replace(/"/g, '""')}"`,
      t.priority,
      t.status,
      `"${t.requesterName}"`,
      t.requesterRole,
      `"${t.assignedToStaffName || 'Unassigned'}"`,
      t.dueDate,
      requestService.getSLAStatus(t),
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Requests_Tickets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & KPI Summary */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <HelpCircle className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                Helpdesk, Inquiries & Leave Requests
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Integrated ticketing pipeline for student leave excuses, faculty cover requests, fee appeals, and support inquiries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Tickets CSV</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Request / Leave</span>
            </button>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/70">
            <span className="text-[11px] text-slate-400 font-medium">Total Tickets</span>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{metrics.total}</p>
            <span className="text-[10px] text-slate-500">Across all categories</span>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/70">
            <span className="text-[11px] text-slate-400 font-medium">New / Unassigned</span>
            <p className="text-xl font-bold text-indigo-400 mt-0.5">{metrics.newCount + metrics.openCount}</p>
            <span className="text-[10px] text-slate-500">Requires triage</span>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/70">
            <span className="text-[11px] text-slate-400 font-medium">In Progress</span>
            <p className="text-xl font-bold text-amber-400 mt-0.5">{metrics.inProgressCount}</p>
            <span className="text-[10px] text-slate-500">Active coordination</span>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/70">
            <span className="text-[11px] text-slate-400 font-medium">Awaiting Input</span>
            <p className="text-xl font-bold text-purple-400 mt-0.5">{metrics.waitingCount}</p>
            <span className="text-[10px] text-slate-500">Pending user</span>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/70">
            <span className="text-[11px] text-slate-400 font-medium">Resolved</span>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{metrics.resolvedCount}</p>
            <span className="text-[10px] text-slate-500">Successfully closed</span>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/70">
            <span className="text-[11px] text-slate-400 font-medium">Overdue SLA</span>
            <p className="text-xl font-bold text-rose-400 mt-0.5">{metrics.overdueCount}</p>
            <span className="text-[10px] text-slate-500">Breached resolution target</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filters & Ticket List (7 or 12 cols depending on drawer) */}
        <div className={`${selectedTicket ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
          {/* Quick Filter Tabs Bar */}
          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Tickets ({allTickets.length})
              </button>

              <button
                onClick={() => setActiveFilter('my')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeFilter === 'my'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                My Requests
              </button>

              {canManageAllRequests && (
                <button
                  onClick={() => setActiveFilter('assigned')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    activeFilter === 'assigned'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Assigned to Me
                </button>
              )}

              <button
                onClick={() => setActiveFilter('pending')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeFilter === 'pending'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pending Action ({metrics.newCount + metrics.openCount + metrics.inProgressCount})
              </button>

              <button
                onClick={() => setActiveFilter('overdue')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeFilter === 'overdue'
                    ? 'bg-rose-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                Overdue SLA ({metrics.overdueCount})
              </button>
            </div>
          </div>

          {/* Secondary Filter Dropdowns & Search */}
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ticket #, subject, requester..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_USER">Waiting for User</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Ticket Listing */}
          <div className="space-y-2.5">
            {filteredTickets.map((ticket) => {
              const isSelected = selectedTicket?.id === ticket.id;
              const isOverdue = requestService.getSLAStatus(ticket) === 'OVERDUE';

              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-400">
                        {ticket.requestNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium border border-slate-700/60">
                        {ticket.categoryName}
                      </span>
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 text-[10px] font-bold border border-rose-800/60 animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Overdue SLA</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          ticket.priority === 'URGENT'
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            : ticket.priority === 'HIGH'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {ticket.priority}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                            : ticket.status === 'IN_PROGRESS' || ticket.status === 'ASSIGNED'
                            ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
                            : ticket.status === 'REJECTED'
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                        }`}
                      >
                        {ticket.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100">{ticket.subject}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{ticket.description}</p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>
                        From: <strong className="text-slate-300">{ticket.requesterName}</strong> (
                        {ticket.requesterRole})
                      </span>
                      {ticket.assignedToStaffName && (
                        <span>
                          Assigned: <strong className="text-indigo-300">{ticket.assignedToStaffName}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>Due: {ticket.dueDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTickets.length === 0 && (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
                <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-300">No tickets found</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust filters or create a new helpdesk request above.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ticket Detail Drawer */}
        {selectedTicket && (
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col justify-between max-h-[850px] overflow-y-auto">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      {selectedTicket.requestNumber}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-300 font-medium">
                      {selectedTicket.categoryName}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-1">
                    {selectedTicket.subject}
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* Requester & SLA Metadata */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Requester:</span>
                  <strong className="text-slate-200">
                    {selectedTicket.requesterName} ({selectedTicket.requesterRole})
                  </strong>
                </div>

                {selectedTicket.studentName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Student Profile:</span>
                    <strong className="text-indigo-300">{selectedTicket.studentName}</strong>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Coordinator:</span>
                  <strong className="text-slate-200">
                    {selectedTicket.assignedToStaffName
                      ? `${selectedTicket.assignedToStaffName} (${selectedTicket.assignedDepartmentName || 'Department'})`
                      : 'Unassigned'}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Resolution SLA Due Date:</span>
                  <span
                    className={`font-mono font-medium ${
                      requestService.getSLAStatus(selectedTicket) === 'OVERDUE'
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedTicket.dueDate} ({requestService.getSLAStatus(selectedTicket)})
                  </span>
                </div>

                {selectedTicket.leaveDetails && (
                  <div className="pt-2 border-t border-slate-800 text-slate-300">
                    <span className="font-semibold text-indigo-300 block mb-1">
                      Leave Schedule Requested:
                    </span>
                    <p className="font-mono text-xs">
                      {selectedTicket.leaveDetails.fromDate} to {selectedTicket.leaveDetails.toDate} (
                      {selectedTicket.leaveDetails.numberOfDays} days)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Reason: {selectedTicket.leaveDetails.reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Full Description */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Request Statement
                </span>
                <p className="text-xs text-slate-200 p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Status Transition Actions */}
              {canManageAllRequests && (
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                  <span className="text-xs font-semibold text-slate-400 block">
                    Workflow Decisions & Actions
                  </span>

                  {/* Assign Staff dropdown */}
                  {canAssignStaff && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 shrink-0">Assign Staff:</span>
                      <select
                        onChange={(e) => handleAssignTicket(e.target.value)}
                        defaultValue={selectedTicket.assignedToStaffId || ''}
                        className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 flex-1"
                      >
                        <option value="" disabled>
                          Select Staff Member...
                        </option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.userId || s.id}>
                            {s.firstName} {s.lastName} ({s.departmentName})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* If Teacher Leave: show Cover Teacher Selector */}
                  {selectedTicket.categoryCode === 'TEACHER_LEAVE' && (
                    <div className="p-2 rounded bg-indigo-950/40 border border-indigo-800/50 space-y-1 text-xs">
                      <span className="text-indigo-300 font-semibold block">
                        Class Cover Assignment:
                      </span>
                      <select
                        value={selectedCoverTeacherId}
                        onChange={(e) => setSelectedCoverTeacherId(e.target.value)}
                        className="w-full bg-slate-900 border border-indigo-700/60 rounded px-2 py-1 text-xs text-slate-200"
                      >
                        <option value="">Select Cover Faculty Teacher...</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.department})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Resolution Summary input */}
                  <div>
                    <input
                      type="text"
                      placeholder="Resolution / Decision summary..."
                      value={resolutionSummary}
                      onChange={(e) => setResolutionSummary(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Status Decision Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
                    {selectedTicket.status === 'NEW' && (
                      <button
                        onClick={() => handleUpdateStatus('OPEN')}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
                      >
                        Acknowledge (Open)
                      </button>
                    )}

                    {['NEW', 'OPEN', 'ASSIGNED', 'WAITING_FOR_USER'].includes(
                      selectedTicket.status
                    ) && (
                      <button
                        onClick={() => handleUpdateStatus('IN_PROGRESS')}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                      >
                        Mark In Progress
                      </button>
                    )}

                    {selectedTicket.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateStatus('WAITING_FOR_USER')}
                        className="px-2.5 py-1 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-medium"
                      >
                        Request More Info
                      </button>
                    )}

                    {['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER'].includes(
                      selectedTicket.status
                    ) && (
                      <button
                        onClick={() => handleUpdateStatus('RESOLVED')}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow"
                      >
                        Resolve & Approve
                      </button>
                    )}

                    {selectedTicket.status === 'RESOLVED' && (
                      <button
                        onClick={() => handleUpdateStatus('CLOSED')}
                        className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium"
                      >
                        Formally Close
                      </button>
                    )}

                    {selectedTicket.status !== 'REJECTED' &&
                      selectedTicket.status !== 'CLOSED' && (
                        <button
                          onClick={() => handleUpdateStatus('REJECTED')}
                          className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-medium border border-rose-800/60"
                        >
                          Reject
                        </button>
                      )}
                  </div>
                </div>
              )}

              {/* Drawer Tabs: Conversation vs Audit Trail */}
              <div className="flex items-center gap-4 border-b border-slate-800 pt-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveDrawerTab('comments')}
                  className={`pb-2 transition-colors border-b-2 ${
                    activeDrawerTab === 'comments'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Activity & Discussion ({comments.length})
                </button>
                <button
                  onClick={() => setActiveDrawerTab('audit')}
                  className={`pb-2 transition-colors border-b-2 ${
                    activeDrawerTab === 'audit'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Audit Trail ({history.length})
                </button>
              </div>

              {/* Comments Thread */}
              {activeDrawerTab === 'comments' && (
                <div className="space-y-3">
                  <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-lg text-xs space-y-1 ${
                          c.type === 'INTERNAL_NOTE'
                            ? 'bg-amber-950/30 border border-amber-600/40 text-amber-200'
                            : 'bg-slate-950/50 border border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            {c.authorName} ({c.authorRole})
                            {c.type === 'INTERNAL_NOTE' && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                                Internal Staff Note
                              </span>
                            )}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {new Date(c.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="leading-relaxed">{c.content}</p>
                      </div>
                    ))}

                    {comments.length === 0 && (
                      <p className="text-xs text-slate-500 italic text-center py-4">
                        No comments recorded yet.
                      </p>
                    )}
                  </div>

                  {/* Add Comment Input Form */}
                  <form onSubmit={handleAddComment} className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-slate-400">Post Reply or Note:</label>
                      {canManageAllRequests && (
                        <label className="flex items-center gap-1.5 text-amber-400 cursor-pointer font-medium text-[11px]">
                          <input
                            type="checkbox"
                            checked={isInternalComment}
                            onChange={(e) => setIsInternalComment(e.target.checked)}
                            className="rounded bg-slate-900 border-amber-600/60 text-indigo-600 focus:ring-0"
                          />
                          <span>Internal Staff Note (Confidential)</span>
                        </label>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={
                          isInternalComment
                            ? 'Add internal coordination note...'
                            : 'Reply to requester...'
                        }
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Audit Trail Tab */}
              {activeDrawerTab === 'audit' && (
                <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-indigo-400">
                          {h.previousStatus} ➔ {h.newStatus}
                        </span>
                        <span className="font-mono text-slate-500 text-[10px]">
                          {new Date(h.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs">{h.reason}</p>
                      <span className="text-[10px] text-slate-500 block">
                        Actor: {h.changedByName} ({h.changedByRole})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CREATE NEW REQUEST / LEAVE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Submit Helpdesk Inquiry or Leave Application
                </h3>
                <p className="text-xs text-slate-400">
                  Categorized request routed directly to responsible academic or bursar coordinators.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Request Category</label>
                <select
                  value={newCategoryCode}
                  onChange={(e) => setNewCategoryCode(e.target.value as RequestCategoryCode)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.name} (SLA: {c.slaBusinessDays} days)
                    </option>
                  ))}
                </select>

                {currentCategoryObj && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {currentCategoryObj.description} • SLA: {currentCategoryObj.slaBusinessDays} business days
                  </p>
                )}
              </div>

              {/* If Student Leave: Select Student Context */}
              {newCategoryCode === 'STUDENT_LEAVE' && (
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Student Profile</label>
                  <select
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                  >
                    <option value="">Select Student...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.className})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* If Leave Category: Dates Pickers */}
              {(newCategoryCode === 'STUDENT_LEAVE' || newCategoryCode === 'TEACHER_LEAVE') && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                  <span className="font-semibold text-indigo-300 block">
                    Leave Duration & Formal Reason
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">From Date</label>
                      <input
                        type="date"
                        required
                        value={leaveFrom}
                        onChange={(e) => setLeaveFrom(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">To Date</label>
                      <input
                        type="date"
                        required
                        value={leaveTo}
                        onChange={(e) => setLeaveTo(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Reason for Leave</label>
                    <input
                      type="text"
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="e.g. Medical doctor consultation, Family emergency"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Subject Title</label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. 3-day medical leave for dental procedure"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as RequestPriority)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Full Details / Explanation
                </label>
                <textarea
                  required
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide comprehensive details, relevant contact info, or background history..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium text-white shadow-lg shadow-indigo-600/20"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
