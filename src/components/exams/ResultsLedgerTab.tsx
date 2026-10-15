import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  AlertCircle,
  Award,
  TrendingUp,
  FileText,
  Eye,
  Send,
  Lock,
  Globe,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { StudentCalculatedResult, Exam } from '../../types/exam';
import { examService } from '../../services/examService';
import { dataService } from '../../services/dataService';
import { User } from '../../types';

interface ResultsLedgerTabProps {
  currentUser: User;
  initialExamId?: string;
  onOpenReportCard?: (examId: string, studentId: string) => void;
}

export const ResultsLedgerTab: React.FC<ResultsLedgerTabProps> = ({
  currentUser,
  initialExamId,
  onOpenReportCard,
}) => {
  const exams = examService.getExams();
  const classes = dataService.getClasses();

  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialExamId || exams[0]?.id || ''
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || 'CLS-001'
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'PASS' | 'FAIL'>('All');

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Selected student for mark sheet modal preview
  const [selectedStudentResult, setSelectedStudentResult] = useState<StudentCalculatedResult | null>(
    null
  );

  const currentExam = exams.find((e) => e.id === selectedExamId);
  const currentClassObj = classes.find((c) => c.id === selectedClassId);

  // Calculate results dynamically using the examService calculation engine
  const results = examService.calculateExamResults(
    selectedExamId,
    selectedClassId,
    selectedSectionId === 'All' ? undefined : selectedSectionId,
    true
  );

  const isSuperOrPrincipal =
    currentUser.role === 'super_admin' || currentUser.role === 'principal';
  const isAdmin = currentUser.role === 'admin' || isSuperOrPrincipal;

  const isPublished =
    results.length > 0 && (results[0].isPublished || currentExam?.status === 'PUBLISHED');

  const handlePublishResults = () => {
    if (!currentExam) return;
    const res = examService.publishExamResults(
      selectedExamId,
      selectedClassId,
      selectedSectionId === 'All' ? undefined : selectedSectionId,
      currentUser
    );

    if (!res.success) {
      setActionMessage({
        type: 'error',
        text: res.error || 'Failed to publish results.',
      });
    } else {
      setActionMessage({
        type: 'success',
        text: `Results successfully published! ${res.count} batches updated. Parents and students can now view verified transcripts in their portals.`,
      });
      setTimeout(() => setActionMessage(null), 6000);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;

    const headers = [
      'Position',
      'Roll Number',
      'Student Name',
      'Class',
      'Section',
      'Total Marks',
      'Obtained Marks',
      'Percentage',
      'Overall Grade',
      'GPA',
      'Status',
    ];

    const rows = results.map((r) => [
      r.position || '—',
      `"${r.rollNumber}"`,
      `"${r.studentName}"`,
      `"${r.className}"`,
      `"${r.sectionName}"`,
      r.totalMaxMarks,
      r.totalObtainedMarks,
      `${r.overallPercentage}%`,
      r.overallGrade,
      r.overallGpa,
      r.overallStatus,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Results_${currentExam?.name.replace(/\s+/g, '_')}_${currentClassObj?.name}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter results
  const filteredResults = results.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.overallStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary metrics
  const totalCount = results.length;
  const passCount = results.filter((r) => r.overallStatus === 'PASS').length;
  const failCount = totalCount - passCount;
  const passRate = totalCount > 0 ? Number(((passCount / totalCount) * 100).toFixed(1)) : 0;
  const avgPercentage =
    totalCount > 0
      ? Number((results.reduce((a, b) => a + b.overallPercentage, 0) / totalCount).toFixed(1))
      : 0;
  const topPercentage =
    totalCount > 0 ? Math.max(...results.map((r) => r.overallPercentage)) : 0;

  const getRankBadge = (pos?: number) => {
    if (!pos) return <span className="text-slate-400 font-mono">—</span>;
    if (pos === 1)
      return (
        <span className="inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full">
          <Award className="w-3.5 h-3.5 text-amber-600" /> 1st
        </span>
      );
    if (pos === 2)
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-800 border border-slate-300 rounded-full">
          2nd
        </span>
      );
    if (pos === 3)
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
          3rd
        </span>
      );
    return <span className="font-mono text-xs font-semibold text-slate-600">#{pos}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Results Ledger & Ranks
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            View derived academic scores, class rankings, grade distributions, and publish verified report cards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-results-csv"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>

          {isAdmin && (
            <button
              id="btn-publish-official-results"
              onClick={handlePublishResults}
              disabled={isPublished}
              className={`inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors ${
                isPublished
                  ? 'bg-emerald-600 opacity-90 cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isPublished ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Officially Published
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  Publish Official Results
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Publication Status Notification Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
          isPublished
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-3">
          {isPublished ? (
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          ) : (
            <Lock className="w-6 h-6 text-amber-600 shrink-0" />
          )}
          <div>
            <div className="text-sm font-bold">
              {isPublished
                ? 'Official Results Published to Portals'
                : 'Pending Official Administrative Publication'}
            </div>
            <div className="text-xs opacity-85 mt-0.5">
              {isPublished
                ? 'Parents and students are actively granted transcript access in their respective dashboards.'
                : 'Results are currently internal for academic review. Click "Publish Official Results" above to release transcripts.'}
            </div>
          </div>
        </div>

        <span
          className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
            isPublished
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}
        >
          {isPublished ? 'PUBLIC' : 'DRAFT LEDGER'}
        </span>
      </div>

      {/* Action Messages */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Examination</label>
          <select
            id="select-ledger-exam"
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
          <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
          <select
            id="select-ledger-class"
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
          <label className="block text-xs font-semibold text-slate-600 mb-1">Section</label>
          <select
            id="select-ledger-section"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Homeroom Sections</option>
            {currentClassObj?.sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Result Status</label>
          <select
            id="select-ledger-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Students (Pass & Fail)</option>
            <option value="PASS">Pass Only</option>
            <option value="FAIL">Fail / Re-sit Only</option>
          </select>
        </div>
      </div>

      {/* Cohort Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Cohort Assessed</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <span className="text-xs text-slate-400">Enrolled in cohort</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Pass Rate</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{passRate}%</div>
          <span className="text-xs text-slate-400">
            {passCount} passed / {failCount} failed
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Class Average</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">{avgPercentage}%</div>
          <span className="text-xs text-slate-400">Aggregate mean</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Highest Score</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{topPercentage}%</div>
          <span className="text-xs text-slate-400">Valedictorian benchmark</span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Student Performance & Position Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rankings computed dynamically based on institutional grading rules.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-ledger"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or roll..."
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-20 text-center">Rank</th>
                <th className="py-3 px-4 w-16">Roll</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Subject Breakdown</th>
                <th className="py-3 px-4 text-center">Total Marks</th>
                <th className="py-3 px-4 text-center">% & GPA</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4 text-center">Result</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredResults.map((result) => (
                <tr key={result.studentId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-center">
                    {getRankBadge(result.position)}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-600">
                    {result.rollNumber}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{result.studentName}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      {result.studentId} &bull; {result.sectionName}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {result.subjects.map((sub) => (
                        <span
                          key={sub.subjectId}
                          title={`${sub.subjectName}: ${
                            sub.isAbsent ? 'Absent' : `${sub.marksObtained}/${sub.totalMarks}`
                          }`}
                          className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                            sub.isAbsent
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : sub.isPassed
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-100 text-rose-800 font-bold'
                          }`}
                        >
                          {sub.subjectName.substring(0, 4)}: {sub.isAbsent ? 'Abs' : sub.grade}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono">
                    <span className="font-bold text-slate-900">
                      {result.totalObtainedMarks}
                    </span>
                    <span className="text-slate-400 text-xs"> / {result.totalMaxMarks}</span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="font-bold text-slate-900">{result.overallPercentage}%</div>
                    <div className="text-xs text-slate-500 font-mono">{result.overallGpa} GPA</div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="text-xs font-bold px-2 py-0.5 rounded border bg-indigo-50 border-indigo-200 text-indigo-700">
                      {result.overallGrade}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        result.overallStatus === 'PASS'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {result.overallStatus}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        id={`btn-view-mark-sheet-${result.studentId}`}
                        onClick={() => setSelectedStudentResult(result)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View detailed subject marks"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {onOpenReportCard && (
                        <button
                          id={`btn-open-report-card-${result.studentId}`}
                          onClick={() =>
                            onOpenReportCard(result.examId, result.studentId)
                          }
                          className="px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold transition-colors"
                        >
                          Report Card
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredResults.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">
              No results found for this exam and class. Ensure marks have been entered and submitted.
            </div>
          )}
        </div>
      </div>

      {/* Student Marks Sheet Detail Modal */}
      {selectedStudentResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedStudentResult.studentName} &mdash; Mark Sheet
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedStudentResult.className} - {selectedStudentResult.sectionName} &bull; Roll{' '}
                  {selectedStudentResult.rollNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentResult(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 uppercase font-semibold">
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 text-center">Total</th>
                    <th className="py-2.5 px-3 text-center">Obtained</th>
                    <th className="py-2.5 px-3 text-center">%</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedStudentResult.subjects.map((sub) => (
                    <tr key={sub.subjectId}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {sub.subjectName}
                      </td>
                      <td className="py-2.5 px-3 text-center">{sub.totalMarks}</td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {sub.isAbsent ? (
                          <span className="text-rose-600">Absent</span>
                        ) : (
                          sub.marksObtained
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">{sub.percentage}%</td>
                      <td className="py-2.5 px-3 text-center font-bold text-indigo-600">
                        {sub.grade}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            sub.isPassed
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {sub.isPassed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Box */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-slate-500">Aggregate</div>
                  <div className="text-base font-black text-slate-900">
                    {selectedStudentResult.totalObtainedMarks} /{' '}
                    {selectedStudentResult.totalMaxMarks}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Overall Grade</div>
                  <div className="text-base font-black text-indigo-700">
                    {selectedStudentResult.overallGrade} ({selectedStudentResult.overallPercentage}%)
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Class Position</div>
                  <div className="text-base font-black text-amber-600">
                    {selectedStudentResult.position ? `#${selectedStudentResult.position}` : '—'}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStudentResult(null)}
                  className="px-4 py-2 text-sm text-slate-600 font-medium"
                >
                  Close
                </button>
                {onOpenReportCard && (
                  <button
                    onClick={() => {
                      onOpenReportCard(
                        selectedStudentResult.examId,
                        selectedStudentResult.studentId
                      );
                      setSelectedStudentResult(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Open Full Report Card
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
