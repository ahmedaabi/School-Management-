import { useState, FormEvent } from 'react';
import {
  BookOpen,
  Plus,
  Users,
  School,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SchoolClass, ClassSection } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

export interface ClassesPageProps {
  onViewClassStudents: (classId: string) => void;
}

export const ClassesPage = ({ onViewClassStudents }: ClassesPageProps) => {
  const { can } = useAuth();
  const { showToast } = useToast();
  const [classes, setClasses] = useState<SchoolClass[]>(() => dataService.getClasses());
  const teachers = dataService.getTeachers();

  const [selectedClass, setSelectedClass] = useState<SchoolClass>(classes[0]);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState('11');
  const [newCapacity, setNewCapacity] = useState('35');

  // New Section Form State
  const [newSectionName, setNewSectionName] = useState('Section C');
  const [newRoomNumber, setNewRoomNumber] = useState('Room 304');
  const [newClassTeacherId, setNewClassTeacherId] = useState(teachers[0]?.id || '');

  const handleCreateClass = (e: FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const created = dataService.addClass({
      name: newClassName.trim(),
      gradeLevel: Number(newGradeLevel) || 10,
      capacity: Number(newCapacity) || 30,
      sections: [
        {
          id: `SEC-${Date.now().toString().slice(-4)}`,
          name: 'Section A',
          roomNumber: 'Room 101',
          classTeacherId: teachers[0]?.id || 'TCH-001',
          classTeacherName: teachers[0]?.name || 'Faculty Lead',
          studentCount: 0,
        },
      ],
      subjects: ['English Literature', 'Mathematics', 'General Science'],
    });

    const updated = dataService.getClasses();
    setClasses(updated);
    setSelectedClass(created);
    setIsAddClassOpen(false);
    setNewClassName('');
    showToast(`Class ${created.name} created with primary section.`, 'success');
  };

  const handleAddSection = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    const teacher = teachers.find((t) => t.id === newClassTeacherId) || teachers[0];
    const newSec: ClassSection = {
      id: `SEC-${Date.now().toString().slice(-4)}`,
      name: newSectionName,
      roomNumber: newRoomNumber,
      classTeacherId: teacher.id,
      classTeacherName: teacher.name,
      studentCount: 0,
    };

    const updatedSections = [...selectedClass.sections, newSec];
    const updatedClass = { ...selectedClass, sections: updatedSections };
    dataService.updateClass(selectedClass.id, { sections: updatedSections });

    const allUpdated = dataService.getClasses();
    setClasses(allUpdated);
    setSelectedClass(updatedClass);
    setIsAddSectionOpen(false);
    showToast(`Added ${newSec.name} to ${selectedClass.name}`, 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Academics & Classroom Architecture
            </h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {classes.length} Grades / Classes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage academic tiers, sectional cohorts, faculty headships and subject syllabi
          </p>
        </div>

        {can('classes.manage') && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddClassOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Class
          </Button>
        )}
      </div>

      {/* Class Horizontal Selector or Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {classes.map((cls) => {
          const isSelected = selectedClass?.id === cls.id;
          return (
            <div
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none text-left ${
                isSelected
                  ? 'bg-indigo-50/80 border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">{cls.name}</span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{cls.sections.length} Sections</span>
                <span className="font-semibold text-slate-700">{cls.totalStudents} Pupils</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Class Deep-Dive View */}
      {selectedClass && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900">{selectedClass.name}</h2>
                <Badge variant="info">Grade Level {selectedClass.gradeLevel}</Badge>
                <span className="text-xs text-slate-500">Max Capacity: {selectedClass.capacity} / section</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Total Enrolled: {selectedClass.totalStudents} Students across {selectedClass.sections.length} Sections
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewClassStudents(selectedClass.id)}
                leftIcon={<Users className="w-3.5 h-3.5" />}
              >
                View Enrolled Students
              </Button>
              {can('classes.manage') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddSectionOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Section
                </Button>
              )}
            </div>
          </div>

          {/* Sections List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Configured Sections & Class Teachers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedClass.sections.map((sec) => (
                <div
                  key={sec.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900">{sec.name}</span>
                    <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      {sec.roomNumber}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Class Teacher:</span>
                      <span className="font-semibold text-slate-800">{sec.classTeacherName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Section Enrollment:</span>
                      <span className="font-semibold text-slate-800">{sec.studentCount} / {selectedClass.capacity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subjects Syllabus */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Curriculum & Subjects Taught
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedClass.subjects.map((sub, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 bg-indigo-50/70 border border-indigo-200/80 rounded-lg text-xs font-semibold text-indigo-900 flex items-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Class */}
      <Modal
        isOpen={isAddClassOpen}
        onClose={() => setIsAddClassOpen(false)}
        title="Create Academic Class"
        subtitle="Establish a new educational standard tier"
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddClassOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateClass}>
              Create Class
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateClass} className="space-y-4">
          <Input
            label="Class / Grade Name"
            required
            placeholder="e.g. Class 11"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Grade Level (Numeric)"
              type="number"
              value={newGradeLevel}
              onChange={(e) => setNewGradeLevel(e.target.value)}
            />
            <Input
              label="Section Target Capacity"
              type="number"
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Add Section */}
      <Modal
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
        title={`Add Section to ${selectedClass?.name}`}
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddSectionOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddSection}>
              Add Section
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddSection} className="space-y-4">
          <Input
            label="Section Identifier"
            required
            placeholder="e.g. Section B"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
          />
          <Input
            label="Homeroom / Room Location"
            required
            placeholder="e.g. Hall 204"
            value={newRoomNumber}
            onChange={(e) => setNewRoomNumber(e.target.value)}
          />
          <Select
            label="Assign Head Class Teacher"
            value={newClassTeacherId}
            onChange={(e) => setNewClassTeacherId(e.target.value)}
            options={teachers.map((t) => ({ value: t.id, label: `${t.name} (${t.department})` }))}
          />
        </form>
      </Modal>
    </div>
  );
};
