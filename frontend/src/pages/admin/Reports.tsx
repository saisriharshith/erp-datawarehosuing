import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Search,
  FileText,
  FileDown,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';

export const ReportsPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    course_id: '',
    unit_id: '',
    start_date: '',
    end_date: '',
  });

  const loadInitialData = async () => {
    try {
      const [coursesRes, unitsRes] = await Promise.all([api.getCourses(), api.getUnits()]);
      setCourses(coursesRes || []);
      setUnits(unitsRes || []);
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
    loadInitialData();
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Audit Reports &amp; Exports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Generate accreditation-compliant attendance ledgers in PDF, Excel, and CSV formats.
          </p>
        </div>

        {/* 1-Click Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={!!downloading}
            className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {downloading === 'csv' ? 'Generating...' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={!!downloading}
            className="inline-flex items-center px-3 py-2 border border-emerald-600 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 disabled:opacity-50 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            {downloading === 'excel' ? 'Generating...' : 'Excel (.xlsx)'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!downloading}
            className="inline-flex items-center px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50 transition"
          >
            <FileDown className="w-3.5 h-3.5 mr-1.5" />
            {downloading === 'pdf' ? 'Compiling PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Degree Program
            </label>
            <select
              value={filters.course_id}
              onChange={(e) => setFilters({ ...filters, course_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
            >
              <option value="">All Programs</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code} - {c.title || c.course_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Unit / Subject
            </label>
            <select
              value={filters.unit_id}
              onChange={(e) => setFilters({ ...filters, unit_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
            >
              <option value="">All Teaching Units</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_code} - {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
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

          <div>
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
        </div>

        <div className="flex justify-end mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Summary Stat Banner */}
      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400">Total Verification Records</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {reportData.total_records}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400">Present Logged</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {reportData.present_count}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400">Aggregate Compliance Rate</span>
            <p className="text-xl font-bold text-brand-600 dark:text-brand-400 mt-1">
              {reportData.attendance_percentage}%
            </p>
          </div>
        </div>
      )}

      {/* Records Preview Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Audit Ledger Preview
          </h3>
          <span className="text-xs text-slate-400">
            {reportData?.records?.length || 0} rows matching filter
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Registration No.</th>
                <th className="px-6 py-3.5">Course / Unit</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      <span>Compiling audit report...</span>
                    </div>
                  </td>
                </tr>
              ) : !reportData?.records?.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No records found matching the specified parameters.
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
                    <td className="px-6 py-3.5 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {r.unit_code}
                      </span>
                      <span className="text-slate-400 ml-1">({r.course_code})</span>
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
