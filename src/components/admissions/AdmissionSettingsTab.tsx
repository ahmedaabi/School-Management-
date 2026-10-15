import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Zap,
  History,
  Save,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Database,
  Building,
} from 'lucide-react';
import { admissionService } from '../../services/admissionService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

export const AdmissionSettingsTab: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeSettingsSection, setActiveSettingsSection] = useState<'general' | 'capacities' | 'automations' | 'audit'>('general');

  // General settings state
  const currentSettings = admissionService.getSettings();
  const [academicYear, setAcademicYear] = useState(currentSettings.academicYear);
  const [appPrefix, setAppPrefix] = useState(currentSettings.applicationNumberPrefix);
  const [admPrefix, setAdmPrefix] = useState(currentSettings.admissionNumberPrefix);
  const [requireEntranceTest, setRequireEntranceTest] = useState(currentSettings.requireEntranceTest);
  const [requireInterview, setRequireInterview] = useState(currentSettings.requireInterview);
  const [enableCapacityLimits, setEnableCapacityLimits] = useState(currentSettings.enableCapacityLimits);
  const [allowWaitlist, setAllowWaitlist] = useState(currentSettings.allowWaitlist);
  const [alertDays, setAlertDays] = useState(currentSettings.pendingReviewAlertDays);

  // Capacities
  const [capacities, setCapacities] = useState(admissionService.getCapacities());

  // Automations
  const [rules, setRules] = useState(admissionService.getAutomationRules());
  const logs = admissionService.getAutomationLogs();

  // Audit
  const auditLogs = admissionService.getAuditLogs();

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    admissionService.updateSettings(
      {
        academicYear,
        applicationNumberPrefix: appPrefix,
        admissionNumberPrefix: admPrefix,
        requireEntranceTest,
        requireInterview,
        enableCapacityLimits,
        allowWaitlist,
        pendingReviewAlertDays: Number(alertDays),
      },
      currentUser || undefined
    );
    showToast('Admissions policy configuration saved.', 'success');
  };

  const handleUpdateCapacityLimit = (classId: string, sectionId: string, newMax: number) => {
    admissionService.updateCapacity(classId, sectionId, { maxCapacity: newMax }, currentUser || undefined);
    setCapacities(admissionService.getCapacities());
    showToast('Capacity limit updated.', 'success');
  };

  const handleToggleRule = (ruleId: string) => {
    admissionService.toggleAutomationRule(ruleId);
    setRules(admissionService.getAutomationRules());
    showToast('Automation trigger rule updated.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admissions System Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure admission cycles, automation triggers, class enrollment limits, and view security audit logs.
          </p>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveSettingsSection('general')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeSettingsSection === 'general'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          General Policy
        </button>
        <button
          onClick={() => setActiveSettingsSection('capacities')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeSettingsSection === 'capacities'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          Classroom Capacity Limits
        </button>
        <button
          onClick={() => setActiveSettingsSection('automations')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeSettingsSection === 'automations'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          Automation Rules & Engine
        </button>
        <button
          onClick={() => setActiveSettingsSection('audit')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeSettingsSection === 'audit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Admissions Audit Log
        </button>
      </div>

      {/* 1. General Settings Form */}
      {activeSettingsSection === 'general' && (
        <form onSubmit={handleSaveGeneral} className="space-y-6 max-w-3xl">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              Intake Cycle & Code Prefixes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Academic Year</label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Application Prefix</label>
                <input
                  type="text"
                  required
                  value={appPrefix}
                  onChange={(e) => setAppPrefix(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Admission Number Prefix</label>
                <input
                  type="text"
                  required
                  value={admPrefix}
                  onChange={(e) => setAdmPrefix(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Review Delay Threshold (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={alertDays}
                  onChange={(e) => setAlertDays(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Flags applications remaining in review</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              Enrollment Requirements & Safeguards
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Require Entrance Test Prior to Approval</span>
                  <span className="text-slate-500 text-[11px]">Enforces entrance assessment recording for all applicants.</span>
                </div>
                <input
                  type="checkbox"
                  checked={requireEntranceTest}
                  onChange={(e) => setRequireEntranceTest(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Mandate Oral Interview Assessment</span>
                  <span className="text-slate-500 text-[11px]">Requires formal interview completion before candidate can be approved.</span>
                </div>
                <input
                  type="checkbox"
                  checked={requireInterview}
                  onChange={(e) => setRequireInterview(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Strict Classroom Capacity Enforcement</span>
                  <span className="text-slate-500 text-[11px]">Blocks enrollment if section capacity reaches maximum without override.</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableCapacityLimits}
                  onChange={(e) => setEnableCapacityLimits(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Enable Automated Waitlist Routing</span>
                  <span className="text-slate-500 text-[11px]">Allows placing candidates on prioritized waitlists when sections fill up.</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowWaitlist}
                  onChange={(e) => setAllowWaitlist(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4 mr-1.5" />
              Save Admission Settings
            </Button>
          </div>
        </form>
      )}

      {/* 2. Classroom Capacities */}
      {activeSettingsSection === 'capacities' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Classroom seat allocation directly enforces admissions enrollment limits.</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Class & Section</th>
                <th className="px-4 py-3">Max Seat Capacity</th>
                <th className="px-4 py-3">Occupied</th>
                <th className="px-4 py-3">Available Seats</th>
                <th className="px-4 py-3 text-right">Update Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {capacities.map((cap) => (
                <tr key={`${cap.classId}-${cap.sectionId}`} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {cap.className} ({cap.sectionName})
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      defaultValue={cap.maxCapacity}
                      min={cap.occupied}
                      onBlur={(e) =>
                        handleUpdateCapacityLimit(cap.classId, cap.sectionId, Number(e.target.value))
                      }
                      className="w-20 p-1.5 border border-slate-200 rounded font-bold text-center text-xs"
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{cap.occupied}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">{cap.availableSeats}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-slate-400 text-[11px]">Auto-saved on edit</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Automation Rules & Engine */}
      {activeSettingsSection === 'automations' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              Configured Automated Triggers
            </h3>

            <div className="space-y-3 text-xs">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{rule.name}</span>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {rule.trigger}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1">{rule.description}</p>
                    <span className="text-[11px] text-slate-600 font-semibold block mt-1">
                      Action: {rule.action}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className="p-1 text-indigo-600 hover:text-indigo-800"
                  >
                    {rule.enabled ? (
                      <ToggleRight className="w-7 h-7 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Automation Execution Logs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800">Recent Automation Engine Executions</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Rule Name</th>
                  <th className="px-4 py-3">Target Candidate</th>
                  <th className="px-4 py-3">Action Executed</th>
                  <th className="px-4 py-3">Execution Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-500 text-[11px]">{log.timestamp}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{log.ruleName}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{log.applicantName}</span>
                      <span className="font-mono text-[10px] text-slate-400">{log.applicationNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.actionTaken}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'SKIPPED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Complete Audit Log */}
      {activeSettingsSection === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">Immutable Admissions Operation Trail</h3>
            <span className="text-[11px] text-slate-500">Security & compliance tracked</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User / Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity Target</th>
                <th className="px-4 py-3">Change Value</th>
                <th className="px-4 py-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-500 text-[11px] font-mono">{log.timestamp}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800 block">{log.user}</span>
                    <span className="text-[10px] text-slate-400">{log.userRole}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-indigo-700">{log.action}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{log.entity}</td>
                  <td className="px-4 py-3">
                    {log.previousValue && (
                      <span className="text-slate-400 line-through mr-1">{log.previousValue}</span>
                    )}
                    {log.newValue && (
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {log.newValue}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
