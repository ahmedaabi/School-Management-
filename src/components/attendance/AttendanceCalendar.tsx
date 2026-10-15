import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../../types';

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  studentName?: string;
  initialYear?: number;
  initialMonth?: number; // 0-indexed (0 = Jan, 8 = Sep)
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  records,
  studentName,
  initialYear = 2026,
  initialMonth = 8, // September 2026 default
}) => {
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [selectedDayRecord, setSelectedDayRecord] = useState<AttendanceRecord | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Days in month calculation
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const getDayDateString = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  // Find record for day
  const getRecordForDay = (day: number): AttendanceRecord | undefined => {
    const dateStr = getDayDateString(day);
    return records.find((r) => r.date === dateStr);
  };

  // Compute month totals
  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthRecords = records.filter((r) => r.date.startsWith(currentMonthStr));
  const presentCount = monthRecords.filter((r) => r.status === 'Present').length;
  const absentCount = monthRecords.filter((r) => r.status === 'Absent').length;
  const lateCount = monthRecords.filter((r) => r.status === 'Late').length;
  const excusedCount = monthRecords.filter((r) => r.status === 'Excused').length;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
      {/* Calendar Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            {studentName && (
              <span className="text-xs text-slate-400">Attendance log for {studentName}</span>
            )}
          </div>
        </div>

        {/* Quick legend pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Present ({presentCount})
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Absent ({absentCount})
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Late ({lateCount})
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            Excused ({excusedCount})
          </span>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Columns */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-1">
        {daysOfWeek.map((day, idx) => (
          <div key={day} className={idx === 0 || idx === 6 ? 'text-slate-300' : ''}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Empty slots for start of month */}
        {Array.from({ length: firstDayIndex }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="h-14 rounded-xl bg-slate-50/50 border border-transparent"
          />
        ))}

        {/* Days in Month */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayOfWeek = (firstDayIndex + index) % 7;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const record = getRecordForDay(day);

          let statusStyle = 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300';
          let indicator = null;

          if (isWeekend) {
            statusStyle = 'bg-slate-50/70 border-slate-100 text-slate-400';
          } else if (record) {
            if (record.status === 'Present') {
              statusStyle = 'bg-emerald-50/90 border-emerald-200 text-emerald-900 font-semibold shadow-2xs';
              indicator = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
            } else if (record.status === 'Absent') {
              statusStyle = 'bg-rose-50/90 border-rose-200 text-rose-900 font-semibold shadow-2xs';
              indicator = <XCircle className="w-3 h-3 text-rose-600" />;
            } else if (record.status === 'Late') {
              statusStyle = 'bg-amber-50/90 border-amber-200 text-amber-900 font-semibold shadow-2xs';
              indicator = <Clock className="w-3 h-3 text-amber-600" />;
            } else if (record.status === 'Excused') {
              statusStyle = 'bg-sky-50/90 border-sky-200 text-sky-900 font-semibold shadow-2xs';
              indicator = <HelpCircle className="w-3 h-3 text-sky-600" />;
            }
          }

          return (
            <button
              key={`day-${day}`}
              type="button"
              onClick={() => record && setSelectedDayRecord(record)}
              className={`h-14 p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all ${statusStyle} ${
                record ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-mono">{day}</span>
                {indicator}
              </div>
              <div className="text-[10px] truncate leading-tight">
                {isWeekend ? (
                  <span className="text-slate-300 font-normal">Weekend</span>
                ) : record ? (
                  <span className="font-semibold">{record.status}</span>
                ) : (
                  <span className="text-slate-300">No session</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Details Card */}
      {selectedDayRecord && (
        <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                Log Detail: {selectedDayRecord.date}
              </span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                  selectedDayRecord.status === 'Present'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedDayRecord.status === 'Absent'
                    ? 'bg-rose-100 text-rose-800'
                    : selectedDayRecord.status === 'Late'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-sky-100 text-sky-800'
                }`}
              >
                {selectedDayRecord.status}
              </span>
            </div>
            <div className="text-slate-500 mt-0.5">
              <span>{selectedDayRecord.className || 'Classroom'}</span> •{' '}
              <span>Session: {selectedDayRecord.period || 'Daily Homeroom'}</span> •{' '}
              <span>Logged by: {selectedDayRecord.recordedBy || 'Staff'}</span>
            </div>
            {selectedDayRecord.remarks && (
              <p className="text-slate-600 mt-1 italic">
                "{selectedDayRecord.remarks}"
              </p>
            )}
            {selectedDayRecord.editedBy && (
              <p className="text-amber-700 text-[10px] mt-1">
                Edited by {selectedDayRecord.editedBy} at {selectedDayRecord.editedAt}: "{selectedDayRecord.editReason}"
              </p>
            )}
          </div>
          <button
            onClick={() => setSelectedDayRecord(null)}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium self-end sm:self-auto cursor-pointer"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
