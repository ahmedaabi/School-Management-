import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { InvoiceItem, PaymentMethod } from '../../../types/finance';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { financeService } from '../../../services/financeService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export interface RecordFinancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedInvoice?: InvoiceItem | null;
  prefilledStudentId?: string;
  prefilledInvoiceId?: string;
  onPaymentSuccess?: () => void;
  onSuccess?: () => void;
}

export const RecordFinancePaymentModal: React.FC<RecordFinancePaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedInvoice,
  prefilledStudentId,
  prefilledInvoiceId,
  onPaymentSuccess,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [method, setMethod] = useState<PaymentMethod>('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const openInvoices = financeService
        .getInvoices()
        .filter((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.balance > 0);
      setInvoices(openInvoices);

      if (preselectedInvoice && preselectedInvoice.balance > 0) {
        setSelectedInvoiceId(preselectedInvoice.id);
        setAmount(String(preselectedInvoice.balance));
      } else if (prefilledInvoiceId) {
        const target = openInvoices.find((i) => i.id === prefilledInvoiceId);
        if (target) {
          setSelectedInvoiceId(target.id);
          setAmount(String(target.balance));
        }
      } else if (prefilledStudentId) {
        const target = openInvoices.find((i) => i.studentId === prefilledStudentId);
        if (target) {
          setSelectedInvoiceId(target.id);
          setAmount(String(target.balance));
        }
      } else if (openInvoices.length > 0) {
        setSelectedInvoiceId(openInvoices[0].id);
        setAmount(String(openInvoices[0].balance));
      } else {
        setSelectedInvoiceId('');
        setAmount('');
      }

      setTransactionRef(`TXN-${Date.now().toString().slice(-6)}`);
      setError(null);
    }
  }, [isOpen, preselectedInvoice, prefilledInvoiceId, prefilledStudentId]);

  const activeInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const target = invoices.find((i) => i.id === invId);
    if (target) {
      setAmount(String(target.balance));
    }
  };

  const parsedAmount = Number(amount) || 0;
  const newBalance = activeInvoice ? Math.max(0, activeInvoice.balance - parsedAmount) : 0;
  const isFullSettlement = activeInvoice ? parsedAmount >= activeInvoice.balance : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) {
      setError('Please select an active invoice.');
      return;
    }

    if (parsedAmount <= 0) {
      setError('Payment amount must be greater than $0.00.');
      return;
    }

    if (parsedAmount > activeInvoice.balance) {
      setError(
        `Payment cannot exceed outstanding balance of $${activeInvoice.balance.toLocaleString()}.`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = financeService.recordFinancePayment({
      invoiceId: activeInvoice.id,
      amount: parsedAmount,
      method,
      transactionReference: transactionRef || undefined,
      notes: notes || undefined,
      actor: currentUser,
    });

    setIsSubmitting(false);

    if (!result.success || !result.payment) {
      setError(result.error || 'Failed to record payment.');
      return;
    }

    showToast(
      `Official receipt ${result.payment.receiptNumber} generated for $${parsedAmount.toLocaleString()}`,
      'success'
    );

    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Fee Payment"
      subtitle="Reconcile student tuition statement & issue official electronic receipt"
      maxWidth="lg"
      id="record-finance-payment-modal"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
          >
            Reconcile & Issue Receipt
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Select Target Invoice */}
        <Select
          label="Select Student Invoice"
          value={selectedInvoiceId}
          onChange={(e) => handleInvoiceChange(e.target.value)}
          options={
            invoices.length > 0
              ? invoices.map((inv) => ({
                  value: inv.id,
                  label: `${inv.studentName} • ${inv.invoiceNumber} [Bal: $${inv.balance.toLocaleString()} • ${inv.status}]`,
                }))
              : [{ value: '', label: 'No outstanding unpaid invoices found' }]
          }
        />

        {/* Invoice Summary Card */}
        {activeInvoice && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Student & Class:</span>
              <span className="font-semibold text-slate-800">
                {activeInvoice.studentName} ({activeInvoice.studentId}) • {activeInvoice.className || ''}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Billing Period & Due Date:</span>
              <span className="font-mono text-slate-800">
                {activeInvoice.feePeriod} (Due: {activeInvoice.dueDate})
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Invoice Total:</span>
              <span className="font-mono font-semibold text-slate-800">
                ${activeInvoice.total.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Currently Paid:</span>
              <span className="font-mono text-emerald-600 font-semibold">
                ${activeInvoice.amountPaid.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
              <span>Current Outstanding Balance:</span>
              <span className="font-mono text-rose-600 font-bold">
                ${activeInvoice.balance.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Amount and Payment Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Payment Amount ($)"
            type="number"
            step="0.01"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />

          <Input
            label="Payment Date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </div>

        {/* Payment Method & Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Payment Method / Channel"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            options={[
              { value: 'Bank Transfer', label: 'Bank Transfer / Wire' },
              { value: 'Card', label: 'Credit / Debit Card' },
              { value: 'Cash', label: 'Cash at Bursar Desk' },
              { value: 'Online Payment', label: 'Online Payment Gateway' },
              { value: 'Cheque', label: 'Bank Cheque / Draft' },
              { value: 'Other', label: 'Other Direct Settlement' },
            ]}
          />

          <Input
            label="Transaction / Cheque Ref #"
            type="text"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            placeholder="e.g. WIRE-88192 or CHQ-0021"
          />
        </div>

        {/* Notes */}
        <Input
          label="Notes / Remarks (Optional)"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Settled by guardian at Bursar office counter"
        />

        {/* Balance After Payment Preview */}
        {activeInvoice && parsedAmount > 0 && (
          <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <div>
                <span className="font-semibold text-indigo-900 block">
                  {isFullSettlement ? 'Full Settlement' : 'Partial Payment'}
                </span>
                <span className="text-[11px] text-indigo-700">
                  Remaining balance after clearing: ${newBalance.toLocaleString()}
                </span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                isFullSettlement
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isFullSettlement ? 'Will Mark PAID' : 'Will Mark PARTIAL'}
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
};
