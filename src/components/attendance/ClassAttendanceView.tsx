import React, { useState } from 'react';
import {
  School,
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Search,
  BellRing,
  ExternalLink,
  Users,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface ClassAttendanceViewProps {
  onSelectClassToMark?: (classId: string) => void;
}

export const ClassAttendanceView: React.FC<ClassAttendanceViewProps> = ({
  onSelectClassToMark,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-04');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedClassDetail, setSelectedClassDetail] = useState<string | null>(null);

  const classRows = dataService.getClassAttendanceOverview(selectedDate);
  const trends = dataService.getAttendanceTrends();
  const settings = dataService.getAttendanceSettings();

  const submittedCount = classRows.filter((c) => c.submitted).length;
  const pendingCount = classRows.filter((c) => !c.submitted).length;

  const filteredRows = classRows.filter((c) => {
    const q = searchFilter.toLowerCase();
    return (
      c.className.toLowerCase().includes(q) ||
      c.sectionName.toLowerCase().includes(q) ||
      c.classTeacher.toLowerCase().includes(q)
    );
  });

  const handleSendReminder = (teacherName: string, className: string, sectionName: string) => {
    showToast(
      `Attendance reminder notification dispatched to ${teacherName} for ${className} (${sectionName}).`,
      'info'
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview & Date Selector Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Classroom Attendance Register & Submission Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live administrative monitoring of daily homeroom roll calls, section submission compliance, and faculty reminders
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Session Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-medium px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Quick KPI summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Total Sections</span>
              <span className="text-2xl font-bold text-slate-900 mt-0.5">{classRows.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-200/60 text-slate-700">
              <School className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-200/70 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-700 uppercase font-semibold block">Registers Submitted</span>
              <span className="text-2xl font-bold text-emerald-800 mt-0.5">{submittedCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-700 uppercase font-semibold block">Pending Submission</span>
              <span className="text-2xl font-bold text-amber-800 mt-0.5">{pendingCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search class, section, or teacher..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <strong>{filteredRows.length}</strong> cohorts for {selectedDate}
        </div>
      </div>

      {/* Official Class Attendance Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Class Teacher</th>
                <th className="py-3 px-4 text-center">Total Students</th>
                <th className="py-3 px-4 text-center">Present</th>
                <th className="py-3 px-4 text-center">Absent</th>
                <th className="py-3 px-4 text-center">Late</th>
                <th className="py-3 px-4 text-center">Attendance %</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No classes matched your search filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isLow = row.submitted && row.percentage < settings.lowAttendanceThreshold;

                  return (
                    <tr key={`${row.classId}-${row.sectionId}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{row.className}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{row.sectionName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{row.classTeacher}</td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                        {row.totalStudents}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">
                        {row.submitted ? row.present : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-rose-600">
                        {row.submitted ? row.absent : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-amber-600">
                        {row.submitted ? row.late : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {row.submitted ? (
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                              isLow
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {row.percentage}%
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={row.submitted ? 'success' : 'warning'}>
                          {row.submitted ? 'Submitted' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {!row.submitted ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleSendReminder(row.classTeacher, row.className, row.sectionName)
                              }
                              leftIcon={<BellRing className="w-3 h-3 text-amber-600" />}
                            >
                              Send Reminder
                            </Button>
                            {onSelectClassToMark && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onSelectClassToMark(row.classId)}
                              >
                                Take Attendance
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button
                            variant="subtle"
                            size="sm"
                            onClick={() =>
                              setSelectedClassDetail(
                                selectedClassDetail === `${row.classId}-${row.sectionId}`
                                  ? null
                                  : `${row.classId}-${row.sectionId}`
                              )
                            }
                          >
                            {selectedClassDetail === `${row.classId}-${row.sectionId}`
                              ? 'Hide Details'
                              : 'View Details'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Month Trends Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Institutional Absence Trends (Current vs Previous Months)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative tracking across school terms to evaluate attendance policy effectiveness
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">September 2026 (Current Term)</span>
              <span className="font-mono font-bold text-emerald-600 text-base">
                {trends.currentMonthRate}%
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Absence Rate: <strong className="text-rose-700">{trends.absenceRate}%</strong> • Tardy:{' '}
              <strong className="text-amber-700">{trends.lateRate}%</strong>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${trends.currentMonthRate}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">August 2026 (Previous Month)</span>
              <span className="font-mono font-bold text-indigo-600 text-base">
                {trends.prevMonthRate}%
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Month-over-month change:{' '}
              <strong
                className={trends.absenceTrend >= 0 ? 'text-emerald-700' : 'text-rose-700'}
              >
                {trends.absenceTrend >= 0 ? `+${trends.absenceTrend}%` : `${trends.absenceTrend}%`}
              </strong>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-1.5 rounded-full"
                style={{ width: `${trends.prevMonthRate}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">3-Month Running Average</span>
              <span className="font-mono font-bold text-slate-900 text-base">
                {trends.threeMonthRate}%
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Institutional benchmark target: <strong>{settings.lowAttendanceThreshold}%</strong>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-slate-700 h-1.5 rounded-full"
                style={{ width: `${trends.threeMonthRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
