import React, { useState } from 'react';
import { Calendar, PlayCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { financeService } from '../../../services/financeService';
import { dataService } from '../../../services/dataService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export interface BatchGenerateInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSuccess?: () => void;
  onSuccess?: () => void;
}

export const BatchGenerateInvoicesModal: React.FC<BatchGenerateInvoicesModalProps> = ({
  isOpen,
  onClose,
  onGenerateSuccess,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const classes = dataService.getClasses();

  const [feePeriod, setFeePeriod] = useState('April 2026');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [dueDate, setDueDate] = useState('2026-04-15');
  const [classFilter, setClassFilter] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    generatedCount: number;
    skippedCount: number;
    totalBilled: number;
  } | null>(null);

  const handleGenerate = () => {
    setIsProcessing(true);
    setResult(null);

    setTimeout(() => {
      const res = financeService.generateMonthlyInvoices(
        {
          feePeriod,
          academicYear,
          dueDate,
          classId: classFilter || undefined,
        },
        currentUser
      );

      setIsProcessing(false);
      setResult(res);

      if (res.generatedCount > 0) {
        showToast(
          `Generated ${res.generatedCount} invoices totalling $${res.totalBilled.toLocaleString()}`,
          'success'
        );
        if (onGenerateSuccess) onGenerateSuccess();
        if (onSuccess) onSuccess();
      } else {
        showToast(`No new invoices generated (${res.skippedCount} students already had invoices).`, 'info');
      }
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Automated Fee Billing Engine"
      subtitle="Batch generate monthly or term invoices across student cohorts"
      maxWidth="md"
      id="batch-generate-invoices-modal"
      footer={
        result ? (
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              isLoading={isProcessing}
              leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
            >
              Run Generation Batch
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Billing Generation Completed
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between">
              <span>Billing Period:</span>
              <span className="font-semibold">{feePeriod}</span>
            </div>
            <div className="flex justify-between">
              <span>New Invoices Created:</span>
              <span className="font-semibold font-mono">{result.generatedCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Skipped (Already Billed):</span>
              <span className="font-semibold font-mono">{result.skippedCount}</span>
            </div>
            <div className="flex justify-between border-t border-emerald-200 pt-1.5 font-bold">
              <span>Total New Receivables:</span>
              <span className="font-mono text-emerald-800">
                ${result.totalBilled.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Billing Period / Month"
              type="text"
              value={feePeriod}
              onChange={(e) => setFeePeriod(e.target.value)}
              placeholder="e.g. April 2026"
              required
            />

            <Select
              label="Academic Year"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              options={[
                { value: '2025-2026', label: '2025-2026' },
                { value: '2026-2027', label: '2026-2027' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Payment Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />

            <Select
              label="Target Class Cohort"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={[
                { value: '', label: 'All Active School Classes' },
                ...classes.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Automated Calculation Engine
            </div>
            <p>
              The system matches each active enrolled student to their designated grade fee schedule, applies active sibling/merit discounts and scholarships automatically, calculates net payable amounts, and prevents duplicate billing.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
