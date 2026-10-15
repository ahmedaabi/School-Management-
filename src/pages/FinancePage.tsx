import React, { useState, useEffect } from 'react';
import {
  Wallet,
  LayoutDashboard,
  Layers,
  Users,
  FileText,
  CreditCard,
  Clock,
  AlertTriangle,
  Percent,
  Award,
  Receipt,
  FileBarChart,
  Settings,
  Plus,
  ShieldCheck,
  Send,
  Eye,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { financeService } from '../services/financeService';
import { dataService } from '../services/dataService';
import {
  FeeStructure,
  InvoiceItem,
  FinancePaymentRecord,
  StudentFeeProfile,
  FeeDiscount,
  Scholarship,
  FinanceSettings,
  FeeAutomationRule,
  FinanceAutomationLog,
  FinanceDashboardMetrics,
} from '../types/finance';

import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

// Import Finance Views
import { FinanceDashboardView } from '../components/finance/FinanceDashboardView';
import { FeeStructuresView } from '../components/finance/FeeStructuresView';
import { StudentFeesView } from '../components/finance/StudentFeesView';
import { InvoicesView } from '../components/finance/InvoicesView';
import { PaymentsView } from '../components/finance/PaymentsView';
import { PendingFeesView } from '../components/finance/PendingFeesView';
import { OverdueFeesView } from '../components/finance/OverdueFeesView';
import { DiscountsView } from '../components/finance/DiscountsView';
import { ScholarshipsView } from '../components/finance/ScholarshipsView';
import { ReceiptsView } from '../components/finance/ReceiptsView';
import { FinancialReportsView } from '../components/finance/FinancialReportsView';
import { FinanceSettingsView } from '../components/finance/FinanceSettingsView';

// Import Modals
import { InvoiceDetailModal } from '../components/finance/modals/InvoiceDetailModal';
import { ReceiptViewModal } from '../components/finance/modals/ReceiptViewModal';
import { RecordFinancePaymentModal } from '../components/finance/modals/RecordFinancePaymentModal';
import { FeeStructureModal } from '../components/finance/modals/FeeStructureModal';
import { DiscountModal } from '../components/finance/modals/DiscountModal';
import { ScholarshipModal } from '../components/finance/modals/ScholarshipModal';
import { StudentAdjustmentModal } from '../components/finance/modals/StudentAdjustmentModal';
import { CancelInvoiceModal } from '../components/finance/modals/CancelInvoiceModal';
import { ReversePaymentModal } from '../components/finance/modals/ReversePaymentModal';
import { BatchGenerateInvoicesModal } from '../components/finance/modals/BatchGenerateInvoicesModal';

export type FinanceTab =
  | 'dashboard'
  | 'structures'
  | 'student-fees'
  | 'invoices'
  | 'payments'
  | 'pending'
  | 'overdue'
  | 'discounts'
  | 'scholarships'
  | 'receipts'
  | 'reports'
  | 'settings';

export interface FinancePageProps {
  subRoute?: string;
  onOpenRecordPayment?: () => void;
  onNavigateStudent?: (studentId: string) => void;
}

export const FinancePage: React.FC<FinancePageProps> = ({
  subRoute,
  onNavigateStudent,
}) => {
  const { currentUser, can } = useAuth();
  const { showToast } = useToast();

  // Helper to map route string to FinanceTab
  const getTabFromRoute = (route?: string): FinanceTab => {
    if (!route) return 'dashboard';
    if (route === 'finance-structures' || route === 'finance-fees') return 'structures';
    if (route === 'finance-student-fees') return 'student-fees';
    if (route === 'finance-invoices') return 'invoices';
    if (route === 'finance-payments') return 'payments';
    if (route === 'finance-pending') return 'pending';
    if (route === 'finance-overdue') return 'overdue';
    if (route === 'finance-discounts') return 'discounts';
    if (route === 'finance-scholarships') return 'scholarships';
    if (route === 'finance-receipts') return 'receipts';
    if (route === 'finance-reports') return 'reports';
    if (route === 'finance-settings') return 'settings';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<FinanceTab>(() => getTabFromRoute(subRoute));

  // Sync tab if subRoute changes from navigation
  useEffect(() => {
    if (subRoute) {
      setActiveTab(getTabFromRoute(subRoute));
    }
  }, [subRoute]);

  // Data States
  const [metrics, setMetrics] = useState<FinanceDashboardMetrics>(() =>
    financeService.getDashboardMetrics()
  );
  const [structures, setStructures] = useState<FeeStructure[]>(() =>
    financeService.getFeeStructures()
  );
  const [studentProfiles, setStudentProfiles] = useState<StudentFeeProfile[]>(() =>
    financeService.getStudentFeeProfiles()
  );
  const [invoices, setInvoices] = useState<InvoiceItem[]>(() => financeService.getInvoices());
  const [payments, setPayments] = useState<FinancePaymentRecord[]>(() =>
    financeService.getPayments()
  );
  const [discounts, setDiscounts] = useState<FeeDiscount[]>(() =>
    financeService.getDiscounts()
  );
  const [scholarships, setScholarships] = useState<Scholarship[]>(() =>
    financeService.getScholarships()
  );
  const [settings, setSettings] = useState<FinanceSettings>(() =>
    financeService.getSettings()
  );
  const [rules, setRules] = useState<FeeAutomationRule[]>(() =>
    financeService.getAutomationRules()
  );
  const [automationLogs, setAutomationLogs] = useState<FinanceAutomationLog[]>(() =>
    financeService.getAutomationLogs()
  );

  // Refresh data helper
  const reloadData = () => {
    setMetrics(financeService.getDashboardMetrics());
    setStructures(financeService.getFeeStructures());
    setStudentProfiles(financeService.getStudentFeeProfiles());
    setInvoices(financeService.getInvoices());
    setPayments(financeService.getPayments());
    setDiscounts(financeService.getDiscounts());
    setScholarships(financeService.getScholarships());
    setSettings(financeService.getSettings());
    setRules(financeService.getAutomationRules());
    setAutomationLogs(financeService.getAutomationLogs());
  };

  // Modal States
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<FinancePaymentRecord | null>(null);

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [prefilledStudentId, setPrefilledStudentId] = useState<string | undefined>(undefined);
  const [prefilledInvoiceId, setPrefilledInvoiceId] = useState<string | undefined>(undefined);

  const [isFeeStructureModalOpen, setIsFeeStructureModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<FeeDiscount | null>(null);

  const [isScholarshipModalOpen, setIsScholarshipModalOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentStudentId, setAdjustmentStudentId] = useState<string | null>(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<InvoiceItem | null>(null);

  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [paymentToReverse, setPaymentToReverse] = useState<FinancePaymentRecord | null>(null);

  const [isBatchGenerateModalOpen, setIsBatchGenerateModalOpen] = useState(false);

  // Quick Action Handlers
  const handleOpenRecordPayment = (studentId?: string, invoiceId?: string) => {
    setPrefilledStudentId(studentId);
    setPrefilledInvoiceId(invoiceId);
    setIsRecordPaymentOpen(true);
  };

  const handleSendReminder = (invoice: InvoiceItem) => {
    financeService.sendPaymentReminder(invoice.id, currentUser);
    showToast(`Payment reminder notice dispatched for ${invoice.studentName}.`, 'success');
    reloadData();
  };

  const handleOpenAdjustment = (studentId: string) => {
    setAdjustmentStudentId(studentId);
    setIsAdjustmentModalOpen(true);
  };

  const handleCancelInvoice = (invoice: InvoiceItem) => {
    setInvoiceToCancel(invoice);
    setIsCancelModalOpen(true);
  };

  const handleReversePayment = (payment: FinancePaymentRecord) => {
    setPaymentToReverse(payment);
    setIsReverseModalOpen(true);
  };

  // If user is Teacher or Student:
  if (currentUser?.role === 'teacher' || currentUser?.role === 'student') {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Institutional Bursar Records Restricted</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Access to school-wide finance dashboards, fee structures, and collection ledgers is restricted
          to the Principal, School Accountant, and authorized Administrative personnel.
        </p>
      </div>
    );
  }

  // If user is Parent: Dedicated Family Tuition Portal
  if (currentUser?.role === 'parent') {
    // Get student records for this parent
    const allStudents = dataService.getStudents();
    const linkedIds = currentUser.linkedStudentIds || [];
    const parentStudents = allStudents.filter(
      (s) =>
        linkedIds.includes(s.id) ||
        linkedIds.includes(s.studentId) ||
        (s.fatherGuardianName &&
          s.fatherGuardianName.toLowerCase().includes(currentUser.name.toLowerCase()))
    );

    const childIds = parentStudents.map((s) => s.id);
    const familyInvoices = invoices.filter((i) => childIds.includes(i.studentId));
    const familyPayments = payments.filter((p) => childIds.includes(p.studentId) && !p.isReversed);

    const totalFamilyBilled = familyInvoices.reduce((sum, i) => sum + i.total, 0);
    const totalFamilyPaid = familyInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
    const totalFamilyDue = familyInvoices.reduce((sum, i) => sum + i.balance, 0);

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Parent Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              Family Tuition & Billing Portal
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review assigned fee structures, outstanding balances, and official school fee receipts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-right">
              <span className="text-[10px] uppercase font-semibold text-indigo-600 block">
                Total Outstanding Balance
              </span>
              <span
                className={`text-xl font-bold font-mono ${
                  totalFamilyDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                ${totalFamilyDue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Children Fee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parentStudents.map((child) => {
            const childInvoices = familyInvoices.filter((i) => i.studentId === child.id);
            const childDue = childInvoices.reduce((sum, i) => sum + i.balance, 0);
            const childPaid = childInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
            const childTotal = childInvoices.reduce((sum, i) => sum + i.total, 0);

            return (
              <div
                key={child.id}
                className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {child.firstName} {child.lastName}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      Student ID: {child.studentId || child.id} • Class: {child.className}
                    </span>
                  </div>
                  <Badge variant={childDue === 0 ? 'success' : 'danger'}>
                    {childDue === 0 ? 'Fully Cleared' : 'Balance Pending'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Total Billed
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-800">
                      ${childTotal.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Amount Paid
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-600">
                      ${childPaid.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Remaining Due
                    </span>
                    <span className="text-sm font-bold font-mono text-rose-600">
                      ${childDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Invoices List for Parent */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              School Statements & Fee Invoices
            </h3>
            <span className="text-xs text-slate-400">{familyInvoices.length} invoices issued</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                  <th className="py-2.5 px-4 text-right">Paid</th>
                  <th className="py-2.5 px-4 text-right">Balance</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {familyInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{inv.studentName}</td>
                    <td className="py-2.5 px-4 text-slate-600">{inv.feePeriod}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{inv.dueDate}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium">
                      ${inv.total.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-600 font-semibold">
                      ${inv.amountPaid.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600">
                      ${inv.balance.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-[10px] uppercase">
                      <Badge
                        variant={
                          inv.status === 'PAID'
                            ? 'success'
                            : inv.status === 'OVERDUE'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] py-1 px-2.5 h-auto"
                        onClick={() => setSelectedInvoice(inv)}
                        leftIcon={<Eye className="w-3 h-3" />}
                      >
                        View & Print
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Parent View Modals */}
        {selectedInvoice && (
          <InvoiceDetailModal
            isOpen={!!selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            invoice={selectedInvoice}
            onRecordPayment={(inv) => {
              setSelectedInvoice(null);
              handleOpenRecordPayment(inv.studentId, inv.id);
            }}
          />
        )}

        {selectedPayment && (
          <ReceiptViewModal
            isOpen={!!selectedPayment}
            onClose={() => setSelectedPayment(null)}
            payment={selectedPayment}
          />
        )}
      </div>
    );
  }

  // ADMINISTRATIVE & BURSAR VIEW
  const navTabs: { id: FinanceTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Finance Dashboard', icon: LayoutDashboard },
    { id: 'structures', label: 'Fee Structures', icon: Layers },
    { id: 'student-fees', label: 'Student Fees', icon: Users },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'pending', label: 'Pending Fees', icon: Clock },
    { id: 'overdue', label: 'Overdue Fees', icon: AlertTriangle },
    { id: 'discounts', label: 'Discounts', icon: Percent },
    { id: 'scholarships', label: 'Scholarships', icon: Award },
    { id: 'receipts', label: 'Receipts', icon: Receipt },
    { id: 'reports', label: 'Financial Reports', icon: FileBarChart },
    { id: 'settings', label: 'Finance Settings', icon: Settings },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
              Institutional Bursar & Treasury
            </span>
            <span className="text-xs text-slate-400 font-mono">Academic Year 2025-2026</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            School Finance & Fee Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end fee scheduling, automated student invoicing, reconciliation, and receipts.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {can('payments.create') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenRecordPayment()}
              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
            >
              Record Payment
            </Button>
          )}

          {can('fees.create') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBatchGenerateModalOpen(true)}
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              Generate Monthly Invoices
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto pb-1">
        <div className="flex items-center gap-1 min-w-max">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'overdue' && metrics.totalOverdue > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-indigo-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    !
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab View Rendering */}
      <div>
        {activeTab === 'dashboard' && (
          <FinanceDashboardView
            metrics={metrics}
            onOpenRecordPayment={() => handleOpenRecordPayment()}
            onOpenGenerateInvoices={() => setIsBatchGenerateModalOpen(true)}
            onOpenFeeStructureModal={() => {
              setEditingStructure(null);
              setIsFeeStructureModalOpen(true);
            }}
            onViewInvoice={(inv) => setSelectedInvoice(inv)}
            onViewReceipt={(pay) => setSelectedPayment(pay)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'structures' && (
          <FeeStructuresView
            structures={structures}
            onOpenCreateModal={() => {
              setEditingStructure(null);
              setIsFeeStructureModalOpen(true);
            }}
            onEditStructure={(struct) => {
              setEditingStructure(struct);
              setIsFeeStructureModalOpen(true);
            }}
          />
        )}

        {activeTab === 'student-fees' && (
          <StudentFeesView
            profiles={studentProfiles}
            onOpenRecordPayment={(studentId) => handleOpenRecordPayment(studentId)}
            onOpenAdjustment={(studentId) => handleOpenAdjustment(studentId)}
            onViewStudentInvoice={(studentId) => {
              const inv = invoices.find((i) => i.studentId === studentId);
              if (inv) setSelectedInvoice(inv);
              else showToast('No active invoice found for student.', 'info');
            }}
            onNavigateStudent={onNavigateStudent}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesView
            invoices={invoices}
            onViewInvoice={(inv) => setSelectedInvoice(inv)}
            onRecordPayment={(inv) => handleOpenRecordPayment(inv.studentId, inv.id)}
            onSendReminder={(inv) => handleSendReminder(inv)}
            onOpenBatchGenerate={() => setIsBatchGenerateModalOpen(true)}
            onNavigateStudent={onNavigateStudent}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsView
            payments={payments}
            onViewReceipt={(pay) => setSelectedPayment(pay)}
            onReversePayment={(pay) => handleReversePayment(pay)}
            onOpenRecordPayment={() => handleOpenRecordPayment()}
            onNavigateStudent={onNavigateStudent}
          />
        )}

        {activeTab === 'pending' && (
          <PendingFeesView
            invoices={invoices}
            onViewInvoice={(inv) => setSelectedInvoice(inv)}
            onRecordPayment={(inv) => handleOpenRecordPayment(inv.studentId, inv.id)}
            onSendReminder={(inv) => handleSendReminder(inv)}
            onNavigateStudent={onNavigateStudent}
          />
        )}

        {activeTab === 'overdue' && (
          <OverdueFeesView
            invoices={invoices}
            onViewInvoice={(inv) => setSelectedInvoice(inv)}
            onRecordPayment={(inv) => handleOpenRecordPayment(inv.studentId, inv.id)}
            onSendReminder={(inv) => handleSendReminder(inv)}
            onRefresh={reloadData}
            onNavigateStudent={onNavigateStudent}
          />
        )}

        {activeTab === 'discounts' && (
          <DiscountsView
            discounts={discounts}
            onOpenCreateDiscount={() => {
              setEditingDiscount(null);
              setIsDiscountModalOpen(true);
            }}
            onEditDiscount={(dsc) => {
              setEditingDiscount(dsc);
              setIsDiscountModalOpen(true);
            }}
          />
        )}

        {activeTab === 'scholarships' && (
          <ScholarshipsView
            scholarships={scholarships}
            onOpenAwardScholarship={() => {
              setEditingScholarship(null);
              setIsScholarshipModalOpen(true);
            }}
            onEditScholarship={(sch) => {
              setEditingScholarship(sch);
              setIsScholarshipModalOpen(true);
            }}
            onNavigateStudent={onNavigateStudent}
          />
        )}

        {activeTab === 'receipts' && (
          <ReceiptsView
            payments={payments}
            onViewReceipt={(pay) => setSelectedPayment(pay)}
            onNavigateStudent={onNavigateStudent}
          />
        )}

        {activeTab === 'reports' && (
          <FinancialReportsView
            metrics={metrics}
            payments={payments}
            invoices={invoices}
          />
        )}

        {activeTab === 'settings' && (
          <FinanceSettingsView
            settings={settings}
            rules={rules}
            logs={automationLogs}
            onRefresh={reloadData}
          />
        )}
      </div>

      {/* ALL MODAL DIALOGS */}
      {selectedInvoice && (
        <InvoiceDetailModal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
          onRecordPayment={(inv) => {
            setSelectedInvoice(null);
            handleOpenRecordPayment(inv.studentId, inv.id);
          }}
          onSendReminder={(inv) => handleSendReminder(inv)}
          onCancelInvoice={(inv) => handleCancelInvoice(inv)}
        />
      )}

      {selectedPayment && (
        <ReceiptViewModal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          payment={selectedPayment}
        />
      )}

      {isRecordPaymentOpen && (
        <RecordFinancePaymentModal
          isOpen={isRecordPaymentOpen}
          onClose={() => {
            setIsRecordPaymentOpen(false);
            setPrefilledStudentId(undefined);
            setPrefilledInvoiceId(undefined);
          }}
          onSuccess={() => {
            setIsRecordPaymentOpen(false);
            setPrefilledStudentId(undefined);
            setPrefilledInvoiceId(undefined);
            reloadData();
          }}
          prefilledStudentId={prefilledStudentId}
          prefilledInvoiceId={prefilledInvoiceId}
        />
      )}

      {isFeeStructureModalOpen && (
        <FeeStructureModal
          isOpen={isFeeStructureModalOpen}
          onClose={() => {
            setIsFeeStructureModalOpen(false);
            setEditingStructure(null);
          }}
          onSuccess={() => {
            setIsFeeStructureModalOpen(false);
            setEditingStructure(null);
            reloadData();
          }}
          structure={editingStructure}
        />
      )}

      {isDiscountModalOpen && (
        <DiscountModal
          isOpen={isDiscountModalOpen}
          onClose={() => {
            setIsDiscountModalOpen(false);
            setEditingDiscount(null);
          }}
          onSuccess={() => {
            setIsDiscountModalOpen(false);
            setEditingDiscount(null);
            reloadData();
          }}
          discount={editingDiscount}
        />
      )}

      {isScholarshipModalOpen && (
        <ScholarshipModal
          isOpen={isScholarshipModalOpen}
          onClose={() => {
            setIsScholarshipModalOpen(false);
            setEditingScholarship(null);
          }}
          onSuccess={() => {
            setIsScholarshipModalOpen(false);
            setEditingScholarship(null);
            reloadData();
          }}
          scholarship={editingScholarship}
        />
      )}

      {isAdjustmentModalOpen && (
        <StudentAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => {
            setIsAdjustmentModalOpen(false);
            setAdjustmentStudentId(null);
          }}
          onSuccess={() => {
            setIsAdjustmentModalOpen(false);
            setAdjustmentStudentId(null);
            reloadData();
          }}
          studentId={adjustmentStudentId}
        />
      )}

      {isCancelModalOpen && invoiceToCancel && (
        <CancelInvoiceModal
          isOpen={isCancelModalOpen}
          onClose={() => {
            setIsCancelModalOpen(false);
            setInvoiceToCancel(null);
          }}
          onSuccess={() => {
            setIsCancelModalOpen(false);
            setInvoiceToCancel(null);
            setSelectedInvoice(null);
            reloadData();
          }}
          invoice={invoiceToCancel}
        />
      )}

      {isReverseModalOpen && paymentToReverse && (
        <ReversePaymentModal
          isOpen={isReverseModalOpen}
          onClose={() => {
            setIsReverseModalOpen(false);
            setPaymentToReverse(null);
          }}
          onSuccess={() => {
            setIsReverseModalOpen(false);
            setPaymentToReverse(null);
            setSelectedPayment(null);
            reloadData();
          }}
          payment={paymentToReverse}
        />
      )}

      {isBatchGenerateModalOpen && (
        <BatchGenerateInvoicesModal
          isOpen={isBatchGenerateModalOpen}
          onClose={() => setIsBatchGenerateModalOpen(false)}
          onSuccess={() => {
            setIsBatchGenerateModalOpen(false);
            reloadData();
          }}
        />
      )}
    </div>
  );
};
export default FinancePage;
