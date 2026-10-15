import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Download,
  AlertTriangle,
  GraduationCap,
  Users,
} from 'lucide-react';
import { Student, StudentStatus } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EditStudentModal } from '../components/modals/EditStudentModal';

export interface StudentsPageProps {
  onViewStudent: (studentId: string) => void;
  onOpenAddStudent: () => void;
}

export const StudentsPage = ({ onViewStudent, onOpenAddStudent }: StudentsPageProps) => {
  const { can } = useAuth();
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>(() => dataService.getStudents());
  const classes = dataService.getClasses();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>('studentId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered & Sorted Data
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        const matchName = fullName.includes(q);
        const matchId = s.studentId.toLowerCase().includes(q);
        const matchParent = s.fatherGuardianName.toLowerCase().includes(q);
        const matchEmail = s.email.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchParent && !matchEmail) return false;
      }

      // Class
      if (selectedClass !== 'all' && s.classId !== selectedClass) {
        return false;
      }

      // Section
      if (selectedSection !== 'all' && s.sectionName !== selectedSection) {
        return false;
      }

      // Status
      if (selectedStatus !== 'all' && s.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedClass, selectedSection, selectedStatus]);

  const sortedStudents = useMemo(() => {
    const list = [...filteredStudents];
    list.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Student] ?? '';
      let bVal: any = b[sortColumn as keyof Student] ?? '';

      if (sortColumn === 'name') {
        aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
        bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });
    return list;
  }, [filteredStudents, sortColumn, sortDirection]);

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  const handleDeleteConfirm = () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      const success = dataService.deleteStudent(studentToDelete.id);
      if (success) {
        setStudents(dataService.getStudents());
        showToast(`Student ${studentToDelete.firstName} ${studentToDelete.lastName} archived.`, 'info');
      }
    } catch {
      showToast('Could not delete record.', 'error');
    } finally {
      setIsDeleting(false);
      setStudentToDelete(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Student ID', 'First Name', 'Last Name', 'Class', 'Section', 'Parent', 'Phone', 'Attendance Rate', 'Fee Status', 'Status'];
    const rows = sortedStudents.map((s) => [
      s.studentId,
      s.firstName,
      s.lastName,
      s.className,
      s.sectionName,
      s.fatherGuardianName,
      s.parentContact,
      `${s.attendanceRate}%`,
      s.feeStatus,
      s.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Student roster exported as CSV.', 'success');
  };

  // Table Columns
  const columns: Column<Student>[] = [
    {
      key: 'studentId',
      header: 'Student ID',
      sortable: true,
      className: 'font-mono text-xs font-semibold text-slate-800',
      render: (s) => <span>{s.studentId}</span>,
    },
    {
      key: 'name',
      header: 'Student',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <img
            src={s.profilePhoto}
            alt={s.firstName}
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
            referrerPolicy="no-referrer"
          />
          <div>
            <div
              onClick={() => onViewStudent(s.studentId)}
              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              {s.firstName} {s.lastName}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">{s.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'className',
      header: 'Class',
      sortable: true,
      render: (s) => <span className="font-medium text-slate-800">{s.className}</span>,
    },
    {
      key: 'sectionName',
      header: 'Section',
      sortable: true,
      render: (s) => <span className="text-slate-600">{s.sectionName}</span>,
    },
    {
      key: 'fatherGuardianName',
      header: 'Parent / Guardian',
      sortable: true,
      render: (s) => (
        <div>
          <div className="font-medium text-slate-800">{s.fatherGuardianName}</div>
          <div className="text-[11px] text-slate-400">{s.parentContact}</div>
        </div>
      ),
    },
    {
      key: 'attendanceRate',
      header: 'Attendance',
      sortable: true,
      render: (s) => (
        <Badge
          variant={
            s.attendanceRate >= 95
              ? 'success'
              : s.attendanceRate >= 85
              ? 'warning'
              : 'danger'
          }
        >
          {s.attendanceRate}%
        </Badge>
      ),
    },
    {
      key: 'feeStatus',
      header: 'Fee Status',
      sortable: true,
      render: (s) => (
        <Badge
          variant={
            s.feeStatus === 'Paid'
              ? 'success'
              : s.feeStatus === 'Pending'
              ? 'warning'
              : 'danger'
          }
        >
          {s.feeStatus}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (s) => (
        <Badge
          variant={
            s.status === 'Active'
              ? 'success'
              : s.status === 'Suspended'
              ? 'danger'
              : s.status === 'Graduated'
              ? 'purple'
              : 'neutral'
          }
        >
          {s.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onViewStudent(s.studentId)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="View Full Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          {can('students.edit') && (
            <button
              type="button"
              onClick={() => setEditingStudent(s)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Edit Record"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {can('students.delete') && (
            <button
              type="button"
              onClick={() => setStudentToDelete(s)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              title="Archive Record"
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
              Student Directory & Management
            </h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {students.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain official pupil registrations, academic standing, guardian contacts & attendance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          {can('students.create') && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAddStudent}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Student
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                setCurrentPage(1);
              }}
              placeholder="Search by student name, ID, parent, email..."
            />
          </div>

          <div>
            <Select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Classes' },
                ...classes.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <div>
            <Select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Sections' },
                { value: 'Section A', label: 'Section A' },
                { value: 'Section B', label: 'Section B' },
              ]}
            />
          </div>

          <div>
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Active', label: 'Active Only' },
                { value: 'Suspended', label: 'Suspended' },
                { value: 'Graduated', label: 'Graduated' },
                { value: 'Transferred', label: 'Transferred' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>

        {/* Filter Summary */}
        {(searchQuery || selectedClass !== 'all' || selectedSection !== 'all' || selectedStatus !== 'all') && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing <span className="font-semibold text-slate-800">{filteredStudents.length}</span> matching students
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClass('all');
                setSelectedSection('all');
                setSelectedStatus('all');
                setCurrentPage(1);
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={sortedStudents}
        keyExtractor={(s) => s.studentId}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        page={currentPage}
        pageSize={pageSize}
        totalCount={sortedStudents.length}
        onPageChange={setCurrentPage}
        onRowClick={(s) => onViewStudent(s.studentId)}
        emptyTitle="No students found"
        emptyDescription="Try adjusting your search criteria, class filters or status toggles."
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={!!editingStudent}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onStudentUpdated={(updated) => {
          setStudents(dataService.getStudents());
        }}
      />

      {/* Delete/Archive Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Archive Student Record"
        variant="danger"
        confirmLabel="Archive Record"
        isLoading={isDeleting}
        message={
          <span>
            Are you sure you want to archive{' '}
            <strong className="text-slate-900">
              {studentToDelete?.firstName} {studentToDelete?.lastName} ({studentToDelete?.studentId})
            </strong>
            ? The student will be marked as inactive and removed from active class roll calls.
          </span>
        }
      />
    </div>
  );
};
