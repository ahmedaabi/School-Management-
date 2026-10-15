import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import {
  Student,
  TeacherTimetablePeriod,
  HomeworkItem,
  ExamResultItem,
} from '../types';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  FileText,
  Upload,
  Sparkles,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';

export const StudentPortalPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'timetable' | 'homework' | 'grades' | 'attendance'>('overview');

  // Load student scoped record
  const student = useMemo(() => {
    const scopedList = dataService.getStudentsScoped(currentUser);
    return scopedList[0] || dataService.getStudentById('STU-001');
  }, [currentUser]);

  // Timetable for student's class
  const timetable = useMemo(() => {
    return dataService.getStudentTimetable(student?.className || 'Class 6', student?.sectionName || 'Section A');
  }, [student]);

  // Homework
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>(() => {
    return dataService.getHomeworkForStudent(student?.studentId || 'STU-001', student?.className || 'Class 6');
  });

  // Exam results
  const examResults = useMemo(() => {
    return dataService.getExamResults().filter(
      (e) => e.studentId === student?.studentId || e.studentId === 'STU-001'
    );
  }, [student]);

  // Submission simulation state
  const [submittedHwIds, setSubmittedHwIds] = useState<Record<string, boolean>>({});
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  const handleSubmitHomework = (hwId: string, hwTitle: string) => {
    setSubmittedHwIds((prev) => ({ ...prev, [hwId]: true }));
    setSubmissionSuccess(`Successfully uploaded solution for "${hwTitle}". Marked as Submitted!`);
    setTimeout(() => setSubmissionSuccess(null), 4000);
  };

  return (
    <div id="student-portal-page" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={student?.photoUrl || currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Active Scholar
              </span>
              <span className="text-xs text-slate-500">ID: {student?.studentId || 'STU-001'}</span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight mt-1">
              {currentUser.name}
            </h1>
            <p className="text-xs text-slate-600">
              {student?.className} ({student?.sectionName}) • Roll #{student?.rollNumber || '01'} • Homeroom Advisor: Arthur Pendelton
            </p>
          </div>
        </div>

        {/* Safe Student Badge */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-semibold text-slate-800">Student Profile Protected</div>
            <div className="text-[11px] text-slate-500">
              Personal academic file. Billing managed by verified guardians.
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto no-scrollbar pb-px">
        {[
          { id: 'overview', label: 'My Student Desk', icon: GraduationCap },
          { id: 'timetable', label: 'Class Timetable', icon: Clock },
          { id: 'homework', label: 'Assignments & Submissions', icon: BookOpen },
          { id: 'grades', label: 'My Exam Grades & GPA', icon: Award },
          { id: 'attendance', label: 'Attendance Record', icon: Calendar },
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

      {submissionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{submissionSuccess}</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Today's Homeroom</span>
              <div className="text-xl font-bold text-emerald-700 mt-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Present & On Time
              </div>
              <div className="text-xs text-slate-400 mt-1">Checked in at 08:15 AM</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Attendance Score</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {student?.attendancePercentage || 97}%
              </div>
              <div className="text-xs text-slate-500 mt-1">62 / 64 academic days attended</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Current Term GPA</span>
              <div className="text-2xl font-bold text-indigo-700 mt-2">3.85 / 4.0</div>
              <div className="text-xs text-emerald-600 mt-1 font-semibold">High Academic Honors</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Pending Tasks</span>
              <div className="text-2xl font-bold text-purple-700 mt-2">
                {homeworkList.filter((h) => !submittedHwIds[h.id]).length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Assignments awaiting submission</div>
            </div>
          </div>

          {/* Today's Schedule & Quick Assignments */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">Today's Class Schedule</h3>
                  <p className="text-xs text-slate-500">{student?.className} - {student?.sectionName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('timetable')}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Full Timetable →
                </button>
              </div>

              <div className="space-y-3">
                {timetable.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 font-bold text-indigo-800 flex items-center justify-center text-xs">
                        P{p.periodNumber}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{p.subject}</div>
                        <div className="text-[11px] text-slate-500">{p.teacherName} • {p.room}</div>
                      </div>
                    </div>

                    <span className="font-mono text-xs text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                      {p.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignments Due */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-base text-slate-900">Due Assignments</h3>
                  <span className="text-xs text-slate-400">Class 6</span>
                </div>

                <div className="space-y-3">
                  {homeworkList.slice(0, 3).map((hw) => {
                    const isSubmitted = submittedHwIds[hw.id];
                    return (
                      <div
                        key={hw.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">{hw.subject}</span>
                          <span className="text-[10px] text-red-600 font-semibold">Due {hw.dueDate}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] line-clamp-1 mb-2">{hw.title}</p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <span className="text-[10px] text-slate-400">{hw.assignedBy}</span>
                          {isSubmitted ? (
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Submitted
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSubmitHomework(hw.id, hw.title)}
                              className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              Submit Solution →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
                St. Augustine Academic Integrity Code Enforced
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">
              Class 6 - Section A Weekly Timetable
            </h3>
            <p className="text-xs text-slate-500 mb-6">Academic Year 2024–2025 • Term 2</p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map((day) => {
                const dayPeriods = timetable.filter((p) => p.day === day);
                return (
                  <div key={day} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-2 mb-3 text-center uppercase tracking-wider">
                      {day}
                    </div>

                    <div className="space-y-2">
                      {dayPeriods.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                            <span>P{p.periodNumber}</span>
                            <span>{p.time.split('-')[0]}</span>
                          </div>
                          <div className="text-xs font-bold text-slate-800 line-clamp-1">{p.subject}</div>
                          <div className="text-[11px] text-slate-500">{p.teacherName}</div>
                          <div className="text-[10px] text-indigo-700 mt-1 font-medium">{p.room}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOMEWORK & SUBMISSIONS */}
      {activeTab === 'homework' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">
              Coursework & Homework Submissions
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Download materials, solve problems, and submit your homework for teacher evaluation.
            </p>

            <div className="space-y-4">
              {homeworkList.map((hw) => {
                const isSubmitted = submittedHwIds[hw.id];
                return (
                  <div
                    key={hw.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          {hw.subject}
                        </span>
                        <span className="text-xs text-slate-500">Assigned by {hw.assignedBy}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{hw.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{hw.description}</p>
                      {hw.attachment && (
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 text-[11px] text-slate-700 mt-1">
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{hw.attachment}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="text-xs">
                        <span className="text-slate-400">Due Date: </span>
                        <span className="font-bold text-red-600">{hw.dueDate}</span>
                      </div>

                      {isSubmitted ? (
                        <div className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Submitted & Stamped
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSubmitHomework(hw.id, hw.title)}
                          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload Solution
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GRADES */}
      {activeTab === 'grades' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold">My Academic Transcript & Exam Marks</span>
              <span className="font-mono font-bold text-indigo-700">Cumulative GPA: 3.85 / 4.0</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Exam</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Teacher Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {examResults.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.subject}</td>
                      <td className="py-3 px-4 text-slate-600">{r.examName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {r.marksObtained} / {r.totalMarks}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                        "{r.remarks || 'Great progress in class'}"
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">
              Daily Attendance Roster
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              You have maintained a 97% attendance record this academic term.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs text-emerald-700 font-semibold block uppercase">Present Days</span>
                <span className="text-2xl font-bold text-emerald-800 mt-1 block">62</span>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-xs text-amber-700 font-semibold block uppercase">Late Arrivals</span>
                <span className="text-2xl font-bold text-amber-800 mt-1 block">1</span>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                <span className="text-xs text-indigo-700 font-semibold block uppercase">Current Streak</span>
                <span className="text-2xl font-bold text-indigo-800 mt-1 block">18 Days</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
