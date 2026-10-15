import { useState, FormEvent } from 'react';
import { MessageSquare, Shield } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { StudentStaffNote } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onNoteAdded: () => void;
}

export const AddNoteModal = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  onNoteAdded,
}: AddNoteModalProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [category, setCategory] = useState<StudentStaffNote['category']>('Academic');
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) {
      showToast('Please provide note content before saving.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      dataService.addStudentNote({
        studentId,
        category,
        noteText: noteText.trim(),
        createdBy: user?.name || 'Staff Member',
        createdByRole: user?.role || 'Teacher',
      });

      showToast('Internal staff note recorded.', 'success');
      onNoteAdded();
      onClose();
      setNoteText('');
    } catch {
      showToast('Could not save note.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Staff Note"
      subtitle={`Student: ${studentName} (${studentId})`}
      maxWidth="md"
      id="add-student-note-modal"
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
            leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
          >
            Save Note
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Note Category <span className="text-rose-500">*</span>
          </label>
          <Select
            value={category}
            onChange={(val) => setCategory(val as StudentStaffNote['category'])}
            options={[
              { value: 'Academic', label: 'Academic Standing & Progress' },
              { value: 'Behavioral', label: 'Behavioral & Conduct Observation' },
              { value: 'Medical', label: 'Medical or Health Advisory' },
              { value: 'Administrative', label: 'Administrative & Records' },
              { value: 'General', label: 'General Pastoral Care Note' },
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Internal Note Content <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
            className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            placeholder="Document observations, parent counseling meetings, special accommodations or recommendations..."
            required
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5">
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Internal staff notes are restricted to authorized school personnel and are logged in the student compliance audit record.
          </span>
        </div>
      </form>
    </Modal>
  );
};
