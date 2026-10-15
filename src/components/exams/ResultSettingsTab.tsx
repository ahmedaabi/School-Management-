import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  Settings as SettingsIcon,
  Sliders,
  CheckCircle,
  AlertTriangle,
  History,
  Building,
  School,
} from 'lucide-react';
import { GradeRule, ResultCalculationSettings, ExamAuditLog } from '../../types/exam';
import { examService } from '../../services/examService';
import { User } from '../../types';

interface ResultSettingsTabProps {
  currentUser: User;
}

export const ResultSettingsTab: React.FC<ResultSettingsTabProps> = ({ currentUser }) => {
  const [gradeRules, setGradeRules] = useState<GradeRule[]>(() =>
    examService.getGradeRules()
  );
  const [settings, setSettings] = useState<ResultCalculationSettings>(() =>
    examService.getResultSettings()
  );
  const [auditLogs, setAuditLogs] = useState<ExamAuditLog[]>(() =>
    examService.getAuditLogs()
  );

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Grade Rule Modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [ruleGrade, setRuleGrade] = useState('A');
  const [ruleMin, setRuleMin] = useState(80);
  const [ruleMax, setRuleMax] = useState(89);
  const [ruleGpa, setRuleGpa] = useState(3.5);
  const [ruleDesc, setRuleDesc] = useState('Excellent');
  const [ruleIsPass, setRuleIsPass] = useState(true);
  const [ruleError, setRuleError] = useState('');

  const isAdmin =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'principal' ||
    currentUser.role === 'admin';

  const handleOpenAddRule = () => {
    setEditingRuleIndex(null);
    setRuleGrade('');
    setRuleMin(50);
    setRuleMax(59);
    setRuleGpa(2.0);
    setRuleDesc('');
    setRuleIsPass(true);
    setRuleError('');
    setIsRuleModalOpen(true);
  };

  const handleOpenEditRule = (rule: GradeRule, idx: number) => {
    setEditingRuleIndex(idx);
    setRuleGrade(rule.grade);
    setRuleMin(rule.minPercentage);
    setRuleMax(rule.maxPercentage);
    setRuleGpa(rule.gradePoint);
    setRuleDesc(rule.description);
    setRuleIsPass(rule.isPass);
    setRuleError('');
    setIsRuleModalOpen(true);
  };

  const handleDeleteRule = (idx: number) => {
    if (gradeRules.length <= 2) {
      alert('You must keep at least 2 grading rules.');
      return;
    }
    const updated = gradeRules.filter((_, i) => i !== idx);
    setGradeRules(updated);
  };

  const handleSaveRuleModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleGrade.trim()) {
      setRuleError('Grade symbol is required (e.g. A+, B).');
      return;
    }
    if (ruleMin < 0 || ruleMax > 100 || ruleMin > ruleMax) {
      setRuleError('Percentage range must be valid (0 <= Min <= Max <= 100).');
      return;
    }

    const newRule: GradeRule = {
      id: editingRuleIndex !== null && gradeRules[editingRuleIndex]?.id ? gradeRules[editingRuleIndex].id : `gr-${Date.now()}`,
      grade: ruleGrade.trim().toUpperCase(),
      minPercentage: Number(ruleMin),
      maxPercentage: Number(ruleMax),
      gradePoint: Number(ruleGpa),
      description: ruleDesc.trim() || 'Standard performance',
      isPass: ruleIsPass,
    };

    let updated = [...gradeRules];
    if (editingRuleIndex !== null) {
      updated[editingRuleIndex] = newRule;
    } else {
      updated.push(newRule);
    }

    // Sort descending by min percentage
    updated.sort((a, b) => b.minPercentage - a.minPercentage);

    setGradeRules(updated);
    setIsRuleModalOpen(false);
  };

  const handleSaveAllSettings = () => {
    try {
      examService.saveGradeRules(gradeRules, currentUser);
      examService.saveResultSettings(settings, currentUser);
      setAuditLogs(examService.getAuditLogs());
      setNotification({
        type: 'success',
        text: 'Grading scale, pass thresholds, and report settings updated successfully.',
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ type: 'error', text: err?.message || 'Failed to save settings' });
    }
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Reset all grading scale rules and calculation thresholds to institution defaults?'
      )
    ) {
      localStorage.removeItem('saia_exam_grade_rules');
      localStorage.removeItem('saia_exam_result_settings');
      setGradeRules(examService.getGradeRules());
      setSettings(examService.getResultSettings());
      setAuditLogs(examService.getAuditLogs());
      setNotification({
        type: 'success',
        text: 'Settings restored to official standards.',
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Grading Scale & Result Configuration
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure academic grade brackets, GPA conversion matrices, pass thresholds, and report card policies.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              id="btn-reset-grade-defaults"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 rounded-lg shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Restore Standard Scale
            </button>
            <button
              id="btn-save-grade-settings"
              onClick={handleSaveAllSettings}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </div>
        )}
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Grid: Grade Rules and Calculation Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Grading Rules Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Academic Grading Scale</h3>
              <p className="text-xs text-slate-500">
                Percentages are matched against this matrix to derive letters and GPA points.
              </p>
            </div>
            {isAdmin && (
              <button
                id="btn-add-grade-rule"
                onClick={handleOpenAddRule}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Grade Bracket
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase">
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3 text-center">Score Range (%)</th>
                  <th className="py-2.5 px-3 text-center">Grade Point</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Standard</th>
                  {isAdmin && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gradeRules.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-black text-sm text-slate-900 font-mono">
                        {rule.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {rule.minPercentage}% &ndash; {rule.maxPercentage}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-600">
                      {rule.gradePoint.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{rule.description}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          rule.isPass
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {rule.isPass ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditRule(rule, idx)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded"
                            title="Edit bracket"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete bracket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Calculation Policies & Institutional Branding */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Calculation Policies</h3>
            <p className="text-xs text-slate-500">
              Rules governing overall pass criteria and ranking algorithms.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Passing Mark (%)
              </label>
              <input
                id="input-default-pass-pct"
                type="number"
                disabled={!isAdmin}
                value={settings.defaultPassingPercentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultPassingPercentage: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Rank Calculation Strategy
              </label>
              <select
                id="select-rank-calc-method"
                disabled={!isAdmin}
                value={settings.rankCalculationMethod}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    rankCalculationMethod: e.target.value as any,
                  })
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="percentage">By Percentage (Standard)</option>
                <option value="total_marks">By Total Marks Obtained</option>
                <option value="gpa">By Cumulative GPA Points</option>
              </select>
            </div>

            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.subjectPassRequired}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      subjectPassRequired: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-slate-700 font-medium">
                  Require Pass in Every Subject for Overall Pass
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.showRankOnReportCard}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      showRankOnReportCard: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-slate-700 font-medium">
                  Display Class Position / Rank on Report Cards
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.showAttendanceOnReportCard}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      showAttendanceOnReportCard: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-slate-700 font-medium">
                  Include Term Attendance Summary on Transcripts
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.allowGraceMarks}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      allowGraceMarks: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-slate-700 font-medium">
                  Permit Faculty Discretionary Grace Marks (up to {settings.maxGraceMarks} marks)
                </span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="block font-semibold text-slate-700 mb-1">
                Official School Display Name
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.schoolName}
                onChange={(e) =>
                  setSettings({ ...settings, schoolName: e.target.value })
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Examination & Result Security Audit Log
              </h3>
              <p className="text-xs text-slate-500">
                Immutable trace of exam creation, schedule changes, marks submissions, and public releases.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-600 font-semibold uppercase">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target / Module</th>
                <th className="py-2.5 px-3">Performed By</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 15).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{log.target}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    {log.performedByName}{' '}
                    <span className="text-slate-400 font-mono">({log.role})</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {auditLogs.length === 0 && (
            <p className="text-center py-6 text-slate-400 text-xs">No audit logs recorded yet.</p>
          )}
        </div>
      </div>

      {/* Grade Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingRuleIndex !== null ? 'Edit Grade Bracket' : 'New Grade Bracket'}
              </h3>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveRuleModal} className="p-6 space-y-4 text-xs">
              {ruleError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {ruleError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Grade Symbol *
                  </label>
                  <input
                    type="text"
                    required
                    value={ruleGrade}
                    onChange={(e) => setRuleGrade(e.target.value)}
                    placeholder="e.g. A+"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Grade Point (GPA) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={5}
                    required
                    value={ruleGpa}
                    onChange={(e) => setRuleGpa(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Min Percentage (%) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={ruleMin}
                    onChange={(e) => setRuleMin(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Max Percentage (%) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={ruleMax}
                    onChange={(e) => setRuleMax(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Qualitative Descriptor
                </label>
                <input
                  type="text"
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  placeholder="e.g. Outstanding / Distinction"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={ruleIsPass}
                    onChange={(e) => setRuleIsPass(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">
                    Classify as Passing Grade (Credits Granted)
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Bracket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
