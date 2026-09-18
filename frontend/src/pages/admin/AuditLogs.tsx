import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  User,
  Activity,
  Code,
  X,
} from 'lucide-react';
import { api } from '../../services/api';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs(100);
      setLogs(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.resource_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Security &amp; Audit Trail
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Immutable administrative event logging, biometric modifications, and access history.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="inline-flex items-center px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs by action, administrator email, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Action</th>
                <th className="px-6 py-3.5">Principal User</th>
                <th className="px-6 py-3.5">Target Resource</th>
                <th className="px-6 py-3.5 text-right">Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Loading security log stream...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No security events recorded.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-medium text-slate-900 dark:text-white">
                        {log.user_email || 'System Daemon'}
                      </p>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {log.user_role || 'INTERNAL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {log.resource_type}
                      </span>
                      {log.resource_id && (
                        <p className="font-mono text-[11px] text-slate-400">{log.resource_id}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <button
                          onClick={() => setSelectedDetails(log.details)}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-mono text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          <Code className="w-3.5 h-3.5 mr-1" />
                          Inspect Payload
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payload Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Audit Event Payload
              </h3>
              <button
                onClick={() => setSelectedDetails(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <pre className="mt-4 p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-80">
              {JSON.stringify(selectedDetails, null, 2)}
            </pre>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedDetails(null)}
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
