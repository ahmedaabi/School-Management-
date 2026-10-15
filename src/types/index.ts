export type Role =
  | 'super_admin'
  | 'principal'
  | 'admin_staff'
  | 'accountant'
  | 'teacher'
  | 'parent'
  | 'student';

export type Permission =
  | 'dashboard.view'
  | 'students.view'
  | 'students.create'
  | 'students.edit'
  | 'students.archive'
  | 'students.delete'
  | 'parents.view'
  | 'parents.edit'
  | 'teachers.view'
  | 'teachers.create'
  | 'teachers.edit'
  | 'teachers.delete'
  | 'classes.view'
  | 'classes.manage'
  | 'attendance.view'
  | 'attendance.create'
  | 'attendance.edit'
  | 'fees.view'
  | 'fees.create'
  | 'fees.edit'
  | 'payments.create'
  | 'exams.view'
  | 'results.view'
  | 'results.create'
  | 'results.edit'
  | 'results.publish'
  | 'homework.view'
  | 'homework.create'
  | 'homework.edit'
  | 'admissions.view'
  | 'admissions.manage'
  | 'announcements.create'
  | 'announcements.publish'
  | 'communication.manage'
  | 'requests.manage'
  | 'requests.create'
  | 'requests.view'
  | 'requests.assign'
  | 'requests.comment'
  | 'requests.internal_note'
  | 'requests.resolve'
  | 'requests.close'
  | 'requests.analytics'
  | 'reports.view'
  | 'automation.view'
  | 'automation.manage'
  | 'settings.manage'
  | 'timetable.view'
  | 'timetable.create'
  | 'timetable.edit'
  | 'timetable.delete'
  | 'timetable.override_conflict'
  | 'rooms.view'
  | 'rooms.manage'
  | 'staff.view'
  | 'staff.create'
  | 'staff.edit'
  | 'staff.archive'
  | 'staff.attendance'
  | 'staff.documents'
  | 'staff.performance'
  | 'staff.salary.view'
  | 'staff.salary.manage'
  | 'departments.view'
  | 'departments.manage'
  | 'staff.leave.create'
  | 'staff.leave.view'
  | 'staff.leave.approve'
  | 'staff.leave.reject';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  roleTitle: string;
  permissions: Permission[];
  phone?: string;
  schoolId: string;
  parentId?: string;
  teacherId?: string;
  studentId?: string;
  linkedStudentIds?: string[];
}

export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  academicYear: string;
  currentTerm: string;
  principalName: string;
}

export type StudentStatus =
  | 'Active'
  | 'Inactive'
  | 'Graduated'
  | 'Transferred'
  | 'Suspended';

export type Gender = 'Male' | 'Female' | 'Other';

export interface StudentDocument {
  id: string;
  name: string;
  type: string;
  category?: 'birth_certificate' | 'previous_school' | 'photograph' | 'guardian_id' | 'health_record' | 'other';
  uploadDate: string;
  fileSize: string;
  verified: boolean;
  fileUrl?: string;
}

export interface StudentStaffNote {
  id: string;
  studentId: string;
  noteText: string;
  category: 'General' | 'Academic' | 'Behavioral' | 'Medical' | 'Administrative';
  createdBy: string;
  createdByRole: string;
  createdAt: string;
}

export interface StudentAuditLog {
  id: string;
  studentId: string;
  studentName: string;
  action:
    | 'Student Created'
    | 'Student Edited'
    | 'Student Archived'
    | 'Student Restored'
    | 'Class Changed'
    | 'Section Changed'
    | 'Parent Association Updated'
    | 'Document Uploaded'
    | 'Document Deleted'
    | 'Staff Note Added'
    | 'Attendance Recorded'
    | 'Payment Reconciled'
    | 'Notification Dispatched';
  actorName: string;
  actorRole: string;
  timestamp: string;
  details: string;
  changes?: { field: string; from: string; to: string }[];
}

export interface Student {
  id: string;
  studentId: string; // e.g. "STU-2026-0001"
  admissionNumber?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  profilePhoto: string;
  fatherGuardianName: string;
  parentRelationship?: 'Father' | 'Mother' | 'Guardian';
  parentContact: string;
  secondaryContact: string;
  parentEmail?: string;
  parentOccupation?: string;
  email: string;
  address: string;
  city?: string;
  postalCode?: string;
  country?: string;
  admissionDate: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  rollNumber: string;
  previousSchool: string;
  status: StudentStatus;
  isArchived?: boolean;
  archivedAt?: string;
  archivedReason?: string;
  emergencyContactName?: string;
  emergencyRelationship?: string;
  emergencyContact: string;
  emergencyAltPhone?: string;
  medicalAllergies?: string;
  medicalConditions?: string;
  medicalNotes: string;
  emergencyMedicalInstructions?: string;
  bloodGroup: string;
  parentId?: string;
  attendanceRate: number; // percentage, e.g. 96
  feeStatus: 'Paid' | 'Pending' | 'Overdue';
  pendingFeeAmount?: number;
  documents: StudentDocument[];
}

