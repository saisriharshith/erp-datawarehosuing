import React, { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load telemetry dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Administrative Telemetry
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time biometric attendance metrics, course performance, and student retention alerts.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-3 text-rose-500" />
            <span>{error}</span>
          </div>
          <button onClick={fetchDashboardData} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={data?.total_students ?? 0}
          icon={GraduationCap}
          variant="primary"
          footerText={`${data?.enrolled_students ?? 0} Biometrically Enrolled`}
        />
        <StatCard
          title="Face Recognition Ready"
          value={`${
            data?.total_students
              ? Math.round((data.enrolled_students / data.total_students) * 100)
              : 0
          }%`}
          icon={Users}
          variant="success"
          change={{
            value: `${data?.enrolled_students ?? 0} / ${data?.total_students ?? 0}`,
            trend: 'up',
          }}
        />
        <StatCard
          title="Active Live Sessions"
          value={data?.active_sessions_now ?? 0}
          icon={Clock}
          variant={data?.active_sessions_now > 0 ? 'warning' : 'neutral'}
          footerText={`${data?.total_sessions ?? 0} historical lecture sessions`}
        />
        <StatCard
          title="Overall Attendance Rate"
          value={`${data?.overall_attendance_rate ?? 0}%`}
          icon={TrendingUp}
          variant={data?.overall_attendance_rate >= 75 ? 'success' : 'danger'}
          change={{
            value: data?.overall_attendance_rate >= 75 ? 'Healthy' : 'Needs attention',
            trend: data?.overall_attendance_rate >= 75 ? 'up' : 'down',
          }}
        />
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Attendance Trajectory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily present student counts across all courses
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
              <span>Present Records</span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.attendance_by_day || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c8de6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0c8de6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="present_count"
                  stroke="#0c8de6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#attendanceGradient)"
                  name="Present"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Performance Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Course Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Average attendance rate (%) by department
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.course_attendance || []}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="course_code" type="category" stroke="#94a3b8" fontSize={11} width={60} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="attendance_rate" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Retention Risk Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              At-Risk Students (&lt;75% Attendance)
            </h3>
          </div>
          <Link
            to="/admin/students?filter=at_risk"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center"
          >
            View All Roster <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Reg. Number</th>
                <th className="px-6 py-3">Course</th>
                <th className="px-6 py-3">Sessions Attended</th>
                <th className="px-6 py-3">Rate</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.at_risk_students?.length ? (
                data.at_risk_students.slice(0, 5).map((s: any) => (
                  <tr key={s.student_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                      {s.student_name}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs">{s.student_reg_no}</td>
                    <td className="px-6 py-3.5">{s.course_name}</td>
                    <td className="px-6 py-3.5">
                      {s.attended_sessions} / {s.total_sessions}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                        {s.attendance_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        to={`/admin/students/${s.student_id}`}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        Profile
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No students currently flagged under the 75% attendance threshold.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
