import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  PenTool,
  Award,
  FileText,
  BarChart3,
  Settings,
  GraduationCap,
} from 'lucide-react';
import { User } from '../../types';
import { ExamsListTab } from './ExamsListTab';
import { ExamScheduleTab } from './ExamScheduleTab';
import { MarksEntryTab } from './MarksEntryTab';
import { ResultsLedgerTab } from './ResultsLedgerTab';
import { ReportCardsTab } from './ReportCardsTab';
import { ResultAnalyticsTab } from './ResultAnalyticsTab';
import { ResultSettingsTab } from './ResultSettingsTab';

interface ExamsModuleProps {
  currentUser: User;
  initialTab?: string;
}

export type ExamTabType =
  | 'exams'
  | 'schedule'
  | 'marks'
  | 'results'
  | 'reports'
  | 'analytics'
  | 'settings';

export const ExamsModule: React.FC<ExamsModuleProps> = ({
  currentUser,
  initialTab = 'exams',
}) => {
  const [activeTab, setActiveTab] = useState<ExamTabType>(
    (initialTab as ExamTabType) || 'exams'
  );

  // Cross-tab context parameters
  const [targetExamId, setTargetExamId] = useState<string | undefined>(undefined);
  const [targetClassId, setTargetClassId] = useState<string | undefined>(undefined);
  const [targetSectionId, setTargetSectionId] = useState<string | undefined>(undefined);
  const [targetSubjectId, setTargetSubjectId] = useState<string | undefined>(undefined);
  const [targetStudentId, setTargetStudentId] = useState<string | undefined>(undefined);

  // Navigation handlers
  const handleNavigateToSchedule = (examId: string) => {
    setTargetExamId(examId);
    setActiveTab('schedule');
  };

  const handleNavigateToMarks = (
    examId: string,
    classId?: string,
    sectionId?: string,
    subjectId?: string
  ) => {
    setTargetExamId(examId);
    if (classId) setTargetClassId(classId);
    if (sectionId) setTargetSectionId(sectionId);
    if (subjectId) setTargetSubjectId(subjectId);
    setActiveTab('marks');
  };

  const handleNavigateToResults = (examId: string) => {
    setTargetExamId(examId);
    setActiveTab('results');
  };

  const handleOpenReportCard = (examId: string, studentId: string) => {
    setTargetExamId(examId);
    setTargetStudentId(studentId);
    setActiveTab('reports');
  };

  const tabs: { id: ExamTabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'exams', label: 'Exams', icon: FileSpreadsheet },
    { id: 'schedule', label: 'Exam Schedule', icon: Calendar },
    { id: 'marks', label: 'Marks Entry', icon: PenTool },
    { id: 'results', label: 'Results Ledger', icon: Award },
    { id: 'reports', label: 'Report Cards', icon: FileText },
    { id: 'analytics', label: 'Result Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Grading Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Tab Navigation */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200 shadow-xs p-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="tab-content">
        {activeTab === 'exams' && (
          <ExamsListTab
            currentUser={currentUser}
            onNavigateToSchedule={handleNavigateToSchedule}
            onNavigateToMarks={handleNavigateToMarks}
            onNavigateToResults={handleNavigateToResults}
          />
        )}

        {activeTab === 'schedule' && (
          <ExamScheduleTab
            currentUser={currentUser}
            initialExamId={targetExamId}
            onNavigateToMarks={handleNavigateToMarks}
          />
        )}

        {activeTab === 'marks' && (
          <MarksEntryTab
            currentUser={currentUser}
            initialExamId={targetExamId}
            initialClassId={targetClassId}
            initialSectionId={targetSectionId}
            initialSubjectId={targetSubjectId}
          />
        )}

        {activeTab === 'results' && (
          <ResultsLedgerTab
            currentUser={currentUser}
            initialExamId={targetExamId}
            onOpenReportCard={handleOpenReportCard}
          />
        )}

        {activeTab === 'reports' && (
          <ReportCardsTab
            currentUser={currentUser}
            initialExamId={targetExamId}
            initialStudentId={targetStudentId}
          />
        )}

        {activeTab === 'analytics' && (
          <ResultAnalyticsTab
            currentUser={currentUser}
            initialExamId={targetExamId}
          />
        )}

        {activeTab === 'settings' && (
          <ResultSettingsTab currentUser={currentUser} />
        )}
      </div>
    </div>
  );
};
