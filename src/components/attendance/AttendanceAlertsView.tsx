import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldAlert,
  Check,
  UserCheck,
  Calendar,
  X,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { AttendanceAlertItem, AutomationExecutionLog } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const AttendanceAlertsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState<AttendanceAlertItem[]>(() =>
    dataService.getAttendanceAlerts()
  );
  const [automationLogs] = useState<AutomationExecutionLog[]>(() =>
    dataService.getAutomationExecutionLogs()
  );

  const [activeTab, setActiveTab] = useState<'alerts' | 'automation-logs'>('alerts');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'critical'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Acknowledged'>('all');

  // Modal State for adding staff notes
  const [selectedAlertForNote, setSelectedAlertForNote] = useState<AttendanceAlertItem | null>(null);
  const [staffNoteText, setStaffNoteText] = useState('');

  // Acknowledge alert
  const handleAcknowledge = (alertId: string) => {
    const success = dataService.acknowledgeAttendanceAlert(
      alertId,
      currentUser || undefined
    );
    if (success) {
      setAlerts(dataService.getAttendanceAlerts());
      showToast('Alert acknowledged and marked as reviewed.', 'success');
    }
  };

  // Add staff note
  const handleSaveStaffNote = () => {
    if (!selectedAlertForNote || !staffNoteText.trim()) return;

    const updated = dataService.addAttendanceAlertStaffNote(
      selectedAlertForNote.id,
      staffNoteText.trim(),
      currentUser?.name || 'Administrator'
    );

    if (updated) {
      setAlerts((prev) => prev.map((a) => (a.id === selectedAlertForNote.id ? updated : a)));
      showToast('Staff intervention note appended to alert file.', 'success');
      setSelectedAlertForNote(null);
      setStaffNoteText('');
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  const activeCount = alerts.filter((a) => a.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Smart Attendance Automation & Early-Warning Alerts
              </h2>
              {activeCount > 0 && (
                <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                  {activeCount} Active Alerts
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated rules monitoring chronic truancy, repeated tardiness, and consecutive unexcused absences
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Intervention Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('automation-logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'automation-logs'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Automation Engine Logs ({automationLogs.length})
            </button>
          </div>
        </div>

        {/* Filters if on alerts tab */}
        {activeTab === 'alerts' && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-500">Filters:</span>
            <div className="flex items-center gap-1">
              {(['all', 'critical', 'high', 'medium'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 rounded-lg font-semibold capitalize cursor-pointer transition-colors ${
                    filterSeverity === sev
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <div className="flex items-center gap-1">
              {(['all', 'Active', 'Acknowledged'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                    filterStatus === st
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content: Alerts List */}
      {activeTab === 'alerts' ? (
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-xs">
              No attendance alerts match the active filter criteria.
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all ${
                  alert.status === 'Active'
                    ? alert.severity === 'critical'
                      ? 'border-rose-300 bg-rose-50/10'
                      : 'border-amber-300 bg-amber-50/10'
                    : 'border-slate-200/80 opacity-90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        alert.severity === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : alert.severity === 'high'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{alert.studentName}</span>
                        <span className="font-mono text-xs text-slate-400">({alert.studentId})</span>
                        <Badge
                          variant={
                            alert.severity === 'critical'
                              ? 'danger'
                              : alert.severity === 'high'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant={alert.status === 'Active' ? 'warning' : 'success'}>
                          {alert.status}
                        </Badge>
                      </div>

                      <div className="text-xs text-slate-500 mt-1">
                        Class: <span className="font-semibold text-slate-700">{alert.className}</span> •{' '}
                        Triggered On: <span className="font-mono text-slate-700">{alert.date}</span>
                      </div>

                      <p className="text-xs text-slate-800 font-medium mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        {alert.details}
                      </p>

                      {/* Staff Notes List */}
                      {alert.staffNotes && alert.staffNotes.length > 0 && (
                        <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-indigo-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Staff Follow-up Notes:
                          </span>
                          {alert.staffNotes.map((note, idx) => (
                            <p key={idx} className="text-xs text-slate-600">
                              "{note}"
                            </p>
                          ))}
                        </div>
                      )}

                      {alert.acknowledgedBy && (
                        <p className="text-[11px] text-slate-400 mt-2">
                          Acknowledged by <strong className="text-slate-600">{alert.acknowledgedBy}</strong> at{' '}
                          {alert.acknowledgedAt}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    {alert.status === 'Active' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcknowledge(alert.id)}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        Acknowledge
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAlertForNote(alert);
                        setStaffNoteText('');
                      }}
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                    >
                      Add Staff Note
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Automation Execution Logs Tab */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Automated Event Execution Log
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit ledger of automated trigger firings, dispatched in-app notifications, and dispatch status
              </p>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
              {automationLogs.length} Events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Event Trigger</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Dispatched</th>
                  <th className="py-3 px-4">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {automationLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {log.triggerEvent}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{log.studentName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.studentId}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{log.className}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{log.triggeredAt}</td>
                    <td className="py-3 px-4 text-slate-700">{log.actionTaken}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        In-App Active
                      </span>
                      {log.deliveryNote && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {log.deliveryNote}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Note Modal */}
      {selectedAlertForNote && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Add Staff Intervention Note</h3>
                  <span className="text-xs text-slate-500">Record counselor or administrative follow-up</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlertForNote(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1">
              <div>
                <span className="text-slate-400">Student:</span>{' '}
                <strong className="text-slate-800">{selectedAlertForNote.studentName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Alert:</span>{' '}
                <span className="text-rose-700 font-semibold">{selectedAlertForNote.details}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Intervention Note / Action Plan
              </label>
              <textarea
                value={staffNoteText}
                onChange={(e) => setStaffNoteText(e.target.value)}
                placeholder="e.g. 'Met with mother; medical certificate provided for respiratory infection' or 'Phone conference scheduled for Monday'..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setSelectedAlertForNote(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveStaffNote}
                disabled={!staffNoteText.trim()}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Save Intervention Note
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
