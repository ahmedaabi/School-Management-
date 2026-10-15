import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { NotificationPreferences } from '../../types';
import { X, Bell, Mail, MessageSquare, Smartphone, Check, ShieldCheck } from 'lucide-react';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    dataService.getNotificationPreferences()
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPreferences(dataService.getNotificationPreferences());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleChannel = (channel: keyof NotificationPreferences['channels']) => {
    setPreferences((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel],
      },
    }));
  };

  const handleToggleCategory = (category: keyof NotificationPreferences['categories']) => {
    setPreferences((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category],
      },
    }));
  };

  const handleSave = () => {
    dataService.saveNotificationPreferences(preferences);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div
      id="notification-preferences-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900">
              Notification & Dispatch Settings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control automated communications across platforms.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Dispatch Channels */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              Communication Delivery Channels
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: 'inApp',
                  label: 'In-Portal Bell',
                  desc: 'Real-time badges & drawer updates',
                  icon: <Bell className="w-4 h-4 text-indigo-600" />,
                },
                {
                  id: 'email',
                  label: 'Official Email',
                  desc: 'Comprehensive digest to primary email',
                  icon: <Mail className="w-4 h-4 text-emerald-600" />,
                },
                {
                  id: 'whatsapp',
                  label: 'WhatsApp Gateway',
                  desc: 'Instant priority SMS / WA alerts',
                  icon: <MessageSquare className="w-4 h-4 text-teal-600" />,
                },
                {
                  id: 'sms',
                  label: 'Cellular SMS',
                  desc: 'Emergency announcements & gate logs',
                  icon: <Smartphone className="w-4 h-4 text-amber-600" />,
                },
              ].map((ch) => {
                const channelId = ch.id as keyof NotificationPreferences['channels'];
                const isEnabled = preferences.channels[channelId];
                return (
                  <div
                    key={ch.id}
                    onClick={() => handleToggleChannel(channelId)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isEnabled
                        ? 'border-indigo-300 bg-indigo-50/40 text-slate-900'
                        : 'border-slate-200 bg-slate-50/50 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {ch.icon}
                        <span className="text-xs font-semibold">{ch.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        readOnly
                        className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">{ch.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subscribed Alert Types */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-indigo-600" />
              Academic Category Subscriptions
            </h4>
            <div className="space-y-2">
              {[
                {
                  id: 'attendance',
                  label: 'Class Attendance & Absence Alerts',
                  desc: 'Real-time notification when absent or late status is entered.',
                },
                {
                  id: 'homework',
                  label: 'Homework & Assignment Deadlines',
                  desc: 'Alerts upon new published tasks and approaching submission cutoffs.',
                },
                {
                  id: 'fees',
                  label: 'Tuition Invoices & Payment Confirmations',
                  desc: 'Receipt generation notices and overdue balance reminders.',
                },
                {
                  id: 'exams',
                  label: 'Examination Schedules & Published Grades',
                  desc: 'Timetable announcements and score releases.',
                },
                {
                  id: 'announcements',
                  label: 'Institutional Campus Notices',
                  desc: 'Broad announcements regarding holidays, STEM exhibitions, and events.',
                },
                {
                  id: 'requests',
                  label: 'Support Tickets & Helpdesk Replies',
                  desc: 'Responses from administrators regarding leaves and queries.',
                },
              ].map((cat) => {
                const categoryId = cat.id as keyof NotificationPreferences['categories'];
                const isEnabled = preferences.categories[categoryId];
                return (
                  <label
                    key={cat.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggleCategory(categoryId)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{cat.label}</div>
                      <div className="text-[11px] text-slate-500 leading-normal">{cat.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Preferences saved locally</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Preferences Saved!</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
