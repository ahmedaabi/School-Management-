export type EmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'TEMPORARY'
  | 'OTHER';

export type StaffStatus =
  | 'ACTIVE'
  | 'ON_LEAVE'
  | 'SUSPENDED'
  | 'RESIGNED'
  | 'TERMINATED'
  | 'RETIRED';

export interface Department {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  headOfDepartmentId?: string;
  headOfDepartmentName?: string;
  description: string;
  status: 'Active' | 'Inactive';
  staffCount: number;
}

export interface Designation {
  id: string;
  schoolId: string;
  title: string;
  code: string;
  departmentId?: string;
  departmentName?: string;
  description: string;
  isTeachingRole: boolean;
  status: 'Active' | 'Inactive';
}

export interface Staff {
  id: string;
  schoolId: string;
  employeeId: string; // e.g. "EMP-2026-001"
  userId?: string;
  teacherId?: string; // links directly to existing Teacher record if applicable
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  joiningDate: string;
  employmentType: EmploymentType;
  departmentId: string;
  departmentName: string;
  designationId: string;
  designationTitle: string;
  status: StaffStatus;
  qualification: string;
  address: string;
  emergencyContact: string;
  emergencyPhone?: string;
  profilePhoto: string;
  notes?: string;
  isTeachingStaff: boolean;
  subjects?: string[];
  createdAt: string;
  updatedAt: string;
}

export type StaffAttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'LEAVE'
  | 'EXCUSED';

export interface StaffAttendance {
  id: string;
  schoolId: string;
  staffId: string;
  staffName: string;
  employeeId: string;
  departmentId: string;
  departmentName: string;
  date: string; // YYYY-MM-DD
  status: StaffAttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
  recordedBy: string;
  recordedAt: string;
}

export type StaffLeaveType =
  | 'CASUAL'
  | 'SICK'
  | 'ANNUAL'
  | 'EMERGENCY'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'UNPAID'
  | 'OTHER';

export type StaffLeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface StaffLeave {
  id: string;
  schoolId: string;
  staffId: string;
  staffName: string;
  employeeId: string;
  leaveType: StaffLeaveType;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  reason: string;
  supportingDocument?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewDate?: string;
  reviewerComments?: string;
  status: StaffLeaveStatus;
  createdAt: string;
  updatedAt: string;
}

export type StaffDocumentType =
  | 'CNIC/ID'
  | 'Employment Contract'
  | 'Certificates'
  | 'Degrees'
  | 'Experience Letters'
  | 'Joining Documents'
  | 'Other HR Documents';

export interface StaffDocument {
  id: string;
  schoolId: string;
  staffId: string;
  staffName: string;
  documentType: StaffDocumentType;
  documentName: string;
  issueDate?: string;
  expiryDate?: string;
  fileReference: string;
  fileSize?: string;
  uploadedBy: string;
  uploadedDate: string;
  status: 'Valid' | 'Expiring Soon' | 'Expired';
  isConfidential: boolean;
}

export type PerformanceReviewStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'ACKNOWLEDGED'
  | 'ARCHIVED';

export interface StaffPerformance {
  id: string;
  schoolId: string;
  staffId: string;
  staffName: string;
  employeeId: string;
  reviewPeriod: string; // e.g. "Annual 2025-2026", "Q1 2026"
  reviewerId: string;
  reviewerName: string;
  overallRating: number; // 1-5 scale
  attendanceRating: number;
  teachingQualityRating: number; // or work quality for non-teaching
  professionalismRating: number;
  studentParentFeedback?: string;
  strengths: string;
  areasForImprovement: string;
  goals: string;
  reviewerComments: string;
  employeeComments?: string;
  status: PerformanceReviewStatus;
  reviewDate: string;
}

export type SalaryType = 'MONTHLY' | 'HOURLY' | 'CONTRACT';
export type StaffPaymentMethod = 'BANK_TRANSFER' | 'CHEQUE' | 'CASH';

export interface PayrollAllowance {
  name: string;
  amount: number;
}

export interface PayrollDeduction {
  name: string;
  amount: number;
}

export interface PayrollProfile {
  staffId: string;
  schoolId: string;
  salaryType: SalaryType;
  baseSalary: number;
  allowances: PayrollAllowance[];
  deductions: PayrollDeduction[];
  paymentMethod: StaffPaymentMethod;
  bankReference?: string;
  bankName?: string;
  taxReference?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  notes?: string;
}

export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';
export type AnnouncementAudience = 'ALL' | 'TEACHERS' | 'DEPARTMENT' | 'SPECIFIC';

export interface StaffAnnouncement {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  audience: AnnouncementAudience;
  departmentId?: string;
  departmentName?: string;
  specificStaffIds?: string[];
  publishDate: string;
  expiryDate?: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  authorName: string;
  authorRole: string;
  createdAt: string;
}
