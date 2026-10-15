import { useState, FormEvent } from 'react';
import { Users, ArrowRight, Shield } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { StudentStatus } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export interface BulkReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudentIds: string[];
  onComplete: () => void;
}

export const BulkReassignModal = ({
  isOpen,
  onClose,
  selectedStudentIds,
  onComplete,
}: BulkReassignModalProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const classes = dataService.getClasses();

  const [operationType, setOperationType] = useState<'class' | 'status'>('class');

  // Class reassign state
  const [targetClassId, setTargetClassId] = useState(classes[0]?.id || 'CLS-001');
  const targetClass = classes.find((c) => c.id === targetClassId) || classes[0];
  const [targetSectionId, setTargetSectionId] = useState(targetClass?.sections[0]?.id || 'SEC-001');

  // Status reassign state
  const [targetStatus, setTargetStatus] = useState<StudentStatus>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const actor = { name: user?.name || 'Administrator', role: user?.role || 'Super Admin' };

      if (operationType === 'class') {
        const targetSection = targetClass?.sections.find((s) => s.id === targetSectionId);
        const count = dataService.bulkChangeClass(
          selectedStudentIds,
          targetClass.id,
          targetClass.name,
          targetSection?.id || 'SEC-001',
          targetSection?.name || 'Section A',
          actor
        );
        showToast(`Successfully reassigned ${count} students to ${targetClass.name} ${targetSection?.name}.`, 'success');
      } else {
        const count = dataService.bulkUpdateStatus(selectedStudentIds, targetStatus, actor);
        showToast(`Successfully updated status of ${count} students to "${targetStatus}".`, 'success');
      }

      onComplete();
      onClose();
    } catch {
      showToast('Could not process bulk operation.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Reassign & Status Management"
      subtitle={`Selected cohort: ${selectedStudentIds.length} student${selectedStudentIds.length > 1 ? 's' : ''}`}
      maxWidth="md"
      id="bulk-reassign-modal"
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
            leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Apply Changes to Cohort
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle Mode */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setOperationType('class')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              operationType === 'class'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Change Class / Section
          </button>
          <button
            type="button"
            onClick={() => setOperationType('status')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              operationType === 'status'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Change Student Status
          </button>
        </div>

        {operationType === 'class' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Academic Class <span className="text-rose-500">*</span>
              </label>
              <Select
                value={targetClassId}
                onChange={(val) => {
                  setTargetClassId(val);
                  const newCls = classes.find((c) => c.id === val);
                  if (newCls && newCls.sections[0]) {
                    setTargetSectionId(newCls.sections[0].id);
                  }
                }}
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Section <span className="text-rose-500">*</span>
              </label>
              <Select
                value={targetSectionId}
                onChange={(val) => setTargetSectionId(val)}
                options={
                  targetClass?.sections.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.roomNumber})`,
                  })) || []
                }
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Status for Cohort <span className="text-rose-500">*</span>
            </label>
            <Select
              value={targetStatus}
              onChange={(val) => setTargetStatus(val as StudentStatus)}
              options={[
                { value: 'Active', label: 'Active (Enrolled & Attending)' },
                { value: 'Inactive', label: 'Inactive (Archived from active roster)' },
                { value: 'Graduated', label: 'Graduated (Alumni)' },
                { value: 'Transferred', label: 'Transferred to another institution' },
                { value: 'Suspended', label: 'Suspended (Temporary disciplinary hold)' },
              ]}
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <Shield className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            This bulk operation will automatically create verifiable audit trail entries for each affected student.
          </span>
        </div>
      </form>
    </Modal>
  );
};
