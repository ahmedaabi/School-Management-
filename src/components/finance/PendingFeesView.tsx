import React, { useState } from 'react';
import { Clock, CreditCard, Bell, Search, Download, CheckCircle2 } from 'lucide-react';
import { InvoiceItem } from '../../types/finance';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export interface PendingFeesViewProps {
  invoices: InvoiceItem[];
  onViewInvoice: (invoice: InvoiceItem) => void;
  onRecordPayment: (invoice: InvoiceItem) => void;
  onSendReminder: (invoice: InvoiceItem) => void;
  onNavigateStudent?: (studentId: string) => void;
}

export const PendingFeesView: React.FC<PendingFeesViewProps> = ({
  invoices,
  onViewInvoice,
  onRecordPayment,
  onSendReminder,
  onNavigateStudent,
}) => {
  const { can } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');

  // Pending includes ISSUED and PARTIALLY_PAID
  const pendingInvoices = invoices.filter(
    (inv) => (inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID') && inv.balance > 0
  );

  const classes = Array.from(new Set(pendingInvoices.map((i) => i.className).filter(Boolean)));

  const filtered = pendingInvoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'All' || inv.className === classFilter;
    return matchesSearch && matchesClass;
  });

  const totalPendingAmount = filtered.reduce((sum, i) => sum + i.balance, 0);

  const handleExportCSV = () => {
    const rows = [
      ['Invoice Number', 'Student Name', 'Student ID', 'Class', 'Billing Period', 'Due Date', 'Total Payable', 'Amount Paid', 'Outstanding Balance'],
      ...filtered.map((i) => [
        i.invoiceNumber,
        i.studentName,
        i.studentId,
        i.className || '',
        i.feePeriod,
        i.dueDate,
        i.total,
        i.amountPaid,
        i.balance,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pending_fees_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Summary KPI Banner */}
      <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-amber-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Total Outstanding Accounts in Grace
            </div>
            <div className="text-xl font-bold font-mono text-amber-950">
              ${totalPendingAmount.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-amber-800">
            {filtered.length} pending statements
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="border-amber-300 text-amber-900 hover:bg-amber-100"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl">
        <div className="relative min-w-[240px] max-w-sm flex-1">
          <Input
            type="text"
            placeholder="Search student or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium"
        >
          <option value="All">All Cohorts</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Payment Due</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="font-mono font-bold text-indigo-600 hover:underline"
                    >
                      {inv.invoiceNumber}
                    </button>
                  </td>

                  <td className="py-3 px-4">
                    <button
                      onClick={() => onNavigateStudent && onNavigateStudent(inv.studentId)}
                      className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left block"
                    >
                      {inv.studentName}
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ID: {inv.studentId}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-600">{inv.className}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{inv.feePeriod}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{inv.dueDate}</td>

                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                    ${inv.total.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                    ${inv.amountPaid.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                    ${inv.balance.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSendReminder(inv)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Send Reminder"
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </button>

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
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            No pending invoices awaiting settlement.
          </div>
        )}
      </div>
    </div>
  );
};
