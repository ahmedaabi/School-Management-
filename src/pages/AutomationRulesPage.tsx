import { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Bell,
  Mail,
  Smartphone,
  Shield,
  Plus,
  Play,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  triggerEvent: string;
  condition: string;
  action: string;
  channel: 'SMS' | 'Email' | 'In-App Notification' | 'Administrative Webhook';
  isActive: boolean;
  executionsCount: number;
  lastFired: string;
}

export const AutomationRulesPage = () => {
  const { showToast } = useToast();

  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: 'RULE-001',
      name: 'Consecutive Absence Parent Escalation',
      description: 'Dispatches emergency SMS to registered guardian phone if student is marked absent 2 consecutive mornings.',
      triggerEvent: 'Daily Attendance Marked',
      condition: 'Absence Count >= 2 in 48 hours',
      action: 'Send urgent SMS notice to Parent Phone & copy Homeroom Teacher',
      channel: 'SMS',
      isActive: true,
      executionsCount: 14,
      lastFired: 'Today at 09:15 AM',
    },
    {
      id: 'RULE-002',
      name: 'Fee Overdue Balance Notice & Late Fine Ledger',
      description: 'Automatically flags fee invoices crossing 30 calendar days overdue and queues billing email notice.',
      triggerEvent: 'Invoice Past Due Date',
      condition: 'Current Date > Due Date + 5 Days',
      action: 'Set status to Overdue and dispatch reminder email with payment link',
      channel: 'Email',
      isActive: true,
      executionsCount: 28,
      lastFired: 'Yesterday at 06:00 PM',
    },
    {
      id: 'RULE-003',
      name: 'At-Risk Academic & Attendance Counselor Referral',
      description: 'Generates intervention ticket for guidance counselor when cumulative attendance drops below 85%.',
      triggerEvent: 'Attendance Rate Recalculation',
      condition: 'Attendance Rate < 85%',
      action: 'Create student welfare case & notify Head of Student Affairs',
      channel: 'In-App Notification',
      isActive: true,
      executionsCount: 3,
      lastFired: 'Sep 01, 2025',
    },
    {
      id: 'RULE-004',
      name: 'Automated Entrance Exam High-Scorer Fast-Track',
      description: 'Automatically advances admissions applications with entrance score >= 85% to Committee Interview stage.',
      triggerEvent: 'Entrance Test Score Entered',
      condition: 'Test Score >= 85%',
      action: 'Auto-update application status to "Under Review - Priority Candidate"',
      channel: 'Administrative Webhook',
      isActive: true,
      executionsCount: 19,
      lastFired: '3 hours ago',
    },
    {
      id: 'RULE-005',
      name: 'Exam Result Publication Parent Notification',
      description: 'When teacher submits final grade transcripts, triggers automated portal notification for parent app.',
      triggerEvent: 'Exam Result Verified by Principal',
      condition: 'Term Status = "Published"',
      action: 'Notify parent portal with PDF report card download token',
      channel: 'In-App Notification',
      isActive: false,
      executionsCount: 320,
      lastFired: 'Term 1 Final Session',
    },
  ]);

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newState = !r.isActive;
          showToast(`Rule "${r.name}" is now ${newState ? 'Active' : 'Paused'}.`, 'info');
          return { ...r, isActive: newState };
        }
        return r;
      })
    );
  };

  const handleRunTest = (name: string) => {
    showToast(`Simulation dry-run executed for: ${name}. Zero false-positives found.`, 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Campus Automation & Trigger Engine
            </h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
              Active Daemon
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurable event-driven rules for attendance alerts, bursar reminders, and student counseling workflows
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => showToast('Automation rule builder wizard initialized', 'info')}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Automation Rule
        </Button>
      </div>

      {/* Rules list */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`bg-white border rounded-xl p-5 shadow-2xs transition-all ${
              rule.isActive ? 'border-slate-200/90' : 'border-slate-200 opacity-60 bg-slate-50/50'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    rule.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Zap className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{rule.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400">{rule.id}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRunTest(rule.name)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> Test Run
                </button>

                <button
                  type="button"
                  onClick={() => toggleRule(rule.id)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    rule.isActive ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                  aria-label="Toggle automation rule active status"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      rule.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              {rule.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Trigger Event</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{rule.triggerEvent}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Evaluation Condition</span>
                <span className="font-mono font-semibold text-indigo-700 text-xs mt-0.5 block">{rule.condition}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Dispatched Action & Target</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{rule.action}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
              <span>Channel: <strong className="text-slate-700">{rule.channel}</strong></span>
              <span>Executed <strong>{rule.executionsCount}</strong> times • Last fired: {rule.lastFired}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
