export type RequestCategoryCode =
  | 'STUDENT_LEAVE'
  | 'TEACHER_LEAVE'
  | 'PARENT_COMPLAINT'
  | 'FEE_REQUEST'
  | 'TRANSPORT_REQUEST'
  | 'ACADEMIC_REQUEST'
  | 'DOCUMENT_REQUEST'
  | 'GENERAL_REQUEST'
  | 'TECHNICAL_SUPPORT'
  | 'OTHER';

export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type RequestStatus =
  | 'NEW'
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_USER'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELLED';

export interface RequestCategory {
  id: string;
  schoolId: string;
  code: RequestCategoryCode;
  name: string;
  description: string;
  icon: string;
  defaultPriority: RequestPriority;
  slaBusinessDays: number;
  assignedDepartmentId?: string;
  isSystem: boolean;
}

export type RequesterRole = 'Parent' | 'Teacher' | 'Student' | 'Staff' | 'Admin';

export interface RequestLeaveDetails {
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  leaveType?: string;
  reason: string;
  affectedClassesCount?: number;
  substituteTeacherAssigned?: boolean;
  substituteTeacherId?: string;
  substituteTeacherName?: string;
}

export interface RequestTicket {
  id: string;
  schoolId: string;
  requestNumber: string; // e.g. "REQ-2026-00001"
  requesterUserId: string;
  requesterName: string;
  requesterRole: RequesterRole;
  requesterEmail?: string;
  requesterPhone?: string;
  studentId?: string;
  studentName?: string;
  categoryId: string;
  categoryCode: RequestCategoryCode;
  categoryName: string;
  subject: string;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  assignedToStaffId?: string;
  assignedToStaffName?: string;
  assignedDepartmentId?: string;
  assignedDepartmentName?: string;
  dueDate: string; // YYYY-MM-DD
  resolvedAt?: string;
  closedAt?: string;
  resolutionSummary?: string;
  relatedInvoiceId?: string;
  relatedInvoiceNumber?: string;
  relatedTransportRoute?: string;
  leaveDetails?: RequestLeaveDetails;
  attachmentName?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type RequestCommentType = 'PUBLIC_COMMENT' | 'INTERNAL_NOTE';

export interface RequestComment {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  type: RequestCommentType;
  attachmentUrl?: string;
  createdAt: string;
}

export interface RequestStatusHistory {
  id: string;
  requestId: string;
  previousStatus: RequestStatus;
  newStatus: RequestStatus;
  changedById: string;
  changedByName: string;
  changedByRole: string;
  reason: string;
  timestamp: string;
}

export interface RequestAttachment {
  id: string;
  requestId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface RequestSLAConfig {
  priority: RequestPriority;
  businessDays: number;
}
