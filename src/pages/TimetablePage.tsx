import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Filter,
  Users,
  DoorClosed,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Printer,
  Trash2,
  Edit2,
  UserCheck,
  Building,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { timetableService } from '../services/timetableService';
import { dataService } from '../services/dataService';
import {
  TimetableEntry,
  Room,
  Period,
  DayOfWeek,
  Substitution,
  TimetableConflict,
} from '../types/timetable';

export const TimetablePage: React.FC = () => {
  const { currentUser, can } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<
    'matrix' | 'workload' | 'rooms' | 'substitutions' | 'periods'
  >('matrix');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<'class' | 'teacher' | 'room'>('class');
  const [selectedClassId, setSelectedClassId] = useState<string>('CLS-001');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  // Form states
  const [formDay, setFormDay] = useState<DayOfWeek>('Monday');
  const [formPeriodId, setFormPeriodId] = useState<string>('PER-002');
  const [formClassId, setFormClassId] = useState<string>('CLS-001');
  const [formSectionId, setFormSectionId] = useState<string>('SEC-001');
  const [formSubjectId, setFormSubjectId] = useState<string>('SUB-001');
  const [formSubjectName, setFormSubjectName] = useState<string>('Mathematics');
  const [formTeacherId, setFormTeacherId] = useState<string>('TCH-001');
  const [formRoomId, setFormRoomId] = useState<string>('RM-101');
  const [formOverride, setFormOverride] = useState<boolean>(false);
  const [formOverrideReason, setFormOverrideReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Duplicate modal states
  const [dupFromDay, setDupFromDay] = useState<DayOfWeek>('Monday');
  const [dupToDay, setDupToDay] = useState<DayOfWeek>('Wednesday');
  const [dupResult, setDupResult] = useState<{ addedCount: number; skippedCount: number } | null>(null);

  // Substitution form states
  const [subDate, setSubDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [subPeriodId, setSubPeriodId] = useState<string>('PER-002');
  const [subOriginalTeacherId, setSubOriginalTeacherId] = useState<string>('TCH-001');
  const [substituteTeacherId, setSubstituteTeacherId] = useState<string>('TCH-002');
  const [subClassId, setSubClassId] = useState<string>('CLS-001');
  const [subReason, setSubReason] = useState<string>('Teacher on medical leave');
  const [subError, setSubError] = useState<string | null>(null);

  // Data fetching
  const settings = timetableService.getSettings();
  const rooms = timetableService.getRooms();
  const periods = timetableService.getPeriods();
  const allEntries = timetableService.getTimetableEntries();
  const substitutions = timetableService.getSubstitutions();
  const classes = dataService.getClasses();
  const teachers = dataService.getTeachers();

  // Permission checks
  const canManageTimetable =
    can('timetable.create') || can('timetable.edit') || currentUser.role === 'principal';
  const canOverrideConflict =
    can('timetable.override_conflict') ||
    currentUser.role === 'principal' ||
    currentUser.role === 'super_admin';
  const canManageRooms =
    can('rooms.manage') ||
    currentUser.role === 'principal' ||
    currentUser.role === 'super_admin';

  // Days list from settings
  const workingDays: DayOfWeek[] = settings.workingDays;

  // Filtered timetable entries
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      if (entry.status !== 'SCHEDULED') return false;
      if (selectedDay !== 'ALL' && entry.dayOfWeek !== selectedDay) return false;

      if (filterType === 'class') {
        if (selectedClassId && entry.classId !== selectedClassId) return false;
        if (selectedSectionId !== 'all' && entry.sectionId !== selectedSectionId) return false;
      } else if (filterType === 'teacher') {
        if (selectedTeacherId !== 'all' && entry.teacherId !== selectedTeacherId) return false;
      } else if (filterType === 'room') {
        if (selectedRoomId !== 'all' && entry.roomId !== selectedRoomId) return false;
      }
      return true;
    });
  }, [
    allEntries,
    selectedDay,
    filterType,
    selectedClassId,
    selectedSectionId,
    selectedTeacherId,
    selectedRoomId,
  ]);

  // Live Conflict Check during entry modal editing
  const liveConflict: TimetableConflict | null = useMemo(() => {
    if (!isEntryModalOpen) return null;
    return timetableService.checkConflict(
      {
        dayOfWeek: formDay,
        periodId: formPeriodId,
        teacherId: formTeacherId,
        roomId: formRoomId,
        classId: formClassId,
        sectionId: formSectionId,
        status: 'SCHEDULED',
      },
      editingEntry ? editingEntry.id : undefined
    );
  }, [
    isEntryModalOpen,
    formDay,
    formPeriodId,
    formTeacherId,
    formRoomId,
    formClassId,
    formSectionId,
    editingEntry,
  ]);

  // Analytics for workload tab
  const workloadAnalytics = useMemo(() => {
    return timetableService.getFreePeriodAnalytics();
  }, [allEntries, rooms, periods]);

  // Handlers
  const handleOpenCreateModal = (day?: DayOfWeek, periodId?: string) => {
    setEditingEntry(null);
    if (day) setFormDay(day);
    if (periodId) setFormPeriodId(periodId);
    setFormClassId(selectedClassId || 'CLS-001');
    setFormSectionId(selectedSectionId !== 'all' ? selectedSectionId : 'SEC-001');
    setFormTeacherId(teachers[0]?.id || 'TCH-001');
    setFormRoomId(rooms[0]?.id || 'RM-101');
    setFormSubjectName('Mathematics');
    setFormOverride(false);
    setFormOverrideReason('');
    setFormError(null);
    setIsEntryModalOpen(true);
  };

  const handleOpenEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormDay(entry.dayOfWeek);
    setFormPeriodId(entry.periodId);
    setFormClassId(entry.classId);
    setFormSectionId(entry.sectionId);
    setFormSubjectId(entry.subjectId);
    setFormSubjectName(entry.subjectName);
    setFormTeacherId(entry.teacherId);
    setFormRoomId(entry.roomId);
    setFormOverride(entry.isConflictOverridden || false);
    setFormOverrideReason(entry.overrideReason || '');
    setFormError(null);
    setIsEntryModalOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cls = classes.find((c) => c.id === formClassId);
    const sec = cls?.sections.find((s) => s.id === formSectionId);
    const tch = teachers.find((t) => t.id === formTeacherId);
    const rm = rooms.find((r) => r.id === formRoomId);
    const per = periods.find((p) => p.id === formPeriodId);

    if (!cls || !sec || !tch || !rm || !per) {
      setFormError('Please select valid class, section, teacher, room, and period.');
      return;
    }

    try {
      if (editingEntry) {
        timetableService.updateTimetableEntry(
          editingEntry.id,
          {
            dayOfWeek: formDay,
            periodId: formPeriodId,
            startTime: per.startTime,
            endTime: per.endTime,
            classId: formClassId,
            className: cls.name,
            sectionId: formSectionId,
            sectionName: sec.name,
            subjectId: formSubjectId,
            subjectName: formSubjectName,
            teacherId: formTeacherId,
            teacherName: tch.name,
            roomId: formRoomId,
            roomName: rm.name,
          },
          currentUser,
          formOverride,
          formOverrideReason
        );
      } else {
        timetableService.addTimetableEntry(
          {
            schoolId: 'SCH-001',
            dayOfWeek: formDay,
            periodId: formPeriodId,
            startTime: per.startTime,
            endTime: per.endTime,
            classId: formClassId,
            className: cls.name,
            sectionId: formSectionId,
            sectionName: sec.name,
            subjectId: formSubjectId,
            subjectName: formSubjectName,
            teacherId: formTeacherId,
            teacherName: tch.name,
            roomId: formRoomId,
            roomName: rm.name,
            termId: settings.termId,
            academicYearId: settings.academicYearId,
            status: 'SCHEDULED',
          },
          currentUser,
          formOverride,
          formOverrideReason
        );
      }
      setIsEntryModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save timetable entry.');
    }
  };

  const handleDeleteEntry = (id: string, subjectName: string) => {
    if (window.confirm(`Are you sure you want to remove the ${subjectName} schedule session?`)) {
      try {
        timetableService.deleteTimetableEntry(id, currentUser);
        // Force refresh
        setActiveTab((prev) => prev);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleRunDuplicate = () => {
    setDupResult(null);
    try {
      const res = timetableService.duplicateDaySchedule(
        dupFromDay,
        dupToDay,
        selectedClassId,
        currentUser
      );
      setDupResult(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveSubstitution = (e: React.FormEvent) => {
    e.preventDefault();
    setSubError(null);

    const origTch = teachers.find((t) => t.id === subOriginalTeacherId);
    const subTch = teachers.find((t) => t.id === substituteTeacherId);
    const per = periods.find((p) => p.id === subPeriodId);
    const cls = classes.find((c) => c.id === subClassId);
    const sec = cls?.sections[0];
    const rm = rooms[0];

    if (!origTch || !subTch || !per || !cls || !sec || !rm) {
      setSubError('Invalid selection details.');
      return;
    }

    try {
      timetableService.createSubstitution(
        {
          schoolId: 'SCH-001',
          originalTeacherId: origTch.id,
          originalTeacherName: origTch.name,
          substituteTeacherId: subTch.id,
          substituteTeacherName: subTch.name,
          date: subDate,
          periodId: per.id,
          periodName: per.name,
          classId: cls.id,
          className: cls.name,
          sectionId: sec.id,
          sectionName: sec.name,
          subjectId: 'SUB-001',
          subjectName: 'Class Cover Session',
          roomId: rm.id,
          roomName: rm.name,
          reason: subReason,
          status: 'ASSIGNED',
        },
        currentUser
      );
      setIsSubModalOpen(false);
    } catch (err: any) {
      setSubError(err.message || 'Substitution assignment failed.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Calendar className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                Academic Timetable & Scheduling
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Master class scheduling, room allocation, teacher workload optimization, and cover substitutions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Term: <strong className="text-slate-100">{settings.termName || settings.termId} ({settings.academicYearName || settings.academicYearId})</strong></span>
            </div>

            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Print Timetable"
            >
              <Printer className="w-4 h-4" />
              <span>Print View</span>
            </button>

            {canManageTimetable && (
              <>
                <button
                  onClick={() => setIsDuplicateModalOpen(true)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <span>Duplicate Day</span>
                </button>

                <button
                  onClick={() => handleOpenCreateModal()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule Class</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Weekly Matrix Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('workload')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'workload'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Teacher Workload & Free Periods</span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'rooms'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <DoorClosed className="w-4 h-4" />
            <span>Rooms & Labs ({rooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('substitutions')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'substitutions'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Cover Substitutions</span>
            {substitutions.filter((s) => s.status === 'ASSIGNED').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                {substitutions.filter((s) => s.status === 'ASSIGNED').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('periods')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'periods'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Periods & Breaks ({periods.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: WEEKLY MATRIX GRID */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Matrix Filter Bar */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>View by:</span>
              </div>

              {/* View Type Toggle */}
              <div className="flex bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/80 text-xs">
                <button
                  onClick={() => setFilterType('class')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterType === 'class' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Class Cohort
                </button>
                <button
                  onClick={() => setFilterType('teacher')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterType === 'teacher' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Teacher
                </button>
                <button
                  onClick={() => setFilterType('room')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterType === 'room' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Room / Facility
                </button>
              </div>

              {/* Specific Filter Target Dropdowns */}
              {filterType === 'class' && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setSelectedSectionId('all');
                    }}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All Sections</option>
                    {classes
                      .find((c) => c.id === selectedClassId)
                      ?.sections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {filterType === 'teacher' && (
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Teachers</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.department})
                    </option>
                  ))}
                </select>
              )}

              {filterType === 'room' && (
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Rooms</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.roomNumber}) - Cap {r.capacity}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Day Filter / Day Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1">Day:</span>
              <button
                onClick={() => setSelectedDay('ALL')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedDay === 'ALL'
                    ? 'bg-slate-700 text-slate-100 border border-slate-600'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Days
              </button>
              {workingDays.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedDay === day
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Master Timetable Grid */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4 w-44 border-r border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Period / Timing</span>
                      </div>
                    </th>
                    {(selectedDay === 'ALL' ? workingDays : [selectedDay]).map((day) => (
                      <th
                        key={day}
                        className="py-3.5 px-4 border-r border-slate-800 last:border-r-0 min-w-[150px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200">{day}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {
                              filteredEntries.filter(
                                (e) => e.dayOfWeek === day && e.status === 'SCHEDULED'
                              ).length
                            }{' '}
                            classes
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {periods.map((period) => {
                    const isBreak = period.breakType !== 'Regular Period';

                    if (isBreak) {
                      return (
                        <tr
                          key={period.id}
                          className="bg-slate-950/40 border-y border-slate-800/80"
                        >
                          <td className="py-2.5 px-4 font-medium text-slate-400 border-r border-slate-800 bg-slate-950/60">
                            <div className="font-semibold text-amber-300/90 text-xs">
                              {period.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {period.startTime} - {period.endTime}
                            </div>
                          </td>
                          <td
                            colSpan={selectedDay === 'ALL' ? workingDays.length : 1}
                            className="py-2 px-4 text-center text-slate-400 text-xs italic tracking-wide"
                          >
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-300">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              {period.name} ({period.startTime} - {period.endTime})
                            </span>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={period.id} className="hover:bg-slate-800/20 transition-colors">
                        {/* Period Info Column */}
                        <td className="py-3 px-4 font-medium text-slate-300 border-r border-slate-800 bg-slate-950/40">
                          <div className="font-semibold text-slate-200">{period.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>
                              {period.startTime} - {period.endTime}
                            </span>
                          </div>
                        </td>

                        {/* Day Columns */}
                        {(selectedDay === 'ALL' ? workingDays : [selectedDay]).map((day) => {
                          const slotEntries = filteredEntries.filter(
                            (e) => e.dayOfWeek === day && e.periodId === period.id
                          );

                          return (
                            <td
                              key={day}
                              className="py-2.5 px-3 border-r border-slate-800/80 last:border-r-0 align-top relative group"
                            >
                              {slotEntries.length > 0 ? (
                                <div className="space-y-1.5">
                                  {slotEntries.map((entry) => (
                                    <div
                                      key={entry.id}
                                      className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 hover:border-indigo-400/60 transition-all shadow-sm group/card relative"
                                    >
                                      {/* Conflict Override Badge */}
                                      {entry.isConflictOverridden && (
                                        <div
                                          className="mb-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-medium border border-amber-500/30"
                                          title={`Conflict Overridden: ${entry.overrideReason || 'Administrative approval'}`}
                                        >
                                          <AlertTriangle className="w-2.5 h-2.5" />
                                          <span>Overridden</span>
                                        </div>
                                      )}

                                      <div className="flex items-start justify-between gap-1">
                                        <h4 className="font-bold text-indigo-200 text-xs leading-snug">
                                          {entry.subjectName}
                                        </h4>

                                        {canManageTimetable && (
                                          <div className="opacity-0 group-hover/card:opacity-100 flex items-center gap-1 transition-opacity">
                                            <button
                                              onClick={() => handleOpenEditModal(entry)}
                                              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-100"
                                              title="Edit session"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleDeleteEntry(entry.id, entry.subjectName)
                                              }
                                              className="p-1 rounded hover:bg-red-900/60 text-slate-400 hover:text-red-300"
                                              title="Delete session"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-300">
                                        <div className="flex items-center gap-1 text-slate-400">
                                          <span className="text-slate-200 font-medium">
                                            {entry.className} ({entry.sectionName})
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1 text-slate-300">
                                          <Users className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                                          <span className="truncate">{entry.teacherName}</span>
                                        </div>

                                        <div className="flex items-center gap-1 text-slate-400">
                                          <Building className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                          <span>{entry.roomName}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="h-full min-h-[54px] flex items-center justify-center rounded-lg border border-dashed border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/30 transition-all p-1 text-slate-600">
                                  {canManageTimetable ? (
                                    <button
                                      onClick={() => handleOpenCreateModal(day, period.id)}
                                      className="opacity-0 group-hover:opacity-100 w-full h-full flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-opacity gap-1"
                                      title="Schedule session"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span className="text-[10px]">Add</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-600 italic">
                                      Free Period
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: TEACHER WORKLOAD & FREE PERIOD ANALYSIS */}
      {activeTab === 'workload' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 font-medium">Total Faculty Analyzed</span>
              <p className="text-2xl font-bold text-slate-100 mt-1">
                {workloadAnalytics.teacherStats.length}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Active teaching staff</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 font-medium">Weekly Capacity Per Teacher</span>
              <p className="text-2xl font-bold text-indigo-400 mt-1">
                {workloadAnalytics.totalPossibleSlotsPerWeek} Slots
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {workloadAnalytics.activePeriodsCount} periods × {workloadAnalytics.workingDaysCount} days
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 font-medium">Average Faculty Utilization</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {Math.round(
                  workloadAnalytics.teacherStats.reduce((acc, t) => acc + t.utilizationRate, 0) /
                    (workloadAnalytics.teacherStats.length || 1)
                )}
                %
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Within balanced guidelines</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 font-medium">Available Free Periods</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {workloadAnalytics.teacherStats.reduce((acc, t) => acc + t.freePeriodsCount, 0)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Slots available for cover/remedial
              </span>
            </div>
          </div>

          {/* Teacher Workload Table */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-200">
                  Faculty Load & Free Period Roster
                </h3>
                <p className="text-xs text-slate-400">
                  Weekly assigned periods vs. preparation periods for each teacher.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3 px-4">Teacher</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Assigned Periods</th>
                    <th className="py-3 px-4 text-center">Free / Prep Periods</th>
                    <th className="py-3 px-4">Workload Distribution</th>
                    <th className="py-3 px-4 text-right">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {workloadAnalytics.teacherStats.map((item) => (
                    <tr key={item.teacherId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-200">{item.teacherName}</td>
                      <td className="py-3 px-4 text-slate-400">{item.department}</td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-400">
                        {item.assignedClassesCount} periods
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">
                        {item.freePeriodsCount} free
                      </td>
                      <td className="py-3 px-4 w-52">
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, item.utilizationRate)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-100">
                        {item.utilizationRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: ROOMS & FACILITIES */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-200">
                Classrooms, Science Labs & Auditoriums
              </h3>
              <p className="text-xs text-slate-400">
                Manage room capacities, maintenance states, and real-time scheduling availability.
              </p>
            </div>

            {canManageRooms && (
              <button
                onClick={() => {
                  setEditingRoom(null);
                  setIsRoomModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Room / Facility</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => {
              const assignedSessions = allEntries.filter(
                (e) => e.roomId === room.id && e.status === 'SCHEDULED'
              ).length;

              return (
                <div
                  key={room.id}
                  className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-5 rounded-xl transition-all shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[11px] font-mono text-indigo-400 font-semibold uppercase">
                          {room.roomNumber}
                        </span>
                        <h4 className="text-base font-bold text-slate-100">{room.name}</h4>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          room.status === 'AVAILABLE'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                            : room.status === 'MAINTENANCE'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                            : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                        }`}
                      >
                        {room.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400 mt-3">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <strong className="text-slate-200">{room.type}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Capacity:</span>
                        <strong className="text-slate-200">{room.capacity} Students</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <strong className="text-slate-200">
                          {room.buildingFloor}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Booked Sessions:</span>
                        <strong className="text-indigo-300">{assignedSessions} periods/wk</strong>
                      </div>
                      {room.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-2 border-t border-slate-800/80 pt-2">
                          Note: {room.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {canManageRooms && (
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={() => {
                          const nextStatus =
                            room.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
                          timetableService.updateRoom(room.id, { status: nextStatus }, currentUser);
                          setActiveTab((p) => p);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        {room.status === 'AVAILABLE' ? 'Set to Maintenance' : 'Set to Available'}
                      </button>

                      <button
                        onClick={() => {
                          setEditingRoom(room);
                          setIsRoomModalOpen(true);
                        }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 4: SUBSTITUTIONS & COVERS */}
      {activeTab === 'substitutions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-200">
                Staff Cover & Substitution Register
              </h3>
              <p className="text-xs text-slate-400">
                Emergency classroom covers when regular teachers are on leave or attending official duty.
              </p>
            </div>

            {canManageTimetable && (
              <button
                onClick={() => {
                  setSubError(null);
                  setIsSubModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Cover Teacher</span>
              </button>
            )}
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Class & Subject</th>
                    <th className="py-3 px-4">Regular Teacher</th>
                    <th className="py-3 px-4">Substitute Teacher</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    {canManageTimetable && <th className="py-3 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {substitutions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">{sub.date}</td>
                      <td className="py-3 px-4 text-indigo-400 font-semibold">{sub.periodName}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{sub.subjectName}</div>
                        <div className="text-[11px] text-slate-400">
                          {sub.className} ({sub.sectionName})
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {sub.originalTeacherName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-medium text-[11px]">
                          <UserCheck className="w-3 h-3" />
                          {sub.substituteTeacherName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{sub.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            sub.status === 'COMPLETED'
                              ? 'bg-slate-800 text-slate-300 border-slate-700'
                              : sub.status === 'ASSIGNED'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                              : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      {canManageTimetable && (
                        <td className="py-3 px-4 text-right">
                          {sub.status === 'ASSIGNED' && (
                            <button
                              onClick={() => {
                                timetableService.updateSubstitutionStatus(
                                  sub.id,
                                  'COMPLETED',
                                  currentUser
                                );
                                setActiveTab((p) => p);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700"
                            >
                              Mark Completed
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {substitutions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No active cover substitutions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: PERIOD CONFIGURATION */}
      {activeTab === 'periods' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-200">
              Daily Periods, Assembly & Break Schedules
            </h3>
            <p className="text-xs text-slate-400">
              Standard bell schedule and operational timetable periods for Academic Term {settings.termName || settings.termId}.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3 px-4">Period Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Start Time</th>
                    <th className="py-3 px-4">End Time</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {periods.map((period) => (
                    <tr key={period.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200">{period.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            period.breakType === 'Regular Period'
                              ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
                              : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          }`}
                        >
                          {period.breakType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{period.startTime}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{period.endTime}</td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-medium">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT SCHEDULE SESSION */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {editingEntry ? 'Edit Scheduled Session' : 'Schedule New Class Session'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure day, period slot, teacher, and facility room.
                </p>
              </div>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="p-5 space-y-4 text-xs">
              {/* Live Conflict Warning Banner */}
              {liveConflict && (
                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Scheduling Conflict Detected</strong>
                      <p className="text-[11px] text-amber-300/90 mt-0.5 leading-relaxed">
                        {liveConflict.message}
                      </p>
                    </div>
                  </div>

                  {liveConflict.canOverride && canOverrideConflict && (
                    <div className="pt-2 border-t border-amber-500/20 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-amber-300">
                        <input
                          type="checkbox"
                          checked={formOverride}
                          onChange={(e) => setFormOverride(e.target.checked)}
                          className="rounded bg-slate-900 border-amber-500/60 text-indigo-600 focus:ring-0"
                        />
                        <span>Override Conflict (Administrative Authorization)</span>
                      </label>

                      {formOverride && (
                        <input
                          type="text"
                          required
                          placeholder="State reason for overriding conflict (e.g. Combined lab session)"
                          value={formOverrideReason}
                          onChange={(e) => setFormOverrideReason(e.target.value)}
                          className="w-full bg-slate-950 border border-amber-500/40 rounded px-2.5 py-1.5 text-xs text-amber-100 placeholder-amber-400/50"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {formError && (
                <div className="p-2.5 rounded bg-rose-950/50 border border-rose-800/60 text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Day of Week</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                  >
                    {workingDays.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Period Slot</label>
                  <select
                    value={formPeriodId}
                    onChange={(e) => setFormPeriodId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                  >
                    {periods
                      .filter((p) => p.breakType === 'Regular Period')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.startTime} - {p.endTime})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Class Grade</label>
                  <select
                    value={formClassId}
                    onChange={(e) => {
                      setFormClassId(e.target.value);
                      const cls = classes.find((c) => c.id === e.target.value);
                      if (cls && cls.sections.length > 0) {
                        setFormSectionId(cls.sections[0].id);
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Section</label>
                  <select
                    value={formSectionId}
                    onChange={(e) => setFormSectionId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                  >
                    {classes
                      .find((c) => c.id === formClassId)
                      ?.sections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={formSubjectName}
                  onChange={(e) => setFormSubjectName(e.target.value)}
                  placeholder="e.g. Advanced Mathematics, Physics Lab"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Faculty Teacher</label>
                  <select
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Room / Facility</label>
                  <select
                    value={formRoomId}
                    onChange={(e) => setFormRoomId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.roomNumber}) - {r.status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={liveConflict !== null && !formOverride}
                  className={`px-4 py-2 rounded-lg font-medium text-white shadow-lg transition-all ${
                    liveConflict !== null && !formOverride
                      ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                  }`}
                >
                  {editingEntry ? 'Update Session' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DUPLICATE DAY SCHEDULE */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Duplicate Schedule</h3>
                <p className="text-xs text-slate-400">
                  Replicate one day's timetable entries to another day.
                </p>
              </div>
              <button
                onClick={() => setIsDuplicateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Source Day</label>
                  <select
                    value={dupFromDay}
                    onChange={(e) => setDupFromDay(e.target.value as DayOfWeek)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                  >
                    {workingDays.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Target Day</label>
                  <select
                    value={dupToDay}
                    onChange={(e) => setDupToDay(e.target.value as DayOfWeek)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200"
                  >
                    {workingDays.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {dupResult && (
                <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 inline mr-1.5" />
                  Successfully replicated <strong>{dupResult.addedCount} sessions</strong>.
                  {dupResult.skippedCount > 0 && (
                    <span className="block text-[11px] text-amber-300 mt-1">
                      Note: {dupResult.skippedCount} sessions skipped due to existing booking
                      conflicts on {dupToDay}.
                    </span>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDuplicateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleRunDuplicate}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium text-white shadow-lg shadow-indigo-600/20"
                >
                  Replicate Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD/EDIT ROOM */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {editingRoom ? 'Edit Facility Room' : 'Add New Room / Laboratory'}
                </h3>
                <p className="text-xs text-slate-400">
                  Define seating capacity, type, and maintenance status.
                </p>
              </div>
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const building = (formData.get('building') as string) || 'Main Building';
                const floor = (formData.get('floor') as string) || '1';
                const roomData = {
                  schoolId: 'SCH-001',
                  name: formData.get('name') as string,
                  roomNumber: formData.get('roomNumber') as string,
                  buildingFloor: `${building} - Floor ${floor}`,
                  capacity: Number(formData.get('capacity')),
                  type: formData.get('type') as any,
                  status: formData.get('status') as any,
                  notes: formData.get('notes') as string,
                };

                if (editingRoom) {
                  timetableService.updateRoom(editingRoom.id, roomData, currentUser);
                } else {
                  timetableService.addRoom(roomData, currentUser);
                }
                setIsRoomModalOpen(false);
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Room Name</label>
                  <input
                    name="name"
                    required
                    defaultValue={editingRoom?.name || 'Science Laboratory 2'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Room Code</label>
                  <input
                    name="roomNumber"
                    required
                    defaultValue={editingRoom?.roomNumber || 'LAB-204'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Building</label>
                  <input
                    name="building"
                    required
                    defaultValue={editingRoom?.building || 'Science Complex'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Floor</label>
                  <input
                    name="floor"
                    type="number"
                    required
                    defaultValue={editingRoom?.floor || 2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Capacity</label>
                  <input
                    name="capacity"
                    type="number"
                    required
                    defaultValue={editingRoom?.capacity || 30}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Room Type</label>
                  <select
                    name="type"
                    defaultValue={editingRoom?.type || 'Laboratory'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="Classroom">Classroom</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Auditorium">Auditorium</option>
                    <option value="Library">Library</option>
                    <option value="Gymnasium">Gymnasium</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={editingRoom?.status || 'AVAILABLE'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Operational Notes</label>
                <input
                  name="notes"
                  defaultValue={editingRoom?.notes || ''}
                  placeholder="e.g. Equipped with 24 microscopes and digital projector"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium text-white shadow-lg shadow-indigo-600/20"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ASSIGN COVER SUBSTITUTION */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Assign Substitute Cover Teacher
                </h3>
                <p className="text-xs text-slate-400">
                  Assign faculty cover with automatic conflict verification.
                </p>
              </div>
              <button
                onClick={() => setIsSubModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubstitution} className="p-5 space-y-3 text-xs">
              {subError && (
                <div className="p-2.5 rounded bg-rose-950/50 border border-rose-800/60 text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{subError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={subDate}
                    onChange={(e) => setSubDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Period Slot</label>
                  <select
                    value={subPeriodId}
                    onChange={(e) => setSubPeriodId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    {periods
                      .filter((p) => p.breakType === 'Regular Period')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Class Cohort</label>
                <select
                  value={subClassId}
                  onChange={(e) => setSubClassId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Original Teacher</label>
                  <select
                    value={subOriginalTeacherId}
                    onChange={(e) => setSubOriginalTeacherId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Substitute Cover</label>
                  <select
                    value={substituteTeacherId}
                    onChange={(e) => setSubstituteTeacherId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Reason for Cover</label>
                <input
                  type="text"
                  required
                  value={subReason}
                  onChange={(e) => setSubReason(e.target.value)}
                  placeholder="e.g. Attending pedagogical seminar, Medical leave"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium text-white shadow-lg shadow-indigo-600/20"
                >
                  Assign & Dispatch Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
