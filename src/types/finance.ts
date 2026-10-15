export type AcademicYearStatus = 'ACTIVE' | 'UPCOMING' | 'CLOSED';

export interface AcademicYear {
  id: string;
  name: string; // e.g., "2026–2027"
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
  isDefault?: boolean;
}

export type FeeFrequency = 'One-time' | 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Annual';

export interface FeeComponent {
  id: string;
  name: string; // Tuition, Lab, Transport, Library, Admission, Examination, Activity, Other
  amount: number;
  frequency: FeeFrequency;
  isMandatory: boolean;
  description?: string;
  isActive: boolean;
  category?: string;
}

export interface FeeStructure {
  id: string;
  name: string;
  academicYearId: string;
  academicYearName: string;
  classId?: string; // 'all' or specific class id
  className?: string;
  sectionId?: string;
  sectionName?: string;
  studentCategory?: string; // 'General' | 'Day Scholar' | 'Boarder' | 'Staff Ward' | 'International'
  components: FeeComponent[];
  totalAmount: number;
  isActive: boolean;
  createdAt: string;
}

export type AdjustmentType = 'Credit' | 'Debit' | 'Waiver' | 'Penalty' | 'Late Fee';

export interface StudentFeeAdjustment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  type: AdjustmentType;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface DiscountItem {
  id: string;
  name: string; // Sibling discount, Merit discount, Staff discount, Special discount
  type: 'Fixed' | 'Percentage';
  value: number;
  startDate: string;
  endDate: string;
  approvalStatus: 'Approved' | 'Pending' | 'Rejected';
  reason: string;
  applicableCategories?: string[];
  createdBy: string;
  approvedBy?: string;
}

export interface ScholarshipItem {
  id: string;
  scholarshipName: string;
  studentId: string;
  studentName: string;
  amountType: 'Fixed' | 'Percentage';
  value: number;
  startDate: string;
  endDate: string;
  reason: string;
  approvedBy: string;
  status: 'Active' | 'Under Review' | 'Expired';
}

export interface StudentFeeProfile {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  rollNumber?: string;
  assignedStructureId?: string;
  assignedStructureName?: string;
  tuition: number;
  otherCharges: number;
  discounts: number;
  scholarships: number;
  adjustments: number;
  totalPayable: number;
  totalPaid: number;
  balance: number;
  overdueAmount: number;
  feeStatus?: 'Paid' | 'Pending' | 'Overdue' | 'Partial';
  adjustmentsList: StudentFeeAdjustment[];
}

export interface InvoiceLineItem {
  id: string;
  name: string;
  category: string;
  amount: number;
}

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export interface InvoiceItem {
  id: string;
  invoiceNumber: string; // INV-2026-000001
  studentId: string;
  studentName: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  academicYear: string;
  feePeriod: string; // e.g. "September 2026", "Term 1"
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  discountName?: string;
  scholarship: number;
  scholarshipName?: string;
  adjustments: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  paidDate?: string;
  cancelledReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  lastReminderDate?: string;
  reminderCount?: number;
  className?: string;
  sectionName?: string;
}

export type PaymentMethod =
  | 'Cash'
  | 'Bank Transfer'
  | 'Card'
  | 'Online Payment'
  | 'Cheque'
  | 'Other';

export interface FinancePaymentRecord {
  id: string;
  receiptNumber: string; // REC-2026-000101
  invoiceId: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  parentId?: string;
  parentName?: string;
  className?: string;
  sectionName?: string;
  amountPaid: number;
  paymentDate: string;
  method: PaymentMethod;
  transactionReference?: string;
  notes?: string;
  recordedBy: string;
  status: 'Completed' | 'Processing' | 'Reversed';
  isReversed?: boolean;
  reversalReason?: string;
  reversedBy?: string;
  reversedAt?: string;
  refundAmount?: number;
  remainingBalanceAfterPayment: number;
}

export interface PaymentReversalRequest {
  id: string;
  paymentId: string;
  receiptNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  studentName: string;
  amount: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
}

export interface FinanceSettings {
  currency: string;
  currencyCode: string;
  invoicePrefix: string;
  receiptPrefix: string;
  defaultDuePeriodDays: number;
  lateFeePercentage: number;
  lateFeeGracePeriodDays: number;
  reminderScheduleDays: number[]; // [7, 3, 1]
  enableAutoInvoiceGeneration: boolean;
  enableParentNotifications: boolean;
  enableAdminAlertsOnOverdue: boolean;
  overdueMessageTemplate: string;
  paymentReceiptTemplate: string;
  activeAcademicYear: string;
}

export interface FinanceAutomationRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  status: 'Active' | 'Paused';
  executionCount: number;
  lastExecuted?: string;
}

export interface FinanceAutomationLog {
  id: string;
  ruleName: string;
  trigger: string;
  studentName?: string;
  invoiceNumber?: string;
  action: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  details?: string;
  error?: string;
}

// Aliases for component convenience
export type FeeDiscount = DiscountItem;
export type Scholarship = ScholarshipItem;
export type FeeAutomationRule = FinanceAutomationRule;

export interface FinanceDashboardMetrics {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  todayCollection: number;
  thisMonthCollection: number;
  previousMonthCollection: number;
  collectionPercentage: number;
  statusBreakdown: {
    paid: number;
    partiallyPaid: number;
    pending: number;
    overdue: number;
  };
  classWise: {
    className: string;
    expected: number;
    collected: number;
    rate: number;
  }[];
  recentPayments: FinancePaymentRecord[];
  overdueInvoices: InvoiceItem[];
}

