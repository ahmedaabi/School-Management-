import { useState, FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { PaymentRecord } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';

export interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded?: (payment: PaymentRecord) => void;
}

export const RecordPaymentModal = ({
  isOpen,
  onClose,
  onPaymentRecorded,
}: RecordPaymentModalProps) => {
  const { showToast } = useToast();
  const students = dataService.getStudents();
  const fees = dataService.getFees();

  const [studentId, setStudentId] = useState(students[2]?.studentId || students[0]?.studentId || '');
  const selectedStudent = students.find((s) => s.studentId === studentId || s.id === studentId);

  // Find matching fee or default
  const pendingFees = fees.filter((f) => f.studentId === selectedStudent?.id || f.studentId === selectedStudent?.studentId);
  const [feeId, setFeeId] = useState(pendingFees[0]?.id || fees[0]?.id || 'FEE-003');
  const [amount, setAmount] = useState('1450');
  const [method, setMethod] = useState<PaymentRecord['method']>('Online Bank Transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setIsSubmitting(true);
    try {
      const payment = dataService.recordPayment({
        feeId,
        studentId: selectedStudent.studentId,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        amountPaid: Number(amount) || 1000,
        method,
      });

      showToast(`Payment receipt ${payment.receiptNumber} generated for $${payment.amountPaid.toLocaleString()}`, 'success');
      if (onPaymentRecorded) onPaymentRecorded(payment);
      onClose();
    } catch {
      showToast('Could not record payment receipt.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Fee Payment"
      subtitle="Generate official bursar invoice receipt and reconcile student ledger"
      maxWidth="lg"
      id="record-payment-modal"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Reconcile & Issue Receipt
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Select Student Account"
          value={studentId}
          onChange={(e) => {
            setStudentId(e.target.value);
            const stu = students.find((s) => s.studentId === e.target.value || s.id === e.target.value);
            if (stu?.pendingFeeAmount) {
              setAmount(String(stu.pendingFeeAmount));
            }
          }}
          options={students.map((s) => ({
            value: s.studentId,
            label: `${s.firstName} ${s.lastName} (${s.studentId}) - ${s.className} [Fee: ${s.feeStatus}]`,
          }))}
        />

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>Enrolled Class:</span>
            <span className="font-semibold text-slate-900">{selectedStudent?.className} - {selectedStudent?.sectionName}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Current Balance / Status:</span>
            <span className={`font-semibold ${selectedStudent?.feeStatus === 'Overdue' ? 'text-rose-600' : 'text-slate-800'}`}>
              {selectedStudent?.feeStatus} (${selectedStudent?.pendingFeeAmount || 0})
            </span>
          </div>
        </div>

        <Input
          label="Amount Received (USD $)"
          type="number"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Select
          label="Payment Gateway / Method"
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentRecord['method'])}
          options={[
            { value: 'Online Bank Transfer', label: 'Online Bank Transfer (ACH / Wire)' },
            { value: 'Credit Card', label: 'Credit Card (Visa / Mastercard)' },
            { value: 'Direct Debit', label: 'Direct Debit Automated Clearance' },
            { value: 'Cheque', label: 'Cashier Cheque / Bank Draft' },
          ]}
        />
      </form>
    </Modal>
  );
};
