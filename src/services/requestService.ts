import {
  RequestCategory,
  RequestTicket,
  RequestComment,
  RequestStatusHistory,
  RequestPriority,
  RequestStatus,
  RequestSLAConfig,
} from '../types/request';
import { User } from '../types';
import {
  initialRequestCategories,
  initialRequests,
  initialRequestComments,
  initialRequestStatusHistory,
  initialSLAConfigs,
} from '../data/requestSeedData';
import { dataService } from './dataService';
import { timetableService } from './timetableService';
import { staffService } from './staffService';

const STORAGE_KEYS = {
  CATEGORIES: 'saia_request_categories',
  REQUESTS: 'saia_request_tickets',
  COMMENTS: 'saia_request_comments',
  HISTORY: 'saia_request_history',
  SLA_CONFIGS: 'saia_request_sla_configs',
  LAST_SEQ: 'saia_request_last_seq',
};

class RequestService {
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

  private logAudit(action: string, details: string, actor?: User): void {
    dataService.logActivity({
      action,
      actor: actor ? actor.name : 'Helpdesk Coordinator',
      role: actor ? actor.roleTitle : 'System Administrator',
      details,
      entityType: 'student',
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
      type: 'request_status',
      priority: 'high',
      targetRole: targetRole || 'all',
      targetUserId,
      relatedModule: 'parent_portal',
    });
  }

  // --- Categories ---
  getCategories(schoolId: string = 'SCH-001'): RequestCategory[] {
    const categories = this.load<RequestCategory[]>(STORAGE_KEYS.CATEGORIES, initialRequestCategories);
    return categories.filter((c) => c.schoolId === schoolId);
  }

  getCategoryById(id: string): RequestCategory | undefined {
    return this.getCategories().find((c) => c.id === id || c.code === id);
  }

  // --- SLA Config ---
  getSLAConfigs(): RequestSLAConfig[] {
    return this.load<RequestSLAConfig[]>(STORAGE_KEYS.SLA_CONFIGS, initialSLAConfigs);
  }

