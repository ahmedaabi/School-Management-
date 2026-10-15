import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Building,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Users,
  Shield,
} from 'lucide-react';
import { AdmissionApplication } from '../../types/admission';
import { admissionService } from '../../services/admissionService';
import { dataService } from '../../services/dataService';
import { financeService } from '../../services/financeService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

interface EnrollStudentModalProps {
  application: AdmissionApplication;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (enrolledStudent: any) => void;
}

export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({
  application,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [classesList, setClassesList] = useState<any[]>([]);
  const [feeStructuresList, setFeeStructuresList] = useState<any[]>([]);
  const [capacitiesList, setCapacitiesList] = useState<any[]>([]);

  // Form Fields
  const [studentId, setStudentId] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [selectedClassId, setSelectedClassId] = useState(application.appliedClassId || 'CLS-001');
  const [selectedSectionId, setSelectedSectionId] = useState(application.appliedSectionId || 'SEC-001');
  const [rollNumber, setRollNumber] = useState('15');
  const [selectedFeeStructureId, setSelectedFeeStructureId] = useState('');
  const [overrideCapacity, setOverrideCapacity] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load data
      const cls = dataService.getClasses();
      setClassesList(cls);

      const fees = financeService.getFeeStructures();
      setFeeStructuresList(fees);
      if (fees.length > 0) {
        setSelectedFeeStructureId(fees[0].id);
      }

      const caps = admissionService.getCapacities();
      setCapacitiesList(caps);

      // Auto-generate fresh unique numbers
      const generatedAdm = admissionService.generateAdmissionNumber();
      setAdmissionNumber(generatedAdm);
      setStudentId(`STU-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setAcademicYear(application.academicYear || '2026-2027');

      if (application.appliedClassId) {
        setSelectedClassId(application.appliedClassId);
      }
      if (application.appliedSectionId) {
        setSelectedSectionId(application.appliedSectionId);
      }
    }
  }, [isOpen, application]);

  if (!isOpen) return null;

  const currentClass = classesList.find((c) => c.id === selectedClassId);
  const sections = currentClass?.sections || [];
  const currentSection = sections.find((s) => s.id === selectedSectionId) || sections[0];

  // Capacity check
  const capacityInfo = capacitiesList.find(
    (c) => c.classId === selectedClassId && c.sectionId === selectedSectionId
  );
  const isFull = capacityInfo ? capacityInfo.occupied >= capacityInfo.maxCapacity : false;
  const availableSeats = capacityInfo ? Math.max(0, capacityInfo.maxCapacity - capacityInfo.occupied) : 25;

  // Parent matching check
  const existingParents = dataService.getParents();
  const matchedParent = existingParents.find(
    (p) =>
      (application.parentEmail && p.email?.toLowerCase().trim() === application.parentEmail.toLowerCase().trim()) ||
      (application.parentPhone && p.phone?.trim() === application.parentPhone.trim())
  );

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isFull && !overrideCapacity) {
      showToast('Selected section is at maximum capacity. Check override to proceed.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = admissionService.enrollStudent(
        {
          applicationId: application.id,
          studentId: studentId.trim(),
          admissionNumber: admissionNumber.trim(),
          academicYear,
          classId: selectedClassId,
          className: currentClass?.name || application.appliedClassName,
          sectionId: currentSection?.id || 'SEC-001',
          sectionName: currentSection?.name || application.appliedSectionName,
          rollNumber: rollNumber.trim() || '01',
          studentStatus: 'Active',
          feeStructureId: selectedFeeStructureId || undefined,
          overrideCapacity,
        },
        currentUser || undefined
      );

      if (!res.success) {
        showToast(res.error || 'Enrollment failed.', 'error');
        setIsSubmitting(false);
        return;
      }

      showToast(
        `Successfully enrolled ${application.applicantName} as ${res.student?.studentId}!`,
        'success'
      );
      onSuccess(res.student);
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Error occurred during enrollment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Final Student Enrollment Workflow</h2>
              <p className="text-xs text-slate-500">
                Converting candidate <strong className="text-slate-800">{application.applicantName}</strong> ({application.applicationNumber}) to an official student record.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleEnrollSubmit} className="p-6 space-y-5 text-xs">
          {/* Parent Association Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
            <Users className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-slate-800 block text-xs">
                Parent Account Association:
              </span>
              {matchedParent ? (
                <p className="text-slate-600 mt-0.5">
                  Found existing Parent record: <strong className="text-indigo-600">{matchedParent.name}</strong> ({matchedParent.email || matchedParent.phone}). Student will be linked to this parent automatically.
                </p>
              ) : (
                <p className="text-slate-600 mt-0.5">
                  No existing parent account found matching <span className="font-medium text-slate-800">{application.parentEmail || application.parentPhone}</span>. A new Parent account for <strong>{application.parentName}</strong> will be generated automatically.
                </p>
              )}
            </div>
          </div>

          {/* Identification Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Generated Student ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Official internal student identifier</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Permanent Admission Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Service-guaranteed unique admission code</span>
            </div>
          </div>

          {/* Academic Placement */}
          <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-emerald-600" />
              Academic Placement & Roster
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Academic Year</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Class Placement</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    const c = classesList.find((x) => x.id === e.target.value);
                    if (c && c.sections && c.sections.length > 0) {
                      setSelectedSectionId(c.sections[0].id);
                    }
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Section</label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  {sections.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      Section {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <label className="font-semibold text-slate-700 inline-block mr-2">Assigned Roll Number:</label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-20 p-1.5 border border-slate-200 rounded-lg text-xs font-mono text-center font-bold"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Live Capacity:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    isFull ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isFull ? 'FULL' : `${availableSeats} seats remaining`}
                </span>
              </div>
            </div>

            {isFull && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-bold block">Capacity Warning</span>
                  <span>This class section has reached maximum capacity ({capacityInfo?.maxCapacity} seats).</span>
                  <label className="flex items-center gap-2 mt-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overrideCapacity}
                      onChange={(e) => setOverrideCapacity(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Authorize Administrator Capacity Override</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Fee Structure Assignment */}
          <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Fee Structure Assignment
            </h3>
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">Select Fee Schedule for New Student</label>
              <select
                value={selectedFeeStructureId}
                onChange={(e) => setSelectedFeeStructureId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="">-- Do Not Assign Initial Fee Invoice --</option>
                {feeStructuresList.map((fs) => (
                  <option key={fs.id} value={fs.id}>
                    {fs.name} (${fs.totalAmount} / {fs.frequency}) - {fs.className}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 block">
                Assigning a fee schedule generates the initial enrollment invoice in the Finance & Accounts ledger automatically.
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isSubmitting || (isFull && !overrideCapacity)}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {isSubmitting ? 'Finalizing Enrollment...' : 'Confirm & Enroll Student'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
