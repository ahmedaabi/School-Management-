export type AdmissionStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'DOCUMENTS_PENDING'
  | 'INTERVIEW_PENDING'
  | 'TEST_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'WAITLISTED'
  | 'ENROLLED'
  | 'WITHDRAWN';

export type DocumentType =
  | 'Birth Certificate'
  | 'Previous School Certificate'
  | 'Student Photo'
  | 'Parent/Guardian ID'
  | 'Medical Clearance'
  | 'Transfer Certificate'
  | 'Other Documents';

export type DocumentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'MISSING';

export interface AdmissionDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  uploadedDate: string;
  verificationStatus: DocumentVerificationStatus;
  verifiedBy?: string;
  verificationDate?: string;
  notes?: string;
}

export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
export type InterviewRecommendation = 'RECOMMENDED' | 'NOT_RECOMMENDED' | 'NEEDS_SECOND_INTERVIEW' | 'CONDITIONAL';

export interface AdmissionInterview {
  id: string;
  date: string;
  time: string;
  interviewerName: string;
  interviewerId?: string;
  location: string;
  notes?: string;
  status: InterviewStatus;
  result?: InterviewRecommendation;
  score?: number; // 0-100 or 1-10
  comments?: string;
  recommendation?: string;
  conductedAt?: string;
}

export type TestResult = 'PASS' | 'FAIL' | 'PENDING';

export interface AdmissionTest {
  id: string;
  subjectCategory: string;
  testDate: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  result: TestResult;
  remarks?: string;
  evaluatorName?: string;
}

export interface ApplicationStatusHistory {
  id: string;
  fromStatus: AdmissionStatus;
  toStatus: AdmissionStatus;
  changedBy: string;
  changedByRole: string;
  timestamp: string;
  reason?: string;
  notes?: string;
}

export interface AdmissionNote {
  id: string;
  author: string;
  authorRole: string;
  note: string;
  timestamp: string;
}

export type WaitlistPriority = 'High' | 'Medium' | 'Low';

export interface WaitlistEntry {
  id: string;
  applicationId: string;
  applicationNumber: string;
  applicantName: string;
  classId: string;
  className: string;
  priority: WaitlistPriority;
  dateAdded: string;
  reason: string;
  notes?: string;
  status: 'Active' | 'Promoted' | 'Expired';
}

export type ApplicationSource =
  | 'Website'
  | 'Facebook'
  | 'Instagram'
  | 'Referral'
  | 'Walk-in'
  | 'Education Fair'
  | 'Other';

export interface AdmissionApplication {
  id: string;
  applicationNumber: string; // e.g. ADM-2026-00001
  applicantFirstName: string;
  applicantMiddleName?: string;
  applicantLastName: string;
  applicantName: string; // Combined display name
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  previousSchool: string;
  previousGrade: string;
  appliedClassId: string;
  appliedClassName: string;
  appliedSectionId?: string;
  appliedSectionName?: string;
  academicYear: string; // "2026-2027"
  source: ApplicationSource;
  sourceDetails?: string;
  applicationDate: string;
  status: AdmissionStatus;

  // Parent/Guardian details
  parentName: string;
  parentRelationship: 'Father' | 'Mother' | 'Guardian';
  parentPhone: string;
  parentAlternatePhone?: string;
  parentEmail: string;
  parentOccupation?: string;

  // Address
  address: string;
  city: string;
  postalCode: string;
  country: string;

  // Emergency Contact
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;

  // Additional Information
  howDidYouHear: string;
  previousAcademicPerformance?: string;
  additionalNotes?: string;

  // Workflow sub-entities
  documents: AdmissionDocument[];
  interviews: AdmissionInterview[];
  tests: AdmissionTest[];
  notes: AdmissionNote[];
  statusHistory: ApplicationStatusHistory[];

  // Approval & Rejection fields
  approvedBy?: string;
  approvedDate?: string;
  approvalNotes?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  rejectionReason?: string;

  // Waitlist info
  waitlistPriority?: WaitlistPriority;
  waitlistReason?: string;

  // Enrollment fields
  enrolledStudentId?: string;
  enrolledAdmissionNumber?: string;
  enrolledDate?: string;
  feeStructureAssigned?: boolean;
  feeStructureId?: string;
}

export interface ClassAdmissionCapacity {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  maxCapacity: number;
  occupied: number;
  reservedSeats?: number;
  isFull: boolean;
  availableSeats: number;
}

export interface AdmissionSettings {
  academicYear: string;
  applicationNumberPrefix: string; // "ADM-2026-"
  admissionNumberPrefix: string; // "AD-2026-"
  requireEntranceTest: boolean;
  requireInterview: boolean;
  requiredDocumentTypes: DocumentType[];
  autoNotifyParentOnReceive: boolean;
  autoNotifyParentOnApprove: boolean;
  pendingReviewAlertDays: number; // e.g. 3 days
  enableCapacityLimits: boolean;
  allowWaitlist: boolean;
}

export interface AdmissionAutomationRule {
  id: string;
  name: string;
  description: string;
  trigger:
    | 'NEW_APPLICATION'
    | 'DOCUMENT_MISSING'
    | 'INTERVIEW_SCHEDULED'
    | 'TEST_SCHEDULED'
    | 'APPLICATION_APPROVED'
    | 'APPLICATION_REJECTED'
    | 'APPLICATION_WAITLISTED'
    | 'PENDING_EXCEEDED_DAYS'
    | 'STUDENT_ENROLLED';
  action: 'SEND_PARENT_NOTIFICATION' | 'CREATE_ADMIN_ALERT' | 'CREATE_FOLLOWUP_TASK' | 'CREATE_AUDIT_LOG';
  enabled: boolean;
}

export interface AdmissionAutomationLog {
  id: string;
  timestamp: string;
  ruleId: string;
  ruleName: string;
  triggerEvent: string;
  applicationId: string;
  applicationNumber: string;
  applicantName: string;
  actionTaken: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  message: string;
  details?: string;
}

export interface AdmissionAuditLog {
  id: string;
  user: string;
  userRole: string;
  action:
    | 'Application Created'
    | 'Application Edited'
    | 'Status Changed'
    | 'Document Uploaded'
    | 'Document Verified'
    | 'Document Rejected'
    | 'Interview Scheduled'
    | 'Interview Completed'
    | 'Test Recorded'
    | 'Application Approved'
    | 'Application Rejected'
    | 'Application Waitlisted'
    | 'Application Enrolled'
    | 'Parent Account Associated'
    | 'Fee Structure Assigned'
    | 'Capacity Overridden'
    | 'Settings Updated';
  entity: 'AdmissionApplication' | 'AdmissionDocument' | 'AdmissionInterview' | 'AdmissionTest' | 'Capacity' | 'Settings';
  entityId: string;
  timestamp: string;
  previousValue?: string;
  newValue?: string;
  details: string;
}
