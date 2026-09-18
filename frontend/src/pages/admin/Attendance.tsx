import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';

export const AttendanceRecordsPage: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected session drawer / modal
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [sessionRecords, setSessionRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessRes, coursesRes] = await Promise.all([
        api.getSessions({
          course_id: selectedCourse || undefined,
          status: statusFilter || undefined,
        }),
        api.getCourses(),
      ]);
      setSessions(sessRes || []);
      setCourses(coursesRes || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCourse, statusFilter]);

  const viewSessionDetails = async (session: any) => {
    setSelectedSession(session);
    try {
      setLoadingRecords(true);
      const records = await api.getSessionRecords(session.id);
      setSessionRecords(records || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingRecords(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Attendance Sessions &amp; Records
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Audit live and completed facial recognition attendance sessions across the college.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-3 items-center">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <option value="">All Degree Programs</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.course_code} - {c.title || c.course_name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <option value="">All Session Statuses</option>
          <option value="ACTIVE">Currently Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CREATED">Created (Pending Start)</option>
        </select>

        <button
          onClick={loadData}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 bg-slate-50 dark:bg-slate-800 ml-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sessions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Unit / Subject</th>
                <th className="px-6 py-3.5">Venue &amp; Lecturer</th>
                <th className="px-6 py-3.5">Session Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Turnout</th>
                <th className="px-6 py-3.5 text-right">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Loading sessions...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {sess.unit_name || sess.unit_code || 'Unit Session'}
                      <p className="text-xs font-normal text-slate-400 font-mono">
                        {sess.course_code}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {sess.venue_name || 'Classroom'}
                      </p>
                      <p className="text-xs text-slate-400">{sess.lecturer_name || 'Faculty'}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {new Date(sess.session_date || sess.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {sess.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 animate-pulse">
                          Active Now
                        </span>
                      ) : sess.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                          Created
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {sess.present_count ?? 0}
                      </span>
                      <span className="text-xs text-slate-400"> / {sess.total_students ?? 0}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => viewSessionDetails(sess)}
                        className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Audit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Audit Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Session Attendance Audit
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedSession.unit_name || selectedSession.unit_code} &bull;{' '}
                  {selectedSession.venue_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4">
              {loadingRecords ? (
                <div className="py-12 text-center text-slate-400">Loading verified records...</div>
              ) : sessionRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  No attendance records logged for this session.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                      <th className="px-4 py-2">Student</th>
                      <th className="px-4 py-2">Reg. No.</th>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">Verification</th>
                      <th className="px-4 py-2 text-right">Cosine Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sessionRecords.map((r, i) => (
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
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            {r.method || 'FACIAL_RECOGNITION'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-brand-600 dark:text-brand-400">
                          {r.confidence_score ? `${(r.confidence_score * 100).toFixed(1)}%` : 'Manual'}
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
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
