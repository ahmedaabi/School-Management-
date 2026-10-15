export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export type RoomType =
  | 'Classroom'
  | 'Laboratory'
  | 'Computer Lab'
  | 'Library'
  | 'Auditorium'
  | 'Sports Area'
  | 'Other';

export type RoomStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE';

export interface Room {
  id: string;
  schoolId: string;
  name: string;
  roomNumber: string;
  type: RoomType;
  capacity: number;
  buildingFloor: string;
  status: RoomStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PeriodBreakType =
  | 'Morning Assembly'
  | 'Regular Period'
  | 'Short Break'
  | 'Lunch Break'
  | 'Free Period'
  | 'Other';

export interface Period {
  id: string;
  schoolId: string;
  periodNumber: number;
  name: string;
  startTime: string; // "08:00"
  endTime: string; // "08:45"
  breakType: PeriodBreakType;
  duration: number; // in minutes
  isActive: boolean;
}

export type TimetableEntryStatus = 'SCHEDULED' | 'CANCELLED' | 'SUBSTITUTED';

export interface TimetableEntry {
  id: string;
  schoolId: string;
  academicYearId: string;
  termId: string;
  dayOfWeek: DayOfWeek;
  periodId: string;
  startTime: string;
  endTime: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  roomId: string;
  roomName: string;
  status: TimetableEntryStatus;
  notes?: string;
  isConflictOverridden?: boolean;
  overrideReason?: string;
  overrideBy?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export type TimetableConflictType =
  | 'TEACHER_CONFLICT'
  | 'ROOM_CONFLICT'
  | 'CLASS_SECTION_CONFLICT'
  | 'PERIOD_CONFLICT'
  | 'TEACHER_AVAILABILITY_CONFLICT'
  | 'ROOM_AVAILABILITY_CONFLICT';

export interface TimetableConflict {
  type: TimetableConflictType;
  message: string;
  conflictingEntry?: TimetableEntry;
  canOverride: boolean;
}

export type SubstitutionStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Substitution {
  id: string;
  schoolId: string;
  originalTeacherId: string;
  originalTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  date: string; // YYYY-MM-DD
  periodId: string;
  periodName: string;
  startTime?: string;
  endTime?: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  roomId: string;
  roomName: string;
  reason: string;
  notes?: string;
  status: SubstitutionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableSettings {
  workingDays: DayOfWeek[];
  academicYearId: string;
  academicYearName: string;
  termId: string;
  termName: string;
  allowConflictOverride: boolean;
}
