import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { StudentsPage } from './pages/StudentsPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { TeachersPage } from './pages/TeachersPage';
import { ClassesPage } from './pages/ClassesPage';
import { FinancePage } from './pages/FinancePage';
import { AttendancePage } from './pages/AttendancePage';
import { AdmissionsPage } from './pages/AdmissionsPage';
import { CommunicationPage } from './pages/CommunicationPage';
import { AutomationRulesPage } from './pages/AutomationRulesPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { GenericModulePage } from './pages/GenericModulePage';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Specialized Portals for STEP 3
import { TeacherPortalPage } from './pages/TeacherPortalPage';
import { ParentPortalPage } from './pages/ParentPortalPage';
import { StudentPortalPage } from './pages/StudentPortalPage';

// Timetable, Staff & Requests Modules (STEPS 10, 11, 12)
import { TimetablePage } from './pages/TimetablePage';
import { StaffPage } from './pages/StaffPage';
import { RequestsPage } from './pages/RequestsPage';

// Exams & Results Module (STEP 6)
import { ExamsModule } from './components/exams/ExamsModule';

// Modals
import { AddStudentModal } from './components/modals/AddStudentModal';
import { AddTeacherModal } from './components/modals/AddTeacherModal';
import { RecordPaymentModal } from './components/modals/RecordPaymentModal';
import { MarkAttendanceModal } from './components/modals/MarkAttendanceModal';
import { CreateAnnouncementModal } from './components/modals/CreateAnnouncementModal';

const getDefaultRouteForRole = (role: string): string => {
  switch (role) {
    case 'teacher':
      return 'teacher-portal';
    case 'parent':
      return 'parent-portal';
    case 'student':
      return 'student-portal';
    case 'accountant':
      return 'finance';
    default:
      return 'dashboard';
  }
};

const isRouteAuthorized = (route: string, role: string): boolean => {
  if (role === 'super_admin' || role === 'principal') return true;

  if (role === 'teacher') {
    const allowed = [
      'teacher-portal',
      'students',
      'student-profile',
      'attendance',
      'academics',
      'timetable',
      'communication',
      'results',
      'exams',
      'requests',
      'staff',
    ];
    return allowed.some((r) => route === r || route.startsWith(r + '-'));
  }

  if (role === 'parent') {
    const allowed = [
      'parent-portal',
      'communication',
      'results',
      'exams',
      'attendance',
      'finance',
      'requests',
      'academics',
      'timetable',
    ];
    return allowed.some((r) => route === r || route.startsWith(r + '-'));
  }

  if (role === 'student') {
    const allowed = [
      'student-portal',
      'communication',
      'results',
      'exams',
      'attendance',
      'academics',
      'timetable',
      'requests',
    ];
    return allowed.some((r) => route === r || route.startsWith(r + '-'));
  }

  if (role === 'accountant') {
    const allowed = [
      'dashboard',
      'finance',
      'reports',
      'communication',
      'requests',
      'staff',
    ];
    return allowed.some((r) => route === r || route.startsWith(r + '-'));
  }

  if (role === 'admin_staff') {
    const forbidden = ['automation', 'settings'];
    return !forbidden.includes(route);
  }

  return true;
};

