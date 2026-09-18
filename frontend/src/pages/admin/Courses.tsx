import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Layers,
  GraduationCap,
  Building2,
  X,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    course_code: '',
    title: '',
    department: 'Computer Science and Engineering',
    credits: 4,
    duration_years: 4,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await api.getCourses();
      setCourses(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await api.createCourse(formData);
      setIsModalOpen(false);
      setFormData({
        course_code: '',
        title: '',
        department: 'Computer Science and Engineering',
        credits: 4,
        duration_years: 4,
      });
      loadCourses();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete course "${name}"? Existing enrollments and units may be affected.`)) {
      return;
    }
    try {
      await api.deleteCourse(id);
      loadCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete course');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Academic Degree Programs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define college degrees, major tracks, curriculum durations, and total credit units.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-brand-500/30 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && courses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No academic programs defined yet. Click "Add Course" to create one.
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-brand-300 dark:hover:border-brand-700 transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-lg">
                    {course.course_code}
                  </span>
                  <button
                    onClick={() => handleDelete(course.id, course.title || course.course_name)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    title="Delete course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-3">
                  {course.title || course.course_name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {course.department}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>{course.units_count ?? 0} Units</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span>{course.enrolled_students_count ?? 0} Students</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Duration: {course.duration_years} Years</span>
                <span>{course.credits} Credits</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Degree Program</h2>
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
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BCT or CS-2026"
                  value={formData.course_code}
                  onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={formData.duration_years}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_years: parseInt(e.target.value) || 4 })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.credits}
                    onChange={(e) =>
                      setFormData({ ...formData, credits: parseInt(e.target.value) || 4 })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                  />
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
                  {submitting ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
