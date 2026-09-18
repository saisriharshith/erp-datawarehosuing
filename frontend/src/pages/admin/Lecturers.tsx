import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Mail,
  Phone,
  BookOpen,
  Layers,
  Search,
  X,
  RefreshCw,
  Building2,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';

export const LecturersPage: React.FC = () => {
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    staff_id: '',
    email: '',
    password: '',
    phone: '',
    department: 'Computer Science & Engineering',
    assigned_courses: [] as string[],
    assigned_units: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lecturersRes, coursesRes, unitsRes] = await Promise.all([
        api.getLecturers(),
        api.getCourses(),
        api.getUnits(),
      ]);
      setLecturers(lecturersRes || []);
      setCourses(coursesRes || []);
      setUnits(unitsRes || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await api.createLecturer(formData);
      setIsModalOpen(false);
      setFormData({
        full_name: '',
        staff_id: '',
        email: '',
        password: '',
        phone: '',
        department: 'Computer Science & Engineering',
        assigned_courses: [],
        assigned_units: [],
      });
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create lecturer');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCourse = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      assigned_courses: prev.assigned_courses.includes(id)
        ? prev.assigned_courses.filter((c) => c !== id)
        : [...prev.assigned_courses, id],
    }));
  };

  const toggleUnit = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      assigned_units: prev.assigned_units.includes(id)
        ? prev.assigned_units.filter((u) => u !== id)
        : [...prev.assigned_units, id],
    }));
  };

  const filteredLecturers = lecturers.filter((l) =>
    l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.staff_id?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Lecturer Faculty Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage instructor profiles, course authorizations, and teaching unit allocations.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-brand-500/30 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Lecturer
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty by name, staff ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
          />
        </div>
        <button
          onClick={loadData}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-slate-700 bg-slate-50 dark:bg-slate-800"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && lecturers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Loading faculty profiles...
          </div>
        ) : filteredLecturers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No instructors found matching criteria.
          </div>
        ) : (
          filteredLecturers.map((lec) => (
            <div
              key={lec.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-brand-300 dark:hover:border-brand-700 transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-brand-500/20">
                      {lec.full_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                        {lec.full_name}
                      </h3>
                      <span className="inline-block font-mono text-[11px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded">
                        {lec.staff_id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{lec.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lec.department}</span>
                  </div>
                </div>

                {/* Assigned Courses and Units */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                      Assigned Courses ({lec.assigned_course_names?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {lec.assigned_course_names?.length ? (
                        lec.assigned_course_names.map((c: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                          >
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400">No courses assigned</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                      Teaching Units ({lec.assigned_unit_names?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {lec.assigned_unit_names?.length ? (
                        lec.assigned_unit_names.map((u: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-[11px] rounded-md bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-medium truncate max-w-full"
                          >
                            {u}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400">No units assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Joined {new Date(lec.created_at).toLocaleDateString()}</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Lecturer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Register Faculty Member
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Prof. Alan Turing"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Staff ID Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="LEC-0042"
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                />
              </div>

              {/* Course selection pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  Assign Courses
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                  {courses.map((c) => {
                    const selected = formData.assigned_courses.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleCourse(c.id)}
                        className={`px-3 py-1 text-xs rounded-lg flex items-center space-x-1.5 transition ${
                          selected
                            ? 'bg-brand-600 text-white font-medium'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3 mr-1" />}
                        <span>{c.course_code} - {c.course_name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Unit selection pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  Assign Units / Subjects
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                  {units.map((u) => {
                    const selected = formData.assigned_units.includes(u.id);
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => toggleUnit(u.id)}
                        className={`px-3 py-1 text-xs rounded-lg flex items-center space-x-1.5 transition ${
                          selected
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3 mr-1" />}
                        <span>{u.unit_code} - {u.name}</span>
                      </button>
                    );
                  })}
                </div>
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
                  {submitting ? 'Creating...' : 'Register Lecturer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
