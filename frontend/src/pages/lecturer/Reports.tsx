import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  FileDown,
} from 'lucide-react';
import { api } from '../../services/api';

export const LecturerReportsPage: React.FC = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    unit_id: '',
    start_date: '',
    end_date: '',
  });

  const loadData = async () => {
    try {
      const uRes = await api.getUnits();
      setUnits(uRes || []);
      fetchReport();
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.getReportData(filters);
      setReportData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      setDownloading(format);
      await api.downloadReport(format, filters);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Class Attendance Exports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Download certified attendance lists and examination eligibility logs for your classes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={!!downloading}
            className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={!!downloading}
            className="inline-flex items-center px-3 py-2 border border-emerald-600 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 disabled:opacity-50 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Excel (.xlsx)
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!downloading}
            className="inline-flex items-center px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50 transition"
          >
            <FileDown className="w-3.5 h-3.5 mr-1.5" />
            Print PDF
          </button>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Unit / Subject
          </label>
          <select
            value={filters.unit_id}
            onChange={(e) => setFilters({ ...filters, unit_id: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
          >
            <option value="">All My Assigned Units</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unit_code} - {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-44">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
          />
        </div>

        <div className="w-44">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
          />
        </div>

        <button
          onClick={fetchReport}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
        >
          <Filter className="w-3.5 h-3.5 mr-1.5 inline" />
          Filter
        </button>
      </div>

      {/* Summary */}
      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400">Total Attendance Marks</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {reportData.total_records}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400">Total Present</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {reportData.present_count}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400">Average Turnout</span>
            <p className="text-xl font-bold text-brand-600 dark:text-brand-400 mt-1">
              {reportData.attendance_percentage}%
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Registration No.</th>
                <th className="px-6 py-3.5">Unit</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {!reportData?.records?.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No attendance records found for this criteria.
                  </td>
                </tr>
              ) : (
                reportData.records.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                      {r.student_name}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">
                      {r.student_reg_no}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {r.unit_code}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono text-slate-500">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-xs text-brand-600 dark:text-brand-400">
                      {r.confidence_score ? `${(r.confidence_score * 100).toFixed(1)}%` : 'Manual'}
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
