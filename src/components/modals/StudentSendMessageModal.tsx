import { useState, FormEvent } from 'react';
import { Send, Mail, Phone, Bell, CheckCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Student } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export interface StudentSendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentSendMessageModal = ({
  isOpen,
  onClose,
  student,
}: StudentSendMessageModalProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [channel, setChannel] = useState<'all' | 'sms' | 'email' | 'portal'>('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!student) return null;

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast('Please type a message before dispatching.', 'warning');
      return;
    }

    setIsSending(true);
    try {
      dataService.logActivity({
        action: 'Direct Notification Sent',
        actor: user?.name || 'School Office',
        role: user?.role || 'Admin Staff',
        details: `Dispatched message "${subject || 'Notice'}" via ${channel.toUpperCase()} to ${student.firstName} ${student.lastName} and guardian (${student.parentContact})`,
        entityType: 'student',
      });

      dataService.logStudentAudit({
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        action: 'Notification Dispatched',
        actorName: user?.name || 'School Office',
        actorRole: user?.role || 'Admin Staff',
        details: `Sent message via ${channel}: "${subject || 'Notification'}"`,
      });

      showToast(`Notification sent to ${student.fatherGuardianName} & ${student.firstName}`, 'success');
      setMessage('');
      setSubject('');
      onClose();
    } catch {
      showToast('Could not dispatch message.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Message / Notification"
      subtitle={`Recipient: ${student.firstName} ${student.lastName} & ${student.fatherGuardianName}`}
      maxWidth="md"
      id="student-send-message-modal"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            isLoading={isSending}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Send Notification
          </Button>
        </>
      }
    >
      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Communication Channel <span className="text-rose-500">*</span>
          </label>
          <Select
            value={channel}
            onChange={(val) => setChannel(val as any)}
            options={[
              { value: 'all', label: 'Multi-Channel (SMS + Guardian Email + App Portal)' },
              { value: 'sms', label: 'Direct SMS to Guardian Phone (' + student.parentContact + ')' },
              { value: 'email', label: 'Email Dispatch (' + (student.parentEmail || student.email) + ')' },
              { value: 'portal', label: 'School Portal In-App Notification' },
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Subject / Title
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Academic Progress Update or Fee Reminder"
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
            placeholder="Type your message here. The guardian will receive an automated notification."
            required
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="urgent-toggle"
            checked={isUrgent}
            onChange={(e) => setIsUrgent(e.target.checked)}
            className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4 border-slate-300"
          />
          <label htmlFor="urgent-toggle" className="text-xs font-medium text-slate-700 cursor-pointer">
            Mark as <span className="text-rose-600 font-bold">Urgent Priority Alert</span> (triggers instant SMS push)
          </label>
        </div>
      </form>
    </Modal>
  );
};
