import React, { useState } from 'react';
import {
  Receipt,
  Download,
  Printer,
  Undo2,
  Search,
  CheckCircle2,
  AlertOctagon,
  CreditCard,
} from 'lucide-react';
import { FinancePaymentRecord } from '../../types/finance';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export interface PaymentsViewProps {
  payments: FinancePaymentRecord[];
  onViewReceipt: (payment: FinancePaymentRecord) => void;
  onReversePayment: (payment: FinancePaymentRecord) => void;
  onOpenRecordPayment: () => void;
  onNavigateStudent?: (studentId: string) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  onViewReceipt,
  onReversePayment,
  onOpenRecordPayment,
  onNavigateStudent,
}) => {
  const { can } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = payments.filter((pay) => {
    const matchesSearch =
      pay.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pay.transactionReference &&
        pay.transactionReference.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMethod = methodFilter === 'All' || pay.method === methodFilter;
    const matchesStatus = statusFilter === 'All' || pay.status === statusFilter;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Input
              type="text"
              placeholder="Search by receipt #, student name, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium"
          >
            <option value="All">All Payment Methods</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Credit / Debit Card</option>
            <option value="Cash">Cash at Bursar</option>
            <option value="Online Payment">Online Gateway</option>
            <option value="Cheque">Cheque</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed / Cleared</option>
            <option value="Reversed">Reversed / Voided</option>
          </select>
        </div>

        {can('payments.create') && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenRecordPayment}
            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
          >
            Record Payment
          </Button>
        )}
      </div>

      {/* Payments Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Invoice Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onViewReceipt(pay)}
                      className="font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1.5"
                    >
                      <Receipt className="w-3.5 h-3.5 text-indigo-500" />
                      {pay.receiptNumber}
                    </button>
                  </td>

                  <td className="py-3 px-4">
                    <button
                      onClick={() => onNavigateStudent && onNavigateStudent(pay.studentId)}
                      className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block text-left"
                    >
                      {pay.studentName}
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ID: {pay.studentId}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-600">{pay.invoiceNumber}</td>

                  <td className="py-3 px-4 text-slate-600">{pay.paymentDate}</td>

                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800 block">{pay.method}</span>
                    {pay.transactionReference && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Ref: {pay.transactionReference}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 text-sm">
                    ${pay.amountPaid.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-slate-600 text-[11px]">{pay.recordedBy}</td>

                  <td className="py-3 px-4 text-center">
                    {pay.isReversed || pay.status === 'Reversed' ? (
                      <Badge variant="danger" size="sm" className="gap-1">
                        <AlertOctagon className="w-3 h-3" /> Reversed
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </Badge>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] py-1 px-2 h-auto"
                        onClick={() => onViewReceipt(pay)}
                        leftIcon={<Receipt className="w-3 h-3" />}
                      >
                        Receipt
                      </Button>

                      {!pay.isReversed &&
                        pay.status !== 'Reversed' &&
                        can('fees.edit') && (
                          <button
                            onClick={() => onReversePayment(pay)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Reverse / Refund Transaction"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
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
            No payment transaction records found.
          </div>
        )}
      </div>
    </div>
  );
};
