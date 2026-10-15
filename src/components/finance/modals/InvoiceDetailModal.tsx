import React from 'react';
import {
  FileText,
  Printer,
  CreditCard,
  Ban,
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { InvoiceItem, FinancePaymentRecord } from '../../../types/finance';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { financeService } from '../../../services/financeService';

export interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceItem | null;
  onRecordPayment?: (invoice: InvoiceItem) => void;
  onCancelInvoice?: (invoice: InvoiceItem) => void;
  onSendReminder?: (invoice: InvoiceItem) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onRecordPayment,
  onCancelInvoice,
  onSendReminder,
}) => {
  if (!invoice) return null;

  const payments = financeService
    .getFinancePayments()
    .filter((p) => (p.invoiceId === invoice.id || p.invoiceNumber === invoice.invoiceNumber) && !p.isReversed);

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Fee Invoice: ${invoice.invoiceNumber}`}
      subtitle={`Student: ${invoice.studentName} • ${invoice.className || ''}`}
      maxWidth="2xl"
      id="invoice-detail-modal"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print Invoice
            </Button>
            {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && onSendReminder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendReminder(invoice)}
                leftIcon={<Bell className="w-3.5 h-3.5" />}
              >
                Send Reminder
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {invoice.status !== 'PAID' &&
              invoice.status !== 'CANCELLED' &&
              invoice.amountPaid === 0 &&
              onCancelInvoice && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={() => onCancelInvoice(invoice)}
                  leftIcon={<Ban className="w-3.5 h-3.5" />}
                >
                  Cancel Invoice
                </Button>
              )}
            {invoice.balance > 0 && invoice.status !== 'CANCELLED' && onRecordPayment && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onRecordPayment(invoice)}
                leftIcon={<CreditCard className="w-3.5 h-3.5" />}
              >
                Record Payment (${invoice.balance.toLocaleString()})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-slate-800 printable-content">
        {/* Top Header Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                St. Augustine International Academy
              </div>
              <div className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                <FileText className="w-5 h-5 text-indigo-600" />
                {invoice.invoiceNumber}
              </div>
            </div>
            <div>{getStatusBadge(invoice.status)}</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Academic Year</span>
              <span className="font-semibold text-slate-800">{invoice.academicYear}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Billing Period</span>
              <span className="font-semibold text-slate-800">{invoice.feePeriod}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Issue Date</span>
              <span className="font-semibold text-slate-800">{invoice.issueDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Payment Due</span>
              <span
                className={`font-semibold ${
                  invoice.status === 'OVERDUE' ? 'text-rose-600 font-bold' : 'text-slate-800'
                }`}
              >
                {invoice.dueDate}
              </span>
            </div>
          </div>
        </div>

        {/* Student & Guardian Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-white border border-slate-200 rounded-lg">
            <span className="text-slate-400 font-medium block uppercase text-[10px] tracking-wider mb-1">
              Billed Student
            </span>
            <div className="text-sm font-bold text-slate-900">{invoice.studentName}</div>
            <div className="text-slate-500 mt-0.5 font-mono">
              ID: {invoice.studentId} • {invoice.className || 'General'}
              {invoice.sectionName ? ` (${invoice.sectionName})` : ''}
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg">
            <span className="text-slate-400 font-medium block uppercase text-[10px] tracking-wider mb-1">
              Parent / Legal Guardian
            </span>
            <div className="text-sm font-bold text-slate-900">
              {invoice.parentName || 'Registered Family Representative'}
            </div>
            <div className="text-slate-500 mt-0.5">{invoice.parentPhone || 'Contact on institutional record'}</div>
          </div>
        </div>

        {/* Cancellation Notice if Cancelled */}
        {invoice.status === 'CANCELLED' && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            <div className="font-bold flex items-center gap-1.5 mb-0.5">
              <Ban className="w-3.5 h-3.5 text-rose-600" />
              Invoice Cancelled / Voided
            </div>
            <div>Reason: {invoice.cancelledReason || 'Administrative cancellation'}</div>
            {invoice.cancelledBy && (
              <div className="text-[11px] text-rose-600 mt-0.5">
                Authorised by: {invoice.cancelledBy}
              </div>
            )}
          </div>
        )}

        {/* Itemized Line Items Table */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Itemized Fee Components
          </h4>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Amount ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.lineItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{item.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{item.category}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      ${item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculation Summary Breakdown */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">${invoice.subtotal.toLocaleString()}</span>
          </div>

          {invoice.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Applied Discount {invoice.discountName ? `(${invoice.discountName})` : ''}:</span>
              <span className="font-mono font-semibold">-${invoice.discount.toLocaleString()}</span>
            </div>
          )}

          {invoice.scholarship > 0 && (
            <div className="flex justify-between text-indigo-700">
              <span>Scholarship Concession {invoice.scholarshipName ? `(${invoice.scholarshipName})` : ''}:</span>
              <span className="font-mono font-semibold">-${invoice.scholarship.toLocaleString()}</span>
            </div>
          )}

          {invoice.adjustments !== 0 && (
            <div className="flex justify-between text-amber-700">
              <span>Account Adjustments:</span>
              <span className="font-mono font-semibold">
                {invoice.adjustments > 0 ? '+' : ''}${invoice.adjustments.toLocaleString()}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
            <span>Total Payable:</span>
            <span className="font-mono">${invoice.total.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-xs font-semibold text-emerald-600">
            <span>Amount Paid:</span>
            <span className="font-mono">${invoice.amountPaid.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
            <span>Outstanding Balance:</span>
            <span
              className={`font-mono ${
                invoice.balance > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              ${invoice.balance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment History for this Invoice */}
        {payments.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Payment Receipts Logged ({payments.length})
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2 px-3">Receipt #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Reference</th>
                    <th className="py-2 px-3 text-right">Cleared Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono font-bold text-indigo-600">{p.receiptNumber}</td>
                      <td className="py-2 px-3 text-slate-600">{p.paymentDate}</td>
                      <td className="py-2 px-3 text-slate-700 font-medium">{p.method}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{p.transactionReference || '—'}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                        ${p.amountPaid.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
