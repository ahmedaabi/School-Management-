import React, { useState, useRef, FormEvent } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { StudentDocument } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onDocumentUploaded: () => void;
  documentToReplace?: StudentDocument | null;
}

export const UploadDocumentModal = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  onDocumentUploaded,
  documentToReplace,
}: UploadDocumentModalProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documentName, setDocumentName] = useState(documentToReplace?.name || '');
  const [category, setCategory] = useState<StudentDocument['category']>(
    documentToReplace?.category || 'birth_certificate'
  );
  const [verified, setVerified] = useState(documentToReplace?.verified ?? true);
  const [selectedFileName, setSelectedFileName] = useState(
    documentToReplace?.name || 'Academic_Record_Enrollment.pdf'
  );
  const [fileSize, setFileSize] = useState(documentToReplace?.fileSize || '1.8 MB');
  const [fileType, setFileType] = useState(documentToReplace?.type || 'PDF');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
      }
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setFileSize(`${mb} MB`);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      setFileType(ext);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
      }
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setFileSize(`${mb} MB`);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      setFileType(ext);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!documentName.trim()) {
      showToast('Please enter a document title or description.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalDocName = documentName.endsWith(`.${fileType.toLowerCase()}`)
        ? documentName
        : `${documentName}.${fileType.toLowerCase()}`;

      if (documentToReplace) {
        dataService.replaceStudentDocument(
          studentId,
          documentToReplace.id,
          {
            name: finalDocName,
            category,
            type: fileType,
            fileSize,
            verified,
          },
          { name: user?.name || 'Administrator', role: user?.role || 'Admin Staff' }
        );
        showToast('Document replaced and verified.', 'success');
      } else {
        dataService.uploadStudentDocument(
          studentId,
          {
            name: finalDocName,
            category,
            type: fileType,
            fileSize,
            verified,
          },
          { name: user?.name || 'Administrator', role: user?.role || 'Admin Staff' }
        );
        showToast('Document securely uploaded to student archive.', 'success');
      }

      onDocumentUploaded();
      onClose();
    } catch {
      showToast('Error uploading document.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={documentToReplace ? 'Replace Student Document' : 'Upload Student Document'}
      subtitle={`Student: ${studentName} (${studentId})`}
      maxWidth="lg"
      id="upload-document-modal"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} leftIcon={<Upload className="w-3.5 h-3.5" />}>
            {documentToReplace ? 'Update Document' : 'Upload File'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Document Category <span className="text-rose-500">*</span>
          </label>
          <Select
            value={category}
            onChange={(val) => setCategory(val as StudentDocument['category'])}
            options={[
              { value: 'birth_certificate', label: 'Birth Certificate' },
              { value: 'previous_school', label: 'Transfer Certificate / Prior School Records' },
              { value: 'photograph', label: 'Student Identification Photograph' },
              { value: 'guardian_id', label: 'Parent / Guardian Identification' },
              { value: 'health_record', label: 'Medical Clearance & Immunization Card' },
              { value: 'other', label: 'Other Official Educational Record' },
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Document Label / Title <span className="text-rose-500">*</span>
          </label>
          <Input
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            placeholder="e.g. Birth_Certificate_Certified_Copy"
            required
          />
        </div>

        {/* Drag & Drop File Zone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            File Attachment (PDF, PNG, JPG up to 10MB)
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            className="hidden"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50'
                : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Click to select or drag and drop file here
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supports official school PDF scans, image proofs, or verified certificates
            </p>

            {selectedFileName && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>{selectedFileName}</span>
                <span className="text-[10px] text-slate-400">({fileSize})</span>
              </div>
            )}
          </div>
        </div>

        {/* Verification Checkbox */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="doc-verified"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300"
          />
          <label htmlFor="doc-verified" className="text-xs font-medium text-slate-700 cursor-pointer">
            Mark document as <span className="text-emerald-700 font-bold">Officially Verified</span> by Admissions Office
          </label>
        </div>
      </form>
    </Modal>
  );
};
