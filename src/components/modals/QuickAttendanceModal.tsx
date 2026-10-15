import { useState, FormEvent } from 'react';
import { Calendar, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Student } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export interface QuickAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onAttendanceRecorded: () => void;
}

export const QuickAttendanceModal = ({
  isOpen,
  onClose,
  student,
  onAttendanceRecorded,
}: QuickAttendanceModalProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Present' | 'Absent' | 'Late' | 'Excused'>('Present');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!student) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      dataService.recordAttendance({
        date,
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        classId: student.classId,
        className: student.className,
        sectionId: student.sectionId,
        sectionName: student.sectionName,
        status,
        remarks: remarks.trim() || undefined,
        recordedBy: user?.name || 'Class Teacher',
      });

      showToast(`Attendance marked as ${status} for ${student.firstName}.`, 'success');
      onAttendanceRecorded();
      onClose();
    } catch {
      showToast('Could not record attendance.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Daily Attendance"
      subtitle={`Student: ${student.firstName} ${student.lastName} (${student.studentId})`}
      maxWidth="md"
      id="quick-attendance-modal"
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
            Save Attendance
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Date <span className="text-rose-500">*</span>
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Attendance Status <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['Present', 'Late', 'Absent', 'Excused'] as const).map((s) => {
              const active = status === s;
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`p-3 rounded-xl border text-center font-medium text-xs transition-all cursor-pointer ${
                    active
                      ? s === 'Present'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold ring-2 ring-emerald-500/20'
                        : s === 'Late'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 font-bold ring-2 ring-amber-500/20'
                        : s === 'Absent'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold ring-2 ring-rose-500/20'
                        : 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    {s === 'Present' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {s === 'Late' && <Clock className="w-4 h-4 text-amber-600" />}
                    {s === 'Absent' && <XCircle className="w-4 h-4 text-rose-600" />}
                    {s === 'Excused' && <AlertCircle className="w-4 h-4 text-indigo-600" />}
                    <span>{s}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes / Reason for Late or Absence
          </label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Doctor appointment note provided by guardian"
          />
        </div>
      </form>
    </Modal>
  );
};
