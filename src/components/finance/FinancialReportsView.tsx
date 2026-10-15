import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Layers,
  PieChart,
  CreditCard,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { FinanceDashboardMetrics, FinancePaymentRecord, InvoiceItem } from '../../types/finance';
import { Button } from '../ui/Button';

export interface FinancialReportsViewProps {
  metrics: FinanceDashboardMetrics;
  payments: FinancePaymentRecord[];
  invoices: InvoiceItem[];
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  metrics,
  payments,
  invoices,
}) => {
  const [reportType, setReportType] = useState<
    'class' | 'methods' | 'invoices' | 'daily'
  >('class');

  const validPayments = payments.filter((p) => !p.isReversed);

  // Method distribution calculation
  const methodTotals: Record<string, number> = {};
  for (const pay of validPayments) {
    methodTotals[pay.method] = (methodTotals[pay.method] || 0) + pay.amountPaid;
  }

  // Daily totals
  const dailyTotals: Record<string, number> = {};
  for (const pay of validPayments) {
    dailyTotals[pay.paymentDate] = (dailyTotals[pay.paymentDate] || 0) + pay.amountPaid;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let rows: (string | number)[][] = [];
    let filename = `financial_report_${reportType}.csv`;

    if (reportType === 'class') {
      rows = [
        ['Class Name', 'Expected Fees', 'Collected Fees', 'Pending Dues', 'Collection Rate %'],
        ...metrics.classWiseCollection.map((c) => [
          c.className,
          c.expected,
          c.collected,
          c.pending,
          c.expected > 0 ? Math.round((c.collected / c.expected) * 100) : 0,
        ]),
      ];
    } else if (reportType === 'methods') {
      rows = [
        ['Payment Method', 'Total Received ($)', 'Transaction Count'],
        ...Object.entries(methodTotals).map(([method, total]) => [
          method,
          total,
          validPayments.filter((p) => p.method === method).length,
        ]),
      ];
    } else if (reportType === 'daily') {
      rows = [
        ['Date', 'Total Collections ($)'],
        ...Object.entries(dailyTotals).map(([date, total]) => [date, total]),
      ];
    } else {
      rows = [
        ['Invoice #', 'Student', 'Class', 'Period', 'Total', 'Paid', 'Balance', 'Status'],
        ...invoices.map((inv) => [
          inv.invoiceNumber,
          inv.studentName,
          inv.className || '',
          inv.feePeriod,
          inv.total,
          inv.amountPaid,
          inv.balance,
          inv.status,
        ]),
      ];
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 printable-content">
      {/* Top Report Selector & Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setReportType('class')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              reportType === 'class'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Class-wise Ledger
          </button>
          <button
            onClick={() => setReportType('methods')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              reportType === 'methods'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Payment Channels
          </button>
          <button
            onClick={() => setReportType('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              reportType === 'daily'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Daily Collections
          </button>
          <button
            onClick={() => setReportType('invoices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              reportType === 'invoices'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Complete Invoices Audit
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        {/* Report Formal Header */}
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Institutional Bursar Audit Statement
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {reportType === 'class'
                ? 'Class Cohort Fee Realization & Collection Analysis'
                : reportType === 'methods'
                ? 'Payment Method Channel Breakdown & Reconciliation'
                : reportType === 'daily'
                ? 'Daily Treasury Inflow & Cash Register Report'
                : 'Comprehensive Student Invoicing & Receivables Master Report'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              St. Augustine International Academy • Academic Year 2025-2026
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-mono">
              Generated: {new Date().toLocaleDateString()}
            </span>
            <span className="text-xs font-bold text-emerald-700 font-mono">
              Total Inflow: ${metrics.totalCollected.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Dynamic Tables Based on Report Type */}
        {reportType === 'class' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Class Cohort</th>
                  <th className="py-2.5 px-3 text-right">Expected Fees</th>
                  <th className="py-2.5 px-3 text-right">Collected</th>
                  <th className="py-2.5 px-3 text-right">Pending Dues</th>
                  <th className="py-2.5 px-3 text-right">Recovery Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.classWiseCollection.map((cw) => {
                  const rate =
                    cw.expected > 0 ? Math.round((cw.collected / cw.expected) * 100) : 0;
                  return (
                    <tr key={cw.className} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">{cw.className}</td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                        ${cw.expected.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                        ${cw.collected.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                        ${cw.pending.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
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
              <tfoot className="border-t-2 border-slate-300 bg-slate-50/50 font-bold text-slate-900">
                <tr>
                  <td className="py-3 px-3">Consolidated Totals</td>
                  <td className="py-3 px-3 text-right font-mono">
                    ${metrics.totalExpected.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600">
                    ${metrics.totalCollected.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-600">
                    ${metrics.totalPending.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-700">
                    {metrics.collectionPercentage}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {reportType === 'methods' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(methodTotals).map(([method, total]) => (
                <div key={method} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                    {method}
                  </span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    ${total.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    {validPayments.filter((p) => p.method === method).length} transactions
                  </span>
                </div>
              ))}
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Payment Channel</th>
                  <th className="py-2.5 px-3 text-right">Transactions</th>
                  <th className="py-2.5 px-3 text-right">Total Cleared</th>
                  <th className="py-2.5 px-3 text-right">% of Receipts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(methodTotals).map(([method, total]) => {
                  const pct =
                    metrics.totalCollected > 0
                      ? Math.round((total / metrics.totalCollected) * 100)
                      : 0;
                  return (
                    <tr key={method}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{method}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {validPayments.filter((p) => p.method === method).length}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        ${total.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'daily' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Transactions</th>
                  <th className="py-2.5 px-3 text-right">Cleared Receipts Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(dailyTotals).map(([date, total]) => (
                  <tr key={date} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{date}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {validPayments.filter((p) => p.paymentDate === date).length}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                      ${total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'invoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Total ($)</th>
                  <th className="py-2.5 px-3 text-right">Paid ($)</th>
                  <th className="py-2.5 px-3 text-right">Balance ($)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-indigo-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800">{inv.studentName}</td>
                    <td className="py-2 px-3 text-slate-600">{inv.feePeriod}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{inv.dueDate}</td>
                    <td className="py-2 px-3 text-right font-mono font-medium">
                      ${inv.total.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-600 font-semibold">
                      ${inv.amountPaid.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                      ${inv.balance.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-[10px] uppercase">
                      {inv.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
