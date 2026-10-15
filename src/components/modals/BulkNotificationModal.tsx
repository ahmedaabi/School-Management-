import { useState, FormEvent } from 'react';
import { Send, Bell, CheckCircle, Mail, MessageSquare } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export interface BulkNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudentIds: string[];
}

export const BulkNotificationModal = ({
  isOpen,
  onClose,
  selectedStudentIds,
}: BulkNotificationModalProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [channel, setChannel] = useState<'all' | 'sms' | 'email' | 'portal'>('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast('Please type a notification message.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // Broadcast activity log
      dataService.logActivity({
        action: 'Bulk Notification Broadcast',
        actor: user?.name || 'Administrator',
        role: user?.role || 'Principal',
        details: `Dispatched "${subject || 'School Broadcast'}" via ${channel.toUpperCase()} to ${selectedStudentIds.length} student households`,
        entityType: 'announcement',
      });

      // Log student audit entries for each
      const students = dataService.getStudents(true).filter((s) =>
        selectedStudentIds.includes(s.id) || selectedStudentIds.includes(s.studentId)
      );

      students.forEach((s) => {
        dataService.logStudentAudit({
          studentId: s.studentId,
          studentName: `${s.firstName} ${s.lastName}`,
          action: 'Notification Dispatched',
          actorName: user?.name || 'Administrator',
          actorRole: user?.role || 'Principal',
          details: `Sent bulk ${channel} notice: "${subject || 'Important School Announcement'}"`,
        });
      });

      showToast(`Notification queued and dispatched to ${selectedStudentIds.length} recipients.`, 'success');
      onClose();
    } catch {
      showToast('Could not dispatch notifications.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Broadcast Cohort Notification"
      subtitle={`Recipients: ${selectedStudentIds.length} student households`}
      maxWidth="md"
      id="bulk-notification-modal"
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
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Dispatch Broadcast
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Delivery Channel <span className="text-rose-500">*</span>
          </label>
          <Select
            value={channel}
            onChange={(val) => setChannel(val as any)}
            options={[
              { value: 'all', label: 'Multi-Channel (SMS + Guardian Email + Portal App)' },
              { value: 'sms', label: 'SMS Direct to Guardian Mobiles' },
              { value: 'email', label: 'Official Guardian Email Dispatch' },
              { value: 'portal', label: 'Student & Parent Portal Notice' },
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Subject Line <span className="text-rose-500">*</span>
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Schedule Alteration or Fee Reminder"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Message Content <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            placeholder="Compose announcement or notice text to send to all selected student families..."
            required
          />
        </div>
      </form>
    </Modal>
  );
};
