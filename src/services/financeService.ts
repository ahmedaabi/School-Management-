import {
  AcademicYear,
  FeeStructure,
  DiscountItem,
  ScholarshipItem,
  StudentFeeAdjustment,
  StudentFeeProfile,
  InvoiceItem,
  InvoiceStatus,
  FinancePaymentRecord,
  PaymentMethod,
  FinanceSettings,
  FinanceAutomationRule,
  FinanceAutomationLog,
} from '../types/finance';
import { User, Student } from '../types';
import {
  initialAcademicYears,
  initialFeeStructures,
  initialDiscounts,
  initialScholarships,
  initialStudentAdjustments,
  initialInvoices,
  initialFinancePayments,
  initialFinanceSettings,
  initialFinanceAutomationRules,
  initialFinanceAutomationLogs,
} from '../data/financeSeedData';
import { dataService } from './dataService';

const FINANCE_STORAGE_KEYS = {
  YEARS: 'saia_finance_academic_years',
  STRUCTURES: 'saia_fee_structures',
  DISCOUNTS: 'saia_finance_discounts',
  SCHOLARSHIPS: 'saia_finance_scholarships',
  ADJUSTMENTS: 'saia_finance_adjustments',
  INVOICES: 'saia_finance_invoices',
  PAYMENTS: 'saia_finance_payments',
  SETTINGS: 'saia_finance_settings',
  RULES: 'saia_finance_automation_rules',
  LOGS: 'saia_finance_automation_logs',
};

