import { useState, FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { AnnouncementItem } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (announcement: AnnouncementItem) => void;
}

export const CreateAnnouncementModal = ({
  isOpen,
  onClose,
  onCreated,
}: CreateAnnouncementModalProps) => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<AnnouncementItem['targetAudience']>('All');
  const [priority, setPriority] = useState<AnnouncementItem['priority']>('Normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter an announcement title.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const ann = dataService.addAnnouncement({
        title: title.trim(),
        content: content.trim(),
        targetAudience,
        priority,
        author: currentUser.name,
        authorRole: currentUser.roleTitle,
      });

      showToast('Announcement published and dispatched to portal feeds.', 'success');
      if (onCreated) onCreated(ann);
      onClose();
    } catch {
      showToast('Could not broadcast announcement.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create School Broadcast"
      subtitle="Publish administrative memo or urgent bulletin to stakeholders"
      maxWidth="lg"
      id="create-announcement-modal"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Publish Broadcast
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Headline / Title"
          required
          placeholder="e.g. Schedule Revision for Term 2 Final Exams"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Target Audience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value as AnnouncementItem['targetAudience'])}
            options={[
              { value: 'All', label: 'All Stakeholders' },
              { value: 'Teachers', label: 'Faculty & Teachers Only' },
              { value: 'Parents', label: 'Parents & Guardians' },
              { value: 'Students', label: 'Enrolled Students' },
              { value: 'Staff', label: 'Administrative Staff' },
            ]}
          />
          <Select
            label="Urgency / Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as AnnouncementItem['priority'])}
            options={[
              { value: 'Normal', label: 'Normal Bulletin' },
              { value: 'High', label: 'High Priority (Highlight)' },
              { value: 'Urgent', label: 'Urgent Alert (SMS/Banner)' },
            ]}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 tracking-tight block mb-1.5">
            Announcement Body
          </label>
          <textarea
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
            placeholder="Details, dates, required actions or logistics for the recipient..."
          />
        </div>
      </form>
    </Modal>
  );
};
