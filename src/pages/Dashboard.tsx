import { useState } from 'react';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CalendarX,
  School,
  DollarSign,
  Clock,
  UserPlus,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CreditCard,
  Plus,
  Megaphone,
} from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { AdmissionApplication } from '../types';

export interface DashboardProps {
  onNavigate: (route: string, studentId?: string) => void;
  onOpenAddStudent: () => void;
  onOpenAddTeacher: () => void;
  onOpenMarkAttendance: () => void;
  onOpenRecordPayment: () => void;
  onOpenCreateAnnouncement: () => void;
}

export const Dashboard = ({
  onNavigate,
  onOpenAddStudent,
  onOpenAddTeacher,
  onOpenMarkAttendance,
  onOpenRecordPayment,
  onOpenCreateAnnouncement,
}: DashboardProps) => {
  const { currentUser, can } = useAuth();
  const school = dataService.getSchool();
  const metrics = dataService.getDashboardMetrics();
  const recentAdmissions = dataService.getAdmissions().slice(0, 5);
  const classes = dataService.getClasses().slice(0, 5);
  const recentActivities = dataService.getActivityLogs().slice(0, 6);
  const alerts = dataService.getAlerts();

  const [admissions, setAdmissions] = useState<AdmissionApplication[]>(recentAdmissions);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const handleQuickApproveAdmission = (id: string) => {
    dataService.updateAdmissionStatus(id, 'Approved');
    setAdmissions(dataService.getAdmissions().slice(0, 5));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header matching Design */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Administrative Overview</h2>
          <p className="text-slate-500 text-sm mt-0.5">{formattedDate}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col items-end px-3 py-1 border-r border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
              Academic Term
            </span>
            <span className="text-sm font-semibold text-slate-800">{school.currentTerm}</span>
          </div>
          <div className="flex flex-col items-end px-3 py-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
              System Status
            </span>
            <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operational
            </span>
          </div>

          <div className="flex items-center gap-2 pl-2">
            {can('students.create') && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenAddStudent}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Student
              </Button>
            )}
            {can('attendance.create') && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenMarkAttendance}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              >
                Mark Attendance
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Students"
          value={metrics.totalStudents.toLocaleString()}
          subtext={`${metrics.activeStudents} actively enrolled`}
          icon={<GraduationCap className="w-5 h-5 text-blue-600" />}
          iconBgColor="bg-blue-50 text-blue-600"
          trend={{ value: '+12%', isPositive: true }}
          onClick={() => onNavigate('students')}
        />
        <MetricCard
          label="Present Today"
          value={metrics.presentToday.toLocaleString()}
          subtext={`${metrics.attendancePercentage}% daily attendance`}
          icon={<CalendarCheck className="w-5 h-5 text-emerald-600" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          trend={{ value: 'Target 95%', isPositive: metrics.attendancePercentage >= 95 }}
          onClick={() => onNavigate('attendance')}
        />
        <MetricCard
          label="Fees Collected"
          value={`$${metrics.feesCollected.toLocaleString()}`}
          subtext="Term 2 tuition reconciliation"
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          trend={{ value: '88% cleared', isPositive: true }}
          onClick={() => onNavigate('finance')}
        />
        <MetricCard
          label="New Admissions"
          value={metrics.newAdmissions}
          subtext="Under testing & review"
          icon={<UserPlus className="w-5 h-5 text-blue-600" />}
          iconBgColor="bg-blue-50 text-blue-600"
          trend={{ value: '+6 this wk', isPositive: true }}
          onClick={() => onNavigate('admissions')}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Absent Today"
          value={metrics.absentToday}
          subtext={`${metrics.lateToday} tardy / late entries`}
          icon={<CalendarX className="w-5 h-5 text-rose-600" />}
          iconBgColor="bg-rose-50 text-rose-600"
          onClick={() => onNavigate('attendance')}
        />
        <MetricCard
          label="Total Faculty / Teachers"
          value={metrics.totalTeachers}
          subtext={`${metrics.activeTeachers} full-time on campus`}
          icon={<School className="w-5 h-5 text-blue-600" />}
          iconBgColor="bg-blue-50 text-blue-600"
          onClick={() => onNavigate('teachers')}
        />
        <MetricCard
          label="Pending Fees"
          value={`$${metrics.pendingFees.toLocaleString()}`}
          subtext={`Overdue: $${metrics.overdueFees.toLocaleString()}`}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          iconBgColor="bg-amber-50 text-amber-600"
          trend={{ value: 'Due 10d', isPositive: false }}
          onClick={() => onNavigate('finance')}
        />
        <MetricCard
          label="Pending Requests"
          value={metrics.pendingRequests}
          subtext="Parent tickets & transport queries"
          icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
          iconBgColor="bg-rose-50 text-rose-600"
          onClick={() => onNavigate('requests')}
        />
      </div>

      {/* 3-Column Split: Recent Admissions (2 cols) & Critical Alerts (1 col) matching Design */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Admissions Application Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Recent Admission Applications</h3>
              <p className="text-xs text-slate-400">Academic year 2025-2026</p>
            </div>
            <button
              onClick={() => onNavigate('admissions')}
              className="text-blue-600 text-xs font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              View All ({dataService.getAdmissions().length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2 flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase font-bold border-b border-slate-100">
                  <th className="p-3 font-semibold">Applicant</th>
                  <th className="p-3 font-semibold">Applied Grade</th>
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-50 text-slate-700">
                {admissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{adm.applicantName}</div>
                      <div className="text-[10px] text-slate-400">{adm.applicationNumber}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-600">{adm.appliedClass}</td>
                    <td className="p-3 text-slate-400">{adm.applicationDate}</td>
                    <td className="p-3">
                      {adm.status === 'Approved' ? (
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                          Pre-Qualified
                        </span>
                      ) : adm.status === 'Under Review' ? (
                        <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                          Under Review
                        </span>
                      ) : adm.status === 'Pending' ? (
                        <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-100">
                          Missing Docs
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100">
                          {adm.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {adm.status === 'Pending' || adm.status === 'Under Review' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2.5"
                          onClick={() => handleQuickApproveAdmission(adm.id)}
                        >
                          Approve
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 col: Critical Alerts matching Design */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Critical Alerts</h3>
            <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100">
              4 Actionable
            </span>
          </div>

          <div className="p-4 space-y-3.5 flex-1">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => onNavigate(alert.linkTab)}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <span
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    alert.severity === 'danger'
                      ? 'bg-rose-500 ring-4 ring-rose-100'
                      : alert.severity === 'warning'
                      ? 'bg-amber-500 ring-4 ring-amber-100'
                      : 'bg-blue-500 ring-4 ring-blue-100'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {alert.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                    {alert.description}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5 mt-0.5" />
              </div>
            ))}
          </div>

          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl text-center">
            <button
              onClick={() => onNavigate('communication')}
              className="text-xs text-slate-500 font-medium hover:text-slate-800 cursor-pointer"
            >
              View All Notifications & Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Attendance & Finance Overview Dual Module */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Overview */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Overview</h3>
              <p className="text-xs text-slate-500">Today's campus-wide roll call verification</p>
            </div>
            <Badge variant="success" dot>
              {metrics.attendancePercentage}% Enrolled Present
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl text-center">
              <span className="text-xs font-medium text-emerald-800">Present</span>
              <div className="text-xl font-bold text-emerald-700 mt-0.5">
                {metrics.presentToday}
              </div>
              <span className="text-[11px] text-emerald-600">
                {metrics.attendancePercentage}%
              </span>
            </div>
            <div className="bg-rose-50/70 border border-rose-100 p-3 rounded-xl text-center">
              <span className="text-xs font-medium text-rose-800">Absent</span>
              <div className="text-xl font-bold text-rose-700 mt-0.5">
                {metrics.absentToday}
              </div>
              <span className="text-[11px] text-rose-600">
                {(100 - metrics.attendancePercentage).toFixed(1)}%
              </span>
            </div>
            <div className="bg-amber-50/70 border border-amber-100 p-3 rounded-xl text-center">
              <span className="text-xs font-medium text-amber-800">Late / Tardy</span>
              <div className="text-xl font-bold text-amber-700 mt-0.5">
                {metrics.lateToday}
              </div>
              <span className="text-[11px] text-amber-600">Excused: 2</span>
            </div>
          </div>

          {/* Visual Percentage Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Overall Campus Rate</span>
              <span>{metrics.attendancePercentage}% / 100%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${metrics.attendancePercentage}%` }}
              />
              <div
                className="bg-amber-400 h-full transition-all"
                style={{ width: '2%' }}
              />
              <div
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${100 - metrics.attendancePercentage - 2}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Highest section attendance: Class 10A (99.4%)</span>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1"
            >
              Full Register <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Fee Overview */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Fee Financial Overview</h3>
              <p className="text-xs text-slate-500">Term 2 tuition & laboratory fee collections</p>
            </div>
            <button
              onClick={() => onNavigate('finance')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1"
            >
              Finance Ledger <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-center">
              <span className="text-xs font-medium text-slate-600">Collected</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                ${metrics.feesCollected.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Reconciled</span>
            </div>
            <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl text-center">
              <span className="text-xs font-medium text-amber-800">Pending</span>
              <div className="text-lg font-bold text-amber-700 mt-0.5">
                ${metrics.pendingFees.toLocaleString()}
              </div>
              <span className="text-[11px] text-amber-700">In 30-day term</span>
            </div>
            <div className="bg-rose-50/70 border border-rose-200/80 p-3 rounded-xl text-center">
              <span className="text-xs font-medium text-rose-800">Overdue</span>
              <div className="text-lg font-bold text-rose-700 mt-0.5">
                ${metrics.overdueFees.toLocaleString()}
              </div>
              <span className="text-[11px] text-rose-600 font-medium">2 Accounts</span>
            </div>
          </div>

          {/* Breakdown progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Collection Realization</span>
              <span>88.2% of target budget</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: '88%' }} />
              <div className="bg-amber-400 h-full" style={{ width: '8%' }} />
              <div className="bg-rose-500 h-full" style={{ width: '4%' }} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Automated reminders active</span>
            <Button variant="outline" size="sm" onClick={onOpenRecordPayment}>
              + Record Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Dual Section: Class Sections Enrollment & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Sections & Capacity (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Sections & Class Capacity</h3>
              <p className="text-xs text-slate-500">Active grade divisions and teacher allocation</p>
            </div>
            <button
              onClick={() => onNavigate('classes')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1"
            >
              All Classes ({dataService.getClasses().length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Class & Section</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Homeroom Teacher</th>
                  <th className="py-2.5 px-3">Enrollment</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {classes.map((cls) => {
                  const studentCount =
                    cls.totalStudents ||
                    cls.sections?.reduce((sum, s) => sum + (s.enrolledCount || 0), 0) ||
                    0;
                  const cap =
                    cls.capacity ||
                    cls.sections?.reduce((sum, s) => sum + (s.capacity || 30), 0) ||
                    60;
                  const utilization = Math.min(100, Math.round((studentCount / cap) * 100));
                  const sectionsList = cls.sections?.map((s) => s.name).join(', ') || 'A';

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{cls.name}</div>
                        <div className="text-[10px] text-slate-400">Sections: {sectionsList}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-600">
                        {cls.sections?.[0]?.roomNumber || `Room ${cls.gradeLevel}01`}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {cls.classHeadTeacherName || cls.sections?.[0]?.classTeacherName || 'Assigned'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            {studentCount} / {cap}
                          </span>
                          <span className="text-[10px] text-slate-400">({utilization}%)</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Badge variant={utilization >= 90 ? 'warning' : 'success'}>
                          {utilization >= 90 ? 'Near Capacity' : 'Available'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent System Activity (1 col) */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Audit Activity</h3>
              <p className="text-xs text-slate-500">Live operational ledger logs</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  {act.entityType === 'student' && <GraduationCap className="w-3.5 h-3.5 text-blue-600" />}
                  {act.entityType === 'payment' && <DollarSign className="w-3.5 h-3.5 text-emerald-600" />}
                  {act.entityType === 'attendance' && <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />}
                  {act.entityType === 'exam' && <FileText className="w-3.5 h-3.5 text-blue-600" />}
                  {act.entityType === 'announcement' && <Megaphone className="w-3.5 h-3.5 text-amber-600" />}
                  {act.entityType === 'class' && <School className="w-3.5 h-3.5 text-slate-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {act.action}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">{act.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug mt-0.5 line-clamp-2">
                    {act.details}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium">by {act.actor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
