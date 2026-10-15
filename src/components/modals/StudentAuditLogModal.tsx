import { useState, useMemo } from 'react';
import { History, Shield, Filter, Search, ArrowRight, User, Calendar } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { StudentAuditLog } from '../../types';
import { dataService } from '../../services/dataService';

export interface StudentAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string; // If supplied, filters to specific student; otherwise shows school-wide student logs
  studentName?: string;
}

export const StudentAuditLogModal = ({
  isOpen,
  onClose,
  studentId,
  studentName,
}: StudentAuditLogModalProps) => {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allLogs: StudentAuditLog[] = studentId
    ? dataService.getStudentAuditLogs(studentId)
    : dataService.getAllStudentAuditLogs();

  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      if (filterAction !== 'all' && log.action !== filterAction) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchStudent = log.studentName.toLowerCase().includes(q) || log.studentId.toLowerCase().includes(q);
        const matchActor = log.actorName.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        if (!matchStudent && !matchActor && !matchDetails) return false;
      }
      return true;
    });
  }, [allLogs, filterAction, searchQuery]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={studentId ? `Audit Trail: ${studentName || studentId}` : 'Student Management Audit Logs'}
      subtitle={studentId ? `Immutable compliance activity log for ${studentId}` : 'Complete chronological record of all student profile modifications'}
      maxWidth="3xl"
      id="student-audit-log-modal"
      footer={
        <div className="flex justify-between items-center w-full">
          <span className="text-xs text-slate-500 font-mono">
            {filteredLogs.length} audit event{filteredLogs.length !== 1 ? 's' : ''} recorded
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, actor, or detail..."
          />
          <Select
            value={filterAction}
            onChange={(val) => setFilterAction(val)}
            options={[
              { value: 'all', label: 'All Action Categories' },
              { value: 'Student Created', label: 'Student Created / Enrolled' },
              { value: 'Student Edited', label: 'Student Profile Edited' },
              { value: 'Student Archived', label: 'Student Archived' },
              { value: 'Student Restored', label: 'Student Restored' },
              { value: 'Class Changed', label: 'Class / Section Reassigned' },
              { value: 'Document Uploaded', label: 'Document Uploaded' },
              { value: 'Staff Note Added', label: 'Staff Note Added' },
              { value: 'Notification Dispatched', label: 'Notification Dispatched' },
            ]}
          />
        </div>

        {/* Audit Log Timeline */}
        <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
              No audit records found matching the current query.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        log.action.includes('Created') || log.action.includes('Restored')
                          ? 'success'
                          : log.action.includes('Archived') || log.action.includes('Deleted')
                          ? 'danger'
                          : log.action.includes('Class') || log.action.includes('Section')
                          ? 'purple'
                          : 'neutral'
                      }
                    >
                      {log.action}
                    </Badge>
                    {!studentId && (
                      <span className="text-xs font-bold text-slate-900">
                        {log.studentName}{' '}
                        <span className="font-mono text-slate-400 text-[11px]">({log.studentId})</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {log.timestamp}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 mt-2 font-medium">{log.details}</p>

                {/* Detailed field diff if present */}
                {log.changes && log.changes.length > 0 && (
                  <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200/70 space-y-1 text-[11px]">
                    {log.changes.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-slate-600">
                        <span className="font-semibold text-slate-700">{c.field}:</span>
                        <span className="line-through text-slate-400">{c.from}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-medium text-indigo-600">{c.to}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Actor:</span>
                    <span className="font-semibold text-slate-700">{log.actorName}</span>
                    <span className="text-slate-400">({log.actorRole})</span>
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">ID: {log.id}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
