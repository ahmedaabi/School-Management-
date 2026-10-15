import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  ArrowUpDown,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';

export const MonthlyReportView: React.FC = () => {
  const classes = dataService.getClasses();
  const settings = dataService.getAttendanceSettings();

  // Selected filters
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // September
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'CLS-001');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'lowest' | 'highest' | 'name'>('lowest');

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const yearOptions = [
    { value: '2026', label: '2026' },
    { value: '2025', label: '2025' },
    { value: '2024', label: '2024' },
  ];

  // Fetch report data
  const reportData = dataService.getMonthlyAttendanceReport(
    selectedYear,
    selectedMonth,
    selectedClassId,
    selectedSectionId !== 'all' ? selectedSectionId : undefined
  );

  // Sorting
  const sortedData = [...reportData].sort((a, b) => {
    if (sortBy === 'lowest') return a.percentage - b.percentage;
    if (sortBy === 'highest') return b.percentage - a.percentage;
    return a.studentName.localeCompare(b.studentName);
  });

  // Calculate high-level summary for this class in this month
  const totalStudents = sortedData.length;
  const atRiskStudents = sortedData.filter((s) => s.percentage < settings.lowAttendanceThreshold).length;
  const averageRate =
    totalStudents > 0
      ? Number((sortedData.reduce((acc, curr) => acc + curr.percentage, 0) / totalStudents).toFixed(1))
      : 100;

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Roll No', 'Student ID', 'Student Name', 'Class', 'Present', 'Absent', 'Late', 'Excused', 'Total Sessions', 'Attendance %'];
    const rows = sortedData.map((s) => [
      s.rollNumber || '01',
      s.studentId,
      `"${s.studentName}"`,
      `"${s.className || selectedClass?.name}"`,
      s.present,
      s.absent,
      s.late,
      s.excused,
      s.totalSessions,
      `${s.percentage}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monthly_Attendance_${selectedClass?.name}_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Excel
  const handleExportExcel = () => {
    // For web preview, generating clean CSV with .xls mime tag is universally Excel-compatible without external native binary deps
    const headers = ['Roll No', 'Student ID', 'Student Name', 'Class', 'Present Days', 'Absent Days', 'Late Days', 'Excused Days', 'Total Sessions', 'Attendance Rate'];
    const rows = sortedData.map((s) => [
      s.rollNumber || '01',
      s.studentId,
      `"${s.studentName}"`,
      `"${s.className || selectedClass?.name}"`,
      s.present,
      s.absent,
      s.late,
      s.excused,
      s.totalSessions,
      `"${s.percentage}%"`,
    ]);

    const content = [headers.join('\t'), ...rows.map((e) => e.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_Report_${selectedClass?.name}_${selectedYear}_${selectedMonth}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Filter and Export Toolbar Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Monthly Attendance Consolidation Report
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive student attendance rates, unexcused absence aggregation, and at-risk monitoring
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
            >
              Excel Format
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5 text-slate-600" />}
            >
              Print Report
            </Button>
          </div>
        </div>

        {/* Filter Selection Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Month</label>
            <Select
              value={String(selectedMonth)}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              options={monthOptions}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Year</label>
            <Select
              value={String(selectedYear)}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              options={yearOptions}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Class</label>
            <Select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Section</label>
            <Select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              options={[
                { value: 'all', label: 'All Sections' },
                ...(selectedClass?.sections.map((s) => ({ value: s.id, label: s.name })) || []),
              ]}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sort Roster</label>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              options={[
                { value: 'lowest', label: 'Lowest Attendance First' },
                { value: 'highest', label: 'Highest Attendance First' },
                { value: 'name', label: 'Student Name (A-Z)' },
              ]}
            />
          </div>
        </div>

        {/* Quick Month KPI Badges */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
          <span className="font-medium text-slate-600">
            Class Average: <strong className="text-indigo-600 font-bold">{averageRate}%</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span className="font-medium text-slate-600">
            Students Enrolled: <strong className="text-slate-800">{totalStudents}</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span className="font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            At-Risk (&lt;{settings.lowAttendanceThreshold}%): <strong>{atRiskStudents} student(s)</strong>
          </span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Monthly Performance Ledger ({monthOptions.find((m) => m.value === String(selectedMonth))?.label} {selectedYear})
          </h3>
          <span className="text-[11px] text-slate-400">
            Institutional minimum target: {settings.lowAttendanceThreshold}%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Roll #</th>
                <th className="py-3 px-4 min-w-[180px]">Student Name</th>
                <th className="py-3 px-4 text-center">Present Days</th>
                <th className="py-3 px-4 text-center">Absent Days</th>
                <th className="py-3 px-4 text-center">Late Days</th>
                <th className="py-3 px-4 text-center">Excused Days</th>
                <th className="py-3 px-4 text-center">Total Sessions</th>
                <th className="py-3 px-4 min-w-[140px] text-right">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No student records found for the selected classroom.
                  </td>
                </tr>
              ) : (
                sortedData.map((row) => {
                  const isBelowThreshold = row.percentage < settings.lowAttendanceThreshold;

                  return (
                    <tr
                      key={row.studentId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isBelowThreshold ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* Roll Number */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-600">
                        {row.rollNumber || '01'}
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {row.studentName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {row.studentId}
                            </span>
                          </div>
                          {isBelowThreshold && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded border border-rose-200"
                              title="Attendance rate below institutional threshold"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Low
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Present Days */}
                      <td className="py-3.5 px-4 text-center font-semibold text-emerald-700">
                        {row.present}
                      </td>

                      {/* Absent Days */}
                      <td
                        className={`py-3.5 px-4 text-center font-semibold ${
                          row.absent > 0 ? 'text-rose-700' : 'text-slate-400'
                        }`}
                      >
                        {row.absent}
                      </td>

                      {/* Late Days */}
                      <td
                        className={`py-3.5 px-4 text-center font-semibold ${
                          row.late > 0 ? 'text-amber-700' : 'text-slate-400'
                        }`}
                      >
                        {row.late}
                      </td>

                      {/* Excused Days */}
                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {row.excused}
                      </td>

                      {/* Total Sessions */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                        {row.totalSessions}
                      </td>

                      {/* Attendance % with visual progress bar */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden hidden sm:block">
                            <div
                              className={`h-2 rounded-full ${
                                isBelowThreshold
                                  ? 'bg-rose-500'
                                  : row.percentage >= 90
                                  ? 'bg-emerald-500'
                                  : 'bg-indigo-500'
                              }`}
                              style={{ width: `${Math.min(row.percentage, 100)}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono font-bold text-xs ${
                              isBelowThreshold ? 'text-rose-700' : 'text-slate-900'
                            }`}
                          >
                            {row.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
