import {
  Department,
  Designation,
  Staff,
  StaffAttendance,
  StaffLeave,
  StaffDocument,
  StaffPerformance,
  PayrollProfile,
  StaffAnnouncement,
} from '../types/staff';
import { User } from '../types';
import {
  initialDepartments,
  initialDesignations,
  initialStaff,
  initialStaffAttendance,
  initialStaffLeaves,
  initialStaffDocuments,
  initialStaffPerformances,
  initialPayrollProfiles,
  initialStaffAnnouncements,
} from '../data/staffSeedData';
import { dataService } from './dataService';

const STORAGE_KEYS = {
  DEPARTMENTS: 'saia_staff_departments',
  DESIGNATIONS: 'saia_staff_designations',
  STAFF: 'saia_staff_members',
  ATTENDANCE: 'saia_staff_attendance',
  LEAVES: 'saia_staff_leaves',
  DOCUMENTS: 'saia_staff_documents',
  PERFORMANCE: 'saia_staff_performance',
  PAYROLL: 'saia_staff_payroll',
  ANNOUNCEMENTS: 'saia_staff_announcements',
};

class StaffService {
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
      actor: actor ? actor.name : 'HR Administrator',
      role: actor ? actor.roleTitle : 'System Administrator',
      details,
      entityType: 'announcement',
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
      priority: 'normal',
      targetRole: targetRole || 'all',
      targetUserId,
      relatedModule: 'announcements',
    });
  }

  // --- Department Management ---
  getDepartments(schoolId: string = 'SCH-001'): Department[] {
    const departments = this.load<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    return departments.filter((d) => d.schoolId === schoolId);
  }

  addDepartment(data: Omit<Department, 'id' | 'staffCount'>, actor?: User): Department {
    const departments = this.load<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    const newDept: Department = {
      ...data,
      id: `DEP-${Date.now().toString().slice(-4)}`,
      staffCount: 0,
    };
    departments.push(newDept);
    this.save(STORAGE_KEYS.DEPARTMENTS, departments);
    this.logAudit('Department Created', `Created department ${newDept.name} (${newDept.code})`, actor);
    return newDept;
  }

  updateDepartment(id: string, updates: Partial<Department>, actor?: User): Department {
    const departments = this.load<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    const idx = departments.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Department ${id} not found.`);

    departments[idx] = { ...departments[idx], ...updates };
    this.save(STORAGE_KEYS.DEPARTMENTS, departments);
    this.logAudit('Department Updated', `Updated department ${departments[idx].name}`, actor);
    return departments[idx];
  }

  // --- Designation Management ---
  getDesignations(schoolId: string = 'SCH-001'): Designation[] {
    const designations = this.load<Designation[]>(STORAGE_KEYS.DESIGNATIONS, initialDesignations);
    return designations.filter((d) => d.schoolId === schoolId);
  }

  addDesignation(data: Omit<Designation, 'id'>, actor?: User): Designation {
    const designations = this.load<Designation[]>(STORAGE_KEYS.DESIGNATIONS, initialDesignations);
    const newDes: Designation = {
      ...data,
      id: `DES-${Date.now().toString().slice(-4)}`,
    };
    designations.push(newDes);
    this.save(STORAGE_KEYS.DESIGNATIONS, designations);
    this.logAudit('Designation Created', `Created designation ${newDes.title}`, actor);
    return newDes;
  }

  // --- Staff Management ---
  getAllStaff(schoolId: string = 'SCH-001'): Staff[] {
    const staff = this.load<Staff[]>(STORAGE_KEYS.STAFF, initialStaff);
    return staff.filter((s) => s.schoolId === schoolId);
  }

  getStaffById(id: string): Staff | undefined {
    return this.getAllStaff().find((s) => s.id === id || s.employeeId === id || s.teacherId === id);
  }

  addStaff(
    staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>,
    actor?: User
  ): Staff {
    const all = this.load<Staff[]>(STORAGE_KEYS.STAFF, initialStaff);
    const newStaff: Staff = {
      ...staffData,
      id: `STF-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    all.push(newStaff);
    this.save(STORAGE_KEYS.STAFF, all);

    // If teaching staff, synchronize with existing Teacher model in dataService
    if (newStaff.isTeachingStaff && !newStaff.teacherId) {
      const createdTeacher = dataService.addTeacher({
        name: `${newStaff.firstName} ${newStaff.lastName}`,
        email: newStaff.email,
        phone: newStaff.phone,
        department: newStaff.departmentName,
        qualification: newStaff.qualification,
        joiningDate: newStaff.joiningDate,
        profilePhoto: newStaff.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        subjects: newStaff.subjects || ['General Studies'],
        assignedClasses: [],
        status: 'Active',
      });
      newStaff.teacherId = createdTeacher.id;
      // Re-save with linked teacherId
      const currentIdx = all.findIndex((s) => s.id === newStaff.id);
      if (currentIdx !== -1) {
        all[currentIdx].teacherId = createdTeacher.id;
        this.save(STORAGE_KEYS.STAFF, all);
      }
    }

    this.logAudit(
      'Staff Enrolled',
      `Registered employee ${newStaff.firstName} ${newStaff.lastName} (${newStaff.employeeId}) as ${newStaff.designationTitle}`,
      actor
    );

    return newStaff;
  }

  updateStaff(id: string, updates: Partial<Staff>, actor?: User): Staff {
    const all = this.load<Staff[]>(STORAGE_KEYS.STAFF, initialStaff);
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Staff member ${id} not found.`);

    all[idx] = {
      ...all[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.save(STORAGE_KEYS.STAFF, all);

    // Synchronize updates to linked teacher if exists
    if (all[idx].teacherId) {
      dataService.updateTeacher(all[idx].teacherId!, {
        name: `${all[idx].firstName} ${all[idx].lastName}`,
        email: all[idx].email,
        phone: all[idx].phone,
        qualification: all[idx].qualification,
        department: all[idx].departmentName,
      });
    }

    this.logAudit(
      'Staff Profile Updated',
      `Updated profile for ${all[idx].firstName} ${all[idx].lastName} (${all[idx].employeeId})`,
      actor
    );

    return all[idx];
  }

  archiveStaff(id: string, reason: string, actor?: User): Staff {
    return this.updateStaff(id, { status: 'RESIGNED', notes: `Archived/Resigned: ${reason}` }, actor);
  }

  // --- Staff Attendance ---
  getAttendance(date?: string, schoolId: string = 'SCH-001'): StaffAttendance[] {
    const attendance = this.load<StaffAttendance[]>(STORAGE_KEYS.ATTENDANCE, initialStaffAttendance);
    const filtered = attendance.filter((a) => a.schoolId === schoolId);
    if (date) {
      return filtered.filter((a) => a.date === date);
    }
    return filtered;
  }

  recordAttendance(
    data: Omit<StaffAttendance, 'id' | 'recordedAt'>,
    actor?: User
  ): StaffAttendance {
    const all = this.load<StaffAttendance[]>(STORAGE_KEYS.ATTENDANCE, initialStaffAttendance);

    // Prevent duplicate attendance for same staff member and date
    const existingIndex = all.findIndex(
      (a) => a.staffId === data.staffId && a.date === data.date
    );

    if (existingIndex !== -1) {
      all[existingIndex] = {
        ...all[existingIndex],
        status: data.status,
        checkInTime: data.checkInTime || all[existingIndex].checkInTime,
        checkOutTime: data.checkOutTime || all[existingIndex].checkOutTime,
        remarks: data.remarks || all[existingIndex].remarks,
        recordedBy: actor?.name || data.recordedBy,
        recordedAt: new Date().toISOString(),
      };
      this.save(STORAGE_KEYS.ATTENDANCE, all);
      this.logAudit(
        'Staff Attendance Updated',
        `Attendance for ${data.staffName} on ${data.date} updated to ${data.status}`,
        actor
      );
      return all[existingIndex];
    }

    const newRecord: StaffAttendance = {
      ...data,
      id: `SATT-${Date.now().toString().slice(-4)}`,
      recordedAt: new Date().toISOString(),
    };
    all.unshift(newRecord);
    this.save(STORAGE_KEYS.ATTENDANCE, all);

    this.logAudit(
      'Staff Attendance Marked',
      `Attendance for ${data.staffName} on ${data.date} marked as ${data.status}`,
      actor
    );

    return newRecord;
  }

  // --- Staff Leave Management ---
  getLeaves(schoolId: string = 'SCH-001'): StaffLeave[] {
    const leaves = this.load<StaffLeave[]>(STORAGE_KEYS.LEAVES, initialStaffLeaves);
    return leaves.filter((l) => l.schoolId === schoolId);
  }

  submitLeaveRequest(
    leaveData: Omit<StaffLeave, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
    actor?: User
  ): StaffLeave {
    if (new Date(leaveData.toDate) < new Date(leaveData.fromDate)) {
      throw new Error('Leave end date cannot be prior to start date.');
    }

    const leaves = this.load<StaffLeave[]>(STORAGE_KEYS.LEAVES, initialStaffLeaves);
    const newLeave: StaffLeave = {
      ...leaveData,
      id: `SLEAVE-${Date.now().toString().slice(-4)}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leaves.unshift(newLeave);
    this.save(STORAGE_KEYS.LEAVES, leaves);

    this.logAudit(
      'Staff Leave Submitted',
      `${newLeave.staffName} requested ${newLeave.numberOfDays} day(s) ${newLeave.leaveType} leave (${newLeave.fromDate} to ${newLeave.toDate})`,
      actor
    );

    this.dispatchNotification(
      'Staff Leave Request Received',
      `${newLeave.staffName} submitted a ${newLeave.leaveType} leave application for ${newLeave.fromDate}.`,
      'principal'
    );

    return newLeave;
  }

  reviewLeaveRequest(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
    comments: string,
    actor?: User
  ): StaffLeave {
    const leaves = this.load<StaffLeave[]>(STORAGE_KEYS.LEAVES, initialStaffLeaves);
    const idx = leaves.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Leave application ${id} not found.`);

    leaves[idx].status = status;
    leaves[idx].reviewerId = actor?.id;
    leaves[idx].reviewerName = actor?.name || 'HR Executive';
    leaves[idx].reviewDate = new Date().toISOString().split('T')[0];
    leaves[idx].reviewerComments = comments;
    leaves[idx].updatedAt = new Date().toISOString();

    this.save(STORAGE_KEYS.LEAVES, leaves);

    // If approved, update staff status to ON_LEAVE if the leave is currently active today
    const today = new Date().toISOString().split('T')[0];
    if (status === 'APPROVED' && leaves[idx].fromDate <= today && leaves[idx].toDate >= today) {
      this.updateStaff(leaves[idx].staffId, { status: 'ON_LEAVE' }, actor);
    }

    this.logAudit(
      `Staff Leave ${status}`,
      `Leave request ${id} for ${leaves[idx].staffName} was ${status}. Notes: ${comments}`,
      actor
    );

    this.dispatchNotification(
      `Staff Leave Application ${status}`,
      `Your leave application for ${leaves[idx].fromDate} to ${leaves[idx].toDate} was ${status}. Comments: ${comments}`,
      'teacher',
      leaves[idx].staffId
    );

    return leaves[idx];
  }

  // --- Staff Documents ---
  getDocuments(staffId?: string, schoolId: string = 'SCH-001'): StaffDocument[] {
    const docs = this.load<StaffDocument[]>(STORAGE_KEYS.DOCUMENTS, initialStaffDocuments);
    const filtered = docs.filter((d) => d.schoolId === schoolId);
    if (staffId) {
      return filtered.filter((d) => d.staffId === staffId);
    }
    return filtered;
  }

  addDocument(
    data: Omit<StaffDocument, 'id' | 'uploadedDate' | 'status'>,
    actor?: User
  ): StaffDocument {
    const docs = this.load<StaffDocument[]>(STORAGE_KEYS.DOCUMENTS, initialStaffDocuments);

    let docStatus: 'Valid' | 'Expiring Soon' | 'Expired' = 'Valid';
    if (data.expiryDate) {
      const exp = new Date(data.expiryDate);
      const now = new Date();
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDays < 0) docStatus = 'Expired';
      else if (diffDays <= 30) docStatus = 'Expiring Soon';
    }

    const newDoc: StaffDocument = {
      ...data,
      id: `DOC-${Date.now().toString().slice(-4)}`,
      uploadedDate: new Date().toISOString().split('T')[0],
      status: docStatus,
    };

    docs.unshift(newDoc);
    this.save(STORAGE_KEYS.DOCUMENTS, docs);

    this.logAudit(
      'Staff Document Uploaded',
      `Uploaded ${newDoc.documentName} for ${newDoc.staffName} (${newDoc.documentType})`,
      actor
    );

    return newDoc;
  }

  // --- Performance Management ---
  getPerformances(staffId?: string, schoolId: string = 'SCH-001'): StaffPerformance[] {
    const reviews = this.load<StaffPerformance[]>(STORAGE_KEYS.PERFORMANCE, initialStaffPerformances);
    const filtered = reviews.filter((p) => p.schoolId === schoolId);
    if (staffId) {
      return filtered.filter((p) => p.staffId === staffId);
    }
    return filtered;
  }

  savePerformanceReview(
    data: Omit<StaffPerformance, 'id'>,
    actor?: User
  ): StaffPerformance {
    const reviews = this.load<StaffPerformance[]>(STORAGE_KEYS.PERFORMANCE, initialStaffPerformances);
    const newReview: StaffPerformance = {
      ...data,
      id: `PERF-${Date.now().toString().slice(-4)}`,
    };

    reviews.unshift(newReview);
    this.save(STORAGE_KEYS.PERFORMANCE, reviews);

    this.logAudit(
      'Performance Appraisal Recorded',
      `Recorded performance review for ${newReview.staffName} (${newReview.reviewPeriod}) with overall score ${newReview.overallRating}/5.0`,
      actor
    );

    return newReview;
  }

  // --- Payroll Profiles (Confidential) ---
  getPayrollProfile(staffId: string, currentUser?: User): PayrollProfile | undefined {
    // Enforce authorization
    if (currentUser) {
      const allowedRoles = ['super_admin', 'principal', 'accountant'];
      const hasPerm =
        allowedRoles.includes(currentUser.role) ||
        currentUser.permissions.includes('staff.salary.view');
      if (!hasPerm) {
        throw new Error('Unauthorized: You do not have permission to view confidential payroll records.');
      }
    }

    const profiles = this.load<PayrollProfile[]>(STORAGE_KEYS.PAYROLL, initialPayrollProfiles);
    return profiles.find((p) => p.staffId === staffId);
  }

  savePayrollProfile(profile: PayrollProfile, actor?: User): PayrollProfile {
    if (actor) {
      const allowedRoles = ['super_admin', 'principal', 'accountant'];
      const hasPerm =
        allowedRoles.includes(actor.role) ||
        actor.permissions.includes('staff.salary.manage');
      if (!hasPerm) {
        throw new Error('Unauthorized: You do not have permission to modify payroll parameters.');
      }
    }

    const profiles = this.load<PayrollProfile[]>(STORAGE_KEYS.PAYROLL, initialPayrollProfiles);
    const idx = profiles.findIndex((p) => p.staffId === profile.staffId);
    if (idx !== -1) {
      profiles[idx] = profile;
    } else {
      profiles.push(profile);
    }

    this.save(STORAGE_KEYS.PAYROLL, profiles);

    this.logAudit(
      'Payroll Structure Updated',
      `Updated compensation profile for staff ${profile.staffId} (${profile.salaryType})`,
      actor
    );

    return profile;
  }

  // --- Staff Announcements ---
  getAnnouncements(schoolId: string = 'SCH-001'): StaffAnnouncement[] {
    const ann = this.load<StaffAnnouncement[]>(STORAGE_KEYS.ANNOUNCEMENTS, initialStaffAnnouncements);
    return ann.filter((a) => a.schoolId === schoolId);
  }

  publishAnnouncement(
    data: Omit<StaffAnnouncement, 'id' | 'createdAt'>,
    actor?: User
  ): StaffAnnouncement {
    const ann = this.load<StaffAnnouncement[]>(STORAGE_KEYS.ANNOUNCEMENTS, initialStaffAnnouncements);
    const newAnn: StaffAnnouncement = {
      ...data,
      id: `SANN-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };

    ann.unshift(newAnn);
    this.save(STORAGE_KEYS.ANNOUNCEMENTS, ann);

    this.logAudit(
      'Staff Announcement Published',
      `Published staff bulletin: "${newAnn.title}" [Priority: ${newAnn.priority}]`,
      actor
    );

    this.dispatchNotification(
      newAnn.title,
      newAnn.content,
      newAnn.audience === 'TEACHERS' ? 'teacher' : 'all'
    );

    return newAnn;
  }

  // --- HR Dashboard Metrics ---
  getHRDashboardStats() {
    const staff = this.getAllStaff();
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = this.getAttendance(today);
    const leaves = this.getLeaves();
    const docs = this.getDocuments();
    const departments = this.getDepartments();

    const totalStaff = staff.length;
    const activeStaff = staff.filter((s) => s.status === 'ACTIVE').length;
    const teachersCount = staff.filter((s) => s.isTeachingStaff).length;
    const nonTeachingCount = totalStaff - teachersCount;
    const onLeaveCount = staff.filter((s) => s.status === 'ON_LEAVE').length;

    const presentToday = todayAttendance.filter((a) => a.status === 'PRESENT').length;
    const attendancePercentage = totalStaff > 0 ? Math.round((presentToday / totalStaff) * 100) : 0;

    const pendingLeaves = leaves.filter((l) => l.status === 'PENDING').length;
    const expiringDocs = docs.filter((d) => d.status === 'Expiring Soon' || d.status === 'Expired').length;

    return {
      totalStaff,
      activeStaff,
      teachersCount,
      nonTeachingCount,
      onLeaveCount,
      attendancePercentage,
      presentToday,
      pendingLeaves,
      expiringDocs,
      departmentsCount: departments.length,
    };
  }
}

export const staffService = new StaffService();
