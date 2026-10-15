import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Lock, UserCheck } from 'lucide-react';

interface UnauthorizedPageProps {
  onNavigateHome: () => void;
  attemptedRoute?: string;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
  onNavigateHome,
  attemptedRoute = 'Restricted Section',
}) => {
  const { currentUser, currentRole, switchRole, availableRoles } = useAuth();

  return (
    <div
      id="unauthorized-page-container"
      className="min-h-[80vh] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          HTTP 403 Access Denied
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight mb-2">
          Restricted Academic Zone
        </h1>

        <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto mb-6">
          Your active institutional profile (<span className="font-semibold text-slate-800 capitalize">{currentUser.roleTitle || currentRole}</span>) does not possess permission to access the <span className="font-semibold text-slate-800">{attemptedRoute}</span> module. Access control is enforced at the data security layer.
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-8 max-w-md mx-auto text-left space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Authenticated Identity:</span>
            <span className="font-semibold text-slate-800">{currentUser.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Institutional Role:</span>
            <span className="font-mono text-slate-700">{currentRole}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Service Policy:</span>
            <span className="text-emerald-700 font-medium">RBAC Strict Containment</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="unauthorized-return-home-btn"
            type="button"
            onClick={onNavigateHome}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Authorized Workspace
          </button>
        </div>

        {/* Quick Role Switcher for Test Evaluation */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-left">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            Testing Another Role? Select Below:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {availableRoles.map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => {
                  switchRole(r.role);
                  onNavigateHome();
                }}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  currentRole === r.role
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {r.label.split('(')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
