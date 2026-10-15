import { ReactNode } from 'react';
import {
  Users2,
  HelpCircle,
  Bus,
  Activity,
  FileBarChart,
  Settings,
  ShieldCheck,
  School,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { dataService } from '../services/dataService';

export interface GenericModulePageProps {
  module: 'parents' | 'requests' | 'transport' | 'health' | 'reports' | 'settings';
}

export const GenericModulePage = ({ module }: GenericModulePageProps) => {
  const { showToast } = useToast();
  const school = dataService.getSchool();
  const students = dataService.getStudents();

  if (module === 'parents') {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Parents & Guardians Registry
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified family contacts, legal guardian declarations, and portal access authorization
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.slice(0, 9).map((s) => (
            <div key={s.id} className="bg-white border border-slate-200/80 rounded-xl p-4.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">{s.fatherGuardianName}</span>
                <Badge variant="success">Portal Verified</Badge>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600 mt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ward / Student:</span>
                  <span className="font-semibold text-slate-800">{s.firstName} {s.lastName} ({s.className})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone Contact:</span>
                  <span className="font-semibold text-indigo-600">{s.parentContact}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Emergency Designated:</span>
                  <span className="text-slate-700">{s.emergencyContact || 'Same as primary'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (module === 'requests') {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Parent Requests & Complaints Desk
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Resolution tracking for parent feedback, route change requests, and administrative queries
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => showToast('New support ticket opened', 'info')}
          >
            Log Support Request
          </Button>
        </div>

        <div className="space-y-3">
          {[
            {
              id: 'REQ-104',
              parent: 'Marcus Sterling (Liam Sterling - Class 10A)',
              subject: 'Bus Stop Relocation Request for Route 4',
              date: 'Sep 02, 2025',
              status: 'In Progress',
              priority: 'Normal',
              assignedTo: 'Transport Coordinator',
            },
            {
              id: 'REQ-103',
              parent: 'Dr. Rebecca Chen (Maya Chen - Class 9B)',
              subject: 'Inquiry regarding Advanced Chemistry Lab safety gear',
              date: 'Aug 29, 2025',
              status: 'Resolved',
              priority: 'High',
              assignedTo: 'Science Dept Head',
            },
            {
              id: 'REQ-102',
              parent: 'Thomas Jenkins (Aiden Jenkins - Class 11A)',
              subject: 'Request for official high school transcript notarization',
              date: 'Aug 25, 2025',
              status: 'Resolved',
              priority: 'Normal',
              assignedTo: 'Registrar Office',
            },
          ].map((req) => (
            <div key={req.id} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600">{req.id}</span>
                    <h3 className="text-sm font-bold text-slate-900">{req.subject}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{req.parent}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={req.status === 'Resolved' ? 'success' : 'warning'}>
                    {req.status}
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-mono">{req.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (module === 'transport') {
    return (
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            School Transport & Bus Fleet Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Vehicle registration, driver credentials, route schedules and pupil manifests
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              busNumber: 'Bus #04 (North Hills Route)',
              driver: 'Mr. Robert Gable',
              phone: '+1 (555) 304-1120',
              capacity: '42 / 45 seats occupied',
              status: 'En Route',
              stops: 'Northgate, Elm Crescent, Willow Park, School Campus',
            },
            {
              busNumber: 'Bus #08 (Downtown Express)',
              driver: 'Ms. Clara Mendez',
              phone: '+1 (555) 304-8840',
              capacity: '38 / 45 seats occupied',
              status: 'On Standby',
              stops: 'Central Station, Oak Avenue, Highridge, School Campus',
            },
            {
              busNumber: 'Bus #12 (Westwood Suburban)',
              driver: 'Mr. Derek Vance',
              phone: '+1 (555) 304-9911',
              capacity: '40 / 45 seats occupied',
              status: 'En Route',
              stops: 'Westwood Mall, Pine Blvd, Sunset Ridge, School Campus',
            },
          ].map((bus, idx) => (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-900">{bus.busNumber}</span>
                <Badge variant={bus.status === 'En Route' ? 'success' : 'info'}>{bus.status}</Badge>
              </div>
              <div className="mt-3 space-y-2 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block font-medium">Licensed Driver</span>
                  <span className="font-semibold text-slate-800">{bus.driver} ({bus.phone})</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Seat Capacity</span>
                  <span className="font-semibold text-slate-800">{bus.capacity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Scheduled Waypoints</span>
                  <span className="text-slate-700">{bus.stops}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (module === 'health') {
    return (
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Health & Infirmary Records
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Student allergy registries, emergency contacts, clinic visit logs and vaccination certifications
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Campus Allergy & Medical Watch List</h3>
          <div className="space-y-2.5">
            {students
              .filter((s) => s.medicalNotes && s.medicalNotes !== 'None' && !s.medicalNotes.includes('No registered'))
              .map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-lg bg-rose-50/50 border border-rose-200/70 flex items-start justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      {s.firstName} {s.lastName} ({s.className} - {s.studentId})
                    </span>
                    <p className="text-xs text-rose-800 mt-0.5">{s.medicalNotes}</p>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Emergency: {s.emergencyContact || s.parentContact}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                    Blood: {s.bloodGroup || 'O+'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  if (module === 'reports') {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Institutional Reports & Academic Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Export verified compliance, attendance, grade distribution and financial balance sheets
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Term 2 Final Academic Transcripts',
              desc: 'Cumulative subject marks, GPA rankings and class distribution for all grades',
              format: 'PDF / Excel',
            },
            {
              title: 'Annual State Attendance Audit',
              desc: 'Official certified roll-call ledger, excused absence slips and tardy metrics',
              format: 'CSV Export',
            },
            {
              title: 'Bursar Tuition & Balance Audit',
              desc: 'Audited statements of collections, bank clearance reconciliations and receivables',
              format: 'PDF Report',
            },
          ].map((rep, idx) => (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900">{rep.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rep.desc}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">{rep.format}</span>
                <Button
                  variant="subtle"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => showToast(`Generating ${rep.title}`, 'success')}
                >
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Settings
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Institution & System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          General school identity, academic calendar periods, grading rules, and administrative controls
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-4 max-w-2xl text-xs">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          School Identity & Affiliation
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-slate-400 block font-medium">Institution Name</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{school.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Affiliation Code</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{school.code}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Active Academic Year</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{school.academicYear}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Current Session Term</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{school.currentTerm}</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400 block font-medium">Campus Address</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{school.address}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={() => showToast('Settings saved successfully.', 'success')}
          >
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};