export function SchoolApp() {
  const { isAuthenticated, currentUser, currentRole } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>(() =>
    getDefaultRouteForRole(currentRole)
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>('STU-2024-001');

  // Quick Action Modals
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false);

  // Sync route on role switch
  useEffect(() => {
    if (!isRouteAuthorized(currentRoute, currentRole)) {
      setCurrentRoute(getDefaultRouteForRole(currentRole));
    }
  }, [currentRole]);

  // Navigation dispatcher
  const handleNavigate = (route: string, studentId?: string) => {
    if (studentId) {
      setSelectedStudentId(studentId);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewStudentProfile = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentRoute('student-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If unauthenticated, show production login page
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={(role) => {
          setCurrentRoute(getDefaultRouteForRole(role));
        }}
      />
    );
  }

  // Check role authorization for current route
  const authorized = isRouteAuthorized(currentRoute, currentRole);

  return (
    <AppLayout
      currentRoute={currentRoute}
      onNavigate={handleNavigate}
      onOpenAddStudent={() => setIsAddStudentOpen(true)}
      onOpenAddTeacher={() => setIsAddTeacherOpen(true)}
      onOpenMarkAttendance={() => setIsMarkAttendanceOpen(true)}
      onOpenRecordPayment={() => setIsRecordPaymentOpen(true)}
      onOpenCreateAnnouncement={() => setIsCreateAnnouncementOpen(true)}
    >
      {/* 403 Unauthorized Interceptor */}
      {!authorized && (
        <UnauthorizedPage
          attemptedRoute={currentRoute}
          onNavigateHome={() => handleNavigate(getDefaultRouteForRole(currentRole))}
        />
      )}

      {/* Role Portals */}
      {authorized && currentRoute === 'teacher-portal' && <TeacherPortalPage />}
      {authorized && currentRoute === 'parent-portal' && <ParentPortalPage />}
      {authorized && currentRoute === 'student-portal' && <StudentPortalPage />}

      {/* Standard Management Routes */}
      {authorized && currentRoute === 'dashboard' && (
        <Dashboard
          onNavigate={handleNavigate}
          onOpenAddStudent={() => setIsAddStudentOpen(true)}
          onOpenAddTeacher={() => setIsAddTeacherOpen(true)}
          onOpenMarkAttendance={() => setIsMarkAttendanceOpen(true)}
          onOpenRecordPayment={() => setIsRecordPaymentOpen(true)}
          onOpenCreateAnnouncement={() => setIsCreateAnnouncementOpen(true)}
        />
      )}

      {authorized && currentRoute === 'students' && (
        <StudentsPage
          onViewStudent={handleViewStudentProfile}
          onOpenAddStudent={() => setIsAddStudentOpen(true)}
        />
      )}

      {authorized && currentRoute === 'student-profile' && (
        <StudentProfilePage
          studentId={selectedStudentId}
          onBack={() => handleNavigate('students')}
        />
      )}

      {authorized && currentRoute === 'teachers' && (
        <TeachersPage onOpenAddTeacher={() => setIsAddTeacherOpen(true)} />
      )}

      {authorized &&
        (currentRoute === 'staff' || currentRoute.startsWith('staff-')) && (
          <StaffPage />
        )}

      {authorized &&
        (currentRoute === 'timetable' || currentRoute === 'academics-timetable') && (
          <TimetablePage />
        )}

      {authorized &&
        (currentRoute === 'academics' ||
          (currentRoute.startsWith('academics-') && currentRoute !== 'academics-timetable')) && (
          <ClassesPage
            onViewClassStudents={() => {
              handleNavigate('students');
            }}
          />
        )}

      {authorized &&
        (currentRoute === 'attendance' || currentRoute.startsWith('attendance-')) && (
          <AttendancePage
            subRoute={currentRoute}
            onOpenMarkAttendance={() => setIsMarkAttendanceOpen(true)}
            onNavigateStudent={(studentId) => handleViewStudentProfile(studentId)}
          />
        )}

      {authorized &&
        (currentRoute === 'finance' || currentRoute.startsWith('finance-')) && (
          <FinancePage
            subRoute={currentRoute}
            onOpenRecordPayment={() => setIsRecordPaymentOpen(true)}
            onNavigateStudent={(studentId) => handleViewStudentProfile(studentId)}
          />
        )}

      {authorized &&
        (currentRoute === 'admissions' || currentRoute.startsWith('admissions-')) && (
          <AdmissionsPage subRoute={currentRoute} />
        )}

      {authorized &&
        (currentRoute === 'communication' || currentRoute.startsWith('comm-')) && (
          <CommunicationPage
            onOpenCreateAnnouncement={() => setIsCreateAnnouncementOpen(true)}
          />
        )}

      {authorized &&
        (currentRoute === 'requests' || currentRoute.startsWith('requests-')) && (
          <RequestsPage />
        )}

      {authorized && currentRoute === 'automation' && <AutomationRulesPage />}

      {authorized && currentRoute === 'ai-assistant' && <AIAssistantPage />}

      {authorized && currentRoute === 'parents' && (
        <GenericModulePage module="parents" />
      )}
      {authorized && currentRoute === 'transport' && (
        <GenericModulePage module="transport" />
      )}
      {authorized && currentRoute === 'health' && (
        <GenericModulePage module="health" />
      )}
      {authorized && currentRoute === 'reports' && (
        <GenericModulePage module="reports" />
      )}
      {authorized && (currentRoute === 'exams' || currentRoute.startsWith('exams-') || currentRoute === 'results') && (
        <ExamsModule
          currentUser={currentUser}
          initialTab={
            currentRoute === 'exams-schedule'
              ? 'schedule'
              : currentRoute === 'exams-marks'
              ? 'marks'
              : currentRoute === 'exams-results' || currentRoute === 'results'
              ? 'results'
              : currentRoute === 'exams-reports'
              ? 'reports'
              : currentRoute === 'exams-analytics'
              ? 'analytics'
              : currentRoute === 'exams-settings'
              ? 'settings'
              : 'exams'
          }
        />
      )}
      {authorized && currentRoute === 'settings' && (
        <GenericModulePage module="settings" />
      )}

      {/* Global Quick Action Modals */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onStudentAdded={(newStu) => {
          setSelectedStudentId(newStu.studentId);
          handleNavigate('student-profile');
        }}
      />

      <AddTeacherModal
        isOpen={isAddTeacherOpen}
        onClose={() => setIsAddTeacherOpen(false)}
        onTeacherAdded={() => {
          handleNavigate('teachers');
        }}
      />

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onPaymentRecorded={() => {
          if (currentRoute === 'finance') {
            // refresh
          }
        }}
      />

      <MarkAttendanceModal
        isOpen={isMarkAttendanceOpen}
        onClose={() => setIsMarkAttendanceOpen(false)}
        onSubmitted={() => {
          if (currentRoute === 'attendance') {
            // refresh
          }
        }}
      />

      <CreateAnnouncementModal
        isOpen={isCreateAnnouncementOpen}
        onClose={() => setIsCreateAnnouncementOpen(false)}
        onCreated={() => {
          if (currentRoute === 'communication') {
            // refresh
          }
        }}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SchoolApp />
      </AuthProvider>
    </ToastProvider>
  );
}
