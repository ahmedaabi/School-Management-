export type ExamType =
  | 'Monthly Test'
  | 'Weekly Test'
  | 'Mid Term'
  | 'Final Term'
  | 'Annual Exam'
  | 'Custom';

export type ExamStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export interface ExamClassAssignment {
  classId: string;
  className: string;
  sectionIds: string[];
  sectionNames: string[];
}

export interface Exam {
  id: string;
  name: string;
  academicYear: string;
  examType: ExamType;
  startDate: string;
  endDate: string;
  description: string;
  status: ExamStatus;
  participatingClasses: ExamClassAssignment[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedBy?: string;
}

export interface ExamScheduleItem {
  id: string;
  examId: string;
  examName: string;
  academicYear: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  totalMarks: number;
  passingMarks: number;
  examDate: string;
  startTime: string; // e.g. "09:00 AM"
  endTime: string;   // e.g. "11:30 AM"
  room: string;
  invigilatorId?: string;
  invigilatorName?: string;
}

export type MarksSubmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'RETURNED'
  | 'PUBLISHED';

export interface StudentMarkRecord {
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: number | null; // null if absent or not yet graded
  isAbsent: boolean;
  remarks: string;
}

export interface ExamMarksBatch {
  id: string;
  examId: string;
  examName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  totalMarks: number;
  passingMarks: number;
  teacherId: string;
  teacherName: string;
  status: MarksSubmissionStatus;
  records: StudentMarkRecord[];
  submittedAt?: string;
  submittedBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
  updatedAt: string;
}

export interface GradeRule {
  id: string;
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoint: number;
  description: string;
  isPass?: boolean;
}

export type PassingCriteria =
  | 'ALL_SUBJECTS'
  | 'OVERALL_PERCENTAGE'
  | 'MANDATORY_SUBJECTS';

export interface ResultCalculationSettings {
  passingCriteria: PassingCriteria;
  overallPassingPercentage: number;
  mandatorySubjectNames: string[];
  enableRanking: boolean;
  treatAbsentAsZeroForOverall: boolean;
  reportCardTemplate: 'standard' | 'modern' | 'compact';
  schoolPrincipalName: string;
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
}

export interface CalculatedSubjectResult {
  subjectId: string;
  subjectName: string;
  totalMarks: number;
  passingMarks: number;
  marksObtained: number | null;
  isAbsent: boolean;
  percentage: number;
  grade: string;
  gpa: number;
  isPassed: boolean;
  remarks: string;
}

export interface StudentCalculatedResult {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  examId: string;
  examName: string;
  academicYear: string;
  subjects: CalculatedSubjectResult[];
  totalMaxMarks: number;
  totalObtainedMarks: number;
  overallPercentage: number;
  overallGrade: string;
  overallGpa: number;
  overallStatus: 'PASS' | 'FAIL';
  position?: number;
  totalInRankGroup?: number;
  isPublished: boolean;
  publishedAt?: string;
}

export interface ReportCardData {
  student: {
    id: string;
    studentId: string;
    name: string;
    rollNumber: string;
    className: string;
    sectionName: string;
    academicYear: string;
    dateOfBirth?: string;
    parentName?: string;
    photoUrl?: string;
  };
  exam: {
    id: string;
    name: string;
    type: string;
    startDate: string;
    endDate: string;
    academicYear: string;
  };
  results: CalculatedSubjectResult[];
  overall: {
    totalMaxMarks: number;
    totalObtainedMarks: number;
    percentage: number;
    grade: string;
    gpa: number;
    status: 'PASS' | 'FAIL';
    position?: number;
    totalInClass?: number;
  };
  attendanceSummary: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    attendancePercentage: number;
  };
  teacherRemarks: string;
  principalRemarks: string;
  gradingScale: GradeRule[];
  generatedDate: string;
  template: 'standard' | 'modern' | 'compact';
}

export interface ExamAuditLog {
  id: string;
  examId?: string;
  examName?: string;
  action:
    | 'EXAM_CREATED'
    | 'EXAM_EDITED'
    | 'EXAM_STATUS_CHANGED'
    | 'SCHEDULE_CREATED'
    | 'SCHEDULE_MODIFIED'
    | 'SCHEDULE_DELETED'
    | 'MARKS_DRAFT_SAVED'
    | 'MARKS_SUBMITTED'
    | 'MARKS_VERIFIED'
    | 'MARKS_RETURNED'
    | 'RESULT_PUBLISHED'
    | 'RESULT_UNPUBLISHED'
    | 'REPORT_CARD_GENERATED'
    | 'GRADING_RULES_UPDATED'
    | 'SETTINGS_UPDATED';
  actorName: string;
  actorRole: string;
  timestamp: string;
  details: string;
  entityId?: string;
  previousValue?: string;
  newValue?: string;
}

export interface ExamAnalytics {
  examId: string;
  examName: string;
  academicYear: string;
  totalStudents: number;
  totalAppeared: number;
  totalAbsent: number;
  classAveragePercentage: number;
  highestPercentage: number;
  lowestPercentage: number;
  passPercentage: number;
  failPercentage: number;
  subjectPerformance: {
    subjectName: string;
    averageMarks: number;
    totalMarks: number;
    averagePercentage: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    isWeak: boolean;
  }[];
  gradeDistribution: {
    grade: string;
    count: number;
    percentage: number;
  }[];
}
