import { useState } from 'react';
import {
  Megaphone,
  Plus,
  Bell,
  Users,
  AlertTriangle,
  Calendar,
  Filter,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { AnnouncementItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';

export interface CommunicationPageProps {
  onOpenCreateAnnouncement: () => void;
}

export const CommunicationPage = ({ onOpenCreateAnnouncement }: CommunicationPageProps) => {
  const { can } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() =>
    dataService.getAnnouncements()
  );
  const [audienceFilter, setAudienceFilter] = useState('all');

  const filtered = announcements.filter((a) => {
    if (audienceFilter !== 'all' && a.targetAudience !== audienceFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Institutional Communications & Broadcasts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Send official announcements, urgent administrative bulletins, and parent circulars
          </p>
        </div>

        {can('communication.manage') && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCreateAnnouncement}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Announcement
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
        <div className="max-w-xs">
          <Select
            label="Filter Target Stakeholder Audience"
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Audiences' },
              { value: 'All', label: 'General Broadcast (All)' },
              { value: 'Teachers', label: 'Faculty & Teachers' },
              { value: 'Parents', label: 'Parents & Guardians' },
              { value: 'Students', label: 'Students' },
            ]}
          />
        </div>
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`bg-white border rounded-xl p-5 shadow-2xs transition-all ${
              item.priority === 'Urgent'
                ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/10'
                : item.priority === 'High'
                ? 'border-amber-300'
                : 'border-slate-200/80'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Megaphone className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    item.priority === 'Urgent'
                      ? 'danger'
                      : item.priority === 'High'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  {item.priority} Priority
                </Badge>
                <Badge variant="purple">Audience: {item.targetAudience}</Badge>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 mt-3 leading-relaxed">
              {item.content}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span>Published by <strong className="text-slate-700">{item.author}</strong> ({item.authorRole})</span>
              </div>
              <div className="font-mono">{item.publishDate}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
