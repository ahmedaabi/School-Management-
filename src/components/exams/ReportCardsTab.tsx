import React, { useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  User as UserIcon,
  ShieldCheck,
  Building,
  School,
  FileText,
  Layout,
} from 'lucide-react';
import { ReportCardData, Exam } from '../../types/exam';
import { examService } from '../../services/examService';
import { dataService } from '../../services/dataService';
import { User, Student } from '../../types';

interface ReportCardsTabProps {
  currentUser: User;
  initialExamId?: string;
  initialStudentId?: string;
}

export const ReportCardsTab: React.FC<ReportCardsTabProps> = ({
  currentUser,
  initialExamId,
  initialStudentId,
}) => {
  const exams = examService.getExams();
  const classes = dataService.getClasses();
  const allStudents = dataService.getStudents();
  const settings = examService.getResultSettings();

  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialExamId || exams[0]?.id || ''
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || 'CLS-001'
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || allStudents[0]?.studentId || 'STU-001'
  );
  const [template, setTemplate] = useState<'standard' | 'modern' | 'compact'>('standard');

  const handlePrint = () => {
    window.print();
  };

  // Enrolled students in selected class
  const classStudents = allStudents.filter(
    (s) => s.classId === selectedClassId || s.className === classes.find((c) => c.id === selectedClassId)?.name
  );

  // Generate Report Card Data
  const reportCard: ReportCardData | null = examService.generateReportCard(
    selectedExamId,
    selectedStudentId,
    template
  );

  return (
    <div className="space-y-6">
      {/* Non-Printable Configuration Header */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Official Academic Report Card Generator
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Print official transcripts, semester evaluations, attendance records, and faculty signatures.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-print-report-card"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Toolbar Selectors */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Examination</label>
            <select
              id="select-report-exam"
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
              id="select-report-class"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const firstStu = allStudents.find((s) => s.classId === e.target.value);
                if (firstStu) setSelectedStudentId(firstStu.studentId);
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">Student</label>
            <select
              id="select-report-student"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {classStudents.map((stu) => (
                <option key={stu.id} value={stu.studentId}>
                  Roll {stu.rollNumber} - {stu.firstName} {stu.lastName} ({stu.studentId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Template Style</label>
            <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
              <button
                id="btn-template-standard"
                onClick={() => setTemplate('standard')}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                  template === 'standard'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Standard
              </button>
              <button
                id="btn-template-modern"
                onClick={() => setTemplate('modern')}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                  template === 'modern'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Modern
              </button>
              <button
                id="btn-template-compact"
                onClick={() => setTemplate('compact')}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                  template === 'compact'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Compact
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* REPORT CARD CANVAS */}
      {reportCard ? (
        <div
          id="official-report-card"
          className={`bg-white mx-auto shadow-md border print:border-none print:shadow-none print:m-0 transition-all ${
            template === 'compact' ? 'max-w-3xl p-6' : 'max-w-4xl p-8'
          }`}
          style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
        >
          {/* ==================================================== */}
          {/* TEMPLATE: MODERN */}
          {/* ==================================================== */}
          {template === 'modern' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-sm">
                    SA
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {settings.schoolName}
                    </h1>
                    <p className="text-xs text-slate-500">
                      {settings.schoolAddress} &bull; {settings.schoolPhone}
                    </p>
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                      Accredited Department of Elementary & Secondary Education
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md">
                    OFFICIAL TRANSCRIPT
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-2">{reportCard.exam.name}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    Academic Year {reportCard.exam.academicYear}
                  </div>
                </div>
              </div>

              {/* Student Metadata Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider">Student Name</span>
                  <span className="font-bold text-slate-900 text-sm">{reportCard.student.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider">Student ID / Roll</span>
                  <span className="font-bold text-slate-900 text-sm font-mono">
                    {reportCard.student.studentId} (Roll #{reportCard.student.rollNumber})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider">Class & Section</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {reportCard.student.className} &ndash; {reportCard.student.sectionName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider">Parent / Guardian</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {reportCard.student.parentName || 'Verified Guardian'}
                  </span>
                </div>
              </div>

              {/* Subject Results Table */}
              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-3 text-center">Max Marks</th>
                      <th className="py-3 px-3 text-center">Passing</th>
                      <th className="py-3 px-3 text-center">Obtained</th>
                      <th className="py-3 px-3 text-center">Percentage</th>
                      <th className="py-3 px-3 text-center">Grade</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4">Faculty Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportCard.results.map((sub, i) => (
                      <tr key={sub.subjectId} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-3 px-4 font-bold text-slate-900">{sub.subjectName}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">{sub.totalMarks}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">{sub.passingMarks}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          {sub.isAbsent ? (
                            <span className="text-rose-600 font-black">ABSENT</span>
                          ) : (
                            sub.marksObtained
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-medium">
                          {sub.isAbsent ? '—' : `${sub.percentage}%`}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-indigo-600">
                          {sub.grade}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              sub.isPassed
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {sub.isPassed ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 italic text-xs">{sub.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Overall Performance & Attendance Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Score Summary */}
                <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100 flex flex-col justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2">
                    Academic Achievement Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded-lg border border-indigo-100/80">
                      <span className="text-xs text-slate-500 block">Total Marks</span>
                      <span className="text-sm font-black text-slate-900">
                        {reportCard.overall.totalObtainedMarks} / {reportCard.overall.totalMaxMarks}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100/80">
                      <span className="text-xs text-slate-500 block">Percentage / Grade</span>
                      <span className="text-sm font-black text-indigo-700">
                        {reportCard.overall.percentage}% ({reportCard.overall.grade})
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100/80">
                      <span className="text-xs text-slate-500 block">Class Position</span>
                      <span className="text-sm font-black text-amber-600">
                        {reportCard.overall.position ? `#${reportCard.overall.position}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-indigo-100">
                    <span className="text-slate-600">Overall Result:</span>
                    <span
                      className={`font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        reportCard.overall.status === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {reportCard.overall.status}
                    </span>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Attendance Record
                  </h4>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block">Working</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {reportCard.attendanceSummary.totalDays}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block">Present</span>
                      <span className="font-bold text-emerald-600 font-mono">
                        {reportCard.attendanceSummary.present}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block">Absent</span>
                      <span className="font-bold text-rose-600 font-mono">
                        {reportCard.attendanceSummary.absent}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block">Rate</span>
                      <span className="font-bold text-indigo-600 font-mono">
                        {reportCard.attendanceSummary.attendancePercentage}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Minimum requirement: 85% attendance for term credit validation.
                  </p>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Class Teacher Remarks:</span>
                  <p className="text-slate-600 italic">"{reportCard.teacherRemarks}"</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Principal Commendation:</span>
                  <p className="text-slate-600 italic">"{reportCard.principalRemarks}"</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 gap-8 text-center text-xs text-slate-600">
                <div>
                  <div className="border-b border-slate-300 pb-1 font-serif text-slate-800 italic">
                    Arthur Pendelton
                  </div>
                  <span className="mt-1 block font-medium">Class Teacher Signature</span>
                </div>
                <div>
                  <div className="border-b border-slate-300 pb-1 font-serif text-slate-800 italic">
                    Dr. Eleanor Vance, Ed.D.
                  </div>
                  <span className="mt-1 block font-medium">Principal Seal & Signature</span>
                </div>
                <div>
                  <div className="border-b border-slate-300 pb-1 font-mono text-slate-400">
                    &nbsp;
                  </div>
                  <span className="mt-1 block font-medium">Parent / Guardian Signature</span>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TEMPLATE: STANDARD (CLASSIC FORMAL) */}
          {/* ==================================================== */}
          {template === 'standard' && (
            <div className="space-y-6 border-4 border-double border-slate-800 p-6 rounded-lg">
              {/* Institutional Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4">
                <div className="w-16 h-16 mx-auto mb-2 border-2 border-slate-900 rounded-full flex items-center justify-center font-serif text-2xl font-black">
                  SA
                </div>
                <h1 className="text-2xl font-serif font-black tracking-wide text-slate-900 uppercase">
                  {settings.schoolName}
                </h1>
                <p className="text-xs text-slate-600 mt-0.5 uppercase tracking-wider font-mono">
                  {settings.schoolAddress} &bull; Tel: {settings.schoolPhone}
                </p>
                <div className="mt-3 inline-block px-4 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest">
                  Progress Report &bull; {reportCard.exam.name}
                </div>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs border border-slate-300 p-3 bg-slate-50">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600 font-semibold">Student Name:</span>
                  <span className="font-bold text-slate-900 uppercase">{reportCard.student.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600 font-semibold">Student ID:</span>
                  <span className="font-mono font-bold text-slate-900">{reportCard.student.studentId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600 font-semibold">Class & Section:</span>
                  <span className="font-bold text-slate-900">
                    {reportCard.student.className} ({reportCard.student.sectionName})
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600 font-semibold">Roll Number:</span>
                  <span className="font-mono font-bold text-slate-900">{reportCard.student.rollNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600 font-semibold">Academic Year:</span>
                  <span className="font-bold text-slate-900">{reportCard.student.academicYear}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600 font-semibold">Parent / Guardian:</span>
                  <span className="font-bold text-slate-900">{reportCard.student.parentName || '—'}</span>
                </div>
              </div>

              {/* Formal Academic Performance Table */}
              <table className="w-full text-left border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold uppercase text-center border-b border-slate-400">
                    <th className="py-2.5 px-3 text-left border-r border-slate-300">Subject</th>
                    <th className="py-2.5 px-2 border-r border-slate-300">Max</th>
                    <th className="py-2.5 px-2 border-r border-slate-300">Pass</th>
                    <th className="py-2.5 px-2 border-r border-slate-300">Obtained</th>
                    <th className="py-2.5 px-2 border-r border-slate-300">%</th>
                    <th className="py-2.5 px-2 border-r border-slate-300">Grade</th>
                    <th className="py-2.5 px-2 border-r border-slate-300">Status</th>
                    <th className="py-2.5 px-3 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {reportCard.results.map((sub) => (
                    <tr key={sub.subjectId} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-300">
                        {sub.subjectName}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">
                        {sub.totalMarks}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">
                        {sub.passingMarks}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-300 font-mono font-bold">
                        {sub.isAbsent ? <span className="text-rose-600">Absent</span> : sub.marksObtained}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">
                        {sub.isAbsent ? '—' : `${sub.percentage}%`}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-300 font-bold">
                        {sub.grade}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-300 font-bold">
                        <span className={sub.isPassed ? 'text-emerald-700' : 'text-rose-700'}>
                          {sub.isPassed ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="py-2 px-3 italic text-slate-600">{sub.remarks}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <td className="py-2 px-3 border-r border-slate-300">TOTAL / AGGREGATE</td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">
                      {reportCard.overall.totalMaxMarks}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">—</td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 font-mono text-indigo-700">
                      {reportCard.overall.totalObtainedMarks}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">
                      {reportCard.overall.percentage}%
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300">
                      {reportCard.overall.grade}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300">
                      {reportCard.overall.status}
                    </td>
                    <td className="py-2 px-3">Rank #{reportCard.overall.position || '—'}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Attendance & Grading Scale Footnotes */}
              <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 p-3">
                <div>
                  <h5 className="font-bold text-slate-800 uppercase mb-1">Attendance Record</h5>
                  <p className="text-slate-600">
                    Days Conducted: <strong>{reportCard.attendanceSummary.totalDays}</strong> | Days Present:{' '}
                    <strong>{reportCard.attendanceSummary.present}</strong> | Attendance Rate:{' '}
                    <strong>{reportCard.attendanceSummary.attendancePercentage}%</strong>
                  </p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 uppercase mb-1">Grading Scale System</h5>
                  <p className="text-slate-600 font-mono">
                    A+ (90-100%) &bull; A (80-89%) &bull; B (70-79%) &bull; C (60-69%) &bull; Pass: &gt;=40%
                  </p>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2 text-xs border border-slate-300 p-3 bg-slate-50">
                <div>
                  <span className="font-bold text-slate-900">Faculty Remarks: </span>
                  <span className="text-slate-700 italic">{reportCard.teacherRemarks}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900">Principal Remarks: </span>
                  <span className="text-slate-700 italic">{reportCard.principalRemarks}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs text-slate-800">
                <div>
                  <div className="border-b border-slate-400 pb-1 font-serif italic">Arthur Pendelton</div>
                  <span className="mt-1 block font-bold">Class Teacher</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-1 font-serif italic">Dr. Eleanor Vance</div>
                  <span className="mt-1 block font-bold">Principal</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-1">&nbsp;</div>
                  <span className="mt-1 block font-bold">Parent / Guardian Signature</span>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TEMPLATE: COMPACT (SINGLE PAGE RECORD) */}
          {/* ==================================================== */}
          {template === 'compact' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{settings.schoolName}</h2>
                  <p className="text-slate-500 text-xs">Compact Transcript Record &bull; {reportCard.exam.name}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-indigo-700 text-sm">{reportCard.overall.grade}</span>
                  <span className="text-slate-500 block">
                    {reportCard.overall.percentage}% | Rank #{reportCard.overall.position || '—'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Name</span>
                  <span className="font-bold">{reportCard.student.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">ID / Roll</span>
                  <span className="font-mono font-bold">
                    {reportCard.student.studentId} (#{reportCard.student.rollNumber})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Class</span>
                  <span className="font-bold">{reportCard.student.className}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Attendance</span>
                  <span className="font-bold text-emerald-600">
                    {reportCard.attendanceSummary.attendancePercentage}%
                  </span>
                </div>
              </div>

              <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold">
                    <th className="p-2">Subject</th>
                    <th className="p-2 text-center">Total</th>
                    <th className="p-2 text-center">Score</th>
                    <th className="p-2 text-center">%</th>
                    <th className="p-2 text-center">Grade</th>
                    <th className="p-2 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportCard.results.map((sub) => (
                    <tr key={sub.subjectId}>
                      <td className="p-2 font-medium">{sub.subjectName}</td>
                      <td className="p-2 text-center font-mono">{sub.totalMarks}</td>
                      <td className="p-2 text-center font-bold font-mono">
                        {sub.isAbsent ? <span className="text-rose-600">Abs</span> : sub.marksObtained}
                      </td>
                      <td className="p-2 text-center font-mono">{sub.isAbsent ? '—' : `${sub.percentage}%`}</td>
                      <td className="p-2 text-center font-bold text-indigo-600">{sub.grade}</td>
                      <td className="p-2 text-center font-bold">
                        <span className={sub.isPassed ? 'text-emerald-700' : 'text-rose-700'}>
                          {sub.isPassed ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-2 bg-slate-50 border rounded text-slate-600 italic">
                "{reportCard.teacherRemarks}"
              </div>

              <div className="pt-4 flex justify-between text-xs text-slate-500 border-t">
                <span>Verified: Academic Registry</span>
                <span>Date: {reportCard.generatedDate}</span>
                <span>Principal: Dr. Eleanor Vance</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-600 font-medium">
            Report card data unavailable for selected student. Verify that exam marks are entered.
          </p>
        </div>
      )}
    </div>
  );
};
