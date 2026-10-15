import { X, Phone, Mail, MapPin, Briefcase, Users, ExternalLink, GraduationCap } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Parent, Student } from '../../types';
import { dataService } from '../../services/dataService';

export interface ParentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: string;
  student?: Student | null;
  onSelectStudent?: (studentId: string) => void;
}

export const ParentProfileModal = ({
  isOpen,
  onClose,
  parentId,
  student,
  onSelectStudent,
}: ParentProfileModalProps) => {
  // Find parent either by parentId or by looking up via student's parentId or name
  const parents = dataService.getParents();
  let parent: Parent | undefined;

  if (parentId) {
    parent = parents.find((p) => p.id === parentId);
  } else if (student?.parentId) {
    parent = parents.find((p) => p.id === student.parentId);
  } else if (student?.fatherGuardianName) {
    parent = parents.find(
      (p) =>
        p.name.toLowerCase() === student.fatherGuardianName.toLowerCase() ||
        p.phone === student.parentContact
    );
  }

  // If no parent entity exists in DB yet, create a virtual one from the student's guardian info
  const displayParent: Parent = parent || {
    id: student?.parentId || 'PAR-TEMP',
    name: student?.fatherGuardianName || 'Guardian Record',
    relationship: student?.parentRelationship || 'Guardian',
    email: student?.parentEmail || 'guardian@family.org',
    phone: student?.parentContact || '+1 (555) 000-0000',
    secondaryPhone: student?.secondaryContact || '',
    occupation: student?.parentOccupation || 'Parent / Guardian',
    address: student?.address || 'Residential District',
    childrenIds: student ? [student.id, student.studentId] : [],
  };

  // Associated children enrolled
  const associatedStudents = dataService.getStudents(true).filter((s) => {
    if (parent) {
      if (parent.childrenIds?.includes(s.id) || parent.childrenIds?.includes(s.studentId)) return true;
      if (s.parentId === parent.id) return true;
    }
    if (student) {
      if (s.parentId && student.parentId && s.parentId === student.parentId) return true;
      if (
        s.fatherGuardianName.toLowerCase() === student.fatherGuardianName.toLowerCase() &&
        s.parentContact === student.parentContact
      ) {
        return true;
      }
    }
    return false;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Parent & Guardian Association"
      subtitle={`Enrolled Family Profile • ID: ${displayParent.id}`}
      maxWidth="2xl"
      id="parent-profile-modal"
      footer={
        <div className="flex justify-end w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Parent Primary Info Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg shadow-2xs border border-indigo-200">
                {displayParent.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{displayParent.name}</h3>
                  <Badge variant="purple">{displayParent.relationship || 'Guardian'}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{displayParent.occupation || 'Professional / Guardian'}</span>
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 font-mono">
              Family ID: <span className="font-bold text-slate-800">{displayParent.id}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/70 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 text-[10px] block">Primary Contact</span>
                <span className="font-semibold text-slate-800">{displayParent.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 text-[10px] block">Email Address</span>
                <span className="font-semibold text-slate-800">{displayParent.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 text-[10px] block">Home Residence</span>
                <span className="font-medium text-slate-700">{displayParent.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Associated Children List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Enrolled Children ({associatedStudents.length})
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">Linked to this guardian record</span>
          </div>

          {associatedStudents.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
              No other enrolled siblings found for this parent record.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {associatedStudents.map((child) => {
                const isCurrent = student && (child.id === student.id || child.studentId === student.studentId);
                return (
                  <div
                    key={child.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-indigo-50/50 border-indigo-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={child.profilePhoto}
                        alt={child.firstName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {child.firstName} {child.lastName}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                              Viewing
                            </span>
                          )}
                          <Badge
                            variant={
                              child.status === 'Active'
                                ? 'success'
                                : child.status === 'Suspended'
                                ? 'danger'
                                : 'neutral'
                            }
                          >
                            {child.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono text-slate-600">{child.studentId}</span>
                          <span>•</span>
                          <span>{child.className} - {child.sectionName}</span>
                          <span>•</span>
                          <span>Roll #{child.rollNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex flex-col items-end text-right text-[11px] mr-2">
                        <span className="text-slate-400">Attendance</span>
                        <span className="font-bold text-slate-700">{child.attendanceRate}%</span>
                      </div>

                      {onSelectStudent && !isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onSelectStudent(child.studentId);
                            onClose();
                          }}
                          leftIcon={<ExternalLink className="w-3 h-3" />}
                        >
                          View Child Profile
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
