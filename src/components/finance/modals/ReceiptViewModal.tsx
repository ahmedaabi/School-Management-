import React from 'react';
import {
  Printer,
  Download,
  CheckCircle2,
  AlertOctagon,
  School,
  FileCheck,
  Undo2,
} from 'lucide-react';
import { FinancePaymentRecord } from '../../../types/finance';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useAuth } from '../../../context/AuthContext';

export interface ReceiptViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: FinancePaymentRecord | null;
  onReversePayment?: (payment: FinancePaymentRecord) => void;
}

export const ReceiptViewModal: React.FC<ReceiptViewModalProps> = ({
  isOpen,
  onClose,
  payment,
  onReversePayment,
}) => {
  const { can } = useAuth();
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const receiptText = `
ST. AUGUSTINE INTERNATIONAL ACADEMY
OFFICIAL BURSAR RECEIPT: ${payment.receiptNumber}
Date: ${payment.paymentDate}
--------------------------------------------------
Student Name: ${payment.studentName}
Student ID: ${payment.studentId}
Class / Section: ${payment.className || 'N/A'} ${payment.sectionName ? `(${payment.sectionName})` : ''}
Guardian: ${payment.parentName || 'N/A'}
Invoice Ref: ${payment.invoiceNumber}
--------------------------------------------------
Amount Cleared: $${payment.amountPaid.toLocaleString()}
Payment Method: ${payment.method}
Transaction Ref: ${payment.transactionReference || 'N/A'}
Remaining Balance: $${payment.remainingBalanceAfterPayment.toLocaleString()}
Recorded By: ${payment.recordedBy}
Status: ${payment.status}
--------------------------------------------------
This document certifies lawful settlement of institutional fees.
    `.trim();

    const element = document.createElement('a');
    const file = new Blob([receiptText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${payment.receiptNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Official Receipt: ${payment.receiptNumber}`}
      subtitle={`Tuition & Institutional Fee Settlement • ${payment.paymentDate}`}
      maxWidth="lg"
      id="receipt-view-modal"
      footer={
        <div className="flex items-center justify-between w-full">
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
              onClick={handleDownload}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {!payment.isReversed &&
              payment.status !== 'Reversed' &&
              can('fees.edit') &&
              onReversePayment && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={() => onReversePayment(payment)}
                  leftIcon={<Undo2 className="w-3.5 h-3.5" />}
                >
                  Reverse / Refund
                </Button>
              )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-slate-800">
        {/* Certificate Style Container */}
        <div className="p-6 bg-white border-2 border-indigo-900/20 rounded-2xl shadow-sm relative overflow-hidden">
          {/* Subtle watermarked seal */}
          <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
            <School className="w-64 h-64 text-indigo-900" />
          </div>

          {/* Receipt Header */}
          <div className="text-center pb-4 border-b border-slate-200">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 mb-2">
              <School className="w-5 h-5 text-indigo-700" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
              St. Augustine International Academy
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              Bursar’s Office • Office of Treasury & Institutional Finance
            </p>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full">
              <span className="text-xs font-mono font-bold text-indigo-600">
                {payment.receiptNumber}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-500 font-mono">{payment.paymentDate}</span>
            </div>
          </div>

          {/* Reversal Banner if reversed */}
          {payment.isReversed && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold">Transaction Reversed / Voided</div>
                <div className="text-[11px] mt-0.5">
                  Reason: {payment.reversalReason || 'Administrative refund'}
                </div>
                {payment.reversedBy && (
                  <div className="text-[10px] text-rose-600 mt-0.5">
                    Authorised by: {payment.reversedBy}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Student & Payment Summary Grid */}
          <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Received From / Student
              </span>
              <div className="font-bold text-slate-900 text-sm">{payment.studentName}</div>
              <div className="text-slate-500 font-mono">
                Student ID: {payment.studentId}
                {payment.className ? ` • ${payment.className}` : ''}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Guardian / Representative
              </span>
              <div className="font-semibold text-slate-900">
                {payment.parentName || 'Registered Parent/Guardian'}
              </div>
              <div className="text-slate-500 font-mono">Invoice Ref: {payment.invoiceNumber}</div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Method / Channel</th>
                  <th className="py-2.5 px-3">Reference #</th>
                  <th className="py-2.5 px-3 text-right">Cleared Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    Tuition & Levies Settlement
                  </td>
                  <td className="py-3 px-3 text-slate-600">{payment.method}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">
                    {payment.transactionReference || '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 text-sm">
                    ${payment.amountPaid.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Balance Post Payment */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Remaining Student Account Balance Post Settlement:
            </span>
            <span
              className={`font-mono font-bold text-sm ${
                payment.remainingBalanceAfterPayment > 0 ? 'text-rose-600' : 'text-slate-600'
              }`}
            >
              ${payment.remainingBalanceAfterPayment.toLocaleString()}
            </span>
          </div>

          {/* Notes if any */}
          {payment.notes && (
            <div className="mt-3 text-xs text-slate-500 italic bg-white p-2 border border-slate-200 rounded-lg">
              "{payment.notes}"
            </div>
          )}

          {/* Authorization & Signature Block */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              <span className="block text-[10px] text-slate-400">Cashier / Bursar:</span>
              <span className="font-semibold text-slate-800">{payment.recordedBy}</span>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <FileCheck className="w-4 h-4" /> Official Electronic Stamp
              </div>
              <span className="block text-[10px] text-slate-400">Verified System Record</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
