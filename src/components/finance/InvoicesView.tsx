import React, { useState } from 'react';
import {
  FileText,
  CreditCard,
  Bell,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  PlayCircle,
  Search,
} from 'lucide-react';
import { InvoiceItem } from '../../types/finance';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export interface InvoicesViewProps {
  invoices: InvoiceItem[];
  onViewInvoice: (invoice: InvoiceItem) => void;
  onRecordPayment: (invoice: InvoiceItem) => void;
  onSendReminder: (invoice: InvoiceItem) => void;
  onOpenBatchGenerate: () => void;
  onNavigateStudent?: (studentId: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  onViewInvoice,
  onRecordPayment,
  onSendReminder,
  onOpenBatchGenerate,
  onNavigateStudent,
}) => {
  const { can } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState('All');

  const periods = Array.from(new Set(invoices.map((i) => i.feePeriod)));

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    const matchesPeriod = periodFilter === 'All' || inv.feePeriod === periodFilter;
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const getStatusBadge = (status: InvoiceItem['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <Badge variant="success" size="sm" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Paid
          </Badge>
        );
      case 'PARTIALLY_PAID':
        return (
          <Badge variant="warning" size="sm" className="gap-1">
            <Clock className="w-3 h-3" /> Partially Paid
          </Badge>
        );
      case 'OVERDUE':
        return (
          <Badge variant="danger" size="sm" className="gap-1">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="neutral" size="sm" className="gap-1">
            <XCircle className="w-3 h-3" /> Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="info" size="sm" className="gap-1">
            <Clock className="w-3 h-3" /> Issued
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Input
              type="text"
              placeholder="Search by invoice #, student name, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium"
          >
            <option value="All">All Invoices</option>
            <option value="ISSUED">Issued (Unpaid)</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Fully Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium"
          >
            <option value="All">All Billing Periods</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {can('fees.create') && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenBatchGenerate}
            leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
          >
            Generate Monthly Billing
          </Button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      {inv.invoiceNumber}
                    </button>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Issued: {inv.issueDate}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <button
                      onClick={() => onNavigateStudent && onNavigateStudent(inv.studentId)}
                      className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left block"
                    >
                      {inv.studentName}
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {inv.studentId} • {inv.className || ''}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-600 font-medium">{inv.feePeriod}</td>

                  <td className="py-3 px-4">
                    <span
                      className={`font-medium ${
                        inv.status === 'OVERDUE' ? 'text-rose-600 font-bold' : 'text-slate-700'
                      }`}
                    >
                      {inv.dueDate}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                    ${inv.total.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                    ${inv.amountPaid.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold">
                    <span className={inv.balance > 0 ? 'text-rose-600' : 'text-slate-400'}>
                      ${inv.balance.toLocaleString()}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">{getStatusBadge(inv.status)}</td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {inv.balance > 0 && inv.status !== 'CANCELLED' && (
                        <>
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
                        </>
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
            No invoices found for the specified filters.
          </div>
        )}
      </div>
    </div>
  );
};