export interface Parent {
  id: string;
  name: string;
  relationship: 'Father' | 'Mother' | 'Guardian';
  email: string;
  phone: string;
  secondaryPhone?: string;
  occupation: string;
  address: string;
  city?: string;
  postalCode?: string;
  country?: string;
  childrenIds: string[];
}

export type TeacherStatus = 'Active' | 'On Leave' | 'Inactive';

export interface AssignedClass {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subject: string;
}

export interface Teacher {
  id: string;
  teacherId: string; // e.g. "TCH-2024-012"
  name: string;
  profilePhoto: string;
  email: string;
  phone: string;
  qualification: string;
  joiningDate: string;
  department: string;
  subjects: string[];
  assignedClasses: AssignedClass[];
  status: TeacherStatus;
}

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  department: string;
  credits: number;
}

export interface SectionItem {
  id: string;
  classId?: string;
  className?: string;
  name: string; // "A", "B", "C"
  roomNumber: string;
  capacity?: number;
  enrolledCount?: number;
  studentCount?: number;
  classTeacherId?: string;
  classTeacherName?: string;
  subjectIds?: string[];
}

export type ClassSection = SectionItem;

export interface ClassItem {
  id: string;
  name: string; // "Class 6", "Class 7"
  gradeLevel: number;
  capacity?: number;
  sections: SectionItem[];
  classHeadTeacherId?: string;
  classHeadTeacherName?: string;
  totalStudents?: number;
  subjects: string[];
}

export type SchoolClass = ClassItem;

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber?: string;
  classId: string;
  className?: string;
  sectionId?: string;
  sectionName?: string;
  date: string; // YYYY-MM-DD
  period?: string; // e.g. "Daily Homeroom", "Period 1", "Period 2"
  status: AttendanceStatus;
  recordedBy?: string;
  recordedByRole?: string;
  remarks?: string;
  previousStatus?: AttendanceStatus;
  editedAt?: string;
  editedBy?: string;
  editReason?: string;
  timestamp?: string;
}

export type AttendanceLog = AttendanceRecord;

export interface AttendanceAuditLog {
  id: string;
  attendanceId: string;
  studentId: string;
  studentName: string;
  date: string;
  period?: string;
  className?: string;
  sectionName?: string;
  previousStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  changedBy: string;
  changedByRole: string;
  timestamp: string;
  reason: string;
}

export interface AttendanceSettings {
  mode: 'daily' | 'period';
  lowAttendanceThreshold: number; // default 75 (%)
  consecutiveAbsenceThreshold: number; // default 3 (days)
  repeatedLateThreshold: number; // default 3 (times)
  workingDays: string[]; // ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  notifyParentsOnAbsence: boolean;
  notifyParentsOnLowAttendance?: boolean;
  notifyAdminOnConsecutiveAbsence?: boolean;
  notifyAdminOnRepeatedLate?: boolean;
  notifyAdminOnTruancy?: boolean;
  notifyTeacherOnLate?: boolean;
}

export interface AttendanceAlertItem {
  id: string;
  type: 'LOW_ATTENDANCE' | 'CONSECUTIVE_ABSENCE' | 'REPEATED_LATE';
  studentId: string;
  studentName: string;
  className: string;
  sectionName: string;
  parentName?: string;
  parentContact?: string;
  severity: 'warning' | 'danger' | 'info';
  metricValue: string;
  dateTriggered: string;
  details: string;
  status: 'Active' | 'Acknowledged' | 'Resolved';
  staffNotes?: {
    id: string;
    author: string;
    note: string;
    timestamp: string;
  }[];
}

export interface AutomationExecutionLog {
  id: string;
  timestamp: string;
  ruleId: string;
  ruleName: string;
  triggerEvent: string;
  studentId?: string;
  studentName?: string;
  actionTaken: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  message: string;
  details?: string;
}

export interface FeeItem {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  title: string;
  amount: number;
  paidAmount?: number;
  dueDate: string;
  feeType: 'Tuition' | 'Laboratory' | 'Transport' | 'Library' | 'Annual' | string;
  status: 'Paid' | 'Pending' | 'Overdue';
  invoiceNumber: string;
  paidDate?: string;
}

