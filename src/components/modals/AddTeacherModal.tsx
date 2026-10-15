import { useState, FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Teacher, TeacherStatus } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';

export interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeacherAdded: (teacher: Teacher) => void;
}

export const AddTeacherModal = ({
  isOpen,
  onClose,
  onTeacherAdded,
}: AddTeacherModalProps) => {
  const { showToast } = useToast();
  const classes = dataService.getClasses();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [department, setDepartment] = useState('Mathematics');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [subjectsText, setSubjectsText] = useState('');
  const [status, setStatus] = useState<TeacherStatus>('Active');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  const [assignedClassId, setAssignedClassId] = useState(classes[0]?.id || 'CLS-001');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!email.trim()) errs.email = 'Email address is required';
    if (!qualification.trim()) errs.qualification = 'Highest degree/qualification is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const parsedSubjects = subjectsText
        ? subjectsText.split(',').map((s) => s.trim()).filter(Boolean)
        : [department];

      const cls = classes.find((c) => c.id === assignedClassId) || classes[0];
      const assigned = [
        {
          classId: cls.id,
          className: cls.name,
          sectionId: cls.sections[0]?.id || 'SEC-001',
          sectionName: cls.sections[0]?.name || 'Section A',
          subject: parsedSubjects[0] || 'General Subject',
        },
      ];

      const newTeacher = dataService.addTeacher({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '+1 (555) 440-1020',
        qualification: qualification.trim(),
        department,
        joiningDate,
        subjects: parsedSubjects,
        assignedClasses: assigned,
        status,
        profilePhoto: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });

      showToast(`Faculty member ${newTeacher.name} successfully registered.`, 'success');
      onTeacherAdded(newTeacher);
      onClose();
    } catch {
      showToast('Could not register faculty member.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Onboard Faculty Member"
      subtitle="Register teacher credentials, subject faculties, and timetable assignments"
      maxWidth="2xl"
      id="add-teacher-modal"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Register Faculty
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Name & Title"
          required
          placeholder="e.g. Dr. Arthur Pendelton"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <Input
          label="Institutional Email"
          type="email"
          required
          placeholder="e.g. a.pendelton@staugustine.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          label="Contact Phone"
          placeholder="+1 (555) 000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          label="Highest Qualification & University"
          required
          placeholder="e.g. Ph.D. Applied Mathematics, Cambridge"
          value={qualification}
          onChange={(e) => setQualification(e.target.value)}
          error={errors.qualification}
        />
        <Select
          label="Academic Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          options={[
            { value: 'Mathematics', label: 'Mathematics' },
            { value: 'Science', label: 'Science' },
            { value: 'Humanities & Literature', label: 'Humanities & Literature' },
            { value: 'Social Studies', label: 'Social Studies' },
            { value: 'Technology', label: 'Technology & Computing' },
            { value: 'Foreign Languages', label: 'Foreign Languages' },
            { value: 'Athletics', label: 'Athletics & Physical Health' },
            { value: 'Fine Arts', label: 'Fine Arts' },
          ]}
        />
        <Select
          label="Faculty Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TeacherStatus)}
          options={[
            { value: 'Active', label: 'Active (Full-time)' },
            { value: 'On Leave', label: 'On Sabbatical / Leave' },
            { value: 'Inactive', label: 'Inactive' },
          ]}
        />
        <Input
          label="Joining Date"
          type="date"
          value={joiningDate}
          onChange={(e) => setJoiningDate(e.target.value)}
        />
        <Select
          label="Primary Assigned Class"
          value={assignedClassId}
          onChange={(e) => setAssignedClassId(e.target.value)}
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
        />
        <div className="sm:col-span-2">
          <Input
            label="Specialized Teaching Subjects (Comma separated)"
            placeholder="e.g. Advanced Calculus, Linear Algebra, Probability"
            value={subjectsText}
            onChange={(e) => setSubjectsText(e.target.value)}
            helperText="Separate multiple subject areas with commas"
          />
        </div>
      </form>
    </Modal>
  );
};
