import {
  Room,
  Period,
  TimetableEntry,
  Substitution,
  TimetableSettings,
  TimetableConflict,
  DayOfWeek,
} from '../types/timetable';
import { User } from '../types';
import {
  initialRooms,
  initialPeriods,
  initialTimetableSettings,
  initialTimetableEntries,
  initialSubstitutions,
} from '../data/timetableSeedData';
import { dataService } from './dataService';

const STORAGE_KEYS = {
  ROOMS: 'saia_timetable_rooms',
  PERIODS: 'saia_timetable_periods',
  SETTINGS: 'saia_timetable_settings',
  ENTRIES: 'saia_timetable_entries',
  SUBSTITUTIONS: 'saia_timetable_substitutions',
};

class TimetableService {
  private load<T>(key: string, defaultData: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch {
      // Fallback
    }
    return defaultData;
  }

  private save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignore quota errors
    }
  }

  // --- Audit & Notification Helpers ---
  private logAudit(action: string, details: string, actor?: User): void {
    dataService.logActivity({
      action,
      actor: actor ? actor.name : 'Academic Registrar',
      role: actor ? actor.roleTitle : 'System Administrator',
      details,
      entityType: 'class',
    });
  }

  private dispatchNotification(
    title: string,
    message: string,
    targetRole?: any,
    targetUserId?: string
  ): void {
    dataService.createNotification({
      title,
      message,
      type: 'school_announcement',
      priority: 'high',
      targetRole: targetRole || 'all',
      targetUserId,
      relatedModule: 'timetable',
    });
  }

  // --- Rooms Management ---
  getRooms(schoolId: string = 'SCH-001'): Room[] {
    const rooms = this.load<Room[]>(STORAGE_KEYS.ROOMS, initialRooms);
    return rooms.filter((r) => r.schoolId === schoolId);
  }

  getRoomById(id: string): Room | undefined {
    const rooms = this.getRooms();
    return rooms.find((r) => r.id === id);
  }

  addRoom(roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>, actor?: User): Room {
    const rooms = this.load<Room[]>(STORAGE_KEYS.ROOMS, initialRooms);
    const newRoom: Room = {
      ...roomData,
      id: `RM-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    rooms.push(newRoom);
    this.save(STORAGE_KEYS.ROOMS, rooms);
    this.logAudit('Room Created', `Added room ${newRoom.name} (${newRoom.roomNumber})`, actor);
    return newRoom;
  }

  updateRoom(id: string, updates: Partial<Room>, actor?: User): Room {
    const rooms = this.load<Room[]>(STORAGE_KEYS.ROOMS, initialRooms);
    const index = rooms.findIndex((r) => r.id === id);
    if (index === -1) throw new Error(`Room with ID ${id} not found.`);

    rooms[index] = {
      ...rooms[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save(STORAGE_KEYS.ROOMS, rooms);
    this.logAudit('Room Updated', `Updated room ${rooms[index].name} (${rooms[index].status})`, actor);
    return rooms[index];
  }

  deleteRoom(id: string, actor?: User): void {
    const rooms = this.load<Room[]>(STORAGE_KEYS.ROOMS, initialRooms);
    const room = rooms.find((r) => r.id === id);
    // Check if room is referenced in active timetable
    const entries = this.getTimetableEntries();
    const hasAssignments = entries.some((e) => e.roomId === id && e.status === 'SCHEDULED');
    if (hasAssignments) {
      throw new Error(`Cannot delete room ${room?.name || id}: it has active timetable class sessions.`);
    }

    const filtered = rooms.filter((r) => r.id !== id);
    this.save(STORAGE_KEYS.ROOMS, filtered);
    this.logAudit('Room Deleted', `Deleted room ${room?.name || id}`, actor);
  }

  // --- Period Management ---
  getPeriods(schoolId: string = 'SCH-001'): Period[] {
    const periods = this.load<Period[]>(STORAGE_KEYS.PERIODS, initialPeriods);
    return periods
      .filter((p) => p.schoolId === schoolId)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  getPeriodById(id: string): Period | undefined {
    return this.getPeriods().find((p) => p.id === id);
  }

  addPeriod(periodData: Omit<Period, 'id'>, actor?: User): Period {
    const periods = this.load<Period[]>(STORAGE_KEYS.PERIODS, initialPeriods);
    const newPeriod: Period = {
      ...periodData,
      id: `PER-${Date.now().toString().slice(-4)}`,
    };
    periods.push(newPeriod);
    this.save(STORAGE_KEYS.PERIODS, periods);
    this.logAudit('Period Created', `Created period ${newPeriod.name} (${newPeriod.startTime}-${newPeriod.endTime})`, actor);
    return newPeriod;
  }

  updatePeriod(id: string, updates: Partial<Period>, actor?: User): Period {
    const periods = this.load<Period[]>(STORAGE_KEYS.PERIODS, initialPeriods);
    const idx = periods.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Period ${id} not found.`);

    periods[idx] = { ...periods[idx], ...updates };
    this.save(STORAGE_KEYS.PERIODS, periods);
    this.logAudit('Period Updated', `Updated period ${periods[idx].name}`, actor);
    return periods[idx];
  }

  deletePeriod(id: string, actor?: User): void {
    const periods = this.load<Period[]>(STORAGE_KEYS.PERIODS, initialPeriods);
    const entries = this.getTimetableEntries();
    const hasAssignments = entries.some((e) => e.periodId === id && e.status === 'SCHEDULED');
    if (hasAssignments) {
      throw new Error('Cannot delete period: Active timetable classes are scheduled during this period.');
    }
    const filtered = periods.filter((p) => p.id !== id);
    this.save(STORAGE_KEYS.PERIODS, filtered);
    this.logAudit('Period Deleted', `Deleted period ${id}`, actor);
  }

  // --- Timetable Settings ---
  getSettings(): TimetableSettings {
    return this.load<TimetableSettings>(STORAGE_KEYS.SETTINGS, initialTimetableSettings);
  }

  updateSettings(settings: Partial<TimetableSettings>, actor?: User): TimetableSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.save(STORAGE_KEYS.SETTINGS, updated);
    this.logAudit('Timetable Settings Updated', 'Updated working days and active term configuration', actor);
    return updated;
  }

  // --- Conflict Detection Engine (Critical) ---
  checkConflict(
    entry: {
      id?: string;
      schoolId?: string;
      dayOfWeek: DayOfWeek;
      periodId: string;
      teacherId: string;
      roomId: string;
      classId: string;
      sectionId: string;
      status?: string;
    },
    excludeEntryId?: string
  ): TimetableConflict | null {
    const schoolId = entry.schoolId || 'SCH-001';
    const entries = this.getTimetableEntries(schoolId).filter(
      (e) => e.id !== excludeEntryId && e.status === 'SCHEDULED'
    );

    // 1. Room Availability Status Check
    const room = this.getRoomById(entry.roomId);
    if (room && room.status !== 'AVAILABLE') {
      return {
        type: 'ROOM_AVAILABILITY_CONFLICT',
        message: `Room Conflict: ${room.name} is currently marked as ${room.status} (${room.notes || 'Not available for instruction'}).`,
        canOverride: false,
      };
    }

    // 2. Room Conflict (Is room double-booked during this period on this day?)
    const roomOccupied = entries.find(
      (e) =>
        e.dayOfWeek === entry.dayOfWeek &&
        e.periodId === entry.periodId &&
        e.roomId === entry.roomId
    );
    if (roomOccupied) {
      return {
        type: 'ROOM_CONFLICT',
        message: `Scheduling Conflict: Room ${roomOccupied.roomName} is already assigned to ${roomOccupied.className} (${roomOccupied.sectionName}) for ${roomOccupied.subjectName} during ${entry.dayOfWeek} Period.`,
        conflictingEntry: roomOccupied,
        canOverride: true,
      };
    }

    // 3. Teacher Conflict (Is teacher scheduled for another class during same period & day?)
    const teacherOccupied = entries.find(
      (e) =>
        e.dayOfWeek === entry.dayOfWeek &&
        e.periodId === entry.periodId &&
        e.teacherId === entry.teacherId
    );
    if (teacherOccupied) {
      return {
        type: 'TEACHER_CONFLICT',
        message: `Scheduling Conflict: Teacher ${teacherOccupied.teacherName} is already assigned to ${teacherOccupied.className} (${teacherOccupied.sectionName}) during ${entry.dayOfWeek} Period.`,
        conflictingEntry: teacherOccupied,
        canOverride: true,
      };
    }

    // 4. Class / Section Conflict (Is class/section already having another subject during same period & day?)
    const classOccupied = entries.find(
      (e) =>
        e.dayOfWeek === entry.dayOfWeek &&
        e.periodId === entry.periodId &&
        e.classId === entry.classId &&
        e.sectionId === entry.sectionId
    );
    if (classOccupied) {
      return {
        type: 'CLASS_SECTION_CONFLICT',
        message: `Scheduling Conflict: ${classOccupied.className} (${classOccupied.sectionName}) already has ${classOccupied.subjectName} scheduled during this period.`,
        conflictingEntry: classOccupied,
        canOverride: false,
      };
    }

    return null;
  }

  // --- Timetable Entries CRUD ---
  getTimetableEntries(schoolId: string = 'SCH-001'): TimetableEntry[] {
    const entries = this.load<TimetableEntry[]>(STORAGE_KEYS.ENTRIES, initialTimetableEntries);
    return entries.filter((e) => e.schoolId === schoolId);
  }

  getTeacherTimetable(teacherId: string, dayOfWeek?: DayOfWeek): TimetableEntry[] {
    const entries = this.getTimetableEntries().filter(
      (e) => e.teacherId === teacherId && e.status === 'SCHEDULED'
    );
    if (dayOfWeek) {
      return entries.filter((e) => e.dayOfWeek === dayOfWeek);
    }
    return entries;
  }

  getClassTimetable(classId: string, sectionId?: string, dayOfWeek?: DayOfWeek): TimetableEntry[] {
    const entries = this.getTimetableEntries().filter(
      (e) => e.classId === classId && (!sectionId || e.sectionId === sectionId) && e.status === 'SCHEDULED'
    );
    if (dayOfWeek) {
      return entries.filter((e) => e.dayOfWeek === dayOfWeek);
    }
    return entries;
  }

  addTimetableEntry(
    entryData: Omit<TimetableEntry, 'id' | 'createdAt' | 'updatedAt'>,
    actor?: User,
    overrideConflict: boolean = false,
    overrideReason?: string
  ): TimetableEntry {
    const conflict = this.checkConflict(entryData);
    if (conflict) {
      if (!overrideConflict) {
        throw new Error(conflict.message);
      }
      if (!conflict.canOverride) {
        throw new Error(`Cannot override this critical scheduling conflict: ${conflict.message}`);
      }
    }

    const entries = this.load<TimetableEntry[]>(STORAGE_KEYS.ENTRIES, initialTimetableEntries);
    const newEntry: TimetableEntry = {
      ...entryData,
      id: `TT-${Date.now().toString().slice(-4)}`,
      isConflictOverridden: overrideConflict,
      overrideReason: overrideConflict ? overrideReason : undefined,
      overrideBy: overrideConflict ? (actor ? actor.name : 'Administrator') : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: actor?.name,
      updatedBy: actor?.name,
    };

    entries.push(newEntry);
    this.save(STORAGE_KEYS.ENTRIES, entries);

    this.logAudit(
      'Timetable Entry Created',
      `Assigned ${newEntry.subjectName} (${newEntry.className} ${newEntry.sectionName}) to ${newEntry.teacherName} in ${newEntry.roomName} on ${newEntry.dayOfWeek} Period ${newEntry.periodId}${
        overrideConflict ? ` [CONFLICT OVERRIDDEN: ${overrideReason}]` : ''
      }`,
      actor
    );

    this.dispatchNotification(
      'Timetable Schedule Updated',
      `New schedule: ${newEntry.subjectName} for ${newEntry.className} on ${newEntry.dayOfWeek} with ${newEntry.teacherName}.`,
      'teacher'
    );

    return newEntry;
  }

  updateTimetableEntry(
    id: string,
    updates: Partial<TimetableEntry>,
    actor?: User,
    overrideConflict: boolean = false,
    overrideReason?: string
  ): TimetableEntry {
    const entries = this.load<TimetableEntry[]>(STORAGE_KEYS.ENTRIES, initialTimetableEntries);
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`Timetable entry ${id} not found.`);

    const merged = { ...entries[idx], ...updates };
    const conflict = this.checkConflict(merged, id);
    if (conflict) {
      if (!overrideConflict) {
        throw new Error(conflict.message);
      }
      if (!conflict.canOverride) {
        throw new Error(`Cannot override conflict: ${conflict.message}`);
      }
    }

    entries[idx] = {
      ...merged,
      isConflictOverridden: overrideConflict,
      overrideReason: overrideConflict ? overrideReason : entries[idx].overrideReason,
      overrideBy: overrideConflict ? actor?.name : entries[idx].overrideBy,
      updatedAt: new Date().toISOString(),
      updatedBy: actor?.name,
    };

    this.save(STORAGE_KEYS.ENTRIES, entries);
    this.logAudit(
      'Timetable Entry Updated',
      `Updated timetable session ${entries[idx].subjectName} for ${entries[idx].className}`,
      actor
    );
    return entries[idx];
  }

  deleteTimetableEntry(id: string, actor?: User): void {
    const entries = this.load<TimetableEntry[]>(STORAGE_KEYS.ENTRIES, initialTimetableEntries);
    const entry = entries.find((e) => e.id === id);
    const filtered = entries.filter((e) => e.id !== id);
    this.save(STORAGE_KEYS.ENTRIES, filtered);
    this.logAudit(
      'Timetable Entry Deleted',
      `Removed ${entry?.subjectName || id} for ${entry?.className || ''} on ${entry?.dayOfWeek || ''}`,
      actor
    );
  }

  // Duplicate entire day's entries from one day to another
  duplicateDaySchedule(
    fromDay: DayOfWeek,
    toDay: DayOfWeek,
    classId?: string,
    actor?: User
  ): { addedCount: number; skippedCount: number } {
    const entries = this.load<TimetableEntry[]>(STORAGE_KEYS.ENTRIES, initialTimetableEntries);
    const sourceEntries = entries.filter(
      (e) => e.dayOfWeek === fromDay && (!classId || e.classId === classId) && e.status === 'SCHEDULED'
    );

    let addedCount = 0;
    let skippedCount = 0;

    sourceEntries.forEach((src) => {
      const candidate = {
        ...src,
        dayOfWeek: toDay,
      };
      const conflict = this.checkConflict(candidate);
      if (!conflict) {
        const newEntry: TimetableEntry = {
          ...src,
          id: `TT-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(2, 5)}`,
          dayOfWeek: toDay,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: actor?.name,
        };
        entries.push(newEntry);
        addedCount++;
      } else {
        skippedCount++;
      }
    });

    if (addedCount > 0) {
      this.save(STORAGE_KEYS.ENTRIES, entries);
      this.logAudit(
        'Schedule Duplicated',
        `Duplicated ${addedCount} timetable entries from ${fromDay} to ${toDay}`,
        actor
      );
    }

    return { addedCount, skippedCount };
  }

  // --- Free Period & Workload Analytics ---
  getFreePeriodAnalytics() {
    const entries = this.getTimetableEntries();
    const periods = this.getPeriods().filter((p) => p.breakType === 'Regular Period' && p.isActive);
    const teachers = dataService.getTeachers();
    const classes = dataService.getClasses();
    const rooms = this.getRooms();
    const settings = this.getSettings();
    const workingDays = settings.workingDays;

    const totalPossibleSlotsPerWeek = workingDays.length * periods.length;

    // Teacher Workload & Free Periods
    const teacherStats = teachers.map((t) => {
      const teacherEntries = entries.filter((e) => e.teacherId === t.id && e.status === 'SCHEDULED');
      const assignedPeriodsCount = teacherEntries.length;
      const freePeriodsCount = Math.max(0, totalPossibleSlotsPerWeek - assignedPeriodsCount);
      const utilizationRate = Math.round((assignedPeriodsCount / (totalPossibleSlotsPerWeek || 1)) * 100);

      return {
        teacherId: t.id,
        teacherName: t.name,
        department: t.department,
        assignedClassesCount: assignedPeriodsCount,
        freePeriodsCount,
        utilizationRate,
      };
    });

    // Class Free Periods
    const classStats = classes.map((c) => {
      const classEntries = entries.filter((e) => e.classId === c.id && e.status === 'SCHEDULED');
      const assignedCount = classEntries.length;
      const freePeriodsCount = Math.max(0, totalPossibleSlotsPerWeek - assignedCount);

      return {
        classId: c.id,
        className: c.name,
        assignedPeriodsCount: assignedCount,
        freePeriodsCount,
      };
    });

    // Room Utilization
    const roomStats = rooms.map((r) => {
      const roomEntries = entries.filter((e) => e.roomId === r.id && e.status === 'SCHEDULED');
      const utilizationRate = Math.round((roomEntries.length / (totalPossibleSlotsPerWeek || 1)) * 100);
      return {
        roomId: r.id,
        roomName: r.name,
        type: r.type,
        capacity: r.capacity,
        status: r.status,
        bookedPeriodsCount: roomEntries.length,
        utilizationRate,
      };
    });

    return {
      teacherStats,
      classStats,
      roomStats,
      totalPossibleSlotsPerWeek,
      activePeriodsCount: periods.length,
      workingDaysCount: workingDays.length,
    };
  }

  // --- Substitutions Management ---
  getSubstitutions(schoolId: string = 'SCH-001'): Substitution[] {
    const subs = this.load<Substitution[]>(STORAGE_KEYS.SUBSTITUTIONS, initialSubstitutions);
    return subs.filter((s) => s.schoolId === schoolId);
  }

  createSubstitution(
    subData: Omit<Substitution, 'id' | 'createdAt' | 'updatedAt'>,
    actor?: User
  ): Substitution {
    // Check if substitute teacher has a conflict during this period and day
    const entries = this.getTimetableEntries();
    const dateObj = new Date(subData.date);
    const days: DayOfWeek[] = ['Sunday' as any, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[dateObj.getDay()];

    const subOccupied = entries.find(
      (e) =>
        e.dayOfWeek === dayOfWeek &&
        e.periodId === subData.periodId &&
        e.teacherId === subData.substituteTeacherId &&
        e.status === 'SCHEDULED'
    );

    if (subOccupied) {
      throw new Error(
        `Substitute Conflict: Teacher ${subData.substituteTeacherName} already has ${subOccupied.subjectName} with ${subOccupied.className} scheduled at this time.`
      );
    }

    const subs = this.load<Substitution[]>(STORAGE_KEYS.SUBSTITUTIONS, initialSubstitutions);
    const newSub: Substitution = {
      ...subData,
      id: `SUBST-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    subs.unshift(newSub);
    this.save(STORAGE_KEYS.SUBSTITUTIONS, subs);

    this.logAudit(
      'Substitution Created',
      `Cover teacher ${newSub.substituteTeacherName} assigned for ${newSub.originalTeacherName} (${newSub.className} ${newSub.subjectName} on ${newSub.date})`,
      actor
    );

    this.dispatchNotification(
      'Substitute Teaching Assigned',
      `You have been assigned to cover ${newSub.className} (${newSub.subjectName}) for ${newSub.originalTeacherName} on ${newSub.date}.`,
      'teacher',
      newSub.substituteTeacherId
    );

    return newSub;
  }

  updateSubstitutionStatus(
    id: string,
    status: Substitution['status'],
    actor?: User
  ): Substitution {
    const subs = this.load<Substitution[]>(STORAGE_KEYS.SUBSTITUTIONS, initialSubstitutions);
    const idx = subs.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Substitution ${id} not found.`);

    subs[idx].status = status;
    subs[idx].updatedAt = new Date().toISOString();
    this.save(STORAGE_KEYS.SUBSTITUTIONS, subs);

    this.logAudit(
      'Substitution Status Changed',
      `Substitution ${id} changed to ${status}`,
      actor
    );

    return subs[idx];
  }
}

export const timetableService = new TimetableService();
