import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  XCircle,
  Users,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
} from 'lucide-react';
import { ExamAnalytics, Exam } from '../../types/exam';
import { examService } from '../../services/examService';
import { dataService } from '../../services/dataService';
import { User } from '../../types';

interface ResultAnalyticsTabProps {
  currentUser: User;
  initialExamId?: string;
}

export const ResultAnalyticsTab: React.FC<ResultAnalyticsTabProps> = ({
  currentUser,
  initialExamId,
}) => {
  const exams = examService.getExams();
  const classes = dataService.getClasses();
  const allStudents = dataService.getStudents();

  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialExamId || exams[0]?.id || ''
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || 'CLS-001'
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>('All');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('All');
  const [trendStudentId, setTrendStudentId] = useState<string>(
    allStudents[0]?.studentId || 'STU-001'
  );

  const selectedClassObj = classes.find((c) => c.id === selectedClassId);

  // Compute analytics
  const analytics: ExamAnalytics = examService.getExamAnalytics(
    selectedExamId,
    selectedClassId,
    selectedSectionId === 'All' ? undefined : selectedSectionId,
    selectedSubjectId === 'All' ? undefined : selectedSubjectId
  );

  // Student trend history
  const studentTrends = examService.getStudentPerformanceTrend(trendStudentId);
  const trendStudent = allStudents.find((s) => s.studentId === trendStudentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Institutional Result Analytics & Benchmarks
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Evaluate cohort performance, subject mastery disparities, grade bell-curves, and individual student progress trajectories.
          </p>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Select Examination</label>
          <select
            id="analytics-select-exam"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name} ({exam.academicYear})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Class Cohort</label>
          <select
            id="analytics-select-class"
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedSectionId('All');
            }}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Homeroom Section</label>
          <select
            id="analytics-select-section"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Sections Combined</option>
            {selectedClassObj?.sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Scope</label>
          <select
            id="analytics-select-subject"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Enrolled Subjects</option>
            {analytics.subjectPerformance.map((sub) => (
              <option key={sub.subjectName} value={sub.subjectName}>
                {sub.subjectName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Cohort Average</span>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">
              {analytics.classAveragePercentage}%
            </div>
            <span className="text-xs text-slate-400">Mean grade score</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Pass Percentage</span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              {analytics.passPercentage}%
            </div>
            <span className="text-xs text-slate-400">
              {analytics.totalStudents} assessed
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Highest Score</span>
            <div className="text-2xl font-black text-amber-600 mt-0.5">
              {analytics.highestPercentage}%
            </div>
            <span className="text-xs text-slate-400">Top performance</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Lowest Score</span>
            <div className="text-2xl font-black text-rose-600 mt-0.5">
              {analytics.lowestPercentage}%
            </div>
            <span className="text-xs text-slate-400">Remediation boundary</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance & Weak-Subject Detector */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Subject-Level Performance Analysis</h3>
              <p className="text-xs text-slate-500">
                Identifies curriculum strengths and flagged weak-performing subjects (&lt;65% mean).
              </p>
            </div>
            <BookOpen className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-3.5">
            {analytics.subjectPerformance.map((sub) => (
              <div key={sub.subjectName} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{sub.subjectName}</span>
                    {sub.isWeak ? (
                      <span className="text-xs font-bold px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Flagged Weak
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                        Proficient
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{sub.averagePercentage}% Avg</span>
                    <span className="text-slate-400 ml-1.5 font-mono">
                      (High: {sub.highestScore} / Low: {sub.lowestScore})
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all ${
                      sub.isWeak ? 'bg-rose-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(sub.averagePercentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                  <span>Pass Rate: {sub.passRate}%</span>
                  <span>Scale: {sub.totalMarks} Total Marks</span>
                </div>
              </div>
            ))}

            {analytics.subjectPerformance.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">
                No subject score batches found for this cohort.
              </p>
            )}
          </div>
        </div>

        {/* Grade Distribution Bell Curve */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Grade Distribution Bell Curve</h3>
              <p className="text-xs text-slate-500">
                Frequency histogram of letter grades awarded across this exam cohort.
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-2.5 pt-2">
            {analytics.gradeDistribution.map((item) => (
              <div key={item.grade} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-bold font-mono text-slate-800 shrink-0">
                  {item.grade}
                </span>

                <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden relative">
                  <div
                    className="h-full bg-indigo-600 rounded-md transition-all flex items-center px-2"
                    style={{
                      width: `${Math.max(item.percentage, item.count > 0 ? 8 : 0)}%`,
                    }}
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-700">
                    {item.count > 0 ? `${item.count} students (${item.percentage}%)` : '0'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Pass Threshold: Standard Grade E (&gt;=40%)</span>
            <span>Distinction Threshold: Grade A (&gt;=80%)</span>
          </div>
        </div>
      </div>

      {/* Student Longitudinal Performance Trend */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Student Longitudinal Performance Trend
            </h3>
            <p className="text-xs text-slate-500">
              Trace chronological score progression across multiple published examinations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Student:</span>
            <select
              id="select-trend-student"
              value={trendStudentId}
              onChange={(e) => setTrendStudentId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              {allStudents.map((s) => (
                <option key={s.id} value={s.studentId}>
                  {s.firstName} {s.lastName} ({s.studentId})
                </option>
              ))}
            </select>
          </div>
        </div>

        {studentTrends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {studentTrends.map((trend, i) => (
              <div
                key={i}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-mono text-slate-400">
                    AY {trend.academicYear}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">
                    {trend.examName}
                  </h4>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-black text-indigo-700">
                      {trend.percentage}%
                    </span>
                    <span className="text-xs text-slate-400 block">Overall percentage</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200">
                    Grade {trend.grade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No published historical examinations logged yet for {trendStudent?.firstName || 'this student'}.
          </div>
        )}
      </div>
    </div>
  );
};
