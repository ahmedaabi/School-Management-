import { useState, FormEvent } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  FileText,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { dataService } from '../services/dataService';
import { useToast } from '../context/ToastContext';

export const AIAssistantPage = () => {
  const { showToast } = useToast();
  const metrics = dataService.getDashboardMetrics();
  const students = dataService.getStudents();
  const atRiskStudents = students.filter((s) => s.attendanceRate < 85);

  const [prompt, setPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeAssistantOutput, setActiveAssistantOutput] = useState<{
    id: string;
    title: string;
    content: string;
    type: string;
  } | null>({
    id: 'out-1',
    title: 'Daily Campus Operational Intelligence Briefing',
    type: 'Executive Digest',
    content: `SUMMARY FOR PRINCIPAL & ADMINISTRATION:
1. Attendance Performance:
   • Total Campus Attendance Rate: ${metrics.attendancePercentage}% (Target: 95.0%).
   • ${metrics.absentToday} students absent today; 2 students (Lucas Thornton 82% & Maximilian Cross 84%) are currently flagged on the low-attendance watch list.
   
2. Financial & Tuition Status:
   • Term 2 Collections stand at $${metrics.feesCollected.toLocaleString()} (88.2% of total target budget).
   • Outstanding balance: $${metrics.pendingFees.toLocaleString()}, with $${metrics.overdueFees.toLocaleString()} currently exceeding 30-day term limits.

3. Recommended Executive Actions:
   • Instruct guidance department to schedule parent check-in for Class 10A attendance flags.
   • Queue automated gentle SMS payment reminder for the 2 accounts with overdue tuition before Friday.`,
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied content to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generatePreset = (type: 'circular' | 'atrisk' | 'feereminder') => {
    setIsGenerating(true);
    setTimeout(() => {
      if (type === 'circular') {
        setActiveAssistantOutput({
          id: 'out-circular',
          title: 'Draft Official Circular: Term 2 Examination Schedule & Guidelines',
          type: 'Administrative Circular',
          content: `TO: Parents, Guardians, and Enrolled Students
FROM: Office of the Principal, St. Augustine Academy
DATE: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
SUBJECT: Commencement of Term 2 Summative Assessments

Dear St. Augustine School Community,

As we approach the culmination of the academic term, please be advised that Term 2 Final Examinations will commence on Monday, October 14, 2025.

1. Morning Examination Arrival:
   All students must report to their assigned examination hall by 08:15 AM promptly.
   
2. Required Examination Supplies:
   Standard writing instruments, approved scientific calculators (Grades 10–12), and institutional ID badges are mandatory.

3. Student Well-Being:
   Our faculty encourages balanced rest and nutrition during revision week. Tutoring study halls remain open every afternoon until 04:30 PM.

Sincerely,
Dr. Eleanor Vance, Head of School`,
        });
      } else if (type === 'atrisk') {
        setActiveAssistantOutput({
          id: 'out-atrisk',
          title: 'Student Academic & Attendance Intervention Analysis',
          type: 'Intervention Memo',
          content: `ACADEMIC INTERVENTION DOSSIER:

Identified At-Risk Profiles (${atRiskStudents.length} Students):
${atRiskStudents
  .map(
    (s) =>
      `• ${s.firstName} ${s.lastName} (${s.studentId}, ${s.className}): Attendance ${s.attendanceRate}%. Medical notes: "${s.medicalNotes}". Parent contact: ${s.parentContact}`
  )
  .join('\n')}

Action Plan:
1. Conduct parent-counselor meeting within 5 school days.
2. Confirm if medical accommodations or home-study packets are required.
3. Review homework submission logs to ensure academic standing remains stable.`,
        });
      } else {
        setActiveAssistantOutput({
          id: 'out-fee',
          title: 'Bursar Polite Tuition Reminder Template',
          type: 'Parent Communication',
          content: `Dear Parent/Guardian,

We hope this message finds your family well.

This is a courtesy reminder from the St. Augustine Academy Bursar's Office regarding the Term 2 tuition statement. According to our records, your student's account reflects an outstanding balance.

Kindly log in to the School Parent Portal to review the detailed invoice breakdown and make payment via card or bank wire transfer. 

If you have already submitted this payment or require flexible term arrangements, please contact bursar@staugustine.edu.

Thank you for your ongoing partnership in your student's education.

Warm regards,
Accounts & Bursar Department`,
        });
      }
      setIsGenerating(false);
      showToast('AI response generated.', 'success');
    }, 500);
  };

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      setActiveAssistantOutput({
        id: `out-${Date.now()}`,
        title: `Custom Analysis: "${prompt.slice(0, 40)}..."`,
        type: 'Custom Query Response',
        content: `AI SYNTHESIS BASED ON SCHOOL SYSTEM DATA:

Regarding your query: "${prompt}"

• Cross-referencing current database records across ${students.length} students, ${metrics.totalTeachers} teachers, and 6 active grade classes.
• Attendance averages indicate steady 94.2% engagement across middle school grades.
• Recommendation: Coordinate with department heads to standardise syllabus pacing for upcoming midterms.`,
      });
      setIsGenerating(false);
      setPrompt('');
      showToast('AI response ready.', 'success');
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              School AI Automation & Administrative Assistant
            </h1>
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold border border-purple-200">
              Admin Copilot
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AI-driven draft circulars, attendance diagnostics, and parent communication assistants
          </p>
        </div>
      </div>

      {/* Quick Prompts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => generatePreset('circular')}
          className="p-3.5 bg-white border border-slate-200/80 hover:border-indigo-500 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
        >
          <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 block">
            Draft Exam Schedule Circular
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Official parent memo with dates, instructions and study rules
          </span>
        </button>

        <button
          onClick={() => generatePreset('atrisk')}
          className="p-3.5 bg-white border border-slate-200/80 hover:border-indigo-500 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
        >
          <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 block">
            Analyze At-Risk Students
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Synthesize low attendance pupils and counseling next steps
          </span>
        </button>

        <button
          onClick={() => generatePreset('feereminder')}
          className="p-3.5 bg-white border border-slate-200/80 hover:border-indigo-500 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
        >
          <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 block">
            Compose Bursar Fee Reminder
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Polite tuition reminder template ready for broadcast
          </span>
        </button>
      </div>

      {/* AI Output Window */}
      {activeAssistantOutput && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{activeAssistantOutput.title}</h3>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">{activeAssistantOutput.type}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(activeAssistantOutput.id, activeAssistantOutput.content)}
              leftIcon={copiedId === activeAssistantOutput.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedId === activeAssistantOutput.id ? 'Copied' : 'Copy Text'}
            </Button>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl">
            <pre className="text-xs sm:text-sm text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
              {activeAssistantOutput.content}
            </pre>
          </div>
        </div>
      )}

      {/* Input query bar */}
      <form onSubmit={handleCustomSubmit} className="relative">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask AI Assistant (e.g., 'Summarize highest attendance classes this week', 'Draft homework policy reminder')..."
          className="w-full text-sm bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder:text-slate-400 rounded-xl px-4 py-3.5 pr-28 shadow-2xs outline-none"
        />
        <div className="absolute right-2 top-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isGenerating}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Generate
          </Button>
        </div>
      </form>
    </div>
  );
};
