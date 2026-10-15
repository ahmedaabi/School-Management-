import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FeeStructure, FeeComponent, FeeFrequency } from '../../../types/finance';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { financeService } from '../../../services/financeService';
import { dataService } from '../../../services/dataService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export interface FeeStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  structure?: FeeStructure | null;
  structureToEdit?: FeeStructure | null;
  onSuccess?: () => void;
  onSaveSuccess?: () => void;
}

export const FeeStructureModal: React.FC<FeeStructureModalProps> = ({
  isOpen,
  onClose,
  structure,
  structureToEdit,
  onSuccess,
  onSaveSuccess,
}) => {
  const targetStructure = structure || structureToEdit;
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const classes = dataService.getClasses();

  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [classId, setClassId] = useState('');
  const [className, setClassName] = useState('All Classes');
  const [frequency, setFrequency] = useState<FeeFrequency>('Monthly');
  const [components, setComponents] = useState<FeeComponent[]>([
    {
      id: 'c1',
      name: 'Base Tuition Fee',
      category: 'Tuition',
      amount: 1200,
      frequency: 'Monthly',
      isMandatory: true,
      isActive: true,
    },
    {
      id: 'c2',
      name: 'STEM Science Lab & Equipment',
      category: 'Lab',
      amount: 150,
      frequency: 'Monthly',
      isMandatory: true,
      isActive: true,
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      if (targetStructure) {
        setName(targetStructure.name);
        setAcademicYear(targetStructure.academicYearName || '2026-2027');
        setClassId(targetStructure.classId || '');
        setClassName(targetStructure.className || 'All Classes');
        setComponents(targetStructure.components || []);
      } else {
        setName('');
        setAcademicYear('2026-2027');
        setClassId(classes[0]?.id || '');
        setClassName(classes[0]?.name || 'All Classes');
        setFrequency('Monthly');
        setComponents([
          {
            id: 'c-1',
            name: 'Base Tuition Fee',
            category: 'Tuition',
            amount: 1200,
            frequency: 'Monthly',
            isMandatory: true,
            isActive: true,
          },
          {
            id: 'c-2',
            name: 'Science & Computer Lab Levy',
            category: 'Lab',
            amount: 150,
            frequency: 'Monthly',
            isMandatory: true,
            isActive: true,
          },
        ]);
      }
    }
  }, [isOpen, targetStructure]);

  const addComponent = () => {
    const newComp: FeeComponent = {
      id: `comp-${Date.now().toString().slice(-4)}`,
      name: '',
      category: 'Activity',
      amount: 100,
      frequency: frequency,
      isMandatory: true,
      isActive: true,
    };
    setComponents([...components, newComp]);
  };

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, updates: Partial<FeeComponent>) => {
    setComponents(
      components.map((c, i) => (i === index ? { ...c, ...updates } : c))
    );
  };

  const totalAmount = components
    .filter((c) => c.isActive)
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please provide a fee structure name.', 'error');
      return;
    }
    if (components.length === 0) {
      showToast('Please add at least one fee component.', 'error');
      return;
    }

    const academicYears = financeService.getAcademicYears();
    const activeAY = academicYears.find((y) => y.name === academicYear) || academicYears[0];

    financeService.saveFeeStructure(
      {
        id: targetStructure ? targetStructure.id : undefined,
        name,
        academicYearId: activeAY?.id || 'AY-2026',
        academicYearName: activeAY?.name || academicYear,
        classId: classId || undefined,
        className: classId ? classes.find((c) => c.id === classId)?.name || className : 'All Classes',
        components,
        isActive: true,
        createdAt: targetStructure?.createdAt || new Date().toISOString().split('T')[0],
      },
      currentUser
    );

    showToast(
      targetStructure ? 'Fee structure updated successfully.' : 'Fee structure created successfully.',
      'success'
    );
    if (onSaveSuccess) onSaveSuccess();
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={targetStructure ? 'Edit Fee Structure' : 'Create Fee Structure'}
      subtitle="Define institutional fee schedules, tuition, and itemized levies"
      maxWidth="2xl"
      id="fee-structure-modal"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            {targetStructure ? 'Save Changes' : 'Create Structure'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Structure Title"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Grade 10 Standard Academic Fee"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Academic Year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            options={[
              { value: '2026-2027', label: '2026-2027 (Current)' },
              { value: '2025-2026', label: '2025-2026 (Past)' },
            ]}
          />

          <Select
            label="Applicable Class"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              const found = classes.find((c) => c.id === e.target.value);
              if (found) setClassName(found.name);
            }}
            options={[
              { value: '', label: 'All Classes (General)' },
              ...classes.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Select
            label="Default Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as FeeFrequency)}
            options={[
              { value: 'Monthly', label: 'Monthly' },
              { value: 'Quarterly', label: 'Quarterly' },
              { value: 'Half-yearly', label: 'Half-Yearly' },
              { value: 'Annual', label: 'Annual' },
              { value: 'One-time', label: 'One-Time' },
            ]}
          />
        </div>

        {/* Dynamic Fee Components */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Fee Components & Levies
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addComponent}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Component
            </Button>
          </div>

          <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            {components.map((comp, idx) => (
              <div
                key={comp.id || idx}
                className="grid grid-cols-12 gap-2 p-2 bg-white border border-slate-200 rounded-lg items-center text-xs"
              >
                <div className="col-span-5">
                  <input
                    type="text"
                    value={comp.name}
                    onChange={(e) => updateComponent(idx, { name: e.target.value })}
                    placeholder="Component Name (e.g. Tuition, Lab)"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="col-span-3">
                  <select
                    value={comp.category || 'Tuition'}
                    onChange={(e) =>
                      updateComponent(idx, { category: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white"
                  >
                    <option value="Tuition">Tuition</option>
                    <option value="Admission">Admission</option>
                    <option value="Exam">Exam</option>
                    <option value="Transport">Transport</option>
                    <option value="Library">Library</option>
                    <option value="Lab">Lab</option>
                    <option value="Sports">Sports</option>
                    <option value="Activity">Activity</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="col-span-3">
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={comp.amount}
                      onChange={(e) =>
                        updateComponent(idx, { amount: Number(e.target.value) || 0 })
                      }
                      className="w-full pl-5 pr-2 py-1.5 border border-slate-200 rounded text-xs font-mono font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeComponent(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-2 flex items-center justify-between px-2 text-xs font-bold text-slate-800 border-t border-slate-200">
              <span>Total Active Schedule Amount:</span>
              <span className="font-mono text-indigo-700 text-sm">
                ${totalAmount.toLocaleString()} / {frequency}
              </span>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
