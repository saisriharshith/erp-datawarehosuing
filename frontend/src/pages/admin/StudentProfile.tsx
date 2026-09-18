import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Trash2,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { api } from '../../services/api';
import { FaceEnrollmentModal } from '../enrollment/FaceEnrollmentModal';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<any | null>(null);
  const [enrollmentInfo, setEnrollmentInfo] = useState<any | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const loadProfile = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [studentData, enrollData, reportData] = await Promise.all([
        api.getStudent(id),
        api.getEnrollmentInfo(id).catch(() => null),
        api.getReportData({ student_id: id }).catch(() => ({ records: [] })),
      ]);
      setStudent(studentData);
      setEnrollmentInfo(enrollData);
      setAttendanceRecords(reportData?.records || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const handleDeleteEnrollment = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to purge biometric embeddings? The student will need to re-enroll before facial recognition can match them.')) {
      return;
    }
    try {
      await api.deleteEnrollment(id);
      loadProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to delete biometrics');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Student not found.</p>
        <Link to="/admin/students" className="mt-4 text-brand-600 hover:underline inline-block">
          &larr; Back to directory
        </Link>
      </div>
    );
  }

  const isEnrolled = student.enrollment_status === 'ENROLLED';

  return (
    <div className="space-y-8">
      {/* Header and Back Link */}
      <div>
        <Link
          to="/admin/students"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Students
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-brand-500/20">
              {student.first_name?.[0]}
              {student.last_name?.[0]}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {student.first_name} {student.last_name}
                </h1>
                {isEnrolled ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Biometrics Enrolled
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Clock className="w-3 h-3 mr-1" /> Pending Enrollment
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                ID: {student.registration_number}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <Camera className="w-4 h-4 mr-2" />
              {isEnrolled ? 'Re-capture Face' : 'Enroll Biometrics'}
            </button>
            {isEnrolled && (
              <button
                onClick={handleDeleteEnrollment}
                className="inline-flex items-center px-3 py-2 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Purge Vectors
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-4">
            Academic Information
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-slate-400">Program / Course</span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {student.course?.course_name || 'Enrolled Course'} ({student.course?.course_code || 'ID'})
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Academic Standing</span>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Year {student.academic_year}, Semester {student.semester}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-4">
            Contact Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300">
                {student.email || 'No email on file'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300">
                {student.phone_number || 'No phone number'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-4">
            AI Recognition Model
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Vectors in Index</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {student.embedding_count} / 5
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Embedding Dimension</span>
              <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                512-D L2 Normalized
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Engine</span>
              <span className="text-xs font-semibold text-brand-600">ArcFace (buffalo_sc)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Biometric Gallery */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
          Biometric Facial Gallery
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          High-resolution 112×112 cropped face crops ingested into ImageKit CDN and the vector recognition matrix.
        </p>

        {enrollmentInfo?.samples && enrollmentInfo.samples.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {enrollmentInfo.samples.map((sample: any, idx: number) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 aspect-square flex flex-col items-center justify-center p-2"
              >
                {sample.image_url ? (
                  <img
                    src={sample.image_url}
                    alt={`Sample ${sample.sample_index}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <ShieldCheck className="w-8 h-8 mx-auto text-brand-500 mb-1" />
                    <span className="text-[10px] text-slate-400">Vector #{sample.sample_index}</span>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white">
                  #{sample.sample_index}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <Camera className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No biometric embeddings captured yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Capture 5 facial angles with yaw/pitch verification to enable instant camera recognition.
            </p>
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="mt-4 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700"
            >
              Start Biometric Enrollment
            </button>
          </div>
        )}
      </div>

      {/* Attendance History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Classroom Attendance History ({attendanceRecords.length} Sessions)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Unit / Subject</th>
                <th className="px-6 py-3.5">Venue</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Confidence Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No attendance logs recorded for this student yet.
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                      {r.unit_name || r.unit_code}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">{r.venue_name}</td>
                    <td className="px-6 py-3.5 text-xs text-slate-500 font-mono">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-brand-600 dark:text-brand-400">
                      {r.confidence_score ? `${(r.confidence_score * 100).toFixed(1)}%` : 'Manual'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEnrollModalOpen && (
        <FaceEnrollmentModal
          student={student}
          onClose={() => setIsEnrollModalOpen(false)}
          onSuccess={() => {
            setIsEnrollModalOpen(false);
            loadProfile();
          }}
        />
      )}
    </div>
  );
};
