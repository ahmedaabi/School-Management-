import React from 'react';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  FileText,
  Percent,
  PlayCircle,
  Receipt,
  Users,
} from 'lucide-react';
import { FinanceDashboardMetrics, InvoiceItem, FinancePaymentRecord } from '../../types/finance';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface FinanceDashboardViewProps {
  metrics: FinanceDashboardMetrics;
  recentPayments: FinancePaymentRecord[];
  overdueInvoices: InvoiceItem[];
  onOpenRecordPayment: () => void;
  onOpenBatchGenerate: () => void;
  onSelectTab: (tabId: string) => void;
  onViewInvoice: (invoice: InvoiceItem) => void;
  onViewReceipt: (payment: FinancePaymentRecord) => void;
}

export const FinanceDashboardView: React.FC<FinanceDashboardViewProps> = ({
  metrics,
  recentPayments,
  overdueInvoices,
  onOpenRecordPayment,
  onOpenBatchGenerate,
  onSelectTab,
  onViewInvoice,
  onViewReceipt,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Action Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white shadow-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Treasury & Bursar Overview
          </div>
          <h2 className="text-xl font-bold text-white mt-0.5">
            Institutional Finance Intelligence
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time reconciliation, billing automation, and collection performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="border-indigo-400/40 text-white hover:bg-white/10"
            onClick={onOpenBatchGenerate}
            leftIcon={<PlayCircle className="w-3.5 h-3.5 text-indigo-300" />}
          >
            Generate Invoices
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenRecordPayment}
            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid - Top Level */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expected */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Expected Fees</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            ${metrics.totalExpected.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span>Academic Term 2025-2026</span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Collected</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">
            ${metrics.totalCollected.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono">
              {metrics.collectionPercentage}%
            </span>
            <span className="text-slate-500">Realization Rate</span>
          </div>
        </div>

        {/* Total Pending */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Dues</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 font-mono">
            ${metrics.totalPending.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Within due grace period</span>
            <button
              onClick={() => onSelectTab('pending')}
              className="text-indigo-600 font-semibold hover:underline"
            >
              View list
            </button>
          </div>
        </div>

        {/* Total Overdue */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Overdue</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 font-mono">
            ${metrics.totalOverdue.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span className="text-rose-600 font-semibold">{metrics.overdueCount} Accounts</span>
            <button
              onClick={() => onSelectTab('overdue')}
              className="text-rose-600 font-semibold hover:underline"
            >
              Take action
            </button>
          </div>
        </div>
      </div>

      {/* Collection Period Comparative Benchmarks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Today’s Collections</span>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              ${metrics.todayCollection.toLocaleString()}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-200 text-indigo-600">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">This Month’s Inflow</span>
            <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">
              ${metrics.thisMonthCollection.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Active
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Previous Month Closed</span>
            <div className="text-lg font-bold text-slate-700 font-mono mt-0.5">
              ${metrics.previousMonthCollection.toLocaleString()}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Progress & Status Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Collection Progress & Ratio */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Collection Recovery Ratio</h3>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {metrics.collectionPercentage}%
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.collectionPercentage)}%` }}
            />
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Fully Paid Invoices:
              </span>
              <span className="font-bold text-slate-900 font-mono">{metrics.paidCount}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Partially Paid / In Grace:
              </span>
              <span className="font-bold text-slate-900 font-mono">{metrics.partialCount}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                Newly Issued:
              </span>
              <span className="font-bold text-slate-900 font-mono">{metrics.issuedCount}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Overdue / Delinquent:
              </span>
              <span className="font-bold text-rose-600 font-mono">{metrics.overdueCount}</span>
            </div>
          </div>
        </div>

        {/* Class-wise Performance Table */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Class-wise Collection Progress</h3>
            <button
              onClick={() => onSelectTab('reports')}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Full Financial Audit
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-medium">
                  <th className="pb-2">Class Cohort</th>
                  <th className="pb-2 text-right">Expected</th>
                  <th className="pb-2 text-right">Collected</th>
                  <th className="pb-2 text-right">Outstanding</th>
                  <th className="pb-2 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.classWiseCollection.slice(0, 5).map((cw) => {
                  const rate =
                    cw.expected > 0 ? Math.round((cw.collected / cw.expected) * 100) : 0;
                  return (
                    <tr key={cw.className} className="hover:bg-slate-50/70">
                      <td className="py-2.5 font-semibold text-slate-800">{cw.className}</td>
                      <td className="py-2.5 text-right font-mono text-slate-600">
                        ${cw.expected.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-mono text-emerald-600 font-semibold">
                        ${cw.collected.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-mono text-rose-600 font-semibold">
                        ${cw.pending.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                            rate >= 80
                              ? 'bg-emerald-50 text-emerald-700'
                              : rate >= 60
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Overdue Invoices Alert & Recent Payments Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Overdue Invoices */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Urgent Overdue Invoices</h3>
            </div>
            <button
              onClick={() => onSelectTab('overdue')}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              View all ({overdueInvoices.length})
            </button>
          </div>

          {overdueInvoices.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No accounts currently past payment deadline.
            </div>
          ) : (
            <div className="space-y-2">
              {overdueInvoices.slice(0, 4).map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => onViewInvoice(inv)}
                  className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{inv.studentName}</div>
                    <div className="text-slate-500 text-[11px] font-mono">
                      {inv.invoiceNumber} • Due: {inv.dueDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-rose-600">
                      ${inv.balance.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-rose-500 font-semibold uppercase">
                      Overdue
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payment Inflow */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Recent Payment Receipts</h3>
            </div>
            <button
              onClick={() => onSelectTab('receipts')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View ledger ({recentPayments.length})
            </button>
          </div>

          {recentPayments.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No payments logged yet.
            </div>
          ) : (
            <div className="space-y-2">
              {recentPayments.slice(0, 4).map((pay) => (
                <div
                  key={pay.id}
                  onClick={() => onViewReceipt(pay)}
                  className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      {pay.studentName}
                      <span className="text-[11px] font-mono font-normal text-slate-500">
                        ({pay.receiptNumber})
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {pay.paymentDate} • {pay.method}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-600">
                      +${pay.amountPaid.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold uppercase">
                      Cleared
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
