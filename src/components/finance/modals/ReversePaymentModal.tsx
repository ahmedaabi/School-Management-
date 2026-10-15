import React, { useState } from 'react';
import { Undo2, AlertOctagon } from 'lucide-react';
import { FinancePaymentRecord } from '../../../types/finance';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { financeService } from '../../../services/financeService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export interface ReversePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: FinancePaymentRecord | null;
  onReverseSuccess?: () => void;
  onSuccess?: () => void;
}

export const ReversePaymentModal: React.FC<ReversePaymentModalProps> = ({
  isOpen,
  onClose,
  payment,
  onReverseSuccess,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!payment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Please provide an administrative reason for reversing this payment.', 'error');
      return;
    }

    setIsSubmitting(true);
    const result = financeService.reversePayment(payment.id, reason, currentUser);
    setIsSubmitting(false);

    if (!result.success) {
      showToast(result.error || 'Failed to reverse payment.', 'error');
      return;
    }

    showToast(`Payment receipt ${payment.receiptNumber} reversed and invoice balance reopened.`, 'success');
    if (onReverseSuccess) onReverseSuccess();
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reverse Payment: ${payment.receiptNumber}`}
      subtitle={`Student: ${payment.studentName} • Cleared: $${payment.amountPaid.toLocaleString()}`}
      maxWidth="md"
      id="reverse-payment-modal"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<Undo2 className="w-3.5 h-3.5" />}
          >
            Confirm Reversal & Reopen Balance
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Audited Financial Action</span>
            Reversing this transaction will restore the student's unpaid invoice balance of $
            {payment.amountPaid.toLocaleString()}, invalidate receipt {payment.receiptNumber}, and log an audit entry.
          </div>
        </div>

        <Input
          label="Reversal Reason / Bank Chargeback Reference"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Cheque returned unpaid / transaction charged back / clerical duplicate"
          required
        />
      </form>
    </Modal>
  );
};
