import React, { useState } from 'react';
import { Ban, AlertTriangle } from 'lucide-react';
import { InvoiceItem } from '../../../types/finance';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { financeService } from '../../../services/financeService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export interface CancelInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceItem | null;
  onCancelSuccess?: () => void;
  onSuccess?: () => void;
}

export const CancelInvoiceModal: React.FC<CancelInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onCancelSuccess,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Please provide a reason for cancelling this invoice.', 'error');
      return;
    }

    setIsSubmitting(true);
    const result = financeService.cancelInvoice(invoice.id, reason, currentUser);
    setIsSubmitting(false);

    if (!result.success) {
      showToast(result.error || 'Failed to cancel invoice.', 'error');
      return;
    }

    showToast(`Invoice ${invoice.invoiceNumber} has been cancelled.`, 'success');
    if (onCancelSuccess) onCancelSuccess();
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cancel Invoice: ${invoice.invoiceNumber}`}
      subtitle={`Student: ${invoice.studentName} • Total: $${invoice.total.toLocaleString()}`}
      maxWidth="md"
      id="cancel-invoice-modal"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Abort
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<Ban className="w-3.5 h-3.5" />}
          >
            Confirm Invoice Cancellation
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Caution: Irreversible Action</span>
            Cancelling an invoice voids all associated line items and stops further automated payment reminders. This action is permanently recorded in the institutional audit log.
          </div>
        </div>

        <Input
          label="Cancellation Reason (Required for Audit)"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Generated in error / student transfer / schedule reassigned"
          required
        />
      </form>
    </Modal>
  );
};
