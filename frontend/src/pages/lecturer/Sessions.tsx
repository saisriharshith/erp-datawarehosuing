import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Plus,
  Play,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export const LecturerSessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Selected session for record viewing
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await api.getSessions({ status: statusFilter || undefined });
      setSessions(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [statusFilter]);

  const handleStartSession = async (id: string) => {
    try {
      await api.startSession(id);
      navigate(`/lecturer/sessions/${id}/live`);
    } catch (err: any) {
      alert(err.message || 'Failed to start session');
    }
  };

  const handleViewRecords = async (session: any) => {
    setSelectedSession(session);
    try {
      setLoadingRecords(true);
      const recs = await api.getSessionRecords(session.id);
      setRecords(recs || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingRecords(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Class Attendance Sessions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create, launch, and monitor facial recognition scanning sessions.
          </p>
        </div>
        <Link
          to="/lecturer/sessions/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-brand-500/30 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Attendance Session
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {['', 'ACTIVE', 'COMPLETED', 'CREATED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === status
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {status === '' ? 'All Sessions' : status}
            </button>
          ))}
        </div>
        <button
          onClick={loadSessions}
          className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 bg-white dark:bg-slate-900"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && sessions.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Loading class sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No attendance sessions found. Click "New Attendance Session" to begin.
          </div>
        ) : (
          sessions.map((sess) => {
            const isActive = sess.status === 'ACTIVE';
            const isCompleted = sess.status === 'COMPLETED';

            return (
              <div
                key={sess.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 shadow-sm flex flex-col justify-between transition ${
                  isActive
                    ? 'border-emerald-500 shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                      {sess.course_code || 'COURSE'}
                    </span>
                    {isActive ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1.5" />
                        Scanning Live
                      </span>
                    ) : isCompleted ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Completed
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                        Ready
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                    {sess.unit_name || sess.unit_code}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Venue: {sess.venue_name || 'Classroom'}
                  </p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    Date: {new Date(sess.session_date || sess.created_at).toLocaleDateString()}
                  </p>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Students Attended</span>
                    <span className="font-bold text-base text-slate-900 dark:text-white">
                      {sess.present_count ?? 0}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {isActive ? (
                    <button
                      onClick={() => navigate(`/lecturer/sessions/${sess.id}/live`)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20"
                    >
                      <Camera className="w-4 h-4 mr-1.5" />
                      Resume Studio
                    </button>
                  ) : isCompleted ? (
                    <button
                      onClick={() => handleViewRecords(sess)}
                      className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      Audit Records ({sess.present_count ?? 0})
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartSession(sess.id)}
                      className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center shadow-md shadow-brand-500/20"
                    >
                      <Play className="w-4 h-4 mr-1.5" />
                      Start Scanning
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Inspection Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Verified Attendance Roster
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedSession.unit_name} &bull; {selectedSession.venue_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4">
              {loadingRecords ? (
                <div className="py-12 text-center text-slate-400">Loading student records...</div>
              ) : records.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No attendance registered.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                      <th className="px-4 py-2">Student Name</th>
                      <th className="px-4 py-2">Reg. Number</th>
                      <th className="px-4 py-2">Timestamp</th>
                      <th className="px-4 py-2 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {records.map((r, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {r.student_name}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {r.student_reg_no}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                          {new Date(r.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-brand-600 dark:text-brand-400">
                          {r.confidence_score
                            ? `${(r.confidence_score * 100).toFixed(1)}%`
                            : 'Manual'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-lg"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
