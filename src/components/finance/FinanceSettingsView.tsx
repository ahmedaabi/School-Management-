import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  ShieldAlert,
  Save,
  CheckCircle2,
  Clock,
  Zap,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { FinanceSettings, FeeAutomationRule, FinanceAutomationLog } from '../../types/finance';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { financeService } from '../../services/financeService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export interface FinanceSettingsViewProps {
  settings: FinanceSettings;
  rules: FeeAutomationRule[];
  logs: FinanceAutomationLog[];
  onRefresh?: () => void;
}

export const FinanceSettingsView: React.FC<FinanceSettingsViewProps> = ({
  settings: initialSettings,
  rules,
  logs,
  onRefresh,
}) => {
  const { currentUser, can } = useAuth();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<FinanceSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<'config' | 'rules' | 'audit'>('config');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    financeService.saveSettings(settings, currentUser);
    showToast('Finance & treasury settings saved successfully.', 'success');
    if (onRefresh) onRefresh();
  };

  const handleToggleRule = (ruleId: string, currentStatus: boolean) => {
    financeService.toggleAutomationRule(ruleId, !currentStatus, currentUser);
    showToast(
      !currentStatus ? 'Automation rule activated.' : 'Automation rule paused.',
      'info'
    );
    if (onRefresh) onRefresh();
  };

  const handleTriggerOverdueEscalation = () => {
    const res = financeService.runOverdueEscalationCheck(currentUser);
    showToast(
      `Overdue reconciliation complete: ${res.updatedCount} accounts escalated, ${res.remindersSent} reminders dispatched.`,
      'success'
    );
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'config'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          General Configuration
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'rules'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Automation Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'audit'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Automation Audit Logs ({logs.length})
        </button>
      </div>

      {activeTab === 'config' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              Currency & Sequence Identifiers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Currency Code"
                type="text"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                required
              />

              <Input
                label="Currency Symbol"
                type="text"
                value={settings.currencySymbol}
                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                required
              />

              <Input
                label="Invoice Prefix"
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                required
              />

              <Input
                label="Receipt Prefix"
                type="text"
                value={settings.receiptPrefix}
                onChange={(e) => setSettings({ ...settings, receiptPrefix: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Grace Periods & Late Surcharges
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Default Payment Term (Days)"
                type="number"
                min="1"
                value={settings.defaultDueDays}
                onChange={(e) =>
                  setSettings({ ...settings, defaultDueDays: Number(e.target.value) || 15 })
                }
                required
              />

              <Input
                label="Grace Period (Days After Due)"
                type="number"
                min="0"
                value={settings.gracePeriodDays}
                onChange={(e) =>
                  setSettings({ ...settings, gracePeriodDays: Number(e.target.value) || 0 })
                }
                required
              />

              <Input
                label="Late Fee Percentage (%)"
                type="number"
                min="0"
                max="50"
                value={settings.lateFeePercentage}
                onChange={(e) =>
                  setSettings({ ...settings, lateFeePercentage: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              Automated Alerts & Channels
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableParentNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, enableParentNotifications: e.target.checked })
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    Parent Invoicing & Payment Notifications
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Automatically issue in-app notices and payment receipts to parents when invoices are billed or cleared.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableOverdueEscalation}
                  onChange={(e) =>
                    setSettings({ ...settings, enableOverdueEscalation: e.target.checked })
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    Automatic Overdue Status Transition & Escalation
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Immediately flag unpaid invoices as OVERDUE once grace period has elapsed.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableAdminOverdueAlerts}
                  onChange={(e) =>
                    setSettings({ ...settings, enableAdminOverdueAlerts: e.target.checked })
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    Bursar & Principal Delinquency Digests
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Notify administrators regarding long-term unpaid student balances.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTriggerOverdueEscalation}
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-indigo-600" />}
            >
              Run Immediate Overdue Escalation Check
            </Button>

            {can('settings.manage') && (
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Settings
              </Button>
            )}
          </div>
        </form>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                School Finance Automation Rules
              </h3>
              <p className="text-xs text-slate-500">
                Automated workflows running periodic triggers for invoicing, reminders, and late fees.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerOverdueEscalation}
              leftIcon={<Zap className="w-3.5 h-3.5 text-amber-500" />}
            >
              Execute Overdue Check Now
            </Button>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{rule.name}</span>
                    <Badge variant="neutral" size="sm">
                      {rule.triggerType}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{rule.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>Action: {rule.action}</span>
                    {rule.lastRun && <span>Last Executed: {rule.lastRun}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={rule.isActive ? 'success' : 'neutral'} size="sm">
                    {rule.isActive ? 'Active' : 'Paused'}
                  </Badge>

                  {can('settings.manage') && (
                    <Button
                      variant={rule.isActive ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleRule(rule.id, rule.isActive)}
                    >
                      {rule.isActive ? 'Pause' : 'Activate'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Automation Execution Audit Trail
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {logs.length} logged executions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Rule Name</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Execution Summary</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-500">
                      {log.timestamp.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{log.ruleName}</td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {log.studentName || log.invoiceNumber || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{log.message}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700'
                            : log.status === 'SKIPPED'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-rose-50 text-rose-700'
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
    </div>
  );
};