class FinanceService {
  private load<T>(key: string, defaultData: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
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

  // ==========================================
  // 1. ACADEMIC YEARS
  // ==========================================
  getAcademicYears(): AcademicYear[] {
    return this.load<AcademicYear[]>(FINANCE_STORAGE_KEYS.YEARS, initialAcademicYears);
  }

  getActiveAcademicYear(): AcademicYear {
    const years = this.getAcademicYears();
    const active = years.find((y) => y.status === 'ACTIVE' || y.isDefault);
    return active || years[0] || initialAcademicYears[1];
  }

  saveAcademicYear(yearData: Omit<AcademicYear, 'id'> & { id?: string }, actor?: User): AcademicYear {
    const years = this.getAcademicYears();
    const isNew = !yearData.id;
    const id = yearData.id || `AY-${Date.now()}`;

    let updatedYears: AcademicYear[];
    let savedYear: AcademicYear;

    if (yearData.status === 'ACTIVE') {
      // Mark all others as non-active/closed
      years.forEach((y) => {
        if (y.id !== id && y.status === 'ACTIVE') {
          y.status = 'CLOSED';
          y.isDefault = false;
        }
      });
    }

    if (isNew) {
      savedYear = { ...yearData, id } as AcademicYear;
      updatedYears = [savedYear, ...years];
    } else {
      updatedYears = years.map((y) => (y.id === id ? ({ ...y, ...yearData } as AcademicYear) : y));
      savedYear = updatedYears.find((y) => y.id === id)!;
    }

    this.save(FINANCE_STORAGE_KEYS.YEARS, updatedYears);

    dataService.logActivity({
      action: isNew ? 'Academic Year Created' : 'Academic Year Updated',
      actor: actor?.name || 'Bursar',
      role: actor?.role || 'accountant',
      details: `${isNew ? 'Added' : 'Modified'} academic session "${savedYear.name}" (${savedYear.status})`,
      entityType: 'payment',
    });

    return savedYear;
  }

  // ==========================================
  // 2. FEE STRUCTURES
  // ==========================================
  getFeeStructures(): FeeStructure[] {
    return this.load<FeeStructure[]>(FINANCE_STORAGE_KEYS.STRUCTURES, initialFeeStructures);
  }

  getFeeStructure(id: string): FeeStructure | undefined {
    return this.getFeeStructures().find((fs) => fs.id === id);
  }

  saveFeeStructure(
    structData: Omit<FeeStructure, 'id' | 'totalAmount' | 'createdAt'> & { id?: string; createdAt?: string },
    actor?: User
  ): FeeStructure {
    const structures = this.getFeeStructures();
    const isNew = !structData.id;
    const id = structData.id || `FS-${Date.now().toString().slice(-4)}`;

    const totalAmount = structData.components
      .filter((c) => c.isActive)
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const feeStructure: FeeStructure = {
      ...structData,
      id,
      totalAmount,
      createdAt: structData.createdAt || new Date().toISOString().split('T')[0],
    };

    let updatedStructures: FeeStructure[];
    if (isNew) {
      updatedStructures = [feeStructure, ...structures];
    } else {
      updatedStructures = structures.map((fs) => (fs.id === id ? feeStructure : fs));
    }

    this.save(FINANCE_STORAGE_KEYS.STRUCTURES, updatedStructures);

    dataService.logActivity({
      action: isNew ? 'Fee Structure Created' : 'Fee Structure Updated',
      actor: actor?.name || 'Bursar',
      role: actor?.role || 'accountant',
      details: `${isNew ? 'Configured' : 'Updated'} structure "${feeStructure.name}" (Total: $${totalAmount.toLocaleString()})`,
      entityType: 'payment',
    });

    return feeStructure;
  }

  deleteFeeStructure(id: string, actor?: User): boolean {
    const structures = this.getFeeStructures();
    const target = structures.find((s) => s.id === id);
    if (!target) return false;

    const filtered = structures.filter((s) => s.id !== id);
    this.save(FINANCE_STORAGE_KEYS.STRUCTURES, filtered);

    dataService.logActivity({
      action: 'Fee Structure Removed',
      actor: actor?.name || 'Bursar',
      role: actor?.role || 'accountant',
      details: `Removed fee structure "${target.name}"`,
      entityType: 'payment',
    });

    return true;
  }

  // ==========================================
  // 3. DISCOUNTS
  // ==========================================
  getDiscounts(): DiscountItem[] {
    return this.load<DiscountItem[]>(FINANCE_STORAGE_KEYS.DISCOUNTS, initialDiscounts);
  }

  saveDiscount(discountData: Omit<DiscountItem, 'id'> & { id?: string }, actor?: User): DiscountItem {
    const discounts = this.getDiscounts();
    const isNew = !discountData.id;
    const id = discountData.id || `DSC-${Date.now().toString().slice(-3)}`;

    const item: DiscountItem = {
      ...discountData,
      id,
      createdBy: discountData.createdBy || `${actor?.name || 'Bursar'} (${actor?.role || 'Staff'})`,
    };

    let updated: DiscountItem[];
    if (isNew) {
      updated = [item, ...discounts];
    } else {
      updated = discounts.map((d) => (d.id === id ? item : d));
    }

    this.save(FINANCE_STORAGE_KEYS.DISCOUNTS, updated);

    dataService.logActivity({
      action: isNew ? 'Fee Discount Created' : 'Fee Discount Updated',
      actor: actor?.name || 'Bursar',
      role: actor?.role || 'accountant',
      details: `${isNew ? 'Added' : 'Updated'} discount policy "${item.name}" (${item.value}${item.type === 'Percentage' ? '%' : '$'})`,
      entityType: 'payment',
    });

    return item;
  }

  updateDiscountStatus(id: string, status: 'Approved' | 'Rejected', actor?: User): boolean {
    const discounts = this.getDiscounts();
    const item = discounts.find((d) => d.id === id);
    if (!item) return false;

    item.approvalStatus = status;
    item.approvedBy = `${actor?.name || 'Administrator'} (${actor?.role || 'Principal'})`;
    this.save(FINANCE_STORAGE_KEYS.DISCOUNTS, discounts);

    dataService.logActivity({
      action: `Fee Discount ${status}`,
      actor: actor?.name || 'Principal',
      role: actor?.role || 'principal',
      details: `Discount rule "${item.name}" set to ${status}`,
      entityType: 'payment',
    });

    return true;
  }

  // ==========================================
  // 4. SCHOLARSHIPS
  // ==========================================
  getScholarships(): ScholarshipItem[] {
    return this.load<ScholarshipItem[]>(FINANCE_STORAGE_KEYS.SCHOLARSHIPS, initialScholarships);
  }

  saveScholarship(
    scholarshipData: Omit<ScholarshipItem, 'id'> & { id?: string },
    actor?: User
  ): ScholarshipItem {
    const scholarships = this.getScholarships();
    const isNew = !scholarshipData.id;
    const id = scholarshipData.id || `SCH-${Date.now().toString().slice(-3)}`;

    const item: ScholarshipItem = {
      ...scholarshipData,
      id,
    };

    let updated: ScholarshipItem[];
    if (isNew) {
      updated = [item, ...scholarships];
    } else {
      updated = scholarships.map((s) => (s.id === id ? item : s));
    }

    this.save(FINANCE_STORAGE_KEYS.SCHOLARSHIPS, updated);

    dataService.logActivity({
      action: isNew ? 'Scholarship Awarded' : 'Scholarship Updated',
      actor: actor?.name || 'Bursar',
      role: actor?.role || 'accountant',
      details: `${isNew ? 'Awarded' : 'Modified'} "${item.scholarshipName}" for ${item.studentName} (${item.value}${item.amountType === 'Percentage' ? '%' : '$'})`,
      entityType: 'payment',
    });

    return item;
  }

  // ==========================================
  // 5. ADJUSTMENTS
  // ==========================================
  getAdjustments(): StudentFeeAdjustment[] {
    return this.load<StudentFeeAdjustment[]>(FINANCE_STORAGE_KEYS.ADJUSTMENTS, initialStudentAdjustments);
  }

  addStudentAdjustment(
    adjData: Omit<StudentFeeAdjustment, 'id' | 'createdAt'>,
    actor?: User
  ): StudentFeeAdjustment {
    const adjustments = this.getAdjustments();
    const newAdj: StudentFeeAdjustment = {
      ...adjData,
      id: `ADJ-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: adjData.createdBy || `${actor?.name || 'Bursar'} (${actor?.role || 'Accountant'})`,
    };

    const updated = [newAdj, ...adjustments];
    this.save(FINANCE_STORAGE_KEYS.ADJUSTMENTS, updated);

    // If student has an open invoice, optionally apply or note it
    dataService.logActivity({
      action: 'Student Fee Adjustment Added',
      actor: actor?.name || 'Bursar',
      role: actor?.role || 'accountant',
      details: `${newAdj.type} adjustment of $${Math.abs(newAdj.amount)} for ${newAdj.studentName}: ${newAdj.reason}`,
      entityType: 'payment',
    });

    return newAdj;
  }

  applyStudentAdjustment(
    payload: { studentId: string; type: StudentFeeAdjustment['type']; amount: number; reason: string },
    actor?: User
  ): { success: boolean; adjustment?: StudentFeeAdjustment; error?: string } {
    const students = dataService.getStudents();
    const stu = students.find((s) => s.studentId === payload.studentId || s.id === payload.studentId);
    if (!stu) {
      return { success: false, error: 'Student not found' };
    }
    const created = this.addStudentAdjustment(
      {
        studentId: stu.id,
        studentName: `${stu.firstName} ${stu.lastName}`,
        amount: payload.amount,
        type: payload.type,
        reason: payload.reason,
        createdBy: actor?.name ? `${actor.name} (${actor.role})` : 'Bursar',
      },
      actor
    );
    return { success: true, adjustment: created };
  }

  // ==========================================
  // 6. INVOICES
  // ==========================================
  getInvoices(user?: User): InvoiceItem[] {
    const invoices = this.load<InvoiceItem[]>(FINANCE_STORAGE_KEYS.INVOICES, initialInvoices);

    // Apply Overdue check dynamically on retrieval
    const today = new Date().toISOString().split('T')[0];
    let hasChanges = false;
    const sanitized = invoices.map((inv) => {
      if (inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.balance > 0) {
        if (inv.dueDate < today && inv.status !== 'OVERDUE') {
          hasChanges = true;
          return { ...inv, status: 'OVERDUE' as InvoiceStatus };
        }
      }
      return inv;
    });

    if (hasChanges) {
      this.save(FINANCE_STORAGE_KEYS.INVOICES, sanitized);
    }

    // RBAC: If parent, filter to their children only
    if (user && user.role === 'parent') {
      const parentStudents = this.getLinkedStudentsForParent(user);
      const studentIds = new Set(parentStudents.map((s) => s.id));
      const studentCodeIds = new Set(parentStudents.map((s) => s.studentId));

      return sanitized.filter(
        (inv) =>
          studentIds.has(inv.studentId) ||
          studentCodeIds.has(inv.studentId) ||
          inv.parentId === user.id ||
          inv.parentName === user.name
      );
    }

    return sanitized;
  }

  getInvoice(idOrNumber: string, user?: User): InvoiceItem | undefined {
    const invoices = this.getInvoices(user);
    return invoices.find((inv) => inv.id === idOrNumber || inv.invoiceNumber === idOrNumber);
  }

  createInvoice(
    invoiceData: Omit<InvoiceItem, 'id' | 'invoiceNumber' | 'balance' | 'status'> & {
      id?: string;
      invoiceNumber?: string;
      status?: InvoiceStatus;
    },
    actor?: User
  ): InvoiceItem {
    const invoices = this.load<InvoiceItem[]>(FINANCE_STORAGE_KEYS.INVOICES, initialInvoices);
    const settings = this.getFinanceSettings();

    const count = invoices.length + 1;
    const invoiceNumber =
      invoiceData.invoiceNumber || `${settings.invoicePrefix}-${String(count).padStart(6, '0')}`;
    const id = invoiceData.id || `INV-${Date.now()}`;

    const subtotal = invoiceData.lineItems.reduce((acc, item) => acc + Number(item.amount || 0), 0);
    const discount = Number(invoiceData.discount || 0);
    const scholarship = Number(invoiceData.scholarship || 0);
    const adjustments = Number(invoiceData.adjustments || 0);
    const total = Math.max(0, subtotal - discount - scholarship + adjustments);
    const amountPaid = Number(invoiceData.amountPaid || 0);
    const balance = Math.max(0, total - amountPaid);

    let status: InvoiceStatus = invoiceData.status || 'ISSUED';
    if (balance === 0 && total > 0) {
      status = 'PAID';
    } else if (amountPaid > 0 && balance > 0) {
      status = 'PARTIALLY_PAID';
    } else if (invoiceData.dueDate < new Date().toISOString().split('T')[0] && balance > 0) {
      status = 'OVERDUE';
    }

    const newInvoice: InvoiceItem = {
      ...invoiceData,
      id,
      invoiceNumber,
      subtotal,
      discount,
      scholarship,
      adjustments,
      total,
      amountPaid,
      balance,
      status,
    };

    const updatedInvoices = [newInvoice, ...invoices];
    this.save(FINANCE_STORAGE_KEYS.INVOICES, updatedInvoices);

    // Notify parent if enabled
    if (settings.enableParentNotifications && newInvoice.parentId) {
      dataService.createNotification({
        title: `Tuition Invoice Generated: ${newInvoice.invoiceNumber}`,
        message: `An invoice of $${newInvoice.total.toLocaleString()} for ${newInvoice.studentName} is due on ${newInvoice.dueDate}.`,
        type: 'fee_reminder',
        targetRole: 'parent',
        relatedModule: 'finance',
        relatedRecordId: newInvoice.id,
      });
    }

    dataService.logActivity({
      action: 'Invoice Created',
      actor: actor?.name || 'Bursar',
      role: actor?.role || 'accountant',
      details: `Generated invoice ${newInvoice.invoiceNumber} for ${newInvoice.studentName} ($${newInvoice.total.toLocaleString()})`,
      entityType: 'payment',
    });

    return newInvoice;
  }

  cancelInvoice(invoiceId: string, reason: string, actor?: User): { success: boolean; error?: string } {
    const invoices = this.getInvoices();
    const index = invoices.findIndex((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);

    if (index === -1) {
      return { success: false, error: 'Invoice not found' };
    }

    const target = invoices[index];
    if (target.amountPaid > 0) {
      return {
        success: false,
        error: `Cannot cancel invoice with recorded payments ($${target.amountPaid}). Please reverse or refund the payments first.`,
      };
    }

    target.status = 'CANCELLED';
    target.balance = 0;
    target.cancelledReason = reason;
    target.cancelledBy = actor?.name || 'Bursar';
    target.cancelledAt = new Date().toISOString();

    this.save(FINANCE_STORAGE_KEYS.INVOICES, invoices);

    dataService.logActivity({
      action: 'Invoice Cancelled',
      actor: actor?.name || 'Bursar',
      role: actor?.role || 'accountant',
      details: `Cancelled invoice ${target.invoiceNumber} for ${target.studentName}: "${reason}"`,
      entityType: 'payment',
    });

    return { success: true };
  }

  // ==========================================
  // 7. AUTOMATIC MONTHLY/TERM FEE GENERATION
  // ==========================================
  generateRecurringMonthlyInvoices(
    academicYear?: string,
    feePeriod?: string,
    actor?: User
  ): { generatedCount: number; skippedCount: number; invoices: InvoiceItem[] } {
    const students = dataService.getStudents().filter((s) => s.status === 'Active');
    const existingInvoices = this.getInvoices();
    const activeYear = academicYear || this.getActiveAcademicYear().name;
    const period = feePeriod || `Term 1 (${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`;
    const structures = this.getFeeStructures();
    const discounts = this.getDiscounts().filter((d) => d.approvalStatus === 'Approved');
    const scholarships = this.getScholarships().filter((s) => s.status === 'Active');
    const settings = this.getFinanceSettings();

    const createdInvoices: InvoiceItem[] = [];
    let skippedCount = 0;

    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + settings.defaultDuePeriodDays);
    const dueDateStr = dueDateObj.toISOString().split('T')[0];

    students.forEach((student) => {
      // Idempotency: skip if student already has invoice for same academic year and period
      const duplicate = existingInvoices.find(
        (inv) =>
          inv.studentId === student.id &&
          inv.academicYear === activeYear &&
          inv.feePeriod === period &&
          inv.status !== 'CANCELLED'
      );

      if (duplicate) {
        skippedCount++;
        return;
      }

      // Find appropriate fee structure
      const matchingStructure =
        structures.find((s) => s.classId === student.classId && s.isActive) ||
        structures.find((s) => s.className?.includes(student.className) && s.isActive) ||
        structures[0];

      if (!matchingStructure) {
        skippedCount++;
        return;
      }

      const lineItems = matchingStructure.components
        .filter((c) => c.isActive)
        .map((c) => ({
          id: `LI-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: c.name,
          category: c.name.includes('Lab')
            ? 'Laboratory'
            : c.name.includes('Transport')
            ? 'Transport'
            : c.name.includes('Library')
            ? 'Library'
            : 'Tuition',
          amount: c.amount,
        }));

      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

      // Check scholarships
      const studentScholarship = scholarships.find(
        (sch) => sch.studentId === student.id || sch.studentName.toLowerCase() === `${student.firstName} ${student.lastName}`.toLowerCase()
      );
      let scholarshipAmount = 0;
      let scholarshipName: string | undefined = undefined;
      if (studentScholarship) {
        scholarshipName = studentScholarship.scholarshipName;
        scholarshipAmount =
          studentScholarship.amountType === 'Percentage'
            ? Math.round((subtotal * studentScholarship.value) / 100)
            : studentScholarship.value;
      }

      // Check discounts
      const applicableDiscount = discounts[0]; // sibling or general
      let discountAmount = 0;
      let discountName: string | undefined = undefined;
      if (applicableDiscount && !studentScholarship) {
        discountName = applicableDiscount.name;
        discountAmount =
          applicableDiscount.type === 'Percentage'
            ? Math.round((subtotal * applicableDiscount.value) / 100)
            : applicableDiscount.value;
      }

      const total = Math.max(0, subtotal - discountAmount - scholarshipAmount);

      const count = existingInvoices.length + createdInvoices.length + 1;
      const invoiceNumber = `${settings.invoicePrefix}-${String(count).padStart(6, '0')}`;

      const newInvoice: InvoiceItem = {
        id: `INV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        invoiceNumber,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        parentId: student.parentId,
        parentName: student.fatherGuardianName,
        parentPhone: student.parentContact,
        academicYear: activeYear,
        feePeriod: period,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: dueDateStr,
        lineItems,
        subtotal,
        discount: discountAmount,
        discountName,
        scholarship: scholarshipAmount,
        scholarshipName,
        adjustments: 0,
        total,
        amountPaid: 0,
        balance: total,
        status: 'ISSUED',
        className: student.className,
        sectionName: student.sectionName,
      };

      createdInvoices.push(newInvoice);
    });

    if (createdInvoices.length > 0) {
      const allUpdated = [...createdInvoices, ...existingInvoices];
      this.save(FINANCE_STORAGE_KEYS.INVOICES, allUpdated);

      this.logFinanceAutomation({
        ruleName: 'Auto-Generate Recurring Invoices',
        trigger: 'MANUAL_EXECUTION',
        action: `Minted ${createdInvoices.length} recurring tuition invoices for ${period}`,
        status: 'SUCCESS',
        details: `Generated ${createdInvoices.length} invoices, skipped ${skippedCount} existing entries`,
      });

      dataService.logActivity({
        action: 'Batch Invoice Generation',
        actor: actor?.name || 'System Automation',
        role: actor?.role || 'accountant',
        details: `Batch generated ${createdInvoices.length} invoices for ${period} (${activeYear})`,
        entityType: 'payment',
      });
    }

    return {
      generatedCount: createdInvoices.length,
      skippedCount,
      invoices: createdInvoices,
    };
  }

  generateMonthlyInvoices(
    options: { feePeriod: string; academicYear: string; dueDate?: string; classId?: string },
    actor?: User
  ): { generatedCount: number; skippedCount: number; totalBilled: number } {
    const res = this.generateRecurringMonthlyInvoices(options.academicYear, options.feePeriod, actor);
    const totalBilled = res.invoices.reduce((sum, inv) => sum + inv.total, 0);
    return {
      generatedCount: res.generatedCount,
      skippedCount: res.skippedCount,
      totalBilled,
    };
  }

  // ==========================================
  // 8. PAYMENTS & PARTIAL PAYMENTS
  // ==========================================
  getFinancePayments(user?: User): FinancePaymentRecord[] {
    const payments = this.load<FinancePaymentRecord[]>(
      FINANCE_STORAGE_KEYS.PAYMENTS,
      initialFinancePayments
    );

    if (user && user.role === 'parent') {
      const parentStudents = this.getLinkedStudentsForParent(user);
      const studentIds = new Set(parentStudents.map((s) => s.id));
      const studentCodeIds = new Set(parentStudents.map((s) => s.studentId));

      return payments.filter(
        (p) =>
          studentIds.has(p.studentId) ||
          studentCodeIds.has(p.studentId) ||
          p.parentId === user.id ||
          p.parentName === user.name
      );
    }

    return payments;
  }

  recordFinancePayment(payload: {
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    transactionReference?: string;
    notes?: string;
    actor?: User;
  }): { success: boolean; payment?: FinancePaymentRecord; error?: string } {
    const invoices = this.getInvoices();
    const targetIndex = invoices.findIndex(
      (inv) => inv.id === payload.invoiceId || inv.invoiceNumber === payload.invoiceId
    );

    if (targetIndex === -1) {
      return { success: false, error: 'Target invoice not found.' };
    }

    const invoice = invoices[targetIndex];

    if (invoice.status === 'CANCELLED') {
      return { success: false, error: 'Cannot record payment for a cancelled invoice.' };
    }

    if (payload.amount <= 0) {
      return { success: false, error: 'Payment amount must be greater than $0.00.' };
    }

    if (payload.amount > invoice.balance) {
      return {
        success: false,
        error: `Payment amount ($${payload.amount.toLocaleString()}) cannot exceed the current outstanding balance ($${invoice.balance.toLocaleString()}).`,
      };
    }

    const payments = this.getFinancePayments();
    const settings = this.getFinanceSettings();
    const receiptCount = payments.length + 1;
    const receiptNumber = `${settings.receiptPrefix}-${String(receiptCount).padStart(6, '0')}`;
    const newPaidAmount = Number((invoice.amountPaid + payload.amount).toFixed(2));
    const newBalance = Number((invoice.total - newPaidAmount).toFixed(2));

    const newPayment: FinancePaymentRecord = {
      id: `PAY-${Date.now()}`,
      receiptNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      parentId: invoice.parentId,
      parentName: invoice.parentName,
      className: invoice.className,
      sectionName: invoice.sectionName,
      amountPaid: payload.amount,
      paymentDate: new Date().toISOString().split('T')[0],
      method: payload.method,
      transactionReference: payload.transactionReference || `TXN-${Date.now().toString().slice(-6)}`,
      notes: payload.notes,
      recordedBy: payload.actor?.name ? `${payload.actor.name} (${payload.actor.role})` : 'Eleanor Vance (Bursar)',
      status: 'Completed',
      remainingBalanceAfterPayment: newBalance,
    };

    // Update invoice state
    invoice.amountPaid = newPaidAmount;
    invoice.balance = newBalance;
    if (newBalance === 0) {
      invoice.status = 'PAID';
      invoice.paidDate = newPayment.paymentDate;
    } else {
      invoice.status = 'PARTIALLY_PAID';
    }

    invoices[targetIndex] = invoice;
    this.save(FINANCE_STORAGE_KEYS.INVOICES, invoices);

    const updatedPayments = [newPayment, ...payments];
    this.save(FINANCE_STORAGE_KEYS.PAYMENTS, updatedPayments);

    // Also update student feeStatus
    const students = dataService.getStudents();
    const stu = students.find((s) => s.id === invoice.studentId || s.studentId === invoice.studentId);
    if (stu) {
      const allStudentInvoices = invoices.filter(
        (i) => i.studentId === stu.id && i.status !== 'CANCELLED'
      );
      const totalRemaining = allStudentInvoices.reduce((sum, i) => sum + i.balance, 0);
      stu.pendingFeeAmount = totalRemaining;
      stu.feeStatus =
        totalRemaining === 0
          ? 'Paid'
          : allStudentInvoices.some((inv) => inv.status === 'OVERDUE')
          ? 'Overdue'
          : 'Pending';
      dataService.updateStudent(stu.id, {
        feeStatus: stu.feeStatus,
        pendingFeeAmount: stu.pendingFeeAmount,
      });
    }

    // Also sync to legacy dataService fees & payments
    try {
      dataService.recordPayment({
        feeId: invoice.id,
        studentId: invoice.studentId,
        studentName: invoice.studentName,
        amountPaid: payload.amount,
        method: payload.method,
      });
    } catch {
      // Non-blocking legacy sync
    }

    // Send notification to parent
    if (settings.enableParentNotifications && invoice.parentId) {
      dataService.createNotification({
        title: `Payment Receipt: ${receiptNumber}`,
        message: `Received $${payload.amount.toLocaleString()} for ${invoice.studentName}. Remaining balance: $${newBalance.toLocaleString()}.`,
        type: 'fee_reminder',
        targetRole: 'parent',
        relatedModule: 'finance',
        relatedRecordId: newPayment.id,
      });
    }

    dataService.logActivity({
      action: 'Fee Payment Logged',
      actor: payload.actor?.name || 'Bursar',
      role: payload.actor?.role || 'accountant',
      details: `Received $${payload.amount.toLocaleString()} for ${invoice.studentName} via ${payload.method} (Receipt: ${receiptNumber})`,
      entityType: 'payment',
    });

    return { success: true, payment: newPayment };
  }

  // ==========================================
  // 9. PAYMENT REVERSAL / REFUND
  // ==========================================
  reversePayment(
    paymentId: string,
    reason: string,
    actor?: User
  ): { success: boolean; error?: string } {
    const payments = this.getFinancePayments();
    const targetIndex = payments.findIndex((p) => p.id === paymentId || p.receiptNumber === paymentId);

    if (targetIndex === -1) {
      return { success: false, error: 'Payment record not found.' };
    }

    const payment = payments[targetIndex];
    if (payment.status === 'Reversed' || payment.isReversed) {
      return { success: false, error: 'This payment transaction has already been reversed.' };
    }

    // Reopen/re-adjust invoice balance
    const invoices = this.getInvoices();
    const invoice = invoices.find((i) => i.id === payment.invoiceId || i.invoiceNumber === payment.invoiceNumber);

    if (invoice) {
      invoice.amountPaid = Math.max(0, Number((invoice.amountPaid - payment.amountPaid).toFixed(2)));
      invoice.balance = Number((invoice.total - invoice.amountPaid).toFixed(2));
      if (invoice.balance > 0) {
        const today = new Date().toISOString().split('T')[0];
        invoice.status = invoice.dueDate < today ? 'OVERDUE' : invoice.amountPaid > 0 ? 'PARTIALLY_PAID' : 'ISSUED';
      }
      this.save(FINANCE_STORAGE_KEYS.INVOICES, invoices);
    }

    payment.status = 'Reversed';
    payment.isReversed = true;
    payment.reversalReason = reason;
    payment.reversedBy = actor?.name ? `${actor.name} (${actor.role})` : 'Eleanor Vance (Bursar)';
    payment.reversedAt = new Date().toISOString();
    payment.refundAmount = payment.amountPaid;

    payments[targetIndex] = payment;
    this.save(FINANCE_STORAGE_KEYS.PAYMENTS, payments);

    dataService.logActivity({
      action: 'Payment Reversal Executed',
      actor: actor?.name || 'Bursar',
      role: actor?.role || 'accountant',
      details: `Reversed payment of $${payment.amountPaid.toLocaleString()} for ${payment.studentName} (${payment.receiptNumber}): "${reason}"`,
      entityType: 'payment',
    });

    return { success: true };
  }

  // ==========================================
  // 10. REMINDERS & OVERDUE AUTOMATION
  // ==========================================
  sendPaymentReminder(invoiceId: string, actor?: User): { success: boolean; message: string } {
    const invoices = this.getInvoices();
    const invoice = invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);

    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    invoice.lastReminderDate = new Date().toISOString().split('T')[0];
    invoice.reminderCount = (invoice.reminderCount || 0) + 1;
    this.save(FINANCE_STORAGE_KEYS.INVOICES, invoices);

    dataService.createNotification({
      title: `Payment Reminder: ${invoice.invoiceNumber}`,
      message: `Friendly reminder that tuition balance of $${invoice.balance.toLocaleString()} for ${invoice.studentName} is ${invoice.status === 'OVERDUE' ? 'overdue' : `due on ${invoice.dueDate}`}.`,
      type: 'fee_reminder',
      targetRole: 'parent',
      relatedModule: 'finance',
      relatedRecordId: invoice.id,
    });

    dataService.logActivity({
      action: 'Payment Reminder Sent',
      actor: actor?.name || 'Bursar',
      role: actor?.role || 'accountant',
      details: `Sent payment reminder #${invoice.reminderCount} to guardian of ${invoice.studentName} for invoice ${invoice.invoiceNumber}`,
      entityType: 'payment',
    });

    return {
      success: true,
      message: `Reminder dispatch #${invoice.reminderCount} completed successfully for ${invoice.studentName}.`,
    };
  }

