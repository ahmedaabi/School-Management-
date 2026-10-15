import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, Permission, User } from '../types';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'dashboard.view',
    'students.view',
    'students.create',
    'students.edit',
    'students.archive',
    'students.delete',
    'parents.view',
    'parents.edit',
    'teachers.view',
    'teachers.create',
    'teachers.edit',
    'teachers.delete',
    'classes.view',
    'classes.manage',
    'attendance.view',
    'attendance.create',
    'attendance.edit',
    'fees.view',
    'fees.create',
    'fees.edit',
    'payments.create',
    'exams.view',
    'results.view',
    'results.create',
    'results.edit',
    'results.publish',
    'homework.view',
    'homework.create',
    'homework.edit',
    'admissions.view',
    'admissions.manage',
    'announcements.create',
    'announcements.publish',
    'communication.manage',
    'requests.manage',
    'requests.create',
    'requests.view',
    'requests.assign',
    'requests.comment',
    'requests.internal_note',
    'requests.resolve',
    'requests.close',
    'requests.analytics',
    'reports.view',
    'automation.view',
    'automation.manage',
    'settings.manage',
    'timetable.view',
    'timetable.create',
    'timetable.edit',
    'timetable.delete',
    'timetable.override_conflict',
    'rooms.view',
    'rooms.manage',
    'staff.view',
    'staff.create',
    'staff.edit',
    'staff.archive',
    'staff.attendance',
    'staff.documents',
    'staff.performance',
    'staff.salary.view',
    'staff.salary.manage',
    'departments.view',
    'departments.manage',
    'staff.leave.create',
    'staff.leave.view',
    'staff.leave.approve',
    'staff.leave.reject',
  ],
  principal: [
    'dashboard.view',
    'students.view',
    'students.create',
    'students.edit',
    'students.archive',
    'students.delete',
    'parents.view',
    'parents.edit',
    'teachers.view',
    'teachers.create',
    'teachers.edit',
    'teachers.delete',
    'classes.view',
    'classes.manage',
    'attendance.view',
    'attendance.create',
    'attendance.edit',
    'fees.view',
    'fees.create',
    'fees.edit',
    'payments.create',
    'exams.view',
    'results.view',
    'results.create',
    'results.edit',
    'results.publish',
    'homework.view',
    'homework.create',
    'homework.edit',
    'admissions.view',
    'admissions.manage',
    'announcements.create',
    'announcements.publish',
    'communication.manage',
    'requests.manage',
    'requests.create',
    'requests.view',
    'requests.assign',
    'requests.comment',
    'requests.internal_note',
    'requests.resolve',
    'requests.close',
    'requests.analytics',
    'reports.view',
    'automation.view',
    'automation.manage',
    'settings.manage',
    'timetable.view',
    'timetable.create',
    'timetable.edit',
    'timetable.delete',
    'timetable.override_conflict',
    'rooms.view',
    'rooms.manage',
    'staff.view',
    'staff.create',
    'staff.edit',
    'staff.archive',
    'staff.attendance',
    'staff.documents',
    'staff.performance',
    'staff.salary.view',
    'departments.view',
    'departments.manage',
    'staff.leave.create',
    'staff.leave.view',
    'staff.leave.approve',
    'staff.leave.reject',
  ],
  admin_staff: [
    'dashboard.view',
    'students.view',
    'students.create',
    'students.edit',
    'students.archive',
    'parents.view',
    'parents.edit',
    'teachers.view',
    'classes.view',
    'attendance.view',
    'attendance.create',
    'attendance.edit',
    'fees.view',
    'exams.view',
    'results.view',
    'homework.view',
    'admissions.view',
    'admissions.manage',
    'announcements.create',
    'announcements.publish',
    'communication.manage',
    'requests.manage',
    'requests.create',
    'requests.view',
    'requests.assign',
    'requests.comment',
    'requests.internal_note',
    'requests.resolve',
    'reports.view',
    'timetable.view',
    'timetable.create',
    'timetable.edit',
    'rooms.view',
    'rooms.manage',
    'staff.view',
    'staff.attendance',
    'staff.documents',
    'departments.view',
    'staff.leave.view',
    'staff.leave.approve',
  ],
  accountant: [
    'dashboard.view',
    'students.view',
    'fees.view',
    'fees.create',
    'fees.edit',
    'payments.create',
    'reports.view',
    'requests.manage',
    'requests.create',
    'requests.view',
    'requests.comment',
    'requests.resolve',
    'staff.salary.view',
    'staff.salary.manage',
  ],
  teacher: [
    'dashboard.view',
    'students.view',
    'classes.view',
    'attendance.view',
    'attendance.create',
    'attendance.edit',
    'exams.view',
    'results.view',
    'results.create',
    'results.edit',
    'results.publish',
    'homework.view',
    'homework.create',
    'homework.edit',
    'announcements.create',
    'communication.manage',
    'reports.view',
    'timetable.view',
    'rooms.view',
    'staff.view',
    'staff.leave.create',
    'staff.leave.view',
    'requests.create',
    'requests.view',
    'requests.comment',
  ],
  parent: [
    'dashboard.view',
    'students.view',
    'attendance.view',
    'fees.view',
    'homework.view',
    'exams.view',
    'results.view',
    'requests.manage',
    'requests.create',
    'requests.view',
    'requests.comment',
    'timetable.view',
  ],
  student: [
    'dashboard.view',
    'students.view',
    'attendance.view',
    'homework.view',
    'exams.view',
    'results.view',
    'requests.create',
    'requests.view',
    'timetable.view',
  ],
};

