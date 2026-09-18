import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Users,
  AlertTriangle,
  Award,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';

const COLORS = ['#0c8de6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminAnalytics();
      setData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Institutional Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Predictive attendance trends, departmental compliance variance, and biometric throughput.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Overall Attendance Rate"
          value={`${data?.overall_attendance_rate ?? 0}%`}
          icon={TrendingUp}
          variant="primary"
          footerText="College-wide aggregate metric"
        />
        <StatCard
          title="Active Sessions"
          value={data?.active_sessions_now ?? 0}
          icon={BarChart3}
          variant={data?.active_sessions_now > 0 ? 'success' : 'neutral'}
          footerText={`${data?.total_sessions ?? 0} total sessions conducted`}
        />
        <StatCard
          title="Biometric Coverage"
          value={`${
            data?.total_students && data?.enrolled_students
              ? Math.round((data.enrolled_students / data.total_students) * 100)
              : 0
          }%`}
          icon={ShieldCheck}
          variant="success"
          footerText={`${data?.enrolled_students ?? 0} students ready`}
        />
        <StatCard
          title="Students At Risk"
          value={data?.at_risk_students?.length ?? 0}
          icon={AlertTriangle}
          variant={data?.at_risk_students?.length > 0 ? 'danger' : 'neutral'}
          footerText="Under 75% attendance threshold"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trajectory */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Daily Turnout Trajectory
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              30-day chronological count of present students verified via facial recognition
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.attendance_by_day || data?.attendance_trends || []}>
                <defs>
                  <linearGradient id="analyticsTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
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
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#analyticsTrend)"
                  name="Present Students"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Comparison */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Departmental Attendance Variance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mean percentage attendance by degree program
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.course_attendance || data?.course_stats || []}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="course_code" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(v: any) => [`${v}%`, 'Attendance Rate']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="attendance_rate" fill="#0c8de6" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Retention Risk Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Intervention Roster: Students Below Academic Minimum (75%)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identified candidates requiring academic counselor intervention
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            {data?.at_risk_students?.length ?? 0} Students Flagged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Reg. Number</th>
                <th className="px-6 py-3.5">Program</th>
                <th className="px-6 py-3.5">Attended / Total</th>
                <th className="px-6 py-3.5 text-right">Attendance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {!data?.at_risk_students?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No students currently below the 75% attendance threshold.
                  </td>
                </tr>
              ) : (
                data.at_risk_students.map((s: any) => (
                  <tr key={s.student_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                      {s.student_name}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs">{s.student_reg_no}</td>
                    <td className="px-6 py-3.5 text-xs">{s.course_name}</td>
                    <td className="px-6 py-3.5 text-xs font-mono">
                      {s.attended_sessions} / {s.total_sessions}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                        {s.attendance_rate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
