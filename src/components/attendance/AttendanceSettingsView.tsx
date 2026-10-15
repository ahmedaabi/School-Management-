import React, { useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Bell,
  Shield,
  Sliders,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { AttendanceSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

export const AttendanceSettingsView: React.FC = () => {
  const { currentUser, can } = useAuth();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<AttendanceSettings>(() =>
    dataService.getAttendanceSettings()
  );
  const [isSaving, setIsSaving] = useState(false);

  // Check role authorization
  const canModifySettings =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'principal' ||
    currentUser?.role === 'admin_staff';

  const handleSave = () => {
    if (!canModifySettings) {
      showToast('You do not have permission to modify institutional attendance policies.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updated = dataService.updateAttendanceSettings(settings);
      setSettings(updated);
      showToast('Attendance configuration saved successfully.', 'success');
    } catch {
      showToast('Failed to save settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    const defaults: AttendanceSettings = {
      mode: 'daily',
      lowAttendanceThreshold: 75,
      consecutiveAbsenceThreshold: 3,
      repeatedLateThreshold: 3,
      workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      notifyParentsOnAbsence: true,
      notifyAdminOnTruancy: true,
      notifyTeacherOnLate: true,
    };
    setSettings(defaults);
    dataService.updateAttendanceSettings(defaults);
    showToast('Reset to default institutional attendance policies.', 'info');
  };

  const toggleWorkingDay = (day: string) => {
    if (!canModifySettings) return;
    setSettings((prev) => {
      const exists = prev.workingDays.includes(day);
      const nextDays = exists
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays: nextDays };
    });
  };

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Institutional Attendance Policy & Automation Triggers
              </h2>
              <p className="text-xs text-slate-500">
                Configure attendance tracking methodology, threshold percentages, and automated trigger behaviors
              </p>
            </div>
          </div>

          {canModifySettings && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetDefaults}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-400" />}
              >
                Restore Defaults
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={isSaving}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Policies
              </Button>
            </div>
          )}
        </div>

        {!canModifySettings && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Read-only view: Institutional policies can only be adjusted by School Administrators or Principals.</span>
          </div>
        )}

        {/* Section 1: Roll Call Mode */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            1. Attendance Tracking Methodology
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                settings.mode === 'daily'
                  ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="attendanceMode"
                checked={settings.mode === 'daily'}
                disabled={!canModifySettings}
                onChange={() => setSettings((s) => ({ ...s, mode: 'daily' }))}
                className="mt-1 text-indigo-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Daily Homeroom Mode</span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  One official roll call taken once per day during morning homeroom. Standard for elementary and junior cohorts.
                </span>
              </div>
            </label>

            <label
              className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                settings.mode === 'period'
                  ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="attendanceMode"
                checked={settings.mode === 'period'}
                disabled={!canModifySettings}
                onChange={() => setSettings((s) => ({ ...s, mode: 'period' }))}
                className="mt-1 text-indigo-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Period-by-Period Subject Mode</span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Teachers log attendance for each instructional period independently (Math, Science, English, etc.).
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 2: Threshold Triggers */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            2. Smart Automation Thresholds & Triggers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Low Attendance Threshold */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Low Attendance Threshold (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={50}
                  max={95}
                  value={settings.lowAttendanceThreshold}
                  disabled={!canModifySettings}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, lowAttendanceThreshold: Number(e.target.value) }))
                  }
                  className="w-24 text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-xs font-semibold text-slate-600">%</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Flags students whose cumulative attendance drops below this minimum rate.
              </p>
            </div>

            {/* Consecutive Absence Days */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Consecutive Absence Trigger (Days)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={settings.consecutiveAbsenceThreshold}
                  disabled={!canModifySettings}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      consecutiveAbsenceThreshold: Number(e.target.value),
                    }))
                  }
                  className="w-24 text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-xs font-semibold text-slate-600">days in a row</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Auto-generates high-priority intervention alert when absent consecutively.
              </p>
            </div>

            {/* Repeated Late Arrivals */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Repeated Tardy Threshold (Times)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={settings.repeatedLateThreshold}
                  disabled={!canModifySettings}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      repeatedLateThreshold: Number(e.target.value),
                    }))
                  }
                  className="w-24 text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-xs font-semibold text-slate-600">late arrivals</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Triggers punctuality alert to notify student counselor and teacher.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Institutional Working Days */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            3. Scheduled Working Days
          </h3>
          <p className="text-xs text-slate-500">
            Select standard instructional days for calendar and percentage denominator computations:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
              const active = settings.workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={!canModifySettings}
                  onClick={() => toggleWorkingDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Automated Communication Toggles */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            4. Automated In-App & Dispatch Rules
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Notify Parents on Same-Day Unexcused Absence
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Dispatches instant in-app notification to the student's guardian immediately upon roll call submission.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyParentsOnAbsence}
                disabled={!canModifySettings}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, notifyParentsOnAbsence: e.target.checked }))
                }
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Alert Principal & Admin on Chronic Truancy (&lt;{settings.lowAttendanceThreshold}%)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Generates an urgent management alert for students falling below the institutional threshold.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyAdminOnTruancy}
                disabled={!canModifySettings}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, notifyAdminOnTruancy: e.target.checked }))
                }
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Alert Homeroom Faculty on Repeated Tardy Patterns
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Flags repeat late arrivals directly on the faculty desk dashboard for follow-up.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyTeacherOnLate}
                disabled={!canModifySettings}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, notifyTeacherOnLate: e.target.checked }))
                }
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        {/* Footer save note */}
        {canModifySettings && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Policy adjustments take effect immediately across all classroom registers and automated triggers.
            </span>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Attendance Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
