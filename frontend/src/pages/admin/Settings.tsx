import React, { useEffect, useState } from 'react';
import {
  Settings,
  Sliders,
  ShieldCheck,
  Cpu,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { api } from '../../services/api';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [similarityThreshold, setSimilarityThreshold] = useState(0.45);
  const [livenessEnabled, setLivenessEnabled] = useState(true);
  const [minSamples, setMinSamples] = useState(3);
  const [maxSamples, setMaxSamples] = useState(5);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSettings();
      setSettings(res);
      setSimilarityThreshold(res.face_similarity_threshold ?? 0.45);
      setLivenessEnabled(res.liveness_enabled ?? true);
      setMinSamples(res.min_enrollment_samples ?? 3);
      setMaxSamples(res.max_enrollment_samples ?? 5);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSavedSuccess(false);
      const updated = await api.updateSettings({
        face_similarity_threshold: parseFloat(similarityThreshold.toString()),
        liveness_enabled: livenessEnabled,
        min_enrollment_samples: parseInt(minSamples.toString()),
        max_enrollment_samples: parseInt(maxSamples.toString()),
      });
      setSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System &amp; AI Recognition Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tune ArcFace similarity thresholds, anti-spoofing heuristics, and vector index rules.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center">
          <AlertCircle className="w-5 h-5 mr-3 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500" />
          <span>System parameters successfully synchronized across active cluster.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Face Recognition Threshold Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Cosine Similarity Threshold
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Determines the minimum vector dot-product similarity required to register attendance.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Minimum Match Threshold:
              </span>
              <span className="text-lg font-mono font-bold text-brand-600 dark:text-brand-400">
                {similarityThreshold.toFixed(2)}
              </span>
            </div>

            <input
              type="range"
              min="0.30"
              max="0.75"
              step="0.01"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />

            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0.30 (High False Accept)</span>
              <span className="text-brand-600 font-bold">0.45 (InsightFace Optimal)</span>
              <span>0.75 (High False Reject)</span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
              <span>
                ArcFace unit-normalized 512-D vectors have a genuine match distribution peaking at
                0.55-0.75. Setting threshold to <strong>0.45</strong> eliminates impostors while
                tolerating natural changes in lighting and facial expressions.
              </span>
            </div>
          </div>
        </div>

        {/* Anti-Spoofing & Liveness Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Anti-Spoofing &amp; Liveness Heuristics
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detect printed photo attacks, digital screen playback, and interactive head poses.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Enable Active Yaw &amp; Pitch Verification
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Demands 3D facial rotation angles and Laplacian texture depth during student enrollment.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={livenessEnabled}
                onChange={(e) => setLivenessEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Enrollment Rules */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Vector Index Parameters
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enrollment vector depth and neural architecture specifications.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Minimum Enrollment Samples
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={minSamples}
                onChange={(e) => setMinSamples(parseInt(e.target.value) || 3)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Maximum Enrollment Samples
              </label>
              <input
                type="number"
                min={3}
                max={10}
                value={maxSamples}
                onChange={(e) => setMaxSamples(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-slate-400">
              Active Neural Engine:{' '}
              <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold">
                {settings?.model_name || 'buffalo_sc (det_500m + w600k_mbf)'}
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Environment:{' '}
              <span className="font-mono text-brand-600 uppercase font-semibold">
                {settings?.environment || 'production'}
              </span>
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-brand-500/20 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Apply Configurations'}
          </button>
        </div>
      </form>
    </div>
  );
};
