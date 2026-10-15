import { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { dataService } from '../../services/dataService';

export interface AppLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  children: ReactNode;
  onOpenAddStudent: () => void;
  onOpenAddTeacher: () => void;
  onOpenMarkAttendance: () => void;
  onOpenRecordPayment: () => void;
  onOpenCreateAnnouncement: () => void;
}

export const AppLayout = ({
  currentRoute,
  onNavigate,
  children,
  onOpenAddStudent,
  onOpenAddTeacher,
  onOpenMarkAttendance,
  onOpenRecordPayment,
  onOpenCreateAnnouncement,
}: AppLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const school = dataService.getSchool();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenAddStudent={onOpenAddStudent}
        onOpenAddTeacher={onOpenAddTeacher}
      />

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          isSidebarCollapsed ? 'md:pl-18' : 'md:pl-64'
        }`}
      >
        {/* Sticky Header */}
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAddStudent={onOpenAddStudent}
          onOpenAddTeacher={onOpenAddTeacher}
          onOpenMarkAttendance={onOpenMarkAttendance}
          onOpenRecordPayment={onOpenRecordPayment}
          onOpenCreateAnnouncement={onOpenCreateAnnouncement}
          schoolName={school.name}
          currentTerm={school.currentTerm}
        />

        {/* Page Content Canvas */}
        <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
