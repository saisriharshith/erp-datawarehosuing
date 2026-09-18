import React, { useEffect, useState } from 'react';
import {
  Camera,
  CalendarCheck,
  TrendingUp,
  Users,
  Play,
  ArrowRight,
  Plus,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { useAuth } from '../../contexts/AuthContext';

export const LecturerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, sessionsRes] = await Promise.all([
        api.getLecturerAnalytics().catch(() => null),
        api.getSessions(),
      ]);
      setData(analyticsRes);
      setSessions(sessionsRes || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeSession = sessions.find((s) => s.status === 'ACTIVE');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Automated facial recognition attendance studio for your assigned classes.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/lecturer/sessions/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-brand-500/20 transition"
          >
            <Camera className="w-4 h-4 mr-2" />
            Launch Attendance Session
          </Link>
        </div>
      </div>

      {/* Active Session Alert Banner (if any) */}
      {activeSession && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Camera className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  Session Live Now
                </span>
                <span className="text-xs font-mono text-white/80">{activeSession.unit_code}</span>
              </div>
              <h3 className="font-bold text-lg mt-0.5">
                {activeSession.unit_name || 'Classroom Session'}
              </h3>
              <p className="text-xs text-white/80">
                Venue: {activeSession.venue_name} &bull; {activeSession.present_count ?? 0} students marked
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/lecturer/sessions/${activeSession.id}/live`)}
            className="px-5 py-2.5 bg-white text-emerald-700 hover:bg-white/90 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition self-start sm:self-auto"
          >
            Open Live Camera &rarr;
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sessions Conducted"
          value={data?.total_sessions ?? sessions.length}
          icon={CalendarCheck}
          variant="primary"
        />
        <StatCard
          title="Attendance Marks Captured"
          value={data?.total_present_marked ?? 0}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Average Class Turnout"
          value={`${data?.average_turnout_rate ?? 0}%`}
          icon={TrendingUp}
          variant={data?.average_turnout_rate >= 75 ? 'success' : 'warning'}
        />
        <StatCard
          title="Active Live Sessions"
          value={activeSession ? 1 : 0}
          icon={Clock}
          variant={activeSession ? 'warning' : 'neutral'}
          footerText={activeSession ? 'Scanning in progress' : 'Ready to launch'}
        />
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Recent Attendance Sessions
          </h3>
          <Link
            to="/lecturer/sessions"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center"
          >
            All Sessions <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Unit / Subject</th>
                <th className="px-6 py-3.5">Venue</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Turnout</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.slice(0, 5).map((sess) => (
                <tr key={sess.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white">
                    {sess.unit_name || sess.unit_code}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-500">{sess.venue_name}</td>
                  <td className="px-6 py-3.5 text-xs font-mono text-slate-500">
                    {new Date(sess.session_date || sess.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3.5">
                    {sess.status === 'ACTIVE' ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 animate-pulse">
                        Active
                      </span>
                    ) : sess.status === 'COMPLETED' ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Completed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                        Created
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white">
                    {sess.present_count ?? 0}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    {sess.status === 'ACTIVE' ? (
                      <Link
                        to={`/lecturer/sessions/${sess.id}/live`}
                        className="inline-flex items-center px-3 py-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg hover:bg-emerald-100"
                      >
                        Resume Camera
                      </Link>
                    ) : (
                      <Link
                        to={`/lecturer/sessions`}
                        className="text-xs font-medium text-brand-600 hover:underline"
                      >
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
