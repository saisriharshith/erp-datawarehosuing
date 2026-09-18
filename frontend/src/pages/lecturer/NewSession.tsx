import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Camera,
  BookOpen,
  Layers,
  MapPin,
  ArrowLeft,
  CalendarCheck,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';

export const NewSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrereqs = async () => {
      try {
        setLoading(true);
        const [cRes, uRes, vRes] = await Promise.all([
          api.getCourses(),
          api.getUnits(),
          api.getVenues(),
        ]);
        setCourses(cRes || []);
        setUnits(uRes || []);
        setVenues(vRes || []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPrereqs();
  }, []);

  // Filter units by chosen course
  const availableUnits = selectedCourse
    ? units.filter((u) => u.course_id === selectedCourse)
    : units;

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedUnit || !selectedVenue) {
      setError('Please select course, unit, and venue.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const session = await api.createSession({
        course_id: selectedCourse,
        unit_id: selectedUnit,
        venue_id: selectedVenue,
        notes: notes || undefined,
      });

      // Start the session immediately
      await api.startSession(session.id);
      navigate(`/lecturer/sessions/${session.id}/live`);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/lecturer/sessions"
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sessions
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <div className="flex items-center space-x-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Launch Live Attendance Session
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure classroom parameters and initialize real-time ArcFace video inference.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLaunch} className="space-y-6 mt-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Degree Program / Course
            </label>
            <div className="relative">
              <select
                required
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSelectedUnit('');
                }}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">-- Choose Program --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_code} - {c.title || c.course_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Teaching Unit / Subject
            </label>
            <select
              required
              disabled={!selectedCourse}
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
            >
              <option value="">
                {selectedCourse ? '-- Choose Unit --' : 'Select a course first'}
              </option>
              {availableUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_code} - {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Classroom / Physical Venue
            </label>
            <select
              required
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">-- Choose Venue --</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.venue_code} - {v.name} ({v.capacity} seats, {v.building})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Session Notes / Topic (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Midterm project demonstrations &amp; lab review"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3">
            <Link
              to="/lecturer/sessions"
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-brand-500/20 disabled:opacity-50 transition"
            >
              <Camera className="w-4 h-4 mr-2" />
              {submitting ? 'Initializing Camera...' : 'Launch Live Camera Studio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
