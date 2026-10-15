import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Layers,
  CheckCircle,
  Clock,
  FileText,
  Edit2,
  Trash2,
  Share2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Exam, ExamType, ExamStatus, ExamClassAssignment } from '../../types/exam';
import { examService } from '../../services/examService';
import { dataService } from '../../services/dataService';
import { User } from '../../types';

interface ExamsListTabProps {
  currentUser: User;
  onSelectExamForMarks?: (examId: string) => void;
  onSelectExamForSchedule?: (examId: string) => void;
  onSelectExamForResults?: (examId: string) => void;
}

const EXAM_TYPES: ExamType[] = [
  'Monthly Test',
  'Weekly Test',
  'Mid Term',
  'Final Term',
  'Annual Exam',
  'Custom',
];

const EXAM_STATUSES: ExamStatus[] = [
  'DRAFT',
  'SCHEDULED',
  'ONGOING',
  'COMPLETED',
  'PUBLISHED',
  'ARCHIVED',
];

export const ExamsListTab: React.FC<ExamsListTabProps> = ({
  currentUser,
  onSelectExamForMarks,
  onSelectExamForSchedule,
  onSelectExamForResults,
}) => {
  const [exams, setExams] = useState<Exam[]>(() => examService.getExams());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examName, setExamName] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [examType, setExamType] = useState<ExamType>('Mid Term');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ExamStatus>('DRAFT');
  const [selectedClasses, setSelectedClasses] = useState<{ [classId: string]: string[] }>({});
  const [formError, setFormError] = useState('');

  const allClasses = dataService.getClasses();

  const reloadExams = () => {
    setExams(examService.getExams());
  };

  const handleOpenCreate = () => {
    setEditingExam(null);
    setExamName('');
    setAcademicYear('2025-2026');
    setExamType('Mid Term');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]);
    setDescription('');
    setStatus('DRAFT');
    // Preselect Class 6 by default
    const initialSelected: { [key: string]: string[] } = {};
    if (allClasses.length > 0) {
      initialSelected[allClasses[0].id] = allClasses[0].sections.map((s) => s.id);
    }
    setSelectedClasses(initialSelected);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setExamName(exam.name);
    setAcademicYear(exam.academicYear);
    setExamType(exam.examType);
    setStartDate(exam.startDate);
    setEndDate(exam.endDate);
    setDescription(exam.description);
    setStatus(exam.status);

    const mapping: { [key: string]: string[] } = {};
    exam.participatingClasses.forEach((pc) => {
      mapping[pc.classId] = pc.sectionIds;
    });
    setSelectedClasses(mapping);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleClass = (classId: string) => {
    setSelectedClasses((prev) => {
      const copy = { ...prev };
      if (copy[classId]) {
        delete copy[classId];
      } else {
        const cls = allClasses.find((c) => c.id === classId);
        copy[classId] = cls ? cls.sections.map((s) => s.id) : [];
      }
      return copy;
    });
  };

  const handleToggleSection = (classId: string, sectionId: string) => {
    setSelectedClasses((prev) => {
      const currentSections = prev[classId] || [];
      let updated: string[];
      if (currentSections.includes(sectionId)) {
        updated = currentSections.filter((id) => id !== sectionId);
      } else {
        updated = [...currentSections, sectionId];
      }

      const copy = { ...prev };
      if (updated.length === 0) {
        delete copy[classId];
      } else {
        copy[classId] = updated;
      }
      return copy;
    });
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim()) {
      setFormError('Please enter an exam title.');
      return;
    }
    if (!startDate || !endDate) {
      setFormError('Start date and end date are required.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Start date cannot be after end date.');
      return;
    }

    const participatingClasses: ExamClassAssignment[] = (Object.entries(selectedClasses) as [string, string[]][])
      .map(([classId, sectionIds]) => {
        const cls = allClasses.find((c) => c.id === classId);
        if (!cls || !sectionIds || sectionIds.length === 0) return null;
        const sectionNames = cls.sections
          .filter((s) => sectionIds.includes(s.id))
          .map((s) => s.name);
        return {
          classId,
          className: cls.name,
          sectionIds,
          sectionNames,
        };
      })
      .filter(Boolean) as ExamClassAssignment[];

    if (participatingClasses.length === 0) {
      setFormError('Please assign at least one participating class & section.');
      return;
    }

    examService.saveExam(
      {
        id: editingExam?.id,
        name: examName.trim(),
        academicYear,
        examType,
        startDate,
        endDate,
        description: description.trim(),
        status,
        participatingClasses,
      },
      currentUser
    );

    setIsModalOpen(false);
    reloadExams();
  };

  const handleDeleteExam = (exam: Exam) => {
    if (
      window.confirm(
        `Are you sure you want to remove examination "${exam.name}"? This action is tracked in the audit log.`
      )
    ) {
      examService.deleteExam(exam.id, currentUser);
      reloadExams();
    }
  };

  const handleQuickStatusChange = (exam: Exam, newStatus: ExamStatus) => {
    examService.updateExamStatus(exam.id, newStatus, currentUser);
    reloadExams();
  };

  // Filter logic
  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.academicYear.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === 'All' || exam.academicYear === selectedYear;
    const matchesType = selectedType === 'All' || exam.examType === selectedType;
    const matchesStatus = selectedStatus === 'All' || exam.status === selectedStatus;
    return matchesSearch && matchesYear && matchesType && matchesStatus;
  });

  const uniqueYears = Array.from(new Set(exams.map((e) => e.academicYear)));

  const getStatusBadge = (st: ExamStatus) => {
    switch (st) {
      case 'PUBLISHED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ONGOING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SCHEDULED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMPLETED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const canManage =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'principal' ||
    currentUser.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Examinations Directory</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure term tests, comprehensive finals, participate cohorts, and publication lifecycles.
          </p>
        </div>
        {canManage && (
          <button
            id="btn-create-exam"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Examination
          </button>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-exams"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exam name, academic year, or syllabus notes..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            id="select-filter-year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Academic Years</option>
            {uniqueYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <select
            id="select-filter-type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Exam Types</option>
            {EXAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            id="select-filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            {EXAM_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredExams.map((exam) => (
          <div
            key={exam.id}
            id={`exam-card-${exam.id}`}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        exam.status
                      )}`}
                    >
                      {exam.status}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {exam.examType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      AY {exam.academicYear}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{exam.name}</h3>
                </div>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-edit-exam-${exam.id}`}
                      onClick={() => handleOpenEdit(exam)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit exam properties"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      id={`btn-delete-exam-${exam.id}`}
                      onClick={() => handleDeleteExam(exam)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {exam.description && (
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{exam.description}</p>
              )}

              {/* Date span */}
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {exam.startDate} &mdash; {exam.endDate}
                </span>
                {exam.publishedAt && (
                  <span className="text-emerald-600 font-medium ml-auto flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Published {exam.publishedAt.split(' ')[0]}
                  </span>
                )}
              </div>

              {/* Participating Cohorts */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Participating Classes:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {exam.participatingClasses.map((pc) => (
                    <span
                      key={pc.classId}
                      className="text-xs bg-indigo-50/80 text-indigo-700 border border-indigo-100 font-medium px-2 py-0.5 rounded-md"
                    >
                      {pc.className} ({pc.sectionNames.join(', ')})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Footer */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              {canManage && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">Status:</span>
                  <select
                    id={`select-status-${exam.id}`}
                    value={exam.status}
                    onChange={(e) => handleQuickStatusChange(exam, e.target.value as ExamStatus)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500"
                  >
                    {EXAM_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  id={`btn-view-schedule-${exam.id}`}
                  onClick={() => onSelectExamForSchedule && onSelectExamForSchedule(exam.id)}
                  className="text-xs px-2.5 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded font-medium transition-colors"
                >
                  Schedule
                </button>
                <button
                  id={`btn-enter-marks-${exam.id}`}
                  onClick={() => onSelectExamForMarks && onSelectExamForMarks(exam.id)}
                  className="text-xs px-2.5 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded font-medium transition-colors"
                >
                  Marks Entry
                </button>
                <button
                  id={`btn-view-results-${exam.id}`}
                  onClick={() => onSelectExamForResults && onSelectExamForResults(exam.id)}
                  className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-semibold transition-colors"
                >
                  Results & Ledger
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredExams.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Examinations Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            No exams match your filter criteria. Try adjusting your filters or create a new examination.
          </p>
        </div>
      )}

      {/* Create / Edit Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingExam ? 'Edit Examination' : 'Create New Examination'}
              </h3>
              <button
                id="btn-close-exam-modal"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Examination Title *
                </label>
                <input
                  id="modal-input-exam-name"
                  type="text"
                  required
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g. Mid-Term Examination 2025-2026"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Year *
                  </label>
                  <input
                    id="modal-input-academic-year"
                    type="text"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2025-2026"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Exam Type *
                  </label>
                  <select
                    id="modal-select-exam-type"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as ExamType)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    {EXAM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Date *
                  </label>
                  <input
                    id="modal-input-start-date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Date *
                  </label>
                  <input
                    id="modal-input-end-date"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  id="modal-select-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ExamStatus)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  {EXAM_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description & Syllabus Scope
                </label>
                <textarea
                  id="modal-textarea-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline syllabus units covered, test guidelines, or instructions for teachers..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Class & Section Assignment Matrix */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Participating Classes & Sections *
                </label>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3 max-h-48 overflow-y-auto">
                  {allClasses.map((cls) => {
                    const isClassChecked = Boolean(selectedClasses[cls.id]);
                    const selectedSecs = selectedClasses[cls.id] || [];

                    return (
                      <div key={cls.id} className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isClassChecked}
                              onChange={() => handleToggleClass(cls.id)}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-semibold text-slate-800">{cls.name}</span>
                          </label>
                          <span className="text-xs text-slate-400">
                            {cls.sections.length} sections
                          </span>
                        </div>

                        {isClassChecked && (
                          <div className="mt-2 pl-6 flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                            {cls.sections.map((sec) => {
                              const isSecChecked = selectedSecs.includes(sec.id);
                              return (
                                <label
                                  key={sec.id}
                                  className={`text-xs px-2.5 py-1 rounded-md cursor-pointer border transition-colors ${
                                    isSecChecked
                                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                                      : 'bg-slate-50 border-slate-200 text-slate-600'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSecChecked}
                                    onChange={() => handleToggleSection(cls.id, sec.id)}
                                    className="sr-only"
                                  />
                                  {sec.name}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-exam-form"
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {editingExam ? 'Save Changes' : 'Create Examination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
