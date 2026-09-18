import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Building,
  Users,
  X,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';

export const VenuesPage: React.FC = () => {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    venue_code: '',
    name: '',
    building: 'Main Academic Complex',
    room_number: '',
    capacity: 60,
    venue_type: 'LECTURE_HALL',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadVenues = async () => {
    try {
      setLoading(true);
      const res = await api.getVenues();
      setVenues(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await api.createVenue(formData);
      setIsModalOpen(false);
      setFormData({
        venue_code: '',
        name: '',
        building: 'Main Academic Complex',
        room_number: '',
        capacity: 60,
        venue_type: 'LECTURE_HALL',
      });
      loadVenues();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create venue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete venue "${name}"?`)) return;
    try {
      await api.deleteVenue(id);
      loadVenues();
    } catch (err: any) {
      alert(err.message || 'Failed to delete venue');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Classrooms &amp; Physical Venues
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Lecture theaters, computer laboratories, and seminar halls provisioned for facial scanning.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-brand-500/30 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Venue
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && venues.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Loading venues...
          </div>
        ) : venues.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No physical venues configured yet.
          </div>
        ) : (
          venues.map((venue) => (
            <div
              key={venue.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-brand-300 dark:hover:border-brand-700 transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-lg">
                    {venue.venue_code}
                  </span>
                  <button
                    onClick={() => handleDelete(venue.id, venue.name)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    title="Delete Venue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-3">
                  {venue.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {venue.building} &bull; Room {venue.room_number}
                </p>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Capacity: {venue.capacity} seats</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold uppercase text-slate-500">
                    {venue.venue_type}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Venue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Venue</h2>
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
                  Venue Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LH-101 or LAB-B3"
                  value={formData.venue_code}
                  onChange={(e) => setFormData({ ...formData, venue_code: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Venue Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Turing Computer Science Lab"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Building
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Capacity (Seats)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) || 50 })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Venue Type
                  </label>
                  <select
                    value={formData.venue_type}
                    onChange={(e) => setFormData({ ...formData, venue_type: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                  >
                    <option value="LECTURE_HALL">Lecture Hall</option>
                    <option value="COMPUTER_LAB">Computer Lab</option>
                    <option value="SEMINAR_ROOM">Seminar Room</option>
                    <option value="AUDITORIUM">Auditorium</option>
                  </select>
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
                  {submitting ? 'Creating...' : 'Create Venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