  // ==========================================
  // 11. STUDENT FEE PROFILES
  // ==========================================
  getStudentFeeProfiles(): StudentFeeProfile[] {
    const students = dataService.getStudents();
    const invoices = this.getInvoices();
    const structures = this.getFeeStructures();
    const adjustments = this.getAdjustments();
    const scholarships = this.getScholarships();

    return students.map((student) => {
      const studentInvoices = invoices.filter(
        (i) => (i.studentId === student.id || i.studentId === student.studentId) && i.status !== 'CANCELLED'
      );

      const assignedStructure =
        structures.find((s) => s.classId === student.classId) ||
        structures.find((s) => s.className?.includes(student.className)) ||
        structures[0];

      const totalPayable = studentInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const totalPaid = studentInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      const balance = studentInvoices.reduce((sum, inv) => sum + inv.balance, 0);
      const overdueAmount = studentInvoices
        .filter((inv) => inv.status === 'OVERDUE')
        .reduce((sum, inv) => sum + inv.balance, 0);

      const discountsTotal = studentInvoices.reduce((sum, inv) => sum + (inv.discount || 0), 0);
      const scholarshipsTotal = studentInvoices.reduce((sum, inv) => sum + (inv.scholarship || 0), 0);
      const studentAdj = adjustments.filter(
        (a) => a.studentId === student.id || a.studentId === student.studentId
      );

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        classId: student.classId,
        className: student.className,
        rollNumber: student.rollNumber,
        assignedStructureId: assignedStructure?.id,
        assignedStructureName: assignedStructure?.name,
        tuition: assignedStructure?.totalAmount || 3000,
        otherCharges: 0,
        discounts: discountsTotal,
        scholarships: scholarshipsTotal,
        adjustments: studentAdj.reduce((acc, a) => acc + a.amount, 0),
        totalPayable: totalPayable || (assignedStructure?.totalAmount || 3000),
        totalPaid,
        balance,
        overdueAmount,
        feeStatus: balance <= 0 ? 'Paid' : overdueAmount > 0 ? 'Overdue' : totalPaid > 0 ? 'Partial' : 'Pending',
        adjustmentsList: studentAdj,
      };
    });
  }

  // ==========================================
  // 12. DASHBOARD & METRICS
  // ==========================================
  getFinanceDashboardMetrics() {
    const invoices = this.getInvoices().filter((i) => i.status !== 'CANCELLED');
    const payments = this.getFinancePayments().filter((p) => p.status === 'Completed');

    const totalExpected = invoices.reduce((acc, i) => acc + i.total, 0);
    const totalCollected = payments.reduce((acc, p) => acc + p.amountPaid, 0);
    const totalPending = invoices
      .filter((i) => i.status === 'ISSUED' || i.status === 'PARTIALLY_PAID')
      .reduce((acc, i) => acc + i.balance, 0);
    const totalOverdue = invoices
      .filter((i) => i.status === 'OVERDUE')
      .reduce((acc, i) => acc + i.balance, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const currentYearMonth = todayStr.substring(0, 7); // e.g. "2026-09"

    const todayCollection = payments
      .filter((p) => p.paymentDate === todayStr)
      .reduce((acc, p) => acc + p.amountPaid, 0);

    const thisMonthCollection = payments
      .filter((p) => p.paymentDate.startsWith(currentYearMonth))
      .reduce((acc, p) => acc + p.amountPaid, 0);

    // Previous month (e.g. "2026-08")
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonthStr = prevMonthDate.toISOString().substring(0, 7);
    const previousMonthCollection = payments
      .filter((p) => p.paymentDate.startsWith(prevMonthStr))
      .reduce((acc, p) => acc + p.amountPaid, 0);

    const collectionPercentage = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    // Status counts
    const statusBreakdown = {
      paid: invoices.filter((i) => i.status === 'PAID').length,
      partiallyPaid: invoices.filter((i) => i.status === 'PARTIALLY_PAID').length,
      pending: invoices.filter((i) => i.status === 'ISSUED').length,
      overdue: invoices.filter((i) => i.status === 'OVERDUE').length,
    };

    // Class-wise collection
    const classMap = new Map<string, { expected: number; collected: number }>();
    invoices.forEach((inv) => {
      const cls = inv.className || 'General';
      const cur = classMap.get(cls) || { expected: 0, collected: 0 };
      cur.expected += inv.total;
      cur.collected += inv.amountPaid;
      classMap.set(cls, cur);
    });

    const classWise = Array.from(classMap.entries()).map(([className, data]) => ({
      className,
      expected: data.expected,
      collected: data.collected,
      rate: data.expected > 0 ? Math.round((data.collected / data.expected) * 100) : 0,
    }));

    return {
      totalExpected,
      totalCollected,
      totalPending,
      totalOverdue,
      todayCollection,
      thisMonthCollection,
      previousMonthCollection,
      collectionPercentage,
      statusBreakdown,
      classWise,
      recentPayments: payments.slice(0, 6),
      overdueInvoices: invoices.filter((i) => i.status === 'OVERDUE'),
    };
  }

  // ==========================================
  // 13. SETTINGS, RULES & AUTOMATION LOGS
  // ==========================================
  getFinanceSettings(): FinanceSettings {
    return this.load<FinanceSettings>(FINANCE_STORAGE_KEYS.SETTINGS, initialFinanceSettings);
  }

  updateFinanceSettings(settings: Partial<FinanceSettings>, actor?: User): FinanceSettings {
    const current = this.getFinanceSettings();
    const updated = { ...current, ...settings };
    this.save(FINANCE_STORAGE_KEYS.SETTINGS, updated);

    dataService.logActivity({
      action: 'Finance Settings Updated',
      actor: actor?.name || 'Bursar',
      role: actor?.role || 'accountant',
      details: 'Modified financial policy parameters and notification schedules',
      entityType: 'payment',
    });

    return updated;
  }

  getFinanceAutomationRules(): FinanceAutomationRule[] {
    return this.load<FinanceAutomationRule[]>(
      FINANCE_STORAGE_KEYS.RULES,
      initialFinanceAutomationRules
    );
  }

  updateFinanceAutomationRule(id: string, updates: Partial<FinanceAutomationRule>, actor?: User): boolean {
    const rules = this.getFinanceAutomationRules();
    const idx = rules.findIndex((r) => r.id === id);
    if (idx === -1) return false;

    rules[idx] = { ...rules[idx], ...updates };
    this.save(FINANCE_STORAGE_KEYS.RULES, rules);

    dataService.logActivity({
      action: 'Automation Rule Updated',
      actor: actor?.name || 'Bursar',
      role: actor?.role || 'accountant',
      details: `Updated rule "${rules[idx].name}" (${rules[idx].status})`,
      entityType: 'payment',
    });

    return true;
  }

  getFinanceAutomationLogs(): FinanceAutomationLog[] {
    return this.load<FinanceAutomationLog[]>(
      FINANCE_STORAGE_KEYS.LOGS,
      initialFinanceAutomationLogs
    );
  }

  logFinanceAutomation(log: Omit<FinanceAutomationLog, 'id' | 'timestamp'>): void {
    const logs = this.getFinanceAutomationLogs();
    const newLog: FinanceAutomationLog = {
      ...log,
      id: `FAL-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    const updated = [newLog, ...logs.slice(0, 99)];
    this.save(FINANCE_STORAGE_KEYS.LOGS, updated);
  }

  // Convenience Aliases
  getPayments(user?: User) {
    return this.getFinancePayments(user);
  }

  getDashboardMetrics() {
    return this.getFinanceDashboardMetrics();
  }

  getSettings() {
    return this.getFinanceSettings();
  }

  saveSettings(settings: Partial<FinanceSettings>, actor?: User) {
    return this.updateFinanceSettings(settings, actor);
  }

  getAutomationRules() {
    return this.getFinanceAutomationRules();
  }

  toggleAutomationRule(id: string, active: boolean, actor?: User) {
    return this.updateFinanceAutomationRule(id, { status: active ? 'Active' : 'Paused' }, actor);
  }

  getAutomationLogs() {
    return this.getFinanceAutomationLogs();
  }

  runOverdueEscalationCheck(actor?: User): { updatedCount: number; remindersSent: number } {
    const invoices = this.getInvoices();
    const settings = this.getFinanceSettings();
    const today = new Date().toISOString().split('T')[0];

    let updatedCount = 0;
    let remindersSent = 0;

    for (const inv of invoices) {
      if (inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.balance > 0) {
        if (inv.dueDate < today && inv.status !== 'OVERDUE') {
          inv.status = 'OVERDUE';
          updatedCount++;
        }
        if (inv.status === 'OVERDUE' && settings.enableParentNotifications) {
          this.sendPaymentReminder(inv.id, actor);
          remindersSent++;
        }
      }
    }

    if (updatedCount > 0) {
      this.save(FINANCE_STORAGE_KEYS.INVOICES, invoices);
      this.logFinanceAutomation({
        ruleName: 'Overdue Escalation Workflow',
        trigger: 'MANUAL_EXECUTION',
        action: `Escalated ${updatedCount} statements to OVERDUE status`,
        status: 'SUCCESS',
        details: `Updated ${updatedCount} records; dispatched ${remindersSent} notifications`,
      });
    }

    return { updatedCount, remindersSent };
  }

  // ==========================================
  // HELPER: Link students for Parent
  // ==========================================
  private getLinkedStudentsForParent(user: User): Student[] {
    const students = dataService.getStudents();
    const linkedIds = user.linkedStudentIds || [];
    return students.filter(
      (s) =>
        linkedIds.includes(s.id) ||
        linkedIds.includes(s.studentId) ||
        s.parentId === user.id ||
        s.fatherGuardianName.toLowerCase().includes(user.name.toLowerCase())
    );
  }
}

export const financeService = new FinanceService();
