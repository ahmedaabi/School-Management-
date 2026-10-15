import {
  AdmissionApplication,
  AdmissionStatus,
  DocumentType,
  DocumentVerificationStatus,
  AdmissionDocument,
  AdmissionInterview,
  AdmissionTest,
  InterviewRecommendation,
  ApplicationStatusHistory,
  AdmissionNote,
  WaitlistPriority,
  WaitlistEntry,
  ClassAdmissionCapacity,
  AdmissionSettings,
  AdmissionAutomationRule,
  AdmissionAutomationLog,
  AdmissionAuditLog,
  ApplicationSource,
} from '../types/admission';
import { User, Student } from '../types';
import {
  initialAdmissionApplications,
  initialAdmissionSettings,
  initialAdmissionAutomationRules,
  initialAdmissionAutomationLogs,
  initialAdmissionAuditLogs,
  initialClassCapacities,
  initialWaitlist,
} from '../data/admissionSeedData';
import { dataService } from './dataService';
import { financeService } from './financeService';

const STORAGE_KEYS = {
  APPLICATIONS: 'saia_admission_applications',
  SETTINGS: 'saia_admission_settings',
  RULES: 'saia_admission_automation_rules',
  LOGS: 'saia_admission_automation_logs',
  AUDIT: 'saia_admission_audit_logs',
  CAPACITY: 'saia_admission_capacity',
  WAITLIST: 'saia_admission_waitlist',
  LAST_APP_SEQ: 'saia_admission_last_seq',
  LAST_ADM_SEQ: 'saia_admission_last_adm_seq',
};

class AdmissionService {
  private load<T>(key: string, defaultData: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return defaultData;
  }

