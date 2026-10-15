import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu,
  PanelLeftClose,
  PanelLeft,
  Bell,
  Plus,
  ShieldCheck,
  Calendar,
  ChevronDown,
  UserCheck,
  GraduationCap,
  School,
  Wallet,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { Button } from '../ui/Button';
import { dataService } from '../../services/dataService';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { NotificationPreferencesModal } from '../notifications/NotificationPreferencesModal';

export interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  onOpenMobileSidebar: () => void;
  onOpenAddStudent: () => void;
  onOpenAddTeacher: () => void;
  onOpenMarkAttendance: () => void;
  onOpenRecordPayment: () => void;
  onOpenCreateAnnouncement: () => void;
  schoolName: string;
  currentTerm: string;
}

export const Header = ({
  onToggleSidebar,
  isSidebarCollapsed,
  onOpenMobileSidebar,
  onOpenAddStudent,
  onOpenAddTeacher,
  onOpenMarkAttendance,
  onOpenRecordPayment,
  onOpenCreateAnnouncement,
  schoolName,
  currentTerm,
}: HeaderProps) => {
  const { currentUser, currentRole, switchRole, availableRoles, can, logout } = useAuth();
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const quickActionsRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  // Unread count
  const unreadCount = useMemo(() => {
    return dataService.getNotifications(currentUser).filter((n) => !n.read).length;
  }, [currentUser, isNotificationDrawerOpen]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        quickActionsRef.current &&
        !quickActionsRef.current.contains(event.target as Node)
      ) {
        setIsQuickActionsOpen(false);
      }
      if (
        roleMenuRef.current &&
        !roleMenuRef.current.contains(event.target as Node)
      ) {
        setIsRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const mockNotifications = [
    {
      id: '1',
      title: '2 Students Flagged Low Attendance',
      desc: 'Lucas Thornton & Maximilian Cross below 85%',
      time: '12m ago',
      unread: true,
    },
    {
      id: '2',
      title: 'Term 2 Payment Verified',
      desc: '$3,450 confirmed for Chloe Zhang',
      time: '45m ago',
      unread: true,
    },
    {
      id: '3',
      title: 'Admissions Entrance Scores Uploaded',
      desc: '3 applications ready for committee review',
      time: '2h ago',
      unread: false,
    },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between shadow-xs">
      {/* Left side: Mobile menu toggle + Desktop collapse + School badge & Search */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleSidebar}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle desktop sidebar"
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        <h1 className="text-slate-500 font-medium text-sm hidden md:inline truncate max-w-[200px] lg:max-w-none">
          {schoolName}
        </h1>
        <span className="text-slate-200 hidden md:inline">|</span>

        {/* Search input from Design */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search records..."
            className="bg-slate-100 border-none rounded-full px-4 py-1.5 text-xs w-40 sm:w-56 lg:w-64 focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Right side: Notifications + Quick Actions + Role Switcher + Avatar + Logout */}
      <div className="flex items-center gap-3">
        {/* Notifications Bell with unread counter */}
        <button
          type="button"
          id="header-notification-btn"
          onClick={() => setIsNotificationDrawerOpen(true)}
          className="relative p-2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer rounded-lg hover:bg-slate-100"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Quick Actions Button from Design */}
        <div className="relative" ref={quickActionsRef}>
          <button
            type="button"
            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            className="bg-blue-50 text-blue-600 text-xs font-bold px-3.5 sm:px-4 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-none"
            id="quick-actions-trigger"
          >
            <span>Quick Actions</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {isQuickActionsOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                School Quick Actions
              </div>

              {can('students.create') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickActionsOpen(false);
                    onOpenAddStudent();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  Add Student
                </button>
              )}

              {can('attendance.create') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickActionsOpen(false);
                    onOpenMarkAttendance();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Mark Attendance
                </button>
              )}

              {can('fees.create') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickActionsOpen(false);
                    onOpenRecordPayment();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-amber-600 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Wallet className="w-4 h-4 text-amber-500" />
                  Record Payment
                </button>
              )}

              {can('communication.manage') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickActionsOpen(false);
                    onOpenCreateAnnouncement();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Bell className="w-4 h-4 text-blue-600" />
                  Create Announcement
                </button>
              )}

              {can('teachers.create') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickActionsOpen(false);
                    onOpenAddTeacher();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <School className="w-4 h-4 text-blue-600" />
                  Add Teacher
                </button>
              )}
            </div>
          )}
        </div>

        {/* Role Switcher / RBAC Simulator */}
        <div className="relative" ref={roleMenuRef}>
          <button
            type="button"
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer transition-colors shadow-2xs"
            title="Switch user role"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden lg:inline font-semibold capitalize">
              {currentRole.replace('_', ' ')}
            </span>
            <span className="lg:hidden font-semibold uppercase text-[10px]">
              {currentRole.slice(0, 3)}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">Switch Active Role (RBAC)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Test the system permissions from different staff viewpoints
                </p>
              </div>

              <div className="py-1 max-h-72 overflow-y-auto">
                {availableRoles.map((r) => {
                  const isSelected = r.role === currentRole;
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => {
                        switchRole(r.role);
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex flex-col transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 text-blue-900 border-l-2 border-blue-600'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{r.label}</span>
                        {isSelected && (
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        {r.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Sign Out */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-2">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
              referrerPolicy="no-referrer"
            />
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 capitalize">
                {currentUser.roleTitle || currentRole}
              </div>
            </div>
          </div>

          <button
            type="button"
            id="header-logout-btn"
            onClick={logout}
            title="Sign out of institutional portal"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide-over Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        onOpenPreferences={() => {
          setIsNotificationDrawerOpen(false);
          setIsPreferencesOpen(true);
        }}
      />

      {/* Notification Channel Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
    </header>
  );
};
