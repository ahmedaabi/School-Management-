import React, { useState } from 'react';
import { Plus, Percent, CheckCircle2, Edit2, ShieldCheck, Search } from 'lucide-react';
import { FeeDiscount } from '../../types/finance';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export interface DiscountsViewProps {
  discounts: FeeDiscount[];
  onOpenCreateDiscount: () => void;
  onEditDiscount: (discount: FeeDiscount) => void;
}

export const DiscountsView: React.FC<DiscountsViewProps> = ({
  discounts,
  onOpenCreateDiscount,
  onEditDiscount,
}) => {
  const { can } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filtered = discounts.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.applicableStudentName &&
        d.applicableStudentName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Top Search & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Input
              type="text"
              placeholder="Search discounts by name, code, student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium"
          >
            <option value="All">All Discount Categories</option>
            <option value="Sibling">Sibling Concessions</option>
            <option value="Staff">Staff Children</option>
            <option value="Merit">Merit / Academic</option>
            <option value="Hardship">Hardship Relief</option>
            <option value="EarlyBird">Early Bird</option>
          </select>
        </div>

        {can('fees.create') && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCreateDiscount}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Discount Policy
          </Button>
        )}
      </div>

      {/* Discounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((dsc) => (
          <div
            key={dsc.id}
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-emerald-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {dsc.code}
                  </span>
                  <Badge variant="neutral" size="sm">
                    {dsc.category}
                  </Badge>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{dsc.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{dsc.description}</p>
              </div>

              {can('fees.edit') && (
                <button
                  onClick={() => onEditDiscount(dsc)}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-colors"
                  title="Edit Discount"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Value card */}
            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-emerald-700 block">
                  Concession Value
                </span>
                <div className="text-xl font-bold font-mono text-emerald-800">
                  {dsc.type === 'Percentage' ? `${dsc.value}% Off` : `$${dsc.value.toLocaleString()} Flat`}
                </div>
              </div>
              <Percent className="w-6 h-6 text-emerald-400" />
            </div>

            {/* Beneficiary */}
            <div className="text-xs text-slate-600">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Applicability
              </span>
              <div className="font-medium text-slate-800">
                {dsc.applicableStudentName
                  ? `Designated to: ${dsc.applicableStudentName}`
                  : 'Universal / Cohort Rule'}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1 text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{dsc.approvalStatus}</span>
              </div>
              <Badge variant={dsc.isActive ? 'success' : 'neutral'} size="sm">
                {dsc.isActive ? 'Active' : 'Disabled'}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-xs">
          No fee discount rules found matching query.
        </div>
      )}
    </div>
  );
};
