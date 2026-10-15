import { useState, FormEvent, useEffect, useMemo } from 'react';
import {
  User,
  GraduationCap,
  Users,
  MapPin,
  PhoneCall,
  Heart,
  FileText,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Student, Gender, StudentStatus, StudentDocument } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded: (student: Student) => void;
}

type StepKey = 'personal' | 'academic' | 'guardian' | 'address' | 'emergency' | 'medical' | 'documents';

export const AddStudentModal = ({
  isOpen,
  onClose,
  onStudentAdded,
}: AddStudentModalProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const classes = dataService.getClasses();
  const existingParents = dataService.getParents();

  const [activeStep, setActiveStep] = useState<StepKey>('personal');
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Auto-generated initial IDs
  const initialStudentId = useMemo(() => dataService.generateNextStudentId('2026'), []);
  const initialAdmNo = useMemo(() => `ADM-2026-${String(dataService.getStudents(true).length + 1).padStart(4, '0')}`, []);

  // Section 1: Personal Information
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('2012-05-15');
  const [gender, setGender] = useState<Gender>('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );

  // Section 2: Academic Information
  const [studentId, setStudentId] = useState(initialStudentId);
  const [admissionNumber, setAdmissionNumber] = useState(initialAdmNo);
  const [classId, setClassId] = useState(classes[0]?.id || 'CLS-001');
  const selectedClass = classes.find((c) => c.id === classId) || classes[0];
  const [sectionId, setSectionId] = useState(selectedClass?.sections[0]?.id || 'SEC-001');
  const [rollNumber, setRollNumber] = useState('01');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [previousSchool, setPreviousSchool] = useState('');
  const [status, setStatus] = useState<StudentStatus>('Active');

  // Section 3: Parent / Guardian Information
  const [parentMode, setParentMode] = useState<'new' | 'existing'>('new');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [fatherGuardianName, setFatherGuardianName] = useState('');
  const [parentRelationship, setParentRelationship] = useState('Father');
  const [parentContact, setParentContact] = useState('');
  const [secondaryContact, setSecondaryContact] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentOccupation, setParentOccupation] = useState('');

  // Section 4: Address & Contact Information
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('100 Academic Crescent');
  const [city, setCity] = useState('Academic Hills');
  const [postalCode, setPostalCode] = useState('94016');
  const [country, setCountry] = useState('United States');

  // Section 5: Emergency Information
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyAltPhone, setEmergencyAltPhone] = useState('');

  // Section 6: Medical Information
  const [medicalAllergies, setMedicalAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [emergencyMedicalInstructions, setEmergencyMedicalInstructions] = useState('');

  // Section 7: Documents
  const [initialDocCategory, setInitialDocCategory] = useState<StudentDocument['category']>('birth_certificate');
  const [initialDocName, setInitialDocName] = useState('Official_Birth_Certificate.pdf');
  const [attachBirthCert, setAttachBirthCert] = useState(true);

  // Validation & UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync section when class changes
  useEffect(() => {
    if (selectedClass && selectedClass.sections.length > 0) {
      if (!selectedClass.sections.some((s) => s.id === sectionId)) {
        setSectionId(selectedClass.sections[0].id);
      }
    }
  }, [classId, selectedClass, sectionId]);

  // When picking existing parent, populate fields
  useEffect(() => {
    if (parentMode === 'existing' && selectedParentId) {
      const parent = existingParents.find((p) => p.id === selectedParentId);
      if (parent) {
        setFatherGuardianName(parent.name);
        setParentRelationship(parent.relationship || 'Guardian');
        setParentContact(parent.phone);
        setSecondaryContact(parent.secondaryPhone || '');
        setParentEmail(parent.email);
        setParentOccupation(parent.occupation || '');
        if (parent.address) setAddress(parent.address);
      }
    }
  }, [parentMode, selectedParentId, existingParents]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return Boolean(
      firstName ||
        lastName ||
        fatherGuardianName ||
        parentContact ||
        email ||
        previousSchool ||
        medicalAllergies
    );
  }, [firstName, lastName, fatherGuardianName, parentContact, email, previousSchool, medicalAllergies]);

  // Validation function
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    // Personal
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    if (!dob) errs.dob = 'Date of birth is required';

    // Academic
    if (!studentId.trim()) {
      errs.studentId = 'Student ID is required';
    } else if (!dataService.isStudentIdUnique(studentId)) {
      errs.studentId = 'This Student ID is already assigned to another pupil';
    }

    if (admissionNumber.trim() && !dataService.isAdmissionNumberUnique(admissionNumber)) {
      errs.admissionNumber = 'Admission number already exists in roster';
    }

    if (!rollNumber.trim()) errs.rollNumber = 'Roll number is required';

    // Parent
    if (!fatherGuardianName.trim()) errs.fatherGuardianName = 'Guardian name is required';
    if (!parentContact.trim()) {
      errs.parentContact = 'Primary contact number is required';
    } else if (parentContact.trim().length < 7) {
      errs.parentContact = 'Enter a valid telephone number (min 7 digits)';
    }

    if (parentEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
      errs.parentEmail = 'Please provide a valid email format';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please provide a valid student email format';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleResetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setDob('2012-05-15');
    setGender('Male');
    setBloodGroup('O+');
    setStudentId(dataService.generateNextStudentId('2026'));
    setAdmissionNumber(`ADM-2026-${String(dataService.getStudents(true).length + 1).padStart(4, '0')}`);
    setFatherGuardianName('');
    setParentContact('');
    setSecondaryContact('');
    setParentEmail('');
    setParentOccupation('');
    setEmail('');
    setAddress('100 Academic Crescent');
    setEmergencyContactName('');
    setEmergencyContact('');
    setMedicalAllergies('');
    setMedicalConditions('');
    setMedicalNotes('');
    setErrors({});
    setActiveStep('personal');
    showToast('Enrollment form has been reset to defaults.', 'info');
  };

  const handleClose = () => {
    if (isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      showToast('Please resolve highlighted errors across required sections.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedSection = selectedClass?.sections.find((s) => s.id === sectionId);
      const studentEmail =
        email.trim() || `${firstName.toLowerCase()}.${lastName.toLowerCase()}.stu@staugustine.edu`;

      // Build initial document bundle
      const docs: StudentDocument[] = [];
      if (attachBirthCert) {
        docs.push({
          id: `DOC-${Date.now()}-1`,
          name: initialDocName || 'Official_Birth_Certificate.pdf',
          category: initialDocCategory,
          type: 'PDF',
          uploadDate: new Date().toISOString().split('T')[0],
          fileSize: '2.1 MB',
          verified: true,
        });
      }

      // If new parent mode, create parent profile in dataService
      let parentIdToAssign = selectedParentId;
      if (parentMode === 'new' && fatherGuardianName.trim()) {
        const newParent = dataService.addParent({
          name: fatherGuardianName.trim(),
          relationship: parentRelationship,
          email: parentEmail.trim() || `${fatherGuardianName.toLowerCase().replace(/\s+/g, '.')}@family.org`,
          phone: parentContact.trim(),
          secondaryPhone: secondaryContact.trim(),
          occupation: parentOccupation.trim() || 'Parent / Guardian',
          address: address.trim(),
        });
        parentIdToAssign = newParent.id;
      }

      const newStudent = dataService.addStudent(
        {
          studentId: studentId.trim(),
          admissionNumber: admissionNumber.trim(),
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dob,
          gender,
          profilePhoto:
            photoUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          bloodGroup,

          // Academic
          classId: selectedClass.id,
          className: selectedClass.name,
          sectionId: selectedSection?.id || 'SEC-001',
          sectionName: selectedSection?.name || 'Section A',
          rollNumber: rollNumber.trim() || '01',
          admissionDate,
          previousSchool: previousSchool.trim() || 'N/A',
          status,

          // Parent
          parentId: parentIdToAssign || undefined,
          fatherGuardianName: fatherGuardianName.trim(),
          parentRelationship,
          parentContact: parentContact.trim(),
          secondaryContact: secondaryContact.trim(),
          parentEmail: parentEmail.trim(),
          parentOccupation: parentOccupation.trim(),

          // Address
          email: studentEmail,
          address: address.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),

          // Emergency
          emergencyContactName: emergencyContactName.trim() || fatherGuardianName.trim(),
          emergencyRelationship: emergencyRelationship.trim() || parentRelationship,
          emergencyContact: emergencyContact.trim() || parentContact.trim(),
          emergencyAltPhone: emergencyAltPhone.trim(),

          // Medical
          medicalAllergies: medicalAllergies.trim(),
          medicalConditions: medicalConditions.trim(),
          medicalNotes: medicalNotes.trim() || 'Standard health screening cleared.',
          emergencyMedicalInstructions: emergencyMedicalInstructions.trim(),

          // Documents
          documents: docs,
          attendanceRate: 100,
          feeStatus: 'Pending',
          pendingFeeAmount: 3200,
        },
        { name: user?.name || 'Claire Holloway (Registrar)', role: user?.role || 'Admin Staff' }
      );

      showToast(`Student ${newStudent.firstName} ${newStudent.lastName} successfully enrolled.`, 'success');
      onStudentAdded(newStudent);
      onClose();
    } catch {
      showToast('Failed to complete enrollment. Check fields and retry.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: { key: StepKey; label: string; icon: any; required?: boolean }[] = [
    { key: 'personal', label: 'Personal', icon: User, required: true },
    { key: 'academic', label: 'Academic', icon: GraduationCap, required: true },
    { key: 'guardian', label: 'Guardian', icon: Users, required: true },
    { key: 'address', label: 'Address', icon: MapPin },
    { key: 'emergency', label: 'Emergency', icon: PhoneCall },
    { key: 'medical', label: 'Medical', icon: Heart },
    { key: 'documents', label: 'Documents', icon: FileText },
  ];

  const currentStepIdx = steps.findIndex((s) => s.key === activeStep);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Student Registration & Enrollment"
        subtitle="Complete verified institutional enrollment with academic placement and guardian linking"
        maxWidth="3xl"
        id="add-student-modal"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleResetForm}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset Form
              </Button>
              {isDirty && (
                <span className="text-[11px] text-amber-600 font-medium">● Unsaved edits</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentStepIdx > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setActiveStep(steps[currentStepIdx - 1].key)}
                  leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
              )}

              {currentStepIdx < steps.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => setActiveStep(steps[currentStepIdx + 1].key)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Next Section
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => handleSubmit()}
                  isLoading={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Confirm & Enroll Student
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Step Bar Navigation */}
          <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === step.key;
              const isPast = idx < currentStepIdx;
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setActiveStep(step.key)}
                  className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px cursor-pointer ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : isPast
                      ? 'border-transparent text-slate-700 hover:text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{step.label}</span>
                  {step.required && <span className="text-rose-500 font-bold">*</span>}
                </button>
              );
            })}
          </div>

          {/* Section 1: Personal Information */}
          {activeStep === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="First Name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  error={errors.firstName}
                  placeholder="e.g. Liam"
                />
                <Input
                  label="Middle Name"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="e.g. Patrick"
                />
                <Input
                  label="Last Name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  error={errors.lastName}
                  placeholder="e.g. O'Connor"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Date of Birth"
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  error={errors.dob}
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profile Photo URL
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1">
                    <Input
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      helperText="Supports school CDN or secure photographic storage URL"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Academic Information */}
          {activeStep === 'academic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Student ID <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setStudentId(dataService.generateNextStudentId('2026'))}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Regenerate
                    </button>
                  </div>
                  <Input
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    error={errors.studentId}
                    placeholder="STU-2026-0001"
                    helperText={
                      !errors.studentId && studentId
                        ? dataService.isStudentIdUnique(studentId)
                          ? '✓ Valid unique student identification'
                          : 'Student ID collision detected'
                        : undefined
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admission Number
                  </label>
                  <Input
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    error={errors.admissionNumber}
                    placeholder="ADM-2026-0001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  label="Academic Class"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  options={classes.map((c) => ({ value: c.id, label: c.name }))}
                />
                <Select
                  label="Assigned Section"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  options={
                    selectedClass?.sections.map((s) => ({
                      value: s.id,
                      label: `${s.name} (${s.roomNumber})`,
                    })) || []
                  }
                />
                <Input
                  label="Roll Number"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  error={errors.rollNumber}
                  placeholder="e.g. 05"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Admission Date"
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                />
                <Input
                  label="Previous School Attended"
                  value={previousSchool}
                  onChange={(e) => setPreviousSchool(e.target.value)}
                  placeholder="e.g. Oakridge Elementary"
                />
                <Select
                  label="Enrollment Status"
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
              </div>
            </div>
          )}

          {/* Section 3: Parent / Guardian Information */}
          {activeStep === 'guardian' && (
            <div className="space-y-4">
              {/* Parent Mode Selector */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setParentMode('new')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    parentMode === 'new'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create New Parent / Guardian
                </button>
                <button
                  type="button"
                  onClick={() => setParentMode('existing')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    parentMode === 'existing'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Link Existing Registered Family ({existingParents.length})
                </button>
              </div>

              {parentMode === 'existing' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Registered Family Guardian
                  </label>
                  <Select
                    value={selectedParentId}
                    onChange={(val) => setSelectedParentId(val)}
                    options={[
                      { value: '', label: '-- Choose a parent record --' },
                      ...existingParents.map((p) => ({
                        value: p.id,
                        label: `${p.name} (${p.relationship || 'Guardian'} • ${p.phone})`,
                      })),
                    ]}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Input
                    label="Parent / Guardian Full Name"
                    required
                    value={fatherGuardianName}
                    onChange={(e) => setFatherGuardianName(e.target.value)}
                    error={errors.fatherGuardianName}
                    placeholder="e.g. Robert Vance"
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
                  label="Primary Contact Phone"
                  required
                  value={parentContact}
                  onChange={(e) => setParentContact(e.target.value)}
                  error={errors.parentContact}
                  placeholder="+1 (555) 000-0000"
                />
                <Input
                  label="Secondary Phone (Optional)"
                  value={secondaryContact}
                  onChange={(e) => setSecondaryContact(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
                <Input
                  label="Guardian Email"
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  error={errors.parentEmail}
                  placeholder="parent@family.org"
                />
              </div>

              <div>
                <Input
                  label="Guardian Profession / Occupation"
                  value={parentOccupation}
                  onChange={(e) => setParentOccupation(e.target.value)}
                  placeholder="e.g. Pediatrician, Civil Engineer, Architect"
                />
              </div>
            </div>
          )}

          {/* Section 4: Address & Contact Information */}
          {activeStep === 'address' && (
            <div className="space-y-4">
              <div>
                <Input
                  label="Student Portal Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  placeholder="Auto-generated if empty: liam.oconnor.stu@staugustine.edu"
                  helperText="Default school domain: @staugustine.edu"
                />
              </div>

              <div>
                <Input
                  label="Residential Street Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, building or apartment #"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. San Francisco"
                />
                <Input
                  label="Postal Code / Zip"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 94102"
                />
                <Input
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United States"
                />
              </div>
            </div>
          )}

          {/* Section 5: Emergency Information */}
          {activeStep === 'emergency' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Designate an authorized emergency contact reachable if parents or legal guardians are unavailable during school hours.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Emergency Contact Name"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Aunt Dr. Sarah Vance"
                />
                <Input
                  label="Relationship to Student"
                  value={emergencyRelationship}
                  onChange={(e) => setEmergencyRelationship(e.target.value)}
                  placeholder="e.g. Aunt / Family Physician"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Primary Emergency Phone"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="+1 (555) 999-0011"
                />
                <Input
                  label="Alternative Phone"
                  value={emergencyAltPhone}
                  onChange={(e) => setEmergencyAltPhone(e.target.value)}
                  placeholder="+1 (555) 999-0022"
                />
              </div>
            </div>
          )}

          {/* Section 6: Medical Information */}
          {activeStep === 'medical' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Known Medical Allergies"
                  value={medicalAllergies}
                  onChange={(e) => setMedicalAllergies(e.target.value)}
                  placeholder="e.g. Peanuts, Penicillin, Bee stings"
                  helperText="Leave empty if student has no known allergies"
                />
                <Input
                  label="Pre-existing Medical Conditions"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="e.g. Mild Asthma, Type 1 Diabetes"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  General Health Notes & Physical Restrictions
                </label>
                <textarea
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
                  placeholder="List any physical education restrictions, dietary precautions, or daily medication taken at nurse's office."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Medical Instructions
                </label>
                <Input
                  value={emergencyMedicalInstructions}
                  onChange={(e) => setEmergencyMedicalInstructions(e.target.value)}
                  placeholder="e.g. Carry rescue inhaler in backpack; call parent immediately if wheezing"
                />
              </div>
            </div>
          )}

          {/* Section 7: Documents */}
          {activeStep === 'documents' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Enrollment Document Attachment
                  </span>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attachBirthCert}
                      onChange={(e) => setAttachBirthCert(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>Attach initial document</span>
                  </label>
                </div>

                {attachBirthCert && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <Select
                      label="Document Category"
                      value={initialDocCategory}
                      onChange={(val) => setInitialDocCategory(val as any)}
                      options={[
                        { value: 'birth_certificate', label: 'Birth Certificate' },
                        { value: 'previous_school', label: 'Transfer Certificate / Prior Transcript' },
                        { value: 'photograph', label: 'Student Photo Identification' },
                        { value: 'guardian_id', label: 'Parent ID Proof' },
                        { value: 'health_record', label: 'Immunization / Medical Record' },
                      ]}
                    />
                    <Input
                      label="Document File Name"
                      value={initialDocName}
                      onChange={(e) => setInitialDocName(e.target.value)}
                      placeholder="e.g. Official_Birth_Certificate.pdf"
                    />
                  </div>
                )}
              </div>

              {/* Summary Checklist */}
              <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-4 text-xs text-indigo-950 space-y-2">
                <h4 className="font-bold flex items-center gap-1.5 text-indigo-900">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Pre-Enrollment Review Checklist
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-indigo-900/80">
                  <div>
                    <span className="font-semibold">Candidate:</span>{' '}
                    {firstName && lastName ? `${firstName} ${lastName}` : '(Pending name)'}
                  </div>
                  <div>
                    <span className="font-semibold">Assigned ID:</span> {studentId}
                  </div>
                  <div>
                    <span className="font-semibold">Placement:</span> {selectedClass.name} -{' '}
                    {selectedClass.sections.find((s) => s.id === sectionId)?.name || 'Section A'}
                  </div>
                  <div>
                    <span className="font-semibold">Guardian:</span>{' '}
                    {fatherGuardianName ? `${fatherGuardianName} (${parentContact})` : '(Pending)'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Unsaved Changes Prompt */}
      <ConfirmDialog
        isOpen={showUnsavedPrompt}
        onClose={() => setShowUnsavedPrompt(false)}
        onConfirm={() => {
          setShowUnsavedPrompt(false);
          onClose();
        }}
        title="Discard Unsaved Enrollment Data?"
        message="You have entered student registration details. Closing will discard all current inputs."
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        variant="warning"
      />
    </>
  );
};
