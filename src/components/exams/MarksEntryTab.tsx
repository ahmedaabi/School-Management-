import React, { useState, useEffect } from 'react';
import {
  Save,
  Send,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Check,
  UserCheck,
  FileCheck,
  Lock,
  MessageSquare,
  Search,
  UserX,
  Sparkles,
} from 'lucide-react';
import { ExamMarksBatch, StudentMarkRecord } from '../../types/exam';
import { examService } from '../../services/examService';
import { dataService } from '../../services/dataService';
import { User } from '../../types';

interface MarksEntryTabProps {
  currentUser: User;
  initialExamId?: string;
  initialClassId?: string;
  initialSectionId?: string;
  initialSubjectId?: string;
}

export const MarksEntryTab: React.FC<MarksEntryTabProps> = ({
  currentUser,
  initialExamId,
  initialClassId,
  initialSectionId,
  initialSubjectId,
}) => {
  const exams = examService.getExams();
  const classes = dataService.getClasses();

  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialExamId || exams[0]?.id || ''
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || classes[0]?.id || ''
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    initialSectionId || classes[0]?.sections[0]?.id || ''
  );

  // Available schedules for chosen exam & class
  const schedules = examService.getSchedules({
    examId: selectedExamId,
    classId: selectedClassId,
    sectionId: selectedSectionId,
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || schedules[0]?.subjectId || 'SUB-001'
  );

  const [currentBatch, setCurrentBatch] = useState<ExamMarksBatch | null>(null);
  const [records, setRecords] = useState<StudentMarkRecord[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [searchStudent, setSearchStudent] = useState('');

  // Return for correction modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnComment, setReturnComment] = useState('Please verify marks for students with discrepancies.');

  // Load or create batch whenever selector changes
  useEffect(() => {
    if (selectedExamId && selectedClassId && selectedSectionId && selectedSubjectId) {
      const batch = examService.getOrCreateMarksBatch(
        selectedExamId,
        selectedClassId,
        selectedSectionId,
        selectedSubjectId,
        currentUser
      );
      setCurrentBatch(batch);
      setRecords(batch.records.map((r) => ({ ...r })));
      setValidationErrors([]);
      setSuccessMessage('');
    }
  }, [selectedExamId, selectedClassId, selectedSectionId, selectedSubjectId]);

  // Handle section update when class changes
  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const targetCls = classes.find((c) => c.id === newClassId);
    if (targetCls && targetCls.sections.length > 0) {
      setSelectedSectionId(targetCls.sections[0].id);
    }
  };

  const selectedClassObj = classes.find((c) => c.id === selectedClassId);

  // Permission checks
  const isSuperOrPrincipal =
    currentUser.role === 'super_admin' || currentUser.role === 'principal';
  const isAdmin = currentUser.role === 'admin' || isSuperOrPrincipal;

  const isLocked =
    (currentBatch?.status === 'SUBMITTED' ||
      currentBatch?.status === 'VERIFIED' ||
      currentBatch?.status === 'PUBLISHED') &&
    !isSuperOrPrincipal;

  const handleMarkChange = (studentId: string, val: string) => {
    if (isLocked) return;

    setRecords((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r;
        if (val === '') {
          return { ...r, marksObtained: null };
        }
        const num = parseFloat(val);
        return { ...r, marksObtained: isNaN(num) ? null : num };
      })
    );
  };

  const handleAbsentToggle = (studentId: string, isAbsent: boolean) => {
    if (isLocked) return;

    setRecords((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r;
        return {
          ...r,
          isAbsent,
          marksObtained: isAbsent ? null : r.marksObtained,
        };
      })
    );
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    if (isLocked) return;

    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, remarks } : r))
    );
  };

  const handleSaveDraft = () => {
    if (!currentBatch) return;
    const res = examService.saveMarksDraft(currentBatch.id, records, currentUser);
    if (!res.success) {
      setValidationErrors(res.errors || ['Failed to save draft']);
      setSuccessMessage('');
    } else {
      setValidationErrors([]);
      setSuccessMessage('Marks draft successfully saved.');
      // Refresh current batch
      const updated = examService.getMarksBatch(
        selectedExamId,
        selectedClassId,
        selectedSectionId,
        selectedSubjectId
      );
      if (updated) setCurrentBatch(updated);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  const handleSubmitForVerification = () => {
    if (!currentBatch) return;
    const res = examService.submitMarksBatch(currentBatch.id, records, currentUser);
    if (!res.success) {
      setValidationErrors(res.errors || ['Submission validation failed']);
      setSuccessMessage('');
    } else {
      setValidationErrors([]);
      setSuccessMessage('Marks batch successfully submitted for administrative review!');
      const updated = examService.getMarksBatch(
        selectedExamId,
        selectedClassId,
        selectedSectionId,
        selectedSubjectId
      );
      if (updated) setCurrentBatch(updated);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleVerifyMarks = () => {
    if (!currentBatch) return;
    examService.verifyMarksBatch(
      currentBatch.id,
      'VERIFY',
      'Marks verified and approved by administration.',
      currentUser
    );
    const updated = examService.getMarksBatch(
      selectedExamId,
      selectedClassId,
      selectedSectionId,
      selectedSubjectId
    );
    if (updated) setCurrentBatch(updated);
    setSuccessMessage('Marks batch approved and verified.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleReturnMarks = () => {
    if (!currentBatch) return;
    examService.verifyMarksBatch(currentBatch.id, 'RETURN', returnComment, currentUser);
    const updated = examService.getMarksBatch(
      selectedExamId,
      selectedClassId,
      selectedSectionId,
      selectedSubjectId
    );
    if (updated) setCurrentBatch(updated);
    setIsReturnModalOpen(false);
    setSuccessMessage('Marks returned to teacher with feedback comment.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleMarkAllPresent = () => {
    if (isLocked) return;
    setRecords((prev) => prev.map((r) => ({ ...r, isAbsent: false })));
  };

  const getStatusBadge = (st?: string) => {
    switch (st) {
      case 'PUBLISHED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'VERIFIED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SUBMITTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RETURNED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredRecords = records.filter(
    (r) =>
      r.studentName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      r.rollNumber.toLowerCase().includes(searchStudent.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Marks Entry & Grading Desk
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Record subject scores with strict validation, mark absentees, and manage moderation review workflows.
          </p>
        </div>

        {currentBatch && (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${getStatusBadge(
                currentBatch.status
              )}`}
            >
              Status: {currentBatch.status}
            </span>
          </div>
        )}
      </div>

      {/* Selector Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Examination</label>
          <select
            id="select-marks-exam"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
          <select
            id="select-marks-class"
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Section</label>
          <select
            id="select-marks-section"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {selectedClassObj?.sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
          <select
            id="select-marks-subject"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500"
          >
            {schedules.length > 0 ? (
              schedules.map((s) => (
                <option key={s.id} value={s.subjectId}>
                  {s.subjectName} ({s.totalMarks} Marks)
                </option>
              ))
            ) : (
              <>
                <option value="SUB-001">Mathematics (100 Marks)</option>
                <option value="SUB-002">General Science (100 Marks)</option>
                <option value="SUB-003">English Literature (100 Marks)</option>
                <option value="SUB-004">Social Studies (100 Marks)</option>
                <option value="SUB-005">Computer Science (50 Marks)</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Return Warning Banner if status is RETURNED */}
      {currentBatch?.status === 'RETURNED' && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Marks Batch Returned by Administration</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              <strong>Admin Note:</strong> {currentBatch.reviewComments || 'Please check entries.'}
            </p>
            <p className="text-xs text-rose-600 mt-1">
              You may now update the scores below and resubmit the batch for verification.
            </p>
          </div>
        </div>
      )}

      {/* Lock Notice Banner */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-amber-800">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-amber-600" />
            <div>
              <div className="text-sm font-bold">Marks Entry Locked</div>
              <div className="text-xs text-amber-700">
                This marks batch is {currentBatch?.status}. Regular editing is disabled while under administrative review or official publication.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-sm text-rose-700">
          <div className="font-bold flex items-center gap-1.5 text-rose-800">
            <AlertCircle className="w-4 h-4" />
            Validation Discrepancies ({validationErrors.length}):
          </div>
          <ul className="list-disc pl-5 text-xs space-y-0.5">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Action Toolbar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-marks-student"
            type="text"
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            placeholder="Search student or roll number..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isLocked && (
            <button
              id="btn-mark-all-present"
              onClick={handleMarkAllPresent}
              className="px-3 py-1.5 text-xs bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
            >
              Mark All Present
            </button>
          )}

          {!isLocked && (
            <button
              id="btn-save-marks-draft"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save Draft
            </button>
          )}

          {(!isLocked || isSuperOrPrincipal) && (
            <button
              id="btn-submit-marks-review"
              onClick={handleSubmitForVerification}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Submit for Verification
            </button>
          )}

          {/* Principal & Admin verification buttons */}
          {isAdmin && currentBatch?.status === 'SUBMITTED' && (
            <>
              <button
                id="btn-approve-verify-marks"
                onClick={handleVerifyMarks}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Approve & Verify
              </button>

              <button
                id="btn-return-marks-correction"
                onClick={() => setIsReturnModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Return for Correction
              </button>
            </>
          )}
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {currentBatch?.subjectName || 'Subject'}
            </span>
            <span className="text-xs text-slate-500">
              Total Marks: <strong>{currentBatch?.totalMarks || 100}</strong>
            </span>
            <span className="text-xs text-slate-500">
              Passing Mark: <strong>{currentBatch?.passingMarks || 40}</strong>
            </span>
          </div>

          <span className="text-xs text-slate-500">
            Total Students: <strong>{records.length}</strong> | Present:{' '}
            <strong className="text-emerald-600">
              {records.filter((r) => !r.isAbsent).length}
            </strong>{' '}
            | Absent:{' '}
            <strong className="text-rose-600">
              {records.filter((r) => r.isAbsent).length}
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-16">Roll</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4 w-36">Obtained Marks</th>
                <th className="py-3 px-4 w-28 text-center">Absent</th>
                <th className="py-3 px-4 w-32">Grade / %</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRecords.map((record) => {
                const totalMarks = currentBatch?.totalMarks || 100;
                const isInvalid =
                  !record.isAbsent &&
                  record.marksObtained !== null &&
                  (record.marksObtained < 0 || record.marksObtained > totalMarks);

                let pct = 0;
                let gradeInfo = { grade: '—', gradePoint: 0 };
                if (!record.isAbsent && record.marksObtained !== null) {
                  pct = Number(((record.marksObtained / totalMarks) * 100).toFixed(1));
                  gradeInfo = examService.calculateGradeForPercentage(pct);
                }

                return (
                  <tr
                    key={record.studentId}
                    className={`transition-colors ${
                      record.isAbsent ? 'bg-slate-50/70' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-600">
                      {record.rollNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{record.studentName}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {record.studentId}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {record.isAbsent ? (
                        <span className="inline-block px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg tracking-wider">
                          ABSENT
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            id={`input-marks-${record.studentId}`}
                            type="number"
                            step="0.5"
                            min={0}
                            max={totalMarks}
                            disabled={isLocked}
                            value={
                              record.marksObtained !== null &&
                              record.marksObtained !== undefined
                                ? record.marksObtained
                                : ''
                            }
                            onChange={(e) =>
                              handleMarkChange(record.studentId, e.target.value)
                            }
                            placeholder="Score"
                            className={`w-24 px-2.5 py-1.5 text-sm font-semibold border rounded-lg focus:outline-none focus:ring-2 ${
                              isInvalid
                                ? 'bg-rose-50 border-rose-400 text-rose-700 focus:ring-rose-500'
                                : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500 focus:bg-white'
                            } disabled:opacity-60`}
                          />
                          <span className="text-xs text-slate-400 font-medium">
                            / {totalMarks}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          id={`checkbox-absent-${record.studentId}`}
                          type="checkbox"
                          disabled={isLocked}
                          checked={record.isAbsent}
                          onChange={(e) =>
                            handleAbsentToggle(record.studentId, e.target.checked)
                          }
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span className={record.isAbsent ? 'text-rose-600 font-bold' : ''}>
                          Absent
                        </span>
                      </label>
                    </td>

                    <td className="py-3 px-4">
                      {record.isAbsent ? (
                        <span className="text-xs text-slate-400 font-medium">—</span>
                      ) : record.marksObtained !== null ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded border ${
                              pct >= (currentBatch?.passingMarks || 40)
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                          >
                            {gradeInfo.grade}
                          </span>
                          <span className="text-xs text-slate-500">{pct}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Unscored</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <input
                        id={`input-remarks-${record.studentId}`}
                        type="text"
                        disabled={isLocked}
                        value={record.remarks}
                        onChange={(e) =>
                          handleRemarksChange(record.studentId, e.target.value)
                        }
                        placeholder="Teacher note..."
                        className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:bg-white disabled:opacity-60"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredRecords.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">
              No student records match your query.
            </div>
          )}
        </div>
      </div>

      {/* Return for Correction Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2 text-rose-800">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold">Return Marks for Correction</h3>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Specify the exact reason or instructions for the teacher (e.g., recheck missing roll numbers, verify science lab bonus, or correct marks exceeding max limit).
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Revision Feedback / Comment *
                </label>
                <textarea
                  id="textarea-return-comment"
                  rows={3}
                  value={returnComment}
                  onChange={(e) => setReturnComment(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-return-marks"
                  onClick={handleReturnMarks}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Confirm Return to Teacher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