  calculateDueDate(priority: RequestPriority): string {
    const configs = this.getSLAConfigs();
    const config = configs.find((c) => c.priority === priority) || { businessDays: 2 };
    const date = new Date();
    // Add business days (skip weekends)
    let added = 0;
    while (added < config.businessDays) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      if (day !== 0 && day !== 6) {
        added++;
      }
    }
    return date.toISOString().split('T')[0];
  }

  getSLAStatus(request: RequestTicket): 'ON_TIME' | 'DUE_SOON' | 'OVERDUE' {
    if (request.status === 'RESOLVED' || request.status === 'CLOSED' || request.status === 'CANCELLED') {
      return 'ON_TIME';
    }

    const today = new Date().toISOString().split('T')[0];
    if (today > request.dueDate) {
      return 'OVERDUE';
    }
    if (today === request.dueDate) {
      return 'DUE_SOON';
    }
    return 'ON_TIME';
  }

  // --- Sequential Request Number ---
  private getNextRequestNumber(): string {
    const year = new Date().getFullYear();
    const currentSeq = this.load<number>(STORAGE_KEYS.LAST_SEQ, 6);
    const nextSeq = currentSeq + 1;
    this.save(STORAGE_KEYS.LAST_SEQ, nextSeq);
    return `REQ-${year}-${nextSeq.toString().padStart(5, '0')}`;
  }

  // --- Requests CRUD ---
  getRequests(currentUser?: User, schoolId: string = 'SCH-001'): RequestTicket[] {
    const requests = this.load<RequestTicket[]>(STORAGE_KEYS.REQUESTS, initialRequests);
    const schoolRequests = requests.filter((r) => r.schoolId === schoolId);

    if (!currentUser) return schoolRequests;

    // RBAC Security Filter at Data Layer:
    // Parents can only view their own requests
    if (currentUser.role === 'parent') {
      return schoolRequests.filter(
        (r) =>
          r.requesterUserId === currentUser.id ||
          r.requesterName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          (currentUser.parentId && r.requesterUserId.includes(currentUser.parentId))
      );
    }

    // Students can only view requests linked to their student profile
    if (currentUser.role === 'student') {
      return schoolRequests.filter(
        (r) => r.studentId === currentUser.studentId || r.requesterUserId === currentUser.id
      );
    }

    // Teachers can view:
    // 1. Their own submitted leave/requests
    // 2. Requests assigned directly to them
    // 3. General academic requests for their classes
    if (currentUser.role === 'teacher') {
      return schoolRequests.filter(
        (r) =>
          r.requesterUserId === currentUser.id ||
          r.assignedToStaffId === currentUser.teacherId ||
          r.assignedToStaffId === currentUser.id ||
          r.categoryCode === 'TEACHER_LEAVE' ||
          r.categoryCode === 'STUDENT_LEAVE'
      );
    }

    // Admins, Principals, Super Admins, Accountants see all requests scoped to their permissions
    return schoolRequests;
  }

  getRequestById(id: string): RequestTicket | undefined {
    const requests = this.load<RequestTicket[]>(STORAGE_KEYS.REQUESTS, initialRequests);
    return requests.find((r) => r.id === id || r.requestNumber === id);
  }

  createRequest(
    data: Omit<
      RequestTicket,
      'id' | 'requestNumber' | 'status' | 'dueDate' | 'createdAt' | 'updatedAt'
    >,
    actor?: User
  ): RequestTicket {
    const requests = this.load<RequestTicket[]>(STORAGE_KEYS.REQUESTS, initialRequests);
    const category = this.getCategoryById(data.categoryId);
    const dueDate = this.calculateDueDate(data.priority);
    const requestNumber = this.getNextRequestNumber();

    let affectedClassesCount = 0;
    // If this is teacher leave, automatically check affected classes
    if (data.categoryCode === 'TEACHER_LEAVE' && data.leaveDetails) {
      if (actor?.teacherId) {
        const teacherTimetable = timetableService.getTeacherTimetable(actor.teacherId);
        // Estimate affected classes count
        affectedClassesCount = Math.max(1, Math.min(teacherTimetable.length, data.leaveDetails.numberOfDays * 3));
        data.leaveDetails.affectedClassesCount = affectedClassesCount;
      }
    }

    const newTicket: RequestTicket = {
      ...data,
      id: `REQ-${Date.now().toString().slice(-4)}`,
      requestNumber,
      status: 'NEW',
      dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    requests.unshift(newTicket);
    this.save(STORAGE_KEYS.REQUESTS, requests);

    // Record initial history
    this.addHistoryRecord(newTicket.id, 'NEW', 'NEW', actor, 'Ticket submitted by requester');

    this.logAudit(
      'Request Created',
      `Submitted ticket ${newTicket.requestNumber}: "${newTicket.subject}" [Category: ${newTicket.categoryName}, Priority: ${newTicket.priority}]`,
      actor
    );

    this.dispatchNotification(
      `New Request: ${newTicket.requestNumber}`,
      `${newTicket.requesterName} submitted a ${newTicket.categoryName} (${newTicket.priority} Priority): "${newTicket.subject}".`,
      category?.assignedDepartmentId === 'DEP-FIN' ? 'accountant' : 'admin_staff'
    );

    return newTicket;
  }

  // --- Assign Request ---
  assignRequest(
    requestId: string,
    staffId: string,
    staffName: string,
    departmentId?: string,
    departmentName?: string,
    actor?: User
  ): RequestTicket {
    const requests = this.load<RequestTicket[]>(STORAGE_KEYS.REQUESTS, initialRequests);
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error(`Request ${requestId} not found.`);

    const prevStatus = requests[idx].status;
    const nextStatus: RequestStatus = 'ASSIGNED';

    requests[idx].assignedToStaffId = staffId;
    requests[idx].assignedToStaffName = staffName;
    if (departmentId) requests[idx].assignedDepartmentId = departmentId;
    if (departmentName) requests[idx].assignedDepartmentName = departmentName;
    requests[idx].status = nextStatus;
    requests[idx].updatedAt = new Date().toISOString();

    this.save(STORAGE_KEYS.REQUESTS, requests);

    this.addHistoryRecord(
      requestId,
      prevStatus,
      nextStatus,
      actor,
      `Assigned to ${staffName} (${departmentName || 'Department'})`
    );

    this.logAudit(
      'Request Assigned',
      `Assigned ticket ${requests[idx].requestNumber} to ${staffName}`,
      actor
    );

    this.dispatchNotification(
      `Ticket Assigned: ${requests[idx].requestNumber}`,
      `You have been assigned ticket ${requests[idx].requestNumber}: "${requests[idx].subject}".`,
      'teacher',
      staffId
    );

    return requests[idx];
  }

  // --- Update Request Status & Workflow Rules ---
  updateRequestStatus(
    requestId: string,
    newStatus: RequestStatus,
    reason: string,
    resolutionSummary?: string,
    actor?: User
  ): RequestTicket {
    const requests = this.load<RequestTicket[]>(STORAGE_KEYS.REQUESTS, initialRequests);
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error(`Request ${requestId} not found.`);

    const ticket = requests[idx];
    const prevStatus = ticket.status;

    // Workflow rule validation:
    if (newStatus === 'CLOSED' && prevStatus !== 'RESOLVED' && prevStatus !== 'REJECTED') {
      throw new Error('A request must be in RESOLVED or REJECTED status before it can be formally CLOSED.');
    }

    ticket.status = newStatus;
    ticket.updatedAt = new Date().toISOString();

    if (newStatus === 'RESOLVED') {
      ticket.resolvedAt = new Date().toISOString();
      if (resolutionSummary) ticket.resolutionSummary = resolutionSummary;

      // Special Integrated Actions:
      // 1. If STUDENT_LEAVE is approved/resolved:
      if (ticket.categoryCode === 'STUDENT_LEAVE' && ticket.studentId && ticket.leaveDetails) {
        // Automatically excuse attendance in central register
        const student = dataService.getStudentById(ticket.studentId);
        const studentFullName = student ? `${student.firstName} ${student.lastName}` : 'Student';
        dataService.recordAttendance({
          date: ticket.leaveDetails.fromDate,
          studentId: ticket.studentId,
          studentName: ticket.studentName || studentFullName,
          classId: student?.classId || 'CLS-001',
          className: student?.className || 'Class',
          sectionId: student?.sectionId || 'SEC-001',
          sectionName: student?.sectionName || 'Section A',
          status: 'Excused',
          remarks: `Excused leave approved (Ticket ${ticket.requestNumber}: ${ticket.leaveDetails.reason})`,
          recordedBy: actor ? actor.name : 'Attendance System',
        });
      }

      // 2. If TEACHER_LEAVE is resolved:
      if (ticket.categoryCode === 'TEACHER_LEAVE' && ticket.leaveDetails) {
        // If staff member exists, create approved staff leave record
        const staffList = staffService.getAllStaff();
        const staff = staffList.find(
          (s) => s.userId === ticket.requesterUserId || s.employeeId === ticket.requesterUserId
        );
        if (staff) {
          staffService.submitLeaveRequest(
            {
              schoolId: ticket.schoolId,
              staffId: staff.id,
              staffName: `${staff.firstName} ${staff.lastName}`,
              employeeId: staff.employeeId,
              leaveType: (ticket.leaveDetails.leaveType as any) || 'CASUAL',
              fromDate: ticket.leaveDetails.fromDate,
              toDate: ticket.leaveDetails.toDate,
              numberOfDays: ticket.leaveDetails.numberOfDays,
              reason: ticket.leaveDetails.reason,
              reviewerComments: resolutionSummary,
            },
            actor
          );
        }
      }
    }

    if (newStatus === 'CLOSED') {
      ticket.closedAt = new Date().toISOString();
    }

    this.save(STORAGE_KEYS.REQUESTS, requests);

    this.addHistoryRecord(requestId, prevStatus, newStatus, actor, reason);

    this.logAudit(
      'Request Status Changed',
      `Ticket ${ticket.requestNumber} transition: ${prevStatus} -> ${newStatus}. Reason: ${reason}`,
      actor
    );

    this.dispatchNotification(
      `Ticket Status Updated: ${ticket.requestNumber}`,
      `Your request "${ticket.subject}" is now ${newStatus}. ${resolutionSummary ? `Summary: ${resolutionSummary}` : ''}`,
      ticket.requesterRole === 'Parent' ? 'parent' : 'teacher',
      ticket.requesterUserId
    );

    return ticket;
  }

  // --- Assign Cover / Substitute Teacher for Teacher Leave Request ---
  assignSubstituteTeacher(
    requestId: string,
    substituteTeacherId: string,
    substituteTeacherName: string,
    periodId: string,
    periodName: string,
    classId: string,
    className: string,
    sectionId: string,
    sectionName: string,
    subjectId: string,
    subjectName: string,
    roomId: string,
    roomName: string,
    actor?: User
  ): RequestTicket {
    const requests = this.load<RequestTicket[]>(STORAGE_KEYS.REQUESTS, initialRequests);
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error(`Request ${requestId} not found.`);

    const ticket = requests[idx];
    if (!ticket.leaveDetails) {
      ticket.leaveDetails = {
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        numberOfDays: 1,
        reason: 'Staff leave cover',
      };
    }

    // Call timetableService to create cover substitution
    timetableService.createSubstitution(
      {
        schoolId: ticket.schoolId,
        originalTeacherId: ticket.requesterUserId,
        originalTeacherName: ticket.requesterName,
        substituteTeacherId,
        substituteTeacherName,
        date: ticket.leaveDetails.fromDate,
        periodId,
        periodName,
        classId,
        className,
        sectionId,
        sectionName,
        subjectId,
        subjectName,
        roomId,
        roomName,
        reason: `Leave Cover (Ticket ${ticket.requestNumber})`,
        status: 'ASSIGNED',
      },
      actor
    );

    ticket.leaveDetails.substituteTeacherAssigned = true;
    ticket.leaveDetails.substituteTeacherId = substituteTeacherId;
    ticket.leaveDetails.substituteTeacherName = substituteTeacherName;
    ticket.updatedAt = new Date().toISOString();

    this.save(STORAGE_KEYS.REQUESTS, requests);

    // Add internal note to ticket
    this.addComment(
      requestId,
      `Cover teacher ${substituteTeacherName} has been assigned for ${className} ${sectionName} (${subjectName}) on ${ticket.leaveDetails.fromDate}.`,
      'INTERNAL_NOTE',
      actor
    );

    return ticket;
  }

  // --- Comments & Internal Notes ---
  getComments(requestId: string, currentUser?: User): RequestComment[] {
    const comments = this.load<RequestComment[]>(STORAGE_KEYS.COMMENTS, initialRequestComments);
    const ticketComments = comments.filter((c) => c.requestId === requestId);

    // Strictly enforce confidentiality: Parents and students can NEVER see INTERNAL_NOTE
    if (currentUser && (currentUser.role === 'parent' || currentUser.role === 'student')) {
      return ticketComments.filter((c) => c.type === 'PUBLIC_COMMENT');
    }

    return ticketComments;
  }

  addComment(
    requestId: string,
    content: string,
    type: 'PUBLIC_COMMENT' | 'INTERNAL_NOTE' = 'PUBLIC_COMMENT',
    actor?: User,
    attachmentUrl?: string
  ): RequestComment {
    const comments = this.load<RequestComment[]>(STORAGE_KEYS.COMMENTS, initialRequestComments);
    const newComment: RequestComment = {
      id: `RCOM-${Date.now().toString().slice(-4)}`,
      requestId,
      authorId: actor ? actor.id : 'USR-001',
      authorName: actor ? actor.name : 'Support Staff',
      authorRole: actor ? actor.roleTitle : 'Administrator',
      content,
      type,
      attachmentUrl,
      createdAt: new Date().toISOString(),
    };

    comments.push(newComment);
    this.save(STORAGE_KEYS.COMMENTS, comments);

    const ticket = this.getRequestById(requestId);
    if (ticket) {
      ticket.updatedAt = new Date().toISOString();
      const requests = this.load<RequestTicket[]>(STORAGE_KEYS.REQUESTS, initialRequests);
      const tIdx = requests.findIndex((r) => r.id === requestId);
      if (tIdx !== -1) {
        requests[tIdx].updatedAt = new Date().toISOString();
        this.save(STORAGE_KEYS.REQUESTS, requests);
      }
    }

    this.logAudit(
      type === 'INTERNAL_NOTE' ? 'Internal Staff Note Added' : 'Ticket Comment Added',
      `Added ${type} to ticket ${ticket?.requestNumber || requestId}`,
      actor
    );

    return newComment;
  }

  // --- Status History ---
  getStatusHistory(requestId: string): RequestStatusHistory[] {
    const history = this.load<RequestStatusHistory[]>(STORAGE_KEYS.HISTORY, initialRequestStatusHistory);
    return history.filter((h) => h.requestId === requestId);
  }

  private addHistoryRecord(
    requestId: string,
    previousStatus: RequestStatus,
    newStatus: RequestStatus,
    actor?: User,
    reason: string = 'Status updated'
  ): void {
    const history = this.load<RequestStatusHistory[]>(STORAGE_KEYS.HISTORY, initialRequestStatusHistory);
    history.push({
      id: `RSH-${Date.now().toString().slice(-4)}`,
      requestId,
      previousStatus,
      newStatus,
      changedById: actor ? actor.id : 'SYS',
      changedByName: actor ? actor.name : 'System Automation',
      changedByRole: actor ? actor.roleTitle : 'System',
      reason,
      timestamp: new Date().toISOString(),
    });
    this.save(STORAGE_KEYS.HISTORY, history);
  }

  // --- Dashboard Metrics ---
  getDashboardMetrics(schoolId: string = 'SCH-001') {
    const requests = this.load<RequestTicket[]>(STORAGE_KEYS.REQUESTS, initialRequests).filter(
      (r) => r.schoolId === schoolId
    );
    const categories = this.getCategories(schoolId);

    const total = requests.length;
    const newCount = requests.filter((r) => r.status === 'NEW').length;
    const openCount = requests.filter((r) => r.status === 'OPEN').length;
    const assignedCount = requests.filter((r) => r.status === 'ASSIGNED').length;
    const inProgressCount = requests.filter((r) => r.status === 'IN_PROGRESS').length;
    const waitingCount = requests.filter((r) => r.status === 'WAITING_FOR_USER').length;
    const resolvedCount = requests.filter((r) => r.status === 'RESOLVED').length;
    const closedCount = requests.filter((r) => r.status === 'CLOSED').length;
    const urgentCount = requests.filter((r) => r.priority === 'URGENT' && r.status !== 'RESOLVED' && r.status !== 'CLOSED').length;

    const overdueCount = requests.filter((r) => this.getSLAStatus(r) === 'OVERDUE').length;

    // Requests by Category
    const categoryStats = categories.map((cat) => {
      const count = requests.filter((r) => r.categoryId === cat.id || r.categoryCode === cat.code).length;
      return {
        categoryName: cat.name,
        code: cat.code,
        count,
      };
    });

    // Department Distribution
    const departmentStats: Record<string, number> = {};
    requests.forEach((r) => {
      const dept = r.assignedDepartmentName || 'Unassigned';
      departmentStats[dept] = (departmentStats[dept] || 0) + 1;
    });

    return {
      total,
      newCount,
      openCount,
      assignedCount,
      inProgressCount,
      waitingCount,
      resolvedCount,
      closedCount,
      urgentCount,
      overdueCount,
      categoryStats,
      departmentStats,
      averageResolutionDays: '1.4 Days',
    };
  }
}

export const requestService = new RequestService();
