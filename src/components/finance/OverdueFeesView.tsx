import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CreditCard,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react';
import { InvoiceItem } from '../../types/finance';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { financeService } from '../../services/financeService';

export interface OverdueFeesViewProps {
  invoices: InvoiceItem[];
  onViewInvoice: (invoice: InvoiceItem) => void;
  onRecordPayment: (invoice: InvoiceItem) => void;
  onSendReminder: (invoice: InvoiceItem) => void;
  onRefresh?: () => void;
  onNavigateStudent?: (studentId: string) => void;
}

export const OverdueFeesView: React.FC<OverdueFeesViewProps> = ({
  invoices,
  onViewInvoice,
  onRecordPayment,
  onSendReminder,
  onRefresh,
  onNavigateStudent,
}) => {
  const { can, currentUser } = useAuth();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isBulkSending, setIsBulkSending] = useState(false);

  const overdueInvoices = invoices.filter(
    (inv) => inv.status === 'OVERDUE' && inv.balance > 0
  );

  const filtered = overdueInvoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalOverdue = filtered.reduce((sum, i) => sum + i.balance, 0);

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  const handleBulkReminders = () => {
    if (filtered.length === 0) return;
    setIsBulkSending(true);

    let sent = 0;
    for (const inv of filtered) {
      financeService.sendPaymentReminder(inv.id, currentUser);
      sent++;
    }

    setTimeout(() => {
      setIsBulkSending(false);
      showToast(`Sent ${sent} overdue payment notices to guardians.`, 'success');
      if (onRefresh) onRefresh();
    }, 400);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Invoice Number', 'Student Name', 'Student ID', 'Class', 'Due Date', 'Days Overdue', 'Outstanding Amount', 'Reminders Sent'],
      ...filtered.map((i) => [
        i.invoiceNumber,
        i.studentName,
        i.studentId,
        i.className || '',
        i.dueDate,
        getDaysOverdue(i.dueDate),
        i.balance,
        i.reminderCount || 0,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `overdue_fees_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Alert Ribbon */}
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-rose-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Total Delinquent Overdue Arrears
            </div>
            <div className="text-xl font-bold font-mono text-rose-950">
              ${totalOverdue.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="border-rose-300 text-rose-900 hover:bg-rose-100"
          >
            Export List
          </Button>

          {can('fees.edit') && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleBulkReminders}
              isLoading={isBulkSending}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send Notices to All ({filtered.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
        <div className="relative min-w-[240px] max-w-sm flex-1">
          <Input
            type="text"
            placeholder="Search overdue student or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filtered.length} overdue invoices
        </span>
      </div>

      {/* Overdue Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Lapse</th>
                <th className="py-3 px-4 text-right">Overdue Balance</th>
                <th className="py-3 px-4 text-center">Reminders</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => {
                const days = getDaysOverdue(inv.dueDate);
                return (
                  <tr key={inv.id} className="hover:bg-rose-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="font-mono font-bold text-rose-600 hover:underline"
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => onNavigateStudent && onNavigateStudent(inv.studentId)}
                        className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block text-left"
                      >
                        {inv.studentName}
                      </button>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {inv.studentId}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">{inv.className}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{inv.dueDate}</td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        {days} {days === 1 ? 'day' : 'days'} overdue
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 text-sm">
                      ${inv.balance.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="text-[11px] text-slate-600 font-medium">
                        {inv.reminderCount || 0} notices
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] py-1 px-2.5 h-auto text-amber-700 border-amber-200 hover:bg-amber-50"
                          onClick={() => onSendReminder(inv)}
                          leftIcon={<Bell className="w-3 h-3" />}
                        >
                          Remind
                        </Button>

                        {can('payments.create') && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-[11px] py-1 px-2.5 h-auto"
                            onClick={() => onRecordPayment(inv)}
                            leftIcon={<CreditCard className="w-3 h-3" />}
                          >
                            Collect
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            Excellent! There are currently no overdue accounts.
          </div>
        )}
      </div>
    </div>
  );
};
