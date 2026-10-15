import React, { useState, useEffect } from 'react';
import { ScholarshipItem } from '../../../types/finance';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { financeService } from '../../../services/financeService';
import { dataService } from '../../../services/dataService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export interface ScholarshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  scholarship?: ScholarshipItem | null;
  scholarshipToEdit?: ScholarshipItem | null;
  onSuccess?: () => void;
  onSaveSuccess?: () => void;
}

export const ScholarshipModal: React.FC<ScholarshipModalProps> = ({
  isOpen,
  onClose,
  scholarship,
  scholarshipToEdit,
  onSuccess,
  onSaveSuccess,
}) => {
  const targetScholarship = scholarship || scholarshipToEdit;
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const students = dataService.getStudents();

  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState(students[0]?.studentId || '');
  const [coverageType, setCoverageType] = useState<'Percentage' | 'Fixed' | 'FullTuition'>('Percentage');
  const [coverageValue, setCoverageValue] = useState('50');
  const [sponsorName, setSponsorName] = useState('Academy Endowment Board');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [criteria, setCriteria] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (targetScholarship) {
        setName(targetScholarship.scholarshipName);
        setStudentId(targetScholarship.studentId);
        setCoverageType(targetScholarship.amountType);
        setCoverageValue(String(targetScholarship.value));
        setCriteria(targetScholarship.reason || '');
      } else {
        setName('Principal’s Academic Honors Fellowship');
        setStudentId(students[0]?.studentId || '');
        setCoverageType('Percentage');
        setCoverageValue('50');
        setSponsorName('Academy Endowment Board');
        setAcademicYear('2026-2027');
        setCriteria('GPA > 3.85 maintained throughout academic terms');
      }
    }
  }, [isOpen, targetScholarship]);

  const selectedStudent = students.find((s) => s.studentId === studentId || s.id === studentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please specify a scholarship title.', 'error');
      return;
    }
    if (!selectedStudent) {
      showToast('Please select a recipient student.', 'error');
      return;
    }

    financeService.saveScholarship(
      {
        id: targetScholarship ? targetScholarship.id : undefined,
        scholarshipName: name,
        studentId: selectedStudent.studentId || selectedStudent.id,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        amountType: coverageType === 'Fixed' ? 'Fixed' : 'Percentage',
        value: coverageType === 'FullTuition' ? 100 : Number(coverageValue) || 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2027-06-30',
        reason: criteria || 'Academic merit scholarship',
        approvedBy: currentUser?.name || 'Principal',
        status: 'Active',
      },
      currentUser
    );

    showToast('Scholarship endowment record saved successfully.', 'success');
    if (onSaveSuccess) onSaveSuccess();
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={targetScholarship ? 'Edit Scholarship' : 'Award Institutional Scholarship'}
      subtitle="Record and endow student academic, athletic, or STEM fellowships"
      maxWidth="md"
      id="scholarship-modal"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            Award Scholarship
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Scholarship Award Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. STEM Innovation Fellowship"
          required
        />

        <Select
          label="Awarded Student"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          options={students.map((s) => ({
            value: s.studentId || s.id,
            label: `${s.firstName} ${s.lastName} (${s.studentId || s.id}) • ${s.className}`,
          }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Coverage Format"
            value={coverageType}
            onChange={(e) => setCoverageType(e.target.value as any)}
            options={[
              { value: 'Percentage', label: 'Percentage (%)' },
              { value: 'Fixed', label: 'Fixed Dollar Amount ($)' },
              { value: 'FullTuition', label: '100% Full Tuition Waiver' },
            ]}
          />

          <Input
            label={coverageType === 'Percentage' ? 'Coverage Rate (%)' : coverageType === 'FullTuition' ? 'Waiver' : 'Amount ($)'}
            type="number"
            min="1"
            max={coverageType === 'Percentage' ? '100' : '20000'}
            value={coverageType === 'FullTuition' ? '100' : coverageValue}
            onChange={(e) => setCoverageValue(e.target.value)}
            disabled={coverageType === 'FullTuition'}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Endowment / Sponsor"
            type="text"
            value={sponsorName}
            onChange={(e) => setSponsorName(e.target.value)}
            placeholder="e.g. Alumni Foundation"
          />

          <Select
            label="Academic Year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            options={[
              { value: '2026-2027', label: '2026-2027' },
              { value: '2025-2026', label: '2025-2026' },
            ]}
          />
        </div>

        <Input
          label="Terms & Eligibility Criteria"
          type="text"
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
          placeholder="e.g. Cumulative grade average of 90% or above"
        />
      </form>
    </Modal>
  );
};
