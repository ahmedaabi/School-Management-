import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  MapPin,
  Building,
  UploadCloud,
  CheckCircle2,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';
import { AdmissionDocument, ApplicationSource } from '../../types/admission';
import { admissionService } from '../../services/admissionService';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

interface NewApplicationTabProps {
  onSuccess: (app: any) => void;
  onCancel: () => void;
}

export const NewApplicationTab: React.FC<NewApplicationTabProps> = ({ onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const classes = dataService.getClasses();

  // Applicant fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [appliedClassId, setAppliedClassId] = useState(classes[0]?.id || 'CLS-001');
  const [appliedSectionId, setAppliedSectionId] = useState('SEC-001');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [previousSchool, setPreviousSchool] = useState('');
  const [previousGrade, setPreviousGrade] = useState('');
  const [previousPerformance, setPreviousPerformance] = useState('');

  // Parent fields
  const [parentName, setParentName] = useState('');
  const [parentRelationship, setParentRelationship] = useState('Father');
  const [parentPhone, setParentPhone] = useState('');
  const [parentAlternatePhone, setParentAlternatePhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentOccupation, setParentOccupation] = useState('');

  // Address fields
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('San Francisco');
  const [postalCode, setPostalCode] = useState('94102');
  const [country, setCountry] = useState('United States');

  // Emergency fields
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('Mother');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Source
  const [source, setSource] = useState<ApplicationSource>('Website');
  const [howDidYouHear, setHowDidYouHear] = useState('Official School Portal');

  // Uploaded documents state
  const [documents, setDocuments] = useState<AdmissionDocument[]>([
    {
      id: 'DOC-INIT-1',
      type: 'Birth Certificate',
      fileName: 'Official_Birth_Record.pdf',
      fileSize: '1.4 MB',
      uploadedDate: new Date().toISOString().split('T')[0],
      verificationStatus: 'PENDING',
    },
    {
      id: 'DOC-INIT-2',
      type: 'Previous School Certificate',
      fileName: 'Official_Transcript_Grade7.pdf',
      fileSize: '2.1 MB',
      uploadedDate: new Date().toISOString().split('T')[0],
      verificationStatus: 'PENDING',
    },
  ]);

  const [uploadDocType, setUploadDocType] = useState<any>('Student Photo');
  const [uploadFileName, setUploadFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentClass = classes.find((c) => c.id === appliedClassId);
  const sections = currentClass?.sections || [];

  const handleAddMockFile = () => {
    if (!uploadFileName.trim()) {
      showToast('Please provide a file name.', 'warning');
      return;
    }
    const newDoc: AdmissionDocument = {
      id: `DOC-${Date.now()}`,
      type: uploadDocType,
      fileName: uploadFileName.trim().endsWith('.pdf') || uploadFileName.trim().endsWith('.jpg') ? uploadFileName.trim() : `${uploadFileName.trim()}.pdf`,
      fileSize: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      uploadedDate: new Date().toISOString().split('T')[0],
      verificationStatus: 'PENDING',
    };
    setDocuments([...documents, newDoc]);
    setUploadFileName('');
    showToast(`Added document: ${newDoc.type}`, 'success');
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !parentName.trim() || !parentPhone.trim() || !parentEmail.trim()) {
      showToast('Please fill out all mandatory fields.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const newApp = admissionService.createApplication(
        {
          applicantFirstName: firstName.trim(),
          applicantMiddleName: middleName.trim() || undefined,
          applicantLastName: lastName.trim(),
          dateOfBirth,
          gender,
          appliedClassId,
          appliedClassName: currentClass?.name || 'Class 8',
          appliedSectionId,
          appliedSectionName: sections.find((s: any) => s.id === appliedSectionId)?.name || 'A',
          academicYear,
          previousSchool: previousSchool.trim() || undefined,
          previousGrade: previousGrade.trim() || undefined,
          previousAcademicPerformance: previousPerformance.trim() || undefined,
          parentName: parentName.trim(),
          parentRelationship,
          parentPhone: parentPhone.trim(),
          parentAlternatePhone: parentAlternatePhone.trim() || undefined,
          parentEmail: parentEmail.trim(),
          parentOccupation: parentOccupation.trim() || undefined,
          address: address.trim() || '123 Academic Way',
          city: city.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
          emergencyContactName: emergencyContactName.trim() || parentName.trim(),
          emergencyContactRelationship: emergencyContactRelationship.trim() || parentRelationship,
          emergencyContactPhone: emergencyContactPhone.trim() || parentPhone.trim(),
          source,
          howDidYouHear,
          documents,
        },
        currentUser || undefined
      );

      showToast(`Application ${newApp.applicationNumber} registered successfully!`, 'success');
      onSuccess(newApp);
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit application', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">New Candidate Admission Form</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register an intake candidate with full parent and residential details. Unique application number will be generated automatically.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel & Return
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Applicant Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-indigo-600" />
            1. Applicant Student Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Liam"
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Middle Name</label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="e.g. Scott"
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Sterling"
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Applying For Class <span className="text-rose-500">*</span>
              </label>
              <select
                value={appliedClassId}
                onChange={(e) => {
                  setAppliedClassId(e.target.value);
                  const c = classes.find((x) => x.id === e.target.value);
                  if (c && c.sections && c.sections.length > 0) {
                    setAppliedSectionId(c.sections[0].id);
                  }
                }}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white font-medium"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Preferred Section</label>
              <select
                value={appliedSectionId}
                onChange={(e) => setAppliedSectionId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                {sections.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    Section {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Previous Grade</label>
              <input
                type="text"
                value={previousGrade}
                onChange={(e) => setPreviousGrade(e.target.value)}
                placeholder="e.g. Grade 7"
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Previous School Attended</label>
              <input
                type="text"
                value={previousSchool}
                onChange={(e) => setPreviousSchool(e.target.value)}
                placeholder="e.g. Westside Preparatory Academy"
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Previous Academic Performance</label>
              <input
                type="text"
                value={previousPerformance}
                onChange={(e) => setPreviousPerformance(e.target.value)}
                placeholder="e.g. GPA 3.8 / Honors Math"
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Parent / Guardian Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            2. Parent / Guardian Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Parent / Guardian Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g. Robert Sterling"
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Relationship</label>
              <select
                value={parentRelationship}
                onChange={(e) => setParentRelationship(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Legal Guardian">Legal Guardian</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Occupation</label>
              <input
                type="text"
                value={parentOccupation}
                onChange={(e) => setParentOccupation(e.target.value)}
                placeholder="e.g. Biomedical Engineer"
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Primary Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="+1 (555) 345-6789"
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Alternate Phone</label>
              <input
                type="tel"
                value={parentAlternatePhone}
                onChange={(e) => setParentAlternatePhone(e.target.value)}
                placeholder="+1 (555) 987-6543"
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="parent@example.com"
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Address & Emergency Contacts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-4 h-4 text-indigo-600" />
            3. Address & Emergency Verification
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">
                Residential Street Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="420 Pinecrest Boulevard, Suite 300"
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Postal / Zip Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Emergency Contact Person</label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="e.g. Clara Sterling"
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Emergency Phone</label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="+1 (555) 777-8888"
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Application Inbound Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Website">Website</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Referral">Referral</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="Education Fair">Education Fair</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Document Attachments */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            4. Supporting Documents
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Document Category</label>
              <select
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value as any)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Birth Certificate">Birth Certificate</option>
                <option value="Previous School Certificate">Previous School Certificate</option>
                <option value="Student Photo">Student Photo</option>
                <option value="Parent/Guardian ID">Parent/Guardian ID</option>
                <option value="Medical Clearance">Medical Clearance</option>
                <option value="Transfer Certificate">Transfer Certificate</option>
                <option value="Other Documents">Other Documents</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">File Name</label>
              <input
                type="text"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                placeholder="e.g. Immunization_Form.pdf"
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex items-end">
              <Button type="button" size="sm" variant="outline" onClick={handleAddMockFile} className="w-full">
                Attach Document
              </Button>
            </div>
          </div>

          {/* Attached files list */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-600 block">Attached Verification Records ({documents.length}):</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-slate-800 block truncate">{doc.type}</span>
                      <span className="text-[11px] text-slate-400 truncate block">{doc.fileName} ({doc.fileSize})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(doc.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md"
            disabled={isSubmitting}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            {isSubmitting ? 'Registering Application...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </div>
  );
};
