import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { EnhancedNotificationItem, NotificationType } from '../../types';
import {
  Bell,
  X,
  CheckCheck,
  Calendar,
  DollarSign,
  BookOpen,
  Award,
  Megaphone,
  HelpCircle,
  Settings,
  Filter,
  CheckCircle2,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreferences: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onOpenPreferences,
}) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<EnhancedNotificationItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');

  const loadNotifications = () => {
    const list = dataService.getNotifications(currentUser);
    setNotifications(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleMarkAsRead = (id: string) => {
    dataService.markNotificationAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    dataService.markAllNotificationsAsRead(currentUser);
    loadNotifications();
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.read;
    if (filterType === 'attendance') return n.type === 'attendance_alert';
    if (filterType === 'homework') return n.type === 'homework_reminder';
    if (filterType === 'fees') return n.type === 'fee_reminder';
    if (filterType === 'exams') return n.type === 'exam_announcement' || n.type === 'result_published';
    if (filterType === 'announcements') return n.type === 'school_announcement';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'attendance_alert':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case 'fee_reminder':
        return <DollarSign className="w-4 h-4 text-amber-600" />;
      case 'homework_reminder':
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'exam_announcement':
      case 'result_published':
        return <Award className="w-4 h-4 text-purple-600" />;
      case 'school_announcement':
        return <Megaphone className="w-4 h-4 text-blue-600" />;
      case 'request_status':
        return <HelpCircle className="w-4 h-4 text-cyan-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div
      id="notification-drawer-backdrop"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity"
      onClick={onClose}
    >
      <div
        id="notification-drawer-panel"
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Filtered for {currentUser.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenPreferences}
              title="Notification Settings"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'homework', label: 'Homework' },
            { id: 'fees', label: 'Fees' },
            { id: 'exams', label: 'Exams' },
            { id: 'announcements', label: 'Notices' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors text-[11px] font-medium ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action bar */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredNotifications.length} items</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-64">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">You're all caught up!</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                No notifications matching the selected filter right now.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item.id)}
                className={`p-4 transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-3.5 ${
                  !item.read ? 'bg-indigo-50/30' : 'bg-white'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                  {getNotificationIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4
                      className={`text-xs truncate ${
                        !item.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                      }`}
                    >
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0">{item.time}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {item.message}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 capitalize">
                      {item.type.replace('_', ' ')}
                    </span>
                    {item.priority === 'urgent' && (
                      <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold uppercase">
                        Urgent
                      </span>
                    )}
                    {!item.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 ml-auto"></span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={onOpenPreferences}
            className="text-xs text-slate-600 hover:text-indigo-600 font-medium inline-flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            Manage Dispatch Channels & Alert Types
          </button>
        </div>
      </div>
    </div>
  );
};