export type FeeRecord = FeeItem;

export interface PaymentRecord {
  id: string;
  feeId: string;
  studentId: string;
  studentName: string;
  amountPaid: number;
  paymentDate: string;
  method: 'Online Bank Transfer' | 'Credit Card' | 'Direct Debit' | 'Cheque' | string;
  receiptNumber: string;
  status: 'Completed' | 'Processing' | 'Failed';
}

export type AdmissionStatus = 'Pending' | 'Approved' | 'Rejected' | 'Under Review';

export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  applicantName: string;
  appliedClass: string;
  applicationDate: string;
  status: AdmissionStatus;
  parentName: string;
  parentContact: string;
  email: string;
  previousSchool: string;
  testScore?: number;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  targetAudience: 'All' | 'Teachers' | 'Parents' | 'Students' | 'Staff';
  date: string;
  author: string;
  authorRole: string;
  priority: 'High' | 'Normal' | 'Urgent';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'alert' | 'info' | 'success' | 'warning';
  linkTo?: string;
}

export interface RequestComplaintItem {
  id: string;
  ticketNumber: string;
  senderName: string;
  senderRole: 'Parent' | 'Teacher' | 'Student' | 'Staff';
  type: 'Request' | 'Complaint';
  category: 'Academics' | 'Transport' | 'Finance' | 'Facilities' | 'Discipline';
  subject: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  date: string;
  priority: 'Low' | 'Medium' | 'High';
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  role: string;
  details: string;
  entityType: 'student' | 'payment' | 'attendance' | 'exam' | 'announcement' | 'class';
}

export interface AlertItem {
  id: string;
  type: 'low_attendance' | 'overdue_fee' | 'pending_admission' | 'unresolved_complaint';
  title: string;
  description: string;
  severity: 'warning' | 'danger' | 'info';
  count: number;
  linkTab: string;
}

export interface HomeworkItem {
  id: string;
  studentId?: string;
  classId: string;
  className?: string;
  sectionId: string;
  sectionName?: string;
  subject: string;
  title: string;
  assignedDate: string;
  dueDate: string;
  status: 'Draft' | 'Published' | 'Closed' | 'Submitted' | 'Pending' | 'Late' | 'Graded';
  assignedBy: string;
  teacherId?: string;
  description: string;
  attachment?: string;
  grade?: string;
  submissionCount?: number;
  totalStudents?: number;
}

export interface TeacherTimetablePeriod {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  periodNumber: number;
  time: string;
  subject: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  room: string;
  teacherId: string;
  teacherName: string;
}

export type ParentRequestCategory =
  | 'Leave'
  | 'Fee Query'
  | 'Academic'
  | 'Transport'
  | 'General'
  | 'Complaint';

export type ParentRequestStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface ParentRequestTicket {
  id: string;
  ticketNumber: string;
  parentId: string;
  parentName: string;
  studentId?: string;
  studentName?: string;
  category: ParentRequestCategory;
  subject: string;
  description: string;
  attachment?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: ParentRequestStatus;
  createdAt: string;
  updatedAt: string;
  responses?: {
    id: string;
    author: string;
    role: string;
    message: string;
    timestamp: string;
  }[];
}

export type NotificationType =
  | 'attendance_alert'
  | 'fee_reminder'
  | 'homework_reminder'
  | 'exam_announcement'
  | 'result_published'
  | 'school_announcement'
  | 'request_status';

export interface EnhancedNotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
  priority?: 'normal' | 'high' | 'urgent';
  targetRole?: Role | 'all';
  targetUserId?: string;
  relatedModule?: string;
  relatedRecordId?: string;
}

export interface NotificationPreferences {
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  categories: {
    attendance: boolean;
    fees: boolean;
    homework: boolean;
    exams: boolean;
    announcements: boolean;
    requests: boolean;
  };
}

export interface ExamResultItem {
  id: string;
  studentId: string;
  examName: string;
  term: string;
  subject: string;
  subjectName?: string;
  marksObtained: number;
  totalMarks: number;
  maxMarks?: number;
  grade: string;
  gpa: number;
  remarks: string;
}

export interface DisciplineRecord {
  id: string;
  studentId: string;
  date: string;
  incidentType: 'Commendation' | 'Minor Infraction' | 'Behavioral Warning' | 'Counselor Note';
  description: string;
  recordedBy: string;
  status: 'Resolved' | 'Under Review' | 'Active';
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  appliedDate: string;
  approvedBy?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  status: 'Active' | 'Paused';
  executionCount: number;
  lastExecuted: string;
}

export * from './finance';
export * from './exam';
export * from './timetable';
export * from './staff';
export * from './request';
