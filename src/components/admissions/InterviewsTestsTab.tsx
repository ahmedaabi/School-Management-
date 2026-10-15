import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Award,
  Search,
  Plus,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import {
  AdmissionApplication,
  AdmissionInterview,
  AdmissionTest,
  InterviewRecommendation,
} from '../../types/admission';
import { admissionService } from '../../services/admissionService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

interface InterviewsTestsTabProps {
  onSelectApplication: (app: AdmissionApplication) => void;
  onRefresh: () => void;
}

export const InterviewsTestsTab: React.FC<InterviewsTestsTabProps> = ({
  onSelectApplication,
  onRefresh,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const applications = admissionService.getApplications();

  const [activeSubTab, setActiveSubTab] = useState<'interviews' | 'tests'>('interviews');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedAppIdForInterview, setSelectedAppIdForInterview] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('11:00 AM');
  const [interviewerName, setInterviewerName] = useState('Dr. Eleanor Vance (Principal)');
  const [interviewLocation, setInterviewLocation] = useState('Executive Suite Room 102');
  const [interviewNotes, setInterviewNotes] = useState('');

  const [showResultModal, setShowResultModal] = useState(false);
  const [evalAppId, setEvalAppId] = useState('');
  const [evalInterviewId, setEvalInterviewId] = useState('');
  const [evalScore, setEvalScore] = useState(85);
  const [evalRecommendation, setEvalRecommendation] = useState<InterviewRecommendation>('RECOMMENDED');
  const [evalComments, setEvalComments] = useState('');

  // Collect interviews
  const allInterviews = useMemo(() => {
    const list: { app: AdmissionApplication; interview: AdmissionInterview }[] = [];
    applications.forEach((a) => {
      a.interviews.forEach((i) => list.push({ app: a, interview: i }));
    });
    return list.sort((a, b) => new Date(b.interview.date).getTime() - new Date(a.interview.date).getTime());
  }, [applications]);

  // Collect tests
  const allTests = useMemo(() => {
    const list: { app: AdmissionApplication; test: AdmissionTest }[] = [];
    applications.forEach((a) => {
      a.tests.forEach((t) => list.push({ app: a, test: t }));
    });
    return list.sort((a, b) => new Date(b.test.testDate).getTime() - new Date(a.test.testDate).getTime());
  }, [applications]);

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppIdForInterview || !interviewDate) {
      showToast('Please select candidate and interview date.', 'warning');
      return;
    }
    admissionService.scheduleInterview(
      selectedAppIdForInterview,
      {
        date: interviewDate,
        time: interviewTime,
        interviewerName,
        location: interviewLocation,
        notes: interviewNotes,
      },
      currentUser || undefined
    );
    setShowScheduleModal(false);
    showToast('Interview session successfully scheduled.', 'success');
    onRefresh();
  };

  const handleResultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    admissionService.recordInterviewResult(
      evalAppId,
      evalInterviewId,
      {
        score: Number(evalScore),
        result: evalRecommendation,
        comments: evalComments.trim(),
      },
      currentUser || undefined
    );
    setShowResultModal(false);
    showToast('Interview evaluation recorded.', 'success');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Interviews & Entrance Assessments</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate candidate panels, track oral interview scores, and register standardized admission test marks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" onClick={() => setShowScheduleModal(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Schedule Interview
          </Button>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('interviews')}
          className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === 'interviews'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Scheduled Interviews ({allInterviews.length})
        </button>
        <button
          onClick={() => setActiveSubTab('tests')}
          className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === 'tests'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          Entrance Test Scores ({allTests.length})
        </button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidates..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 1. Interviews View */}
      {activeSubTab === 'interviews' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Applicant Name</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Interviewer & Venue</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score & Recommendation</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allInterviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No interviews recorded yet.
                    </td>
                  </tr>
                ) : (
                  allInterviews
                    .filter(
                      (item) =>
                        !searchTerm.trim() ||
                        item.app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(({ app, interview }) => (
                      <tr key={interview.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{app.applicantName}</span>
                          <span className="font-mono text-[11px] text-slate-400">{app.applicationNumber}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">{app.appliedClassName}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800 block">{interview.date}</span>
                          <span className="text-[11px] text-slate-400">{interview.time}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800 block">{interview.interviewerName}</span>
                          <span className="text-[11px] text-slate-400">{interview.location}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              interview.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {interview.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {interview.result ? (
                            <div>
                              <span className="font-bold text-indigo-600 block">
                                {interview.score}/100 ({interview.result.replace('_', ' ')})
                              </span>
                              {interview.comments && (
                                <span className="text-[11px] text-slate-500 italic block truncate max-w-xs">
                                  "{interview.comments}"
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Pending Assessment</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5">
                          <Button size="sm" variant="outline" onClick={() => onSelectApplication(app)}>
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Inspect
                          </Button>
                          {interview.status !== 'COMPLETED' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setEvalAppId(app.id);
                                setEvalInterviewId(interview.id);
                                setShowResultModal(true);
                              }}
                            >
                              Evaluate
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Entrance Tests View */}
      {activeSubTab === 'tests' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Applicant Name</th>
                  <th className="px-4 py-3">Target Class</th>
                  <th className="px-4 py-3">Subject Category</th>
                  <th className="px-4 py-3">Test Date</th>
                  <th className="px-4 py-3">Score & Percentage</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allTests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No entrance test results recorded yet.
                    </td>
                  </tr>
                ) : (
                  allTests
                    .filter(
                      (item) =>
                        !searchTerm.trim() ||
                        item.app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(({ app, test }) => (
                      <tr key={test.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{app.applicantName}</span>
                          <span className="font-mono text-[11px] text-slate-400">{app.applicationNumber}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">{app.appliedClassName}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{test.subjectCategory}</td>
                        <td className="px-4 py-3 text-slate-600">{test.testDate}</td>
                        <td className="px-4 py-3 font-bold text-indigo-600">
                          {test.obtainedMarks} / {test.totalMarks} ({test.percentage}%)
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              test.result === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {test.result}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => onSelectApplication(app)}>
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View Profile
                          </Button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Schedule Candidate Interview
            </h3>
            <form onSubmit={handleScheduleSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Candidate</label>
                <select
                  required
                  value={selectedAppIdForInterview}
                  onChange={(e) => setSelectedAppIdForInterview(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="">-- Choose Candidate --</option>
                  {applications
                    .filter((a) => a.status !== 'ENROLLED' && a.status !== 'REJECTED')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.applicantName} ({a.applicationNumber}) - {a.appliedClassName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Time Slot</label>
                  <input
                    type="text"
                    required
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Interviewer Name</label>
                <input
                  type="text"
                  required
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Location / Room</label>
                <input
                  type="text"
                  required
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Focus areas or panel instructions..."
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button size="sm" variant="secondary" type="button" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit">
                  Confirm Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Interview Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Record Interview Evaluation
            </h3>
            <form onSubmit={handleResultSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Evaluation Score (out of 100)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={evalScore}
                  onChange={(e) => setEvalScore(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Recommendation</label>
                <select
                  value={evalRecommendation}
                  onChange={(e) => setEvalRecommendation(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="RECOMMENDED">RECOMMENDED (Strong Fit)</option>
                  <option value="NEEDS_SECOND_INTERVIEW">NEEDS SECOND INTERVIEW</option>
                  <option value="NOT_RECOMMENDED">NOT RECOMMENDED</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Evaluator Notes & Feedback</label>
                <textarea
                  rows={3}
                  required
                  value={evalComments}
                  onChange={(e) => setEvalComments(e.target.value)}
                  placeholder="Candidate presentation, demeanor, communication..."
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button size="sm" variant="secondary" type="button" onClick={() => setShowResultModal(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit">
                  Save Evaluation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
