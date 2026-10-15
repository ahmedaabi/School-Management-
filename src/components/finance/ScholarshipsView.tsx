import React, { useState } from 'react';
import { Plus, Award, CheckCircle2, GraduationCap, Search } from 'lucide-react';
import { Scholarship } from '../../types/finance';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export interface ScholarshipsViewProps {
  scholarships: Scholarship[];
  onOpenAwardScholarship: () => void;
  onEditScholarship: (scholarship: Scholarship) => void;
  onNavigateStudent?: (studentId: string) => void;
}

export const ScholarshipsView: React.FC<ScholarshipsViewProps> = ({
  scholarships,
  onOpenAwardScholarship,
  onEditScholarship,
  onNavigateStudent,
}) => {
  const { can } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = scholarships.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.sponsorName && s.sponsorName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Input
              type="text"
              placeholder="Search by fellowship, student, sponsor..."
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
            <option value="All">All Endowments</option>
            <option value="Active">Active Endowments</option>
            <option value="Under Review">Under Review</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        {can('fees.create') && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAwardScholarship}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Award Scholarship
          </Button>
        )}
      </div>

      {/* Grid of Scholarships */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sch) => (
          <div
            key={sch.id}
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-indigo-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{sch.name}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {sch.academicYear}
                  </span>
                </div>
              </div>

              <Badge
                variant={sch.status === 'Active' ? 'success' : 'neutral'}
                size="sm"
              >
                {sch.status}
              </Badge>
            </div>

            {/* Recipient Student */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">
                Recipient Scholar
              </span>
              <button
                onClick={() => onNavigateStudent && onNavigateStudent(sch.studentId)}
                className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left block text-xs"
              >
                {sch.studentName}
              </button>
              <span className="text-[11px] text-slate-500 font-mono">
                ID: {sch.studentId} • {sch.className}
              </span>
            </div>

            {/* Endowment Value & Sponsor */}
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                  Coverage
                </span>
                <span className="font-mono font-bold text-indigo-700 text-sm">
                  {sch.coverageType === 'FullTuition'
                    ? '100% Full Tuition'
                    : sch.coverageType === 'Percentage'
                    ? `${sch.coverageValue}% Tuition Waiver`
                    : `$${sch.coverageValue.toLocaleString()} Grant`}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                  Endower / Sponsor
                </span>
                <span className="font-medium text-slate-700 truncate max-w-[140px] block">
                  {sch.sponsorName || 'Academy Foundation'}
                </span>
              </div>
            </div>

            {sch.criteria && (
              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100 line-clamp-2">
                "{sch.criteria}"
              </p>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-xs">
          No scholarships found matching search terms.
        </div>
      )}
    </div>
  );
};