  private save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignore quota errors in storage
    }
  }

  // ==========================================
  // 1. UNIQUE NUMBER GENERATORS (SERVICE LAYER)
  // ==========================================
  generateApplicationNumber(): string {
    const year = new Date().getFullYear();
    const prefix = `ADM-${year}-`;
    const apps = this.getApplications();

    let seq = this.load<number>(STORAGE_KEYS.LAST_APP_SEQ, apps.length);
    let appNumber = '';
    let isUnique = false;

    while (!isUnique) {
      seq += 1;
      appNumber = `${prefix}${String(seq).padStart(5, '0')}`;
      if (!apps.some((a) => a.applicationNumber === appNumber)) {
        isUnique = true;
      }
    }

    this.save(STORAGE_KEYS.LAST_APP_SEQ, seq);
    return appNumber;
  }

  generateAdmissionNumber(): string {
    const year = new Date().getFullYear();
    const prefix = `AD-${year}-`;
    const students = dataService.getStudents(true);
    const apps = this.getApplications();

    let seq = this.load<number>(STORAGE_KEYS.LAST_ADM_SEQ, 450 + students.length);
    let admNumber = '';
    let isUnique = false;

    while (!isUnique) {
      seq += 1;
      admNumber = `${prefix}${String(seq).padStart(5, '0')}`;
      const inStudents = students.some((s) => s.admissionNumber === admNumber);
      const inApps = apps.some((a) => a.enrolledAdmissionNumber === admNumber);
      if (!inStudents && !inApps) {
        isUnique = true;
      }
    }

    this.save(STORAGE_KEYS.LAST_ADM_SEQ, seq);
    return admNumber;
  }

  // ==========================================
  // 2. APPLICATIONS CRUD & RETRIEVAL
  // ==========================================
  getApplications(): AdmissionApplication[] {
    return this.load<AdmissionApplication[]>(STORAGE_KEYS.APPLICATIONS, initialAdmissionApplications);
  }

  getApplicationById(id: string): AdmissionApplication | undefined {
    return this.getApplications().find((a) => a.id === id || a.applicationNumber === id);
  }

  createApplication(
    formData: Omit<
      AdmissionApplication,
      | 'id'
      | 'applicationNumber'
      | 'applicantName'
      | 'applicationDate'
      | 'status'
      | 'statusHistory'
      | 'documents'
      | 'interviews'
      | 'tests'
      | 'notes'
    > & {
      documents?: AdmissionDocument[];
    },
    actor?: User
  ): AdmissionApplication {
    const applications = this.getApplications();
    const id = `APP-${Date.now()}`;
    const applicationNumber = this.generateApplicationNumber();
    const applicantName = `${formData.applicantFirstName}${
      formData.applicantMiddleName ? ' ' + formData.applicantMiddleName : ''
    } ${formData.applicantLastName}`.trim();
    const now = new Date();
    const applicationDate = now.toISOString().split('T')[0];
    const timestamp = `${applicationDate} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const defaultDocs: AdmissionDocument[] =
      formData.documents && formData.documents.length > 0
        ? formData.documents
        : [
            {
              id: `DOC-${Date.now()}-1`,
              type: 'Birth Certificate',
              fileName: 'Birth_Certificate_Submitted.pdf',
              fileSize: '1.2 MB',
              uploadedDate: applicationDate,
              verificationStatus: 'PENDING',
              notes: 'Uploaded with admission application.',
            },
            {
              id: `DOC-${Date.now()}-2`,
              type: 'Previous School Certificate',
              fileName: 'Previous_School_Report.pdf',
              fileSize: '1.8 MB',
              uploadedDate: applicationDate,
              verificationStatus: 'PENDING',
            },
            {
              id: `DOC-${Date.now()}-3`,
              type: 'Student Photo',
              fileName: 'Student_Passport_Photo.jpg',
              fileSize: '650 KB',
              uploadedDate: applicationDate,
              verificationStatus: 'PENDING',
            },
            {
              id: `DOC-${Date.now()}-4`,
              type: 'Parent/Guardian ID',
              fileName: 'Parent_Identification_Doc.pdf',
              fileSize: '950 KB',
              uploadedDate: applicationDate,
              verificationStatus: 'PENDING',
            },
          ];

    const initialHistory: ApplicationStatusHistory = {
      id: `HIS-${Date.now()}`,
      fromStatus: 'NEW',
      toStatus: 'NEW',
      changedBy: actor?.name || 'Online Admissions Portal',
      changedByRole: actor?.role || 'Applicant',
      timestamp,
      reason: 'Application submitted successfully',
    };

    const newApp: AdmissionApplication = {
      ...formData,
      id,
      applicationNumber,
      applicantName,
      applicationDate,
      status: 'NEW',
      documents: defaultDocs,
      interviews: [],
      tests: [],
      notes: [],
      statusHistory: [initialHistory],
    };

    const updated = [newApp, ...applications];
    this.save(STORAGE_KEYS.APPLICATIONS, updated);

    // Audit Log
    this.logAudit({
      user: actor?.name || 'Online Applicant',
      userRole: actor?.role || 'Parent',
      action: 'Application Created',
      entity: 'AdmissionApplication',
      entityId: id,
      newValue: 'NEW',
      details: `Created new application ${applicationNumber} for ${applicantName} in ${newApp.appliedClassName}.`,
    });

    // Activity Log
    dataService.logActivity({
      action: 'Admission Application Received',
      actor: actor?.name || newApp.parentName,
      role: 'Applicant / Parent',
      details: `Application ${applicationNumber} submitted for ${applicantName} (${newApp.appliedClassName})`,
      entityType: 'student',
    });

    // Trigger Automations
    this.executeAutomation('NEW_APPLICATION', newApp, 'Application submitted');

    return newApp;
  }

  updateApplication(id: string, updates: Partial<AdmissionApplication>, actor?: User): AdmissionApplication | undefined {
    const apps = this.getApplications();
    const idx = apps.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;

    const oldApp = apps[idx];
    const updatedApp: AdmissionApplication = {
      ...oldApp,
      ...updates,
      applicantName:
        updates.applicantFirstName || updates.applicantLastName
          ? `${updates.applicantFirstName || oldApp.applicantFirstName}${
              (updates.applicantMiddleName !== undefined ? updates.applicantMiddleName : oldApp.applicantMiddleName)
                ? ' ' + (updates.applicantMiddleName !== undefined ? updates.applicantMiddleName : oldApp.applicantMiddleName)
                : ''
            } ${updates.applicantLastName || oldApp.applicantLastName}`.trim()
          : oldApp.applicantName,
    };

    apps[idx] = updatedApp;
    this.save(STORAGE_KEYS.APPLICATIONS, apps);

    this.logAudit({
      user: actor?.name || 'Registrar',
      userRole: actor?.role || 'Admin',
      action: 'Application Edited',
      entity: 'AdmissionApplication',
      entityId: id,
      details: `Updated details for ${updatedApp.applicantName} (${updatedApp.applicationNumber}).`,
    });

    return updatedApp;
  }

  // ==========================================
  // 3. STATUS TRANSITION WORKFLOW (WITH SAFEGUARDS)
  // ==========================================
  updateStatus(
    id: string,
    newStatus: AdmissionStatus,
    options?: {
      reason?: string;
      notes?: string;
      overrideSafeguard?: boolean;
    },
    actor?: User
  ): { success: boolean; application?: AdmissionApplication; error?: string } {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === id);
    if (!app) return { success: false, error: 'Application not found' };

    const oldStatus = app.status;
    if (oldStatus === newStatus) return { success: true, application: app };

    // Strict validation rules
    if (oldStatus === 'REJECTED' && newStatus === 'ENROLLED' && !options?.overrideSafeguard) {
      return {
        success: false,
        error: 'Invalid transition: A REJECTED application cannot be enrolled directly. It must be reassessed and APPROVED first.',
      };
    }

    if (newStatus === 'REJECTED' && (!options?.reason || !options.reason.trim())) {
      return {
        success: false,
        error: 'Rejection requires a documented reason.',
      };
    }

    if (newStatus === 'APPROVED') {
      // Check required documents verification
      const settings = this.getSettings();
      const requiredTypes = settings.requiredDocumentTypes || [];
      const missingRequired = requiredTypes.filter(
        (type) => !app.documents.some((d) => d.type === type && d.verificationStatus === 'VERIFIED')
      );

      if (missingRequired.length > 0 && !options?.overrideSafeguard) {
        return {
          success: false,
          error: `Cannot approve application: Missing verified required documents (${missingRequired.join(', ')}).`,
        };
      }
    }

    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const historyEntry: ApplicationStatusHistory = {
      id: `HIS-${Date.now()}`,
      fromStatus: oldStatus,
      toStatus: newStatus,
      changedBy: actor?.name || 'Staff User',
      changedByRole: actor?.role || 'Admin Staff',
      timestamp,
      reason: options?.reason || `Status updated from ${oldStatus} to ${newStatus}`,
      notes: options?.notes,
    };

    app.status = newStatus;
    app.statusHistory.unshift(historyEntry);

    if (newStatus === 'REJECTED') {
      app.rejectedBy = actor?.name || 'Admission Board';
      app.rejectedDate = now.toISOString().split('T')[0];
      app.rejectionReason = options?.reason;
    } else if (newStatus === 'APPROVED') {
      app.approvedBy = actor?.name || 'Dr. Eleanor Vance (Principal)';
      app.approvedDate = now.toISOString().split('T')[0];
      app.approvalNotes = options?.notes || 'Approved for enrollment.';
    }

    this.save(STORAGE_KEYS.APPLICATIONS, apps);

    // Audit Log
    this.logAudit({
      user: actor?.name || 'Staff User',
      userRole: actor?.role || 'Admin',
      action: 'Status Changed',
      entity: 'AdmissionApplication',
      entityId: id,
      previousValue: oldStatus,
      newValue: newStatus,
      details: `Application ${app.applicationNumber} status shifted from ${oldStatus} to ${newStatus}. Reason: ${options?.reason || 'Standard review workflow'}`,
    });

    // Automation Trigger
    if (newStatus === 'APPROVED') {
      this.executeAutomation('APPLICATION_APPROVED', app, 'Application approved by admissions board');
    } else if (newStatus === 'REJECTED') {
      this.executeAutomation('APPLICATION_REJECTED', app, options?.reason);
    } else if (newStatus === 'WAITLISTED') {
      this.executeAutomation('APPLICATION_WAITLISTED', app, options?.reason);
    }

    return { success: true, application: app };
  }

  // ==========================================
  // 4. DOCUMENT VERIFICATION WORKFLOW
  // ==========================================
  uploadDocument(
    appId: string,
    docData: Omit<AdmissionDocument, 'id' | 'uploadedDate' | 'verificationStatus'>,
    actor?: User
  ): AdmissionDocument | undefined {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === appId);
    if (!app) return undefined;

    const newDoc: AdmissionDocument = {
      ...docData,
      id: `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uploadedDate: new Date().toISOString().split('T')[0],
      verificationStatus: 'PENDING',
    };

    app.documents.push(newDoc);
    this.save(STORAGE_KEYS.APPLICATIONS, apps);

    this.logAudit({
      user: actor?.name || 'Applicant',
      userRole: actor?.role || 'User',
      action: 'Document Uploaded',
      entity: 'AdmissionDocument',
      entityId: newDoc.id,
      newValue: newDoc.type,
      details: `Uploaded ${newDoc.type} (${newDoc.fileName}) for application ${app.applicationNumber}.`,
    });

    return newDoc;
  }

  verifyDocument(
    appId: string,
    docId: string,
    status: DocumentVerificationStatus,
    notes?: string,
    actor?: User
  ): boolean {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === appId);
    if (!app) return false;

    const doc = app.documents.find((d) => d.id === docId);
    if (!doc) return false;

    const oldStatus = doc.verificationStatus;
    doc.verificationStatus = status;
    doc.verifiedBy = actor?.name || 'Claire Harrison (Registrar)';
    doc.verificationDate = new Date().toISOString().split('T')[0];
    if (notes) doc.notes = notes;

    // If document is rejected or missing, check if application should transition or alert
    if (status === 'REJECTED' || status === 'MISSING') {
      this.executeAutomation('DOCUMENT_MISSING', app, `Document "${doc.type}" is marked as ${status}.`);
    }

    this.save(STORAGE_KEYS.APPLICATIONS, apps);

    this.logAudit({
      user: actor?.name || 'Registrar',
      userRole: actor?.role || 'Admin',
      action: status === 'VERIFIED' ? 'Document Verified' : 'Document Rejected',
      entity: 'AdmissionDocument',
      entityId: docId,
      previousValue: oldStatus,
      newValue: status,
      details: `Updated verification status of ${doc.type} for ${app.applicantName} to ${status}. Notes: ${notes || 'None'}`,
    });

    return true;
  }

  requestReplacementDocument(appId: string, docType: DocumentType, reason: string, actor?: User): boolean {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === appId);
    if (!app) return false;

    const existing = app.documents.find((d) => d.type === docType);
    if (existing) {
      existing.verificationStatus = 'MISSING';
      existing.notes = `Replacement requested: ${reason}`;
    } else {
      app.documents.push({
        id: `DOC-REQ-${Date.now()}`,
        type: docType,
        fileName: 'Pending_Upload',
        fileSize: '0 KB',
        uploadedDate: '',
        verificationStatus: 'MISSING',
        notes: `Requested by staff: ${reason}`,
      });
    }

    // Move status to DOCUMENTS_PENDING if currently under review or new
    if (app.status === 'NEW' || app.status === 'UNDER_REVIEW') {
      this.updateStatus(
        appId,
        'DOCUMENTS_PENDING',
        { reason: `Awaiting requested document: ${docType}` },
        actor
      );
    }

    this.save(STORAGE_KEYS.APPLICATIONS, apps);

    this.executeAutomation('DOCUMENT_MISSING', app, `Replacement document requested: ${docType} (${reason})`);

    return true;
  }

  // ==========================================
  // 5. INTERVIEW & TEST MANAGEMENT
  // ==========================================
  scheduleInterview(
    appId: string,
    interviewData: Omit<AdmissionInterview, 'id' | 'status'>,
    actor?: User
  ): AdmissionInterview | undefined {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === appId);
    if (!app) return undefined;

    const newInterview: AdmissionInterview = {
      ...interviewData,
      id: `INT-${Date.now()}`,
      status: 'SCHEDULED',
    };

    app.interviews.push(newInterview);
    if (app.status === 'NEW' || app.status === 'UNDER_REVIEW' || app.status === 'DOCUMENTS_PENDING') {
      this.updateStatus(
        appId,
        'INTERVIEW_PENDING',
        { reason: `Interview scheduled with ${newInterview.interviewerName} on ${newInterview.date}` },
        actor
      );
    }

    this.save(STORAGE_KEYS.APPLICATIONS, apps);

    this.logAudit({
      user: actor?.name || 'Admissions Coordinator',
      userRole: actor?.role || 'Admin',
      action: 'Interview Scheduled',
      entity: 'AdmissionInterview',
      entityId: newInterview.id,
      newValue: `${newInterview.date} ${newInterview.time}`,
      details: `Scheduled interview for ${app.applicantName} on ${newInterview.date} at ${newInterview.time} with ${newInterview.interviewerName} at ${newInterview.location}.`,
    });

    this.executeAutomation(
      'INTERVIEW_SCHEDULED',
      app,
      `Interview slot on ${newInterview.date} at ${newInterview.time}`
    );

    return newInterview;
  }

  recordInterviewResult(
    appId: string,
    interviewId: string,
    resultData: {
      result: InterviewRecommendation;
      score: number;
      comments: string;
      recommendation?: string;
    },
    actor?: User
  ): boolean {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === appId);
    if (!app) return false;

    const interview = app.interviews.find((i) => i.id === interviewId);
    if (!interview) return false;

    interview.status = 'COMPLETED';
    interview.result = resultData.result;
    interview.score = resultData.score;
    interview.comments = resultData.comments;
    interview.recommendation = resultData.recommendation;
    interview.conductedAt = new Date().toISOString();

    this.save(STORAGE_KEYS.APPLICATIONS, apps);

    this.logAudit({
      user: actor?.name || interview.interviewerName,
      userRole: actor?.role || 'Teacher / Evaluator',
      action: 'Interview Completed',
      entity: 'AdmissionInterview',
      entityId: interviewId,
      newValue: resultData.result,
      details: `Completed interview for ${app.applicantName}. Score: ${resultData.score}/100, Recommendation: ${resultData.result}.`,
    });

    return true;
  }

  recordAdmissionTest(
    appId: string,
    testData: Omit<AdmissionTest, 'id' | 'percentage'>,
    actor?: User
  ): AdmissionTest | undefined {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === appId);
    if (!app) return undefined;

    const percentage = Math.round((testData.obtainedMarks / testData.totalMarks) * 100);
    const newTest: AdmissionTest = {
      ...testData,
      id: `TST-${Date.now()}`,
      percentage,
      evaluatorName: testData.evaluatorName || actor?.name || 'Department Chair',
    };

    app.tests.push(newTest);
    this.save(STORAGE_KEYS.APPLICATIONS, apps);

    this.logAudit({
      user: actor?.name || 'Evaluator',
      userRole: actor?.role || 'Teacher',
      action: 'Test Recorded',
      entity: 'AdmissionTest',
      entityId: newTest.id,
      newValue: `${newTest.percentage}% (${newTest.result})`,
      details: `Recorded entrance test score for ${app.applicantName}: ${newTest.obtainedMarks}/${newTest.totalMarks} (${newTest.percentage}%) - ${newTest.result}.`,
    });

    return newTest;
  }

  // ==========================================
  // 6. WAITLIST MANAGEMENT
  // ==========================================
  getWaitlist(): WaitlistEntry[] {
    return this.load<WaitlistEntry[]>(STORAGE_KEYS.WAITLIST, initialWaitlist);
  }

  addToWaitlist(
    appId: string,
    priority: WaitlistPriority,
    reason: string,
    notes?: string,
    actor?: User
  ): WaitlistEntry | undefined {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === appId);
    if (!app) return undefined;

    const waitlist = this.getWaitlist();
    const newEntry: WaitlistEntry = {
      id: `WL-${Date.now()}`,
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      applicantName: app.applicantName,
      classId: app.appliedClassId,
      className: app.appliedClassName,
      priority,
      dateAdded: new Date().toISOString().split('T')[0],
      reason,
      notes,
      status: 'Active',
    };

    app.waitlistPriority = priority;
    app.waitlistReason = reason;
    this.updateStatus(appId, 'WAITLISTED', { reason, notes }, actor);

    const updatedWaitlist = [newEntry, ...waitlist];
    this.save(STORAGE_KEYS.WAITLIST, updatedWaitlist);

    this.logAudit({
      user: actor?.name || 'Principal',
      userRole: actor?.role || 'Admin',
      action: 'Application Waitlisted',
      entity: 'AdmissionApplication',
      entityId: appId,
      newValue: priority,
      details: `Placed ${app.applicantName} on ${priority} Priority Waitlist for ${app.appliedClassName}. Reason: ${reason}`,
    });

    return newEntry;
  }

  promoteFromWaitlist(appId: string, notes?: string, actor?: User): boolean {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === appId);
    if (!app) return false;

    const waitlist = this.getWaitlist();
    const entry = waitlist.find((w) => w.applicationId === appId);
    if (entry) {
      entry.status = 'Promoted';
      this.save(STORAGE_KEYS.WAITLIST, waitlist);
    }

    const res = this.updateStatus(
      appId,
      'APPROVED',
      { reason: 'Promoted from waitlist as class seat became available.', notes },
      actor
    );

    return res.success;
  }

  // ==========================================
  // 7. CLASS CAPACITY ENGINE
  // ==========================================
  getCapacities(): ClassAdmissionCapacity[] {
    const list = this.load<ClassAdmissionCapacity[]>(STORAGE_KEYS.CAPACITY, initialClassCapacities);
    // Sync occupied count dynamically from existing students
    const students = dataService.getStudents(true).filter((s) => s.status !== 'Inactive' && !s.isArchived);
    return list.map((c) => {
      const liveOccupied = students.filter(
        (s) => s.classId === c.classId && s.sectionId === c.sectionId
      ).length;
      const occupied = Math.max(c.occupied, liveOccupied);
      const availableSeats = Math.max(0, c.maxCapacity - occupied);
      return {
        ...c,
        occupied,
        availableSeats,
        isFull: availableSeats <= 0,
      };
    });
  }

  checkSectionCapacity(classId: string, sectionId?: string): { isFull: boolean; available: number; capacity?: ClassAdmissionCapacity } {
    const capacities = this.getCapacities();
    if (sectionId) {
      const cap = capacities.find((c) => c.classId === classId && c.sectionId === sectionId);
      if (cap) {
        return { isFull: cap.isFull, available: cap.availableSeats, capacity: cap };
      }
    }
    // Check class-level totals
    const classCaps = capacities.filter((c) => c.classId === classId);
    const totalMax = classCaps.reduce((acc, c) => acc + c.maxCapacity, 0);
    const totalOcc = classCaps.reduce((acc, c) => acc + c.occupied, 0);
    const available = Math.max(0, totalMax - totalOcc);
    return { isFull: available <= 0, available };
  }

  updateCapacity(
    classId: string,
    sectionId: string,
    updates: Partial<ClassAdmissionCapacity>,
    actor?: User
  ): void {
    const caps = this.load<ClassAdmissionCapacity[]>(STORAGE_KEYS.CAPACITY, initialClassCapacities);
    const idx = caps.findIndex((c) => c.classId === classId && c.sectionId === sectionId);
    if (idx !== -1) {
      caps[idx] = { ...caps[idx], ...updates };
      this.save(STORAGE_KEYS.CAPACITY, caps);

      this.logAudit({
        user: actor?.name || 'Admin',
        userRole: actor?.role || 'Admin',
        action: 'Settings Updated',
        entity: 'Capacity',
        entityId: `${classId}-${sectionId}`,
        details: `Updated capacity limits for ${caps[idx].className} ${caps[idx].sectionName} (Max: ${caps[idx].maxCapacity}).`,
      });
    }
  }

  // ==========================================
  // 8. FULL ENROLLMENT WORKFLOW (INTEGRATED)
  // ==========================================
  enrollStudent(
    payload: {
      applicationId: string;
      studentId?: string;
      admissionNumber?: string;
      academicYear: string;
      classId: string;
      className: string;
      sectionId: string;
      sectionName: string;
      rollNumber?: string;
      studentStatus?: 'Active';
      feeStructureId?: string;
      overrideCapacity?: boolean;
    },
    actor?: User
  ): { success: boolean; student?: Student; error?: string } {
    const app = this.getApplicationById(payload.applicationId);
    if (!app) return { success: false, error: 'Application not found.' };

    if (app.status !== 'APPROVED' && !payload.overrideCapacity) {
      return {
        success: false,
        error: `Cannot enroll application in '${app.status}' status. Must be APPROVED first.`,
      };
    }

    // Capacity verification
    const capacityCheck = this.checkSectionCapacity(payload.classId, payload.sectionId);
    if (capacityCheck.isFull && !payload.overrideCapacity) {
      return {
        success: false,
        error: `Class section ${payload.className} - ${payload.sectionName} has reached full capacity. Administrator override is required.`,
      };
    }

    if (capacityCheck.isFull && payload.overrideCapacity) {
      this.logAudit({
        user: actor?.name || 'Administrator',
        userRole: actor?.role || 'Principal',
        action: 'Capacity Overridden',
        entity: 'Capacity',
        entityId: `${payload.classId}-${payload.sectionId}`,
        details: `Capacity limit overridden by ${actor?.name} to enroll ${app.applicantName} into ${payload.className} ${payload.sectionName}.`,
      });
    }

    // Generate unique IDs
    const finalAdmissionNumber = payload.admissionNumber?.trim() || this.generateAdmissionNumber();
    const finalStudentId = payload.studentId?.trim() || `STU-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;

    // 1. Parent Matching / Creation Workflow (De-duplication)
    const existingParents = dataService.getParents();
    let parent = existingParents.find(
      (p) =>
        (app.parentEmail && p.email?.toLowerCase().trim() === app.parentEmail.toLowerCase().trim()) ||
        (app.parentPhone && p.phone?.trim() === app.parentPhone.trim())
    );

    if (!parent) {
      // Create new parent record
      parent = dataService.addParent({
        name: app.parentName,
        relationship: (app.parentRelationship as 'Father' | 'Mother' | 'Guardian') || 'Father',
        phone: app.parentPhone,
        secondaryPhone: app.parentAlternatePhone,
        email: app.parentEmail,
        occupation: app.parentOccupation || 'Parent / Guardian',
        address: `${app.address}, ${app.city}, ${app.postalCode}`,
        city: app.city,
        postalCode: app.postalCode,
        country: app.country,
      });

      this.logAudit({
        user: actor?.name || 'Admissions Registrar',
        userRole: actor?.role || 'Admin Staff',
        action: 'Parent Account Associated',
        entity: 'AdmissionApplication',
        entityId: app.id,
        newValue: parent.id,
        details: `Created new Parent account ${parent.name} (${parent.id}) for student ${app.applicantName}.`,
      });
    } else {
      this.logAudit({
        user: actor?.name || 'Admissions Registrar',
        userRole: actor?.role || 'Admin Staff',
        action: 'Parent Account Associated',
        entity: 'AdmissionApplication',
        entityId: app.id,
        newValue: parent.id,
        details: `Matched and linked existing Parent record ${parent.name} (${parent.id}) to ${app.applicantName}.`,
      });
    }

    // 2. Create Student in existing DataService
    const newStudent = dataService.addStudent(
      {
        studentId: finalStudentId,
        admissionNumber: finalAdmissionNumber,
        firstName: app.applicantFirstName,
        middleName: app.applicantMiddleName,
        lastName: app.applicantLastName,
        dateOfBirth: app.dateOfBirth,
        gender: app.gender,
        profilePhoto:
          app.gender === 'Female'
            ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        fatherGuardianName: app.parentName,
        parentRelationship: app.parentRelationship,
        parentContact: app.parentPhone,
        secondaryContact: app.parentAlternatePhone,
        email: `${app.applicantFirstName.toLowerCase()}.${app.applicantLastName.toLowerCase()}.stu@staugustine.edu`,
        address: app.address,
        city: app.city,
        postalCode: app.postalCode,
        country: app.country,
        admissionDate: new Date().toISOString().split('T')[0],
        classId: payload.classId,
        className: payload.className,
        sectionId: payload.sectionId,
        sectionName: payload.sectionName,
        rollNumber: payload.rollNumber || '01',
        previousSchool: app.previousSchool,
        status: payload.studentStatus || 'Active',
        emergencyContactName: app.emergencyContactName,
        emergencyRelationship: app.emergencyContactRelationship,
        emergencyContact: app.emergencyContactPhone,
        parentId: parent.id,
      },
      actor
    );

    // Link student to parent
    dataService.linkChildToParent(parent.id, newStudent.id);

    // 3. Fee Structure Assignment Workflow
    if (payload.feeStructureId) {
      const structures = financeService.getFeeStructures();
      const feeStructure = structures.find((s) => s.id === payload.feeStructureId);
      if (feeStructure) {
        // Create initial invoice for the student
        try {
          financeService.createInvoice(
            {
              studentId: newStudent.id,
              studentName: `${newStudent.firstName} ${newStudent.lastName}`,
              parentId: parent?.id,
              parentName: parent?.name,
              parentPhone: parent?.phone,
              academicYear: payload.academicYear || '2026-2027',
              feePeriod: 'Term 1 (Admission)',
              issueDate: new Date().toISOString().split('T')[0],
              dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
              lineItems: feeStructure.components.map((c) => ({
                id: c.id,
                name: c.name,
                category: c.category || 'Tuition',
                amount: c.amount,
              })),
              subtotal: feeStructure.totalAmount,
              discount: 0,
              scholarship: 0,
              adjustments: 0,
              total: feeStructure.totalAmount,
              amountPaid: 0,
            },
            actor
          );

          this.logAudit({
            user: actor?.name || 'Accountant',
            userRole: actor?.role || 'Finance',
            action: 'Fee Structure Assigned',
            entity: 'AdmissionApplication',
            entityId: app.id,
            newValue: feeStructure.name,
            details: `Assigned fee structure "${feeStructure.name}" ($${feeStructure.totalAmount}) to enrolled student ${newStudent.firstName} ${newStudent.lastName}.`,
          });
        } catch {
          // Non-blocking fee assignment fallback
        }
      }
    }

    // 4. Update Application Record
    const apps = this.getApplications();
    const appIndex = apps.findIndex((a) => a.id === app.id);
    if (appIndex !== -1) {
      apps[appIndex] = {
        ...apps[appIndex],
        status: 'ENROLLED',
        enrolledStudentId: newStudent.id,
        enrolledAdmissionNumber: finalAdmissionNumber,
        enrolledDate: new Date().toISOString().split('T')[0],
        feeStructureAssigned: Boolean(payload.feeStructureId),
        feeStructureId: payload.feeStructureId,
      };
      this.save(STORAGE_KEYS.APPLICATIONS, apps);
    }

    // 5. Update Class Capacity count
    const capacities = this.getCapacities();
    const targetCap = capacities.find(
      (c) => c.classId === payload.classId && c.sectionId === payload.sectionId
    );
    if (targetCap) {
      this.updateCapacity(payload.classId, payload.sectionId, {
        occupied: targetCap.occupied + 1,
      });
    }

    // 6. Audit & Automation Trigger
    this.logAudit({
      user: actor?.name || 'Registrar',
      userRole: actor?.role || 'Admin',
      action: 'Application Enrolled',
      entity: 'AdmissionApplication',
      entityId: app.id,
      newValue: newStudent.id,
      details: `Enrolled applicant ${app.applicantName} as Student ${newStudent.studentId} (${finalAdmissionNumber}) in ${payload.className} ${payload.sectionName}.`,
    });

    this.executeAutomation(
      'STUDENT_ENROLLED',
      apps[appIndex] || app,
      `Student profile created with ID ${newStudent.studentId}`
    );

    return { success: true, student: newStudent };
  }

  // ==========================================
  // 9. AUTOMATION ENGINE & DEDUPLICATION
  // ==========================================
  getAutomationRules(): AdmissionAutomationRule[] {
    return this.load<AdmissionAutomationRule[]>(STORAGE_KEYS.RULES, initialAdmissionAutomationRules);
  }

  toggleAutomationRule(id: string): void {
    const rules = this.getAutomationRules();
    const r = rules.find((item) => item.id === id);
    if (r) {
      r.enabled = !r.enabled;
      this.save(STORAGE_KEYS.RULES, rules);
    }
  }

  getAutomationLogs(): AdmissionAutomationLog[] {
    return this.load<AdmissionAutomationLog[]>(STORAGE_KEYS.LOGS, initialAdmissionAutomationLogs);
  }

  executeAutomation(
    trigger: AdmissionAutomationRule['trigger'],
    app: AdmissionApplication,
    details?: string
  ): void {
    const rules = this.getAutomationRules().filter((r) => r.enabled && r.trigger === trigger);
    if (rules.length === 0) return;

    const logs = this.getAutomationLogs();
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    rules.forEach((rule) => {
      // Deduplication safeguard: check if same rule was executed for this application in the last 15 minutes
      const isDuplicate = logs.some(
        (l) =>
          l.ruleId === rule.id &&
          l.applicationId === app.id &&
          l.triggerEvent === trigger &&
          now.getTime() - new Date(l.timestamp).getTime() < 15 * 60 * 1000
      );

      if (isDuplicate) {
        logs.unshift({
          id: `AUL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp,
          ruleId: rule.id,
          ruleName: rule.name,
          triggerEvent: trigger,
          applicationId: app.id,
          applicationNumber: app.applicationNumber,
          applicantName: app.applicantName,
          actionTaken: 'Skipped - duplicate execution detected',
          status: 'SKIPPED',
          message: `Rule "${rule.name}" previously executed for ${app.applicationNumber} recently.`,
        });
        return;
      }

      let actionDesc = '';
      if (rule.action === 'SEND_PARENT_NOTIFICATION') {
        actionDesc = `In-app notice staged for parent ${app.parentName} (${app.parentEmail})`;
        // Create in-app notification via dataService
        try {
          dataService.logActivity({
            action: 'Admission Notice Dispatched',
            actor: 'System Automation',
            role: 'Notification Engine',
            details: `Notification to ${app.parentName}: Application ${app.applicationNumber} (${app.applicantName}) updated to ${app.status}.`,
            entityType: 'student',
          });
        } catch {
          // ignore
        }
      } else if (rule.action === 'CREATE_ADMIN_ALERT') {
        actionDesc = `Alert created on Admissions Dashboard for staff attention`;
      } else if (rule.action === 'CREATE_FOLLOWUP_TASK') {
        actionDesc = `Follow-up review task created for Admissions Committee`;
      } else {
        actionDesc = `Recorded audit entry for ${app.applicationNumber}`;
      }

      logs.unshift({
        id: `AUL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp,
        ruleId: rule.id,
        ruleName: rule.name,
        triggerEvent: trigger,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        applicantName: app.applicantName,
        actionTaken: actionDesc,
        status: 'SUCCESS',
        message: details || `Executed ${rule.name} for ${app.applicantName}`,
        details,
      });
    });

    this.save(STORAGE_KEYS.LOGS, logs.slice(0, 100));
  }

  // ==========================================
  // 10. FOLLOW-UP REMINDERS
  // ==========================================
  getFollowUpAlerts(): {
    id: string;
    type: 'PENDING_REVIEW' | 'MISSING_DOCUMENTS' | 'INTERVIEW_UPCOMING';
    severity: 'warning' | 'danger' | 'info';
    application: AdmissionApplication;
    title: string;
    description: string;
    actionText: string;
  }[] {
    const apps = this.getApplications();
    const settings = this.getSettings();
    const alertDays = settings.pendingReviewAlertDays || 3;
    const now = new Date();
    const alerts: any[] = [];

    apps.forEach((app) => {
      // 1. Pending under review too long
      if (app.status === 'UNDER_REVIEW' || app.status === 'NEW') {
        const appDate = new Date(app.applicationDate);
        const diffDays = Math.floor((now.getTime() - appDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays >= alertDays) {
          alerts.push({
            id: `ALT-REV-${app.id}`,
            type: 'PENDING_REVIEW',
            severity: diffDays > 5 ? 'danger' : 'warning',
            application: app,
            title: `Review Overdue (${diffDays} days)`,
            description: `${app.applicantName} (${app.applicationNumber}) has been pending in ${app.status} for ${diffDays} days without resolution.`,
            actionText: 'Review Now',
          });
        }
      }

      // 2. Missing documents
      const missingCount = app.documents.filter(
        (d) => d.verificationStatus === 'MISSING' || d.verificationStatus === 'REJECTED'
      ).length;
      if (missingCount > 0 && app.status !== 'REJECTED' && app.status !== 'ENROLLED') {
        alerts.push({
          id: `ALT-DOC-${app.id}`,
          type: 'MISSING_DOCUMENTS',
          severity: 'danger',
          application: app,
          title: `Documents Required (${missingCount})`,
          description: `${app.applicantName} is missing ${missingCount} required document(s). Contact parent ${app.parentName}.`,
          actionText: 'View Documents',
        });
      }

      // 3. Upcoming interview
      const upcomingInterview = app.interviews.find((i) => i.status === 'SCHEDULED');
      if (upcomingInterview) {
        alerts.push({
          id: `ALT-INT-${app.id}`,
          type: 'INTERVIEW_UPCOMING',
          severity: 'info',
          application: app,
          title: `Interview Scheduled (${upcomingInterview.date})`,
          description: `${app.applicantName} interview at ${upcomingInterview.time} with ${upcomingInterview.interviewerName} (${upcomingInterview.location}).`,
          actionText: 'Open Interview',
        });
      }
    });

    return alerts;
  }

  // ==========================================
  // 11. REPORTS & METRICS ENGINE
  // ==========================================
  getConversionMetrics(): {
    totalApplications: number;
    newCount: number;
    underReviewCount: number;
    documentsPendingCount: number;
    interviewPendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    waitlistedCount: number;
    enrolledCount: number;
    approvalRate: number;
    enrollmentConversionRate: number;
  } {
    const apps = this.getApplications();
    const total = apps.length;
    const newCount = apps.filter((a) => a.status === 'NEW').length;
    const underReviewCount = apps.filter((a) => a.status === 'UNDER_REVIEW').length;
    const documentsPendingCount = apps.filter((a) => a.status === 'DOCUMENTS_PENDING').length;
    const interviewPendingCount = apps.filter(
      (a) => a.status === 'INTERVIEW_PENDING' || a.status === 'TEST_PENDING'
    ).length;
    const approvedCount = apps.filter((a) => a.status === 'APPROVED').length;
    const rejectedCount = apps.filter((a) => a.status === 'REJECTED').length;
    const waitlistedCount = apps.filter((a) => a.status === 'WAITLISTED').length;
    const enrolledCount = apps.filter((a) => a.status === 'ENROLLED').length;

    const totalDecided = approvedCount + rejectedCount + enrolledCount;
    const approvalRate = totalDecided > 0 ? Math.round(((approvedCount + enrolledCount) / totalDecided) * 100) : 0;
    const enrollmentConversionRate = total > 0 ? Math.round((enrolledCount / total) * 100) : 0;

    return {
      totalApplications: total,
      newCount,
      underReviewCount,
      documentsPendingCount,
      interviewPendingCount,
      approvedCount,
      rejectedCount,
      waitlistedCount,
      enrolledCount,
      approvalRate,
      enrollmentConversionRate,
    };
  }

  getSourceStatistics(): { source: ApplicationSource; count: number; percentage: number; enrolled: number }[] {
    const apps = this.getApplications();
    const sources: ApplicationSource[] = [
      'Website',
      'Facebook',
      'Instagram',
      'Referral',
      'Walk-in',
      'Education Fair',
      'Other',
    ];

    const total = apps.length || 1;
    return sources.map((source) => {
      const matching = apps.filter((a) => a.source === source);
      const count = matching.length;
      const enrolled = matching.filter((a) => a.status === 'ENROLLED').length;
      const percentage = Math.round((count / total) * 100);
      return { source, count, percentage, enrolled };
    });
  }

  // ==========================================
  // 12. AUDIT LOGS & SETTINGS
  // ==========================================
  getAuditLogs(): AdmissionAuditLog[] {
    return this.load<AdmissionAuditLog[]>(STORAGE_KEYS.AUDIT, initialAdmissionAuditLogs);
  }

  logAudit(entry: Omit<AdmissionAuditLog, 'id' | 'timestamp'>): AdmissionAuditLog {
    const logs = this.getAuditLogs();
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newLog: AdmissionAuditLog = {
      ...entry,
      id: `AUD-ADM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
    };

    const updated = [newLog, ...logs.slice(0, 150)];
    this.save(STORAGE_KEYS.AUDIT, updated);
    return newLog;
  }

  getSettings(): AdmissionSettings {
    return this.load<AdmissionSettings>(STORAGE_KEYS.SETTINGS, initialAdmissionSettings);
  }

  updateSettings(updates: Partial<AdmissionSettings>, actor?: User): AdmissionSettings {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    this.save(STORAGE_KEYS.SETTINGS, updated);

    this.logAudit({
      user: actor?.name || 'Administrator',
      userRole: actor?.role || 'Principal',
      action: 'Settings Updated',
      entity: 'Settings',
      entityId: 'SETTINGS_GLOBAL',
      details: `Updated admission policies (Academic Year: ${updated.academicYear}, Required Test: ${updated.requireEntranceTest}, Capacity Limits: ${updated.enableCapacityLimits}).`,
    });

    return updated;
  }
}

export const admissionService = new AdmissionService();
