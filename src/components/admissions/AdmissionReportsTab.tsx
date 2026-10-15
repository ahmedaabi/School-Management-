import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Filter,
  PieChart,
  Users,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { admissionService } from '../../services/admissionService';
import { Button } from '../ui/Button';

export const AdmissionReportsTab: React.FC = () => {
  const metrics = admissionService.getConversionMetrics();
  const sourceStats = admissionService.getSourceStatistics();
  const capacities = admissionService.getCapacities();
  const applications = admissionService.getApplications();

  const [reportType, setReportType] = useState<'funnel' | 'source' | 'capacity'>('funnel');

  const handleExportFullReport = () => {
    const headers = [
      'Application Number',
      'Applicant Name',
      'Applied Class',
      'Source',
      'Status',
      'Application Date',
      'Enrolled Student ID',
      'Admission Number',
    ];

    const rows = applications.map((a) => [
      a.applicationNumber,
      `"${a.applicantName}"`,
      `"${a.appliedClassName}"`,
      a.source,
      a.status,
      a.applicationDate,
      a.enrolledStudentId || 'N/A',
      a.enrolledAdmissionNumber || 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Admission_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admissions & Intake Analytics Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate recruitment channels, admission conversion funnels, and classroom intake capacity utilization.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleExportFullReport}>
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Export Comprehensive Report
        </Button>
      </div>

      {/* Report Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setReportType('funnel')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            reportType === 'funnel'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Conversion Funnel & Yield
        </button>
        <button
          onClick={() => setReportType('source')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            reportType === 'source'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Channel & Source Analytics
        </button>
        <button
          onClick={() => setReportType('capacity')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            reportType === 'capacity'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Class Intake Capacity
        </button>
      </div>

      {/* 1. Funnel Report */}
      {reportType === 'funnel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block">Total Applications Ingested</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.totalApplications}</span>
              <span className="text-[11px] text-slate-500 mt-1 block">100% of candidate base</span>
            </div>
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block">Candidate Approvals</span>
              <span className="text-2xl font-black text-teal-600 mt-1 block">{metrics.approvedCount + metrics.enrolledCount}</span>
              <span className="text-[11px] text-teal-700 font-semibold mt-1 block">
                {metrics.approvalRate}% Approval Ratio
              </span>
            </div>
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block">Enrolled Students</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{metrics.enrolledCount}</span>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                {metrics.enrollmentConversionRate}% Enrollment Yield
              </span>
            </div>
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block">Disqualified / Rejected</span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">{metrics.rejectedCount}</span>
              <span className="text-[11px] text-rose-700 font-semibold mt-1 block">
                {metrics.totalApplications > 0 ? Math.round((metrics.rejectedCount / metrics.totalApplications) * 100) : 0}% Attrition
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Step-by-Step Conversion Progression</h3>
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">1. Applications Received</span>
                  <span className="font-bold text-slate-900">{metrics.totalApplications} candidates (100%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full w-full" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">2. Reached Evaluation & Interview</span>
                  <span className="font-bold text-slate-900">
                    {metrics.interviewPendingCount + metrics.approvedCount + metrics.enrolledCount} candidates (
                    {metrics.totalApplications > 0
                      ? Math.round(
                          ((metrics.interviewPendingCount + metrics.approvedCount + metrics.enrolledCount) /
                            metrics.totalApplications) *
                            100
                        )
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full"
                    style={{
                      width: `${
                        metrics.totalApplications > 0
                          ? Math.round(
                              ((metrics.interviewPendingCount + metrics.approvedCount + metrics.enrolledCount) /
                                metrics.totalApplications) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">3. Approved by Admissions Committee</span>
                  <span className="font-bold text-slate-900">
                    {metrics.approvedCount + metrics.enrolledCount} candidates ({metrics.approvalRate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full"
                    style={{ width: `${metrics.approvalRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">4. Formally Enrolled Students</span>
                  <span className="font-bold text-slate-900">
                    {metrics.enrolledCount} students ({metrics.enrollmentConversionRate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${metrics.enrollmentConversionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Source Report */}
      {reportType === 'source' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Recruitment Channel</th>
                <th className="px-4 py-3">Total Applications</th>
                <th className="px-4 py-3">Share of Intake</th>
                <th className="px-4 py-3">Converted to Enrolled</th>
                <th className="px-4 py-3">Channel Conversion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sourceStats.map((item) => {
                const convRate = item.count > 0 ? Math.round((item.enrolled / item.count) * 100) : 0;
                return (
                  <tr key={item.source} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-800">{item.source}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${item.percentage}%` }} />
                        </div>
                        <span className="text-slate-600 font-medium">{item.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{item.enrolled}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-indigo-50 text-indigo-700">
                        {convRate}% yield
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Capacity Report */}
      {reportType === 'capacity' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Class & Section</th>
                <th className="px-4 py-3">Max Limit</th>
                <th className="px-4 py-3">Occupied Seats</th>
                <th className="px-4 py-3">Available Seats</th>
                <th className="px-4 py-3">Utilization Rate</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {capacities.map((cap) => {
                const pct = Math.min(100, Math.round((cap.occupied / cap.maxCapacity) * 100));
                return (
                  <tr key={`${cap.classId}-${cap.sectionId}`} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {cap.className} ({cap.sectionName})
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{cap.maxCapacity}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{cap.occupied}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{cap.availableSeats}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-700">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          cap.isFull ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {cap.isFull ? 'CAPACITY FULL' : 'SEATS OPEN'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
