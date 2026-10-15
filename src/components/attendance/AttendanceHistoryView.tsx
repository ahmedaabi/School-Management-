import React, { useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Edit2,
  History,
  Search,
  Filter,
  Users,
  ShieldCheck,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { AttendanceRecord, AttendanceStatus, AttendanceAuditLog } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { MetricCard } from '../ui/MetricCard';

export const AttendanceHistoryView: React.FC = () => {
  const { currentUser, can } = useAuth();
  const { showToast } = useToast();

  const classes = dataService.getClasses();

  // Filters
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('Present');
  const [editReason, setEditReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Audit Trail Drawer State
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch data
  const logs = dataService.getAttendanceRecords();
  const auditLogs = dataService.getAttendanceAuditLogs();

  // Today's summary statistics
  const todaySummary = dataService.getDailyAttendanceSummary(
    selectedDate || '2026-09-04',
    selectedClass !== 'all' ? selectedClass : undefined
  );

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (selectedClass !== 'all' && log.classId !== selectedClass) return false;
    if (selectedStatus !== 'all' && log.status !== selectedStatus) return false;
    if (selectedDate && log.date !== selectedDate) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = log.studentName.toLowerCase().includes(q);
      const matchId = log.studentId.toLowerCase().includes(q);
      const matchClass = (log.className || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchClass) return false;
    }
    return true;
  });

  // Open Edit Modal
  const handleOpenEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setNewStatus(record.status);
    setEditReason('');
  };

  // Submit Edit
  const handleSaveEdit = () => {
    if (!editingRecord) return;
    if (!editReason.trim()) {
      showToast('Please provide a specific reason for adjusting this attendance record.', 'warning');
      return;
    }

    setIsEditing(true);
    const result = dataService.editAttendanceRecord({
      attendanceId: editingRecord.id,
      newStatus,
      reason: editReason.trim(),
      user: currentUser || undefined,
    });

    setIsEditing(false);

    if (result.success) {
      showToast(`Record updated: ${editingRecord.studentName} marked as ${newStatus}.`, 'success');
      setEditingRecord(null);
      setRefreshKey((k) => k + 1);
    } else {
      showToast(result.error || 'Failed to update record.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-Time Dashboard Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Total Students"
          value={todaySummary.totalStudents}
          subtext="Enrolled roster"
          icon={<Users className="w-4 h-4 text-indigo-600" />}
          iconBgColor="bg-indigo-50"
        />
        <MetricCard
          label="Present"
          value={todaySummary.present}
          subtext="In classroom"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
        />
        <MetricCard
          label="Absent"
          value={todaySummary.absent}
          subtext="Unverified/unexcused"
          icon={<XCircle className="w-4 h-4 text-rose-600" />}
          iconBgColor="bg-rose-50"
        />
        <MetricCard
          label="Late / Tardy"
          value={todaySummary.late}
          subtext="Delayed arrival"
          icon={<Clock className="w-4 h-4 text-amber-600" />}
          iconBgColor="bg-amber-50"
        />
        <MetricCard
          label="Excused"
          value={todaySummary.excused}
          subtext="Medical / approved"
          icon={<HelpCircle className="w-4 h-4 text-sky-600" />}
          iconBgColor="bg-sky-50"
        />
        <MetricCard
          label="Attendance Rate"
          value={`${todaySummary.attendancePercentage}%`}
          subtext="Daily present ratio"
          icon={<CalendarCheck className="w-4 h-4 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, ID or classroom..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAuditDrawerOpen(true)}
              leftIcon={<History className="w-3.5 h-3.5 text-indigo-600" />}
            >
              Audit Trail ({auditLogs.length})
            </Button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Class Filter</label>
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={[
                { value: 'all', label: 'All Classes' },
                ...classes.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status Filter</label>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Present', label: 'Present' },
                { value: 'Absent', label: 'Absent' },
                { value: 'Late', label: 'Late' },
                { value: 'Excused', label: 'Excused' },
              ]}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Specific Date</label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="px-2 py-2 text-slate-400 hover:text-slate-600 text-xs"
                  title="Clear date filter"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Attendance Records Log
            </h3>
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
              {filteredLogs.length} Entries
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Classroom</th>
                <th className="py-3 px-4">Period / Session</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Logged By</th>
                <th className="py-3 px-4">Remarks / Audit Note</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No attendance records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {log.date}
                    </td>

                    {/* Student Name */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{log.studentName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.studentId}</span>
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">{log.className}</span>
                      {log.sectionName && (
                        <span className="text-[10px] text-slate-500 block">{log.sectionName}</span>
                      )}
                    </td>

                    {/* Period */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {log.period || 'Daily Homeroom'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          log.status === 'Present'
                            ? 'success'
                            : log.status === 'Late'
                            ? 'warning'
                            : log.status === 'Excused'
                            ? 'info'
                            : 'danger'
                        }
                      >
                        {log.status}
                      </Badge>
                    </td>

                    {/* Logged By */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <span>{log.recordedBy || 'Teacher'}</span>
                    </td>

                    {/* Remarks / Audit */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-600 truncate">{log.remarks || 'Standard register'}</p>
                      {log.editedBy && (
                        <span className="text-[10px] text-amber-700 font-medium block">
                          Edited by {log.editedBy}: "{log.editReason}"
                        </span>
                      )}
                    </td>

                    {/* Action: Edit */}
                    <td className="py-3.5 px-4 text-right">
                      {can('attendance.edit') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(log)}
                          leftIcon={<Edit2 className="w-3 h-3" />}
                        >
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Attendance Modal (Requirement 3) */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Adjust Attendance Status</h3>
                  <span className="text-xs text-slate-500">Record correction with audit logging</span>
                </div>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1">
              <div>
                <span className="text-slate-400">Student:</span>{' '}
                <span className="font-semibold text-slate-800">{editingRecord.studentName}</span>{' '}
                <span className="font-mono text-slate-500">({editingRecord.studentId})</span>
              </div>
              <div>
                <span className="text-slate-400">Date & Session:</span>{' '}
                <span className="font-semibold text-slate-700">
                  {editingRecord.date} • {editingRecord.period || 'Daily Homeroom'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Current Status:</span>{' '}
                <span className="font-semibold text-indigo-600">{editingRecord.status}</span>
              </div>
            </div>

            {/* New Status Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Attendance Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Present', 'Absent', 'Late', 'Excused'] as AttendanceStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewStatus(st)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      newStatus === st
                        ? st === 'Present'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : st === 'Absent'
                          ? 'bg-rose-50 border-rose-500 text-rose-800'
                          : st === 'Late'
                          ? 'bg-amber-50 border-amber-500 text-amber-800'
                          : 'bg-sky-50 border-sky-500 text-sky-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Mandatory Reason for Change */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Change <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="State specific rationale (e.g. 'Parent provided medical certificate' or 'Student checked in at gate 08:35')..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                This rationale will be recorded permanently in the official Attendance Audit Log.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setEditingRecord(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveEdit}
                isLoading={isEditing}
                disabled={!editReason.trim()}
              >
                Save Correction
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Drawer Modal */}
      {isAuditDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Attendance Audit Trail</h3>
                  <p className="text-xs text-slate-500">
                    Cryptographic ledger of all manual changes, overrides, and administrative adjustments
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {auditLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No attendance status corrections have been logged yet.
                </div>
              ) : (
                auditLogs.map((audit) => (
                  <div
                    key={audit.id}
                    className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{audit.studentName}</span>
                        <span className="font-mono text-slate-400 text-[11px]">({audit.studentId})</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">{audit.date}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{audit.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Correction:</span>
                      <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {audit.previousStatus}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {audit.newStatus}
                      </span>
                    </div>

                    <div className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60">
                      <span className="font-semibold text-slate-700">Reason:</span> "{audit.reason}"
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>
                        Changed by: <strong className="text-slate-700">{audit.changedBy}</strong> ({audit.changedByRole})
                      </span>
                      <span className="font-mono">{audit.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsAuditDrawerOpen(false)}>
                Close Audit Ledger
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
