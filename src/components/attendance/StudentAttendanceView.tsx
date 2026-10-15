import React, { useState } from 'react';
import {
  Search,
  User,
  GraduationCap,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { AttendanceCalendar } from './AttendanceCalendar';
import { MetricCard } from '../ui/MetricCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface StudentAttendanceViewProps {
  onNavigateStudent?: (studentId: string) => void;
  defaultStudentId?: string;
}

export const StudentAttendanceView: React.FC<StudentAttendanceViewProps> = ({
  onNavigateStudent,
  defaultStudentId,
}) => {
  const { currentUser } = useAuth();
  const allStudents = dataService.getStudents();

  // Role-based restrictions:
  // If role is parent, only their children
  // If role is student, only themselves
  let accessibleStudents = allStudents;
  if (currentUser?.role === 'student') {
    accessibleStudents = allStudents.filter(
      (s) => s.studentId === currentUser.id || s.email === currentUser.email
    );
    if (accessibleStudents.length === 0) accessibleStudents = [allStudents[0]];
  } else if (currentUser?.role === 'parent') {
    accessibleStudents = allStudents.filter(
      (s) => s.parentId === currentUser.id || s.parentEmail === currentUser.email
    );
    if (accessibleStudents.length === 0) {
      // Fallback to first student for parent demo
      accessibleStudents = [allStudents[0]];
    }
  }

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    defaultStudentId || accessibleStudents[0]?.studentId || 'STU-2024-001'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const selectedStudent =
    allStudents.find((s) => s.studentId === selectedStudentId) || accessibleStudents[0];

  // Attendance stats and logs for this student
  const studentRecords = selectedStudent
    ? dataService.getAttendanceByStudent(selectedStudent.studentId)
    : [];

  const totalSessions = studentRecords.length;
  const presentCount = studentRecords.filter((r) => r.status === 'Present').length;
  const absentCount = studentRecords.filter((r) => r.status === 'Absent').length;
  const lateCount = studentRecords.filter((r) => r.status === 'Late').length;
  const excusedCount = studentRecords.filter((r) => r.status === 'Excused').length;

  const attendancePercentage =
    totalSessions > 0
      ? Number((((presentCount + lateCount) / totalSessions) * 100).toFixed(1))
      : 100;

  // Filter student selection list
  const filteredList = accessibleStudents.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.className.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Student Selector Card (Hidden or locked if single student) */}
      {accessibleStudents.length > 1 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Select Student Record</h3>
              <p className="text-xs text-slate-500">
                View individual student attendance profiles, calendar logs, and session remarks.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {filteredList.slice(0, 10).map((stu) => {
              const isSelected = stu.studentId === selectedStudentId;
              return (
                <button
                  key={stu.studentId}
                  onClick={() => setSelectedStudentId(stu.studentId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{stu.firstName} {stu.lastName}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    ({stu.className})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Student Banner */}
      {selectedStudent && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-base">
              {selectedStudent.firstName[0]}
              {selectedStudent.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h2>
                <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  {selectedStudent.studentId}
                </span>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Roll #{selectedStudent.rollNumber || '01'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedStudent.className} • Section {selectedStudent.sectionName || 'A'} • Guardian: {selectedStudent.parentContact || 'Registered Guardian'}
              </p>
            </div>
          </div>

          {onNavigateStudent && currentUser?.role !== 'student' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateStudent(selectedStudent.studentId)}
              leftIcon={<ExternalLink className="w-3.5 h-3.5 text-indigo-600" />}
            >
              Open Full Student Profile
            </Button>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Attendance Rate"
          value={`${attendancePercentage}%`}
          subtext={attendancePercentage < 75 ? 'Low attendance alert' : 'Good attendance'}
          icon={<CalendarCheck className="w-4 h-4 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
        />
        <MetricCard
          label="Present Days"
          value={presentCount}
          subtext="Standard sessions"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
        />
        <MetricCard
          label="Absences"
          value={absentCount}
          subtext="Unexcused"
          icon={<XCircle className="w-4 h-4 text-rose-600" />}
          iconBgColor="bg-rose-50"
        />
        <MetricCard
          label="Late / Tardy"
          value={lateCount}
          subtext="Morning arrival"
          icon={<Clock className="w-4 h-4 text-amber-600" />}
          iconBgColor="bg-amber-50"
        />
        <MetricCard
          label="Excused"
          value={excusedCount}
          subtext="Verified leaves"
          icon={<HelpCircle className="w-4 h-4 text-sky-600" />}
          iconBgColor="bg-sky-50"
        />
        <MetricCard
          label="Total Sessions"
          value={totalSessions}
          subtext="Classroom roll calls"
          icon={<User className="w-4 h-4 text-indigo-600" />}
          iconBgColor="bg-indigo-50"
        />
      </div>

      {/* Interactive Visual Attendance Calendar */}
      <AttendanceCalendar
        records={studentRecords}
        studentName={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}
        initialYear={2026}
        initialMonth={8} // September 2026
      />

      {/* Chronological History Log */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Chronological Attendance History
          </h3>
          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
            {studentRecords.length} Logged Sessions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Classroom</th>
                <th className="py-3 px-4">Subject / Period</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {studentRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No attendance logs recorded for this student yet.
                  </td>
                </tr>
              ) : (
                studentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{r.date}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{r.className || 'Classroom'}</td>
                    <td className="py-3 px-4 text-slate-600">{r.period || 'Daily Homeroom'}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          r.status === 'Present'
                            ? 'success'
                            : r.status === 'Late'
                            ? 'warning'
                            : r.status === 'Excused'
                            ? 'info'
                            : 'danger'
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{r.recordedBy || 'Staff'}</td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                      {r.remarks || 'Regular attendance'}
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
