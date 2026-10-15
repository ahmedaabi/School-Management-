import React, { useState } from 'react';
import { Plus, Edit2, CheckCircle2, Layers, Search } from 'lucide-react';
import { FeeStructure } from '../../types/finance';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export interface FeeStructuresViewProps {
  structures: FeeStructure[];
  onOpenCreateModal: () => void;
  onEditStructure: (structure: FeeStructure) => void;
}

export const FeeStructuresView: React.FC<FeeStructuresViewProps> = ({
  structures,
  onOpenCreateModal,
  onEditStructure,
}) => {
  const { can } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('All');

  const filtered = structures.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.className && s.className.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesYear = yearFilter === 'All' || s.academicYear === yearFilter;
    return matchesSearch && matchesYear;
  });

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Input
              type="text"
              placeholder="Search structures by name, code, class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium"
          >
            <option value="All">All Academic Years</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
        </div>

        {can('fees.create') && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCreateModal}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Fee Structure
          </Button>
        )}
      </div>

      {/* Grid of Fee Structure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((struct) => (
          <div
            key={struct.id}
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-indigo-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {struct.code}
                  </span>
                  <span className="text-xs text-slate-400">• {struct.academicYear}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{struct.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{struct.description || struct.className}</p>
              </div>

              {can('fees.edit') && (
                <button
                  onClick={() => onEditStructure(struct)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                  title="Edit Structure"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Total and Frequency */}
            <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Schedule Amount
                </span>
                <div className="text-lg font-bold font-mono text-slate-900">
                  ${struct.totalAmount.toLocaleString()}
                </div>
              </div>
              <Badge variant="neutral" size="sm">
                {struct.frequency}
              </Badge>
            </div>

            {/* Components list */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Components ({struct.components.length})
              </span>
              <div className="space-y-1 text-xs">
                {struct.components.slice(0, 3).map((comp) => (
                  <div key={comp.id} className="flex justify-between text-slate-600">
                    <span className="truncate max-w-[180px]">{comp.name}</span>
                    <span className="font-mono font-medium text-slate-800">
                      ${comp.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {struct.components.length > 3 && (
                  <div className="text-[11px] text-indigo-600 font-medium pt-0.5">
                    +{struct.components.length - 3} more line items...
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-slate-600">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                {struct.className || 'All Classes'}
              </span>
              <Badge variant={struct.isActive ? 'success' : 'neutral'} size="sm">
                {struct.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-xs">
          No fee structures match the specified criteria.
        </div>
      )}
    </div>
  );
};
