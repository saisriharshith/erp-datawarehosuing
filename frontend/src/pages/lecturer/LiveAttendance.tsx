import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Camera,
  StopCircle,
  Users,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  ArrowLeft,
  Search,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { CameraViewfinder } from '../../components/CameraViewfinder';
import { DetectedFace } from '../../types';

// Web Audio API chime synthesizer for recognition confirmation
function playSuccessChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880.0, audioCtx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    // AudioContext blocked or not supported
  }
}

export const LiveAttendanceStudio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecognizing, setIsRecognizing] = useState(true);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [sessionRecords, setSessionRecords] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stopping, setStopping] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  const [allStudents, setAllStudents] = useState<any[]>([]);

  // Guard to prevent concurrent backend requests
  const isRequestInFlight = useRef(false);

  const loadSessionData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [sessionData, recordsData, studentsData] = await Promise.all([
        api.getSession(id),
        api.getSessionRecords(id),
        api.getStudents({ page_size: 100 }),
      ]);
      setSession(sessionData);
      setSessionRecords(recordsData || []);
      setAllStudents(studentsData.items || []);
    } catch (err: any) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionData();
  }, [id]);

  // Handle incoming camera frame
  const handleFrameCapture = useCallback(
    async (base64Image: string) => {
      if (!id || isRequestInFlight.current || !isRecognizing) return;

      try {
        isRequestInFlight.current = true;
        const result = await api.recognizeFrame(id, base64Image);

        setDetectedFaces(result.faces || []);

        if (result.newly_marked_count > 0) {
          if (soundEnabled) {
            playSuccessChime();
          }
          // Refresh records list
          const updated = await api.getSessionRecords(id);
          setSessionRecords(updated || []);
        }
      } catch (err) {
        console.error('Recognition error:', err);
      } finally {
        isRequestInFlight.current = false;
      }
    },
    [id, isRecognizing, soundEnabled]
  );

  const handleStopSession = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to stop this live attendance session?')) {
      return;
    }

    try {
      setStopping(true);
      setIsRecognizing(false);
      await api.stopSession(id);
      navigate(`/lecturer/sessions`);
    } catch (err: any) {
      alert(err.message || 'Failed to stop session');
      setStopping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Session could not be located.</p>
        <Link to="/lecturer/sessions" className="mt-4 text-brand-600 hover:underline inline-block">
          &larr; Return to sessions
        </Link>
      </div>
    );
  }

  const filteredRoster = allStudents.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(manualSearch.toLowerCase()) ||
      s.registration_number?.toLowerCase().includes(manualSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Session Top Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/lecturer/sessions"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 animate-pulse">
                LIVE RECOGNITION
              </span>
              <span className="text-xs font-mono text-slate-400">{session.session_code}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {session.unit_name || session.unit_code} &bull; {session.venue_name}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
              soundEnabled
                ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                : 'text-slate-400 border-slate-200'
            }`}
            title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleStopSession}
            disabled={stopping}
            className="inline-flex items-center px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-rose-500/20 disabled:opacity-50 transition"
          >
            <StopCircle className="w-4 h-4 mr-2" />
            {stopping ? 'Closing Session...' : 'Stop & Finalize Session'}
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Camera Feed + Live Attendance Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Viewfinder (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video w-full">
            <CameraViewfinder
              onFrameCapture={handleFrameCapture}
              detectedFaces={detectedFaces}
              isStreaming={isRecognizing}
              captureIntervalMs={450}
              overlayText={`${sessionRecords.length} Present &bull; Live ArcFace Ingest`}
              className="w-full h-full"
            />
          </div>

          {/* Quick HUD Info */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Vector Similarity Engine: <strong>ArcFace 512-D</strong> (buffalo_sc)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-mono text-emerald-600 font-semibold">Continuous Inference</span>
            </div>
          </div>
        </div>

        {/* Live Roster & Verification Log (1 Column) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[600px]">
          {/* Roster Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Live Attendance Feed
              </h2>
              <p className="text-xs text-slate-400">Real-time biometric matches</p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm">
              {sessionRecords.length} Verified
            </div>
          </div>

          {/* Live Records List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/60">
            {sessionRecords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Users className="w-10 h-10 mb-2 stroke-1 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-medium">Awaiting Students</p>
                <p className="text-xs text-slate-400 mt-1">
                  Students facing the camera will be recognized instantly and logged here.
                </p>
              </div>
            ) : (
              sessionRecords.map((record, index) => (
                <div
                  key={index}
                  className="pt-2.5 first:pt-0 flex items-center justify-between text-xs animate-fadeIn"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[11px]">
                      {record.student_name?.[0] || 'S'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {record.student_name}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">
                        {record.student_registration_number || record.student_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-[11px] block">
                      {record.similarity_score
                        ? `${(record.similarity_score * 100).toFixed(1)}%`
                        : 'Verified'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(record.marked_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Manual Search & Fallback */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Lookup student by name or ID..."
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            {manualSearch && (
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                {filteredRoster.slice(0, 5).map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between text-[11px] p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
                  >
                    <span>
                      {st.first_name} {st.last_name} ({st.registration_number})
                    </span>
                    <span className="text-slate-400">Enrolled</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
