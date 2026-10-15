import { useState, useEffect, FormEvent } from 'react';
import { User, GraduationCap, Users, MapPin, Heart, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Student, StudentStatus, Gender } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onStudentUpdated: (student: Student) => void;
}

export const EditStudentModal = ({
  isOpen,
  onClose,
  student,
  onStudentUpdated,
}: EditStudentModalProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const classes = dataService.getClasses();

  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'guardian' | 'medical'>('personal');

  // Personal
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [dob, setDob] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Academic
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [status, setStatus] = useState<StudentStatus>('Active');
  const [previousSchool, setPreviousSchool] = useState('');

  // Guardian & Contact
  const [fatherGuardianName, setFatherGuardianName] = useState('');
  const [parentRelationship, setParentRelationship] = useState('Father');
  const [parentContact, setParentContact] = useState('');
  const [secondaryContact, setSecondaryContact] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Health & Medical
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [medicalAllergies, setMedicalAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      setFirstName(student.firstName);
      setMiddleName(student.middleName || '');
      setLastName(student.lastName);
      setGender(student.gender);
      setDob(student.dateOfBirth);
      setPhotoUrl(student.profilePhoto);

      setClassId(student.classId);
      setSectionId(student.sectionId);
      setRollNumber(student.rollNumber);
      setStatus(student.status);
      setPreviousSchool(student.previousSchool || '');

      setFatherGuardianName(student.fatherGuardianName);
      setParentRelationship(student.parentRelationship || 'Father');
      setParentContact(student.parentContact);
      setSecondaryContact(student.secondaryContact || '');
      setParentEmail(student.parentEmail || '');
      setAddress(student.address);
      setEmergencyContact(student.emergencyContact);

      setBloodGroup(student.bloodGroup || 'O+');
      setMedicalAllergies(student.medicalAllergies || '');
      setMedicalConditions(student.medicalConditions || '');
      setMedicalNotes(student.medicalNotes || '');
    }
  }, [student]);

  if (!student) return null;

  const currentClass = classes.find((c) => c.id === classId) || classes[0];

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selectedSection = currentClass?.sections.find((s) => s.id === sectionId);

      const updated = dataService.updateStudent(
        student.id,
        {
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
          gender,
          dateOfBirth: dob,
          profilePhoto: photoUrl,

          classId: currentClass.id,
          className: currentClass.name,
          sectionId: selectedSection?.id || student.sectionId,
          sectionName: selectedSection?.name || student.sectionName,
          rollNumber: rollNumber.trim(),
          status,
          previousSchool: previousSchool.trim(),

          fatherGuardianName: fatherGuardianName.trim(),
          parentRelationship,
          parentContact: parentContact.trim(),
          secondaryContact: secondaryContact.trim(),
          parentEmail: parentEmail.trim(),
          address: address.trim(),
          emergencyContact: emergencyContact.trim(),

          bloodGroup,
          medicalAllergies: medicalAllergies.trim(),
          medicalConditions: medicalConditions.trim(),
          medicalNotes: medicalNotes.trim(),
        },
        {
          name: user?.name || 'Administrator',
          role: user?.role || 'Staff',
        }
      );

      if (updated) {
        showToast(`Record updated for ${updated.firstName} ${updated.lastName}`, 'success');
        onStudentUpdated(updated);
        onClose();
      }
    } catch {
      showToast('Could not save student changes.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Record: ${student.firstName} ${student.lastName}`}
      subtitle={`Student ID: ${student.studentId} • Admission No: ${student.admissionNumber || 'N/A'}`}
      maxWidth="3xl"
      id="edit-student-modal"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSubmitting}>
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Navigation tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { key: 'personal', label: 'Personal Details', icon: User },
            { key: 'academic', label: 'Academic & Class', icon: GraduationCap },
            { key: 'guardian', label: 'Guardian & Emergency', icon: Users },
            { key: 'medical', label: 'Health & Medical', icon: Heart },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 py-2 px-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'personal' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Middle Name"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Date of Birth"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
              <Select
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
              <Input
                label="Profile Photo URL"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Class"
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  const found = classes.find((c) => c.id === e.target.value);
                  if (found && found.sections.length > 0) {
                    setSectionId(found.sections[0].id);
                  }
                }}
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
              />
              <Select
                label="Section"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                options={currentClass.sections.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.roomNumber})`,
                }))}
              />
              <Input
                label="Roll Number"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Academic Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StudentStatus)}
                options={[
                  { value: 'Active', label: 'Active (Enrolled)' },
                  { value: 'Inactive', label: 'Inactive' },
                  { value: 'Transferred', label: 'Transferred' },
                  { value: 'Suspended', label: 'Suspended' },
                  { value: 'Graduated', label: 'Graduated' },
                ]}
              />
              <Input
                label="Previous School"
                value={previousSchool}
                onChange={(e) => setPreviousSchool(e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'guardian' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="Parent / Guardian Name"
                  value={fatherGuardianName}
                  onChange={(e) => setFatherGuardianName(e.target.value)}
                  required
                />
              </div>
              <Select
                label="Relationship"
                value={parentRelationship}
                onChange={(val) => setParentRelationship(val)}
                options={[
                  { value: 'Father', label: 'Father' },
                  { value: 'Mother', label: 'Mother' },
                  { value: 'Legal Guardian', label: 'Legal Guardian' },
                  { value: 'Grandparent', label: 'Grandparent' },
                  { value: 'Foster Parent', label: 'Foster Parent' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Parent Phone"
                value={parentContact}
                onChange={(e) => setParentContact(e.target.value)}
                required
              />
              <Input
                label="Secondary Phone"
                value={secondaryContact}
                onChange={(e) => setSecondaryContact(e.target.value)}
              />
              <Input
                label="Guardian Email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Residential Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Input
                label="Designated Emergency Contact"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'medical' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Blood Group"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                options={[
                  { value: 'O+', label: 'O+' },
                  { value: 'O-', label: 'O-' },
                  { value: 'A+', label: 'A+' },
                  { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' },
                  { value: 'B-', label: 'B-' },
                  { value: 'AB+', label: 'AB+' },
                  { value: 'AB-', label: 'AB-' },
                ]}
              />
              <Input
                label="Allergies"
                value={medicalAllergies}
                onChange={(e) => setMedicalAllergies(e.target.value)}
                placeholder="e.g. Peanuts, Penicillin"
              />
              <Input
                label="Medical Conditions"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                placeholder="e.g. Asthma"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 tracking-tight block mb-1.5">
                Medical & Care Notes
              </label>
              <textarea
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                rows={3}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
