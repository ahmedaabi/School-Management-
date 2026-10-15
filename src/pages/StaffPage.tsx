import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  CalendarCheck,
  FileText,
  Award,
  DollarSign,
  Bell,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Briefcase,
  Shield,
  Eye,
  Edit2,
  Trash2,
  Building,
  Mail,
  Phone,
  Calendar,
  Lock,
  Star,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { staffService } from '../services/staffService';
import {
  Staff,
  StaffAttendance,
  StaffLeave,
  StaffDocument,
  StaffPerformance,
  PayrollProfile,
  StaffAnnouncement,
  Department,
  Designation,
  StaffAttendanceStatus,
} from '../types/staff';

export const StaffPage: React.FC = () => {
  const { currentUser, can } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'directory' | 'attendance' | 'leaves' | 'documents' | 'performance' | 'payroll' | 'announcements'
  >('directory');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRoleType, setSelectedRoleType] = useState<'ALL' | 'TEACHING' | 'NON_TEACHING'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  // Attendance Date
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isReviewLeaveModalOpen, setIsReviewLeaveModalOpen] = useState(false);
  const [reviewingLeave, setReviewingLeave] = useState<StaffLeave | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isPerfModalOpen, setIsPerfModalOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [selectedPayrollStaff, setSelectedPayrollStaff] = useState<Staff | null>(null);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  // Data fetching
  const stats = staffService.getHRDashboardStats();
  const allStaff = staffService.getAllStaff();
  const departments = staffService.getDepartments();
  const designations = staffService.getDesignations();
  const attendanceList = staffService.getAttendance(attendanceDate);
  const leaves = staffService.getLeaves();
  const documents = staffService.getDocuments();
  const performances = staffService.getPerformances();
  const announcements = staffService.getAnnouncements();

  // Permission Checks
  const canCreateStaff =
    can('staff.create') || currentUser.role === 'principal' || currentUser.role === 'super_admin';
  const canEditStaff =
    can('staff.edit') || currentUser.role === 'principal' || currentUser.role === 'super_admin';
  const canViewPayroll =
    can('staff.salary.view') ||
    ['super_admin', 'principal', 'accountant'].includes(currentUser.role);
  const canManagePayroll =
    can('staff.salary.manage') ||
    ['super_admin', 'principal', 'accountant'].includes(currentUser.role);
  const canReviewLeaves =
    can('staff.leave.approve') ||
    ['super_admin', 'principal'].includes(currentUser.role);

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    return allStaff.filter((s) => {
      const matchSearch =
        searchQuery === '' ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.designationTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDept = selectedDept === 'ALL' || s.departmentId === selectedDept;
      const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
      const matchType =
        selectedRoleType === 'ALL' ||
        (selectedRoleType === 'TEACHING' && s.isTeachingStaff) ||
        (selectedRoleType === 'NON_TEACHING' && !s.isTeachingStaff);

      return matchSearch && matchDept && matchStatus && matchType;
    });
  }, [allStaff, searchQuery, selectedDept, selectedStatus, selectedRoleType]);

  // Handlers
  const handleExportCSV = () => {
    const headers = [
      'Employee ID',
      'Name',
      'Email',
      'Phone',
      'Department',
      'Designation',
      'Employment Type',
      'Status',
      'Joining Date',
      'Teaching Role',
    ];
    const rows = filteredStaff.map((s) => [
      s.employeeId,
      `"${s.firstName} ${s.lastName}"`,
      s.email,
      s.phone,
      `"${s.departmentName}"`,
      `"${s.designationTitle}"`,
      s.employmentType,
      s.status,
      s.joiningDate,
      s.isTeachingStaff ? 'Yes' : 'No',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Staff_Directory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleQuickAttendance = (staff: Staff, status: StaffAttendanceStatus) => {
    staffService.recordAttendance(
      {
        schoolId: 'SCH-001',
        staffId: staff.id,
        staffName: `${staff.firstName} ${staff.lastName}`,
        employeeId: staff.employeeId,
        departmentId: staff.departmentId,
        departmentName: staff.departmentName,
        date: attendanceDate,
        status,
        checkInTime: status === 'PRESENT' ? '07:45' : undefined,
        remarks: status === 'PRESENT' ? 'Normal daily check-in' : `${status} recorded`,
        recordedBy: currentUser.name,
      },
      currentUser
    );
    setActiveTab((p) => p);
  };

  const handleReviewLeaveSubmit = (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewingLeave) return;
    try {
      staffService.reviewLeaveRequest(reviewingLeave.id, status, reviewComments, currentUser);
      setIsReviewLeaveModalOpen(false);
      setReviewingLeave(null);
      setReviewComments('');
      setActiveTab((p) => p);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & KPI Summary */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Briefcase className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                Staff & Human Resources Management
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Faculty roster, attendance tracking, leave requests, credential auditing, performance appraisals, and payroll structures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Roster CSV</span>
            </button>

            {canCreateStaff && (
              <button
                onClick={() => {
                  setEditingStaff(null);
                  setIsStaffModalOpen(true);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
              >
                <UserPlus className="w-4 h-4" />
                <span>Onboard Staff Member</span>
              </button>
            )}
          </div>
        </div>

        {/* HR KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/70">
            <span className="text-[11px] text-slate-400 font-medium">Total Staff</span>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{stats.totalStaff}</p>
            <span className="text-[10px] text-slate-500">Active personnel</span>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/70">
            <span className="text-[11px] text-slate-400 font-medium">Teaching Faculty</span>
            <p className="text-xl font-bold text-indigo-400 mt-0.5">{stats.teachersCount}</p>
            <span className="text-[10px] text-slate-500">{stats.nonTeachingCount} non-teaching</span>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/70">
            <span className="text-[11px] text-slate-400 font-medium">Today's Attendance</span>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">
              {stats.attendancePercentage}%
            </p>
            <span className="text-[10px] text-slate-500">{stats.presentToday} checked in</span>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/70">
            <span className="text-[11px] text-slate-400 font-medium">On Leave Today</span>
            <p className="text-xl font-bold text-amber-400 mt-0.5">{stats.onLeaveCount}</p>
            <span className="text-[10px] text-slate-500">Approved leaves</span>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/70">
            <span className="text-[11px] text-slate-400 font-medium">Pending Leaves</span>
            <p className="text-xl font-bold text-rose-400 mt-0.5">{stats.pendingLeaves}</p>
            <span className="text-[10px] text-slate-500">Awaiting approval</span>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/70">
            <span className="text-[11px] text-slate-400 font-medium">Document Alerts</span>
            <p className="text-xl font-bold text-amber-300 mt-0.5">{stats.expiringDocs}</p>
            <span className="text-[10px] text-slate-500">Expiring or expired</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'directory'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Daily Attendance Register</span>
          </button>

          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'leaves'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Leave Applications</span>
            {stats.pendingLeaves > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                {stats.pendingLeaves}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'documents'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Compliance & Documents</span>
            {stats.expiringDocs > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                {stats.expiringDocs}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('performance')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'performance'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Appraisals & Reviews</span>
          </button>

          {canViewPayroll && (
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'payroll'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Payroll Profiles</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 text-[9px] font-semibold border border-amber-700/50">
                Confidential
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Staff Bulletins ({announcements.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search staff by name, ID, designation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>

              <select
                value={selectedRoleType}
                onChange={(e) => setSelectedRoleType(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">All Faculty Types</option>
                <option value="TEACHING">Teaching Staff</option>
                <option value="NON_TEACHING">Non-Teaching Staff</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="RESIGNED">Resigned</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setViewLayout('grid')}
                className={`px-2 py-1 rounded transition-colors ${
                  viewLayout === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewLayout('table')}
                className={`px-2 py-1 rounded transition-colors ${
                  viewLayout === 'table' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                Table
              </button>
            </div>
          </div>

          {/* Cards View */}
          {viewLayout === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-5 rounded-xl transition-all shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-3.5 mb-3">
                      <img
                        src={staff.profilePhoto}
                        alt={`${staff.firstName} ${staff.lastName}`}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0 bg-slate-800"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            {staff.employeeId}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              staff.status === 'ACTIVE'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                                : staff.status === 'ON_LEAVE'
                                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                                : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            }`}
                          >
                            {staff.status}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-100 truncate">
                          {staff.firstName} {staff.lastName}
                        </h4>
                        <p className="text-xs text-indigo-300 font-medium truncate">
                          {staff.designationTitle}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{staff.departmentName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{staff.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{staff.phone}</span>
                      </div>
                      {staff.isTeachingStaff && staff.subjects && (
                        <div className="pt-1.5 flex flex-wrap gap-1">
                          {staff.subjects.map((sub, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700/60"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      Joined {new Date(staff.joiningDate).toLocaleDateString()}
                    </span>

                    {canEditStaff && (
                      <button
                        onClick={() => {
                          setEditingStaff(staff);
                          setIsStaffModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Employee ID</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                      {canEditStaff && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={staff.profilePhoto}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-lg object-cover bg-slate-800"
                            />
                            <div>
                              <div className="font-semibold text-slate-200">
                                {staff.firstName} {staff.lastName}
                              </div>
                              <div className="text-[11px] text-slate-400">{staff.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                          {staff.employeeId}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{staff.departmentName}</td>
                        <td className="py-3 px-4 text-indigo-300">{staff.designationTitle}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {staff.isTeachingStaff ? 'Teaching Faculty' : 'Non-Teaching'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              staff.status === 'ACTIVE'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                                : staff.status === 'ON_LEAVE'
                                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                                : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            }`}
                          >
                            {staff.status}
                          </span>
                        </td>
                        {canEditStaff && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setEditingStaff(staff);
                                setIsStaffModalOpen(true);
                              }}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DAILY ATTENDANCE REGISTER */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Select Attendance Date:</span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Mark all unrecorded as Present:</span>
              <button
                onClick={() => {
                  allStaff.forEach((s) => {
                    const hasRecord = attendanceList.some((a) => a.staffId === s.id);
                    if (!hasRecord) {
                      handleQuickAttendance(s, 'PRESENT');
                    }
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
              >
                Mark Bulk Present
              </button>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Status Today</th>
                    <th className="py-3 px-4">Check-In</th>
                    <th className="py-3 px-4 text-right">Quick Mark Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {allStaff.map((staff) => {
                    const record = attendanceList.find((a) => a.staffId === staff.id);
                    const status = record?.status || 'UNMARKED';

                    return (
                      <tr key={staff.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">
                            {staff.firstName} {staff.lastName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {staff.employeeId}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{staff.departmentName}</td>
                        <td className="py-3 px-4 text-slate-400">{staff.designationTitle}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              status === 'PRESENT'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                                : status === 'ABSENT'
                                ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                                : status === 'LATE'
                                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                                : status === 'LEAVE'
                                ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {record?.checkInTime || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex rounded-lg border border-slate-700 overflow-hidden text-[11px]">
                            <button
                              onClick={() => handleQuickAttendance(staff, 'PRESENT')}
                              className={`px-2.5 py-1 ${
                                status === 'PRESENT'
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleQuickAttendance(staff, 'LATE')}
                              className={`px-2.5 py-1 border-l border-slate-700 ${
                                status === 'LATE'
                                  ? 'bg-amber-600 text-white font-bold'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              Late
                            </button>
                            <button
                              onClick={() => handleQuickAttendance(staff, 'ABSENT')}
                              className={`px-2.5 py-1 border-l border-slate-700 ${
                                status === 'ABSENT'
                                  ? 'bg-rose-600 text-white font-bold'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEAVE APPLICATIONS */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-200">
                Faculty Leave Applications & Formal Excuses
              </h3>
              <p className="text-xs text-slate-400">
                Review submitted staff leaves, audit class cover requirements, and issue approval decisions.
              </p>
            </div>

            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    {canReviewLeaves && <th className="py-3 px-4 text-right">Review</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{l.staffName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{l.employeeId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {l.leaveType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {l.fromDate} to {l.toDate}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-300">
                        {l.numberOfDays} day(s)
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{l.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            l.status === 'APPROVED'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              : l.status === 'PENDING'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                              : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      {canReviewLeaves && (
                        <td className="py-3 px-4 text-right">
                          {l.status === 'PENDING' ? (
                            <button
                              onClick={() => {
                                setReviewingLeave(l);
                                setReviewComments('');
                                setIsReviewLeaveModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs"
                            >
                              Review & Act
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Decided by {l.reviewerName}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPLIANCE & DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-200">
                Staff Credentials, Contracts & Verification Documents
              </h3>
              <p className="text-xs text-slate-400">
                Audited archive of government IDs, degree diplomas, police clearances, and employment contracts.
              </p>
            </div>

            {canCreateStaff && (
              <button
                onClick={() => setIsDocModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
            )}
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Confidentiality</th>
                    <th className="py-3 px-4 text-right">File</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200">{doc.documentName}</td>
                      <td className="py-3 px-4 text-slate-300">{doc.staffName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                          {doc.documentType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {doc.expiryDate || 'No Expiry'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            doc.status === 'Valid'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              : doc.status === 'Expiring Soon'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                              : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {doc.isConfidential ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                            <Lock className="w-3 h-3" />
                            <span>HR Restricted</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Standard</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[11px] text-indigo-400 font-mono hover:underline cursor-pointer">
                          {doc.fileSize || 'PDF File'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: APPRAISALS & PERFORMANCE */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-200">
                Staff Performance Reviews & Pedagogical Appraisals
              </h3>
              <p className="text-xs text-slate-400">
                Annual and term evaluations scored on a 1.0 - 5.0 rubric by department heads and executive leadership.
              </p>
            </div>

            {canCreateStaff && (
              <button
                onClick={() => setIsPerfModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Record Appraisal Review</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {performances.map((perf) => (
              <div
                key={perf.id}
                className="bg-slate-900/70 border border-slate-800 p-5 rounded-xl space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-100">{perf.staffName}</h4>
                    <p className="text-xs text-indigo-400 font-medium">{perf.reviewPeriod}</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{perf.overallRating.toFixed(1)} / 5.0</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500">Instruction</span>
                    <p className="font-bold text-slate-200">{perf.teachingQualityRating} / 5</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Punctuality</span>
                    <p className="font-bold text-slate-200">{perf.attendanceRating} / 5</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Professionalism</span>
                    <p className="font-bold text-slate-200">{perf.professionalismRating} / 5</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div>
                    <strong className="text-slate-400 block text-[11px]">Core Strengths:</strong>
                    <p className="text-slate-200">{perf.strengths}</p>
                  </div>
                  <div>
                    <strong className="text-slate-400 block text-[11px]">Development Goals:</strong>
                    <p className="text-slate-300">{perf.goals}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 italic mt-2">
                    Reviewer: {perf.reviewerName} on {perf.reviewDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: PAYROLL PROFILES (CONFIDENTIAL RBAC) */}
      {activeTab === 'payroll' && canViewPayroll && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-200">
                  Faculty & Staff Compensation Profiles
                </h3>
                <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 text-[10px] font-bold">
                  Restricted Access
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Monthly base salaries, allowances, statutory deductions, and bank transfer routing references.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Base Salary</th>
                    <th className="py-3 px-4">Total Allowances</th>
                    <th className="py-3 px-4">Total Deductions</th>
                    <th className="py-3 px-4">Net Estimated</th>
                    <th className="py-3 px-4">Disbursement Method</th>
                    {canManagePayroll && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {allStaff.map((staff) => {
                    let profile: PayrollProfile | undefined;
                    try {
                      profile = staffService.getPayrollProfile(staff.id, currentUser);
                    } catch {
                      // Handled by RBAC
                    }

                    const base = profile?.baseSalary || 0;
                    const allow =
                      profile?.allowances.reduce((acc, a) => acc + a.amount, 0) || 0;
                    const deduct =
                      profile?.deductions.reduce((acc, d) => acc + d.amount, 0) || 0;
                    const net = base + allow - deduct;

                    return (
                      <tr key={staff.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">
                            {staff.firstName} {staff.lastName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {staff.employeeId}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{staff.departmentName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-100">
                          {base > 0 ? `$${base.toLocaleString()}/mo` : 'Unconfigured'}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400">
                          {allow > 0 ? `+$${allow.toLocaleString()}` : '$0'}
                        </td>
                        <td className="py-3 px-4 font-mono text-rose-400">
                          {deduct > 0 ? `-$${deduct.toLocaleString()}` : '$0'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                          {base > 0 ? `$${net.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-400">
                            {profile?.paymentMethod || 'Bank Transfer'} ({profile?.bankName || 'Standard'})
                          </span>
                        </td>
                        {canManagePayroll && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedPayrollStaff(staff);
                                setIsPayrollModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium"
                            >
                              Configure
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: STAFF BULLETINS & ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-200">
                Staff Bulletin Board & Executive Directives
              </h3>
              <p className="text-xs text-slate-400">
                School-wide announcements, training symposium invitations, and emergency circulars.
              </p>
            </div>

            {canCreateStaff && (
              <button
                onClick={() => setIsAnnouncementModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Bulletin</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-slate-900/70 border border-slate-800 p-5 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        ann.priority === 'URGENT'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                          : ann.priority === 'IMPORTANT'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
                      }`}
                    >
                      {ann.priority}
                    </span>
                    <span className="text-xs text-slate-400">
                      Audience: <strong className="text-slate-200">{ann.audience}</strong>
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">
                    Published {ann.publishDate}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-100">{ann.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{ann.content}</p>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Author: {ann.authorName} ({ann.authorRole})
                  </span>
                  <span>Active Notice</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ONBOARD / EDIT STAFF MEMBER */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {editingStaff ? 'Edit Staff Profile' : 'Onboard New Staff Member'}
                </h3>
                <p className="text-xs text-slate-400">
                  Enter biographical, departmental, and faculty credentials.
                </p>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const dept = departments.find((d) => d.id === formData.get('departmentId'));
                const des = designations.find((d) => d.id === formData.get('designationId'));
                const isTeaching = formData.get('isTeachingStaff') === 'on';

                const payload = {
                  schoolId: 'SCH-001',
                  employeeId:
                    editingStaff?.employeeId ||
                    `EMP-2026-${Math.floor(100 + Math.random() * 900)}`,
                  firstName: formData.get('firstName') as string,
                  lastName: formData.get('lastName') as string,
                  email: formData.get('email') as string,
                  phone: formData.get('phone') as string,
                  dateOfBirth: formData.get('dateOfBirth') as string,
                  gender: formData.get('gender') as any,
                  joiningDate: formData.get('joiningDate') as string,
                  employmentType: formData.get('employmentType') as any,
                  departmentId: (formData.get('departmentId') as string) || departments[0].id,
                  departmentName: dept?.name || 'Academics',
                  designationId: (formData.get('designationId') as string) || designations[0].id,
                  designationTitle: des?.title || 'Faculty Teacher',
                  status: (formData.get('status') as any) || 'ACTIVE',
                  qualification: formData.get('qualification') as string,
                  address: formData.get('address') as string,
                  emergencyContact: formData.get('emergencyContact') as string,
                  profilePhoto:
                    (formData.get('profilePhoto') as string) ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
                  notes: formData.get('notes') as string,
                  isTeachingStaff: isTeaching,
                  subjects: isTeaching
                    ? (formData.get('subjects') as string)
                        ?.split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : undefined,
                };

                if (editingStaff) {
                  staffService.updateStaff(editingStaff.id, payload, currentUser);
                } else {
                  staffService.addStaff(payload, currentUser);
                }
                setIsStaffModalOpen(false);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">First Name</label>
                  <input
                    name="firstName"
                    required
                    defaultValue={editingStaff?.firstName || ''}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Last Name</label>
                  <input
                    name="lastName"
                    required
                    defaultValue={editingStaff?.lastName || ''}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={editingStaff?.email || ''}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Phone Number</label>
                  <input
                    name="phone"
                    required
                    defaultValue={editingStaff?.phone || ''}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Department</label>
                  <select
                    name="departmentId"
                    defaultValue={editingStaff?.departmentId || departments[0]?.id}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Designation</label>
                  <select
                    name="designationId"
                    defaultValue={editingStaff?.designationId || designations[0]?.id}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    {designations.map((des) => (
                      <option key={des.id} value={des.id}>
                        {des.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Joining Date</label>
                  <input
                    name="joiningDate"
                    type="date"
                    required
                    defaultValue={
                      editingStaff?.joiningDate || new Date().toISOString().split('T')[0]
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Employment</label>
                  <select
                    name="employmentType"
                    defaultValue={editingStaff?.employmentType || 'FULL_TIME'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Gender</label>
                  <select
                    name="gender"
                    defaultValue={editingStaff?.gender || 'Female'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-200">
                  <input
                    type="checkbox"
                    name="isTeachingStaff"
                    defaultChecked={editingStaff?.isTeachingStaff ?? true}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-0"
                  />
                  <span>Teaching Faculty Member (Synchronize with Teacher Roster)</span>
                </label>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    Assigned Subjects (comma-separated)
                  </label>
                  <input
                    name="subjects"
                    defaultValue={editingStaff?.subjects?.join(', ') || 'Mathematics, Statistics'}
                    placeholder="e.g. Mathematics, Physics Lab, Advanced Calculus"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Qualifications</label>
                <input
                  name="qualification"
                  defaultValue={editingStaff?.qualification || 'M.Sc. Mathematics'}
                  placeholder="Degrees, certifications, universities"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Emergency Contact</label>
                <input
                  name="emergencyContact"
                  defaultValue={editingStaff?.emergencyContact || ''}
                  placeholder="Name, relationship, and contact telephone"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-white shadow-lg shadow-emerald-600/20"
                >
                  {editingStaff ? 'Update Staff Member' : 'Complete Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APPLY FOR LEAVE */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Apply for Staff Leave</h3>
                <p className="text-xs text-slate-400">
                  Submit formal leave with reason and date range.
                </p>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const staffId = formData.get('staffId') as string;
                const staff = allStaff.find((s) => s.id === staffId);
                const from = formData.get('fromDate') as string;
                const to = formData.get('toDate') as string;
                const d1 = new Date(from);
                const d2 = new Date(to);
                const diffDays = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1);

                staffService.submitLeaveRequest(
                  {
                    schoolId: 'SCH-001',
                    staffId: staff?.id || allStaff[0].id,
                    staffName: `${staff?.firstName} ${staff?.lastName}`,
                    employeeId: staff?.employeeId || 'EMP-001',
                    leaveType: formData.get('leaveType') as any,
                    fromDate: from,
                    toDate: to,
                    numberOfDays: diffDays,
                    reason: formData.get('reason') as string,
                  },
                  currentUser
                );
                setIsLeaveModalOpen(false);
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-400 font-medium mb-1">Staff Member</label>
                <select
                  name="staffId"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  {allStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.designationTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Leave Category</label>
                <select
                  name="leaveType"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Medical / Sick Leave</option>
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="EMERGENCY">Emergency Leave</option>
                  <option value="MATERNITY">Maternity / Paternity Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">From Date</label>
                  <input
                    name="fromDate"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">To Date</label>
                  <input
                    name="toDate"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Reason</label>
                <textarea
                  name="reason"
                  required
                  rows={3}
                  placeholder="Detail the reason for requested leave..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-white shadow-lg shadow-emerald-600/20"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REVIEW LEAVE APPLICATION */}
      {isReviewLeaveModalOpen && reviewingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Review Leave Request</h3>
                <p className="text-xs text-slate-400">
                  {reviewingLeave.staffName} ({reviewingLeave.leaveType} Leave)
                </p>
              </div>
              <button
                onClick={() => setIsReviewLeaveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <strong className="text-slate-200">
                    {reviewingLeave.fromDate} to {reviewingLeave.toDate} (
                    {reviewingLeave.numberOfDays} days)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block mt-1">Reason:</span>
                  <p className="text-slate-200 italic mt-0.5">{reviewingLeave.reason}</p>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Reviewer Decision Comments
                </label>
                <textarea
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="e.g. Approved. Cover teacher assigned for period 3."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleReviewLeaveSubmit('REJECTED')}
                  className="px-3.5 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-medium border border-rose-700/50"
                >
                  Reject Leave
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewLeaveSubmit('APPROVED')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-white shadow-lg shadow-emerald-600/20"
                >
                  Approve Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIGURE PAYROLL PROFILE */}
      {isPayrollModalOpen && selectedPayrollStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Configure Payroll Scale</h3>
                <p className="text-xs text-slate-400">
                  {selectedPayrollStaff.firstName} {selectedPayrollStaff.lastName} (
                  {selectedPayrollStaff.designationTitle})
                </p>
              </div>
              <button
                onClick={() => setIsPayrollModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const base = Number(formData.get('baseSalary'));
                const allow = Number(formData.get('allowanceAmount'));
                const deduct = Number(formData.get('deductionAmount'));

                staffService.savePayrollProfile(
                  {
                    staffId: selectedPayrollStaff.id,
                    schoolId: 'SCH-001',
                    salaryType: 'MONTHLY',
                    baseSalary: base,
                    allowances: [{ name: 'Standard Allowances', amount: allow }],
                    deductions: [{ name: 'Tax & Insurance', amount: deduct }],
                    paymentMethod: formData.get('paymentMethod') as any,
                    bankName: formData.get('bankName') as string,
                    bankReference: formData.get('bankReference') as string,
                    effectiveFrom: '2026-09-01',
                    status: 'ACTIVE',
                  },
                  currentUser
                );
                setIsPayrollModalOpen(false);
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Base Monthly Salary ($)
                </label>
                <input
                  name="baseSalary"
                  type="number"
                  required
                  defaultValue={4500}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Allowances Total ($)
                  </label>
                  <input
                    name="allowanceAmount"
                    type="number"
                    defaultValue={500}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Deductions Total ($)
                  </label>
                  <input
                    name="deductionAmount"
                    type="number"
                    defaultValue={200}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Disbursement Method</label>
                <select
                  name="paymentMethod"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="BANK_TRANSFER">Direct Bank Deposit / Wire</option>
                  <option value="CHEQUE">Bank Pay Order / Cheque</option>
                  <option value="CASH">Cash Voucher</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Bank Name</label>
                  <input
                    name="bankName"
                    defaultValue="Teachers Trust Bank"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Account Reference</label>
                  <input
                    name="bankReference"
                    defaultValue="ACC-****-7890"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayrollModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-white shadow-lg shadow-emerald-600/20"
                >
                  Save Compensation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PUBLISH STAFF BULLETIN */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Publish Staff Bulletin</h3>
                <p className="text-xs text-slate-400">
                  Broadcast official notice or administrative directive.
                </p>
              </div>
              <button
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                staffService.publishAnnouncement(
                  {
                    schoolId: 'SCH-001',
                    title: formData.get('title') as string,
                    content: formData.get('content') as string,
                    priority: formData.get('priority') as any,
                    audience: formData.get('audience') as any,
                    publishDate: new Date().toISOString().split('T')[0],
                    status: 'PUBLISHED',
                    authorName: currentUser.name,
                    authorRole: currentUser.roleTitle,
                  },
                  currentUser
                );
                setIsAnnouncementModalOpen(false);
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-400 font-medium mb-1">Bulletin Title</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Mid-term Assessment Schedule Briefing"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Priority</label>
                  <select
                    name="priority"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Audience</label>
                  <select
                    name="audience"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="ALL">All Staff</option>
                    <option value="TEACHERS">Teaching Faculty</option>
                    <option value="DEPARTMENT">Departmental</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Notice Content</label>
                <textarea
                  name="content"
                  required
                  rows={4}
                  placeholder="Detail the agenda, timing, and action requirements..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-white shadow-lg shadow-emerald-600/20"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
