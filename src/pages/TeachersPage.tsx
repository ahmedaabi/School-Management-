import { useState, useMemo } from 'react';
import {
  School,
  Plus,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  UserCheck,
  Building,
} from 'lucide-react';
import { Teacher, TeacherStatus } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export interface TeachersPageProps {
  onOpenAddTeacher: () => void;
}

export const TeachersPage = ({ onOpenAddTeacher }: TeachersPageProps) => {
  const { can } = useAuth();
  const { showToast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>(() => dataService.getTeachers());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  const departments = useMemo(() => {
    return Array.from(new Set(teachers.map((t) => t.department)));
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.name.toLowerCase().includes(q);
        const matchId = t.teacherId.toLowerCase().includes(q);
        const matchEmail = t.email.toLowerCase().includes(q);
        const matchDept = t.department.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchEmail && !matchDept) return false;
      }
      if (selectedDept !== 'all' && t.department !== selectedDept) return false;
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
      return true;
    });
  }, [teachers, searchQuery, selectedDept, selectedStatus]);

  const handleDeleteTeacher = () => {
    if (!teacherToDelete) return;
    try {
      const remaining = teachers.filter((t) => t.id !== teacherToDelete.id);
      setTeachers(remaining);
      showToast(`Faculty record for ${teacherToDelete.name} updated.`, 'info');
    } catch {
      showToast('Could not archive faculty record.', 'error');
    } finally {
      setTeacherToDelete(null);
    }
  };

  const columns: Column<Teacher>[] = [
    {
      key: 'teacherId',
      header: 'ID',
      sortable: true,
      className: 'font-mono text-xs font-semibold text-slate-800',
    },
    {
      key: 'name',
      header: 'Faculty Member',
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-3">
          <img
            src={t.profilePhoto}
            alt={t.name}
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="font-semibold text-slate-900">{t.name}</div>
            <div className="text-[11px] text-slate-400">{t.qualification}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (t) => <span className="font-medium text-slate-800">{t.department}</span>,
    },
    {
      key: 'subjects',
      header: 'Specialization Subjects',
      render: (t) => (
        <div className="flex flex-wrap gap-1">
          {t.subjects.slice(0, 2).map((s, idx) => (
            <span
              key={idx}
              className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
            >
              {s}
            </span>
          ))}
          {t.subjects.length > 2 && (
            <span className="text-[10px] text-slate-400 font-medium">+{t.subjects.length - 2}</span>
          )}
        </div>
      ),
    },
    {
      key: 'assignedClasses',
      header: 'Assigned Classes',
      render: (t) => (
        <span className="text-xs text-slate-600 font-medium">
          {t.assignedClasses.map((c) => c.className).join(', ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (t) => (
        <Badge variant={t.status === 'Active' ? 'success' : t.status === 'On Leave' ? 'warning' : 'neutral'}>
          {t.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setSelectedTeacher(t)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="View Faculty Dossier"
          >
            <Eye className="w-4 h-4" />
          </button>
          {can('teachers.delete') && (
            <button
              type="button"
              onClick={() => setTeacherToDelete(t)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              title="Archive Faculty Record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Faculty & Teacher Directory
            </h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {teachers.length} Faculty
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional educator rosters, departmental allocations, qualifications and timetables
          </p>
        </div>

        {can('teachers.create') && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddTeacher}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Teacher
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search faculty by name, department, ID..."
            />
          </div>
          <div>
            <Select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              options={[
                { value: 'all', label: 'All Academic Departments' },
                ...departments.map((d) => ({ value: d, label: d })),
              ]}
            />
          </div>
          <div>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Active', label: 'Active (On-Campus)' },
                { value: 'On Leave', label: 'On Leave' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Faculty Table */}
      <DataTable
        columns={columns}
        data={filteredTeachers}
        keyExtractor={(t) => t.id}
        onRowClick={(t) => setSelectedTeacher(t)}
        emptyTitle="No faculty members found"
        emptyDescription="Try clearing your filters or adding a new teacher."
      />

      {/* View Teacher Details Modal */}
      {selectedTeacher && (
        <Modal
          isOpen={!!selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
          title="Faculty Dossier"
          subtitle={`Teacher ID: ${selectedTeacher.teacherId}`}
          maxWidth="lg"
          footer={
            <Button variant="outline" size="sm" onClick={() => setSelectedTeacher(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 pb-3 border-b border-slate-100">
              <img
                src={selectedTeacher.profilePhoto}
                alt={selectedTeacher.name}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedTeacher.name}</h3>
                <p className="text-xs text-indigo-600 font-semibold">{selectedTeacher.qualification}</p>
                <div className="flex items-center gap-2 mt-1 text-slate-500">
                  <span>Dept: {selectedTeacher.department}</span>
                  <span>•</span>
                  <span>Joined: {selectedTeacher.joiningDate}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-1">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Email Address</span>
                <span className="font-semibold text-slate-800 text-xs block mt-0.5">{selectedTeacher.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Phone Number</span>
                <span className="font-semibold text-slate-800 text-xs block mt-0.5">{selectedTeacher.phone}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[11px]">
                Teaching Subjects
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedTeacher.subjects.map((sub, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-md border border-indigo-100"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-bold block mb-1 uppercase tracking-wider text-[11px]">
                Assigned Classes & Sections
              </span>
              <div className="space-y-1.5">
                {selectedTeacher.assignedClasses.map((cls, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <span className="font-semibold text-slate-800">{cls.className} ({cls.sectionName})</span>
                    <span className="text-indigo-600 font-medium">{cls.subject}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!teacherToDelete}
        onClose={() => setTeacherToDelete(null)}
        onConfirm={handleDeleteTeacher}
        title="Archive Faculty Record"
        message={
          <span>
            Are you sure you want to archive the faculty profile for{' '}
            <strong className="text-slate-900">{teacherToDelete?.name}</strong>?
          </span>
        }
      />
    </div>
  );
};
