import { useState, ElementType } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users2,
  Users,
  BookOpen,
  Calendar,
  CalendarCheck,
  Award,
  Wallet,
  UserPlus,
  MessageSquare,
  HelpCircle,
  Bus,
  Activity,
  FileBarChart,
  Bot,
  Zap,
  Settings,
  ChevronDown,
  ChevronRight,
  School,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenAddStudent?: () => void;
  onOpenAddTeacher?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: ElementType;
  badge?: string | number;
  badgeColor?: string;
  requiredPermission?: string;
  children?: {
    id: string;
    label: string;
    action?: 'navigate' | 'modal_student' | 'modal_teacher';
  }[];
}

export const Sidebar = ({
  currentRoute,
  onNavigate,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onOpenAddStudent,
  onOpenAddTeacher,
}: SidebarProps) => {
  const { can, currentUser } = useAuth();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    students: false,
    teachers: false,
    academics: false,
    attendance: true,
    finance: false,
    admissions: false,
    exams: false,
    communication: false,
  });

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const getNavGroups = (): NavGroup[] => {
    if (currentUser.role === 'teacher') {
      return [
        {
          title: 'Teacher Portal',
          items: [
            { id: 'teacher-portal', label: 'Faculty Desk', icon: School },
            {
              id: 'attendance',
              label: 'Attendance',
              icon: CalendarCheck,
              children: [
                { id: 'attendance-today', label: "Today's Attendance" },
                { id: 'attendance-history', label: 'Attendance History' },
                { id: 'attendance-monthly', label: 'Monthly Report' },
                { id: 'attendance-students', label: 'Student Attendance' },
                { id: 'attendance-classes', label: 'Class Attendance' },
                { id: 'attendance-alerts', label: 'Attendance Alerts' },
              ],
            },
            { id: 'academics-homework', label: 'Class Homework', icon: BookOpen },
            { id: 'academics-timetable', label: 'My Timetable', icon: CalendarCheck },
            { id: 'results', label: 'Examination Marks', icon: Award },
            { id: 'students', label: 'My Students', icon: GraduationCap },
          ],
        },
        {
          title: 'Campus Life',
          items: [
            { id: 'communication', label: 'Announcements', icon: MessageSquare },
            { id: 'requests', label: 'Faculty Inquiries', icon: HelpCircle },
          ],
        },
      ];
    }

    if (currentUser.role === 'parent') {
      return [
        {
          title: 'Parent Portal',
          items: [
            { id: 'parent-portal', label: 'Family Hub', icon: Users2 },
            { id: 'results', label: 'Report Cards & GPA', icon: Award },
            { id: 'attendance', label: 'Attendance Record', icon: CalendarCheck },
            { id: 'finance', label: 'Tuition Invoices', icon: Wallet },
            { id: 'academics-homework', label: 'Homework & Tasks', icon: BookOpen },
          ],
        },
        {
          title: 'School Support',
          items: [
            { id: 'requests', label: 'Helpdesk & Leave', icon: HelpCircle, badge: 'New' },
            { id: 'communication', label: 'Campus Notices', icon: MessageSquare },
          ],
        },
      ];
    }

    if (currentUser.role === 'student') {
      return [
        {
          title: 'Student Portal',
          items: [
            { id: 'student-portal', label: 'My Student Desk', icon: GraduationCap },
            { id: 'academics-timetable', label: 'Class Schedule', icon: CalendarCheck },
            { id: 'academics-homework', label: 'My Homework', icon: BookOpen },
            { id: 'results', label: 'Grades & GPA', icon: Award },
            { id: 'attendance', label: 'Attendance Log', icon: CalendarCheck },
          ],
        },
        {
          title: 'School Life',
          items: [
            { id: 'communication', label: 'Campus Notices', icon: MessageSquare },
          ],
        },
      ];
    }

    if (currentUser.role === 'accountant') {
      return [
        {
          title: 'Finance & Bursar',
          items: [
            { id: 'dashboard', label: 'Financial Overview', icon: LayoutDashboard },
            {
              id: 'finance',
              label: 'Finance & Fees',
              icon: Wallet,
              children: [
                { id: 'finance-dashboard', label: 'Finance Dashboard' },
                { id: 'finance-structures', label: 'Fee Structures' },
                { id: 'finance-student-fees', label: 'Student Fees' },
                { id: 'finance-invoices', label: 'Invoices' },
                { id: 'finance-payments', label: 'Payments' },
                { id: 'finance-pending', label: 'Pending Fees' },
                { id: 'finance-overdue', label: 'Overdue Fees' },
                { id: 'finance-discounts', label: 'Discounts' },
                { id: 'finance-scholarships', label: 'Scholarships' },
                { id: 'finance-receipts', label: 'Receipts Ledger' },
                { id: 'finance-reports', label: 'Financial Reports' },
                { id: 'finance-settings', label: 'Finance Settings' },
              ],
            },
            { id: 'reports', label: 'Audit Reports', icon: FileBarChart },
          ],
        },
        {
          title: 'Administrative',
          items: [
            { id: 'requests', label: 'Fee Inquiries', icon: HelpCircle },
            { id: 'communication', label: 'Announcements', icon: MessageSquare },
          ],
        },
      ];
    }

    // Default: super_admin, principal, admin_staff
    return [
      {
        title: 'Institutional Portals',
        items: [
          { id: 'teacher-portal', label: 'Teacher Desk', icon: School },
          { id: 'parent-portal', label: 'Parent Portal', icon: Users2 },
          { id: 'student-portal', label: 'Student Portal', icon: GraduationCap },
        ],
      },
      {
        title: 'Management',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          {
            id: 'students',
            label: 'Students',
            icon: GraduationCap,
            children: [
              { id: 'students-all', label: 'All Students' },
              { id: 'students-add', label: 'Add Student', action: 'modal_student' },
            ],
          },
          { id: 'parents', label: 'Parents', icon: Users2 },
          {
            id: 'teachers',
            label: 'Teachers',
            icon: School,
            children: [
              { id: 'teachers-all', label: 'All Teachers' },
              { id: 'teachers-add', label: 'Add Teacher', action: 'modal_teacher' },
            ],
          },
          {
            id: 'staff',
            label: 'Staff & HR',
            icon: Users,
            badge: 'HR',
            badgeColor: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
          },
          {
            id: 'timetable',
            label: 'Timetable',
            icon: Calendar,
          },
          {
            id: 'academics',
            label: 'Academics',
            icon: BookOpen,
            children: [
              { id: 'academics-classes', label: 'Classes' },
              { id: 'academics-sections', label: 'Sections' },
              { id: 'academics-subjects', label: 'Subjects' },
              { id: 'academics-timetable', label: 'Timetable Matrix' },
              { id: 'academics-homework', label: 'Homework' },
            ],
          },
          {
            id: 'attendance',
            label: 'Attendance',
            icon: CalendarCheck,
            badge: 'Live',
            badgeColor: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
            children: [
              { id: 'attendance-today', label: "Today's Attendance" },
              { id: 'attendance-history', label: 'Attendance History' },
              { id: 'attendance-monthly', label: 'Monthly Report' },
              { id: 'attendance-students', label: 'Student Attendance' },
              { id: 'attendance-classes', label: 'Class Attendance' },
              { id: 'attendance-alerts', label: 'Attendance Alerts' },
              { id: 'attendance-settings', label: 'Attendance Settings' },
            ],
          },
        ],
      },
      {
        title: 'Finance & Admin',
        items: [
          {
            id: 'finance',
            label: 'Finance & Fees',
            icon: Wallet,
            children: [
              { id: 'finance-dashboard', label: 'Finance Dashboard' },
              { id: 'finance-structures', label: 'Fee Structures' },
              { id: 'finance-student-fees', label: 'Student Fees' },
              { id: 'finance-invoices', label: 'Invoices' },
              { id: 'finance-payments', label: 'Payments' },
              { id: 'finance-pending', label: 'Pending Fees' },
              { id: 'finance-overdue', label: 'Overdue Fees' },
              { id: 'finance-discounts', label: 'Discounts' },
              { id: 'finance-scholarships', label: 'Scholarships' },
              { id: 'finance-receipts', label: 'Receipts' },
              { id: 'finance-reports', label: 'Financial Reports' },
              { id: 'finance-settings', label: 'Finance Settings' },
            ],
          },
          {
            id: 'admissions',
            label: 'Admissions',
            icon: UserPlus,
            children: [
              { id: 'admissions-dashboard', label: 'Dashboard' },
              { id: 'admissions-applications', label: 'Applications' },
              { id: 'admissions-new', label: 'New Application' },
              { id: 'admissions-pipeline', label: 'Application Pipeline' },
              { id: 'admissions-documents', label: 'Document Verification' },
              { id: 'admissions-interviews', label: 'Interviews & Tests' },
              { id: 'admissions-approved', label: 'Approved Applications' },
              { id: 'admissions-enrolled', label: 'Enrolled Students' },
              { id: 'admissions-reports', label: 'Admission Reports' },
              { id: 'admissions-settings', label: 'Admission Settings' },
            ],
          },
          {
            id: 'exams',
            label: 'Exams & Results',
            icon: Award,
            children: [
              { id: 'exams-list', label: 'Exams' },
              { id: 'exams-schedule', label: 'Exam Schedule' },
              { id: 'exams-marks', label: 'Marks Entry' },
              { id: 'exams-results', label: 'Results' },
              { id: 'exams-reports', label: 'Report Cards' },
              { id: 'exams-analytics', label: 'Result Analytics' },
              { id: 'exams-settings', label: 'Result Settings' },
            ],
          },
          { id: 'reports', label: 'Reports', icon: FileBarChart },
        ],
      },
      {
        title: 'Operations',
        items: [
          {
            id: 'communication',
            label: 'Communication',
            icon: MessageSquare,
            children: [
              { id: 'comm-announcements', label: 'Announcements' },
              { id: 'comm-notifications', label: 'Notifications' },
              { id: 'comm-messages', label: 'Messages' },
            ],
          },
          {
            id: 'requests',
            label: 'Requests',
            icon: HelpCircle,
            badge: 1,
            badgeColor: 'bg-amber-900/50 text-amber-300 border border-amber-700/50',
          },
          { id: 'transport', label: 'Transport', icon: Bus },
          { id: 'health', label: 'Health Records', icon: Activity },
        ],
      },
      {
        title: 'AI & Automation',
        items: [
          {
            id: 'ai-assistant',
            label: 'AI Assistant',
            icon: Bot,
            badge: 'Beta',
            badgeColor: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
          },
          {
            id: 'automation',
            label: 'Automation Rules',
            icon: Zap,
            badge: '3 active',
            badgeColor: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
          },
          { id: 'settings', label: 'Settings', icon: Settings },
        ],
      },
    ];
  };

  const navGroups = getNavGroups();

  const handleNavClick = (item: NavItem) => {
    if (item.children && !isCollapsed) {
      toggleSubmenu(item.id);
      if (item.id === 'students') onNavigate('students');
      else if (item.id === 'teachers') onNavigate('teachers');
      else if (item.id === 'academics') onNavigate('academics');
      else if (item.id === 'finance') onNavigate('finance');
      else if (item.id === 'admissions') onNavigate('admissions');
      else if (item.id === 'communication') onNavigate('communication');
    } else {
      onNavigate(item.id);
      onCloseMobile();
    }
  };

  const handleSubItemClick = (
    subItem: { id: string; label: string; action?: 'navigate' | 'modal_student' | 'modal_teacher' },
    parentId: string
  ) => {
    if (subItem.action === 'modal_student') {
      if (onOpenAddStudent) onOpenAddStudent();
    } else if (subItem.action === 'modal_teacher') {
      if (onOpenAddTeacher) onOpenAddTeacher();
    } else {
      if (parentId === 'students') {
        onNavigate('students');
      } else if (parentId === 'teachers') {
        onNavigate('teachers');
      } else {
        onNavigate(subItem.id);
      }
    }
    onCloseMobile();
  };

  const isItemActive = (item: NavItem) => {
    if (currentRoute === item.id) return true;
    if (item.children?.some((c) => currentRoute === c.id || currentRoute.startsWith(item.id))) {
      return true;
    }
    return false;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-300 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-sm shrink-0">
            E
          </div>
          {!isCollapsed && (
            <span className="text-white font-semibold text-lg tracking-tight truncate">
              EduCore Pro
            </span>
          )}
        </div>
        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3.5 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {navGroups.map((group) => (
          <div key={group.title}>
            {!isCollapsed && (
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2 px-2">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isItemActive(item);
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const isSubOpen = openSubmenus[item.id];

                return (
                  <li key={item.id} className="space-y-0.5 list-none">
                    <button
                      type="button"
                      id={`nav-${item.id}`}
                      onClick={() => handleNavClick(item)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer transition-colors group ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      } ${isCollapsed ? 'justify-center px-2' : ''}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          active ? 'bg-white' : 'bg-slate-700 group-hover:bg-slate-400'
                        }`}
                      />
                      <Icon className="w-4 h-4 shrink-0 opacity-85" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                item.badgeColor || 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {hasChildren && (
                            <span className="text-slate-400 ml-1">
                              {isSubOpen ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </span>
                          )}
                        </>
                      )}
                    </button>

                    {/* Submenu */}
                    {!isCollapsed && hasChildren && isSubOpen && (
                      <div className="pl-7 pr-1 py-1 space-y-0.5">
                        {item.children!.map((subItem) => {
                          const isSubActive =
                            currentRoute === subItem.id ||
                            (subItem.id === 'students-all' && currentRoute === 'students') ||
                            (subItem.id === 'teachers-all' && currentRoute === 'teachers');

                          return (
                            <button
                              key={subItem.id}
                              type="button"
                              id={`subnav-${subItem.id}`}
                              onClick={() => handleSubItemClick(subItem, item.id)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer text-left ${
                                isSubActive
                                  ? 'text-white bg-slate-800/80 font-medium'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                              }`}
                            >
                              <span className="truncate">{subItem.label}</span>
                              {subItem.action && (
                                <span className="text-[10px] text-blue-400 border border-blue-500/30 px-1 rounded">
                                  +
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* AI Automation callout card from Design */}
        {!isCollapsed && (
          <div className="pt-2 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-800">
              <p className="text-blue-400 text-xs font-bold mb-1 flex items-center justify-between">
                <span>AI Automation</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              </p>
              <p className="text-slate-400 text-[11px] leading-tight">
                3 automation rules active. AI Assistant ready.
              </p>
            </div>
          </div>
        )}
      </nav>

      {/* User profile footer matching Design */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full bg-slate-700 object-cover border border-slate-700 shrink-0"
            referrerPolicy="no-referrer"
          />
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-white text-xs font-medium truncate">{currentUser.name}</p>
              <p className="text-slate-500 text-[10px] truncate">{currentUser.roleTitle}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        id="desktop-sidebar"
        className={`hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-30 transition-all duration-200 ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full bg-slate-900 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
