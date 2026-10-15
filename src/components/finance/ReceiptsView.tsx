import React, { useState } from 'react';
import { Receipt, Search, Download, Printer, CheckCircle2, AlertOctagon, Eye } from 'lucide-react';
import { FinancePaymentRecord } from '../../types/finance';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

export interface ReceiptsViewProps {
  payments: FinancePaymentRecord[];
  onViewReceipt: (payment: FinancePaymentRecord) => void;
  onNavigateStudent?: (studentId: string) => void;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({
  payments,
  onViewReceipt,
  onNavigateStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = payments.filter((p) => {
    return (
      p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalReceiptsAmount = filtered
    .filter((p) => !p.isReversed)
    .reduce((sum, p) => sum + p.amountPaid, 0);

  return (
    <div className="space-y-4">
      {/* Top Ledger Header */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Bursar Official Electronic Receipts Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Audited electronic receipts issued for settled institutional fees and charges.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            Reconciled Receipts Value
          </span>
          <div className="text-lg font-bold font-mono text-emerald-600">
            ${totalReceiptsAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
        <div className="relative min-w-[240px] max-w-sm flex-1">
          <Input
            type="text"
            placeholder="Search by receipt #, student name, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {filtered.length} Official Receipts
        </span>
      </div>

      {/* Receipts Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Settlement Channel</th>
                <th className="py-3 px-4 text-right">Amount Cleared</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onViewReceipt(p)}
                      className="font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1.5"
                    >
                      <Receipt className="w-3.5 h-3.5 text-indigo-500" />
                      {p.receiptNumber}
                    </button>
                  </td>

                  <td className="py-3 px-4 text-slate-600 font-mono">{p.paymentDate}</td>

                  <td className="py-3 px-4">
                    <button
                      onClick={() => onNavigateStudent && onNavigateStudent(p.studentId)}
                      className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block text-left"
                    >
                      {p.studentName}
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ID: {p.studentId}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-600">{p.className}</td>

                  <td className="py-3 px-4 font-mono text-slate-600">{p.invoiceNumber}</td>

                  <td className="py-3 px-4 text-slate-700">
                    <span className="font-medium">{p.method}</span>
                    {p.transactionReference && (
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Ref: {p.transactionReference}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 text-sm">
                    ${p.amountPaid.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {p.isReversed ? (
                      <Badge variant="danger" size="sm" className="gap-1">
                        <AlertOctagon className="w-3 h-3" /> Reversed
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Valid
                      </Badge>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[11px] py-1 px-2.5 h-auto"
                      onClick={() => onViewReceipt(p)}
                      leftIcon={<Eye className="w-3 h-3" />}
                    >
                      View & Print
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            No receipts recorded for this query.
          </div>
        )}
      </div>
    </div>
  );
};
