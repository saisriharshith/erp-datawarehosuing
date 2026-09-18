import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Users,
  CalendarCheck,
  RefreshCw,
} from 'lucide-react';
import {
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

export const LecturerAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getLecturerAnalytics();
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
            Class Attendance Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Participation metrics and attendance distribution across your assigned units.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Sessions Conducted"
          value={data?.total_sessions_conducted ?? data?.total_sessions ?? 0}
          icon={CalendarCheck}
          variant="primary"
        />
        <StatCard
          title="Attendances Marked"
          value={data?.total_present_marked ?? 0}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Average Turnout"
          value={`${data?.average_turnout_rate ?? data?.average_attendance_percentage ?? 0}%`}
          icon={TrendingUp}
          variant="neutral"
        />
      </div>

      {/* Unit Breakdown Bar Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Attendances by Teaching Unit
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total verified attendees recorded per subject
          </p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data?.unit_attendance_stats || []}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="unit_code" stroke="#94a3b8" fontSize={11} />
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
              <Bar dataKey="total_marked" fill="#0c8de6" radius={[4, 4, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
