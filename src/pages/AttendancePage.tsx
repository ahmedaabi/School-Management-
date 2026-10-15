import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  History,
  FileBarChart,
  UserCheck,
  School,
  AlertTriangle,
  Sliders,
  Plus,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { TodayAttendanceView } from '../components/attendance/TodayAttendanceView';
import { AttendanceHistoryView } from '../components/attendance/AttendanceHistoryView';
import { MonthlyReportView } from '../components/attendance/MonthlyReportView';
import { StudentAttendanceView } from '../components/attendance/StudentAttendanceView';
import { ClassAttendanceView } from '../components/attendance/ClassAttendanceView';
import { AttendanceAlertsView } from '../components/attendance/AttendanceAlertsView';
import { AttendanceSettingsView } from '../components/attendance/AttendanceSettingsView';
import { Button } from '../components/ui/Button';

export interface AttendancePageProps {
  subRoute?: string;
  onOpenMarkAttendance?: () => void;
  onNavigateStudent?: (studentId: string) => void;
}

export type AttendanceTab =
  | 'today'
  | 'history'
  | 'monthly'
  | 'student'
  | 'classes'
  | 'alerts'
  | 'settings';

export const AttendancePage: React.FC<AttendancePageProps> = ({
  subRoute,
  onOpenMarkAttendance,
  onNavigateStudent,
}) => {
  const { currentUser, can } = useAuth();

  // Map subRoute string to tab key
  const getTabFromRoute = (route?: string): AttendanceTab => {
    if (!route || route === 'attendance') {
      if (currentUser?.role === 'teacher') return 'today';
      if (currentUser?.role === 'parent' || currentUser?.role === 'student') return 'student';
      return 'today';
    }
    if (route === 'attendance-today') return 'today';
    if (route === 'attendance-history') return 'history';
    if (route === 'attendance-monthly') return 'monthly';
    if (route === 'attendance-students') return 'student';
    if (route === 'attendance-classes') return 'classes';
    if (route === 'attendance-alerts') return 'alerts';
    if (route === 'attendance-settings') return 'settings';
    return 'today';
  };

  const [activeTab, setActiveTab] = useState<AttendanceTab>(() => getTabFromRoute(subRoute));

  // Sync tab when subRoute prop changes from sidebar navigation
  useEffect(() => {
    if (subRoute) {
      setActiveTab(getTabFromRoute(subRoute));
    }
  }, [subRoute]);

  const alerts = dataService.getAttendanceAlerts();
  const activeAlertsCount = alerts.filter((a) => a.status === 'Active').length;

  // Tabs list with role restrictions
  const allTabs: { id: AttendanceTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'today', label: "Today's Attendance", icon: CalendarCheck },
    { id: 'history', label: 'Attendance History', icon: History },
    { id: 'monthly', label: 'Monthly Report', icon: FileBarChart },
    { id: 'student', label: 'Student Attendance', icon: UserCheck },
    { id: 'classes', label: 'Class Attendance', icon: School },
    {
      id: 'alerts',
      label: 'Attendance Alerts',
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
    },
    { id: 'settings', label: 'Attendance Settings', icon: Sliders },
  ];

  // Filter tabs based on user role
  const visibleTabs = allTabs.filter((tab) => {
    if (currentUser?.role === 'parent' || currentUser?.role === 'student') {
      return tab.id === 'student' || tab.id === 'monthly';
    }
    if (currentUser?.role === 'teacher') {
      return tab.id !== 'settings';
    }
    return true; // Admin, principal, super_admin see all
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Attendance Center & Smart Automation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time daily roll call, automated truancy alerts, period tracking, and institutional reports
          </p>
        </div>

        {can('attendance.create') && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('today')}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Take Daily Attendance
            </Button>
          </div>
        )}
      </div>

      {/* Modern High-Contrast Tab Bar */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-px" aria-label="Attendance Tabs">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-white shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Render Active Tab Content */}
      <div className="mt-4">
        {activeTab === 'today' && <TodayAttendanceView />}

        {activeTab === 'history' && <AttendanceHistoryView />}

        {activeTab === 'monthly' && <MonthlyReportView />}

        {activeTab === 'student' && (
          <StudentAttendanceView onNavigateStudent={onNavigateStudent} />
        )}

        {activeTab === 'classes' && (
          <ClassAttendanceView onSelectClassToMark={() => setActiveTab('today')} />
        )}

        {activeTab === 'alerts' && <AttendanceAlertsView />}

        {activeTab === 'settings' && <AttendanceSettingsView />}
      </div>
    </div>
  );
};
