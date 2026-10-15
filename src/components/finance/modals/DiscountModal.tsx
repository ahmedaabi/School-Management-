import React, { useState, useEffect } from 'react';
import { DiscountItem } from '../../../types/finance';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { financeService } from '../../../services/financeService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  discount?: DiscountItem | null;
  discountToEdit?: DiscountItem | null;
  onSuccess?: () => void;
  onSaveSuccess?: () => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  discount,
  discountToEdit,
  onSuccess,
  onSaveSuccess,
}) => {
  const targetDiscount = discount || discountToEdit;
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState<'Percentage' | 'Fixed'>('Percentage');
  const [value, setValue] = useState('15');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('2027-06-30');

  useEffect(() => {
    if (isOpen) {
      if (targetDiscount) {
        setName(targetDiscount.name);
        setType(targetDiscount.type);
        setValue(String(targetDiscount.value));
        setReason(targetDiscount.reason || '');
        setStartDate(targetDiscount.startDate || new Date().toISOString().split('T')[0]);
        setEndDate(targetDiscount.endDate || '2027-06-30');
      } else {
        setName('Sibling Enrollment Concession');
        setType('Percentage');
        setValue('15');
        setReason('15% discount applied across tuition for second enrolled sibling.');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('2027-06-30');
      }
    }
  }, [isOpen, targetDiscount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please specify a discount name.', 'error');
      return;
    }

    financeService.saveDiscount(
      {
        id: targetDiscount ? targetDiscount.id : undefined,
        name,
        type,
        value: Number(value) || 0,
        startDate,
        endDate,
        reason,
        approvalStatus: 'Approved',
        createdBy: `${currentUser?.name || 'Administrator'} (${currentUser?.role || 'Staff'})`,
        approvedBy: currentUser?.name || 'Principal',
      },
      currentUser
    );

    showToast(
      targetDiscount ? 'Discount policy updated.' : 'Discount concession approved & saved.',
      'success'
    );
    if (onSaveSuccess) onSaveSuccess();
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={targetDiscount ? 'Edit Discount Concession' : 'Create Fee Discount Policy'}
      subtitle="Establish institutional sibling, staff, or merit fee concessions"
      maxWidth="md"
      id="discount-modal"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            {targetDiscount ? 'Save Changes' : 'Approve & Save'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Discount Title"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sibling Relief Discount"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Discount Calculation"
            value={type}
            onChange={(e) => setType(e.target.value as 'Percentage' | 'Fixed')}
            options={[
              { value: 'Percentage', label: 'Percentage (%)' },
              { value: 'Fixed', label: 'Fixed Dollar ($)' },
            ]}
          />
          <Input
            label={type === 'Percentage' ? 'Rate (%)' : 'Amount ($)'}
            type="number"
            min="1"
            max={type === 'Percentage' ? '100' : '10000'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valid From"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            label="Valid Until"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <Input
          label="Policy Description / Eligibility Note"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Applicable to second enrolled child from the same household"
          required
        />
      </form>
    </Modal>
  );
};