export const MOCK_USERS_BY_ROLE: Record<Role, User> = {
  principal: {
    id: 'USR-001',
    name: 'Dr. Eleanor Vance',
    email: 'e.vance@staugustine.edu',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    role: 'principal',
    roleTitle: 'Principal & Executive Head',
    permissions: ROLE_PERMISSIONS.principal,
    phone: '+1 (555) 234-8901',
    schoolId: 'SCH-001',
  },
  super_admin: {
    id: 'USR-000',
    name: 'Julian Sterling (System)',
    email: 'sysadmin@staugustine.edu',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    role: 'super_admin',
    roleTitle: 'Global Systems Administrator',
    permissions: ROLE_PERMISSIONS.super_admin,
    schoolId: 'SCH-001',
  },
  admin_staff: {
    id: 'USR-002',
    name: 'Claire Holloway',
    email: 'c.holloway@staugustine.edu',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    role: 'admin_staff',
    roleTitle: 'Admissions & Records Registrar',
    permissions: ROLE_PERMISSIONS.admin_staff,
    schoolId: 'SCH-001',
  },
  accountant: {
    id: 'USR-003',
    name: 'Marcus Thorne, CPA',
    email: 'm.thorne@staugustine.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    role: 'accountant',
    roleTitle: 'Chief Bursar & Comptroller',
    permissions: ROLE_PERMISSIONS.accountant,
    schoolId: 'SCH-001',
  },
  teacher: {
    id: 'USR-004',
    name: 'Arthur Pendelton',
    email: 'a.pendelton@staugustine.edu',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    role: 'teacher',
    roleTitle: 'Head of Mathematics Faculty',
    permissions: ROLE_PERMISSIONS.teacher,
    schoolId: 'SCH-001',
    teacherId: 'TCH-001',
  },
  parent: {
    id: 'USR-005',
    name: 'Marcus Sterling',
    email: 'm.sterling@sterlingcorp.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    role: 'parent',
    roleTitle: 'Parent (Alexander & Sebastian)',
    permissions: ROLE_PERMISSIONS.parent,
    schoolId: 'SCH-001',
    parentId: 'PAR-001',
  },
  student: {
    id: 'USR-006',
    name: 'Alexander Sterling',
    email: 'a.sterling.stu@staugustine.edu',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
    role: 'student',
    roleTitle: 'Student (Class 6 - Section A)',
    permissions: ROLE_PERMISSIONS.student,
    schoolId: 'SCH-001',
    studentId: 'STU-001',
  },
};

export interface AuthSession {
  token: string;
  role: Role;
  userId: string;
  loginTime: number;
  expiresAt: number;
  rememberMe: boolean;
}

