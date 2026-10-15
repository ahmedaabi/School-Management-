import React, { useState } from 'react';
import {
  Search,
  CreditCard,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { StudentFeeProfile, InvoiceItem } from '../../types/finance';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export interface StudentFeesViewProps {
  profiles: StudentFeeProfile[];
  onOpenRecordPayment: (studentId?: string) => void;
  onOpenAdjustment: (studentId: string) => void;
  onViewStudentInvoice: (studentId: string) => void;
  onNavigateStudent?: (studentId: string) => void;
}

export const StudentFeesView: React.FC<StudentFeesViewProps> = ({
  profiles,
  onOpenRecordPayment,
  onOpenAdjustment,
  onViewStudentInvoice,
  onNavigateStudent,
}) => {
  const { can } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');

  const classes = Array.from(new Set(profiles.map((p) => p.className).filter(Boolean)));

  const filtered = profiles.filter((p) => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.feeStatus === statusFilter;
    const matchesClass = classFilter === 'All' || p.className === classFilter;
    return matchesSearch && matchesStatus && matchesClass;
  });

  const getStatusBadge = (status: StudentFeeProfile['feeStatus']) => {
    switch (status) {
      case 'Paid':
        return (
          <Badge variant="success" size="sm" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Paid
          </Badge>
        );
      case 'Overdue':
        return (
          <Badge variant="danger" size="sm" className="gap-1">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" size="sm" className="gap-1">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Input
              type="text"
              placeholder="Search student by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium"
          >
            <option value="All">All Fee Statuses</option>
            <option value="Paid">Fully Paid</option>
            <option value="Pending">Pending / Grace</option>
            <option value="Overdue">Overdue</option>
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium"
          >
            <option value="All">All Classes</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Fee Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Assigned Fee Schedule</th>
                <th className="py-3 px-4 text-right">Total Payable</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.studentId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700">
                        {p.studentName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <button
                          onClick={() => onNavigateStudent && onNavigateStudent(p.studentId)}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block text-left"
                        >
                          {p.studentName}
                        </button>
                        <span className="text-[11px] font-mono text-slate-400">
                          ID: {p.studentId}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    {p.className}
                    {p.sectionName ? ` (${p.sectionName})` : ''}
                  </td>

                  <td className="py-3 px-4 text-slate-700">
                    <div className="truncate max-w-[200px] font-medium">
                      {p.feeStructureName || 'Standard Tuition'}
                    </div>
                    {(p.discounts.length > 0 || p.scholarships.length > 0) && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {p.discounts.map((d, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold"
                          >
                            {d.name}
                          </span>
                        ))}
                        {p.scholarships.map((s, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                    ${p.totalFees.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                    ${p.totalPaid.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold">
                    <span className={p.balance > 0 ? 'text-rose-600' : 'text-slate-500'}>
                      ${p.balance.toLocaleString()}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">{getStatusBadge(p.feeStatus)}</td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {can('fees.edit') && (
                        <button
                          onClick={() => onOpenAdjustment(p.studentId)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                          title="Apply fee waiver, credit, or debit"
                        >
                          Adjustment
                        </button>
                      )}

                      {p.balance > 0 && can('payments.create') && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-[11px] py-1 px-2.5 h-auto"
                          onClick={() => onOpenRecordPayment(p.studentId)}
                          leftIcon={<CreditCard className="w-3 h-3" />}
                        >
                          Collect
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            No student fee profiles match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};
