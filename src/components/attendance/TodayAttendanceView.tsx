import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Save,
  CheckCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { AttendanceStatus, ClassItem, Student } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';

interface StudentRowState {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: AttendanceStatus;
  remarks: string;
}

export const TodayAttendanceView: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const classes = dataService.getClasses();
  const settings = dataService.getAttendanceSettings();

  // Selected filters
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (currentUser?.role === 'teacher') {
      return 'CLS-001'; // Default teacher classroom Class 6
    }
    return classes[0]?.id || 'CLS-001';
  });

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const [selectedSectionId, setSelectedSectionId] = useState<string>(() => {
    return selectedClass?.sections[0]?.id || 'SEC-001';
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]; // Current date YYYY-MM-DD
  });

  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    settings.mode === 'period' ? 'Period 1 - Mathematics' : 'Daily Homeroom'
  );

  const [studentRows, setStudentRows] = useState<StudentRowState[]>([]);
  const [isDuplicateDetected, setIsDuplicateDetected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Available periods when in period mode
  const periodOptions = [
    { value: 'Daily Homeroom', label: 'Daily Homeroom (Morning Roll Call)' },
    { value: 'Period 1 - Mathematics', label: 'Period 1 — Mathematics' },
    { value: 'Period 2 - English Literature', label: 'Period 2 — English Literature' },
    { value: 'Period 3 - General Science', label: 'Period 3 — General Science' },
    { value: 'Period 4 - Social Studies', label: 'Period 4 — Social Studies' },
    { value: 'Period 5 - Physical Education', label: 'Period 5 — Physical Education' },
  ];

  // Load students and check existing attendance whenever class, section, date, or period changes
  useEffect(() => {
    if (!selectedClass) return;

    const allStudents = dataService.getStudents();
    const classStudents = allStudents.filter((s) => {
      const matchClass = s.classId === selectedClassId;
      const matchSec = !selectedSectionId || s.sectionId === selectedSectionId;
      return matchClass && matchSec;
    });

    const currentAttendanceLogs = dataService.getAttendanceRecords();

    // Check if attendance already recorded for this combination
    const existingSessionLogs = currentAttendanceLogs.filter((l) => {
      const matchDate = l.date === selectedDate;
      const matchClass = l.classId === selectedClassId;
      const matchPeriod =
        settings.mode === 'period'
          ? (l.period || 'Daily Homeroom') === selectedPeriod
          : true;
      return matchDate && matchClass && matchPeriod;
    });

    setIsDuplicateDetected(existingSessionLogs.length > 0);

    // Populate rows: if already recorded, pre-fill with saved status; otherwise default to Present
    const rows: StudentRowState[] = classStudents.map((s) => {
      const existing = existingSessionLogs.find((l) => l.studentId === s.studentId);
      return {
        studentId: s.studentId,
        studentName: `${s.firstName} ${s.lastName}`,
        rollNumber: s.rollNumber || '01',
        status: existing ? existing.status : 'Present',
        remarks: existing?.remarks || '',
      };
    });

    setStudentRows(rows);
    setSaveSuccessMessage(null);
  }, [selectedClassId, selectedSectionId, selectedDate, selectedPeriod, settings.mode]);

  // Update a single student status
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  // Update remarks
  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudentRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, remarks } : r))
    );
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    setStudentRows((prev) => prev.map((r) => ({ ...r, status: 'Present' })));
    showToast('All students marked as Present', 'info');
  };

  // Reset to default
  const handleReset = () => {
    setStudentRows((prev) =>
      prev.map((r) => ({ ...r, status: 'Present', remarks: '' }))
    );
    showToast('Roll call register reset', 'info');
  };

  // Save Attendance
  const handleSaveAttendance = () => {
    if (studentRows.length === 0) {
      showToast('No students found in this section.', 'warning');
      return;
    }

    setIsSaving(true);
    const selectedSection = selectedClass?.sections.find((s) => s.id === selectedSectionId);

    try {
      const result = dataService.recordClassAttendance({
        classId: selectedClassId,
        className: selectedClass?.name || 'Classroom',
        sectionId: selectedSectionId,
        sectionName: selectedSection?.name || 'Section A',
        date: selectedDate,
        period: selectedPeriod,
        records: studentRows.map((r) => ({
          studentId: r.studentId,
          studentName: r.studentName,
          rollNumber: r.rollNumber,
          status: r.status,
          remarks: r.remarks,
        })),
        user: currentUser || undefined,
      });

      const absentCount = studentRows.filter((r) => r.status === 'Absent').length;
      const lateCount = studentRows.filter((r) => r.status === 'Late').length;

      const successMsg = `Attendance saved successfully for ${selectedClass?.name} (${studentRows.length} students logged).`;
      setSaveSuccessMessage(successMsg);
      showToast('Attendance saved successfully.', 'success');

      if (absentCount > 0 && settings.notifyParentsOnAbsence) {
        showToast(
          `Automated in-app absence notices queued for ${absentCount} absent student(s).`,
          'info'
        );
      }
      if (lateCount >= settings.repeatedLateThreshold) {
        showToast(`Tardy threshold alert triggered for repeat late arrivals.`, 'warning');
      }

      setIsDuplicateDetected(false);
    } catch {
      showToast('Error saving attendance. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick summary counts
  const presentCount = studentRows.filter((r) => r.status === 'Present').length;
  const absentCount = studentRows.filter((r) => r.status === 'Absent').length;
  const lateCount = studentRows.filter((r) => r.status === 'Late').length;
  const excusedCount = studentRows.filter((r) => r.status === 'Excused').length;

  return (
    <div className="space-y-6">
      {/* Session Configuration Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Class Register & Roll Call
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select class, section, and date to take or update live classroom attendance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              Mode: <span className="text-indigo-600 font-bold uppercase">{settings.mode}</span>
            </span>
          </div>
        </div>

        {/* Filter Selection Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Class</label>
            <Select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const nextCls = classes.find((c) => c.id === e.target.value);
                if (nextCls?.sections[0]) {
                  setSelectedSectionId(nextCls.sections[0].id);
                }
              }}
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Section</label>
            <Select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              options={
                selectedClass?.sections.map((s) => ({ value: s.id, label: s.name })) || [
                  { value: 'SEC-001', label: 'Section A' },
                ]
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Subject / Period
            </label>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              options={periodOptions}
            />
          </div>
        </div>

        {/* Duplicate Attendance Warning Banner */}
        {isDuplicateDetected && (
          <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Existing Attendance Recorded:</span> Attendance for{' '}
              <span className="font-semibold">{selectedClass?.name}</span> ({selectedPeriod}) on{' '}
              <span className="font-mono font-semibold">{selectedDate}</span> was previously submitted.
              Changes made here will safely update the session records with full audit tracking.
            </div>
          </div>
        )}

        {/* Success Banner */}
        {saveSuccessMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{saveSuccessMessage}</span>
            </div>
            <button
              onClick={() => setSaveSuccessMessage(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Roster Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        {/* Table Action Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Roster Summary:</span>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
              {presentCount} Present
            </span>
            <span className="text-xs font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
              {absentCount} Absent
            </span>
            <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
              {lateCount} Late
            </span>
            <span className="text-xs font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
              {excusedCount} Excused
            </span>
            <span className="text-xs text-slate-400 ml-1">({studentRows.length} Total)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              leftIcon={<CheckCheck className="w-3.5 h-3.5 text-emerald-600" />}
            >
              Mark All Present
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-400" />}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Roll Call Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Roll #</th>
                <th className="py-3 px-4 min-w-[180px]">Student Name</th>
                <th className="py-3 px-4 min-w-[340px] text-center">Attendance Status</th>
                <th className="py-3 px-4 min-w-[200px]">Remarks / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {studentRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No active students enrolled in {selectedClass?.name}.
                  </td>
                </tr>
              ) : (
                studentRows.map((row) => {
                  return (
                    <tr
                      key={row.studentId}
                      className={`transition-colors hover:bg-slate-50/70 ${
                        row.status === 'Absent' ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Roll Number */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-600">
                        {row.rollNumber}
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{row.studentName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{row.studentId}</span>
                      </td>

                      {/* Status Toggle Buttons */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Present Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(row.studentId, 'Present')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                              row.status === 'Present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(row.studentId, 'Absent')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                              row.status === 'Absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>

                          {/* Late Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(row.studentId, 'Late')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                              row.status === 'Late'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Late</span>
                          </button>

                          {/* Excused Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(row.studentId, 'Excused')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                              row.status === 'Excused'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                            }`}
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Excused</span>
                          </button>
                        </div>
                      </td>

                      {/* Remarks Input */}
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) => handleRemarksChange(row.studentId, e.target.value)}
                          placeholder={
                            row.status === 'Absent'
                              ? 'e.g. Unverified morning absence'
                              : row.status === 'Late'
                              ? 'e.g. Arrived 08:35 AM'
                              : 'Optional notes...'
                          }
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-700"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>
              Saving marks roll call and checks automated alert thresholds for low attendance & consecutive absences.
            </span>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleSaveAttendance}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Attendance Register
          </Button>
        </div>
      </div>
    </div>
  );
};
