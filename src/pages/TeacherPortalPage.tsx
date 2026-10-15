import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import {
  HomeworkItem,
  TeacherTimetablePeriod,
  Student,
} from '../types';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  BookOpen,
  Clock,
  Plus,
  FileText,
  Users,
  Award,
  Save,
  Trash2,
  Edit,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const TeacherPortalPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'homework' | 'marks' | 'students' | 'timetable'>('overview');

  // Load teacher-scoped data from dataService
  const assignedStudents = useMemo(() => {
    return dataService.getStudentsScoped(currentUser);
  }, [currentUser]);

  const timetable = useMemo(() => {
    return dataService.getTeacherTimetable(currentUser.teacherId || 'TCH-001');
  }, [currentUser]);

  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>(() => {
    return dataService.getHomeworkForTeacher(currentUser.teacherId || 'TCH-001');
  });

  // Attendance State
  const [selectedClassId, setSelectedClassId] = useState('CLS-001');
  const [selectedSectionName, setSelectedSectionName] = useState('Section A');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'>>({});
  const [attendanceRemarks, setAttendanceRemarks] = useState<Record<string, string>>({});
  const [attendanceSuccessMessage, setAttendanceSuccessMessage] = useState<string | null>(null);

  // Filter students for the selected class/section for attendance
  const attendanceClassStudents = useMemo(() => {
    return assignedStudents.filter(
      (s) => s.classId === selectedClassId || s.className === 'Class 6'
    );
  }, [assignedStudents, selectedClassId]);

  // Initialize attendance defaults if not yet filled
  const getStudentStatus = (studentId: string) => {
    return attendanceStatuses[studentId] || 'Present';
  };

  const handleMarkAll = (status: 'Present' | 'Absent') => {
    const updated: Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'> = {};
    attendanceClassStudents.forEach((s) => {
      updated[s.studentId] = status;
    });
    setAttendanceStatuses(updated);
  };

  const handleSaveAttendance = () => {
    const records = attendanceClassStudents.map((s) => ({
      studentId: s.studentId,
      studentName: `${s.firstName} ${s.lastName}`,
      status: getStudentStatus(s.studentId),
      remarks: attendanceRemarks[s.studentId] || (getStudentStatus(s.studentId) === 'Present' ? 'On time' : 'Recorded in homeroom'),
    }));

    dataService.recordClassAttendance({
      classId: selectedClassId,
      className: 'Class 6',
      sectionId: 'SEC-001',
      sectionName: selectedSectionName,
      date: attendanceDate,
      records,
      user: currentUser,
    });

    setAttendanceSuccessMessage(
      `Attendance for Class 6 - ${selectedSectionName} (${attendanceDate}) saved successfully! ${records.filter((r) => r.status === 'Present').length} Present, ${records.filter((r) => r.status === 'Absent').length} Absent.`
    );

    setTimeout(() => {
      setAttendanceSuccessMessage(null);
    }, 4000);
  };

  // Homework Modal State
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [hwSubject, setHwSubject] = useState('Advanced Mathematics');
  const [hwClass, setHwClass] = useState('Class 6');
  const [hwSection, setHwSection] = useState('Section A');
  const [hwDueDate, setHwDueDate] = useState('2025-03-08');
  const [hwDescription, setHwDescription] = useState('');
  const [hwAttachment, setHwAttachment] = useState('');
  const [hwSuccessMessage, setHwSuccessMessage] = useState<string | null>(null);

  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    const created = dataService.createHomework(
      {
        classId: hwClass === 'Class 6' ? 'CLS-001' : 'CLS-003',
        className: hwClass,
        sectionId: 'SEC-001',
        sectionName: hwSection,
        subject: hwSubject,
        title: hwTitle,
        dueDate: hwDueDate,
        status: 'Published',
        assignedBy: currentUser.name,
        teacherId: currentUser.teacherId || 'TCH-001',
        description: hwDescription,
        attachment: hwAttachment || undefined,
        submissionCount: 0,
        totalStudents: assignedStudents.length || 24,
      },
      currentUser
    );

    setHomeworkList((prev) => [created, ...prev]);
    setShowHomeworkModal(false);
    setHwTitle('');
    setHwDescription('');
    setHwAttachment('');
    setHwSuccessMessage(`Assignment "${created.title}" published for ${hwClass}!`);
    setTimeout(() => setHwSuccessMessage(null), 4000);
  };

  const handleDeleteHomework = (id: string) => {
    dataService.deleteHomework(id, currentUser);
    setHomeworkList((prev) => prev.filter((h) => h.id !== id));
  };

  // Marks Entry State
  const [marksExamName, setMarksExamName] = useState('Mid-Term Assessment 2025');
  const [marksTerm, setMarksTerm] = useState('Term 2');
  const [marksSubject, setMarksSubject] = useState('Advanced Mathematics');
  const [marksTotal, setMarksTotal] = useState<number>(100);
  const [obtainedMarks, setObtainedMarks] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    assignedStudents.forEach((s, idx) => {
      initial[s.studentId] = 85 + (idx % 12);
    });
    return initial;
  });
  const [marksRemarks, setMarksRemarks] = useState<Record<string, string>>({});
  const [marksSuccessMessage, setMarksSuccessMessage] = useState<string | null>(null);

  const handleMarksChange = (studentId: string, value: number) => {
    setObtainedMarks((prev) => ({
      ...prev,
      [studentId]: Math.max(0, Math.min(marksTotal, value)),
    }));
  };

  const handleSaveMarks = () => {
    const records = assignedStudents.map((s) => ({
      studentId: s.studentId,
      marksObtained: obtainedMarks[s.studentId] ?? 85,
      totalMarks: marksTotal,
      remarks: marksRemarks[s.studentId] || 'Consistent academic performance',
    }));

    dataService.saveExamMarks({
      examName: marksExamName,
      term: marksTerm,
      subject: marksSubject,
      classId: 'CLS-001',
      records,
      user: currentUser,
    });

    setMarksSuccessMessage(
      `Assessment marks for ${marksSubject} (${marksExamName}) verified and published for ${records.length} students!`
    );
    setTimeout(() => setMarksSuccessMessage(null), 4000);
  };

  // Quick stats
  const totalAssigned = assignedStudents.length;
  const todayClassesCount = timetable.filter((t) => t.day === 'Monday' || t.day === 'Tuesday').length;

  return (
    <div id="teacher-portal-page" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Teacher Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Faculty Lead
              </span>
              <span className="text-xs text-slate-500">ID: {currentUser.teacherId || 'TCH-001'}</span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight mt-1">
              {currentUser.name}
            </h1>
            <p className="text-xs text-slate-600">
              {currentUser.roleTitle} • Assigned: <span className="font-semibold text-slate-800">Class 6 (Sec A) & Class 8 (Sec A)</span>
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-semibold text-slate-800">Scoped Teacher Access Active</div>
            <div className="text-[11px] text-slate-500">
              Restricted to assigned classes. Tuition balances confidential.
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto no-scrollbar pb-px">
        {[
          { id: 'overview', label: 'Faculty Desk', icon: GraduationCap },
          { id: 'attendance', label: 'Class Attendance Register', icon: Calendar },
          { id: 'homework', label: 'Homework & Assignments', icon: BookOpen },
          { id: 'marks', label: 'Exam Marks Entry', icon: Award },
          { id: 'students', label: 'Assigned Students Roster', icon: Users },
          { id: 'timetable', label: 'Weekly Teaching Timetable', icon: Clock },
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

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Assigned Students</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{totalAssigned}</div>
              <div className="text-xs text-slate-500 mt-1">Across 2 class divisions</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Classes Today</span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{todayClassesCount} Periods</div>
              <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Next: 08:30 AM Room 204
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Active Homework</span>
                <BookOpen className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{homeworkList.length}</div>
              <div className="text-xs text-slate-500 mt-1">Assignments tracking submissions</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Attendance Status</span>
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">Ready to Log</div>
              <div className="text-xs text-amber-600 mt-1 font-medium">Morning homeroom register</div>
            </div>
          </div>

          {/* Quick Actions & Today's Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Today's Schedule */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">Today's Teaching Schedule</h3>
                  <p className="text-xs text-slate-500">Monday Schedule • St. Augustine Academic Schedule</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('timetable')}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  View Full Week →
                </button>
              </div>

              <div className="space-y-3">
                {timetable.slice(0, 4).map((period, idx) => (
                  <div
                    key={period.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm shrink-0">
                        P{period.periodNumber}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">{period.subject}</h4>
                        <p className="text-xs text-slate-500">
                          {period.className} ({period.sectionName}) • {period.room}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                        {period.time}
                      </span>
                      {idx === 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClassId(period.classId);
                            setActiveTab('attendance');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
                        >
                          Log Register
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900 mb-1">Faculty Actions</h3>
                <p className="text-xs text-slate-500 mb-4">Direct shortcuts to classroom utilities.</p>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('attendance')}
                    className="w-full p-3 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-all flex items-center gap-3"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Take Class Attendance</div>
                      <div className="text-[11px] text-slate-500">Log present, late, or excused students</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('homework');
                      setShowHomeworkModal(true);
                    }}
                    className="w-full p-3 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-all flex items-center gap-3"
                  >
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Create New Homework</div>
                      <div className="text-[11px] text-slate-500">Publish assignment with guidelines & due date</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('marks')}
                    className="w-full p-3 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-all flex items-center gap-3"
                  >
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Enter Exam Marks</div>
                      <div className="text-[11px] text-slate-500">Input midterm assessments & publish grades</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('students')}
                    className="w-full p-3 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-all flex items-center gap-3"
                  >
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">View Student Roster</div>
                      <div className="text-[11px] text-slate-500">View profiles in assigned sections</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Academic Dean: Arthur Pendelton</span>
                <span>Term 2 Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE REGISTER */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {attendanceSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{attendanceSuccessMessage}</span>
            </div>
          )}

          {/* Controls Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="CLS-001">Class 6 (Middle School)</option>
                  <option value="CLS-003">Class 8 (Junior High)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Section</label>
                <select
                  value={selectedSectionName}
                  onChange={(e) => setSelectedSectionName(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Register Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                Save & Lock Attendance
              </button>
            </div>
          </div>

          {/* Student Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold">
                Class Roster ({attendanceClassStudents.length} Students)
              </span>
              <span>Duplicate check enabled: Submitting overwrites existing record for this date</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Roll #</th>
                    <th className="py-3 px-4">Attendance Status</th>
                    <th className="py-3 px-4">Teacher Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {attendanceClassStudents.map((student) => {
                    const currentStatus = getStudentStatus(student.studentId);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.photoUrl}
                              alt={student.firstName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                {student.firstName} {student.lastName}
                              </span>
                              <span className="text-[10px] text-slate-400">{student.studentId}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600">
                          {student.rollNumber || '01'}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {(['Present', 'Absent', 'Late', 'Excused'] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() =>
                                  setAttendanceStatuses((prev) => ({
                                    ...prev,
                                    [student.studentId]: st,
                                  }))
                                }
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                  currentStatus === st
                                    ? st === 'Present'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : st === 'Absent'
                                      ? 'bg-red-600 text-white shadow-xs'
                                      : st === 'Late'
                                      ? 'bg-amber-600 text-white shadow-xs'
                                      : 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Optional remark..."
                            value={attendanceRemarks[student.studentId] || ''}
                            onChange={(e) =>
                              setAttendanceRemarks((prev) => ({
                                ...prev,
                                [student.studentId]: e.target.value,
                              }))
                            }
                            className="w-full max-w-xs px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          />
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

      {/* TAB 3: HOMEWORK & ASSIGNMENTS */}
      {activeTab === 'homework' && (
        <div className="space-y-6">
          {hwSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{hwSuccessMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">Coursework & Homework Manager</h3>
              <p className="text-xs text-slate-500">Create, publish, and track student assignment completion.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowHomeworkModal(true)}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {homeworkList.map((hw) => (
              <div
                key={hw.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
                      {hw.subject}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        hw.status === 'Published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : hw.status === 'Closed'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {hw.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{hw.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3">{hw.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
                    <div className="flex justify-between">
                      <span>Target Class:</span>
                      <span className="font-semibold text-slate-800">{hw.className || 'Class 6'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span className="font-semibold text-red-600">{hw.dueDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Submissions:</span>
                      <span className="font-semibold text-slate-800">
                        {hw.submissionCount || 18} / {hw.totalStudents || 24}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">By {hw.assignedBy}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteHomework(hw.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EXAM MARKS ENTRY */}
      {activeTab === 'marks' && (
        <div className="space-y-6">
          {marksSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{marksSuccessMessage}</span>
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Assessment</label>
                <select
                  value={marksExamName}
                  onChange={(e) => setMarksExamName(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="Mid-Term Assessment 2025">Mid-Term Assessment 2025</option>
                  <option value="Term 1 Final Comprehensive">Term 1 Final Comprehensive</option>
                  <option value="Monthly Quiz 3">Monthly Quiz 3</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Academic Term</label>
                <select
                  value={marksTerm}
                  onChange={(e) => setMarksTerm(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="Term 2">Term 2</option>
                  <option value="Term 1">Term 1</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Subject</label>
                <select
                  value={marksSubject}
                  onChange={(e) => setMarksSubject(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="Advanced Mathematics">Advanced Mathematics</option>
                  <option value="Algebra & Functions">Algebra & Functions</option>
                  <option value="Geometry">Geometry</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Max Score</label>
                <input
                  type="number"
                  value={marksTotal}
                  onChange={(e) => setMarksTotal(Number(e.target.value))}
                  className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveMarks}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Award className="w-4 h-4" />
              Verify & Publish Assessment
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Obtained Marks (/ {marksTotal})</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Calculated Grade</th>
                    <th className="py-3 px-4">Faculty Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {assignedStudents.map((student) => {
                    const score = obtainedMarks[student.studentId] ?? 85;
                    const pct = Math.round((score / marksTotal) * 100);
                    let grade = 'A';
                    if (pct >= 90) grade = 'A+';
                    else if (pct >= 80) grade = 'A';
                    else if (pct >= 70) grade = 'B';
                    else if (pct >= 60) grade = 'C';
                    else grade = 'D';

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.photoUrl}
                              alt={student.firstName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                {student.firstName} {student.lastName}
                              </span>
                              <span className="text-[10px] text-slate-400">{student.studentId}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            max={marksTotal}
                            value={score}
                            onChange={(e) => handleMarksChange(student.studentId, Number(e.target.value))}
                            className="w-24 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          />
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                          {pct}%
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              pct >= 85
                                ? 'bg-emerald-100 text-emerald-800'
                                : pct >= 70
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {grade}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Student feedback remarks..."
                            value={marksRemarks[student.studentId] || ''}
                            onChange={(e) =>
                              setMarksRemarks((prev) => ({
                                ...prev,
                                [student.studentId]: e.target.value,
                              }))
                            }
                            className="w-full max-w-sm px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          />
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

      {/* TAB 5: ASSIGNED STUDENTS ROSTER */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Displaying <strong>{assignedStudents.length} students</strong> enrolled in Arthur Pendelton’s mathematics cohorts.
              </span>
            </div>
            <span className="text-slate-400">Financial records redacted per FERPA & school privacy policies</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedStudents.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={s.photoUrl}
                    alt={s.firstName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {s.firstName} {s.lastName}
                    </h4>
                    <p className="text-xs text-slate-500">{s.studentId} • Roll #{s.rollNumber || '01'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {s.className} - {s.sectionName}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                        {s.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Attendance Rate</span>
                    <span className="font-bold text-emerald-700">{s.attendancePercentage}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Academic Standing</span>
                    <span className="font-bold text-indigo-700">{s.academicStanding || 'Good Standing'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Guardian</span>
                    <span className="text-slate-700 font-medium truncate block">{s.parentName || 'Verified Guardian'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Emergency Contact</span>
                    <span className="text-slate-700 font-medium truncate block">{s.parentPhone || '+1 (555) 234-8900'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">
              Weekly Teaching Master Schedule
            </h3>
            <p className="text-xs text-slate-500 mb-6">Arthur Pendelton • Department of Advanced Mathematics</p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map((day) => {
                const dayPeriods = timetable.filter((p) => p.day === day);
                return (
                  <div key={day} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col">
                    <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-2 mb-3 text-center uppercase tracking-wider">
                      {day}
                    </div>

                    <div className="space-y-2 flex-1">
                      {dayPeriods.length === 0 ? (
                        <div className="text-[11px] text-slate-400 italic text-center py-6">
                          Independent Study / Prep
                        </div>
                      ) : (
                        dayPeriods.map((p) => (
                          <div
                            key={p.id}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition-colors"
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                              <span>P{p.periodNumber}</span>
                              <span>{p.time.split('-')[0]}</span>
                            </div>
                            <div className="text-xs font-bold text-slate-800 line-clamp-1">{p.subject}</div>
                            <div className="text-[11px] text-indigo-700 font-medium">{p.className} ({p.sectionName})</div>
                            <div className="text-[10px] text-slate-500 mt-1">{p.room}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CREATE HOMEWORK MODAL */}
      {showHomeworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">
              Create New Homework Assignment
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Dispatches real-time reminders to students and linked parents.
            </p>

            <form onSubmit={handleCreateHomework} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  placeholder="e.g. Euclidean Matrix Proofs Exercise 5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={hwSubject}
                    onChange={(e) => setHwSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
                  >
                    <option value="Advanced Mathematics">Advanced Mathematics</option>
                    <option value="Algebra & Functions">Algebra & Functions</option>
                    <option value="Geometry">Geometry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Target Cohort
                  </label>
                  <select
                    value={hwClass}
                    onChange={(e) => setHwClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
                  >
                    <option value="Class 6">Class 6 - Section A</option>
                    <option value="Class 8">Class 8 - Section A</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Submission Deadline
                </label>
                <input
                  type="date"
                  required
                  value={hwDueDate}
                  onChange={(e) => setHwDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Instructions & Guidelines
                </label>
                <textarea
                  rows={3}
                  required
                  value={hwDescription}
                  onChange={(e) => setHwDescription(e.target.value)}
                  placeholder="Provide explicit chapter problem numbers, expected formatting, and rubric criteria..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Attached Reference Worksheet (PDF / Doc)
                </label>
                <input
                  type="text"
                  value={hwAttachment}
                  onChange={(e) => setHwAttachment(e.target.value)}
                  placeholder="e.g. matrix_problems_set_5.pdf"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowHomeworkModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                >
                  Publish to Students & Parents
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
