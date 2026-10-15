import { useState, FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AttendanceStatus } from '../../types';
import { CheckCircle2, XCircle, Clock, HelpCircle } from 'lucide-react';

export interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const MarkAttendanceModal = ({
  isOpen,
  onClose,
  onSubmitted,
}: MarkAttendanceModalProps) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const classes = dataService.getClasses();
  const students = dataService.getStudents();

  const [classId, setClassId] = useState(classes[0]?.id || 'CLS-001');
  const selectedClass = classes.find((c) => c.id === classId) || classes[0];
  const [sectionId, setSectionId] = useState(selectedClass?.sections[0]?.id || 'SEC-001');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter students in selected class
  const classStudents = students
    .filter((s) => s.classId === classId && s.status === 'Active');

  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    classStudents.forEach((s) => {
      updated[s.studentId] = 'Present';
    });
    setAttendanceMap(updated);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedSection = selectedClass?.sections.find((s) => s.id === sectionId);

    dataService.recordClassAttendance({
      classId,
      className: selectedClass.name,
      sectionId,
      sectionName: selectedSection?.name || 'Section A',
      date,
      records: classStudents.map((s) => ({
        studentId: s.studentId,
        studentName: `${s.firstName} ${s.lastName}`,
        rollNumber: s.rollNumber || '01',
        status: attendanceMap[s.studentId] || 'Present',
      })),
      user: currentUser || undefined,
    });

    showToast(`Attendance recorded for ${selectedClass.name} - ${date}`, 'success');
    setIsSubmitting(false);
    if (onSubmitted) onSubmitted();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Class Attendance Register"
      subtitle={`Session Date: ${date} • ${selectedClass?.name}`}
      maxWidth="2xl"
      id="mark-attendance-modal"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Submit Register
          </Button>
        </>
      }
    >
      <div className="space-y-4">
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
            options={selectedClass.sections.map((s) => ({
              value: s.id,
              label: s.name,
            }))}
          />
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Students Enrolled ({classStudents.length})
          </span>
          <Button variant="subtle" size="sm" onClick={markAllPresent}>
            Mark All Present
          </Button>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
          {classStudents.map((stu) => {
            const currentStatus = attendanceMap[stu.studentId] || 'Present';
            return (
              <div
                key={stu.studentId}
                className="px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={stu.profilePhoto}
                    alt={stu.firstName}
                    className="w-7 h-7 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      {stu.firstName} {stu.lastName}
                    </div>
                    <div className="text-[10px] text-slate-500">Roll #{stu.rollNumber} • {stu.studentId}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStatus(stu.studentId, 'Present')}
                    className={`px-2 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors ${
                      currentStatus === 'Present'
                        ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    P
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(stu.studentId, 'Late')}
                    className={`px-2 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors ${
                      currentStatus === 'Late'
                        ? 'bg-amber-500 text-white shadow-2xs font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    L
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(stu.studentId, 'Absent')}
                    className={`px-2 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors ${
                      currentStatus === 'Absent'
                        ? 'bg-rose-600 text-white shadow-2xs font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <XCircle className="w-3 h-3" />
                    A
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
