import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  Trash2,
  Edit2,
  AlertTriangle,
  Printer,
  Download,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { ExamScheduleItem, Exam } from '../../types/exam';
import { examService } from '../../services/examService';
import { dataService } from '../../services/dataService';
import { User } from '../../types';

interface ExamScheduleTabProps {
  currentUser: User;
  initialExamId?: string;
  onNavigateToMarks?: (examId: string, classId: string, sectionId: string, subjectId: string) => void;
}

export const ExamScheduleTab: React.FC<ExamScheduleTabProps> = ({
  currentUser,
  initialExamId,
  onNavigateToMarks,
}) => {
  const exams = examService.getExams();
  const classes = dataService.getClasses();
  const teachers = dataService.getTeachers();

  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialExamId || exams[0]?.id || ''
  );
  const [selectedClassId, setSelectedClassId] = useState<string>('All');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const [schedules, setSchedules] = useState<ExamScheduleItem[]>(() =>
    examService.getSchedules()
  );

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExamScheduleItem | null>(null);
  const [formExamId, setFormExamId] = useState(selectedExamId);
  const [formClassId, setFormClassId] = useState(classes[0]?.id || '');
  const [formSectionId, setFormSectionId] = useState(classes[0]?.sections[0]?.id || '');
  const [formSubjectName, setFormSubjectName] = useState('Mathematics');
  const [formTotalMarks, setFormTotalMarks] = useState(100);
  const [formPassingMarks, setFormPassingMarks] = useState(40);
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00 AM');
  const [formEndTime, setFormEndTime] = useState('11:30 AM');
  const [formRoom, setFormRoom] = useState('Hall 204');
  const [formInvigilatorId, setFormInvigilatorId] = useState(teachers[0]?.id || '');
  const [errorMessage, setErrorMessage] = useState('');

  const reloadSchedules = () => {
    setSchedules(examService.getSchedules());
  };

  const currentExam = exams.find((e) => e.id === selectedExamId);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormExamId(selectedExamId || exams[0]?.id || '');
    setFormClassId(classes[0]?.id || '');
    setFormSectionId(classes[0]?.sections[0]?.id || '');
    setFormSubjectName('Mathematics');
    setFormTotalMarks(100);
    setFormPassingMarks(40);
    setFormDate(currentExam ? currentExam.startDate : new Date().toISOString().split('T')[0]);
    setFormStartTime('09:00 AM');
    setFormEndTime('11:30 AM');
    setFormRoom('Hall 204');
    setFormInvigilatorId(teachers[0]?.id || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ExamScheduleItem) => {
    setEditingItem(item);
    setFormExamId(item.examId);
    setFormClassId(item.classId);
    setFormSectionId(item.sectionId);
    setFormSubjectName(item.subjectName);
    setFormTotalMarks(item.totalMarks);
    setFormPassingMarks(item.passingMarks);
    setFormDate(item.examDate);
    setFormStartTime(item.startTime);
    setFormEndTime(item.endTime);
    setFormRoom(item.room);
    setFormInvigilatorId(item.invigilatorId || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleDelete = (item: ExamScheduleItem) => {
    if (
      window.confirm(
        `Delete schedule entry for ${item.subjectName} (${item.className} - ${item.sectionName}) on ${item.examDate}?`
      )
    ) {
      examService.deleteSchedule(item.id, currentUser);
      reloadSchedules();
    }
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubjectName.trim()) {
      setErrorMessage('Subject name is required.');
      return;
    }
    if (!formDate) {
      setErrorMessage('Exam date is required.');
      return;
    }
    if (formTotalMarks <= 0 || formPassingMarks <= 0) {
      setErrorMessage('Marks must be positive numbers.');
      return;
    }
    if (formPassingMarks > formTotalMarks) {
      setErrorMessage('Passing marks cannot exceed total marks.');
      return;
    }

    const examObj = exams.find((e) => e.id === formExamId);
    const classObj = classes.find((c) => c.id === formClassId);
    const sectionObj = classObj?.sections.find((s) => s.id === formSectionId);
    const teacherObj = teachers.find((t) => t.id === formInvigilatorId);

    const result = examService.saveSchedule(
      {
        id: editingItem?.id,
        examId: formExamId,
        examName: examObj?.name || 'Exam',
        academicYear: examObj?.academicYear || '2025-2026',
        classId: formClassId,
        className: classObj?.name || 'Class',
        sectionId: formSectionId,
        sectionName: sectionObj?.name || 'Section',
        subjectId: `SUB-${formSubjectName.replace(/\s+/g, '-').toUpperCase()}`,
        subjectName: formSubjectName.trim(),
        totalMarks: Number(formTotalMarks),
        passingMarks: Number(formPassingMarks),
        examDate: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        room: formRoom.trim(),
        invigilatorId: teacherObj?.id,
        invigilatorName: teacherObj?.name,
      },
      currentUser
    );

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to save schedule due to a conflict.');
      return;
    }

    setIsModalOpen(false);
    reloadSchedules();
  };

  // Filtered schedules
  const filtered = schedules.filter((item) => {
    const matchExam = !selectedExamId || item.examId === selectedExamId;
    const matchClass = selectedClassId === 'All' || item.classId === selectedClassId;
    const matchSection = selectedSectionId === 'All' || item.sectionId === selectedSectionId;
    const matchDate = !selectedDate || item.examDate === selectedDate;
    const matchSearch =
      item.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.invigilatorName && item.invigilatorName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchExam && matchClass && matchSection && matchDate && matchSearch;
  });

  // Sort by date then time
  filtered.sort((a, b) => {
    if (a.examDate === b.examDate) {
      return a.startTime.localeCompare(b.startTime);
    }
    return a.examDate.localeCompare(b.examDate);
  });

  const selectedClassObj = classes.find((c) => c.id === selectedClassId);
  const formClassObj = classes.find((c) => c.id === formClassId);

  const canManage =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'principal' ||
    currentUser.role === 'admin';

  const handlePrintDateSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Exam Schedule & Date Sheet
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage subject examination timetables, room assignments, invigilators, and conflict-free schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-print-datesheet"
            onClick={handlePrintDateSheet}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print Date Sheet
          </button>
          {canManage && (
            <button
              id="btn-add-schedule-item"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Schedule Exam Session
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Select Exam</label>
          <select
            id="select-schedule-exam"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name} ({exam.academicYear})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Class Filter</label>
          <select
            id="select-schedule-class"
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedSectionId('All');
            }}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Section Filter</label>
          <select
            id="select-schedule-section"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            disabled={selectedClassId === 'All'}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          >
            <option value="All">All Sections</option>
            {selectedClassObj?.sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Date</label>
          <input
            id="input-schedule-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-schedule"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Subject, room, invigilator..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Date Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {currentExam ? currentExam.name : 'Examination Timetable'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filtered.length} scheduled paper sessions
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
            Conflict Prevention: Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold tracking-wide uppercase">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Class & Section</th>
                <th className="py-3.5 px-4">Room / Hall</th>
                <th className="py-3.5 px-4">Invigilator</th>
                <th className="py-3.5 px-4">Marks Scale</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex flex-col items-center justify-center font-bold text-xs shrink-0">
                        <span>{new Date(item.examDate).getDate() || '—'}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{item.examDate}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {item.startTime} &ndash; {item.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      {item.subjectName}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      ID: {item.subjectId}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-800">{item.className}</span>
                    <span className="ml-1.5 text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {item.sectionName}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="font-medium">{item.room}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.invigilatorName || 'Unassigned'}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-xs">
                      <span className="font-bold text-slate-900">{item.totalMarks} Total</span>
                      <span className="text-slate-400"> / </span>
                      <span className="text-emerald-600 font-medium">
                        {item.passingMarks} Pass
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onNavigateToMarks && (
                        <button
                          id={`btn-schedule-marks-${item.id}`}
                          onClick={() =>
                            onNavigateToMarks(
                              item.examId,
                              item.classId,
                              item.sectionId,
                              item.subjectId
                            )
                          }
                          className="px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-medium transition-colors mr-1"
                        >
                          Marks
                        </button>
                      )}
                      {canManage && (
                        <>
                          <button
                            id={`btn-edit-schedule-${item.id}`}
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit schedule entry"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-schedule-${item.id}`}
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete schedule entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">No exam sessions scheduled matching these filters.</p>
              {canManage && (
                <button
                  onClick={handleOpenCreate}
                  className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  + Add First Exam Schedule
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Schedule Modal with Conflict Detection */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Exam Session' : 'Schedule Exam Session'}
              </h3>
              <button
                id="btn-close-schedule-modal"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Examination *
                </label>
                <select
                  id="modal-select-schedule-exam"
                  value={formExamId}
                  onChange={(e) => setFormExamId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name} ({exam.academicYear})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Class *
                  </label>
                  <select
                    id="modal-select-schedule-class"
                    value={formClassId}
                    onChange={(e) => {
                      setFormClassId(e.target.value);
                      const target = classes.find((c) => c.id === e.target.value);
                      if (target && target.sections.length > 0) {
                        setFormSectionId(target.sections[0].id);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Section *
                  </label>
                  <select
                    id="modal-select-schedule-section"
                    value={formSectionId}
                    onChange={(e) => setFormSectionId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    {formClassObj?.sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Subject Name *
                </label>
                <input
                  id="modal-input-schedule-subject"
                  type="text"
                  required
                  value={formSubjectName}
                  onChange={(e) => setFormSubjectName(e.target.value)}
                  placeholder="e.g. Advanced Mathematics"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Total Marks *
                  </label>
                  <input
                    id="modal-input-schedule-totalmarks"
                    type="number"
                    required
                    min={1}
                    max={500}
                    value={formTotalMarks}
                    onChange={(e) => setFormTotalMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Passing Marks *
                  </label>
                  <input
                    id="modal-input-schedule-passmarks"
                    type="number"
                    required
                    min={1}
                    max={formTotalMarks}
                    value={formPassingMarks}
                    onChange={(e) => setFormPassingMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Exam Date *
                </label>
                <input
                  id="modal-input-schedule-date"
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Time *
                  </label>
                  <input
                    id="modal-input-schedule-starttime"
                    type="text"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Time *
                  </label>
                  <input
                    id="modal-input-schedule-endtime"
                    type="text"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="11:30 AM"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Room / Hall *
                  </label>
                  <input
                    id="modal-input-schedule-room"
                    type="text"
                    required
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="Hall 204"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Invigilator
                  </label>
                  <select
                    id="modal-select-schedule-invigilator"
                    value={formInvigilatorId}
                    onChange={(e) => setFormInvigilatorId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    <option value="">Select Invigilator</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.subjects && t.subjects.length > 0 ? `(${t.subjects.join(', ')})` : t.department ? `(${t.department})` : ''}
                      </option>
                    ))}
                  </select>
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
                  id="btn-submit-schedule-form"
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {editingItem ? 'Save Changes' : 'Add to Date Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
