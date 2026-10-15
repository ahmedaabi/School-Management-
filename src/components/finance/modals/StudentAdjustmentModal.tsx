import React, { useState, useEffect } from 'react';
import { AdjustmentType } from '../../../types/finance';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { financeService } from '../../../services/financeService';
import { dataService } from '../../../services/dataService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export interface StudentAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string | null;
  preselectedStudentId?: string;
  onSuccess?: () => void;
  onAdjustmentSuccess?: () => void;
}

export const StudentAdjustmentModal: React.FC<StudentAdjustmentModalProps> = ({
  isOpen,
  onClose,
  studentId: propStudentId,
  preselectedStudentId,
  onSuccess,
  onAdjustmentSuccess,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const students = dataService.getStudents();

  const activeStudentId = propStudentId || preselectedStudentId || students[0]?.studentId || students[0]?.id || '';
  const [selectedStudentId, setSelectedStudentId] = useState(activeStudentId);
  const [type, setType] = useState<AdjustmentType>('Waiver');
  const [amount, setAmount] = useState('100');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (propStudentId || preselectedStudentId) {
        setSelectedStudentId(propStudentId || preselectedStudentId || '');
      } else if (students.length > 0) {
        setSelectedStudentId(students[0].studentId || students[0].id);
      }
      setAmount('100');
      setReason('');
      setType('Waiver');
    }
  }, [isOpen, propStudentId, preselectedStudentId]);

  const selectedStudent = students.find((s) => s.studentId === selectedStudentId || s.id === selectedStudentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      showToast('Please select a student account.', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Please provide an administrative reason for the adjustment.', 'error');
      return;
    }

    const result = financeService.applyStudentAdjustment(
      {
        studentId: selectedStudent.studentId || selectedStudent.id,
        type,
        amount: Number(amount) || 0,
        reason,
      },
      currentUser
    );

    if (!result.success) {
      showToast(result.error || 'Failed to apply adjustment.', 'error');
      return;
    }

    showToast(`Adjustment of $${Number(amount).toLocaleString()} (${type}) applied to ${selectedStudent.firstName}.`, 'success');
    if (onAdjustmentSuccess) onAdjustmentSuccess();
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply Student Fee Adjustment"
      subtitle="Issue fee waiver, special debit charge, credit, or late penalty"
      maxWidth="md"
      id="student-adjustment-modal"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            Apply Adjustment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Student Account"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          options={students.map((s) => ({
            value: s.studentId || s.id,
            label: `${s.firstName} ${s.lastName} (${s.studentId || s.id}) • ${s.className}`,
          }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Adjustment Type"
            value={type}
            onChange={(e) => setType(e.target.value as AdjustmentType)}
            options={[
              { value: 'Waiver', label: 'Fee Waiver (Reduces bill)' },
              { value: 'Credit', label: 'Credit Balance (Reduces bill)' },
              { value: 'Debit', label: 'Debit Surcharge (Adds to bill)' },
              { value: 'Late Fee', label: 'Late Fee Penalty (Adds to bill)' },
              { value: 'Penalty', label: 'Disciplinary Penalty (Adds to bill)' },
            ]}
          />

          <Input
            label="Amount ($)"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <Input
          label="Administrative Reason / Authority"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Approved medical concession by Headmaster"
          required
        />
      </form>
    </Modal>
  );
};
