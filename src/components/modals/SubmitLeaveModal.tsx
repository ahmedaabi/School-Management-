import { useState, FormEvent } from 'react';
import { Calendar, Clock, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Student } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export interface SubmitLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onLeaveSubmitted: () => void;
}

export const SubmitLeaveModal = ({
  isOpen,
  onClose,
  student,
  onLeaveSubmitted,
}: SubmitLeaveModalProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [category, setCategory] = useState('Medical Leave');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!student) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Please provide a reason for the leave request.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      dataService.createLeaveRequest({
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        startDate,
        endDate,
        reason: `${category}: ${reason.trim()}`,
        status: 'Pending',
        appliedBy: user?.name || student.fatherGuardianName,
      });

      showToast('Leave request submitted for review.', 'success');
      onLeaveSubmitted();
      onClose();
    } catch {
      showToast('Could not submit leave application.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Leave Application"
      subtitle={`Student: ${student.firstName} ${student.lastName} (${student.studentId})`}
      maxWidth="md"
      id="submit-leave-modal"
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
            leftIcon={<Calendar className="w-3.5 h-3.5" />}
          >
            Submit Application
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason Category <span className="text-rose-500">*</span>
          </label>
          <Select
            value={category}
            onChange={(val) => setCategory(val)}
            options={[
              { value: 'Medical Leave', label: 'Medical Treatment / Illness' },
              { value: 'Family Emergency', label: 'Family Emergency / Bereavement' },
              { value: 'Religious Observance', label: 'Religious Observance' },
              { value: 'Academic Competition', label: 'External Competition / Olympiad' },
              { value: 'Other Authorized Reason', label: 'Other Authorized Leave' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Start Date <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              End Date <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Detailed Explanation & Medical Info <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            placeholder="Explain the circumstances and contact availability during absence..."
            required
          />
        </div>
      </form>
    </Modal>
  );
};