const SESSION_STORAGE_KEY = 'saia_auth_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface AuthContextType {
  currentUser: User;
  user: User;
  currentRole: Role;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
  can: (permission: Permission) => boolean;
  switchRole: (role: Role) => void;
  login: (
    emailOrRole: string,
    password?: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; role?: Role; error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  availableRoles: { role: Role; label: string; description: string; email: string }[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from session storage if present
  const [currentRole, setCurrentRole] = useState<Role>(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const session: AuthSession = JSON.parse(stored);
        if (session.expiresAt > Date.now() && session.role in MOCK_USERS_BY_ROLE) {
          return session.role;
        }
      }
    } catch {
      // Fallback
    }
    return 'principal';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const session: AuthSession = JSON.parse(stored);
        return session.expiresAt > Date.now();
      }
    } catch {
      // fallback
    }
    return true;
  });

  // Keep session persistence synchronized
  const persistSession = (role: Role, rememberMe: boolean = true) => {
    const session: AuthSession = {
      token: `AUTH_TOKEN_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      role,
      userId: MOCK_USERS_BY_ROLE[role].id,
      loginTime: Date.now(),
      expiresAt: Date.now() + (rememberMe ? SESSION_DURATION_MS : 3 * 60 * 60 * 1000),
      rememberMe,
    };
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage quota safety
    }
  };

  const currentUser: User = {
    ...MOCK_USERS_BY_ROLE[currentRole],
    permissions: ROLE_PERMISSIONS[currentRole],
  };

  const hasPermission = (permission: Permission): boolean => {
    return currentUser.permissions.includes(permission);
  };

  const can = hasPermission;

  const switchRole = (role: Role) => {
    setCurrentRole(role);
    setIsAuthenticated(true);
    persistSession(role, true);
  };

  const login = async (
    emailOrRole: string,
    _password?: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; role?: Role; error?: string }> => {
    // Artificial slight network latency for authentic feel
    await new Promise((res) => setTimeout(res, 400));

    const cleanInput = emailOrRole.trim().toLowerCase();

    // Check by email or role key
    const matchedRole = (Object.keys(MOCK_USERS_BY_ROLE) as Role[]).find((r) => {
      const u = MOCK_USERS_BY_ROLE[r];
      return (
        u.email.toLowerCase() === cleanInput ||
        r.toLowerCase() === cleanInput ||
        cleanInput.includes(r.toLowerCase())
      );
    });

    if (matchedRole) {
      setCurrentRole(matchedRole);
      setIsAuthenticated(true);
      persistSession(matchedRole, rememberMe);
      return { success: true, role: matchedRole };
    }

    // Default fallback if matching admin or credentials
    if (cleanInput.includes('admin') || cleanInput.includes('principal')) {
      setCurrentRole('principal');
      setIsAuthenticated(true);
      persistSession('principal', rememberMe);
      return { success: true, role: 'principal' };
    }

    return {
      success: false,
      error: 'Invalid credentials. Please check your email or select a demo account below.',
    };
  };

  const logout = () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    await new Promise((res) => setTimeout(res, 500));
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please provide a valid institutional email address.' };
    }
    return {
      success: true,
      message: `Password reset verification link has been dispatched to ${email}. Check your inbox.`,
    };
  };

  // Periodic session expiration verification
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const session: AuthSession = JSON.parse(stored);
          if (Date.now() > session.expiresAt) {
            setIsAuthenticated(false);
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch {
        // ignore
      }
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const availableRoles = [
    {
      role: 'super_admin' as Role,
      label: 'Super Admin',
      description: 'System-wide configuration, audit trails, complete root control',
      email: 'sysadmin@staugustine.edu',
    },
    {
      role: 'principal' as Role,
      label: 'Principal (Executive)',
      description: 'Full school administration, admissions, approvals & metrics',
      email: 'e.vance@staugustine.edu',
    },
    {
      role: 'admin_staff' as Role,
      label: 'Admin Staff / Registrar',
      description: 'Admissions, student records, enrollment & daily operations',
      email: 'c.holloway@staugustine.edu',
    },
    {
      role: 'accountant' as Role,
      label: 'Accountant / Bursar',
      description: 'Tuition fees, payment reconciliation, invoices & reports',
      email: 'm.thorne@staugustine.edu',
    },
    {
      role: 'teacher' as Role,
      label: 'Teacher (Arthur Pendelton)',
      description: 'Attendance registers, homework management, grading & timetable',
      email: 'a.pendelton@staugustine.edu',
    },
    {
      role: 'parent' as Role,
      label: 'Parent (Marcus Sterling)',
      description: 'Multi-child selector, attendance calendar, fee receipts & requests',
      email: 'm.sterling@sterlingcorp.com',
    },
    {
      role: 'student' as Role,
      label: 'Student (Alexander Sterling)',
      description: 'Personal schedule, homework submissions, exam results & notices',
      email: 'a.sterling.stu@staugustine.edu',
    },
  ];

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        currentRole,
        isAuthenticated,
        hasPermission,
        can,
        switchRole,
        login,
        logout,
        resetPassword,
        availableRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
