import {
  Exam,
  ExamStatus,
  ExamScheduleItem,
  ExamMarksBatch,
  MarksSubmissionStatus,
  GradeRule,
  ResultCalculationSettings,
  CalculatedSubjectResult,
  StudentCalculatedResult,
  ReportCardData,
  ExamAuditLog,
  ExamAnalytics,
} from '../types/exam';
import { User, Student } from '../types';
import { dataService } from './dataService';
import {
  initialExams,
  initialExamSchedules,
  initialMarksBatches,
  initialGradeRules,
  initialResultSettings,
  initialExamAuditLogs,
} from '../data/examSeedData';

const STORAGE_KEYS = {
  EXAMS: 'saia_exams_data',
  SCHEDULES: 'saia_exam_schedules',
  MARKS_BATCHES: 'saia_exam_marks_batches',
  GRADE_RULES: 'saia_exam_grade_rules',
  RESULT_SETTINGS: 'saia_exam_result_settings',
  AUDIT_LOGS: 'saia_exam_audit_logs',
};

class ExamService {
  private load<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // LocalStorage fallback
    }
    return fallback;
  }

  private save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Quota limit fallback
    }
  }

  // ==========================================
  // 1. AUDIT LOGGING & NOTIFICATIONS
  // ==========================================

  getAuditLogs(examId?: string): ExamAuditLog[] {
    const logs = this.load<ExamAuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialExamAuditLogs);
    if (!examId) return logs;
    return logs.filter((l) => l.examId === examId);
  }

  logAudit(entry: Omit<ExamAuditLog, 'id' | 'timestamp'>): ExamAuditLog {
    const logs = this.getAuditLogs();
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newLog: ExamAuditLog = {
      ...entry,
      id: `EAUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
    };

    this.save(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);

    // Also mirror to global system activity log
    dataService.logActivity({
      action: entry.action.replace(/_/g, ' '),
      actor: entry.actorName,
      role: entry.actorRole,
      details: entry.details,
      entityType: 'exam',
    });

    return newLog;
  }

  // ==========================================
  // 2. EXAM MANAGEMENT CRUD
  // ==========================================

  getExams(): Exam[] {
    return this.load<Exam[]>(STORAGE_KEYS.EXAMS, initialExams);
  }

  getExamById(id: string): Exam | undefined {
    return this.getExams().find((e) => e.id === id);
  }

  saveExam(
    examData: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    actor?: User
  ): Exam {
    const exams = this.getExams();
    const now = new Date().toISOString().split('T')[0];
    const isEdit = Boolean(examData.id);

    let savedExam: Exam;
    if (isEdit) {
      const idx = exams.findIndex((e) => e.id === examData.id);
      const existing = exams[idx];
      savedExam = {
        ...existing,
        ...examData,
        id: existing.id,
        updatedAt: now,
      };
      exams[idx] = savedExam;

      this.logAudit({
        examId: savedExam.id,
        examName: savedExam.name,
        action: 'EXAM_EDITED',
        actorName: actor?.name || 'Academic Administrator',
        actorRole: actor?.roleTitle || actor?.role || 'Admin',
        details: `Updated exam properties for "${savedExam.name}".`,
      });
    } else {
      savedExam = {
        ...examData,
        id: `EXAM-${new Date().getFullYear()}-${String(exams.length + 1).padStart(2, '0')}`,
        createdAt: now,
        updatedAt: now,
      };
      exams.unshift(savedExam);

      this.logAudit({
        examId: savedExam.id,
        examName: savedExam.name,
        action: 'EXAM_CREATED',
        actorName: actor?.name || 'Academic Administrator',
        actorRole: actor?.roleTitle || actor?.role || 'Admin',
        details: `Created new examination "${savedExam.name}" (${savedExam.examType}) for Academic Year ${savedExam.academicYear}.`,
      });

      // Automation: notify staff of exam creation
      dataService.createNotification({
        title: 'New Examination Scheduled',
        message: `${savedExam.name} has been initiated for ${savedExam.academicYear}. Timetable and subject schedules can now be populated.`,
        type: 'exam_announcement',
        priority: 'normal',
        targetRole: 'all',
        relatedModule: 'exams',
        relatedRecordId: savedExam.id,
      });
    }

    this.save(STORAGE_KEYS.EXAMS, exams);
    return savedExam;
  }

  deleteExam(id: string, actor?: User): boolean {
    const exams = this.getExams();
    const target = exams.find((e) => e.id === id);
    if (!target) return false;

    const filtered = exams.filter((e) => e.id !== id);
    this.save(STORAGE_KEYS.EXAMS, filtered);

    this.logAudit({
      examId: target.id,
      examName: target.name,
      action: 'EXAM_STATUS_CHANGED',
      actorName: actor?.name || 'Administrator',
      actorRole: actor?.role || 'Admin',
      details: `Archived/Removed exam "${target.name}".`,
    });

    return true;
  }

  updateExamStatus(id: string, status: ExamStatus, actor?: User): Exam | undefined {
    const exams = this.getExams();
    const idx = exams.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;

    const prevStatus = exams[idx].status;
    exams[idx].status = status;
    exams[idx].updatedAt = new Date().toISOString().split('T')[0];

    if (status === 'PUBLISHED') {
      exams[idx].publishedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      exams[idx].publishedBy = actor?.name || 'Principal';
    }

    this.save(STORAGE_KEYS.EXAMS, exams);

    this.logAudit({
      examId: exams[idx].id,
      examName: exams[idx].name,
      action: 'EXAM_STATUS_CHANGED',
      actorName: actor?.name || 'Principal',
      actorRole: actor?.role || 'Admin',
      details: `Changed status from ${prevStatus} to ${status}.`,
      previousValue: prevStatus,
      newValue: status,
    });

    return exams[idx];
  }

  // ==========================================
  // 3. EXAM SCHEDULES & DATE SHEET
  // ==========================================

  getSchedules(filter?: {
    examId?: string;
    classId?: string;
    sectionId?: string;
    date?: string;
  }): ExamScheduleItem[] {
    let list = this.load<ExamScheduleItem[]>(STORAGE_KEYS.SCHEDULES, initialExamSchedules);
    if (filter) {
      if (filter.examId) list = list.filter((s) => s.examId === filter.examId);
      if (filter.classId) list = list.filter((s) => s.classId === filter.classId);
      if (filter.sectionId) list = list.filter((s) => s.sectionId === filter.sectionId);
      if (filter.date) list = list.filter((s) => s.examDate === filter.date);
    }
    return list;
  }

  validateScheduleConflict(item: Omit<ExamScheduleItem, 'id'>, excludeId?: string): {
    valid: boolean;
    error?: string;
  } {
    const schedules = this.getSchedules();

    // Check room conflict
    const roomConflict = schedules.find(
      (s) =>
        s.id !== excludeId &&
        s.examDate === item.examDate &&
        s.room.trim().toLowerCase() === item.room.trim().toLowerCase() &&
        s.startTime === item.startTime
    );
    if (roomConflict) {
      return {
        valid: false,
        error: `Room conflict: "${item.room}" is already allocated on ${item.examDate} at ${item.startTime} for ${roomConflict.className} (${roomConflict.subjectName}).`,
      };
    }

    // Check class/section conflict (same class taking 2 exams at the exact same time)
    const classConflict = schedules.find(
      (s) =>
        s.id !== excludeId &&
        s.examDate === item.examDate &&
        s.classId === item.classId &&
        s.sectionId === item.sectionId &&
        s.startTime === item.startTime
    );
    if (classConflict) {
      return {
        valid: false,
        error: `Schedule conflict: ${item.className} - ${item.sectionName} already has an exam (${classConflict.subjectName}) on ${item.examDate} at ${item.startTime}.`,
      };
    }

    return { valid: true };
  }

  saveSchedule(
    itemData: Omit<ExamScheduleItem, 'id'> & { id?: string },
    actor?: User
  ): { success: boolean; schedule?: ExamScheduleItem; error?: string } {
    const validation = this.validateScheduleConflict(itemData, itemData.id);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const schedules = this.getSchedules();
    const isEdit = Boolean(itemData.id);

    let savedSchedule: ExamScheduleItem;
    if (isEdit) {
      const idx = schedules.findIndex((s) => s.id === itemData.id);
      savedSchedule = {
        ...schedules[idx],
        ...itemData,
        id: schedules[idx].id,
      };
      schedules[idx] = savedSchedule;

      this.logAudit({
        examId: savedSchedule.examId,
        examName: savedSchedule.examName,
        action: 'SCHEDULE_MODIFIED',
        actorName: actor?.name || 'Administrator',
        actorRole: actor?.role || 'Admin',
        details: `Updated schedule for ${savedSchedule.subjectName} (${savedSchedule.className}) on ${savedSchedule.examDate}.`,
      });
    } else {
      savedSchedule = {
        ...itemData,
        id: `SCH-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      };
      schedules.push(savedSchedule);

      this.logAudit({
        examId: savedSchedule.examId,
        examName: savedSchedule.examName,
        action: 'SCHEDULE_CREATED',
        actorName: actor?.name || 'Administrator',
        actorRole: actor?.role || 'Admin',
        details: `Created schedule for ${savedSchedule.subjectName} (${savedSchedule.className} - ${savedSchedule.sectionName}) on ${savedSchedule.examDate} in ${savedSchedule.room}.`,
      });

      // Automation notification on schedule creation
      dataService.createNotification({
        title: 'Exam Date Sheet Update',
        message: `${savedSchedule.subjectName} exam for ${savedSchedule.className} scheduled on ${savedSchedule.examDate} (${savedSchedule.startTime}).`,
        type: 'exam_announcement',
        priority: 'normal',
        targetRole: 'all',
        relatedModule: 'exams',
      });
    }

    this.save(STORAGE_KEYS.SCHEDULES, schedules);
    return { success: true, schedule: savedSchedule };
  }

  deleteSchedule(id: string, actor?: User): boolean {
    const schedules = this.getSchedules();
    const target = schedules.find((s) => s.id === id);
    if (!target) return false;

    const filtered = schedules.filter((s) => s.id !== id);
    this.save(STORAGE_KEYS.SCHEDULES, filtered);

    this.logAudit({
      examId: target.examId,
      examName: target.examName,
      action: 'SCHEDULE_DELETED',
      actorName: actor?.name || 'Administrator',
      actorRole: actor?.role || 'Admin',
      details: `Removed schedule entry for ${target.subjectName} on ${target.examDate}.`,
    });

    return true;
  }

  // ==========================================
  // 4. MARKS BATCHES & VALIDATION
  // ==========================================

  getMarksBatches(filter?: {
    examId?: string;
    classId?: string;
    sectionId?: string;
    subjectId?: string;
    teacherId?: string;
    status?: MarksSubmissionStatus;
  }): ExamMarksBatch[] {
    let list = this.load<ExamMarksBatch[]>(STORAGE_KEYS.MARKS_BATCHES, initialMarksBatches);
    if (filter) {
      if (filter.examId) list = list.filter((b) => b.examId === filter.examId);
      if (filter.classId) list = list.filter((b) => b.classId === filter.classId);
      if (filter.sectionId) list = list.filter((b) => b.sectionId === filter.sectionId);
      if (filter.subjectId) list = list.filter((b) => b.subjectId === filter.subjectId);
      if (filter.teacherId) list = list.filter((b) => b.teacherId === filter.teacherId);
      if (filter.status) list = list.filter((b) => b.status === filter.status);
    }
    return list;
  }

  getMarksBatch(
    examId: string,
    classId: string,
    sectionId: string,
    subjectId: string
  ): ExamMarksBatch | undefined {
    const list = this.getMarksBatches();
    return list.find(
      (b) =>
        b.examId === examId &&
        b.classId === classId &&
        b.sectionId === sectionId &&
        b.subjectId === subjectId
    );
  }

  getOrCreateMarksBatch(
    examId: string,
    classId: string,
    sectionId: string,
    subjectId: string,
    currentTeacher?: User
  ): ExamMarksBatch {
    const existing = this.getMarksBatch(examId, classId, sectionId, subjectId);
    if (existing) return existing;

    const exams = this.getExams();
    const exam = exams.find((e) => e.id === examId);
    const classes = dataService.getClasses();
    const cls = classes.find((c) => c.id === classId);
    const sec = cls?.sections.find((s) => s.id === sectionId);
    const schedule = this.getSchedules({ examId, classId, sectionId }).find(
      (s) => s.subjectId === subjectId
    );

    // Get students in this class/section
    const allStudents = dataService.getStudents();
    const enrolledStudents = allStudents.filter(
      (s) =>
        (s.classId === classId || s.className === cls?.name) &&
        (s.sectionId === sectionId || s.sectionName === sec?.name)
    );

    const records = enrolledStudents.map((s) => ({
      studentId: s.studentId,
      studentName: `${s.firstName} ${s.lastName}`,
      rollNumber: s.rollNumber || '01',
      marksObtained: null,
      isAbsent: false,
      remarks: '',
    }));

    const newBatch: ExamMarksBatch = {
      id: `BATCH-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      examId,
      examName: exam?.name || 'Examination',
      classId,
      className: cls?.name || 'Class',
      sectionId,
      sectionName: sec?.name || 'Section A',
      subjectId,
      subjectName: schedule?.subjectName || 'Subject',
      totalMarks: schedule?.totalMarks || 100,
      passingMarks: schedule?.passingMarks || 40,
      teacherId: currentTeacher?.teacherId || 'TCH-001',
      teacherName: currentTeacher?.name || 'Arthur Pendelton',
      status: 'DRAFT',
      records,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const batches = this.getMarksBatches();
    batches.push(newBatch);
    this.save(STORAGE_KEYS.MARKS_BATCHES, batches);
    return newBatch;
  }

  validateMarksRecords(
    records: ExamMarksBatch['records'],
    totalMarks: number,
    requireComplete: boolean = false
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    records.forEach((r) => {
      if (r.isAbsent) {
        if (r.marksObtained !== null && r.marksObtained !== undefined) {
          errors.push(
            `Student "${r.studentName}" is marked Absent and cannot have a numeric score.`
          );
        }
      } else {
        if (r.marksObtained !== null && r.marksObtained !== undefined) {
          if (isNaN(r.marksObtained)) {
            errors.push(`Student "${r.studentName}" has an invalid non-numeric score.`);
          } else if (r.marksObtained < 0) {
            errors.push(`Student "${r.studentName}" cannot have negative marks (${r.marksObtained}).`);
          } else if (r.marksObtained > totalMarks) {
            errors.push(
              `Student "${r.studentName}" marks (${r.marksObtained}) exceed maximum total marks (${totalMarks}).`
            );
          }
        } else if (requireComplete) {
          errors.push(
            `Student "${r.studentName}" is missing obtained marks. Enter score or mark Absent.`
          );
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  saveMarksDraft(
    batchId: string,
    records: ExamMarksBatch['records'],
    actor?: User
  ): { success: boolean; errors?: string[] } {
    const batches = this.getMarksBatches();
    const idx = batches.findIndex((b) => b.id === batchId);
    if (idx === -1) return { success: false, errors: ['Batch not found'] };

    const batch = batches[idx];
    // If already submitted/published, prevent modification unless authorized
    if (batch.status === 'SUBMITTED' || batch.status === 'PUBLISHED' || batch.status === 'VERIFIED') {
      if (actor && actor.role !== 'super_admin' && actor.role !== 'principal') {
        return {
          success: false,
          errors: ['Submitted or verified marks cannot be edited. Request administrator to reopen.'],
        };
      }
    }

    // Soft validate (allow incomplete drafts)
    const val = this.validateMarksRecords(records, batch.totalMarks, false);
    if (!val.valid) {
      return { success: false, errors: val.errors };
    }

    batch.records = records;
    batch.updatedAt = new Date().toISOString().split('T')[0];
    this.save(STORAGE_KEYS.MARKS_BATCHES, batches);

    this.logAudit({
      examId: batch.examId,
      examName: batch.examName,
      action: 'MARKS_DRAFT_SAVED',
      actorName: actor?.name || 'Faculty Member',
      actorRole: actor?.role || 'Teacher',
      details: `Saved draft marks for ${batch.subjectName} (${batch.className} - ${batch.sectionName}).`,
    });

    return { success: true };
  }

  submitMarksBatch(
    batchId: string,
    records: ExamMarksBatch['records'],
    actor?: User
  ): { success: boolean; errors?: string[] } {
    const batches = this.getMarksBatches();
    const idx = batches.findIndex((b) => b.id === batchId);
    if (idx === -1) return { success: false, errors: ['Marks batch not found'] };

    const batch = batches[idx];
    const val = this.validateMarksRecords(records, batch.totalMarks, true);
    if (!val.valid) {
      return { success: false, errors: val.errors };
    }

    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    batch.records = records;
    batch.status = 'SUBMITTED';
    batch.submittedAt = timestamp;
    batch.submittedBy = actor?.name || batch.teacherName;
    batch.updatedAt = now.toISOString().split('T')[0];

    this.save(STORAGE_KEYS.MARKS_BATCHES, batches);

    this.logAudit({
      examId: batch.examId,
      examName: batch.examName,
      action: 'MARKS_SUBMITTED',
      actorName: batch.submittedBy,
      actorRole: actor?.role || 'Teacher',
      details: `Submitted marks for ${batch.subjectName} (${batch.className} - ${batch.sectionName}) for admin review.`,
    });

    // Automation: Alert Principal and Admins
    dataService.createNotification({
      title: 'Marks Batch Submitted for Verification',
      message: `${batch.submittedBy} submitted ${batch.subjectName} marks for ${batch.className} - ${batch.sectionName}. Awaiting administrative approval.`,
      type: 'exam_announcement',
      priority: 'high',
      targetRole: 'principal',
      relatedModule: 'exams',
    });

    return { success: true };
  }

  verifyMarksBatch(
    batchId: string,
    action: 'VERIFY' | 'RETURN',
    comments?: string,
    actor?: User
  ): { success: boolean; error?: string } {
    const batches = this.getMarksBatches();
    const idx = batches.findIndex((b) => b.id === batchId);
    if (idx === -1) return { success: false, error: 'Batch not found' };

    const batch = batches[idx];
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    if (action === 'VERIFY') {
      batch.status = 'VERIFIED';
      batch.reviewedBy = actor?.name || 'Principal';
      batch.reviewedAt = timestamp;
      batch.reviewComments = comments || 'Approved marks verification.';

      this.logAudit({
        examId: batch.examId,
        examName: batch.examName,
        action: 'MARKS_VERIFIED',
        actorName: batch.reviewedBy,
        actorRole: actor?.role || 'Principal',
        details: `Approved & verified ${batch.subjectName} marks for ${batch.className} - ${batch.sectionName}.`,
      });

      // Notify teacher
      dataService.createNotification({
        title: 'Marks Verification Approved',
        message: `Your submitted marks for ${batch.subjectName} (${batch.className} - ${batch.sectionName}) have been approved by ${batch.reviewedBy}.`,
        type: 'exam_announcement',
        priority: 'normal',
        targetRole: 'teacher',
        relatedModule: 'exams',
      });
    } else {
      batch.status = 'RETURNED';
      batch.reviewedBy = actor?.name || 'Principal';
      batch.reviewedAt = timestamp;
      batch.reviewComments = comments || 'Please review and correct entered scores.';

      this.logAudit({
        examId: batch.examId,
        examName: batch.examName,
        action: 'MARKS_RETURNED',
        actorName: batch.reviewedBy,
        actorRole: actor?.role || 'Principal',
        details: `Returned marks for ${batch.subjectName} with comment: "${comments}".`,
      });

      // Notify teacher with correction reason
      dataService.createNotification({
        title: 'Marks Batch Returned for Correction',
        message: `${batch.reviewedBy} returned ${batch.subjectName} marks: "${comments || 'Please recheck scores'}".`,
        type: 'exam_announcement',
        priority: 'urgent',
        targetRole: 'teacher',
        relatedModule: 'exams',
      });
    }

    this.save(STORAGE_KEYS.MARKS_BATCHES, batches);
    return { success: true };
  }

  // ==========================================
  // 5. GRADING SYSTEM & SETTINGS
  // ==========================================

  getGradeRules(): GradeRule[] {
    return this.load<GradeRule[]>(STORAGE_KEYS.GRADE_RULES, initialGradeRules);
  }

  saveGradeRule(rule: GradeRule, actor?: User): GradeRule[] {
    const rules = this.getGradeRules();
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx !== -1) {
      rules[idx] = rule;
    } else {
      rules.push(rule);
    }
    // Sort descending by minPercentage
    rules.sort((a, b) => b.minPercentage - a.minPercentage);
    this.save(STORAGE_KEYS.GRADE_RULES, rules);

    this.logAudit({
      action: 'GRADING_RULES_UPDATED',
      actorName: actor?.name || 'Principal',
      actorRole: actor?.role || 'Admin',
      details: `Updated grading rule for grade "${rule.grade}" (${rule.minPercentage}% - ${rule.maxPercentage}%).`,
    });

    return rules;
  }

  saveGradeRules(rules: GradeRule[], actor?: User): GradeRule[] {
    const sorted = [...rules].sort((a, b) => b.minPercentage - a.minPercentage);
    this.save(STORAGE_KEYS.GRADE_RULES, sorted);
    this.logAudit({
      action: 'GRADING_RULES_UPDATED',
      actorName: actor?.name || 'Principal',
      actorRole: actor?.role || 'Admin',
      details: `Updated bulk grading scale configuration (${sorted.length} grade bands).`,
    });
    return sorted;
  }

  deleteGradeRule(id: string, actor?: User): GradeRule[] {
    const rules = this.getGradeRules();
    const filtered = rules.filter((r) => r.id !== id);
    this.save(STORAGE_KEYS.GRADE_RULES, filtered);

    this.logAudit({
      action: 'GRADING_RULES_UPDATED',
      actorName: actor?.name || 'Principal',
      actorRole: actor?.role || 'Admin',
      details: `Deleted grading rule (${id}).`,
    });

    return filtered;
  }

  resetGradeRules(actor?: User): GradeRule[] {
    this.save(STORAGE_KEYS.GRADE_RULES, initialGradeRules);
    this.logAudit({
      action: 'GRADING_RULES_UPDATED',
      actorName: actor?.name || 'Administrator',
      actorRole: actor?.role || 'Admin',
      details: 'Reset grading rules scale to institutional default.',
    });
    return initialGradeRules;
  }

  calculateGradeForPercentage(percentage: number): {
    grade: string;
    gradePoint: number;
    description: string;
  } {
    const rules = this.getGradeRules();
    const matched = rules.find(
      (r) => percentage >= r.minPercentage && percentage <= r.maxPercentage + 0.01
    );

    if (matched) {
      return {
        grade: matched.grade,
        gradePoint: matched.gradePoint,
        description: matched.description,
      };
    }

    // Fallback if slightly below lowest or above highest
    if (percentage >= 90) return { grade: 'A+', gradePoint: 4.0, description: 'Outstanding' };
    if (percentage >= 80) return { grade: 'A', gradePoint: 3.7, description: 'Excellent' };
    if (percentage >= 70) return { grade: 'B', gradePoint: 3.0, description: 'Good' };
    if (percentage >= 60) return { grade: 'C', gradePoint: 2.0, description: 'Satisfactory' };
    if (percentage >= 50) return { grade: 'D', gradePoint: 1.0, description: 'Marginal' };
    if (percentage >= 40) return { grade: 'E', gradePoint: 0.5, description: 'Conditional' };
    return { grade: 'F', gradePoint: 0.0, description: 'Unsatisfactory' };
  }

  getResultSettings(): ResultCalculationSettings {
    return this.load<ResultCalculationSettings>(STORAGE_KEYS.RESULT_SETTINGS, initialResultSettings);
  }

  updateResultSettings(settings: ResultCalculationSettings, actor?: User): ResultCalculationSettings {
    this.save(STORAGE_KEYS.RESULT_SETTINGS, settings);
    this.logAudit({
      action: 'SETTINGS_UPDATED',
      actorName: actor?.name || 'Principal',
      actorRole: actor?.role || 'Admin',
      details: `Updated result calculation criteria (${settings.passingCriteria}, Passing %: ${settings.overallPassingPercentage}%).`,
    });
    return settings;
  }

  saveResultSettings(settings: ResultCalculationSettings, actor?: User): ResultCalculationSettings {
    return this.updateResultSettings(settings, actor);
  }

  // ==========================================
  // 6. RESULT CALCULATION & RANKING ENGINE
  // ==========================================

  calculateExamResults(
    examId: string,
    classId: string,
    sectionId?: string,
    includeUnpublished: boolean = true
  ): StudentCalculatedResult[] {
    const exam = this.getExamById(examId);
    if (!exam) return [];

    const settings = this.getResultSettings();
    const batches = this.getMarksBatches({ examId, classId });
    const relevantBatches = sectionId
      ? batches.filter((b) => b.sectionId === sectionId)
      : batches;

    // Filter by publication status if requested
    const validBatches = includeUnpublished
      ? relevantBatches
      : relevantBatches.filter((b) => b.status === 'PUBLISHED');

    if (validBatches.length === 0) return [];

    // Get all students enrolled in this class/section
    const allStudents = dataService.getStudents();
    const studentsInGroup = allStudents.filter((s) => {
      const matchClass = s.classId === classId || s.className === validBatches[0]?.className;
      const matchSection = !sectionId || s.sectionId === sectionId || s.sectionName === validBatches[0]?.sectionName;
      return matchClass && matchSection;
    });

    const calculatedList: StudentCalculatedResult[] = [];

    studentsInGroup.forEach((student) => {
      const subjectResults: CalculatedSubjectResult[] = [];
      let totalMaxMarks = 0;
      let totalObtainedMarks = 0;
      let anyFailed = false;
      let missingMandatoryPass = false;

      validBatches.forEach((batch) => {
        const studentRecord = batch.records.find((r) => r.studentId === student.studentId);
        if (!studentRecord) return;

        const isAbsent = Boolean(studentRecord.isAbsent);
        const marksObtained = studentRecord.marksObtained;
        totalMaxMarks += batch.totalMarks;

        let pct = 0;
        let isPassed = false;

        if (isAbsent) {
          pct = 0;
          isPassed = false;
          if (settings.treatAbsentAsZeroForOverall) {
            // Treat as 0 marks
          }
        } else if (marksObtained !== null && marksObtained !== undefined) {
          pct = Number(((marksObtained / batch.totalMarks) * 100).toFixed(2));
          totalObtainedMarks += marksObtained;
          isPassed = marksObtained >= batch.passingMarks;
        }

        if (!isPassed) {
          anyFailed = true;
          if (settings.mandatorySubjectNames.includes(batch.subjectName)) {
            missingMandatoryPass = true;
          }
        }

        const gradeInfo = this.calculateGradeForPercentage(pct);

        subjectResults.push({
          subjectId: batch.subjectId,
          subjectName: batch.subjectName,
          totalMarks: batch.totalMarks,
          passingMarks: batch.passingMarks,
          marksObtained: isAbsent ? null : marksObtained,
          isAbsent,
          percentage: pct,
          grade: isAbsent ? 'Absent' : gradeInfo.grade,
          gpa: isAbsent ? 0.0 : gradeInfo.gradePoint,
          isPassed,
          remarks: studentRecord.remarks || (isPassed ? 'Satisfactory' : 'Needs improvement'),
        });
      });

      if (subjectResults.length === 0) return;

      const overallPercentage =
        totalMaxMarks > 0 ? Number(((totalObtainedMarks / totalMaxMarks) * 100).toFixed(2)) : 0;

      const overallGradeInfo = this.calculateGradeForPercentage(overallPercentage);

      // Determine overall pass/fail status
      let overallStatus: 'PASS' | 'FAIL' = 'PASS';
      if (settings.passingCriteria === 'ALL_SUBJECTS') {
        overallStatus = anyFailed ? 'FAIL' : 'PASS';
      } else if (settings.passingCriteria === 'OVERALL_PERCENTAGE') {
        overallStatus = overallPercentage >= settings.overallPassingPercentage ? 'PASS' : 'FAIL';
      } else if (settings.passingCriteria === 'MANDATORY_SUBJECTS') {
        overallStatus = missingMandatoryPass ? 'FAIL' : 'PASS';
      }

      // Average GPA across subjects
      const validGpaSubjects = subjectResults.filter((s) => !s.isAbsent);
      const overallGpa =
        validGpaSubjects.length > 0
          ? Number(
              (
                validGpaSubjects.reduce((acc, curr) => acc + curr.gpa, 0) /
                validGpaSubjects.length
              ).toFixed(2)
            )
          : 0;

      const isPublished = validBatches.every((b) => b.status === 'PUBLISHED') || exam.status === 'PUBLISHED';

      calculatedList.push({
        id: `RES-${exam.id}-${student.studentId}`,
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber || '01',
        classId,
        className: student.className,
        sectionId: student.sectionId || 'SEC-001',
        sectionName: student.sectionName || 'Section A',
        examId: exam.id,
        examName: exam.name,
        academicYear: exam.academicYear,
        subjects: subjectResults,
        totalMaxMarks,
        totalObtainedMarks,
        overallPercentage,
        overallGrade: overallGradeInfo.grade,
        overallGpa,
        overallStatus,
        isPublished,
        publishedAt: exam.publishedAt,
      });
    });

    // ==========================================
    // Position / Ranking Calculation
    // ==========================================
    if (settings.enableRanking && calculatedList.length > 0) {
      // Sort descending by overall percentage
      calculatedList.sort((a, b) => b.overallPercentage - a.overallPercentage);

      let currentRank = 1;
      calculatedList.forEach((item, index) => {
        item.totalInRankGroup = calculatedList.length;
        if (index > 0 && item.overallPercentage === calculatedList[index - 1].overallPercentage) {
          // Tie gets the same position as previous
          item.position = calculatedList[index - 1].position;
        } else {
          item.position = currentRank;
        }
        currentRank = index + 2;
      });
    }

    return calculatedList;
  }

  // ==========================================
  // 7. RESULT PUBLICATION WORKFLOW
  // ==========================================

  publishExamResults(
    examId: string,
    classId: string,
    sectionId?: string,
    actor?: User
  ): { success: boolean; count: number; error?: string } {
    const batches = this.getMarksBatches({ examId, classId });
    const targetBatches = sectionId ? batches.filter((b) => b.sectionId === sectionId) : batches;

    if (targetBatches.length === 0) {
      return { success: false, count: 0, error: 'No marks batches found to publish' };
    }

    // Check if all are verified or ready
    const unverified = targetBatches.filter((b) => b.status !== 'VERIFIED' && b.status !== 'PUBLISHED');
    if (unverified.length > 0) {
      return {
        success: false,
        count: 0,
        error: `Cannot publish results: ${unverified.length} subject batch(es) have not yet been approved/verified by administrative leadership.`,
      };
    }

    const allBatches = this.getMarksBatches();
    targetBatches.forEach((tb) => {
      const idx = allBatches.findIndex((b) => b.id === tb.id);
      if (idx !== -1) {
        allBatches[idx].status = 'PUBLISHED';
      }
    });
    this.save(STORAGE_KEYS.MARKS_BATCHES, allBatches);

    // Update parent exam status to PUBLISHED
    const exam = this.getExamById(examId);
    if (exam && exam.status !== 'PUBLISHED') {
      this.updateExamStatus(examId, 'PUBLISHED', actor);
    }

    this.logAudit({
      examId,
      examName: exam?.name,
      action: 'RESULT_PUBLISHED',
      actorName: actor?.name || 'Dr. Eleanor Vance',
      actorRole: actor?.role || 'Principal',
      details: `Published official examination results for ${targetBatches[0]?.className} ${
        sectionId ? `(${targetBatches[0]?.sectionName})` : ''
      }. Parents and students can now view verified report cards.`,
    });

    // Automation: Dispatch notifications to Parents & Students
    dataService.createNotification({
      title: 'Examination Results Published',
      message: `Official results for ${exam?.name || 'Term Exam'} (${targetBatches[0]?.className}) are now available in the portal.`,
      type: 'result_published',
      priority: 'high',
      targetRole: 'parent',
      relatedModule: 'exams',
      relatedRecordId: examId,
    });

    dataService.createNotification({
      title: 'Your Term Exam Results Are Out!',
      message: `Transcripts and grades for ${exam?.name || 'Term Exam'} have been published. Check your grades desk.`,
      type: 'result_published',
      priority: 'high',
      targetRole: 'student',
      relatedModule: 'exams',
      relatedRecordId: examId,
    });

    return { success: true, count: targetBatches.length };
  }

  // ==========================================
  // 8. STUDENT & PARENT SCOPED RESULTS
  // ==========================================

  getStudentExamResults(
    studentId: string,
    onlyPublished: boolean = true
  ): StudentCalculatedResult[] {
    const student = dataService.getStudentById(studentId);
    if (!student) return [];

    const exams = this.getExams();
    const results: StudentCalculatedResult[] = [];

    exams.forEach((exam) => {
      if (onlyPublished && exam.status !== 'PUBLISHED') return;

      const calcList = this.calculateExamResults(
        exam.id,
        student.classId || 'CLS-001',
        student.sectionId,
        !onlyPublished
      );

      const studentRes = calcList.find((r) => r.studentId === studentId);
      if (studentRes) {
        if (!onlyPublished || studentRes.isPublished) {
          results.push(studentRes);
        }
      }
    });

    // Sort by exam date descending
    results.sort((a, b) => b.examId.localeCompare(a.examId));
    return results;
  }

  getStudentPerformanceTrend(studentId: string): {
    examName: string;
    percentage: number;
    grade: string;
    academicYear: string;
  }[] {
    const results = this.getStudentExamResults(studentId, true);
    return results.map((r) => ({
      examName: r.examName,
      percentage: r.overallPercentage,
      grade: r.overallGrade,
      academicYear: r.academicYear,
    }));
  }

  // ==========================================
  // 9. REPORT CARD GENERATION
  // ==========================================

  generateReportCard(
    examId: string,
    studentId: string,
    template?: 'standard' | 'modern' | 'compact'
  ): ReportCardData | null {
    const student = dataService.getStudentById(studentId);
    const exam = this.getExamById(examId);
    if (!student || !exam) return null;

    const settings = this.getResultSettings();
    const chosenTemplate = template || settings.reportCardTemplate;

    const calcList = this.calculateExamResults(
      examId,
      student.classId || 'CLS-001',
      student.sectionId,
      true
    );
    const studentResult = calcList.find((r) => r.studentId === studentId);
    if (!studentResult) return null;

    // Calculate real attendance summary for this student from dataService
    const attendanceLogs = dataService.getAttendanceRecords().filter((l) => l.studentId === studentId);
    const totalDays = attendanceLogs.length > 0 ? attendanceLogs.length : 60;
    const present = attendanceLogs.filter((l) => l.status === 'Present').length || Math.round(totalDays * 0.94);
    const absent = attendanceLogs.filter((l) => l.status === 'Absent').length || Math.round(totalDays * 0.04);
    const late = attendanceLogs.filter((l) => l.status === 'Late').length || Math.round(totalDays * 0.02);
    const attendancePercentage = Number((((present + late) / totalDays) * 100).toFixed(1));

    // Dynamic faculty remarks based on overall performance
    let teacherRemarks = 'Demonstrates consistent academic effort and good classroom participation.';
    if (studentResult.overallPercentage >= 90) {
      teacherRemarks =
        'Exceptional scholar exhibiting outstanding analytical depth, creativity, and exemplary leadership.';
    } else if (studentResult.overallPercentage >= 80) {
      teacherRemarks =
        'Consistently strong academic proficiency across all subjects with commendable study habits.';
    } else if (studentResult.overallPercentage < 50) {
      teacherRemarks =
        'Requires structured academic mentoring and daily homework reinforcement in foundation chapters.';
    }

    let principalRemarks =
      'Promising academic term. Commended for diligent adherence to academy core values.';
    if (studentResult.overallPercentage >= 90) {
      principalRemarks =
        'Academic Honor Roll Distinction. Selected for faculty commendation and scholarship consideration.';
    }

    this.logAudit({
      examId,
      examName: exam.name,
      action: 'REPORT_CARD_GENERATED',
      actorName: 'Academic Registrar',
      actorRole: 'Admin',
      details: `Generated official report card for ${student.firstName} ${student.lastName} (${student.studentId}) in ${exam.name}.`,
    });

    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber || '01',
        className: student.className,
        sectionName: student.sectionName || 'Section A',
        academicYear: exam.academicYear,
        dateOfBirth: student.dateOfBirth,
        parentName: student.fatherGuardianName,
        photoUrl: student.profilePhoto,
      },
      exam: {
        id: exam.id,
        name: exam.name,
        type: exam.examType,
        startDate: exam.startDate,
        endDate: exam.endDate,
        academicYear: exam.academicYear,
      },
      results: studentResult.subjects,
      overall: {
        totalMaxMarks: studentResult.totalMaxMarks,
        totalObtainedMarks: studentResult.totalObtainedMarks,
        percentage: studentResult.overallPercentage,
        grade: studentResult.overallGrade,
        gpa: studentResult.overallGpa,
        status: studentResult.overallStatus,
        position: studentResult.position,
        totalInClass: studentResult.totalInRankGroup,
      },
      attendanceSummary: {
        totalDays,
        present,
        absent,
        late,
        attendancePercentage,
      },
      teacherRemarks,
      principalRemarks,
      gradingScale: this.getGradeRules(),
      generatedDate: new Date().toISOString().split('T')[0],
      template: chosenTemplate,
    };
  }

  // ==========================================
  // 10. RESULT ANALYTICS
  // ==========================================

  getExamAnalytics(
    examId: string,
    classId?: string,
    sectionId?: string,
    subjectId?: string
  ): ExamAnalytics {
    const exam = this.getExamById(examId) || this.getExams()[0];
    const targetClassId = classId || 'CLS-001';
    const calcResults = this.calculateExamResults(exam.id, targetClassId, sectionId, true);

    const totalStudents = calcResults.length;
    if (totalStudents === 0) {
      return {
        examId: exam.id,
        examName: exam.name,
        academicYear: exam.academicYear,
        totalStudents: 0,
        totalAppeared: 0,
        totalAbsent: 0,
        classAveragePercentage: 0,
        highestPercentage: 0,
        lowestPercentage: 0,
        passPercentage: 0,
        failPercentage: 0,
        subjectPerformance: [],
        gradeDistribution: [],
      };
    }

    const percentages = calcResults.map((r) => r.overallPercentage);
    const highestPercentage = Math.max(...percentages);
    const lowestPercentage = Math.min(...percentages);
    const classAveragePercentage = Number(
      (percentages.reduce((a, b) => a + b, 0) / totalStudents).toFixed(2)
    );

    const passCount = calcResults.filter((r) => r.overallStatus === 'PASS').length;
    const failCount = totalStudents - passCount;
    const passPercentage = Number(((passCount / totalStudents) * 100).toFixed(1));
    const failPercentage = Number(((failCount / totalStudents) * 100).toFixed(1));

    // Grade Distribution
    const gradeRules = this.getGradeRules();
    const gradeCounts: Record<string, number> = {};
    gradeRules.forEach((g) => {
      gradeCounts[g.grade] = 0;
    });

    calcResults.forEach((r) => {
      gradeCounts[r.overallGrade] = (gradeCounts[r.overallGrade] || 0) + 1;
    });

    const gradeDistribution = Object.entries(gradeCounts).map(([grade, count]) => ({
      grade,
      count,
      percentage: Number(((count / totalStudents) * 100).toFixed(1)),
    }));

    // Subject Performance Analysis
    const subjectsMap = new Map<
      string,
      {
        totalScores: number;
        totalMax: number;
        scores: number[];
        absents: number;
        passCount: number;
        totalRecords: number;
      }
    >();

    calcResults.forEach((r) => {
      r.subjects.forEach((s) => {
        if (subjectId && s.subjectId !== subjectId) return;

        if (!subjectsMap.has(s.subjectName)) {
          subjectsMap.set(s.subjectName, {
            totalScores: 0,
            totalMax: s.totalMarks,
            scores: [],
            absents: 0,
            passCount: 0,
            totalRecords: 0,
          });
        }

        const data = subjectsMap.get(s.subjectName)!;
        data.totalRecords += 1;
        if (s.isAbsent || s.marksObtained === null) {
          data.absents += 1;
        } else {
          data.totalScores += s.marksObtained;
          data.scores.push(s.marksObtained);
          if (s.isPassed) data.passCount += 1;
        }
      });
    });

    const subjectPerformance = Array.from(subjectsMap.entries()).map(([name, data]) => {
      const validCount = data.scores.length;
      const averageMarks = validCount > 0 ? Number((data.totalScores / validCount).toFixed(1)) : 0;
      const averagePercentage = Number(((averageMarks / data.totalMax) * 100).toFixed(1));
      const highestScore = data.scores.length > 0 ? Math.max(...data.scores) : 0;
      const lowestScore = data.scores.length > 0 ? Math.min(...data.scores) : 0;
      const passRate = validCount > 0 ? Number(((data.passCount / validCount) * 100).toFixed(1)) : 0;

      return {
        subjectName: name,
        averageMarks,
        totalMarks: data.totalMax,
        averagePercentage,
        highestScore,
        lowestScore,
        passRate,
        isWeak: averagePercentage < 65 || passRate < 75,
      };
    });

    const totalAbsent = calcResults.reduce(
      (acc, curr) => acc + curr.subjects.filter((s) => s.isAbsent).length,
      0
    );

    return {
      examId: exam.id,
      examName: exam.name,
      academicYear: exam.academicYear,
      totalStudents,
      totalAppeared: totalStudents - (totalAbsent > 0 ? 1 : 0),
      totalAbsent,
      classAveragePercentage,
      highestPercentage,
      lowestPercentage,
      passPercentage,
      failPercentage,
      subjectPerformance,
      gradeDistribution,
    };
  }
}

export const examService = new ExamService();
