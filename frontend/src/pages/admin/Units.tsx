import React, { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  BookOpen,
  Search,
  Filter,
  X,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';

export const UnitsPage: React.FC = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    unit_code: '',
    name: '',
    course_id: '',
    credit_hours: 3,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [unitsRes, coursesRes] = await Promise.all([
        api.getUnits(selectedCourse || undefined),
        api.getCourses(),
      ]);
      setUnits(unitsRes || []);
      setCourses(coursesRes || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCourse]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await api.createUnit(formData);
      setIsModalOpen(false);
      setFormData({
        unit_code: '',
        name: '',
        course_id: '',
        credit_hours: 3,
        description: '',
      });
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create unit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete unit "${name}"?`)) return;
    try {
      await api.deleteUnit(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete unit');
    }
  };

  const filteredUnits = units.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.unit_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Teaching Units &amp; Subjects
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Modular curricular units mapped to degree programs for session-based attendance.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-brand-500/30 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Unit
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search unit by code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <option value="">All Programs</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_code} - {c.title || c.course_name}
              </option>
            ))}
          </select>
          <button
            onClick={loadData}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 bg-slate-50 dark:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Unit Code</th>
                <th className="px-6 py-3.5">Title</th>
                <th className="px-6 py-3.5">Parent Course</th>
                <th className="px-6 py-3.5">Credit Hours</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && units.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Loading units...
                  </td>
                </tr>
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No teaching units found.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-3.5 font-mono font-bold text-xs text-brand-600 dark:text-brand-400">
                      {unit.unit_code}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                      {unit.name}
                      {unit.description && (
                        <p className="text-xs text-slate-400 font-normal mt-0.5">{unit.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">
                      {unit.course_code ? (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {unit.course_code}
                        </span>
                      ) : (
                        courses.find((c) => c.id === unit.course_id)?.course_code || 'N/A'
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs">{unit.credit_hours} Hours</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(unit.id, unit.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete Unit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Unit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Teaching Unit</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-xs text-rose-600 rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Unit Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BCT 2411"
                  value={formData.unit_code}
                  onChange={(e) => setFormData({ ...formData, unit_code: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Unit Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Cloud Architectures"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Belongs to Course
                </label>
                <select
                  required
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_code} - {c.title || c.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Credit Hours
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.credit_hours}
                  onChange={(e) =>
                    setFormData({ ...formData, credit_hours: parseInt(e.target.value) || 3 })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
